import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {activePortfolio} from '../../runtime/commerce-runtime/governed/work8-portfolio.js';
import {acceptanceScenario} from '../../runtime/commerce-runtime/governed/scenario.js';
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
test('daily virtual cohorts reach 1000 active products; 1001 blocked after reopen, retirement permits one replacement',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'work8-cap-'));const filename=path.join(dir,'commerce.sqlite');let store=new GovernedCommerceStore(filename),now=start,e=new GovernedCommerceEngine(store,()=>now);
 try{
  for(let day=0;day<10;day++){now=start+day*86400000;for(let n=0;n<100;n++){const m='p'+(day*100+n);prepared(e,m);publish(e,m);}assert.equal(activePortfolio(store,'ws').activeCount,(day+1)*100);}
  store.close();store=new GovernedCommerceStore(filename);e=new GovernedCommerceEngine(store,()=>now);
  prepared(e,'overflow');assert.throws(()=>publish(e,'overflow'),/ACTIVE_PORTFOLIO_CAP/);assert.equal(store.history('ws','overflow').length,4);
  const last=store.history('ws','p0').at(-1)!;e.execute({id:'owner',workspace:'ws',role:'OWNER'},{id:'retire-p0',missionId:'p0',expectedVersion:last.version,command:{type:'retire',reason:'Simulated replacement examination'}});
  assert.equal(activePortfolio(store,'ws').activeCount,999);publish(e,'overflow');assert.equal(activePortfolio(store,'ws').activeCount,1000);
  assert.equal(store.history('ws','p0').length,6);assert.equal(activePortfolio(store,'other').activeCount,0);
 }finally{store.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('duplicate product variants cannot consume multiple active slots; owner retirement cannot be forged; replay is unchanged',()=>{
 const store=new GovernedCommerceStore(':memory:'),e=new GovernedCommerceEngine(store,()=>start);
 try{prepared(e,'a','same');const r=publish(e,'a');assert.deepEqual(publish(e,'a'),r);prepared(e,'b','same');assert.throws(()=>publish(e,'b'),/DUPLICATE_ACTIVE_PRODUCT/);
 assert.throws(()=>e.execute({id:'foreign',workspace:'ws',role:'OWNER'},{id:'retire',missionId:'a',expectedVersion:5,command:{type:'retire',reason:'not owner'}}),/PORTFOLIO_OWNER_REQUIRED/);
 assert.equal(activePortfolio(store,'ws').activeCount,1);
 }finally{store.close();}
});
