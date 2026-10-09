import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const index = await readFile(new URL('index.html', root), 'utf8');
const event = await readFile(new URL('algonquin-weekend.html', root), 'utf8');
const linktree = await readFile(new URL('linktree.html', root), 'utf8');
const generalWaiver = await readFile(new URL('output/pdf/general-club-participation-waiver.pdf', root));
const tripTemplate = await readFile(new URL('output/pdf/trip-specific-risk-acknowledgement-template.pdf', root));
const archivedAlgonquinWaiver = await readFile(new URL('output/pdf/algonquin-fall-camping-waiver-2026.pdf', root));

assert.match(index, /href="algonquin-weekend#oct-2-4"[^>]*class="act inactive"/);
assert.match(index, /Mew Lake[\s\S]*Oct 2–4, 2026[\s\S]*Registration Closed/);
assert.match(index, /href="algonquin-weekend"[^>]*class="act inactive"/);
assert.match(index, /Lake of Two Rivers/);
assert.match(index, /Oct 6–8, 2026/);
assert.match(index, /Passenger C\$170/);
assert.doesNotMatch(index, /Member C\$170/i);
assert.doesNotMatch(index, /Enrolling Now/);
assert.match(index, /id="waivers"[\s\S]*general-club-participation-waiver\.pdf[\s\S]*trip-specific-risk-acknowledgement-template\.pdf/);
assert.ok(index.indexOf('id="waivers"') < index.indexOf('Summer Exploration Trip 2026'));
assert.match(index, /Membership requirements vary by activity/i);
assert.match(index, /Annual Membership — C\$25\/year for all members/i);
assert.match(index, /annual membership fee supports club operations, programming, equipment, event administration, and future member activities/i);
assert.match(index, /Membership is separate from trip and event fees, including any travel or accommodation costs/i);
assert.match(index, /First time with UTETC\?[\s\S]*some activities welcome nonmembers/i);

assert.match(event, /Beginner-friendly/i);
assert.match(event, /October 2–4[\s\S]*Mew Lake[\s\S]*Closed/i);
assert.match(event, /October 6–8, 2026/);
assert.match(event, /Lake of Two Rivers, Algonquin Provincial Park/);
assert.match(event, /maximum of six people and three tents per campsite/i);
assert.match(event, /Passenger[\s\S]*<div class="price">C\$170\s*<small>trip fee<\/small><\/div>/i);
assert.match(event, /Approved volunteer driver[\s\S]*C\$30/);
assert.match(event, /Approved volunteer driver[\s\S]*<div class="price">C\$30\s*<small>trip fee<\/small><\/div>/i);
assert.match(event, /Members only\. Annual membership required\./i);
assert.match(event, /Annual Membership — C\$25\/year for all members/i);
assert.match(event, /annual membership fee supports club operations, programming, equipment, event administration, and future member activities/i);
assert.match(event, /separate from the trip fee, C\$50 registration deposit, and any travel or accommodation costs/i);
assert.match(event, /become a member[\s\S]*future club activities/i);
assert.match(event, /share a tent with a friend/i);
assert.match(event, /fuel directly[\s\S]*not separately reimbursed/i);
assert.match(event, /C\$50 registration deposit/);
assert.match(event, /no trip space is available, the deposit will be refunded/i);
assert.match(event, /Mew Lake[\s\S]*(?:yurt|cabin)[\s\S]*not a confirmed booking/i);
assert.match(event, /your own tent, sleeping bag, and sleeping pad/i);
assert.match(event, /picnic table[\s\S]*fire pit[\s\S]*showers/i);
assert.match(event, /href="https:\/\/utoc\.ca\/gear\/"/);
assert.match(event, /book[^.]*rental[^.]*yourself/i);
assert.doesNotMatch(event, /docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform/);
assert.match(event, /algonquin-fall-camping-waiver-2026\.pdf[^<]*>Archived October 2–4 waiver/);
assert.match(event, /href="\/#waivers"/);
assert.doesNotMatch(event, /general-club-participation-waiver\.pdf|trip-specific-risk-acknowledgement-template\.pdf/);
assert.match(event, /Registration is closed for both October sessions/i);

assert.match(linktree, /October 2–4[\s\S]*Registration closed/i);
assert.match(linktree, /October 6–8[\s\S]*Registration closed/);
assert.match(linktree, /Annual Membership — C\$25 per year[\s\S]*C\$25 for all members/i);
assert.doesNotMatch(linktree, /docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform/);
assert.match(linktree, /href="algonquin-weekend"/);
assert.match(linktree, /general-club-participation-waiver\.pdf/);
assert.match(linktree, /trip-specific-risk-acknowledgement-template\.pdf/);
assert.ok(linktree.indexOf('Club Waivers') < linktree.indexOf('October 6–8 · Lake of Two Rivers'));
assert.match(linktree, /Summer Exploration Trip[\s\S]*Trip ended/i);
assert.match(linktree, /class="card ended"/);

for (const page of [index, event, linktree]) {
  assert.doesNotMatch(page, /non[- ]member/i);
  assert.doesNotMatch(page, /membership discount/i);
  assert.doesNotMatch(page, /member-price/i);
  assert.doesNotMatch(page, /Member C\$/i);
  assert.doesNotMatch(page, /C\$190/i);
  assert.doesNotMatch(page, /C\$20\/year|C\$30\/year/i);
}

for (const pdf of [generalWaiver, tripTemplate, archivedAlgonquinWaiver]) {
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
  assert.ok(pdf.length > 6_000, 'PDF should contain the complete multi-page document');
}
for (const page of [index, linktree]) {
  assert.doesNotMatch(page, /algonquin-fall-camping-waiver-2026\.pdf/);
}

console.log('site content checks passed');
