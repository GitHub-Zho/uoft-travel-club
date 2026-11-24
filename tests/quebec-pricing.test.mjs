import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePricing, normalizeSelection } from '../assets/quebec/pricing.mjs';

const combinations = [
  ['own', 'none', 440], ['shared', 'none', 260],
  ['none', 'own', 1080], ['none', 'shared', 580],
  ['own', 'own', 1440], ['shared', 'shared', 760],
  ['own', 'shared', 940], ['shared', 'own', 1260],
];

test('all eight stays apply one fee and only a verified member discount', () => {
  for (const [city, chalet, total] of combinations) {
    const selection = { city, chalet, membership: 'yes' };
    const pending = calculatePricing(selection);
    assert.equal(pending.requiredTotal, total);
    assert.equal(pending.membershipPending, true);
    assert.equal(pending.memberDiscount, 0);
    assert.equal(pending.activityFee, 80);
    assert.equal(pending.amountDueNow, 0);
    const verified = calculatePricing(selection, { membershipVerified: true });
    assert.equal(verified.requiredTotal, total - 30);
    assert.equal(verified.membershipPending, false);
  }
  assert.equal(calculatePricing({ city: 'none', chalet: 'none' }).requiredTotal, 0);
});

test('optional estimates do not increase the required fee or amount due', () => {
  const quote = calculatePricing({
    city: 'shared', chalet: 'shared', flight: 'assist', car: 'share',
    lift: 'assist', equipment: 'rent', activities: ['ice', 'luge', 'ice'],
  });
  assert.equal(quote.requiredTotal, 760);
  assert.equal(quote.amountDueNow, 0);
  assert.deepEqual(quote.optional.lines.map(({ id }) => id), ['flight', 'car', 'ski', 'gear', 'ice', 'luge']);
  assert.deepEqual(quote.estimatedTotal, { min: 2334.99, max: 2821.99 });
});

test('day sledding and the planned dog outing use fixed published rates', () => {
  const quote = calculatePricing({ chalet: 'shared', activities: ['luge', 'dog'] });
  assert.deepEqual(quote.optional.lines, [
    { id: 'luge', min: 69, max: 69 },
    { id: 'dog', min: 181, max: 181 },
  ]);
  assert.equal(quote.requiredTotal, 580);
  assert.equal(quote.amountDueNow, 0);
  assert.deepEqual(quote.estimatedTotal, { min: 830, max: 830 });
});

test('hidden mountain choices are cleared from a city-only registration', () => {
  const select = {
    city: 'own', chalet: 'none', flight: 'self', car: 'share', driver: 'yes',
    lift: 'ikon', equipment: 'rent', activities: ['ice', 'dog', 'spa', 'fake'],
  };
  const normalized = normalizeSelection(select);
  assert.deepEqual(normalized.activities, ['ice', 'spa']);
  assert.equal(normalized.lift, 'none');
  assert.equal(normalized.equipment, 'none');
  assert.equal(normalized.car, 'self');
  assert.equal(normalized.driver, 'no');
  assert.deepEqual(calculatePricing(select).estimatedTotal, { min: 550.99, max: 602.99 });
});

test('Ikon and independent quotes are pending until checked', () => {
  const quote = calculatePricing({ chalet: 'own', lift: 'ikon', equipment: 'self' });
  assert.deepEqual(quote.optional.pending, ['ikon']);
  assert.deepEqual(quote.estimatedTotal, { min: 1080, max: 1080 });
});

test('approved payment rules credit lodging deposits and exclude extras', () => {
  const selection = { city: 'own', chalet: 'shared', membership: 'yes', flight: 'assist' };
  const deposit = { enabled: true, mode: 'fixed', depositAmount: 200 };
  const terms = { paymentPolicy: deposit, quoteApproved: true, membershipVerified: true };
  assert.equal(calculatePricing(selection, terms).amountDueNow, 200);
  assert.equal(calculatePricing(selection, { ...terms, quoteApproved: false }).amountDueNow, 0);
  assert.equal(calculatePricing(selection, { ...terms, membershipVerified: false }).amountDueNow, 200);
  assert.equal(calculatePricing(selection, { ...terms, paymentPolicy: { enabled: true, mode: 'percentage', depositRate: 0.25 } }).amountDueNow, 215);
  assert.equal(calculatePricing(selection, { ...terms, paymentPolicy: { enabled: true, mode: 'full' } }).amountDueNow, 860);
  assert.equal(calculatePricing(selection, { ...terms, paymentPolicy: { enabled: true, mode: 'fixed' } }).amountDueNow, 0);
});


test('Plan A works with self-arranged lodging, and never includes mountain expenses', () => {
  const quote = calculatePricing({
    plan: 'a', city: 'self', chalet: 'own', flight: 'assist', car: 'share', lift: 'assist', equipment: 'rent',
  });
  assert.deepEqual(quote.lodging, { city: 0, chalet: 0, total: 0 });
  assert.equal(quote.requiredTotal, 80);
  assert.deepEqual(quote.optional.lines, []);
  assert.deepEqual(quote.optional.pending, ['flight']);
  assert.equal(quote.amountDueNow, 0);
});

test('Plan B uses chalet lodging only and excludes independently purchased tickets', () => {
  const quote = calculatePricing({
    plan: 'b', city: 'own', chalet: 'shared', flight: 'self', car: 'share', lift: 'self', equipment: 'self',
  });
  assert.deepEqual(quote.lodging, { city: 0, chalet: 500, total: 500 });
  assert.equal(quote.requiredTotal, 580);
  assert.deepEqual(quote.optional.lines.map(({ id }) => id), ['car']);
  assert.deepEqual(quote.estimatedTotal, { min: 830, max: 930 });
});

test('both plans can have no lodging, with one club fee and one verified discount', () => {
  const quote = calculatePricing({
    plan: 'both', city: 'self', chalet: 'self', flight: 'assist', membership: 'yes',
  }, { membershipVerified: true });
  assert.equal(quote.lodging.total, 0);
  assert.equal(quote.requiredTotal, 50);
  assert.deepEqual(quote.estimatedTotal, { min: 500, max: 600 });
  assert.equal(quote.amountDueNow, 0);
});
