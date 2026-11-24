import assert from 'node:assert/strict';
import test from 'node:test';
import { prefilledRegistrationUrl } from '../assets/quebec/registration-handoff.mjs';

const option = (entry, values) => ({ entry: `entry.${entry}`, values });
const en = {
  plan: option(11, { a: 'A only', b: 'B only', both: 'A + B' }),
  membership: option(12, { yes: 'Yes', no: 'No' }),
  flight: option(13, { assist: 'Flight help', self: 'Independent travel' }),
  cityA: option(14, { self: 'No accommodation needed', own: 'Own queen · $360' }),
  cityBoth: option(15, { self: 'No accommodation needed', own: 'Own queen · $360' }),
  chalet: option(16, { shared: 'Shared queen · $500', own: 'Own queen · $1,000' }),
  car: option(17, { share: 'Share a car', self: 'Independent ride' }),
  driver: option(18, { no: 'No', yes: 'Yes' }),
  lift: option(19, { none: 'Not skiing', assist: 'Pass help' }),
  equipment: option(20, { rent: 'Rental help' }),
};
const config = {
  meta: { url: 'https://docs.google.com/forms/d/e/test/viewform', language: option(1, { en: 'English', zh: '中文' }) },
  en, zh: { ...en, plan: option(31, { both: '两段都参加' }) },
};

test('only active Plan A choices are carried over and no personal data appears in the URL', () => {
  const url = new URL(prefilledRegistrationUrl(config, 'en', {
    plan: 'a', city: 'self', chalet: 'own', membership: 'yes', car: 'share',
    lift: 'assist', equipment: 'rent', email: 'private@example.invalid', signature: 'Private',
    activities: ['ice'],
  }));
  assert.equal(url.searchParams.get('entry.1'), 'English');
  assert.equal(url.searchParams.get('entry.11'), 'A only');
  assert.equal(url.searchParams.get('entry.14'), 'No accommodation needed');
  assert.equal(url.searchParams.has('entry.15'), false);
  assert.equal(url.searchParams.has('entry.16'), false);
  assert.equal(url.searchParams.has('entry.20'), false);
  assert.doesNotMatch(url.href, /private|signature|activities/i);
});

test('Plan B skips A and gear without skiing, and both plans respect the target locale', () => {
  const b = new URL(prefilledRegistrationUrl(config, 'en', {
    plan: 'b', city: 'own', chalet: 'shared', lift: 'none', equipment: 'rent',
  })).searchParams;
  assert.equal(b.get('entry.16'), 'Shared queen · $500');
  assert.equal(b.get('entry.19'), 'Not skiing');
  assert.equal(b.has('entry.14'), false);
  assert.equal(b.has('entry.20'), false);

  const both = new URL(prefilledRegistrationUrl(config, 'zh', {
    plan: 'both', city: 'own', chalet: 'shared', lift: 'assist', equipment: 'rent',
  })).searchParams;
  assert.equal(both.get('entry.1'), '中文');
  assert.equal(both.get('entry.31'), '两段都参加');
  assert.equal(both.get('entry.15'), 'Own queen · $360');
  assert.equal(both.get('entry.20'), 'Rental help');
});
