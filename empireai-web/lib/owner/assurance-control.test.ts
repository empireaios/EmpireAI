import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assuranceControl} from './assurance-control-handler';
import {parseAssurance,isFresh,readReceipt,validateOwnerCommand,validateEngineeringCommand} from './assurance-contract';
const command={id:'owner_unit001',type:'approve',approvalId:'apr_123'};
const request=(body:unknown,headers:Record<string,string>={})=>new Request('https://empire-ai.co/api/owner/assurance/control',{method:'POST',headers:{origin:'https://empire-ai.co',cookie:'empireai_session=test-session','content-type':'application/json',...headers},body:JSON.stringify(body)});
test('forged, unauthenticated and expanded authority never reach upstream',async()=>{
 const original=global.fetch;let calls=0;global.fetch=async()=>{calls++;return Response.json({});};
 try{
  assert.equal((await assuranceControl(request(command,{origin:'https://evil.example'}))).status,403);
  assert.equal((await assuranceControl(request(command,{cookie:''}))).status,401);
  assert.equal((await assuranceControl(request({...command,unlockCommerce:true}))).status,400);
  assert.equal((await assuranceControl(request({...command,type:'birth'}))).status,400);
  assert.equal((await assuranceControl(request({...command,approvalId:'../../secrets'}))).status,400);
  assert.equal((await assuranceControl(request({padding:'x'.repeat(17000)}))).status,413);
  assert.equal(calls,0);
 }finally{global.fetch=original;}
});
test('one authenticated command preserves exact id and upstream denial; no retry',async()=>{
 const original=global.fetch;let calls=0;global.fetch=async(url,init)=>{calls++;assert.match(String(url),/\/api\/pillow\/assurance\/control$/);assert.deepEqual(JSON.parse(String(init?.body)),command);assert.equal((init?.headers as Record<string,string>).cookie,'empireai_session=test-session');return Response.json({...command,status:'ACTION_DENIED',reason:'APPROVAL_STALE_OR_INVALID',at:10,revision:'abc'});};
 try{const response=await assuranceControl(request(command));assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal((await response.json()).status,'ACTION_DENIED');assert.equal(calls,1);}finally{global.fetch=original;}
});
test('engineering BFF is bounded and cannot manufacture closure',()=>{
 assert.equal(validateEngineeringCommand({id:'owner_lease',type:'lease_begin',expectedRevision:'sha',scope:['backend'],ttlMs:60000}),true);
 assert.equal(validateEngineeringCommand({id:'owner_lease',type:'lease_begin',expectedRevision:'sha',scope:['backend'],ttlMs:Infinity}),false);
 assert.equal(validateEngineeringCommand({id:'owner_done',type:'checkpoint',missionId:'advanced-assurance',state:'COMPLETE',evidence:[]}),false);
 assert.equal(validateEngineeringCommand({id:'owner_progress',type:'checkpoint',missionId:'advanced-assurance',state:'IN_PROGRESS',evidence:['receipt:123']}),true);
 assert.equal(validateOwnerCommand({id:'owner_x',type:'retry'}),false);
});
test('stale, future, missing monitor and malformed evidence cannot look healthy',()=>{
 const data=parseAssurance({observedAt:100,status:'HEALTHY',controlPlane:{schema:'assurance-control-plane-v1',observedAt:100,revision:'a',status:'HEALTHY',summary:{activeIncidents:0,automaticallyRecovered:0,ownerActionRequired:0},paused:{paused:false},monitor:{fresh:true,heartbeat:null},components:[],incidents:[],recoveries:[],approvals:[],events:[],checkpoints:[],lease:null}});
 assert.equal(isFresh(data,110,false),true);assert.equal(isFresh(data,100000,false),false);assert.equal(isFresh(data,99,false),false);assert.equal(isFresh(data,110,true),false);
 data.controlPlane!.monitor.fresh=false;assert.equal(isFresh(data,110,false),false);
 assert.throws(()=>parseAssurance({...data,controlPlane:{...data.controlPlane,components:[{status:'HEALTHY'}]}}));
 assert.throws(()=>readReceipt({id:'other',status:'ACCEPTED',at:1,revision:'a'},'owner_x'));
 assert.throws(()=>readReceipt({id:'owner_x',status:'SUCCESS',at:1,revision:'a'},'owner_x'));
});
test('release verification requires exact bounded source identities and complete attestation',()=>{
 const evidence={backendSha:'a'.repeat(40),frontendSha:'b'.repeat(40),backendDeploymentId:'railway-id',frontendDeploymentId:'vercel-id',ciRunIds:['backend-ci','frontend-ci'],preservationDigest:'c'.repeat(64),readbackProof:'receipt:readback',desktopProof:'receipt:desktop',mobileProof:'receipt:mobile',collisionProof:'receipt:collision',selfFailureProof:'receipt:monitor'};
 assert.equal(validateEngineeringCommand({id:'owner_close',type:'mission_close',missionId:'assurance',state:'COMPLETE',externalEvidence:evidence}),true);
 assert.equal(validateEngineeringCommand({id:'owner_close',type:'mission_close',missionId:'assurance',state:'COMPLETE',externalEvidence:{...evidence,frontendSha:'unknown'}}),false);
 assert.equal(validateEngineeringCommand({id:'owner_close',type:'mission_close',missionId:'assurance',state:'COMPLETE',externalEvidence:{...evidence,secret:'extra'}}),false);
 for(const mode of ['AUTOMATIC','API_ADVISOR','OWNER_APPROVAL','MONITOR_FAILURE','DEPLOYMENT_COLLISION'])assert.equal(validateEngineeringCommand({id:'owner_accept',type:'acceptance_admit',mode,expectedRevision:'revision',expectedSha256:'d'.repeat(64)}),true);
 assert.equal(validateEngineeringCommand({id:'owner_accept',type:'acceptance_admit',mode:'ARBITRARY_EFFECT',expectedRevision:'revision',expectedSha256:'d'.repeat(64)}),false);
});
