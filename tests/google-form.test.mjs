import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { gunzipSync } from 'node:zlib';
import { buildGoogleFormSource, createGoogleFormSpec } from '../organizer/build-google-form.mjs';

const spec = createGoogleFormSpec();
const source = await buildGoogleFormSource();

function harness({ ready = true, published = false, responses = [], mismatch = false } = {}) {
  const props = new Map(ready ? [
    ['QUEBEC_FORM_SETUP', 'READY'], ['QUEBEC_FORM_ID', 'original-form'],
    ['QUEBEC_SHEET_ID', 'original-sheet'], ['QUEBEC_EMAIL_ITEM_ID', '1'],
  ] : []);
  const logs = [], emails = [], triggers = [], sheetRows = [];
  let lockHeld = false, nextId = 0, created = 0;
  const items = [];
  const sheet = {
    getId: () => 'original-sheet',
    getUrl: () => 'https://docs.google.com/spreadsheets/d/original-sheet/edit',
    getSheets: () => [notes],
    getSheetByName: (name) => name === 'Organizer notes' ? notes : undefined,
  };
  const notes = { setName: () => notes, getLastRow: () => sheetRows.length,
    getRange: () => ({ setValues: (values) => sheetRows.push(...values) }) };
  const form = {
    getId: () => 'original-form',
    getDestinationId: () => mismatch ? 'incorrect-sheet' : 'original-sheet',
    getResponses: () => responses,
    getItems: () => [...items],
    isPublished: () => published,
    getEditUrl: () => 'https://docs.google.com/forms/d/original-form/edit',
    getPublishedUrl: () => 'https://docs.google.com/forms/d/e/original-form/viewform',
    setAcceptingResponses: (value) => { form.accepting = value; },
    setDestination: () => {},
    deleteItem: (item) => { assert.ok(lockHeld); items.splice(items.indexOf(item), 1); },
    createResponse() {
      let answer;
      return {
        withItemResponse(itemResponse) { answer = itemResponse; return this; },
        toPrefilledUrl() { return form.getPublishedUrl() + '?usp=pp_url&entry.' + (answer.id + 1000) + '=' + encodeURIComponent(answer.value); },
        submit() { throw new Error('Prefill must never submit a response'); },
      };
    },
  };
  for (const name of ['Title', 'Description', 'CollectEmail', 'PublishingSummary', 'AllowResponseEdits',
    'LimitOneResponsePerUser', 'ShowLinkToRespondAgain', 'ConfirmationMessage', 'ProgressBar']) {
    form['set' + name] = (value) => { form[name] = value; return form; };
  }
  for (const [method, type] of [['Text', 'text'], ['MultipleChoice', 'radio'], ['Checkbox', 'checkbox'],
    ['PageBreak', 'page'], ['SectionHeader', 'note']]) {
    form['add' + method + 'Item'] = () => {
      const id = ++nextId;
      const item = { id, type, getId: () => id, getTitle: () => item.Title,
        getType: () => type, asPageBreakItem: () => item, asTextItem: () => item,
        createChoice: (value, target) => ({ value, target }),
        createResponse: (value) => ({ id, value }),
      };
      for (const field of ['Title', 'HelpText', 'Required', 'ChoiceValues', 'Choices', 'Validation', 'GoToPage']) {
        item['set' + field] = (value) => { item[field] = value; return item; };
      }
      items.push(item);
      return item;
    };
  }
  if (ready) form.addTextItem().setTitle('Original email');
  const services = {
    FormApp: {
      PageNavigationType: { SUBMIT: 'SUBMIT' }, DestinationType: { SPREADSHEET: 'SPREADSHEET' },
      ItemType: { PAGE_BREAK: 'page', TEXT: 'text' },
      create(_, visible) { assert.equal(visible, false); created++; return form; },
      openById: () => form,
      createTextValidation: () => ({
        requireTextIsEmail: () => ({ build: () => 'email' }),
        requireTextMatchesPattern: (pattern) => ({ build: () => pattern }),
        requireNumberGreaterThan: () => ({ build: () => 'positive' }),
      }),
    },
    SpreadsheetApp: { create() { created++; return sheet; }, openById: () => sheet },
    LockService: { getScriptLock: () => ({
      tryLock: () => { assert.equal(lockHeld, false); lockHeld = true; return true; },
      releaseLock: () => { lockHeld = false; },
    }) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (key) => props.get(key) ?? null,
      setProperty: (key, value) => props.set(key, value),
      setProperties: (values) => Object.entries(values).forEach(([key, value]) => props.set(key, value)),
      deleteProperty: (key) => props.delete(key),
    }) },
    ScriptApp: { newTrigger: (handler) => ({
      forForm() { return this; }, onFormSubmit() { return this; }, timeBased() { return this; },
      at(when) { assert.equal(when.toISOString(), new Date(spec.closesAt).toISOString()); return this; },
      create() { triggers.push(handler); },
    }) },
    MailApp: { sendEmail: (message) => emails.push(message) },
    Utilities: { base64Decode: (text) => Buffer.from(text, 'base64'), newBlob: (bytes) => bytes,
      ungzip: (bytes) => ({ getDataAsString: () => gunzipSync(bytes).toString('utf8') }) },
    console: { log: (entry) => logs.push(entry) },
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : ['2026-11-23T10:00:00Z'])); }
    },
  };
  const runtime = vm.createContext(services);
  vm.runInContext(source, runtime);
  return { runtime, form, props, items, emails, triggers, logs, sheetRows, countCreated: () => created };
}

function simulatePath(items, language, planCode, liftCode, prefill) {
  let questionCount = 0;
  const selectedByEntry = {
    [prefill.language.entry]: prefill.language.values[language],
    [prefill[language].plan.entry]: prefill[language].plan.values[planCode],
    [prefill[language].lift.entry]: prefill[language].lift.values[liftCode],
  };
  const seen = [];
  let index = 0;
  while (index < items.length) {
    const page = [];
    let boundary;
    for (; index < items.length; index++) {
      const item = items[index];
      if (item.type === 'page') { boundary = item; break; }
      page.push(item);
      if (item.Required !== undefined) questionCount++;
    }
    seen.push(...page);
    const choiceTarget = page.flatMap((item) =>
      (item.Choices ?? []).filter(({ value }) => value === selectedByEntry['entry.' + (item.id + 1000)]))
      .at(-1)?.target;
    const next = choiceTarget ?? boundary?.GoToPage ?? boundary;
    if (!next || next === 'SUBMIT') return { seen, questionCount };
    index = items.indexOf(next) + 1;
    if (seen.length > items.length) throw new Error('The section graph contains a cycle');
  }
  throw new Error('The section graph did not submit');
}

test('updates the existing unpublished draft once, without replacing the Sheet, triggers, or responses', () => {
  const { runtime, form, props, items, emails, triggers, logs, sheetRows, countCreated } = harness();
  const first = runtime.updateQuebecGoogleForm();
  const itemIds = items.map(({ id }) => id);
  const second = runtime.updateQuebecGoogleForm();
  assert.equal(first.formId, 'original-form');
  assert.equal(second.formId, first.formId);
  assert.equal(first.sheetId, 'original-sheet');
  assert.equal(first.isPublished, false);
  assert.equal(props.get('QUEBEC_FORM_SETUP'), 'READY');
  assert.equal(countCreated(), 0);
  assert.equal(items.some((item) => item.Title === 'Original email'), false);
  assert.deepEqual(items.map(({ id }) => id), itemIds);
  assert.equal(triggers.length, 0);
  assert.equal(emails.length, 0);
  assert.equal(form.isPublished(), false);
  assert.equal(form.CollectEmail, false);
  assert.equal(form.PublishingSummary, false);
  assert.equal(sheetRows.length, spec.metadata.length);
  for (const marker of ['PREFILL_META', 'PREFILL_EN', 'PREFILL_ZH']) assert.ok(logs.some((line) => line.startsWith(marker + ' ')));
});

test('refuses a published, non-empty, or wrongly linked form before modifying items', () => {
  for (const input of [{ published: true }, { responses: [{}] }, { mismatch: true }]) {
    const { runtime, items, countCreated, triggers, sheetRows } = harness(input);
    assert.throws(() => runtime.updateQuebecGoogleForm(), /unpublished|responses|sheet/i);
    assert.deepEqual(items.map((item) => item.Title), ['Original email']);
    assert.equal(countCreated(), 0);
    assert.equal(triggers.length, 0);
    assert.equal(sheetRows.length, 0);
  }
});

test('updates both sets of notices on the published form without changing response items or routing', () => {
  const responses = [{ id: 'existing-response' }];
  const { runtime, form, items, emails, triggers, sheetRows } = harness({ published: true, responses });
  runtime.appendQuebecSections_(form, spec);
  const signingPages = items.filter((item) => item.type === 'page' && /electronic signature|电子签署/.test(item.Title));
  assert.equal(signingPages.length, 2);
  for (const item of signingPages) item.setHelpText('Prior guidance');
  const originalItems = items.map(({ id, Title, Required, GoToPage, Choices }) => [id, Title, Required, GoToPage, Choices]);

  runtime.refreshQuebecRegistrationNotices();
  runtime.refreshQuebecRegistrationNotices();

  assert.match(signingPages[0].HelpText, /Sign in this form[\s\S]+After submitting your registration[\s\S]+uoft.travelclub@gmail.com/);
  assert.match(signingPages[1].HelpText, /在本表内完成电子签署[\s\S]+提交报名后转住宿定金/);
  assert.match(form.ConfirmationMessage, /electronic signature received[\s\S]+Interac e-Transfer/);
  assert.deepEqual(items.map(({ id, Title, Required, GoToPage, Choices }) => [id, Title, Required, GoToPage, Choices]), originalItems);
  assert.equal(form.getResponses(), responses);
  assert.equal(form.isPublished(), true);
  assert.deepEqual([emails.length, triggers.length, sheetRows.length], [0, 0, 0]);
});

test('English and Chinese each follow the correct routes for A, B and both plans', () => {
  const { runtime, items } = harness();
  const { prefill } = runtime.updateQuebecGoogleForm();
  for (const language of ['en', 'zh']) {
    const other = language === 'en' ? 'zh' : 'en';
    const { cityA, cityBoth, chalet, car, driver, lift, equipment } = prefill[language];
    const lookup = (entry) => items.find((item) => item.id + 1000 === Number(entry.slice(6)));
    const seen = (plan, liftChoice) => simulatePath(items, language, plan, liftChoice, prefill).seen;
    for (const plan of ['a', 'b', 'both']) {
      const path = seen(plan, 'none');
      assert.ok(path.includes(lookup(prefill[language].flight.entry)));
      assert.ok(!path.includes(lookup(prefill[other].flight.entry)));
      assert.equal(path.includes(lookup(cityA.entry)), plan === 'a');
      assert.equal(path.includes(lookup(cityBoth.entry)), plan === 'both');
      for (const field of [chalet, car, driver, lift]) assert.equal(path.includes(lookup(field.entry)), plan !== 'a');
      assert.ok(!path.includes(lookup(equipment.entry)));
      assert.ok(path.some((item) => item.Validation === 'positive' && item.Required === false));
      const sign = path.filter((item) => item.type === 'checkbox');
      assert.equal(sign.length, 1);
      assert.equal(sign[0].Required, true);
    }
    assert.ok(seen('b', 'assist').includes(lookup(equipment.entry)));
    assert.ok(seen('both', 'ikon').includes(lookup(equipment.entry)));
    assert.equal(Object.keys(cityA.values).join(','), 'own,shared,self');
    assert.equal(Object.keys(chalet.values).join(','), 'own,shared,self');
    assert.match(cityA.values.own, /120.*360/);
    assert.match(cityA.values.shared, /60.*180/);
    assert.match(chalet.values.own, /250.*1,000/);
    assert.match(chalet.values.shared, /125.*500/);
  }
});

test('receipts follow the selected language and report answers without confirming payment', () => {
  const { runtime, form, props, items, emails } = harness();
  runtime.updateQuebecGoogleForm();
  const answer = (id, value) => ({
    getItem: () => items.find((item) => String(item.id) === id), getResponse: () => value,
  });
  runtime.sendQuebecAnswerCopy();
  assert.equal(emails.length, 0);
  for (const language of ['en', 'zh']) {
    const emailId = props.get('QUEBEC_EMAIL_ITEM_ID_' + language.toUpperCase());
    const otherLanguage = language === 'en' ? 'ZH' : 'EN';
    const otherEmail = props.get('QUEBEC_EMAIL_ITEM_ID_' + otherLanguage);
    const response = {
      getItemResponses: () => [answer(otherEmail, ''), answer(emailId, 'tester@example.invalid')],
      getTimestamp: () => new Date('2026-11-24T17:00:00Z'),
    };
    runtime.sendQuebecAnswerCopy({ source: { getId: () => 'another-form' }, response });
    runtime.sendQuebecAnswerCopy({ source: form, response });
  }
  assert.equal(emails.length, 2);
  for (const email of emails) {
    assert.equal(email.to, 'tester@example.invalid');
    assert.match(email.body, /2026-11-24T17:00:00/);
    assert.doesNotMatch(email.body, /original-form|original-sheet/);
    assert.match(email.body, /general-club-participation-waiver\.pdf/);
    assert.match(email.body, /Interac e-Transfer[^\n]*uoft\.travelclub@gmail\.com/);
    assert.match(email.body, /C\$360.*C\$180.*C\$1,000.*C\$500/);
  }
  assert.match(emails[0].body, /72 hours/);
  assert.match(emails[0].body, /payment.*verified/i);
  assert.doesNotMatch(emails[0].body, /接收答复副本的邮箱/);
  assert.doesNotMatch(emails[1].body, /Email for your answer copy/);
  assert.match(emails[1].body, /72 小时/);
  assert.match(emails[1].body, /付款.*核实/);
  assert.match(emails[0].body, /Electronic signature[\s\S]+after submitting[\s\S]+Your answers/);
  assert.match(emails[1].body, /电子签署[\s\S]+提交报名后转住宿定金[\s\S]+你的答复/);
});

test('a fresh setup remains unpublished and installs only the receipt and cutoff triggers', () => {
  const { runtime, triggers, emails, countCreated } = harness({ ready: false });
  assert.equal(runtime.createQuebecGoogleForm().isPublished, false);
  assert.equal(runtime.createQuebecGoogleForm().isPublished, false);
  assert.deepEqual(triggers, ['sendQuebecAnswerCopy', 'closeQuebecGoogleForm']);
  assert.equal(countCreated(), 2);
  assert.equal(emails.length, 0);
});
