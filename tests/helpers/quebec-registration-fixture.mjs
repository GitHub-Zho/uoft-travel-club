import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

export const ledgerEnvironment = Object.freeze({
  QUEBEC_REGISTRATION_ENABLED: 'true',
  QUEBEC_LEDGER_URL: 'https://script.google.com/macros/s/local-test-fixture/exec',
  QUEBEC_LEDGER_SECRET: 'local-example-key-not-used-outside-tests',
});

export async function createFakeLedger() {
  const rows = [];
  let locked = false;
  let tabExists = false;
  let flushes = 0;
  let columnCount = 26;

  const sheet = {
    getLastRow: () => rows.length,
    getMaxColumns: () => columnCount,
    insertColumnsAfter: (_, count) => { columnCount += count; },
    setFrozenRows: () => {},
    getRange: (row, column, height, width) => {
      assert.ok(locked);
      assert.ok(column + width - 1 <= columnCount);
      return {
        setValues: (values) => { rows[row - 1] = [...values[0]]; },
        getValues: () => rows.slice(row - 1, row - 1 + height)
          .map((item) => item.slice(column - 1, column - 1 + width)),
        createTextFinder(value) {
          const index = rows.findIndex((item, index) => index >= row - 1 && item[column - 1] === value);
          return { matchEntireCell: () => ({ findNext: () => index === -1 ? null : { getRow: () => index + 1 } }) };
        },
      };
    },
    appendRow(row) {
      assert.ok(locked);
      assert.equal(row.length, rows[0].length);
      rows.push([...row]);
    },
  };
  const context = {
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          assert.equal(locked, false);
          locked = true;
          return true;
        },
        releaseLock: () => { locked = false; },
      }),
    },
    Utilities: {
      Charset: { UTF_8: 'UTF-8' },
      computeHmacSha256Signature: (data, secret) => createHmac('sha256', secret).update(data).digest(),
      base64EncodeWebSafe: (bytes) => bytes.toString('base64url'),
    },
    SpreadsheetApp: {
      openById: () => ({
        getSheetByName: () => tabExists ? sheet : null,
        insertSheet: () => {
          tabExists = true;
          return sheet;
        },
      }),
      flush: () => {
        assert.ok(locked);
        flushes++;
      },
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (name) => ({
          SPREADSHEET_ID: 'private-test-sheet',
          REGISTRATION_SECRET: ledgerEnvironment.QUEBEC_LEDGER_SECRET,
        }[name]),
      }),
    },
    ContentService: {
      createTextOutput: (body) => ({ setMimeType: () => body }),
      MimeType: { JSON: 'application/json' },
    },
  };
  const scriptUrl = new URL('../../organizer/quebec-interest-ledger.gs', import.meta.url);
  vm.runInNewContext(await readFile(scriptUrl, 'utf8'), context, { filename: scriptUrl.pathname });
  const pending = new Map();
  let next = 0;
  return {
    get entries() {
      return rows.slice(1).map((row) => Object.fromEntries(rows[0].map((name, index) => [name, row[index]])));
    },
    get flushes() { return flushes; },
    async fetchImpl(url, options) {
      if (options.method === 'GET') {
        assert.equal(options.body, undefined);
        const response = pending.get(url);
        pending.delete(url);
        return new Response(response);
      }
      assert.equal(url, ledgerEnvironment.QUEBEC_LEDGER_URL);
      const response = context.doPost({ postData: { contents: options.body } });
      const redirect = 'https://script.googleusercontent.com/macros/echo?test=' + ++next;
      pending.set(redirect, response);
      return new Response(null, { status: 302, headers: { Location: redirect } });
    },
  };
}

export async function postInterest(handler, body, headers = {}) {
  const request = { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body };
  let json;
  const response = { setHeader() {}, end: (value) => { json = JSON.parse(value); } };
  await handler(request, response);
  return { status: response.statusCode, json };
}
