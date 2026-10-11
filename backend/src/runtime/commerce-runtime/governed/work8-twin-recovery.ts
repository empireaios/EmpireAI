import fs from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import {digest,GovernedCommerceStore} from './store.js';
import {readMissionPreparation} from './work8-mission-preparation.js';
import {verifySimulationEnrollment} from './work8-enrollment.js';
import type {Work8TwinRuntime} from './work8-twin-runtime.js';

// Explicit scope: canonical twin business state only. Secrets, live journals,
// owner policy and live authority are never replayed. Historic grants may be
// retained separately as inert, independently checked audit evidence.
const specs = [
 ['work8_twin_media','workspace,session,mission,version','session',false],
 ['work8_twin_communications','workspace,session,thread,version','session',false],
 ['work8_twin_events','workspace,session,version','session',false],
 ['work8_twin_admissions','workspace,id','session',false],
 ['work8_twin_observations','workspace,session,id','session',false],
 ['commerce_runtime_tasks','workspace,id','twin',true],
 ['commerce_runtime_receipts','workspace,mission,version','twin',false],
 ['work8_sim_finance_plans','workspace,mission','twin',false],
 ['work8_sim_finance_events','workspace,mission,sequence','twin',false],
 ['work8_sim_finance_admission','workspace,mission','twin','derived'],
] as const;
const enrollmentSpec = ['work8_simulation_enrollments','workspace,id','twin',false] as const;
const preparationSpec=['work8_mission_preparations','workspace,mission','twin',false] as const;
const specsFor=(schema:string)=>schema==='WORK8_TWIN_RECOVERY_V3'?[...specs,enrollmentSpec,preparationSpec]:schema==='WORK8_TWIN_RECOVERY_V2'?[...specs,enrollmentSpec]:specs;
type Row=Record<string,string|number|null>;
const key=z.string().min(1).max(100).regex(/^[A-Za-z0-9_.:-]+$/);
const manifest=z.object({schema:z.enum(['WORK8_TWIN_RECOVERY_V1','WORK8_TWIN_RECOVERY_V2','WORK8_TWIN_RECOVERY_V3']),workspace:key,owner:key,sessionId:key,twinWorkspace:key,
 sequence:z.number().int().positive(),previous:z.string(),capturedAt:z.number().int().nonnegative(),
 applicationRevision:z.string().regex(/^[a-f0-9]{40}$/),configurationDigest:z.string().regex(/^[a-f0-9]{64}$/),
 classification:z.literal('SIMULATED_OPERATIONS'),authorityRestored:z.literal(false),
 authorityAudit:z.array(z.object({scope:z.enum(['TWIN_SCHEDULER_ONLY','RESEARCH_REASONING','COMMERCIAL_PREPARATION','BACKEND_READ_ONLY','UX_CHANGE_PREPARATION']),events:z.array(z.record(z.unknown())).min(1).max(1000)}).strict()).max(100).optional(),
 tables:z.record(z.array(z.record(z.union([z.string(),z.number(),z.null()])))),digest:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export type TwinRecoveryCheckpoint=z.infer<typeof manifest>;
function checked(raw:unknown,expected:string){
 if(Buffer.byteLength(JSON.stringify(raw))>64*1024*1024)throw Error('RECOVERY_BYTE_BOUND');
 const p=manifest.parse(raw),{digest:hash,...body}=p;
 if(Object.values(p.tables).some(rows=>rows.length>100000)||Object.values(p.tables).reduce((n,rows)=>n+rows.length,0)>200000)throw Error('RECOVERY_ROW_BOUND');
 if(hash!==expected||digest(body)!==hash||p.twinWorkspace!=='twin_'+digest({workspace:p.workspace,owner:p.owner,sessionId:p.sessionId}).slice(0,48))throw Error('RECOVERY_INTEGRITY_FAILED');
 if(Object.keys(p.tables).sort().join()!==specsFor(p.schema).map(s=>s[0]).sort().join())throw Error('RECOVERY_TABLE_SCOPE');
 for(const [table,keys,scope] of specsFor(p.schema)){const seen=new Set<string>();for(const row of p.tables[table]!){
  if(row.workspace!==(scope==='session'?p.workspace:p.twinWorkspace)||scope==='session'&&row.session!==p.sessionId)throw Error('RECOVERY_SCOPE_DENIED');
  const id=JSON.stringify(keys.split(',').map(k=>row[k]));if(seen.has(id))throw Error('RECOVERY_DUPLICATE_ROW');seen.add(id);
 }}
 validateAuthorityAudit(p);
 return p;
}
/** Capture runs in the canonical store transaction. Full checkpoints are bounded;
 * replay is row-wise, ordered and idempotent, never replacement of a live database.
 * Continuous replication and off-host/WORM vault protection are not asserted. */
export function captureTwinCheckpoint(runtime:Work8TwinRuntime,principal:unknown,sessionId:string,
 version:{applicationRevision:string;configurationDigest:string},prior?:TwinRecoveryCheckpoint):TwinRecoveryCheckpoint{
 return runtime.store.transaction(()=>{
  const session=runtime.sessions.read(principal,sessionId);
  if(prior){checked(prior,prior.digest);if(prior.workspace!==session.workspace||prior.owner!==session.owner||prior.sessionId!==sessionId)throw Error('RECOVERY_LINEAGE_SCOPE');}
  verifyEnrollments(runtime,session.twinWorkspace,session.owner);
  // Current engine readers validate canonical receipt/finance provenance.
  let after='';do{const view=runtime.projection(principal,sessionId,after,100);after=view.next??'';}while(after);
  const tables:Record<string,Row[]>={};let total=0;
  for(const [table,keys,scope] of specsFor('WORK8_TWIN_RECOVERY_V3')){
   const rows=runtime.store.db.prepare(`SELECT * FROM ${table} WHERE workspace=?${scope==='session'?' AND session=?':''} ORDER BY ${keys} LIMIT 100001`).all(...(scope==='session'?[session.workspace,sessionId]:[session.twinWorkspace])) as Row[];
   total+=rows.length;if(rows.length>100000||total>200000)throw Error('RECOVERY_ROW_BOUND');tables[table]=rows;
  }
  const body={schema:'WORK8_TWIN_RECOVERY_V3' as const,workspace:session.workspace,owner:session.owner,sessionId,twinWorkspace:session.twinWorkspace,
   sequence:(prior?.sequence??0)+1,previous:prior?.digest??'',capturedAt:runtime.worker.engine.clock(),...version,
   classification:'SIMULATED_OPERATIONS' as const,authorityRestored:false as const,authorityAudit:captureAuthorityAudit(runtime,session.workspace,session.owner,sessionId),tables};
  if(Buffer.byteLength(JSON.stringify(body))>64*1024*1024)throw Error('RECOVERY_BYTE_BOUND');
  const pack=checked({...body,digest:digest(body)},digest(body));
  if(prior)verifyExtension(prior,pack);
  return pack;
 });
}
function verifyEnrollments(runtime:Work8TwinRuntime,workspace:string,owner:string){
 const preparations=runtime.store.db.prepare('SELECT mission FROM work8_mission_preparations WHERE workspace=? LIMIT 1001').all(workspace);
 if(preparations.length>1000)throw Error('RECOVERY_PREPARATION_BOUND');
 for(const row of preparations){const prep=readMissionPreparation(runtime.store,workspace,String(row.mission));
  if(!prep||prep.owner!==owner||prep.liveAuthority!==false||prep.simulationAuthorized!==false||runtime.store.history(workspace,String(row.mission))[prep.preparedVersion-1]?.digest!==prep.sourceReceiptDigest)throw Error('RECOVERY_PREPARATION_LINEAGE');
 }

 const rows=runtime.store.db.prepare('SELECT id FROM work8_simulation_enrollments WHERE workspace=? LIMIT 1001').all(workspace);
 if(rows.length>1000)throw Error('RECOVERY_ENROLLMENT_BOUND');
 for(const row of rows){const task=runtime.worker.get(workspace,String(row.id));if(!task||task.owner!==owner)throw Error('RECOVERY_ENROLLMENT_TASK_MISSING');verifySimulationEnrollment(runtime.store,task);}
}
function verifyExtension(before:TwinRecoveryCheckpoint,after:TwinRecoveryCheckpoint){
 for(const old of before.authorityAudit??[]){const next=(after.authorityAudit??[]).find(a=>a.scope===old.scope&&a.events[0]?.digest===old.events[0]?.digest);if(!next||digest(next.events.slice(0,old.events.length))!==digest(old.events))throw Error('RECOVERY_AUTHORITY_AUDIT_REWRITE');}
 if(after.capturedAt<before.capturedAt)throw Error('RECOVERY_CLOCK_REGRESSION');
 if(Number(before.schema.slice(-1))>Number(after.schema.slice(-1)))throw Error('RECOVERY_SCHEMA_DOWNGRADE');
 for(const [table,keys,,mutable] of specsFor(after.schema)){const identity=(r:Row)=>JSON.stringify(keys.split(',').map(k=>r[k]));
  const rows=new Map(after.tables[table]!.map(r=>[identity(r),r]));
  for(const old of before.tables[table]??[]){if(mutable==='derived')continue;const next=rows.get(identity(old));if(!next||!mutable&&digest(old)!==digest(next))throw Error('RECOVERY_HISTORY_REWRITE');
   if(mutable===true&&Number(next.version)<Number(old.version))throw Error('RECOVERY_CURSOR_REGRESSION');
  }
 }
}
/** Write-once local vault foundation. Caller must provision independently protected
 * storage before operational use. No retention pruning or overwrite operation. */
export function saveTwinCheckpoint(vault:string,pack:TwinRecoveryCheckpoint){
 checked(pack,pack.digest);
 if(fs.realpathSync(vault)!==path.resolve(vault)||!fs.statSync(vault).isDirectory())throw Error('RECOVERY_UNSAFE_VAULT');
 const filename=path.join(vault,pack.digest+'.json');const fd=fs.openSync(filename,'wx',0o400);
 try{fs.writeFileSync(fd,JSON.stringify(pack));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 const directory=fs.openSync(vault,'r');try{fs.fsyncSync(directory);}finally{fs.closeSync(directory);}
 return {filename,digest:pack.digest,sequence:pack.sequence};
}
export function readTwinCheckpoint(vault:string,expectedDigest:string){
 if(!/^[a-f0-9]{64}$/.test(expectedDigest))throw Error('RECOVERY_INVALID_DIGEST');
 const filename=path.join(vault,expectedDigest+'.json');
 if(fs.realpathSync(vault)!==path.resolve(vault)||fs.realpathSync(filename)!==filename||!fs.lstatSync(filename).isFile()||fs.statSync(filename).size>64*1024*1024)throw Error('RECOVERY_UNSAFE_VAULT');
 return checked(JSON.parse(fs.readFileSync(filename,'utf8')),expectedDigest);
}
/** Explicitly mark a newly initialized empty store. Never marks an existing
 * business database. The caller must also isolate its process/network. */
export function initializeTwinRecoveryTarget(store:GovernedCommerceStore){
 store.transaction(()=>{
  const tables=store.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  for(const row of tables){const name=String(row.name).replaceAll('"','""');if(store.db.prepare(`SELECT 1 FROM "${name}" LIMIT 1`).get())throw Error('RECOVERY_TARGET_NOT_EMPTY');}
  store.db.exec('CREATE TABLE work8_recovery_checkpoints(sequence INTEGER PRIMARY KEY,digest TEXT NOT NULL UNIQUE,record TEXT NOT NULL)');
 });
}
export function replayTwinCheckpoint(target:Work8TwinRuntime,raw:unknown,expectedDigest:string){
 const pack=checked(raw,expectedDigest);
 return target.store.transaction(()=>{
  if(!target.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='work8_recovery_checkpoints'").get())throw Error('RECOVERY_TARGET_NOT_INITIALIZED');
  const previous=target.store.db.prepare('SELECT record FROM work8_recovery_checkpoints ORDER BY sequence DESC LIMIT 1').get();
  const last=previous?checked(JSON.parse(String(previous.record)),JSON.parse(String(previous.record)).digest):null;
  const duplicate=last?.digest===pack.digest;
  if(!duplicate&&(pack.sequence!==(last?.sequence??0)+1||pack.previous!==(last?.digest??'')))throw Error('RECOVERY_REPLAY_ORDER');
  if(last){if(last.owner!==pack.owner||last.workspace!==pack.workspace||last.sessionId!==pack.sessionId)throw Error('RECOVERY_LINEAGE_SCOPE');verifyExtension(last,pack);}
  if(target.store.db.prepare('SELECT 1 FROM work8_twin_authority LIMIT 1').get()||target.store.db.prepare('SELECT 1 FROM work8_preparation_authority LIMIT 1').get())throw Error('RECOVERY_TARGET_HAS_AUTHORITY');
  // A future-state experiment must fork again, never accept replication on top
  // of independently changed business state (including extra or deleted rows).
  for(const [table,keys] of specsFor('WORK8_TWIN_RECOVERY_V3')){
   const existing=target.store.db.prepare(`SELECT * FROM ${table} ORDER BY ${keys} LIMIT 100001`).all();
   if(digest(existing)!==digest(last?.tables[table]??[]))throw Error('RECOVERY_TARGET_DIVERGED');
  }
  if(duplicate)return {status:'ALREADY_APPLIED',digest:pack.digest,authorityRestored:false};
  for(const [table,keys,,mutable] of specsFor(pack.schema)){
   if(mutable==='derived')target.store.db.prepare(`DELETE FROM ${table}`).run();
   const columns=target.store.db.prepare(`PRAGMA table_info(${table})`).all().map(c=>String(c.name));
   for(const row of pack.tables[table]!){
    if(Object.keys(row).sort().join()!==columns.slice().sort().join())throw Error('RECOVERY_SCHEMA_INCOMPATIBLE');
    const ids=keys.split(','),where=ids.map(k=>k+'=?').join(' AND '),values=ids.map(k=>row[k]!);
    const existing=target.store.db.prepare(`SELECT * FROM ${table} WHERE ${where}`).get(...values);
    if(existing){if(digest(existing)===digest(row))continue;if(!mutable)throw Error('RECOVERY_TARGET_DIVERGED');
     // Local experiments are never overwritten by replay.
     const old=last?.tables[table]!.find(r=>ids.every(k=>r[k]===row[k]));if(!old||digest(existing)!==digest(old))throw Error('RECOVERY_TARGET_DIVERGED');
     target.store.db.prepare(`UPDATE ${table} SET ${columns.map(k=>k+'=?').join(',')} WHERE ${where}`).run(...columns.map(k=>row[k]!),...values);
    }else target.store.db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`).run(...columns.map(k=>row[k]!));
   }
  }
  // No restored authority, owner policy, credentials, finance from live, or egress.
  const p={workspace:pack.workspace,owner:pack.owner};target.sessions.read(p,pack.sessionId);verifyEnrollments(target,pack.twinWorkspace,pack.owner);
  let after='';do{const view=target.projection(p,pack.sessionId,after,100);after=view.next??'';}while(after);
  target.store.db.prepare('INSERT INTO work8_recovery_checkpoints VALUES(?,?,?)').run(pack.sequence,pack.digest,JSON.stringify(pack));
  return {status:'APPLIED',digest:pack.digest,authorityRestored:false};
 });
}

/** Independent vault readback, pinned to a caller-retained trusted head digest.
 * No runtime, credentials, source database, listing, deletion or upload is used.
 * Local permissions are not an off-host retention or WORM guarantee. */
export function inspectTwinRecoveryVault(vault:string,trustedHead:string,at:number){
 if(!Number.isSafeInteger(at)||at<0)throw Error('RECOVERY_POINT_IN_TIME');
 const chain:TwinRecoveryCheckpoint[]=[];let next=trustedHead,bytes=0;
 const seen=new Set<string>();
 while(next){
  if(seen.has(next)||chain.length>=10000)throw Error('RECOVERY_LINEAGE_BOUND');seen.add(next);
  const pack=readTwinCheckpoint(vault,next);bytes+=Buffer.byteLength(JSON.stringify(pack));
  if(bytes>128*1024*1024)throw Error('RECOVERY_CHAIN_BYTE_BOUND');chain.push(pack);next=pack.previous;
 }
 if(!chain.length)throw Error('RECOVERY_TRUSTED_HEAD_REQUIRED');
 chain.reverse();
 for(const [i,pack]of chain.entries()){
  const before=chain[i-1];
  if(pack.sequence!==i+1||pack.previous!==(before?.digest??''))throw Error('RECOVERY_REPLAY_ORDER');
  if(before){if(pack.workspace!==before.workspace||pack.owner!==before.owner||pack.sessionId!==before.sessionId)throw Error('RECOVERY_LINEAGE_SCOPE');verifyExtension(before,pack);}
 }
 const selected=chain.filter(p=>p.capturedAt<=at).at(-1);if(!selected)throw Error('RECOVERY_NO_CHECKPOINT_AT_TIME');
 return {chain:chain.slice(0,selected.sequence),trustedHead,selectedDigest:selected.digest,selectedSequence:selected.sequence,
  selectedAt:selected.capturedAt,requestedAt:at,recoveryPointGapMs:at-selected.capturedAt,verifiedCheckpoints:chain.length,
  retention:'NO_PRUNING; ALL REPLAY ANCESTORS REQUIRED',protection:'LOCAL_WRITE_ONCE_ONLY; OFF_HOST_PROTECTION_NOT_ATTESTED',authorityRestored:false as const};
}
/** Point-in-time restoration is only for a fresh, explicitly marked isolated
 * target. It is never application rollback of an existing business database. */
export function restoreTwinPointInTime(target:Work8TwinRuntime,vault:string,trustedHead:string,at:number){
 const started=performance.now(),inspection=inspectTwinRecoveryVault(vault,trustedHead,at);
 return target.store.transaction(()=>{
  if(!target.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='work8_recovery_checkpoints'").get())throw Error('RECOVERY_TARGET_NOT_INITIALIZED');
  if(target.store.db.prepare('SELECT 1 FROM work8_recovery_checkpoints LIMIT 1').get())throw Error('RECOVERY_POINT_IN_TIME_TARGET_NOT_EMPTY');
  for(const pack of inspection.chain)replayTwinCheckpoint(target,pack,pack.digest);
  const {chain,...receipt}=inspection;
  return {...receipt,status:'RESTORED_ISOLATED_COPY',appliedCheckpoints:chain.length,elapsedMs:performance.now()-started,applicationRevision:chain.at(-1)!.applicationRevision,configurationDigest:chain.at(-1)!.configurationDigest,operationalRtoGuaranteed:false};
 });
}

// Historic grant/decision receipts are retained as inert audit data in the
// checkpoint record. They are NEVER inserted into either active authority table.
function validateAuthorityAudit(pack:TwinRecoveryCheckpoint){
 const identities=new Set<string>();
 for(const chain of pack.authorityAudit??[]){let previous='',version=0;
  const identity=chain.scope+':'+String(chain.events[0]?.digest);if(identities.has(identity))throw Error('RECOVERY_AUTHORITY_AUDIT_DUPLICATE');identities.add(identity);
  for(const event of chain.events){const {digest:hash,...body}=event;
   if(event.owner!==pack.owner||event.workspace!==pack.workspace||event.sessionId!==pack.sessionId||event.scope!==chain.scope||event.version!==++version||event.previous!==previous||typeof hash!=='string'||digest(body)!==hash)throw Error('RECOVERY_AUTHORITY_AUDIT_UNVERIFIED');previous=hash;
  }
 }
}
export function readRecoveredAuthorityAudit(runtime:Work8TwinRuntime,p:{workspace:string;owner:string},sessionId:string){
 runtime.sessions.read(p,sessionId);
 if(!runtime.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='work8_recovery_checkpoints'").get())return [];
 const row=runtime.store.db.prepare('SELECT record FROM work8_recovery_checkpoints ORDER BY sequence DESC LIMIT 1').get();if(!row)return [];
 const raw=JSON.parse(String(row.record)),pack=checked(raw,raw.digest);
 if(pack.workspace!==p.workspace||pack.owner!==p.owner||pack.sessionId!==sessionId)throw Error('RECOVERY_LINEAGE_SCOPE');
 return pack.authorityAudit??[];
}
function captureAuthorityAudit(runtime:Work8TwinRuntime,workspace:string,owner:string,sessionId:string){
 const p={workspace,owner},inherited=readRecoveredAuthorityAudit(runtime,p,sessionId);
 // Canonical readers validate the active histories before archival.
 runtime.authority.read(p,sessionId);runtime.preparation.all(p,sessionId);
 const all=[...inherited];
 for(const table of ['work8_twin_authority','work8_preparation_authority']){
  const rows=runtime.store.db.prepare(`SELECT record FROM ${table} WHERE workspace=? AND session=? ORDER BY version LIMIT 5001`).all(workspace,sessionId);if(rows.length>5000)throw Error('RECOVERY_AUTHORITY_AUDIT_BOUND');
  const groups=new Map<string,Record<string,unknown>[]>();for(const row of rows){const e=JSON.parse(String(row.record));const events=groups.get(e.scope)??[];events.push(e);groups.set(e.scope,events);}
  for(const [scope,events]of groups){const existing=all.find(a=>a.scope===scope&&a.events[0]?.digest===events[0]?.digest);if(existing){if(digest(events.slice(0,existing.events.length))!==digest(existing.events))throw Error('RECOVERY_AUTHORITY_AUDIT_REWRITE');existing.events=events;}else all.push({scope:scope as NonNullable<TwinRecoveryCheckpoint['authorityAudit']>[number]['scope'],events});}
 }
 return all;
}
