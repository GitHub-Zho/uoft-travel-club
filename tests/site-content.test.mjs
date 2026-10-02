import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const index = await readFile(new URL('index.html', root), 'utf8');
const event = await readFile(new URL('algonquin-weekend.html', root), 'utf8');
const linktree = await readFile(new URL('linktree.html', root), 'utf8');
const waiver = await readFile(new URL('output/pdf/algonquin-fall-camping-waiver-2026.pdf', root));

assert.match(index, /href="algonquin-weekend#oct-2-4"[^>]*class="act inactive"/);
assert.match(index, /Mew Lake[\s\S]*Oct 2–4, 2026[\s\S]*Trip Full/);
assert.match(index, /href="algonquin-weekend"[^>]*class="act active"/);
assert.match(index, /Lake of Two Rivers/);
assert.match(index, /Oct 6–8, 2026/);
assert.match(index, /Passenger C\$170/);
assert.doesNotMatch(index, /Member C\$170/i);
assert.match(index, /Enrolling Now/);
assert.match(index, /active members only/i);
assert.match(index, /C\$15\/year[\s\S]*U of T students/i);
assert.match(index, /C\$20\/year[\s\S]*students at other schools/i);
assert.match(index, /C\$30\/year[\s\S]*(?:non-students|alumni)/i);
assert.match(index, /membership[\s\S]*separate from trip and activity fees/i);
assert.match(index, /first time[\s\S]*become a member/i);

assert.match(event, /Beginner-friendly/i);
assert.match(event, /October 2–4[\s\S]*Mew Lake[\s\S]*Full/i);
assert.match(event, /October 6–8, 2026/);
assert.match(event, /Lake of Two Rivers, Algonquin Provincial Park/);
assert.match(event, /maximum of six people and three tents per campsite/i);
assert.match(event, /Passenger[\s\S]*<div class="price">C\$170\s*<small>trip fee<\/small><\/div>/i);
assert.match(event, /Approved volunteer driver[\s\S]*C\$30/);
assert.match(event, /Approved volunteer driver[\s\S]*<div class="price">C\$30\s*<small>trip fee<\/small><\/div>/i);
assert.match(event, /Members only\. Annual membership required\./i);
assert.match(event, /C\$15\/year[\s\S]*U of T students/i);
assert.match(event, /C\$20\/year[\s\S]*students at other schools/i);
assert.match(event, /C\$30\/year[\s\S]*(?:non-students|alumni)/i);
assert.match(event, /membership fee is separate/i);
assert.match(event, /First time[\s\S]*Become a member[\s\S]*Already an active member/i);
assert.match(event, /share a tent with a friend/i);
assert.match(event, /fuel directly[\s\S]*not separately reimbursed/i);
assert.match(event, /C\$50 registration deposit/);
assert.match(event, /refunded[^.]*no (?:trip )?space/i);
assert.match(event, /Mew Lake[\s\S]*(?:yurt|cabin)[\s\S]*not guaranteed/i);
assert.match(event, /your own tent, sleeping bag, and sleeping pad/i);
assert.match(event, /picnic table[\s\S]*fire pit[\s\S]*showers/i);
assert.match(event, /href="https:\/\/utoc\.ca\/gear\/"/);
assert.match(event, /book[^.]*rental[^.]*yourself/i);
assert.match(event, /docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform/);
assert.match(event, /output\/pdf\/algonquin-fall-camping-waiver-2026\.pdf/);
assert.match(event, /signed waiver[^<]*uoft\.travelclub@gmail\.com/i);

assert.match(linktree, /October 2–4[\s\S]*Full/i);
assert.match(linktree, /October 6–8 Registration/);
assert.match(linktree, /Become a Member[\s\S]*C\$15[\s\S]*C\$20[\s\S]*C\$30/i);
assert.match(linktree, /Members only[\s\S]*membership fee separate/i);
assert.match(linktree, /docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform/);
assert.match(linktree, /href="algonquin-weekend"/);
assert.match(linktree, /output\/pdf\/algonquin-fall-camping-waiver-2026\.pdf/);
assert.match(linktree, /Summer Exploration Trip[\s\S]*Trip ended/i);
assert.match(linktree, /class="card ended"/);

for (const page of [index, event, linktree]) {
  assert.doesNotMatch(page, /non[- ]member/i);
  assert.doesNotMatch(page, /membership discount/i);
  assert.doesNotMatch(page, /member-price/i);
  assert.doesNotMatch(page, /Member C\$/i);
  assert.doesNotMatch(page, /C\$190/i);
  assert.doesNotMatch(page, /C\$25\/year/i);
}

assert.equal(waiver.subarray(0, 4).toString(), '%PDF');
assert.ok(waiver.length > 8_000, 'waiver PDF should contain the complete multi-page agreement');

console.log('site content checks passed');
