import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseAccounting} from './accounting-evidence';
test('bounded accounting preserves invoice unknown and rejects incomplete or contradictory totals',()=>{
 const valid={ceilingMicroUsd:1000000,heldMicroUsd:400000,remainingMicroUsd:600000,recordedEstimateMicroUsd:250000,invoiceActualMicroUsd:null,invoiceUnknownCount:1,observedAt:'2026-10-03T10:00:00Z'};
 assert.equal(parseAccounting(valid).invoiceActualMicroUsd,null);
 for(const patch of [{invoiceActualMicroUsd:0},{heldMicroUsd:NaN},{ceilingMicroUsd:Number.MAX_SAFE_INTEGER+1},{recordedEstimateMicroUsd:undefined},{invoiceUnknownCount:-1},{observedAt:'unknown'}])assert.throws(()=>parseAccounting({...valid,...patch}));
 assert.equal(parseAccounting({...valid,invoiceUnknownCount:0,invoiceActualMicroUsd:0}).invoiceActualMicroUsd,0);
});
