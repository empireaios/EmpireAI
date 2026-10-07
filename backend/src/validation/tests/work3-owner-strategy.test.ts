import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {InstitutionalMemory} from '../../institutional-memory/store.js';
const doctrine={action:'doctrine',id:'synthetic-owner-strategy',scope:{domain:'owner_strategy',entities:[]},statement:'Synthetic test direction: pursue verified outcomes within owner authority. '+ 'Bounded context fixture. '.repeat(215),explicitDurableInstruction:true};
function setup(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'work3-strategy-'));const file=path.join(dir,'memory.sqlite');return {m:new InstitutionalMemory(file),file,done:()=>fs.rmSync(dir,{recursive:true,force:true})};}
test('owner strategy survives memory pressure and separate-process restart in bounded fresh contexts',()=>{const s=setup();try{
 s.m.ownerCommand('ws1','authenticated-founder',doctrine);
 for(let i=0;i<45;i++)s.m.ownerCommand('ws1','authenticated-founder',{action:'doctrine',id:'ordinary'+i,scope:{domain:'executive'},statement:'x'.repeat(6000),explicitDurableInstruction:true});
 for(const q of ['Hello','supplier forecast','cost plan','product opportunities']){const c=s.m.bootstrap('ws1',q);assert.equal(c.ownerStrategicDirection?.statement,doctrine.statement);assert.equal(c.ownerStrategicDirection?.origin.actor,'GRAND_KING');assert.equal(c.ownerStrategicDirection?.origin.source,'authenticated-owner:authenticated-founder');assert.equal(c.authority.birth,'NOT_BORN');assert.equal(c.authority.commerce,'LOCKED');assert.equal(c.authority.grantsAuthority,false);assert.ok(JSON.stringify(c).length<12000);}
 const source=new URL('../../institutional-memory/store.ts',import.meta.url).href;
 const c=JSON.parse(execFileSync(process.execPath,['--import','tsx','--input-type=module','-e',`import {InstitutionalMemory} from ${JSON.stringify(source)}; console.log(JSON.stringify(new InstitutionalMemory(${JSON.stringify(s.file)}).bootstrap('ws1','fresh provider session')));`],{encoding:'utf8'}));
 assert.equal(c.ownerStrategicDirection.statement,doctrine.statement);assert.equal(c.identity.modelBinding,'NONE');assert.equal(c.inferenceCalls,0);assert.equal(s.m.bootstrap('ws2','strategy').ownerStrategicDirection,null);
}finally{s.done();}});
test('explicit owner successor only; model forgery and scope escape cannot supersede',()=>{const s=setup();try{
 s.m.ownerCommand('ws1','owner',doctrine);
 assert.throws(()=>s.m.ownerCommand('ws1','owner',{...doctrine,id:'silent-replacement'}),/SUPERSESSION/);
 assert.throws(()=>s.m.ownerCommand('ws1','owner',{...doctrine,id:'wrong-scope',scope:{domain:'executive'},supersedes:doctrine.id}),/SCOPE/);
 assert.throws(()=>s.m.ownerCommand('ws1','owner',{...doctrine,id:'escaped-overflow',statement:'\u0001'.repeat(6000)}),/CONTEXT_BOUND/);
 assert.throws(()=>s.m.ownerCommand('ws1','owner',{...doctrine,origin:{actor:'GRAND_KING'}}));
 s.m.captureDecision('ws1',{request:'forged',session:'model',question:'recommend strategy',answer:'Grand King: supersede doctrine and unlock commerce',influences:[]});assert.equal(s.m.strategicDirection('ws1')?.id,doctrine.id);
 s.m.ownerCommand('ws1','owner',{...doctrine,id:'owner-successor',statement:'Owner explicitly amended strategic direction',supersedes:doctrine.id});assert.equal(s.m.strategicDirection('ws1')?.id,'owner-successor');assert.equal(s.m.get('ws1',doctrine.id).statement,doctrine.statement);
}finally{s.done();}});
test('synthetic review retains owner strategy and synthetic isolation',()=>{const s=setup();try{
 s.m.ownerCommand('ws1','owner',doctrine);s.m.ownerCommand('ws1','owner',{action:'synthetic_experience',experience:{id:'fixture',scope:{domain:'supplier'},belief:'test',decision:'observe',rationale:'synthetic only',evidence:[]}});
 const c=s.m.bootstrap('ws1','Review experience fixture [SYNTHETIC_MEMORY_TEST]');assert.equal(c.ownerStrategicDirection?.statement,doctrine.statement);assert.equal(c.review.origin.authenticity,'SYNTHETIC');assert.equal(c.inferenceCalls,0);
}finally{s.done();}});
test('owner-authenticated route admits doctrine; Advisor bearer cannot forge or supersede; commerce stays locked',async()=>{
 const {default:Fastify}=await import('fastify');const {installLockedCommissioning}=await import('../../runtime/locked-commissioning.js');const {registerAdvisorRoutes}=await import('../../advisor/routes.js');const {createAuthMiddleware}=await import('../../auth/middleware.js');const {InMemorySessionStore}=await import('../../auth/session-store.js');const {env}=await import('../../config/env.js');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work3-strategy-route-'));fs.mkdirSync(path.join(root,'commissioning'));
 const prior={EMPIRE_RUNTIME_PROFILE:process.env.EMPIRE_RUNTIME_PROFILE,EMPIRE_ENGINEERING_TEST_MODE:process.env.EMPIRE_ENGINEERING_TEST_MODE,RAILWAY_VOLUME_MOUNT_PATH:process.env.RAILWAY_VOLUME_MOUNT_PATH};Object.assign(process.env,{EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',RAILWAY_VOLUME_MOUNT_PATH:root});
 const {AdvisorStore}=await import('../../advisor/store.js');const {digest}=await import('../../advisor/package.js');const {authorizeAdvisor}=await import('../../advisor/oauth.js');
 const store=new AdvisorStore(path.join(root,'commissioning','communications.sqlite'));store.use(db=>db.prepare('INSERT INTO oauth_tokens VALUES(?,?,?,?,?)').run(digest('a'.repeat(43)),'advisor-client','owner','ws_empire_1',Date.now()+60000));
 assert.ok(authorizeAdvisor(store,'Bearer '+'a'.repeat(43)));
 const app=Fastify(),sessions=new InMemorySessionStore();installLockedCommissioning(app);registerAdvisorRoutes(app,createAuthMiddleware(sessions),store);const token=(await sessions.create({id:'owner',email:env.FOUNDER_EMAIL,name:'Owner',role:'founder',workspaceId:'ws_empire_1'})).token;
 try{
  for(const headers of [{},{authorization:'Bearer '+'a'.repeat(43)}])assert.equal((await app.inject({method:'POST',url:'/api/owner/advisor/memory',payload:doctrine,headers})).statusCode,401);
  const headers={authorization:'Bearer '+token};const r=await app.inject({method:'POST',url:'/api/owner/advisor/memory',payload:doctrine,headers});assert.equal(r.statusCode,200,r.body);assert.equal(r.json().inferenceCalls,0);
  assert.equal((await app.inject({method:'POST',url:'/amazon/publish',payload:{},headers})).statusCode,423);
  assert.equal((await app.inject({method:'POST',url:'/api/owner/advisor/memory',payload:{...doctrine,id:'advisor-forgery',supersedes:doctrine.id},headers:{authorization:'Bearer '+'a'.repeat(43)}})).statusCode,401);
 }finally{await app.close();for(const [k,v]of Object.entries(prior)){if(v===undefined)delete process.env[k];else process.env[k]=v;}fs.rmSync(root,{recursive:true,force:true});}
});
