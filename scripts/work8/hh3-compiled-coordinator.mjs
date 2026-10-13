import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fork,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {ownProcessGroup,terminateOwnedProcessGroup} from './hh3-owned-process-group.mjs';
const require=createRequire(new URL('../../backend/package.json',import.meta.url));
const Redis=require('ioredis');
const {installPrimaryCaptureParticipant}=await import('../../backend/dist/runtime/work8-primary-capture.js');
const evidence='/evidence';assert.match(process.env.HH3_SOURCE,/^[a-f0-9]{40}$/);
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const writeProbe=file=>spawnSync(process.execPath,['-e',`const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(process.argv[1],{timeout:0});try{db.exec('BEGIN IMMEDIATE;ROLLBACK');}catch(e){if(!/locked|busy/i.test(String(e)))throw e;process.exitCode=7;}finally{db.close();}`,file],{encoding:'utf8',timeout:1500});
for(const mode of ['timeout','observer-error','invalidate-error']){
 const events=[];let held,settled,failure,reader,active=0,entered=0;const out=path.join(evidence,mode);fs.mkdirSync(out,{recursive:true});
 const child=fork(new URL('./hh3-compiled-child.mjs',import.meta.url),[mode],{detached:true,execArgv:[],stdio:['ignore','pipe','pipe','ipc'],env:{PATH:process.env.PATH,NODE_ENV:'test',EMPIRE_ENGINEERING_TEST_MODE:'true',HH3_SOURCE:process.env.HH3_SOURCE,HOME:'/tmp',TMPDIR:'/tmp'}});
 const ownedGroup=ownProcessGroup(child);
 const log=fs.createWriteStream(path.join(out,'child.log'));child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
 const remove=installPrimaryCaptureParticipant(child,async hold=>{active++;entered++;events.push('primary-enter');try{await hold();}finally{active--;events.push('primary-release');}});
 child.on('message',message=>{events.push(message.event);if(message.event==='held')held=message;if(message.event==='settled')settled=message;if(message.event==='failed')failure=message;});
 const until=async(predicate,label,ms=150000)=>{const start=Date.now();while(!predicate()){if(failure)throw Error(JSON.stringify(failure));if(child.exitCode!==null||child.signalCode!==null)throw Error('Child exited before '+label);if(Date.now()-start>=ms)throw Error('Deadline '+label);await delay(20);}};
 try{
  await until(()=>held,'held');assert.equal(active,1);assert.equal(entered,1);
  const {notice,port,root}=held,manifest=JSON.parse(fs.readFileSync(notice.directory+'/runtime-recovery.json','utf8'));
  assert.equal(manifest.bootAllowed,false);assert.equal(manifest.completeLiveState,false);
  reader=new Redis({host:'127.0.0.1',port,maxRetriesPerRequest:0});await reader.ping();
  const {ownerKey,owner,metaKey}=manifest.redisIdentity;
  assert.equal(await reader.get(ownerKey),owner);assert.equal(await reader.hget(metaKey,'paused'),'1');
  const native=path.join(root,'commerce/runtime.sqlite');assert.equal(writeProbe(native).status,7,'actual native writer must remain excluded');
  if(mode==='invalidate-error'){
   // Fault only this new examination artifact: make normal unlink impossible.
   const file=notice.directory+'/runtime-recovery.json';fs.renameSync(file,file+'.retained');fs.mkdirSync(file);fs.renameSync(file+'.retained',file+'/retained-manifest.json');
  }
  child.send({action:'observed'});
  if(mode==='invalidate-error'){
   await delay(5500);assert.equal(failure,undefined);assert.equal(settled,undefined);assert.equal(active,1);assert.equal(await reader.get(ownerKey),owner);assert.equal(await reader.hget(metaKey,'paused'),'1');assert.equal(writeProbe(native).status,7);assert.ok(fs.existsSync(notice.directory+'/runtime-recovery.json/retained-manifest.json'));
   fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({source:process.env.HH3_SOURCE,mode,scope:'HH3_COMPILED_COORDINATOR_ONLY',primaryHeld:true,redisHeld:true,nativeHeld:true,settled:false,requiresExternalTermination:true,fullDomainRecovery:false,protectedCustody:false,events},null,2));
  }else{
   await until(()=>settled,'settlement',15000);assert.equal(active,0);assert.equal(fs.existsSync(notice.directory+'/runtime-recovery.json'),false);assert.equal(await reader.get(ownerKey),null);assert.notEqual(await reader.hget(metaKey,'paused'),'1');assert.equal(writeProbe(native).status,0);
   fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({source:process.env.HH3_SOURCE,mode,scope:'HH3_COMPILED_COORDINATOR_ONLY',manifestInvalidated:true,primaryReleased:true,redisReleased:true,nativeReleased:true,error:settled.error,fullDomainRecovery:false,protectedCustody:false,events},null,2));
   child.send({action:'cleanup'});await until(()=>!child.connected,'cleanup',15000);
  }
 }catch(error){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({source:process.env.HH3_SOURCE,mode,error:String(error),events}));throw error;}
 finally{reader?.disconnect();remove();const cleanup=await terminateOwnedProcessGroup(ownedGroup);fs.writeFileSync(path.join(out,'process-cleanup.json'),JSON.stringify({source:process.env.HH3_SOURCE,mode,...cleanup},null,2));log.end();}
}
