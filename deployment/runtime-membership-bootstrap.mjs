import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {admit}=require('./runtime-generation.cjs');
const {resolveRuntimeRevision}=require('./runtime-revision.cjs');
const protocol='work8-authoritative-membership-v1';
const id=process.env.WORK8_MEMBERSHIP_ID,nonce=process.env.WORK8_MEMBERSHIP_NONCE,role=process.env.WORK8_MEMBERSHIP_ROLE;
if(!process.send||!process.connected||!id||!nonce)throw Error('PRIVATE_CONTROLLER_IPC_REQUIRED');
const source=resolveRuntimeRevision(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),process.env.RAILWAY_GIT_COMMIT_SHA);
admit({root:process.env.EMPIRE_GENERATION_DIRECTORY,expectedGeneration:process.env.EMPIRE_GENERATION,expectedSource:source,cutoverDigest:process.env.EMPIRE_CUTOVER_DIGEST,role,expectedDevice:process.env.EMPIRE_GENERATION_DEVICE,expectedInode:process.env.EMPIRE_GENERATION_INODE,volumeRoot:process.env.RAILWAY_VOLUME_MOUNT_PATH,redisUrl:process.env.REDIS_URL});
const fatal=()=>process.kill(process.pid,'SIGKILL');
process.once('disconnect',fatal);
const send=message=>process.send({protocol,id,nonce,...message},error=>{if(error)fatal();});
let admitted=false,participant,capture=null,examination;

let resolveAdmission,rejectAdmission;
const admission=new Promise((resolve,reject)=>{resolveAdmission=resolve;rejectAdmission=reject;});
const deadline=setTimeout(()=>{rejectAdmission(Error('DURABLE_ADMISSION_ACK_TIMEOUT'));fatal();},5000);
process.on('message',message=>{
 if(!message||message.protocol!==protocol)return;
 if(message.id!==id||message.nonce!==nonce)return fatal();
 if(message.action==='admitted'&&!admitted){admitted=true;examination=message.examination;clearTimeout(deadline);resolveAdmission();return;}
 if(!admitted||!participant)return fatal();
 if(message.action==='hold'&&!capture){capture=message.capture;Promise.resolve().then(()=>participant.hold()).then(()=>send({action:'held',capture}),fatal);return;}
 if(message.action==='release'&&capture===message.capture){const held=capture;Promise.resolve().then(()=>participant.release()).then(()=>{capture=null;send({action:'released',capture:held});},fatal);return;}
 fatal();
});
send({action:'enroll'});
await admission;
if(examination){
 const assert=(await import('node:assert/strict')).default;
 assert.equal(role,'brain-worker');assert.equal(examination.recipient.id,id);assert.equal(examination.recipient.nonce,nonce);assert.equal(examination.recipient.pid,process.pid);const stat=(await import('node:fs')).readFileSync('/proc/self/stat','utf8');assert.equal(examination.recipient.startTicks,stat.slice(stat.lastIndexOf(')')+2).split(' ')[19]);assert.equal(examination.source,source);assert.equal(examination.generation,process.env.EMPIRE_GENERATION);
 if(examination.pending){const {readPendingState,validatePendingPlan}=await import('../scripts/work8/pending-restoration.mjs');validatePendingPlan(examination.pending,{capability:examination.nonce,source,expectedDigest:examination.pending.digest,state:readPendingState(process.env.DATABASE_PATH)});}
 process.env.MISSION_AUTHORITY_EXECUTOR_ENABLED='true';
 const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 process.env.SESSION_CONTINUITY_STORAGE_ROOT=path.relative(repo,path.join(examination.volume.root,'pillow-session-continuity'));
 process.env.VISUAL_MEMORY_STORAGE_ROOT=path.relative(repo,path.join(examination.volume.root,'pillow-visual-memory'));

 Object.defineProperty(globalThis,Symbol.for('work8.admitted.isolated.application'),{value:Object.freeze(examination),writable:false,configurable:false});
}
// Node will not load the application entrypoint before this ACK.
export function registerCaptureParticipant(value){
 if(participant||typeof value?.hold!=='function'||typeof value?.release!=='function')throw Error('CAPTURE_PARTICIPANT_REQUIRED');
 participant=value;send({action:'ready'});
}
