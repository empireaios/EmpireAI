import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import type {EmpireApp} from '../app.js';
import {assertGeneratedCaptureScope,type GeneratedCaptureScope} from './work8-generated-capture-hold.js';
let prepared:{application:EmpireApp;inventory:unknown}|undefined;
let registration:{scope:GeneratedCaptureScope;source:string;runId:string;used:boolean}|undefined;
export function registerGeneratedWorkerLifecycle(scope:GeneratedCaptureScope,source:string,runId:string){
 assert.equal(registration,undefined);assert.match(source,/^[a-f0-9]{40}$/);assert.match(runId,/^[a-f0-9-]{36}$/);
 assertGeneratedCaptureScope(scope,{destination:scope.captureRoot+'/capture',sourceCommit:source,frontendRevision:source,requireComplete:false},scope.volumeRoot);
 registration={scope,source,runId,used:false};
}
/** No-op for normal startup; never replaces persistence guards or boot checks. */
export async function initializeGeneratedWorkerIfRegistered(application:EmpireApp){
 if(!registration)return;const r=registration;assert.equal(r.used,false);r.used=true;
 const moduleUrl=pathToFileURL(path.resolve(import.meta.dirname,'../../../scripts/work8/hh4-domain-state.mjs')).href;
 const {initializeActualGeneratedDomains}=await import(moduleUrl);
 const inventory=await initializeActualGeneratedDomains(application,r.scope.volumeRoot,r.source);
 prepared={application,inventory};
}
/** Called only after actual index startup installs its final declared participants. */
export function publishGeneratedWorkerReadyIfRegistered(){
 if(!registration)return;const r=registration;assert.ok(prepared);const {application,inventory}=prepared;prepared=undefined;
 let capturing=false;
 process.on('message',message=>{const m=message as {action?:string;runId?:string;source?:string};if(m.action!=='hh4-capture')return;
  if(capturing||m.runId!==r.runId||m.source!==r.source){process.send?.({event:'hh4-failed',runId:r.runId,source:r.source,error:'CAPTURE_MESSAGE_REFUSED'});return;}capturing=true;
  void application.captureWork8Recovery({destination:r.scope.captureRoot+'/capture',sourceCommit:r.source,frontendRevision:r.source,requireComplete:false,captureRepositoryLifecycle:true},r.scope).then(()=>{throw Error('HELD_CAPTURE_RETURNED');}).catch(error=>{process.send?.({event:'hh4-failed',runId:r.runId,source:r.source,error:String(error)});});
 });
 process.send?.({event:'hh4-worker-ready',runId:r.runId,source:r.source,inventory,stage:'ACTUAL_INDEX_STARTUP_COMPLETE'});
}
