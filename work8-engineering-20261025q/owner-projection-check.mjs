import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root='/workspace/scratch/7952261165b1/campaign-n/owner-release/';
const oldPath=root+'backend-live-executive.ts',newPath=root+'backend-reviewed-executive.ts';
const old=await import(oldPath),next=await import(newPath);
const defer={id:'synthetic_defer',kind:'OWNER_DECISION',decision:'DEFER',note:'EVIDENCE-INSUFFICIENT',recordedAt:'2026-10-24T00:00:00.000Z',origin:{authenticity:'OWNER_ASSERTED'}};
const base={id:'synthetic_decision',version:1,recordedAt:'2026-10-24T00:00:00.000Z',origin:{authenticity:'MODEL_GENERATED_CLAIM',source:'completed-reasoning:synthetic'},scope:{domain:'products'},decision:'Synthetic insufficient evidence',rationale:'No commercial qualification',events:[defer]};
const make=record=>({executiveRecords:()=>({records:[record],daily:[record],total:1,page:1,pageSize:20,dailyLimit:100}),executivePlan:()=>null,strategicDirection:()=>null});
const rows=[];
for(const [label,record] of [['no-decision',{...base,version:0,events:[]}],['committed-defer',base],['defer-with-outcome',{...base,version:2,events:[defer,{id:'synthetic_outcome',kind:'OUTCOME',outcome:{status:'NOT_EXECUTED'},origin:{authenticity:'OWNER_ASSERTED'}}]}]]){
 const before=JSON.stringify(record),a=old.readExecutive(make(record),'synthetic_workspace','2026-10-24'),b=next.readExecutive(make(record),'synthetic_workspace','2026-10-24');
 assert.equal(JSON.stringify(record),before);
 assert.equal(b.recommendations[0].version,record.version);
 assert.equal(b.birth,'NOT_BORN');assert.equal(b.commerce,'LOCKED');
 assert.equal(b.grantsAuthority,false);assert.equal(b.externalEffects,0);assert.equal(b.inferenceCalls,0);
 assert.equal(b.recommendations[0].executionStatus,'NOT_EXECUTED');
 assert.equal(b.timeline[0].status,b.recommendations[0].status);
 if(label==='committed-defer'){
  assert.equal(a.recommendations[0].status,'AWAITING_OWNER_REVIEW');
  assert.equal(b.recommendations[0].status,'DEFERRED');
  assert.deepEqual(b.recommendations[0].ownerDecision,a.recommendations[0].ownerDecision);
 }else assert.equal(a.recommendations[0].status,b.recommendations[0].status);
 rows.push({case:label,oldStatus:a.recommendations[0].status,newStatus:b.recommendations[0].status,version:b.recommendations[0].version,executionStatus:b.recommendations[0].executionStatus});
}
const receipt={status:'SCOPED_EXACT_PROJECTION_EXECUTION_PASS_NOT_RELEASE_BUILD',runtime:process.version,files:Object.fromEntries([oldPath,newPath].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),cases:rows,limits:['Synthetic in-memory fixture; no live decision or database write','Executed exact projection module using native type stripping; zod store schemas and frontend not built','Node24 differs from production Node22.23.2; not a production-candidate build certification','Old backend misprojects committed DEFER; must not serve as compatible post-DEFER rollback'],tests:3,newAcceptedItems:[],externalEffects:0};
fs.writeFileSync('/workspace/scratch/7952261165b1/campaign-q/OWNER-PROJECTION-EXECUTION.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,cases:rows}));
