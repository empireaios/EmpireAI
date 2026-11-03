import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

// Only bounded disposable fixtures are written, before native admission. This
// checks the prepared mount/UID contract; it is not an application isolation PASS.
export function verifyStoragePreflight(p,env,source){
 const repository='/app',uid=65534,gid=65534;
 const bindings=[['VISUAL_MEMORY_STORAGE_ROOT',p.visual],['SESSION_CONTINUITY_STORAGE_ROOT',p.session]];
 for(const [key,root] of bindings){
  assert.equal(env[key],path.relative(repository,root));assert.equal(path.join(repository,env[key]),root);
  const envelope=path.dirname(root),s=fs.lstatSync(envelope);
  assert.ok(s.isDirectory()&&!s.isSymbolicLink());assert.equal(fs.realpathSync(envelope),envelope);
  assert.equal(s.uid,uid);assert.equal(s.gid,gid);assert.equal(s.mode&0o777,0o700);
 }
 for(const dir of [p.base,p.volume,p.authority]){const s=fs.lstatSync(dir);assert.equal(s.uid,0);assert.equal(s.mode&0o022,0);}
 const policy='/run/empire-policy/control.json',policyStat=fs.lstatSync(policy);
 assert.equal(policyStat.uid,0);assert.equal(policyStat.mode&0o222,0);assert.equal(fs.realpathSync(policy),policy);
 const child=String.raw`
 const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
 const {DatabaseSync}=require('node:sqlite');const p=JSON.parse(process.argv[1]);
 assert.equal(process.getuid(),65534);assert.equal(process.getgid(),65534);
 assert.match(fs.readFileSync('/proc/self/status','utf8'),/^CapEff:\s*0+$/m);
 const suffix='.work8-storage-preflight-'+crypto.randomUUID(),checked=[];
 for(const root of [p.visual,p.session]){
  const fixture=root+suffix,lock=fixture+'.capture-write-lock';
  try{fs.mkdirSync(fixture,{mode:0o700});fs.mkdirSync(lock,{mode:0o700});const target=path.join(fixture,'probe.json'),temp=path.join(fixture,'probe.tmp');fs.writeFileSync(temp,'{"probe":true}',{flag:'wx',mode:0o600});fs.renameSync(temp,target);assert.deepEqual(JSON.parse(fs.readFileSync(target)),{probe:true});checked.push({root,envelopeWritable:true,siblingLockWritable:true,atomicRenameReadback:true});}
  finally{fs.rmSync(lock,{recursive:true,force:true});fs.rmSync(fixture,{recursive:true,force:true});}
 }
 const database=path.join(p.volume,'commissioning',suffix+'.sqlite');let db;
 try{db=new DatabaseSync(database);db.exec('PRAGMA journal_mode=WAL;CREATE TABLE probe(value TEXT);INSERT INTO probe VALUES(\'retained\')');assert.ok(fs.existsSync(database+'-wal'));assert.ok(fs.existsSync(database+'-shm'));assert.equal(db.prepare('SELECT value FROM probe').get().value,'retained');}
 finally{if(db)db.close();for(const file of [database,database+'-wal',database+'-shm',database+'-journal'])fs.rmSync(file,{force:true});}
 for(const target of ['/app/'+suffix,path.join(p.authority,suffix)]){let denied=false;try{fs.writeFileSync(target,'probe',{flag:'wx'});}catch(e){denied=['EROFS','EACCES','EPERM'].includes(e.code);}finally{if(!denied)fs.rmSync(target,{force:true});}assert.ok(denied,'PROTECTED_ANCESTOR_WRITE_MUST_FAIL');}
 let policyDenied=false,fd;try{fd=fs.openSync('/run/empire-policy/control.json','r+');}catch(e){policyDenied=['EROFS','EACCES','EPERM'].includes(e.code);}finally{if(fd!==undefined)fs.closeSync(fd);}assert.ok(policyDenied,'POLICY_WRITE_OPEN_MUST_FAIL');
 process.stdout.write(JSON.stringify({runtimeUid:65534,effectiveCapabilitiesZero:true,checked,sqliteWalShmWritable:true,applicationRootWriteDenied:true,authorityWriteDenied:true,policyWriteOpenDenied:true,fixtureCleanup:true}));
 `;
 const result=spawnSync(process.execPath,['-e',child,JSON.stringify({visual:p.visual,session:p.session,volume:p.volume,authority:p.authority})],{uid,gid,env:{PATH:'/usr/local/bin:/usr/bin:/bin'},encoding:'utf8',timeout:10000,maxBuffer:32768});
 assert.equal(result.error,undefined,'STORAGE_PREFLIGHT_PROCESS_ERROR');assert.equal(result.status,0,'STORAGE_PREFLIGHT_FAILED:'+String(result.stderr).slice(0,500));
 return {schema:'work8-native-storage-preflight-v1',source,configurationForwarded:true,bindings:bindings.map(([key,root])=>({key,value:env[key],resolvedRoot:root})),...JSON.parse(result.stdout),actualNativeApplication:false,wholeRowsAccepted:[]};
}
