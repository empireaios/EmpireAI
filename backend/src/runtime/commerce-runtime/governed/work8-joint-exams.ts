import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
// @ts-ignore Existing canonical control plane is JavaScript.
import {AssuranceControlPlane} from '../../../assurance/control-plane.mjs';
import {GovernedCommerceStore,digest} from './store.js';
import {GovernedCommerceEngine,type CommerceState} from './engine.js';
import {CommerceWorker} from './worker.js';
import {projectWork8Finance,type Work8FinanceEvent} from './work8-finance.js';
const ensure=(v:boolean,code:string)=>{if(!v)throw Error('JOINT_EXAM_'+code);};
export async function runWork8JointExams(seed=83){
 if(!Number.isSafeInteger(seed)||seed<0||seed>1000000)throw Error('JOINT_EXAM_SEED');
 const root=mkdtempSync(join(tmpdir(),'empire-work8-joint-'));const filename=join(root,'commerce.sqlite');const workspace='synthetic:work8:joint:'+seed;const taskId='joint-'+seed;const now=Date.parse('2026-10-11T00:00:00Z')+seed*1000;
 let store=new GovernedCommerceStore(filename);let engine=new GovernedCommerceEngine(store,()=>now);let worker=new CommerceWorker(engine);let repairs=0,forbiddenRepairs=0;
 let task=worker.enqueue(workspace,'synthetic-owner',taskId);const missionId=task.mission;const orderId='order-fixture';
 const timeout=task.steps.find(s=>s.command.type==='intercept')!;if(timeout.command.type==='intercept'){timeout.command.result='TIMEOUT';timeout.command.acceptedQuantity=0;}
 store.transaction(()=>store.db.prepare('UPDATE commerce_runtime_tasks SET record=? WHERE workspace=? AND id=? AND version=0').run(JSON.stringify(task),workspace,taskId));
 const history=()=>store.history(workspace,missionId);const freshTask=()=>worker.get(workspace,taskId)!;
 const common=()=>({workspace,missionId,taskId,orderId,sourceReceiptDigest:history().at(-1)?.digest??null,cursor:freshTask().cursor,historyLength:history().length,observedAt:now});
 const runbooks={
  resume:{version:'joint-v1',authority:'A',capability:'commerce-worker',maxAttempts:1,cooldownMs:0,timeoutMs:1000,
   execute:(context:{workspace:string})=>{ensure(context.workspace===workspace,'SCOPE');const t=freshTask();const h=history();ensure(t.cursor===4&&h.length===5&&h.at(-1)?.command.type==='intake','RESUME_PRECONDITION');repairs++;const r=worker.tick(workspace,taskId,t.fence);return {missionId,taskId,cursor:r.cursor};},
   verify:()=>{const t=freshTask();const h=history();return {healthy:t.cursor===5&&h.length===5&&t.status==='RUNNING',...common(),receiptDigests:h.map(r=>r.digest)};}},
  forbiddenSupplier:{version:'joint-v1',authority:'C',capability:'supplier-outcome',maxAttempts:1,cooldownMs:0,timeoutMs:1000,execute:()=>{forbiddenRepairs++;throw Error('FORBIDDEN');},verify:()=>({healthy:false})},
  forbiddenFinance:{version:'joint-v1',authority:'C',capability:'financial-integrity',maxAttempts:1,cooldownMs:0,timeoutMs:1000,execute:()=>{forbiddenRepairs++;throw Error('FORBIDDEN');},verify:()=>({healthy:false})},
 };
 const cp=new AssuranceControlPlane({root,now:()=>now,revision:'work8-joint-local',runbooks});
 const checks:Array<{name:string;passed:boolean}>=[];const check=(name:string,passed:boolean)=>{checks.push({name,passed});ensure(passed,name);};
 const observe=(id:string,capability:string,runbookId:string,classification:string,evidence:Record<string,unknown>)=>cp.observe(workspace,{id,capability,runbookId,classification,synthetic:true,status:'FAILED',severity:'HIGH',summary:'Joint examination '+id,evidence:{...common(),...evidence}});
 try{
  task=worker.runBounded(workspace,taskId,4);const step=task.steps[4]!;
  engine.execute(step.actor,{id:digest({task:taskId,step:4}),missionId,expectedVersion:4,command:step.command});const prefix=history().map(r=>r.digest);
  store.close();store=new GovernedCommerceStore(filename);engine=new GovernedCommerceEngine(store,()=>now);worker=new CommerceWorker(engine);
  check('real_receipt_cursor_gap',history().length===freshTask().cursor+1);
  const crash=observe('receipt-cursor-gap','commerce-worker','resume','WORKER_CRASH',{prefix});const recovered=await cp.recover(workspace,crash.id);
  check('actual_worker_recovered',recovered.status==='VERIFIED'&&repairs===1&&freshTask().cursor===5&&digest(history().map(r=>r.digest))===digest(prefix));
  await cp.recover(workspace,crash.id);check('recovery_not_replayed',repairs===1);
  task=worker.tick(workspace,taskId,freshTask().fence);task=worker.tick(workspace,taskId,task.fence);
  const source=history().at(-1)!;const state=source.state as unknown as CommerceState;
  check('actual_supplier_unknown',state.orders[orderId]?.outcome==='UNKNOWN'&&state.orders[orderId]?.accepted===0);
  const containedDigest=digest({history:history(),task:freshTask()});const uncertain=observe('supplier-timeout','supplier-outcome','forbiddenSupplier','OUTCOME_UNKNOWN',{providerId:state.orders[orderId]!.providerId,proposedAction:'Automatic resubmission forbidden'});
  const containment=await cp.recover(workspace,uncertain.id);await cp.recover(workspace,uncertain.id);
  check('unknown_supplier_contained',containment.status==='NO_RUNBOOK'&&cp.get(workspace,'incident',uncertain.id).status==='UNRESOLVED'&&forbiddenRepairs===0&&digest({history:history(),task:freshTask()})===containedDigest);
  const financialId='joint-financial-'+seed;const financialEvents:Work8FinanceEvent[]=[{id:financialId,orderId,sourceReceiptDigest:source.digest,kind:'SALE',minor:8000,currency:'SGD',classification:'SIMULATION',assumptionRef:'synthetic:pre-registered-financial-scenario',at:new Date(now).toISOString()}];
  const corrupted=[...financialEvents,{...financialEvents[0]!,minor:8001}];let detector='';try{projectWork8Finance(store,workspace,missionId,corrupted,new Date(now).toISOString());}catch(e){detector=(e as Error).message;}
  check('financial_conflict_detected',detector==='FINANCE_IDEMPOTENCY_CONFLICT');const financialBefore=digest(financialEvents);
  const finance=observe('financial-source-conflict','financial-integrity','forbiddenFinance','FINANCIAL_DISCREPANCY',{financialEventId:financialId,sourceDigest:financialBefore,injectedDigest:digest(corrupted),detector});const denied=await cp.recover(workspace,finance.id);
  check('financial_repair_denied',denied.status==='NO_RUNBOOK'&&forbiddenRepairs===0&&digest(financialEvents)===financialBefore&&digest({history:history(),task:freshTask()})===containedDigest);
  check('authority_effect_invariants',history().every(r=>r.externalEffects===0)&&state.externalEffects===0&&state.paidInference===0&&state.orders[orderId]!.order.integrationMode==='SANDBOX');
  const audit=cp.db.prepare('SELECT seq,at,type,body FROM cp_events WHERE workspace=? ORDER BY seq').all(workspace).map((r:any)=>({...r,body:JSON.parse(r.body)}));
  check('shared_identity_audit',audit.filter((e:any)=>e.type==='INCIDENT_DETECTED').length===3&&audit.filter((e:any)=>e.type==='INCIDENT_DETECTED').every((e:any)=>e.body.probe.evidence.missionId===missionId&&e.body.probe.evidence.orderId===orderId));
  return {schema:'work8-joint-exam-v1',seed,result:'PASS',root,workspace,missionId,taskId,orderId,checks,repairs,forbiddenRepairs,financialEvents,corruptedFinancialEvents:corrupted,sourceReceiptDigest:source.digest,receipts:history(),task:freshTask(),incidents:cp.list(workspace,'incident'),recoveries:cp.list(workspace,'recovery'),audit,paidInference:0,externalEffects:0,classification:'SYNTHETIC_INTEGRATED_EXAM',timeMode:'VIRTUAL',limitations:['Local runbooks only; not registered for production','No live provider, paid inference, UI or complete Work 8 certification']};
 }finally{cp.close();store.close();}
}
