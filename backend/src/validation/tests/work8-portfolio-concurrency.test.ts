import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {activePortfolio} from '../../runtime/commerce-runtime/governed/work8-portfolio.js';
import {acceptanceScenario} from '../../runtime/commerce-runtime/governed/scenario.js';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
const start=Date.parse('2026-10-11T00:00:00Z');
function prepared(e:GovernedCommerceEngine,m:string,product=m){
 const f=acceptanceScenario('ws','owner',e.clock());
 f.candidate.productId=product;f.candidate.offer.productId=product;f.candidate.offer.sku=m;f.candidate.offer.variantId=m;f.candidate.economics.productId=product;
 f.listing.productId=product;f.listing.variants[0]!.sku=m;f.listing.variants[0]!.variantId=m;
 const d=digest({candidate:f.candidate,listing:f.listing});
 const commands=[{type:'research',candidate:f.candidate},{type:'listing',listing:f.listing},{type:'review',digest:d,decision:'APPROVE',reason:'isolated exam reviewer'},{type:'approve',digest:d,expiresAt:new Date(e.clock()+3600000).toISOString(),maxExposure:100}];
 for(let i=0;i<commands.length;i++)e.execute(f.steps[i]!.actor,{id:m+':'+i,missionId:m,expectedVersion:i,command:commands[i]});return f;
}
function publish(e:GovernedCommerceEngine,m:string){const f=acceptanceScenario('ws','owner',e.clock());return e.execute(f.actors.EXECUTOR!,{id:m+':publish',missionId:m,expectedVersion:4,command:{type:'publication_intent',capacity:{account:'simulation',marketplace:'US',mode:'NEW_ASIN',asin:null,newAsinRemaining:1001,unsoldRemaining:1001,requestsPerSecond:5,eligibility:'ELIGIBLE',provenance:f.candidate.offer.provenance}}});}

if(!isMainThread){
 const store=new GovernedCommerceStore(workerData.filename),engine=new GovernedCommerceEngine(store,()=>start);
 parentPort!.once('message',()=>{try{publish(engine,workerData.mission);parentPort!.postMessage({mission:workerData.mission,result:'PUBLISHED'});}catch(error){parentPort!.postMessage({mission:workerData.mission,result:(error as Error).message});}finally{store.close();}});
 parentPort!.postMessage({ready:true});
}else test('independent SQLite worker connections race for 1000th slot; 1001st denied',{timeout:120000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'work8-race-')),filename=path.join(dir,'commerce.sqlite');
 const store=new GovernedCommerceStore(filename),engine=new GovernedCommerceEngine(store,()=>start),workers:Worker[]=[];
 try{
  // Every initial slot is admitted through the engine, never direct SQL fixtures.
  for(let n=0;n<999;n++){prepared(engine,'seed-'+n);publish(engine,'seed-'+n);}
  prepared(engine,'race-a');prepared(engine,'race-b');assert.equal(activePortfolio(store,'ws').activeCount,999);
  for(const mission of ['race-a','race-b'])workers.push(new Worker("require('tsx/cjs');require(require('node:worker_threads').workerData.module)",{eval:true,execArgv:[],workerData:{filename,mission,module:new URL(import.meta.url).pathname}}));
  await Promise.all(workers.map(worker=>new Promise<void>((resolve,reject)=>{worker.once('message',m=>m.ready?resolve():reject(Error('NOT_READY')));worker.once('error',reject);}))); 
  const results=workers.map(worker=>new Promise<{mission:string;result:string}>((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);}));
  workers.forEach(worker=>worker.postMessage('race'));
  const outcomes=await Promise.all(results);
  assert.deepEqual(outcomes.map(o=>o.result).sort(),['ACTIVE_PORTFOLIO_CAP','PUBLISHED']);
  assert.equal(activePortfolio(store,'ws').activeCount,1000);
  const loser=outcomes.find(o=>o.result==='ACTIVE_PORTFOLIO_CAP')!;
  assert.equal(store.history('ws',loser.mission).length,4);
  assert.throws(()=>publish(engine,loser.mission),/ACTIVE_PORTFOLIO_CAP/);
  assert.equal(activePortfolio(store,'ws').activeCount,1000);
 }finally{await Promise.all(workers.map(w=>w.terminate()));store.close();fs.rmSync(dir,{recursive:true,force:true});}
});
