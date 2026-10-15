'use strict';
const test=require('node:test'),assert=require('node:assert/strict');const {injected,verified,hash}=require('../f27-external-oracle.cjs');
const {fixture}=require('./f27-fixture.cjs');
test('new outside oracle accepts labelled simultaneous fixture and exact fresh financial linkage',()=>{const {s,f,before}=fixture();assert.equal(verified(s,f,before).financialUnresolved,true);});
for(const [name,mutate] of [
 ['wrong financial incident identity',s=>{const b=JSON.parse(s.audit[0].body);b.incidentId='semantic';s.audit[0].body=JSON.stringify(b);} ],
 ['stale financial observation',s=>{s.audit[0].at=999;}],
 ['financial repair without authority',s=>{s.events[0].record=JSON.stringify({id:'refund',kind:'REFUND',minor:100});}],
 ['cursor not repaired',s=>{s.gap.tasks[0].record=JSON.stringify({cursor:4});}],
 ['duplicate cursor repair',s=>{s.records.push(s.records[0]);}],
 ['unknown supplier history changed',s=>{s.unknown.tasks[0].record=JSON.stringify({cursor:5});}],
 ['unsafe authority tamper',s=>{const r=JSON.parse(s.finance.receipts[0].record);r.state.paidInference=1;s.finance.receipts[0].record=JSON.stringify(r);}]
])test('outside oracle rejects '+name,()=>{const {s,f,before}=fixture();mutate(s);assert.throws(()=>verified(s,f,before));});

module.exports={fixture};
