// Fixed admitted process: never imports an application writer or launches children.
import {createRequire} from 'node:module';
import path from 'node:path';
import {registerCaptureParticipant} from './runtime-membership-bootstrap.mjs';
const require=createRequire(import.meta.url);
const {acquireNativeCaptureLocks}=require('../backend/src/runtime/native-store-capture-lock.cjs');
const role=process.env.WORK8_MEMBERSHIP_ROLE,id=process.env.WORK8_MEMBERSHIP_ID,nonce=process.env.WORK8_MEMBERSHIP_NONCE;
const source=process.env.RAILWAY_GIT_COMMIT_SHA,generation=process.env.EMPIRE_GENERATION;
const protocol='work8-native-lock-holder-v1';
const scope=role==='native-mission-lock-holder'?'missions':role==='work8-domain-lock-holder'?'domains':null;
if(!scope||!process.connected||!process.send)throw Error('ADMITTED_FIXED_LOCK_ROLE_REQUIRED');
const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;
const args=scope==='missions'?[path.join(root,'commissioning/empireai-brain.db')]:[root,'work8-domains'];
let lease=null,active=null,timer=null;
const seen=new Set(),requests=new Set();
const fatal=()=>process.kill(process.pid,'SIGKILL');
const send=m=>process.send({protocol,id,nonce,source,generation,scope,...m},e=>{if(e)fatal();});
registerCaptureParticipant({hold(){throw Error('LOCK_REQUIRES_STAGED_CAPTURE');},release(){throw Error('LOCK_REQUIRES_STAGED_CAPTURE');}});
process.on('message',m=>{
 if(m?.protocol!==protocol)return;
 try{
  if(m.id!==id||m.nonce!==nonce||m.source!==source||m.generation!==generation||m.scope!==scope||!/^[-a-f0-9]{36}$/.test(m.capture)||!/^[-a-f0-9]{36}$/.test(m.request)||!Number.isSafeInteger(m.deadline)||m.deadline<=Date.now())throw Error('LOCK_FRAME_REFUSED');
  if(requests.has(m.request))throw Error('LOCK_REQUEST_REUSED');requests.add(m.request);
  if(m.action==='acquire'){
   if(active||seen.has(m.capture)||m.deadline-Date.now()>29000)throw Error('LOCK_ACQUIRE_REFUSED');
   seen.add(m.capture);active={capture:m.capture,deadline:m.deadline};
   timer=setTimeout(fatal,m.deadline-Date.now());
   lease=acquireNativeCaptureLocks(args);lease.verifyPaths();
   send({action:'held',request:m.request,capture:m.capture,deadline:m.deadline});
  }else if(m.action==='release'){
   if(!lease||!active||m.capture!==active.capture||m.deadline!==active.deadline)throw Error('LOCK_RELEASE_REFUSED');
   lease.verifyPaths();lease.close();lease=null;active=null;clearTimeout(timer);timer=null;
   send({action:'released',request:m.request,capture:m.capture,deadline:m.deadline});
  }else throw Error('LOCK_ACTION_REFUSED');
 }catch(error){send({action:'refused',request:m?.request,capture:m?.capture,reason:String(error).slice(0,180)});fatal();}
});
process.on('SIGTERM',()=>{if(active)fatal();else process.exit(0);});
