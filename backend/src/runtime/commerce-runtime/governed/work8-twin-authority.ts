import {z} from 'zod';
import {digest} from './store.js';
import {Work8TwinSessions} from './work8-twin.js';
import type {CommerceWorker} from './worker.js';
const key=z.string().min(1).max(100).regex(/^[A-Za-z0-9_.:-]+$/);
export const twinAuthorityRequest=z.discriminatedUnion('action',[
 z.object({action:z.literal('GRANT'),id:key,sessionId:key,expectedVersion:z.number().int().nonnegative(),mode:z.enum(['ONE_TASK','FIFTEEN_MINUTES','ONE_HOUR']),taskId:key.optional()}).strict(),
 z.object({action:z.literal('REVOKE'),id:key,sessionId:key,expectedVersion:z.number().int().positive()}).strict(),
]);
type Principal={workspace:string;owner:string};
type Grant={id:string;sessionId:string;owner:string;workspace:string;version:number;action:'GRANT'|'REVOKE';mode?:'ONE_TASK'|'FIFTEEN_MINUTES'|'ONE_HOUR';taskId?:string;expiresAt:number;at:number;requestDigest:string;previous:string;digest:string;scope:'TWIN_SCHEDULER_ONLY'};
export class Work8TwinAuthority{
 constructor(readonly sessions:Work8TwinSessions,readonly worker:CommerceWorker){sessions.store.db.exec(`CREATE TABLE IF NOT EXISTS work8_twin_authority(workspace TEXT NOT NULL,session TEXT NOT NULL,version INTEGER NOT NULL,request TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(workspace,session,version),UNIQUE(workspace,request));
 CREATE TRIGGER IF NOT EXISTS immutable_twin_authority_update BEFORE UPDATE ON work8_twin_authority BEGIN SELECT RAISE(ABORT,'IMMUTABLE_TWIN_AUTHORITY');END;
 CREATE TRIGGER IF NOT EXISTS immutable_twin_authority_delete BEFORE DELETE ON work8_twin_authority BEGIN SELECT RAISE(ABORT,'IMMUTABLE_TWIN_AUTHORITY');END;`);}
 private history(p:Principal,sessionId:string){this.sessions.read(p,sessionId);let previous='',version=0;const rows=this.sessions.store.db.prepare('SELECT record FROM work8_twin_authority WHERE workspace=? AND session=? ORDER BY version LIMIT 1001').all(p.workspace,sessionId);if(rows.length>1000)throw Error('TWIN_AUTHORITY_BOUND');return rows.map(row=>{const r=JSON.parse(String(row.record)) as Grant,{digest:hash,...body}=r;if(r.owner!==p.owner||r.workspace!==p.workspace||r.sessionId!==sessionId||r.previous!==previous||r.version!==++version||digest(body)!==hash||r.scope!=='TWIN_SCHEDULER_ONLY')throw Error('TWIN_AUTHORITY_UNVERIFIED');previous=hash;return r;});}
 read(p:Principal,sessionId:string){const grant=this.history(p,sessionId).at(-1),session=this.sessions.read(p,sessionId),now=this.worker.engine.clock();const task=grant?.taskId?this.worker.get(session.twinWorkspace,grant.taskId):null;return {grant:grant??null,version:grant?.version??0,status:!grant?'NOT_GRANTED':grant.action==='REVOKE'?'REVOKED':grant.expiresAt<=now?'EXPIRED':grant.mode==='ONE_TASK'&&(!task||['COMPLETE','BLOCKED'].includes(task.status))?'CONSUMED':'ACTIVE',scope:'TWIN_SCHEDULER_ONLY',externalEffects:0};}
 command(p:Principal,raw:unknown){const r=twinAuthorityRequest.parse(raw);return this.sessions.store.transaction(()=>{const history=this.history(p,r.sessionId),old=history.find(x=>x.id===r.id),requestDigest=digest({p,r});if(old){if(old.requestDigest!==requestDigest)throw Error('TWIN_AUTHORITY_IDEMPOTENCY');return old;}if(history.length>=1000)throw Error('TWIN_AUTHORITY_BOUND');const last=history.at(-1);if((last?.version??0)!==r.expectedVersion)throw Error('TWIN_AUTHORITY_VERSION');
 const session=this.sessions.read(p,r.sessionId);if(session.status==='ARCHIVED'&&r.action==='GRANT')throw Error('TWIN_AUTHORITY_ARCHIVED');
 if(r.action==='GRANT'){if((r.mode==='ONE_TASK')!==Boolean(r.taskId))throw Error('TWIN_AUTHORITY_TASK_SCOPE');if(r.taskId){const task=this.worker.get(session.twinWorkspace,r.taskId);if(!task||task.owner!==p.owner||['COMPLETE','BLOCKED'].includes(task.status))throw Error('TWIN_AUTHORITY_TASK_SCOPE');}}
 const at=this.worker.engine.clock(),body={...p,id:r.id,sessionId:r.sessionId,version:r.expectedVersion+1,action:r.action,...(r.action==='GRANT'?{mode:r.mode,...(r.taskId?{taskId:r.taskId}:{})}:{}),at,expiresAt:r.action==='GRANT'?at+(r.mode==='FIFTEEN_MINUTES'?900000:3600000):at,requestDigest,previous:last?.digest??'',scope:'TWIN_SCHEDULER_ONLY' as const};const event={...body,digest:digest(body)};this.sessions.store.db.prepare('INSERT INTO work8_twin_authority VALUES(?,?,?,?,?)').run(p.workspace,r.sessionId,event.version,r.id,JSON.stringify(event));return event;});}
 require(p:Principal,sessionId:string){const read=this.read(p,sessionId);if(read.status!=='ACTIVE')throw Error('TWIN_AUTHORITY_'+read.status);return read.grant!;}
}
