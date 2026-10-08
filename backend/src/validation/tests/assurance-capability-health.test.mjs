import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {classifyCapability,aggregateCapabilityHealth} from '../../assurance/capability-health.mjs';
import {AssuranceControlPlane} from '../../assurance/control-plane.mjs';
test('capability states preserve unavailable, stale and unconfigured evidence',()=>{
 const base={now:100000,maxAgeMs:1000,health:{lastGoodAt:new Date(99500).toISOString()}};
 assert.equal(classifyCapability(base).status,'HEALTHY');
 assert.equal(classifyCapability({...base,configured:false}).status,'EXTERNALLY_BLOCKED');
 assert.equal(classifyCapability({...base,implemented:false}).status,'NOT_CHECKED');
 assert.equal(classifyCapability({...base,applicable:false}).status,'HEALTHY');
 assert.equal(classifyCapability({...base,applicable:false,applicabilityEvidence:'reviewed scope'}).status,'NOT_APPLICABLE');
 assert.equal(classifyCapability({...base,health:null}).status,'NOT_CHECKED');
 assert.equal(classifyCapability({...base,health:{lastGoodAt:new Date(98000).toISOString()}}).status,'DEGRADED');
 for(const failure of ['HTTP_403','HTTP_503','PUBLIC_SOURCE_NOT_APPROVED'])assert.equal(classifyCapability({...base,health:{...base.health,failure}}).status,'EXTERNALLY_BLOCKED');
 assert.equal(classifyCapability({...base,health:{...base.health,failure:'INVALID_PROVIDER_SHAPE'}}).status,'FAILED');
 assert.equal(aggregateCapabilityHealth([{status:'HEALTHY'},{status:'NOT_CHECKED'}]),'NOT_CHECKED');
});
test('new revision resolves historical incidents only with affirmative matching probe and no uncertain effect',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'incident-revision-'));let now=10000;
 let cp=new AssuranceControlPlane({root,revision:'old',now:()=>now});
 const probe={id:'p',capability:'cap',classification:'read',summary:'read failed',status:'FAILED'};
 try{
  const incident=cp.observe('workspace',probe);cp.close();cp=new AssuranceControlPlane({root,revision:'new',now:()=>++now});
  cp.observe('workspace',{...probe,status:'EXTERNALLY_BLOCKED'});assert.equal(cp.get('workspace','incident',incident.id).status,'DETECTED');
  cp.put('workspace','recovery','uncertain',{id:'uncertain',incidentId:incident.id,status:'UNKNOWN'});
  cp.observe('workspace',{...probe,status:'HEALTHY'});assert.equal(cp.get('workspace','incident',incident.id).status,'DETECTED');
  cp.put('workspace','recovery','uncertain',{id:'uncertain',incidentId:incident.id,status:'FAILED'});
  cp.observe('workspace',{...probe,status:'HEALTHY'});const resolved=cp.get('workspace','incident',incident.id);assert.equal(resolved.status,'RECOVERED');assert.equal(resolved.revision,'old');assert.equal(resolved.verificationRevision,'new');
  assert.ok(cp.snapshot('workspace').events.some(e=>e.type==='INCIDENT_DETECTED'));
 }finally{cp.close();fs.rmSync(root,{recursive:true,force:true});}
});
