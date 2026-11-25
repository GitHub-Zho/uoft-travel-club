const { createHash, createHmac, randomUUID } = require('node:crypto');

const MAX_BODY_BYTES = 8192;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REGISTRATION_ID = /^QNE-[0-9a-f-]{36}$/;
const OPTIONS = {
  membership: ['yes', 'no'],
  city: ['own', 'shared', 'none'],
  chalet: ['own', 'bunk', 'shared', 'none'],
  flight: ['assist', 'self'],
  car: ['share', 'self'],
  driver: ['yes', 'prefer-not', 'no'],
  lift: ['assist', 'ikon', 'self', 'none'],
  equipment: ['own', 'rent', 'self', 'none'],
};
const TEXT_FIELDS = { name: 120, email: 254, phone: 40, social: 160, companions: 300 };

function respond(res, status, json) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(json));
}

async function readBody(req) {
  if (Number(req.headers?.['content-length']) > MAX_BODY_BYTES) {
    return { tooLarge: true };
  }
  const parsedBody = req.body;
  if (parsedBody !== undefined) {
    const body = typeof parsedBody === 'string' || Buffer.isBuffer(parsedBody) ? parsedBody : JSON.stringify(parsedBody);
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) return { tooLarge: true };
    return { body: JSON.parse(body) };
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY_BYTES) return { tooLarge: true };
    chunks.push(bytes);
  }
  return { body: JSON.parse(Buffer.concat(chunks).toString('utf8')) };
}

function parseInterest(body, activityIds) {
  if (!body || typeof body !== 'object' || typeof body.requestId !== 'string' || !UUID_V4.test(body.requestId)) return;
  if (body.consent !== true || (body.city === 'none' && body.chalet === 'none')) return;
  const interest = { requestId: body.requestId.toLowerCase(), consent: true };
  for (const [field, maxLength] of Object.entries(TEXT_FIELDS)) {
    const value = body[field] ?? '';
    if (typeof value !== 'string' || /[\x00-\x1f\x7f]/.test(value)) return;
    const trimmed = value.trim();
    if (trimmed.length > maxLength || (!trimmed && field !== 'companions')) return;
    interest[field] = trimmed;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(interest.email)) return;
  const phoneDigits = interest.phone.replace(/\D/g, '').length;
  if (phoneDigits < 7 || phoneDigits > 20) return;
  interest.email = interest.email.toLowerCase();

  for (const [field, choices] of Object.entries(OPTIONS)) {
    if (!choices.includes(body[field])) return;
    interest[field] = body[field];
  }
  if (!Array.isArray(body.activities) || body.activities.length > 20 ||
      body.activities.some((id) => !activityIds.includes(id))) return;
  interest.activities = [...new Set(body.activities)].sort();
  return interest;
}

function readLedgerConfig(env) {
  const endpoint = env.QUEBEC_LEDGER_URL;
  const secret = env.QUEBEC_LEDGER_SECRET;
  if (!endpoint || !/^[A-Za-z0-9_-]{32,}$/.test(secret ?? '')) return;
  const url = URL.parse(endpoint);
  if (!url) return;
  if (url.origin !== 'https://script.google.com' ||
      !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname) ||
      url.username || url.password || url.search || url.hash) return;
  return { url: url.href, secret };
}

async function writeInterest(config, record, fetchImpl) {
  const payload = JSON.stringify({ sentAt: Date.now(), record });
  const signature = createHmac('sha256', config.secret).update(payload).digest('base64url');
  const signal = AbortSignal.timeout(17_000);
  let response = await fetchImpl(config.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload, signature }),
    redirect: 'manual',
    signal,
  });

  // Apps Script Content Service returns its result on a separate Google host.
  if (response.status === 302 || response.status === 303) {
    const location = new URL(response.headers.get('location'), config.url);
    if (location.origin !== 'https://script.googleusercontent.com' ||
        location.username || location.password || location.pathname !== '/macros/echo') {
      throw new Error('Unexpected ledger redirect');
    }
    response = await fetchImpl(location.href, { method: 'GET', redirect: 'error', signal });
  }
  if (!response.ok) throw new Error('Ledger unavailable');
  return response.json();
}

function createHandler({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return async function handleRegistration(req, res) {
    if (req.method === 'GET') {
      const enabled = env.QUEBEC_REGISTRATION_ENABLED === 'true' && Boolean(readLedgerConfig(env));
      return respond(res, 200, { enabled });
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return respond(res, 405, { error: 'method_not_allowed' });
    }
    if (env.QUEBEC_REGISTRATION_ENABLED !== 'true') return respond(res, 503, { error: 'closed' });
    if (req.headers?.['sec-fetch-site'] === 'cross-site') return respond(res, 403, { error: 'invalid' });
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers?.['content-type'] ?? '')) {
      return respond(res, 415, { error: 'invalid' });
    }

    let body;
    try {
      const parsed = await readBody(req);
      if (parsed.tooLarge) return respond(res, 413, { error: 'invalid' });
      body = parsed.body;
    } catch {
      return respond(res, 400, { error: 'invalid' });
    }

    try {
      const { calculatePricing, normalizeSelection, PRICING_VERSION, ACTIVITY_IDS } =
        await import('../assets/quebec/pricing.mjs');
      const fields = parseInterest(body, ACTIVITY_IDS);
      if (!fields) return respond(res, 400, { error: 'invalid' });
      const config = readLedgerConfig(env);
      if (!config) return respond(res, 503, { error: 'unavailable' });

      const interest = normalizeSelection(fields);
      const { lodging, activityFee, memberDiscount, requiredTotal, estimatedTotal, optional } =
        calculatePricing(interest);
      const verifiedDiscount = interest.membership === 'yes'
        ? calculatePricing(interest, { membershipVerified: true }).memberDiscount
        : 0;
      const record = {
        interest,
        requestHash: createHash('sha256').update(JSON.stringify(interest)).digest('hex'),
        id: 'QNE-' + randomUUID(),
        submittedAt: new Date().toISOString(),
        pricingVersion: PRICING_VERSION,
        pricing: { lodging, activityFee, memberDiscount, requiredTotal, estimatedTotal, pendingQuotes: optional.pending },
        verifiedDiscount,
      };
      const result = await writeInterest(config, record, fetchImpl);
      if (result?.error === 'conflict') return respond(res, 409, { error: 'conflict' });
      if (!REGISTRATION_ID.test(result?.id)) return respond(res, 503, { error: 'unavailable' });
      return respond(res, 200, { id: result.id });
    } catch {
      return respond(res, 503, { error: 'unavailable' });
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
