import test from 'node:test';
import assert from 'node:assert/strict';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {acceptanceScenario} from '../../runtime/commerce-runtime/governed/scenario.js';
import {projectWork8Finance} from '../../runtime/commerce-runtime/governed/work8-finance.js';
const now=Date.parse('2026-10-11T00:00:00Z');
function fixture(){
 const store=new GovernedCommerceStore(':memory:'),engine=new GovernedCommerceEngine(store,()=>now);
 const scenario=acceptanceScenario('synthetic:independent-review','owner',now);
 for(const [i,step] of scenario.steps.slice(0,5).entries())engine.execute(step.actor,{id:'review-'+i,missionId:'review-mission',expectedVersion:i,command:step.command});
 return store;
}
const project=(store:GovernedCommerceStore,workspace='synthetic:independent-review',mission='review-mission')=>projectWork8Finance(store,workspace,mission,[],new Date(now).toISOString());
test('finance reads every historical digest, not only the final source receipt',()=>{
 for(let version=1;version<=5;version++){
  const store=fixture();try{
   assert.equal(project(store).sourceVerification,'CANONICAL_IMMUTABLE_HISTORY_READ');
   const receipt=store.history('synthetic:independent-review','review-mission')[version-1]!;
   receipt.state.reviewInjectedCorruption=true;
   // Deliberate corruption of an isolated engine-created DB, never production.
   store.db.exec('DROP TRIGGER immutable_commerce_update');
   store.db.prepare('UPDATE commerce_runtime_receipts SET record=? WHERE version=?').run(JSON.stringify(receipt),version);
   assert.throws(()=>project(store),/COMMERCE_JOURNAL_CORRUPT/);
  }finally{store.close();}
 }
});
test('finance rejects recomputed prior receipt digest when next receipt still links original history',()=>{
 const store=fixture();try{
  const first=store.history('synthetic:independent-review','review-mission')[0]!;
  const {digest:ignored,...body}=first;body.state.reviewInjectedCorruption=true;
  store.db.exec('DROP TRIGGER immutable_commerce_update');
  store.db.prepare('UPDATE commerce_runtime_receipts SET record=? WHERE version=1').run(JSON.stringify({...body,digest:digest(body)}));
  assert.throws(()=>project(store),/COMMERCE_JOURNAL_CORRUPT/);
 }finally{store.close();}
});
test('finance cannot select a receipt from a different workspace or mission',()=>{
 const store=fixture();try{
  assert.throws(()=>project(store,'foreign-workspace'),/FINANCE_VERIFIED_RECEIPT_REQUIRED/);
  assert.throws(()=>project(store,'synthetic:independent-review','foreign-mission'),/FINANCE_VERIFIED_RECEIPT_REQUIRED/);
  const last=store.history('synthetic:independent-review','review-mission').at(-1)!;
  const {digest:ignored,...body}=last;body.workspace='foreign-workspace';
  store.db.exec('DROP TRIGGER immutable_commerce_update');
  store.db.prepare('UPDATE commerce_runtime_receipts SET record=? WHERE version=5').run(JSON.stringify({...body,digest:digest(body)}));
  assert.throws(()=>project(store),/COMMERCE_JOURNAL_CORRUPT/);
 }finally{store.close();}
});
