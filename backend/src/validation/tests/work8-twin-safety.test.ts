import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {InstitutionalMemory} from '../../institutional-memory/store.js';
import {GovernedCommerceStore} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {Work8TwinSessions} from '../../runtime/commerce-runtime/governed/work8-twin.js';
import {enforceOwnerSafety} from '../../runtime/commerce-runtime/governed/safety-admission.js';
import {acceptanceScenario} from '../../runtime/commerce-runtime/governed/scenario.js';

test('canonical twin execution inherits owner pause and limits and refuses inactive or unknown namespaces',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'twin-safety-')),store=new GovernedCommerceStore(':memory:');
 try{
  const memory=new InstitutionalMemory(path.join(root,'memory.sqlite')),twin=new Work8TwinSessions(store),p={workspace:'ws',owner:'owner'},now=Date.now();
  const session=twin.transition(p,{id:'create',sessionId:'exam',expectedVersion:0,action:'CREATE'});
  assert.throws(()=>twin.safetyWorkspace(session.twinWorkspace),/INACTIVE/);assert.throws(()=>twin.safetyWorkspace('twin_unknown'),/UNVERIFIED/);
  assert.equal(twin.safetyWorkspace('ws'),'ws');
  twin.transition(p,{id:'resume',sessionId:'exam',expectedVersion:1,action:'RESUME'});
  const engine=new GovernedCommerceEngine(store,()=>now,(actor,command,state)=>enforceOwnerSafety(memory,store,actor,command,state,now,twin.safetyWorkspace(actor.workspace)));
  const scenario=acceptanceScenario(session.twinWorkspace,p.owner,now);
  for(let i=0;i<5;i++)engine.execute(scenario.steps[i]!.actor,{id:'step-'+i,missionId:'mission',expectedVersion:i,command:scenario.steps[i]!.command});
  const policy={action:'safety_policy',id:'owner-pause',expectedVersion:0,confirmation:true,limits:{currency:'SGD',perOrder:50,daily:100,aggregate:100},breakers:{supplierPurchases:true,listingPublication:true,priceInventory:true},reason:'Synthetic owner-policy inheritance test'};
  memory.ownerCommand(p.workspace,p.owner,policy);
  const prepare={id:'prepare',missionId:'mission',expectedVersion:5,command:scenario.steps[5]!.command};
  assert.throws(()=>engine.execute(scenario.steps[5]!.actor,prepare),/OWNER_PURCHASES_PAUSED/);
  memory.ownerCommand(p.workspace,p.owner,{...policy,id:'owner-limit',expectedVersion:1,breakers:{supplierPurchases:false,listingPublication:false,priceInventory:false},limits:{currency:'SGD',perOrder:1,daily:100,aggregate:100}});
  assert.throws(()=>engine.execute(scenario.steps[5]!.actor,prepare),/OWNER_ORDER_LIMIT_EXCEEDED/);
  assert.equal(store.history(session.twinWorkspace,'mission').length,5);assert.equal(store.missions(p.workspace).length,0);
  twin.transition(p,{id:'pause',sessionId:'exam',expectedVersion:2,action:'PAUSE'});
  assert.throws(()=>engine.execute(scenario.steps[5]!.actor,prepare),/TWIN_INACTIVE_OR_STALE/);
 }finally{store.close();fs.rmSync(root,{recursive:true,force:true});}
});
