import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import type {EmpireApp} from '../app.js';
import type {Work8RecoveryRequest,Work8RecoveryResult} from './work8-recovery-capture.js';
import {TaskQueue} from '../brain/task-queue.js';
import {getActiveMembershipCapture} from './work8-primary-capture.js';
const protocol='work8-isolated-application-v1';
type Grant={schema:string;source:string;generation:string;nonce:string;mode:'source'|'target'|'restart';expiresAt:number;volume:{root:string;dev:number;ino:number};redis:{host:string;port:number;db:number;runId:string};captureDirectory:string;pending?:unknown;recipient:{id:string;nonce:string;pid:number;startTicks:string;role:string}};
export type AdmittedCaptureScope=Readonly<{kind:'admitted-isolated';destination:string}>;
const scopes=new WeakMap<AdmittedCaptureScope,{grant:Grant;used:boolean}>();
let application:EmpireApp|undefined,inventory:unknown,capturing=false,release:(()=>void)|undefined,releasedDigest:string|undefined;
export function admittedApplicationGrant():Grant|undefined{
 const g=(globalThis as Record<symbol,unknown>)[Symbol.for('work8.admitted.isolated.application')] as Grant|undefined;
 if(!g)return undefined;
 assert.equal(g.schema,protocol);assert.equal(g.recipient.role,'brain-worker');assert.equal(process.env.WORK8_MEMBERSHIP_ROLE,'brain-worker');assert.equal(g.recipient.pid,process.pid);assert.equal(g.recipient.id,process.env.WORK8_MEMBERSHIP_ID);assert.equal(g.recipient.nonce,process.env.WORK8_MEMBERSHIP_NONCE);
 assert.equal(g.source,process.env.RAILWAY_GIT_COMMIT_SHA);assert.equal(g.generation,process.env.EMPIRE_GENERATION);assert.equal(g.volume.root,process.env.RAILWAY_VOLUME_MOUNT_PATH);assert.equal(fs.realpathSync(g.volume.root),g.volume.root);
 const st=fs.statSync(g.volume.root);assert.equal(st.dev,g.volume.dev);assert.equal(st.ino,g.volume.ino);assert.equal(process.env.WORK8_REAL_GRAPH,'1');assert.ok(process.connected&&process.send);return g;
}
const send=(event:string,payload:Record<string,unknown>={})=>{const g=admittedApplicationGrant()!;process.send!({protocol,event,id:g.recipient.id,nonce:g.nonce,...payload});};
export function isAdmittedCaptureScope(scope:unknown):scope is AdmittedCaptureScope{return !!scope&&typeof scope==='object'&&scopes.has(scope as AdmittedCaptureScope);}
export function assertAdmittedCaptureScope(scope:AdmittedCaptureScope,request:Work8RecoveryRequest,root:string){
 const s=scopes.get(scope);assert.ok(s&&!s.used);assert.equal(admittedApplicationGrant(),s.grant);assert.equal(s.grant.mode,'source');assert.equal(root,s.grant.volume.root);assert.equal(request.destination,scope.destination);assert.equal(request.sourceCommit,s.grant.source);assert.equal(request.requireComplete,false);assert.ok(!fs.existsSync(scope.destination));
}
export async function holdAdmittedCapture(scope:AdmittedCaptureScope,result:Work8RecoveryResult,actions:{seal:(r:Work8RecoveryResult)=>unknown;verify:(r:Work8RecoveryResult)=>unknown;invalidate:(d:string)=>void}){
 const s=scopes.get(scope);assert.ok(s&&!s.used);s.used=true;assert.equal(result.directory,s.grant.captureDirectory);
 const membership=getActiveMembershipCapture();assert.equal(membership?.source,s.grant.source);assert.equal(membership?.generation,s.grant.generation);assert.ok(Array.isArray(membership?.members));
 actions.seal(result);actions.verify(result);const expiresAt=Date.now()+5000;let timer:ReturnType<typeof setTimeout>|undefined;
 try{await new Promise<void>((resolve,reject)=>{release=resolve;timer=setTimeout(()=>reject(Error('ORIGINAL_ADMITTED_HOLD_EXPIRED')),5000);send('held',{digest:result.digest,directory:result.directory,membershipReceipt:membership,expiresAt,bootAllowed:false,completeLiveState:false});});assert.equal(releasedDigest,result.digest);assert.ok(Date.now()<expiresAt);actions.verify(result);send('released',{digest:result.digest,operatorCopyRequired:true});}
 catch(error){actions.invalidate(result.directory);throw error;}
 finally{if(timer)clearTimeout(timer);release=undefined;}
}
export async function initializeAdmittedApplicationIfPresent(app:EmpireApp){
 const g=admittedApplicationGrant();if(!g)return;assert.equal(application,undefined);assert.ok(Date.now()<g.expiresAt);application=app;
 assert.ok(app.brain.taskQueue instanceof TaskQueue);const client=await app.brain.taskQueue.queue.client;const runId=(await client.info('server')).match(/^run_id:([a-f0-9]{40})\r?$/m)?.[1];assert.equal(runId,g.redis.runId);assert.equal(g.redis.db,0);
 if(g.mode==='source'){
  const file=path.resolve(import.meta.dirname,'../../../scripts/work8/hh4-domain-state.mjs');
  const {initializeAdmittedGeneratedDomains}=await import(pathToFileURL(file).href);
  inventory=await initializeAdmittedGeneratedDomains(app,g.volume.root,g.source);send('initialized',{inventory});
 }
}
export async function publishAdmittedApplicationReadyIfPresent(){
 const g=admittedApplicationGrant();if(!g)return;assert.ok(application);const app=application;
 const {getPillowHost}=await import('../orchestration/pillow-host/pillow-host.js');
 while(getPillowHost().getStatus().lifecycle!=='running'){assert.ok(Date.now()<g.expiresAt,'ORIGINAL_APPLICATION_STARTUP_DEADLINE');await new Promise(r=>setTimeout(r,100));}
 const {persistDatabase}=await import('../brain/database.js');await persistDatabase();send('persisted',{mode:g.mode});
 process.on('message',message=>{const m=message as Record<string,unknown>;if(m?.protocol!==protocol)return;
  try{assert.equal(m.nonce,g.nonce);assert.equal(m.id,g.recipient.id);assert.equal(g.mode,'source');
   if(m.action==='release'){assert.ok(release);assert.equal(m.operatorCopySealed,true);assert.equal(typeof m.digest,'string');releasedDigest=m.digest as string;release();return;}
   assert.equal(m.action,'capture');assert.equal(capturing,false);capturing=true;assert.ok(Date.now()<g.expiresAt);
   const scope=Object.freeze({kind:'admitted-isolated' as const,destination:g.captureDirectory});scopes.set(scope,{grant:g,used:false});
   void app.captureWork8Recovery({destination:g.captureDirectory,sourceCommit:g.source,frontendRevision:g.source,requireComplete:false,captureRepositoryLifecycle:true},scope).catch(error=>{send('failure',{error:String(error)});});
  }catch(error){send('failure',{error:String(error)});}
 });
 send('ready',{mode:g.mode,...(inventory?{inventory}:{})});
}
