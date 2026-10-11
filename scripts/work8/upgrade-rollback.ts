/** Isolated process-level compatibility examination, never a deployment command.
 * Usage: node --import tsx scripts/work8/upgrade-rollback.ts CODE_ROOT DATA_ROOT seed|advance|inspect
 * Run seed and inspect from the old revision; advance from the proposed revision. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
async function main(){
 const [code,root,mode]=process.argv.slice(2);if(!code||!root||!['seed','advance','inspect'].includes(mode??''))throw Error('EXAM_ARGUMENTS_REQUIRED');
 if(process.env.WORK8_KERNEL_EGRESS!=='DENIED')throw Error('EXAM_KERNEL_ISOLATION_REQUIRED');
 if(mode==='seed')fs.mkdirSync(root,{recursive:false});else if(fs.readFileSync(path.join(root,'fixture-marker'),'utf8')!=='WORK8_ISOLATED_COMPATIBILITY_EXAM')throw Error('EXAM_DIRECTORY_REQUIRED');
 const load=(name:string)=>import(pathToFileURL(path.join(code,'backend/src',name+'.ts')).href);
 const [{GovernedCommerceStore,digest},{GovernedCommerceEngine},{CommerceWorker},{DurableSimulatedFinance},{Work8TwinSessions},{Work8TwinRuntime},{InstitutionalMemory},{enforceOwnerSafety}]=await Promise.all(['runtime/commerce-runtime/governed/store','runtime/commerce-runtime/governed/engine','runtime/commerce-runtime/governed/worker','runtime/commerce-runtime/governed/work8-durable-finance','runtime/commerce-runtime/governed/work8-twin','runtime/commerce-runtime/governed/work8-twin-runtime','institutional-memory/store','runtime/commerce-runtime/governed/safety-admission'].map(load));
 let now=1791676800000;const p={workspace:'compat_fixture',owner:'fixture_owner'},memory=new InstitutionalMemory(path.join(root,'memory.sqlite'));
 if(mode==='seed'){fs.writeFileSync(path.join(root,'fixture-marker'),'WORK8_ISOLATED_COMPATIBILITY_EXAM',{flag:'wx'});memory.ownerCommand(p.workspace,p.owner,{action:'safety_policy',id:'limits',expectedVersion:0,confirmation:true,limits:{currency:'SGD',perOrder:100,daily:1000,aggregate:1000},breakers:{supplierPurchases:false,listingPublication:false,priceInventory:false},reason:'Isolated compatible application upgrade examination'});}
 const store=new GovernedCommerceStore(path.join(root,'commerce.sqlite')),sessions=new Work8TwinSessions(store,()=>now),engine=new GovernedCommerceEngine(store,()=>now,(a:unknown,c:unknown,s:unknown)=>enforceOwnerSafety(memory,store,a,c,s,now,sessions.safetyWorkspace((a as {workspace:string}).workspace))),worker=new CommerceWorker(engine),runtime=new Work8TwinRuntime(sessions,worker,new DurableSimulatedFinance(store,worker,()=>now));
 const canonical=()=>{const w=sessions.read(p,'upgrade').twinWorkspace;return {receipts:store.db.prepare('SELECT * FROM commerce_runtime_receipts WHERE workspace=? ORDER BY mission,version').all(w),finance:store.db.prepare('SELECT * FROM work8_sim_finance_events WHERE workspace=? ORDER BY mission,sequence').all(w)};};
 try{
 if(mode==='seed'){sessions.transition(p,{id:'create',sessionId:'upgrade',expectedVersion:0,action:'CREATE'});sessions.transition(p,{id:'resume',sessionId:'upgrade',expectedVersion:1,action:'RESUME'});runtime.admit(p,{id:'before-upgrade',sessionId:'upgrade',expectedVersion:2,count:2,authorizeLabelledFixtures:true});runtime.authority.command(p,{action:'GRANT',id:'grant',sessionId:'upgrade',expectedVersion:0,mode:'ONE_HOUR'});for(let i=0;i<5;i++)runtime.cycle();const view=runtime.projection(p,'upgrade');assert.ok(view.tasks.some((t:{status:string})=>t.status==='RUNNING'));fs.writeFileSync(path.join(root,'before.json'),JSON.stringify(canonical()),{flag:'wx'});console.log('OLD_CODE_ACTIVE_TASKS_PRESERVED');}
 if(mode==='advance'){
 const before=JSON.parse(fs.readFileSync(path.join(root,'before.json'),'utf8'));assert.equal(digest(canonical()),digest(before));
 runtime.admit(p,{id:'during-upgrade',sessionId:'upgrade',expectedVersion:2,count:2,authorizeLabelledFixtures:true});for(let i=0;i<60;i++)runtime.cycle();now+=86460000;runtime.authority.command(p,{action:'GRANT',id:'settle',sessionId:'upgrade',expectedVersion:1,mode:'ONE_HOUR'});for(let i=0;i<48;i++)runtime.cycle();
 const view=runtime.projection(p,'upgrade');assert.equal(view.records.length,4);assert.ok(view.records.every((r:{finance:{status:string}})=>r.finance.status==='COMPLETE_SIMULATION'));
 const after=canonical();assert.equal(after.receipts.length,40);assert.equal(after.finance.length,44);for(const row of before.receipts)assert.ok(after.receipts.some((r:unknown)=>digest(r)===digest(row)));
 fs.writeFileSync(path.join(root,'after.json'),JSON.stringify(after),{flag:'wx'});console.log('NEW_CODE_FOUR_ORDERS_44_FINANCIAL_EVENTS');
 }
 if(mode==='inspect'){const after=JSON.parse(fs.readFileSync(path.join(root,'after.json'),'utf8'));assert.equal(digest(canonical()),digest(after));now+=86460000;for(let i=0;i<5;i++)runtime.cycle();assert.equal(digest(canonical()),digest(after));assert.equal(runtime.projection(p,'upgrade').records.length,4);console.log('OLD_CODE_ROLLBACK_PRESERVES_NEW_TRANSACTIONS');}
 }finally{store.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
