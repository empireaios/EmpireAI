import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {performance} from 'node:perf_hooks';
assert.equal(process.env.WORK8_KERNEL_EGRESS,'AF_UNIX_ONLY');
const [code,root,stage]=process.argv.slice(2);assert.ok(['old','new','rollback'].includes(stage));const now=Date.now;
const load=p=>import(pathToFileURL(path.join(code,'backend/src/runtime/commerce-runtime/governed',p+'.ts')).href);
const [{GovernedCommerceStore,digest},{GovernedCommerceEngine},{CommerceWorker},{DurableSimulatedFinance}]=await Promise.all(['store','engine','worker','work8-durable-finance'].map(load));
fs.mkdirSync(root,{recursive:true});const store=new GovernedCommerceStore(root+'/commerce.sqlite'),engine=new GovernedCommerceEngine(store,now),worker=new CommerceWorker(engine),finance=new DurableSimulatedFinance(store,worker,now),ws='synthetic:work8:operational-rollback';
const canonical=()=>({receipts:store.db.prepare('select * from commerce_runtime_receipts order by workspace,mission,version').all(),finance:store.db.prepare('select * from work8_sim_finance_events order by workspace,mission,sequence').all()});
const before=canonical();const previous=stage==='new'?'old':stage==='rollback'?'new':null;if(previous){const saved=JSON.parse(fs.readFileSync(root+'/'+previous+'.json'));assert.equal(digest(before),saved.afterDigest);}
const admitted=[];for(let n=0;n<2;n++)admitted.push(worker.enqueue(ws,'synthetic-owner',stage+'-'+n).id);
const start=performance.now(),ticks=[];try{
 for(let tick=0;tick<50;tick++){
  await new Promise(r=>setTimeout(r,5000));const task=worker.nextReady(ws);if(task)worker.runBounded(ws,task.id,4);finance.tick(ws);ticks.push({elapsedMs:performance.now()-start,taskId:task?.id??null});
  const tasks=worker.list(ws);if(stage!=='rollback'&&ticks.length===6)break;if(stage==='rollback'&&tasks.every(t=>t.status==='COMPLETE'))break;
 }
 const after=canonical();for(const key of ['receipts','finance'])for(const row of before[key])assert.ok(after[key].some(x=>digest(x)===digest(row)),key+' prefix changed');
 const tasks=worker.list(ws);if(stage==='rollback')assert.ok(tasks.length===6&&tasks.every(t=>t.status==='COMPLETE'));
 assert.equal(new Set(after.receipts.map(r=>r.id)).size,after.receipts.length);
 const projections=tasks.map(t=>finance.read(ws,t.mission));for(const p of projections)if(p.financial){assert.ok(p.financial.balanced&&p.financial.conserved);assert.equal(p.actualCashMovement,0);}
 const receipt={stage,code,source:fs.readFileSync(path.join(code,'SOURCE'),'utf8').trim(),status:'PASS_STAGE',beforeDigest:digest(before),afterDigest:digest(after),admitted,ticks,elapsedMs:performance.now()-start,tasks:tasks.map(t=>({id:t.id,status:t.status,cursor:t.cursor})),before,after,finance:projections,externalEffects:0,paidInference:0,productionTimersChanged:false,scope:'Three isolated operating commerce-worker processes, old/new/old; not complete hosted application upgrade or all-store rollback'};
 fs.writeFileSync(root+'/'+stage+'.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify({stage,status:receipt.status,tasks:tasks.length,complete:tasks.filter(t=>t.status==='COMPLETE').length,receipts:after.receipts.length,financeEvents:after.finance.length,elapsedMs:receipt.elapsedMs}));
}finally{store.close();}
