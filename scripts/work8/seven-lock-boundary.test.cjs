'use strict';
// New boundary examination only. Real process-owned SQLite locks on the local
// Node runtime; this is not controller admission or hosted O33 acceptance.
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {fork,spawnSync}=require('node:child_process');
const {once}=require('node:events');
const {DatabaseSync}=require('node:sqlite');
const core=path.resolve(__dirname,'../../backend/src/runtime/native-store-capture-lock.cjs');

if(process.argv[2]==='--holder'){
  let locks;
  try{
    locks=require(core).acquireNativeCaptureLocks(process.argv.slice(3));
    process.send({kind:'held',pid:process.pid});
    process.on('message',message=>{
      if(message?.kind!=='release')return;
      try{locks.verifyPaths();locks.close();process.exit(0);}
      catch(error){process.stderr.write(String(error));process.exit(1);}
    });
    process.once('disconnect',()=>{try{locks.close();}finally{process.exit(1);}});
  }catch(error){process.stderr.write(String(error));process.exit(1);}
}else{
  const {test}=require('node:test');
  const domains=['commissioning/intelligence.sqlite','commissioning/pillow-institutional.sqlite',
    'commissioning/pillow-request-receipts.sqlite','commissioning/pillow-reasoning.sqlite',
    'commissioning/communications.sqlite','commissioning/openai-october-2026.sqlite',
    'commissioning/assurance.sqlite','finance/evidence.sqlite','commerce/runtime.sqlite'];
  function fixture(t){
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'seven-lock-boundary-'));
    t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
    const primary=path.join(root,'brain.db');
    const mission=primary+'.missions.sqlite',execution=primary+'.mission-execution.sqlite';
    for(const [file,id,version,ddl]of [
      [mission,0x454d5352,3,'CREATE TABLE mission_snapshot(value INTEGER); INSERT INTO mission_snapshot VALUES(1)'],
      [execution,0x454d4558,1,'CREATE TABLE execution_events(value INTEGER); CREATE TABLE execution_jobs(value INTEGER); CREATE TABLE execution_meta(value INTEGER)'],
    ]){const db=new DatabaseSync(file);db.exec(`${ddl};PRAGMA application_id=${id};PRAGMA user_version=${version}`);db.close();}
    const files=domains.map((name,index)=>{
      const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});
      const db=new DatabaseSync(file);db.exec(`PRAGMA journal_mode=${index%2?'WAL':'DELETE'};CREATE TABLE boundary(value INTEGER);INSERT INTO boundary VALUES(1)`);db.close();return file;
    });
    return {root,primary,mission,execution,files};
  }
  async function holder(t,args){
    const child=fork(__filename,['--holder',...args],{execArgv:[],stdio:['ignore','ignore','pipe','ipc']});
    let errors='';child.stderr.on('data',b=>{errors+=b;});
    const terminal=once(child,'exit');
    t.after(async()=>{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await terminal;}});
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('LOCK_HOLDER_START_TIMEOUT '+errors)),5000);
      child.once('message',m=>{clearTimeout(timer);try{assert.deepEqual(m,{kind:'held',pid:child.pid});assert.notEqual(child.pid,process.pid);resolve();}catch(e){reject(e);}});
      child.once('error',e=>{clearTimeout(timer);reject(e);});
      child.once('exit',code=>{clearTimeout(timer);reject(Error('LOCK_HOLDER_EXIT_'+code+' '+errors));});
    });
    return {child,terminal,async release(){child.send({kind:'release'});assert.deepEqual(await terminal,[0,null],errors);}};
  }
  function writable(file){
    const p=spawnSync(process.execPath,['-e',`const {DatabaseSync}=require('node:sqlite');let db;try{db=new DatabaseSync(process.argv[1],{timeout:0});db.exec('BEGIN IMMEDIATE;ROLLBACK');}catch(e){process.stderr.write(String(e));process.exitCode=7;}finally{db?.close();}`,file],{encoding:'utf8',timeout:5000});
    assert.equal(p.error,undefined);assert.equal(p.signal,null);
    if(p.status===7){assert.match(p.stderr,/database is locked/);return false;}
    assert.equal(p.status,0,p.stderr);return true;
  }
  function parentDescriptorRoundtrip(files){
    for(const file of files){const fd=fs.openSync(file,'r');const bytes=Buffer.alloc(20);assert.equal(fs.readSync(fd,bytes,0,20,0),20);fs.closeSync(fd);}
  }
  test('separate nested mission/domain holders retain every lock across parent descriptor closure and reverse release', {timeout:20000},async t=>{
    const f=fixture(t),mission=await holder(t,[f.primary]),domain=await holder(t,[f.root,'work8-domains']);
    assert.notEqual(mission.child.pid,domain.child.pid);
    const all=[f.mission,f.execution,...f.files];
    parentDescriptorRoundtrip(all);
    for(const file of all)assert.equal(writable(file),false,file);
    await domain.release();
    for(const file of f.files)assert.equal(writable(file),true,file);
    parentDescriptorRoundtrip([f.mission,f.execution]);
    assert.equal(writable(f.mission),false);assert.equal(writable(f.execution),false);
    await mission.release();assert.equal(writable(f.mission),true);assert.equal(writable(f.execution),true);
  });
  test('holder death releases only its process locks; surviving holder remains exclusive', {timeout:15000},async t=>{
    const f=fixture(t),mission=await holder(t,[f.primary]),domain=await holder(t,[f.root,'work8-domains']);
    assert.equal(domain.child.kill('SIGKILL'),true);assert.deepEqual(await domain.terminal,[null,'SIGKILL']);
    assert.equal(writable(f.files[0]),true);
    parentDescriptorRoundtrip([f.mission,f.execution]);assert.equal(writable(f.mission),false);assert.equal(writable(f.execution),false);
    await mission.release();
    // This deliberately proves the need for controller failure containment;
    // it does not claim that a dead holder is a successful release receipt.
  });
}
