import {digest,GovernedCommerceStore} from '../runtime/commerce-runtime/governed/store.js';
import {CommerceWorker,type Task} from '../runtime/commerce-runtime/governed/worker.js';
import type {CommerceState} from '../runtime/commerce-runtime/governed/engine.js';
const runbookId='work8_checkpoint_replay';
type Context={workspace:string;incident:{probeId:string};result?:unknown};
type Gap={probeId:string;taskId:string;missionId:string;cursor:number;fence:number;prefixDigest:string;receiptDigest:string};
type Probe={id:string;capability:string;classification:string;severity:string;status:'FAILED'|'BLOCKED'|'HEALTHY';summary:string;runbookId:string|null;evidence:{taskId:string;missionId:string;cursor:number;fence:number;prefixDigest:string;receiptDigest:string|null;observedAt:number;externalEffects:number;probeId?:string}};
/** Only reconciles a durable task cursor with an already committed exact receipt.
 * It cannot create an approval, task, receipt, provider call or fresh commerce step. */
export function makeWork8CommerceRecovery({store,worker,now=Date.now}:{store:GovernedCommerceStore;worker:CommerceWorker;now?:()=>number}){
 if(worker.engine.store!==store)throw Error('CHECKPOINT_STORE_MISMATCH');
 const probeId=(workspace:string,id:string)=>'work8-checkpoint:'+digest({workspace,id});
 function gap(workspace:string,task:Task):Gap|null{
  if(!['RUNNING','PENDING'].includes(task.status)||task.cursor>=task.steps.length||task.attempts!==0)return null;
  const history=store.history(workspace,task.mission),base=task.baseVersion??0;
  if(history.length!==base+task.cursor+1)return null;
  const receipt=history.at(-1)!;
  if(receipt.id!==digest({task:task.id,step:task.cursor})||receipt.classification!=='SYNTHETIC'||receipt.externalEffects!==0)throw Error('CHECKPOINT_RECEIPT_MISMATCH');
  const state=receipt.state as unknown as CommerceState;
  if(state.externalEffects!==0||state.paidInference!==0||Object.values(state.orders).some(o=>['UNKNOWN','RECONCILIATION_REQUIRED'].includes(o.outcome)))throw Error('CHECKPOINT_UNCERTAIN_COMMERCE');
  return {probeId:probeId(workspace,task.id),taskId:task.id,missionId:task.mission,cursor:task.cursor,fence:task.fence,prefixDigest:digest(history),receiptDigest:receipt.digest};
 }
 function matching(workspace:string,id:string){
  const task=worker.list(workspace).find(t=>probeId(workspace,t.id)===id);if(!task)throw Error('CHECKPOINT_TASK_NOT_FOUND');
  const current=gap(workspace,task);if(!current)throw Error('CHECKPOINT_REPLAY_NOT_REQUIRED');return current;
 }
 return {
  probes(workspace:string){return worker.list(workspace).flatMap<Probe>(task=>{
   const history=store.history(workspace,task.mission),latest=history.at(-1);
   const common={id:probeId(workspace,task.id),capability:'commerce-checkpoint',classification:'COMMITTED_RECEIPT_CURSOR_GAP',severity:'HIGH'};
   const state=latest?.state as unknown as CommerceState|undefined;
   const evidence={taskId:task.id,missionId:task.mission,cursor:task.cursor,fence:task.fence,prefixDigest:digest(history),receiptDigest:latest?.digest??null,observedAt:now(),externalEffects:0};
   // A coherent progress marker does not resolve an unknown commercial effect.
   if(task.status==='BLOCKED'||state&&Object.values(state.orders).some(o=>['UNKNOWN','RECONCILIATION_REQUIRED'].includes(o.outcome)))return [{...common,status:'BLOCKED',summary:'Commerce outcome or task remains unresolved; checkpoint repair cannot resolve it.',evidence,runbookId:null}];
   const current=gap(workspace,task);
   if(current)return [{...common,runbookId,status:'FAILED',summary:'A saved commerce step completed before its progress checkpoint; safe replay can reconcile progress.',evidence:{...evidence,...current}}];
   if(!latest)return [];
   // get/list have verified every committed planned actor/command and history
   // digest. A fresh aligned read can close an incident when the normal worker
   // reconciled it before Assurance, without executing another step.
   const aligned=history.length===(task.baseVersion??0)+task.cursor||task.status==='COMPLETE';
   if(!aligned)return [{...common,status:'BLOCKED',summary:'Checkpoint does not match verified history; independent review required.',evidence,runbookId:null}];
   return [{...common,status:'HEALTHY',summary:'Saved task progress matches independently verified commerce receipts.',evidence,runbookId:null}];
  });},
  runbook:{version:'work8-checkpoint-v1',authority:'A',capability:'commerce-checkpoint',maxAttempts:1,cooldownMs:1000,timeoutMs:1000,
   execute(context:Context){
    const before=matching(context.workspace,context.incident.probeId);
    // No await between validation and tick: another SQLite writer is still
    // fenced by the unchanged expected cursor version and idempotent receipt.
    const after=worker.tick(context.workspace,before.taskId,before.fence);
    if(after.cursor!==before.cursor+1||after.fence!==before.fence+1||digest(store.history(context.workspace,before.missionId))!==before.prefixDigest)throw Error('CHECKPOINT_REPLAY_POSTCONDITION');
    return {...before,reconciledCursor:after.cursor,reconciledFence:after.fence,externalEffects:0};
   },
   verify(context:Context){
    const r=context.result as (Gap&{reconciledCursor:number;reconciledFence:number})|undefined;
    if(!r||r.probeId!==context.incident.probeId)return {healthy:false,reason:'CHECKPOINT_RESULT_IDENTITY'};
    const task=worker.get(context.workspace,r.taskId);const history=store.history(context.workspace,r.missionId);
    return {healthy:Boolean(task&&task.mission===r.missionId&&task.cursor===r.reconciledCursor&&task.fence===r.reconciledFence&&digest(history)===r.prefixDigest&&history.at(-1)?.digest===r.receiptDigest),observedAt:now(),taskId:r.taskId,missionId:r.missionId,receiptDigest:history.at(-1)?.digest??null,historyDigest:digest(history),externalEffects:0};
   },
  },
 };
}
