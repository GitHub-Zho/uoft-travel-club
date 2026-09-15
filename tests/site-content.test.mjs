import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const index = await readFile(new URL('index.html', root), 'utf8');
const event = await readFile(new URL('algonquin-weekend.html', root), 'utf8');

assert.match(index, /href="algonquin-weekend"[^>]*class="act active"/);
assert.match(index, /Algonquin Fall Camping/);
assert.match(index, /Oct 2–4, 2026/);
assert.match(index, /Passenger est\. C\$180/);
assert.match(index, /Enrolling Now/);

assert.match(event, /Beginner-friendly/i);
assert.match(event, /maximum of six people and three tents per campsite/i);
assert.match(event, /Passenger[\s\S]*C\$180/);
assert.match(event, /Two-night campsite allocation[\s\S]*C\$50/);
assert.match(event, /Two group BBQ dinners[\s\S]*C\$50/);
assert.match(event, /Carpool, driver credit &amp; club operations[\s\S]*C\$80/);
assert.match(event, /Approved volunteer driver[\s\S]*C\$40–50/);
assert.match(event, /fuel directly[\s\S]*not separately reimbursed/i);
assert.match(event, /C\$50 registration deposit/);
assert.match(event, /around C\$220[\s\S]*C\$240–250/i);
assert.match(event, /supports club operations and future activities/i);
assert.match(event, /your own tent, sleeping bag, and sleeping pad/i);
assert.match(event, /picnic table[\s\S]*fire pit[\s\S]*showers/i);
assert.match(event, /docs\.google\.com\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform/);

console.log('site content checks passed');
