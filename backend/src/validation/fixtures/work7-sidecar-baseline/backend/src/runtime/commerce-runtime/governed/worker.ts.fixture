import {z} from 'zod';
import {id,capacitySchema} from './contracts.js';
import {qualify,type CommerceState} from './engine.js';
import {GovernedCommerceEngine} from './engine.js';
import {digest} from './store.js';
import {acceptanceScenario} from './scenario.js';
export const preparationBatchSchema=z.object({id,missions:z.array(id).min(1).max(1000),reviewLimit:z.number().int().min(1).max(1000),capacity:capacitySchema,asins:z.record(z.string().regex(/^[A-Z0-9]{10}$/)).default({})}).strict();
export type Task={scopeKey?:string;listingKey?:string;batchId?:string;baseVersion?:number;requestDigest?:string;notBefore?:number;id:string;mission:string;workspace:string;owner:string;createdAt:number;cursor:number;fence:number;status:'PENDING'|'RUNNING'|'COMPLETE'|'BLOCKED';error:string|null;steps:ReturnType<typeof acceptanceScenario>['steps'];attempts:number;maxSteps:number;maxAttempts:number;paidInference:0};
/** Uses the runtime's single durable task table. No external writes, inference, polling loop or in-memory completion state. */
export class CommerceWorker {
 constructor(readonly engine:GovernedCommerceEngine){}
 /** Deterministic local reduction, before any model review; uses canonical qualification and Work5 economics. */
 screen(workspace:string,missions:string[],limit:number){
  return [...new Set(missions)].map(mission=>{const r=this.engine.store.history(workspace,mission).at(-1);if(!r)return {mission,version:0,qualified:false,priority:0,reasons:['MISSION_NOT_FOUND'],identity:null};
   const s=r.state as unknown as CommerceState,q=qualify(s.candidate,this.engine.clock());return {mission,version:r.version,qualified:q.qualified,priority:q.score/(1+q.exposure),reasons:q.reasons,identity:{productId:s.candidate.productId,sku:s.candidate.offer.sku,variantId:s.candidate.offer.variantId,warehouseId:s.candidate.offer.warehouseId,destination:s.candidate.offer.destination},commercialRationale:{score:q.score,exposure:q.exposure,netEstimate:q.economics.net,genuinelyProfitable:false}};
  }).sort((a,b)=>Number(b.qualified)-Number(a.qualified)||b.priority-a.priority||(a.mission<b.mission?-1:a.mission>b.mission?1:0)).map((r,i)=>({...r,selected:r.qualified&&i<limit}));
 }
 enqueuePreparationBatch(workspace:string,owner:string,raw:unknown){
  const b=preparationBatchSchema.parse(raw),requestDigest=digest(b);
  return this.engine.store.transaction(()=>{
   const previous=this.batchTasks(workspace,b.id);
   if(previous.length){if(previous.some(t=>t.owner!==owner||t.requestDigest!==requestDigest))throw Error('IDEMPOTENCY_CONFLICT');return previous;}
   const rows=this.screen(workspace,b.missions,b.reviewLimit),selected=rows.filter(r=>r.selected);
   const active=Number(this.engine.store.db.prepare("SELECT count(*) AS n FROM commerce_runtime_tasks WHERE workspace=? AND json_extract(record,'$.status') IN ('PENDING','RUNNING')").get(workspace)?.n??0);
   if(active+selected.length>1000)throw Error('QUEUE_BACKPRESSURE');
   if(!selected.length)throw Error('NO_QUALIFIED_CANDIDATES');
   const now=this.engine.clock(),scopeKey=digest({workspace,account:b.capacity.account,marketplace:b.capacity.marketplace}),spacing=Math.ceil(1000/Math.min(b.capacity.requestsPerSecond??1,5));
   const previousSlot=Number(this.engine.store.db.prepare("SELECT max(json_extract(record,'$.notBefore')) AS slot FROM commerce_runtime_tasks WHERE workspace=? AND json_extract(record,'$.scopeKey')=?").get(workspace,scopeKey)?.slot??(now-spacing));
   const firstSlot=Math.max(now,previousSlot+spacing);let newUsed=0,unsoldUsed=0;const created:Task[]=[];
   for(const row of selected){
    const state=this.engine.store.history(workspace,row.mission).at(-1)!.state as unknown as CommerceState;
    if(state.approval?.actor!==owner)throw Error('BATCH_OWNER_APPROVAL_REQUIRED');
    const capacity=structuredClone(b.capacity);
    if(capacity.mode==='EXISTING_ASIN_OFFER')capacity.asin=b.asins[row.mission]??null;
    if(capacity.newAsinRemaining!==null&&capacity.mode==='NEW_ASIN')capacity.newAsinRemaining=Math.max(0,capacity.newAsinRemaining-newUsed++);
    if(capacity.unsoldRemaining!==null)capacity.unsoldRemaining=Math.max(0,capacity.unsoldRemaining-unsoldUsed++);
    const listingKey=digest({workspace,account:capacity.account,marketplace:capacity.marketplace,sku:state.candidate.offer.sku});
    if(this.engine.store.db.prepare("SELECT id FROM commerce_runtime_tasks WHERE workspace=? AND json_extract(record,'$.listingKey')=? AND json_extract(record,'$.status')!='BLOCKED' LIMIT 1").get(workspace,listingKey))throw Error('DUPLICATE_LISTING_INTENT');
    const taskId='listing:'+digest({listingKey,batch:b.id});
    const t:Task={id:taskId,scopeKey,listingKey,batchId:b.id,requestDigest,baseVersion:row.version,mission:row.mission,workspace,owner,createdAt:now,cursor:0,fence:0,status:'PENDING',error:null,steps:[{actor:{id:'brain-commerce-interceptor',workspace,role:'EXECUTOR'},command:{type:'publication_intent',capacity}}],attempts:0,maxSteps:1,maxAttempts:1,paidInference:0,notBefore:firstSlot+created.length*spacing};
    this.engine.store.db.prepare('INSERT INTO commerce_runtime_tasks VALUES(?,?,?,?,?)').run(workspace,taskId,t.mission,JSON.stringify(t),0);created.push(t);
   }
   return created;
  });
 }
 batchTasks(workspace:string,id:string):Task[]{return this.engine.store.db.prepare("SELECT record FROM commerce_runtime_tasks WHERE workspace=? AND json_extract(record,'$.batchId')=? ORDER BY id").all(workspace,id).map(r=>JSON.parse(String(r.record)) as Task);}
 batchProgress(workspace:string,id:string){const tasks=this.batchTasks(workspace,id);return {id,total:tasks.length,intercepted:tasks.filter(t=>t.status==='COMPLETE').length,blocked:tasks.filter(t=>t.status==='BLOCKED').length,pending:tasks.filter(t=>['PENDING','RUNNING'].includes(t.status)).length,items:tasks.map(t=>({id:t.id,mission:t.mission,status:t.status,error:t.error})),externalEffects:0,classification:'SYNTHETIC_PREPARATION_ONLY'};}

 enqueue(workspace:string,owner:string,id:string):Task{
  return this.engine.store.transaction(()=>{const old=this.get(workspace,id);if(old){if(old.owner!==owner)throw Error('TASK_OWNER_MISMATCH');return old;}
   const now=this.engine.clock();const t:Task={id,mission:'acceptance:'+id,workspace,owner,createdAt:now,cursor:0,fence:0,status:'PENDING',error:null,steps:acceptanceScenario(workspace,owner,now).steps,attempts:0,maxSteps:32,maxAttempts:3,paidInference:0};
   this.engine.store.db.prepare('INSERT INTO commerce_runtime_tasks VALUES(?,?,?,?,?)').run(workspace,id,t.mission,JSON.stringify(t),0);return t;});
 }
 get(workspace:string,id:string):Task|null{const row=this.engine.store.db.prepare('SELECT record FROM commerce_runtime_tasks WHERE workspace=? AND id=?').get(workspace,id);return row?JSON.parse(String(row.record)) as Task:null;}
 list(workspace:string):Task[]{return this.engine.store.db.prepare('SELECT record FROM commerce_runtime_tasks WHERE workspace=? ORDER BY rowid DESC LIMIT 2000').all(workspace).map(x=>JSON.parse(String(x.record)) as Task);}
 nextReady(workspace:string):Task|null{const row=this.engine.store.db.prepare("SELECT record FROM commerce_runtime_tasks WHERE workspace=? AND json_extract(record,'$.status') IN ('PENDING','RUNNING') AND coalesce(json_extract(record,'$.notBefore'),0)<=? ORDER BY rowid LIMIT 1").get(workspace,this.engine.clock());return row?JSON.parse(String(row.record)) as Task:null;}
 tick(workspace:string,id:string,expectedFence:number):Task{
  const task=this.get(workspace,id);if(!task)throw Error('TASK_NOT_FOUND');if(task.fence!==expectedFence)throw Error('TASK_FENCE_CONFLICT');if(task.status==='COMPLETE')return task;if(task.status==='BLOCKED')throw Error('TASK_BLOCKED_REVIEW_REQUIRED');if((task.notBefore??0)>this.engine.clock())return task;
  if(task.cursor>=task.maxSteps||task.attempts>=task.maxAttempts)throw Error('TASK_BOUND_EXCEEDED');
  const step=task.steps[task.cursor];if(!step)throw Error('TASK_CORRUPT');
  // A crash after receipt commit but before cursor commit replays the same immutable command ID.
  try{this.engine.execute(step.actor,{id:digest({task:id,step:task.cursor}),missionId:task.mission,expectedVersion:(task.baseVersion??0)+task.cursor,command:step.command});task.cursor++;task.status=task.cursor===task.steps.length?'COMPLETE':'RUNNING';task.error=null;}
  catch(e){task.attempts++;task.status='BLOCKED';task.error=e instanceof Error&&/^[A-Z_]+$/.test(e.message)?e.message:'TASK_INPUT_INVALID';}
  task.fence++;const result=this.engine.store.db.prepare('UPDATE commerce_runtime_tasks SET record=?,version=? WHERE workspace=? AND id=? AND version=?').run(JSON.stringify(task),task.fence,workspace,id,expectedFence);if(Number(result.changes)!==1)throw Error('TASK_FENCE_CONFLICT');return task;
 }
 runBounded(workspace:string,id:string,steps=4){let t=this.get(workspace,id);if(!t)throw Error('TASK_NOT_FOUND');for(let i=0;i<Math.min(steps,4)&&!['COMPLETE','BLOCKED'].includes(t.status);i++)t=this.tick(workspace,id,t.fence);return t;}
}
