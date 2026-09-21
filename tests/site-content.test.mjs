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
assert.match(index, /Passenger C\$190[\s\S]*Member C\$170/);
assert.match(index, /Enrolling Now/);

assert.match(event, /Beginner-friendly/i);
assert.match(event, /October 2–4[\s\S]*Mew Lake[\s\S]*Full/i);
assert.match(event, /October 6–8, 2026/);
assert.match(event, /Lake of Two Rivers, Algonquin Provincial Park/);
assert.match(event, /maximum of six people and three tents per campsite/i);
assert.match(event, /Passenger[\s\S]*C\$190/);
assert.match(event, /UTETC member[\s\S]*C\$170/);
assert.match(event, /Approved volunteer driver[\s\S]*C\$50/);
assert.match(event, /Member driver[\s\S]*C\$30/);
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
assert.match(linktree, /docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform/);
assert.match(linktree, /href="algonquin-weekend"/);
assert.match(linktree, /output\/pdf\/algonquin-fall-camping-waiver-2026\.pdf/);
assert.match(linktree, /Summer Exploration Trip[\s\S]*Trip ended/i);
assert.match(linktree, /class="card ended"/);

assert.equal(waiver.subarray(0, 4).toString(), '%PDF');
assert.ok(waiver.length > 8_000, 'waiver PDF should contain the complete multi-page agreement');

console.log('site content checks passed');
