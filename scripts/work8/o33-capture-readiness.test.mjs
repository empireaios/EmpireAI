import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {inspectCaptureReadiness} from './o33-capture-readiness.mjs';
import {AssuranceStore} from '../../backend/src/assurance/independent-assurance.mjs';
import {runInspectorPass} from '../../backend/src/assurance/inspector-cycle.mjs';
const {SQL,CONTROL,nativeRoot}=createRequire(import.meta.url)('../../deployment/o33-path-contract.cjs');
// Labelled synthetic files establish only prerequisite inventory. Watchdog bytes
// are exclusively produced by actual inspector passes; no health is fabricated.
function fixture(){
 const volume=fs.mkdtempSync(path.join(os.tmpdir(),'o33-readiness-'));
 for(const relative of Object.values(SQL)){const file=path.join(volume,relative);fs.mkdirSync(path.dirname(file),{recursive:true});const db=new DatabaseSync(file);db.exec('CREATE TABLE labelled_synthetic_fixture(id INTEGER)');db.close();}
 for(const relative of CONTROL){if(relative.endsWith('.watchdog'))continue;const file=path.join(volume,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,relative.endsWith('.initialized')?'LABELLED_SYNTHETIC_INITIALIZATION':'{"classification":"LABELLED_SYNTHETIC_FIXTURE"}');}
 for(const dir of [nativeRoot(volume,'visual'),path.join(nativeRoot(volume,'visual'),'records'),nativeRoot(volume,'session')])fs.mkdirSync(dir,{recursive:true});
 const database=path.join(volume,'commissioning/assurance.sqlite'),startedAt=Date.now()-10;
 const check=(extra={})=>inspectCaptureReadiness({volume,startedAt,now:Date.now(),runtimeUid:process.getuid(),...extra});
 const observe=(at=Date.now())=>{const store=new AssuranceStore(database);store.close();return runInspectorPass(database,at);};
 return {volume,database,startedAt,check,observe,close:()=>fs.rmSync(volume,{recursive:true,force:true})};
}
test('real failed first inspector then complete overdue observation gates readiness without claiming health',()=>{const f=fixture();try{
 assert.throws(()=>runInspectorPass(f.database),/assurance_cycles/);assert.equal(fs.existsSync(f.database+'.watchdog'),false);assert.equal(f.check().ready,false);
 const verdict=f.observe();assert.equal(verdict.healthy,false);assert.equal(verdict.status,'ASSURANCE_OVERDUE');const r=f.check();assert.equal(r.ready,true,JSON.stringify(r.blockers));const observation=r.checked.find(x=>x.name.endsWith('.watchdog'));assert.equal(observation.status,verdict.status);assert.equal(observation.healthAsserted,false);
}finally{f.close();}});
for(const kind of ['marker','control','sql','visual-records'])test('missing '+kind+' is blocking',()=>{const f=fixture();try{f.observe();const relative=kind==='marker'?CONTROL.find(x=>x.endsWith('.initialized')):kind==='control'?CONTROL.find(x=>x.endsWith('.json')):kind==='sql'?Object.values(SQL)[0]:path.relative(f.volume,path.join(nativeRoot(f.volume,'visual'),'records'));assert.ok(relative);fs.rmSync(path.join(f.volume,relative),{recursive:true});assert.equal(f.check().ready,false);}finally{f.close();}});
for(const mode of ['stale','future','restored'])test(mode+' actual inspector receipt cannot satisfy current-launch readiness',()=>{const f=fixture();try{const now=Date.now(),at=mode==='stale'?now-90001:mode==='future'?now+1000:now-100;f.observe(at);assert.equal(f.check({now,startedAt:mode==='stale'?at-10:now-10}).ready,false);}finally{f.close();}});
test('symlink and hardlink inventory paths refused',()=>{const f=fixture();try{f.observe();const file=path.join(f.volume,Object.values(SQL)[0]),other=file+'.saved';fs.renameSync(file,other);fs.symlinkSync(other,file);assert.equal(f.check().ready,false);fs.unlinkSync(file);fs.linkSync(other,file);assert.equal(f.check().ready,false);}finally{f.close();}});
test('unsettled inspector temporary file refused',()=>{const f=fixture();try{f.observe();fs.writeFileSync(f.database+'.watchdog.tmp','partial');assert.equal(f.check().ready,false);}finally{f.close();}});
test('different required runtime ownership refused without changing host ownership',()=>{const f=fixture();try{f.observe();assert.equal(f.check({runtimeUid:process.getuid()===0?65534:0}).ready,false);}finally{f.close();}});
