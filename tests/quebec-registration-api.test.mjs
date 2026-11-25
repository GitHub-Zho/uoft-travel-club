import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import route from '../api/quebec-register.js';
import { createFakeLedger, ledgerEnvironment, postInterest } from './helpers/quebec-registration-fixture.mjs';

const interest = {
  name: 'Test Traveller',
  email: 'TEST@example.invalid',
  phone: '+1 416 555 0101',
  social: '微信: 测试联系人',
  membership: 'yes',
  city: 'shared',
  chalet: 'own',
  companions: '=IMPORTDATA("https://example.invalid")',
  flight: 'assist',
  car: 'share',
  driver: 'prefer-not',
  lift: 'assist',
  equipment: 'rent',
  activities: ['ice', 'dog', 'luge', 'dog'],
  consent: true,
};

test('a submitted interest creates a private record, with server pricing and no payment or booking', async () => {
  const ledger = await createFakeLedger();
  const handler = route.createHandler({ env: ledgerEnvironment, fetchImpl: ledger.fetchImpl });
  const response = await postInterest(handler, JSON.stringify({
    ...interest,
    requestId: randomUUID(),
    memberDiscount: 900,
    requiredTotal: 1,
    amountDueNow: 100,
    paymentVerified: true,
    allocationId: 'fake-bed',
  }));

  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(response.json), ['id']);
  assert.match(response.json.id, /^QNE-[0-9a-f-]{36}$/);
  const row = ledger.entries[0];
  assert.equal(row['Registration ID'], response.json.id);
  assert.equal(row.Email, 'test@example.invalid');
  assert.equal(row.Phone, "'+1 416 555 0101");
  assert.ok(row.Companions.startsWith("'="));
  assert.match(row['Optional activities'], /dog/);
  assert.equal(row['Optional activities'].match(/dog/g).length, 1);
  assert.equal(row['Accommodation subtotal (CAD)'], 700);
  assert.equal(row['Activity fee (CAD)'], 80);
  assert.equal(row['Member discount applied at intake (CAD)'], 0);
  assert.equal(row['Member discount if verified (CAD)'], 30);
  assert.equal(row['Required total at intake (CAD)'], 780);
  assert.equal(row['Amount due now at intake (CAD)'], 0);
  assert.equal(row['Estimated trip minimum (CAD)'], 2345.99);
  assert.equal(row['Estimated trip maximum (CAD)'], 2797.99);
  assert.equal(row['Membership verification'], 'PENDING');
  assert.equal(row['Payment verification'], 'UNVERIFIED');
  assert.equal(row['Bed allocation ID'], '');
  assert.equal(row.Status, 'INTEREST');
  assert.equal(ledger.flushes, 1);
});

test('concurrent retries with the same request ID create a single row, and changes conflict', async () => {
  const ledger = await createFakeLedger();
  const handler = route.createHandler({ env: ledgerEnvironment, fetchImpl: ledger.fetchImpl });
  const request = { ...interest, requestId: randomUUID() };
  const outcomes = await Promise.all(Array.from({ length: 6 }, () => postInterest(handler, request)));

  assert.equal(outcomes[0].status, 200);
  assert.ok(outcomes.every((item) => item.json.id === outcomes[0].json.id));
  assert.equal(ledger.entries.length, 1);
  const changed = await postInterest(handler, { ...request, name: 'Different Traveller' });
  assert.deepEqual(changed, { status: 409, json: { error: 'conflict' } });
  assert.equal(ledger.entries.length, 1);
});

test('disabled, forged or invalid submissions cannot create a record', async () => {
  const ledger = await createFakeLedger();
  const handler = route.createHandler({ env: ledgerEnvironment, fetchImpl: ledger.fetchImpl });
  const disabled = route.createHandler({ env: {}, fetchImpl: ledger.fetchImpl });
  const badSecret = route.createHandler({
    env: { ...ledgerEnvironment, QUEBEC_LEDGER_SECRET: 'invalid-secret-over-thirty-two-characters' },
    fetchImpl: ledger.fetchImpl,
  });
  const request = { ...interest, requestId: randomUUID() };

  assert.deepEqual(await postInterest(disabled, request), { status: 503, json: { error: 'closed' } });
  assert.deepEqual(await postInterest(badSecret, request), { status: 503, json: { error: 'unavailable' } });
  assert.deepEqual(await postInterest(handler, { ...request, consent: false }), { status: 400, json: { error: 'invalid' } });
  assert.deepEqual(await postInterest(handler, { ...request, city: 'none', chalet: 'none' }), { status: 400, json: { error: 'invalid' } });
  assert.deepEqual(await postInterest(handler, { ...request, activities: ['not-a-real-activity'] }), { status: 400, json: { error: 'invalid' } });
  assert.deepEqual(await postInterest(handler, { ...request, social: 'x'.repeat(9000) }), { status: 413, json: { error: 'invalid' } });
  assert.deepEqual(await postInterest(handler, request, { 'sec-fetch-site': 'cross-site' }), { status: 403, json: { error: 'invalid' } });
  assert.equal(ledger.entries.length, 0);
});

test('city-only interest discards stale chalet transport, ski and activity choices', async () => {
  const ledger = await createFakeLedger();
  const handler = route.createHandler({ env: ledgerEnvironment, fetchImpl: ledger.fetchImpl });
  const response = await postInterest(handler, {
    ...interest,
    requestId: randomUUID(),
    chalet: 'none',
    flight: 'self',
    activities: ['citywalk', 'ice', 'dog'],
  });

  assert.equal(response.status, 200);
  const row = ledger.entries[0];
  assert.equal(row['Shared rental car'], 'self');
  assert.equal(row['Willing to drive'], 'no');
  assert.equal(row['Lift tickets'], 'none');
  assert.equal(row['Equipment'], 'none');
  assert.equal(row['Optional activities'], 'citywalk, ice');
  assert.equal(row['Required total at intake (CAD)'], 260);
  assert.equal(row['Estimated trip minimum (CAD)'], 295.99);
});

test('a forged redirect never receives the signed intake body', async () => {
  const calls = [];
  const handler = route.createHandler({
    env: ledgerEnvironment,
    fetchImpl: async (url, options) => {
      calls.push([url, options]);
      return new Response(null, { status: 307, headers: { Location: 'https://example.invalid' } });
    },
  });
  const response = await postInterest(handler, { ...interest, requestId: randomUUID() });

  assert.deepEqual(response, { status: 503, json: { error: 'unavailable' } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].redirect, 'manual');
});

test('an interrupted response can be retried without a second row', async () => {
  const ledger = await createFakeLedger();
  let dropResponse = true;
  const handler = route.createHandler({
    env: ledgerEnvironment,
    fetchImpl: async (url, options) => {
      const response = await ledger.fetchImpl(url, options);
      if (dropResponse && options.method === 'GET') {
        dropResponse = false;
        throw new Error('Simulated network timeout');
      }
      return response;
    },
  });
  const request = { ...interest, requestId: randomUUID() };

  assert.deepEqual(await postInterest(handler, request), { status: 503, json: { error: 'unavailable' } });
  assert.equal(ledger.entries.length, 1);
  const retry = await postInterest(handler, request);
  assert.deepEqual(retry, { status: 200, json: { id: ledger.entries[0]['Registration ID'] } });
  assert.equal(ledger.entries.length, 1);
});

test('the form status endpoint fails closed when its production configuration is absent', async () => {
  async function get(env, method = 'GET') {
    const headers = {};
    const handler = route.createHandler({ env });
    let payload;
    const response = {
      setHeader: (name, value) => { headers[name] = value; },
      end: (json) => { payload = JSON.parse(json); },
    };
    await handler({ method }, response);
    assert.equal(headers['Cache-Control'], 'no-store');
    return { status: response.statusCode, payload };
  }
  assert.deepEqual(await get({}), { status: 200, payload: { enabled: false } });
  assert.deepEqual(await get({ ...ledgerEnvironment, QUEBEC_LEDGER_URL: 'bad url' }), {
    status: 200, payload: { enabled: false },
  });
  assert.deepEqual(await get(ledgerEnvironment), { status: 200, payload: { enabled: true } });
  assert.deepEqual(await get(ledgerEnvironment, 'DELETE'), {
    status: 405, payload: { error: 'method_not_allowed' },
  });
});
