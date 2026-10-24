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
let admitted=false,participant,capture=null;
let resolveAdmission,rejectAdmission;
const admission=new Promise((resolve,reject)=>{resolveAdmission=resolve;rejectAdmission=reject;});
const deadline=setTimeout(()=>{rejectAdmission(Error('DURABLE_ADMISSION_ACK_TIMEOUT'));fatal();},5000);
process.on('message',message=>{
 if(!message||message.protocol!==protocol)return;
 if(message.id!==id||message.nonce!==nonce)return fatal();
 if(message.action==='admitted'&&!admitted){admitted=true;clearTimeout(deadline);resolveAdmission();return;}
 if(!admitted||!participant)return fatal();
 if(message.action==='hold'&&!capture){capture=message.capture;Promise.resolve().then(()=>participant.hold()).then(()=>send({action:'held',capture}),fatal);return;}
 if(message.action==='release'&&capture===message.capture){const held=capture;Promise.resolve().then(()=>participant.release()).then(()=>{capture=null;send({action:'released',capture:held});},fatal);return;}
 fatal();
});
send({action:'enroll'});
await admission; // Node will not load the application entrypoint before this ACK.
export function registerCaptureParticipant(value){
 if(participant||typeof value?.hold!=='function'||typeof value?.release!=='function')throw Error('CAPTURE_PARTICIPANT_REQUIRED');
 participant=value;send({action:'ready'});
}
