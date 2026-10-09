import {GovernedCommerceEngine} from './engine.js';
import {digest} from './store.js';
import {acceptanceScenario} from './scenario.js';
export type Task={id:string;mission:string;workspace:string;owner:string;createdAt:number;cursor:number;fence:number;status:'PENDING'|'RUNNING'|'COMPLETE'|'BLOCKED';error:string|null;steps:ReturnType<typeof acceptanceScenario>['steps'];attempts:number;maxSteps:number;maxAttempts:number;paidInference:0};
/** Uses the runtime's single durable task table. No external writes, inference, polling loop or in-memory completion state. */
export class CommerceWorker {
 constructor(readonly engine:GovernedCommerceEngine){}
 enqueue(workspace:string,owner:string,id:string):Task{
  return this.engine.store.transaction(()=>{const old=this.get(workspace,id);if(old){if(old.owner!==owner)throw Error('TASK_OWNER_MISMATCH');return old;}
   const now=this.engine.clock();const t:Task={id,mission:'acceptance:'+id,workspace,owner,createdAt:now,cursor:0,fence:0,status:'PENDING',error:null,steps:acceptanceScenario(workspace,owner,now).steps,attempts:0,maxSteps:32,maxAttempts:3,paidInference:0};
   this.engine.store.db.prepare('INSERT INTO commerce_runtime_tasks VALUES(?,?,?,?,?)').run(workspace,id,t.mission,JSON.stringify(t),0);return t;});
 }
 get(workspace:string,id:string):Task|null{const row=this.engine.store.db.prepare('SELECT record FROM commerce_runtime_tasks WHERE workspace=? AND id=?').get(workspace,id);return row?JSON.parse(String(row.record)) as Task:null;}
 list(workspace:string):Task[]{return this.engine.store.db.prepare('SELECT record FROM commerce_runtime_tasks WHERE workspace=? ORDER BY rowid DESC LIMIT 100').all(workspace).map(x=>JSON.parse(String(x.record)) as Task);}
 tick(workspace:string,id:string,expectedFence:number):Task{
  const task=this.get(workspace,id);if(!task)throw Error('TASK_NOT_FOUND');if(task.fence!==expectedFence)throw Error('TASK_FENCE_CONFLICT');if(task.status==='COMPLETE')return task;if(task.status==='BLOCKED')throw Error('TASK_BLOCKED_REVIEW_REQUIRED');
  if(task.cursor>=task.maxSteps||task.attempts>=task.maxAttempts)throw Error('TASK_BOUND_EXCEEDED');
  const step=task.steps[task.cursor];if(!step)throw Error('TASK_CORRUPT');
  // A crash after receipt commit but before cursor commit replays the same immutable command ID.
  try{this.engine.execute(step.actor,{id:digest({task:id,step:task.cursor}),missionId:task.mission,expectedVersion:task.cursor,command:step.command});task.cursor++;task.status=task.cursor===task.steps.length?'COMPLETE':'RUNNING';task.error=null;}
  catch(e){task.attempts++;task.status='BLOCKED';task.error=e instanceof Error&&/^[A-Z_]+$/.test(e.message)?e.message:'TASK_INPUT_INVALID';}
  task.fence++;const result=this.engine.store.db.prepare('UPDATE commerce_runtime_tasks SET record=?,version=? WHERE workspace=? AND id=? AND version=?').run(JSON.stringify(task),task.fence,workspace,id,expectedFence);if(Number(result.changes)!==1)throw Error('TASK_FENCE_CONFLICT');return task;
 }
 runBounded(workspace:string,id:string,steps=4){let t=this.get(workspace,id);if(!t)throw Error('TASK_NOT_FOUND');for(let i=0;i<Math.min(steps,4)&&!['COMPLETE','BLOCKED'].includes(t.status);i++)t=this.tick(workspace,id,t.fence);return t;}
}
