import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {test} from 'node:test';import {DatabaseSync} from 'node:sqlite';import Fastify from 'fastify';
import {createMissionExecutionService,executionDatabasePath} from '../../orchestration/pillow-host/mission-execution/service.js';
import {registerMissionExecutionRoutes} from '../../orchestration/pillow-host/routes/mission-execution-routes.js';
const {readyActualExecutionStore}=await import(new URL('../../../../scripts/work8/hh4-domain-state.mjs',import.meta.url).href);
test('HH4 awaits actual onReady runner initialization before reading execution DB; no mission admitted',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'hh4-execution-ready-')),primary=path.join(root,'brain.db');const app=Fastify();t.after(async()=>{await app.close();fs.rmSync(root,{recursive:true,force:true});});
 let diagnostics:()=>any=()=>({enabled:false});
 const host={getStatus:()=>({lifecycle:'running'}),getMissionRuntimeHistory:()=>({missions:[],checkpoints:[],timeline:[]}),configureMissionAuthorityExecution(_adapter:any,_lifecycle:any,read:()=>unknown){diagnostics=read;},getMissionAuthorityExecutionDiagnostics:()=>diagnostics()};
 const service=createMissionExecutionService({databasePath:primary,scope:{workspaceId:'ws_empire_1',ownerEmail:'owner@example.invalid'},buildSha:'a'.repeat(40),host});
 await registerMissionExecutionRoutes(app,service,async(_request,reply)=>{await reply.code(423).send({commerce:'LOCKED',birth:'NOT_BORN'});});
 assert.equal(diagnostics().enabled,true);assert.equal(diagnostics().running,false);assert.equal(fs.existsSync(executionDatabasePath(primary)),false);
 assert.throws(()=>new DatabaseSync(executionDatabasePath(primary),{readOnly:true,allowExtension:false}),/unable to open database file/);
 const deadline=Date.now()+3000;const actual=await readyActualExecutionStore({app},host,primary,deadline);assert.equal(actual,executionDatabasePath(primary));assert.ok(Date.now()<deadline);assert.equal(app.server.listening,false);
 const db=new DatabaseSync(actual,{readOnly:true,allowExtension:false});try{assert.equal(db.prepare('PRAGMA application_id').get()!.application_id,0x454d4558);assert.equal(db.prepare('PRAGMA user_version').get()!.user_version,1);assert.equal(db.prepare('SELECT count(*) n FROM execution_meta').get()!.n,1);assert.equal(db.prepare('SELECT count(*) n FROM execution_jobs').get()!.n,0);assert.equal(db.prepare('SELECT count(*) n FROM execution_events').get()!.n,0);}finally{db.close();}
 const refused=await app.inject({method:'POST',url:'/api/pillow/mission-runtime/authority-executions',payload:{}});assert.equal(refused.statusCode,423);assert.equal(refused.json().commerce,'LOCKED');
});
test('HH4 preserves original deadline and refuses failed or disabled actual execution readiness',async()=>{
 let called=false;await assert.rejects(readyActualExecutionStore({app:{ready(){called=true;return Promise.resolve();}}},{},'/not-used',Date.now()-1),/DEADLINE/);assert.equal(called,false);
 const start=Date.now();await assert.rejects(readyActualExecutionStore({app:{ready:()=>new Promise(()=>{})}},{},'/not-used',start+30),/DEADLINE/);assert.ok(Date.now()-start<1000);
 await assert.rejects(readyActualExecutionStore({app:{ready:async()=>{}}},{getMissionAuthorityExecutionDiagnostics:()=>({enabled:false})},'/not-used',Date.now()+1000),/ADAPTER_REQUIRED/);
 await assert.rejects(readyActualExecutionStore({app:{ready:async()=>{}}},{getMissionAuthorityExecutionDiagnostics:()=>({enabled:true,running:true,paused:false,lastError:'EXECUTION_STORAGE_OR_RECONCILIATION_UNAVAILABLE'})},'/not-used',Date.now()+1000),/STORAGE_FAILURE/);
});
