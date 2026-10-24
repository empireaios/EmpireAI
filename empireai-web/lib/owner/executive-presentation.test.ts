import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ownerDate,ownerLabel,displayAmount,financialException} from './executive-presentation';
import {sourceMoney} from './business-view';

test('Executive amounts retain unknown currency and nonzero sub-cent usage',()=>{
 assert.equal(sourceMoney(20254371,'USD'),'USD 20.25');
 assert.equal(sourceMoney(110852730,'USD'),'USD 110.85');
 assert.equal(sourceMoney(1,'USD'),'USD <0.01');
 assert.equal(sourceMoney(-1,'USD'),'USD >-0.01');
 assert.equal(sourceMoney(null,'USD'),'—');
 assert.equal(displayAmount(20,undefined),'20.00 (currency unrecorded)');
 assert.equal(displayAmount(null,'USD'),'Unknown');
});
test('Owner dates and pricing warnings preserve meaning without internal timestamps',()=>{
 assert.match(ownerDate('2026-10-15T00:00:00.000Z'),/15 Oct 2026.*8:00.*SGT/);
 assert.equal(ownerDate(null),'Not recorded');
 assert.equal(ownerLabel('NOT_EXECUTED'),'Not executed');
 assert.match(financialException('openai reviewed tariff expires 2026-10-15T00:00:00.000Z; renewal requires reviewed evidence, never automatic'),/pricing review due.*Reviewed evidence is required before renewal/);
 assert.equal(financialException('SGD total excludes an unconverted amount'),'SGD total excludes an unconverted amount');
});
