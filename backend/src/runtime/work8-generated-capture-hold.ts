import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import type {Work8RecoveryRequest,Work8RecoveryResult} from './work8-recovery-capture.js';

export type GeneratedCaptureScope=Readonly<{volumeRoot:string;captureRoot:string}>;
type HeldNotice=Readonly<{runId:string;directory:string;digest:string;expiresAt:number;bootAllowed:false;completeLiveState:false}>;
type ScopeState={runId:string;volumeDevice:number;volumeInode:number;captureDevice:number;captureInode:number;used:boolean;onHeld:(notice:HeldNotice)=>void|Promise<void>;timeoutMs:number};
const scopes=new WeakMap<GeneratedCaptureScope,ScopeState>();
function isolated(){
 assert.equal(process.env.NODE_ENV,'test','GENERATED_CAPTURE_TEST_ONLY');
 assert.equal(process.env.EMPIRE_ENGINEERING_TEST_MODE,'true','GENERATED_CAPTURE_ENGINEERING_ONLY');
 for(const name of ['RAILWAY_DEPLOYMENT_ID','RAILWAY_ENVIRONMENT','RAILWAY_ENVIRONMENT_NAME','VERCEL'])assert.ok(!process.env[name],'GENERATED_CAPTURE_DEPLOYMENT_REFUSED');
 for(const [name,value]of Object.entries(process.env))if(value&&/(?:API_KEY|ACCESS_TOKEN|SECRET_ACCESS_KEY|PROXY)$/i.test(name))throw Error('GENERATED_CAPTURE_EXTERNAL_CREDENTIAL');
 assert.equal(fs.readFileSync('/proc/net/route','utf8').trim().split('\n').length,1,'GENERATED_CAPTURE_NONLOCAL_ROUTE');
 assert.ok(fs.readFileSync('/proc/net/ipv6_route','utf8').trim().split('\n').every(row=>!row||row.trim().endsWith('lo')),'GENERATED_CAPTURE_NONLOCAL_ROUTE');
}
/** Source-side harness capability only. Creates NEW empty roots; never accepts
 * an existing volume/archive path. Cannot be serialized across process/IPC. */
export function createGeneratedCaptureScope(options:{onHeld:ScopeState['onHeld'];timeoutMs:number}):GeneratedCaptureScope{
 isolated();assert.equal(typeof options.onHeld,'function');assert.ok(Number.isSafeInteger(options.timeoutMs)&&options.timeoutMs>=100&&options.timeoutMs<=5000,'GENERATED_CAPTURE_HOLD_BOUND');
 const parent=fs.realpathSync(os.tmpdir()),run=fs.mkdtempSync(path.join(parent,'work8-generated-capture-'));
 fs.chmodSync(run,0o700);const volumeRoot=path.join(run,'volume'),captureRoot=path.join(run,'capture');fs.mkdirSync(volumeRoot,{mode:0o700});fs.mkdirSync(captureRoot,{mode:0o700});
 const scope=Object.freeze({volumeRoot,captureRoot});scopes.set(scope,{runId:randomUUID(),volumeDevice:fs.statSync(volumeRoot).dev,volumeInode:fs.statSync(volumeRoot).ino,captureDevice:fs.statSync(captureRoot).dev,captureInode:fs.statSync(captureRoot).ino,used:false,onHeld:options.onHeld,timeoutMs:options.timeoutMs});return scope;
}
export function assertGeneratedCaptureScope(scope:GeneratedCaptureScope,request:Work8RecoveryRequest,root:string):void{
 isolated();const state=scopes.get(scope);assert.ok(state&&!state.used,'GENERATED_CAPTURE_UNKNOWN_OR_CONSUMED');
 assert.equal(root,scope.volumeRoot,'GENERATED_CAPTURE_SOURCE_ROOT');assert.equal(fs.statSync(root).dev,state.volumeDevice);assert.equal(fs.statSync(root).ino,state.volumeInode);assert.equal(fs.statSync(scope.captureRoot).dev,state.captureDevice);assert.equal(fs.statSync(scope.captureRoot).ino,state.captureInode);assert.equal(fs.realpathSync(root),root);assert.equal(fs.realpathSync(scope.captureRoot),scope.captureRoot);
 assert.equal(path.dirname(request.destination),scope.captureRoot,'GENERATED_CAPTURE_DESTINATION');assert.equal(path.resolve(request.destination),request.destination);assert.ok(!fs.existsSync(request.destination),'GENERATED_CAPTURE_TARGET_EXISTS');assert.equal(request.requireComplete,false);
 for(const configured of [process.env.DATABASE_PATH,process.env.SHADOW_CEO_DATA_DIR,process.env.EMPIRE_DATA_DIR].filter(Boolean))assert.ok(path.resolve(configured!).startsWith(root+path.sep),'GENERATED_CAPTURE_FOREIGN_STORE');
}
/** Must be awaited INSIDE all existing capture fences. It never returns
 * successfully. Host termination is the only successful examination handoff;
 * timeout, callback failure and every local exit invalidate before releasing. */
export async function holdGeneratedCapture(scope:GeneratedCaptureScope,result:Work8RecoveryResult,actions:{seal:(result:Work8RecoveryResult)=>unknown;verify:(result:Work8RecoveryResult)=>unknown;invalidate:(directory:string)=>void}):Promise<never>{
 isolated();const state=scopes.get(scope);assert.ok(state&&!state.used,'GENERATED_CAPTURE_UNKNOWN_OR_CONSUMED');state.used=true;
 assert.equal(fs.statSync(scope.volumeRoot).dev,state.volumeDevice);assert.equal(fs.statSync(scope.volumeRoot).ino,state.volumeInode);assert.equal(fs.statSync(scope.captureRoot).dev,state.captureDevice);assert.equal(fs.statSync(scope.captureRoot).ino,state.captureInode);assert.equal(path.dirname(result.directory),scope.captureRoot);assert.equal(result.manifest.bootAllowed,false);assert.equal(result.manifest.completeLiveState,false);
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  actions.seal(result);actions.verify(result);
  const notice=Object.freeze({runId:state.runId,directory:result.directory,digest:result.digest,expiresAt:Date.now()+state.timeoutMs,bootAllowed:false as const,completeLiveState:false as const});
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('GENERATED_CAPTURE_HELD_EPOCH_EXPIRED')),state.timeoutMs);});
  const notified=(async()=>{await state.onHeld(notice);return await new Promise<never>(()=>{});})();
  return await Promise.race([notified,timeout]);
 }finally{
  if(timer)clearTimeout(timer);
  try{actions.invalidate(result.directory);}catch{
   // The sealed copy may survive. Never unwind the caller's fences. Keep the
   // process alive until its external examination controller terminates it.
   await new Promise<never>(()=>{setInterval(()=>{},1000);});
  }
 }
}
