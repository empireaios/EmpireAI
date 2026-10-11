import fs from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import {digest,GovernedCommerceStore} from './store.js';
import {Work8TwinRuntime} from './work8-twin-runtime.js';

// Explicit scope: canonical twin business state only. Secrets, live journals,
// owner policy and authority grants are NEVER copied or replayed.
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
 ['work8_sim_finance_admission','workspace,mission','twin',false],
] as const;
type Row=Record<string,string|number|null>;
const key=z.string().min(1).max(100).regex(/^[A-Za-z0-9_.:-]+$/);
const manifest=z.object({schema:z.literal('WORK8_TWIN_RECOVERY_V1'),workspace:key,owner:key,sessionId:key,twinWorkspace:key,
 sequence:z.number().int().positive(),previous:z.string(),capturedAt:z.number().int().nonnegative(),
 applicationRevision:z.string().regex(/^[a-f0-9]{40}$/),configurationDigest:z.string().regex(/^[a-f0-9]{64}$/),
 classification:z.literal('SIMULATED_OPERATIONS'),authorityRestored:z.literal(false),
 tables:z.record(z.array(z.record(z.union([z.string(),z.number(),z.null()])))),digest:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export type TwinRecoveryCheckpoint=z.infer<typeof manifest>;
function checked(raw:unknown,expected:string){
 const p=manifest.parse(raw),{digest:hash,...body}=p;
 if(hash!==expected||digest(body)!==hash||p.twinWorkspace!=='twin_'+digest({workspace:p.workspace,owner:p.owner,sessionId:p.sessionId}).slice(0,48))throw Error('RECOVERY_INTEGRITY_FAILED');
 if(Object.keys(p.tables).sort().join()!==specs.map(s=>s[0]).sort().join())throw Error('RECOVERY_TABLE_SCOPE');
 for(const [table,keys,scope] of specs){const seen=new Set<string>();for(const row of p.tables[table]!){
  if(row.workspace!==(scope==='session'?p.workspace:p.twinWorkspace)||scope==='session'&&row.session!==p.sessionId)throw Error('RECOVERY_SCOPE_DENIED');
  const id=JSON.stringify(keys.split(',').map(k=>row[k]));if(seen.has(id))throw Error('RECOVERY_DUPLICATE_ROW');seen.add(id);
 }}
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
  if(runtime.store.db.prepare('SELECT 1 FROM work8_simulation_enrollments WHERE workspace=? LIMIT 1').get(session.twinWorkspace))throw Error('RECOVERY_GENUINE_ENROLLMENT_NOT_SUPPORTED');
  // Current engine readers validate canonical receipt/finance provenance.
  let after='';do{const view=runtime.projection(principal,sessionId,after,100);after=view.next??'';}while(after);
  const tables:Record<string,Row[]>={};let total=0;
  for(const [table,keys,scope] of specs){
   const rows=runtime.store.db.prepare(`SELECT * FROM ${table} WHERE workspace=?${scope==='session'?' AND session=?':''} ORDER BY ${keys} LIMIT 100001`).all(...(scope==='session'?[session.workspace,sessionId]:[session.twinWorkspace])) as Row[];
   total+=rows.length;if(rows.length>100000||total>200000)throw Error('RECOVERY_ROW_BOUND');tables[table]=rows;
  }
  const body={schema:'WORK8_TWIN_RECOVERY_V1' as const,workspace:session.workspace,owner:session.owner,sessionId,twinWorkspace:session.twinWorkspace,
   sequence:(prior?.sequence??0)+1,previous:prior?.digest??'',capturedAt:runtime.worker.engine.clock(),...version,
   classification:'SIMULATED_OPERATIONS' as const,authorityRestored:false as const,tables};
  if(Buffer.byteLength(JSON.stringify(body))>64*1024*1024)throw Error('RECOVERY_BYTE_BOUND');
  const pack=checked({...body,digest:digest(body)},digest(body));
  if(prior)verifyExtension(prior,pack);
  return pack;
 });
}
function verifyExtension(before:TwinRecoveryCheckpoint,after:TwinRecoveryCheckpoint){
 for(const [table,keys,,mutable] of specs){const identity=(r:Row)=>JSON.stringify(keys.split(',').map(k=>r[k]));
  const rows=new Map(after.tables[table]!.map(r=>[identity(r),r]));
  for(const old of before.tables[table]!){const next=rows.get(identity(old));if(!next||!mutable&&digest(old)!==digest(next))throw Error('RECOVERY_HISTORY_REWRITE');
   if(mutable&&Number(next.version)<Number(old.version))throw Error('RECOVERY_CURSOR_REGRESSION');
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
  if(last?.digest===pack.digest)return {status:'ALREADY_APPLIED',digest:pack.digest,authorityRestored:false};
  if(pack.sequence!==(last?.sequence??0)+1||pack.previous!==(last?.digest??''))throw Error('RECOVERY_REPLAY_ORDER');
  if(last){if(last.owner!==pack.owner||last.workspace!==pack.workspace||last.sessionId!==pack.sessionId)throw Error('RECOVERY_LINEAGE_SCOPE');verifyExtension(last,pack);}
  if(target.store.db.prepare('SELECT 1 FROM work8_twin_authority LIMIT 1').get()||target.store.db.prepare('SELECT 1 FROM work8_preparation_authority LIMIT 1').get())throw Error('RECOVERY_TARGET_HAS_AUTHORITY');
  // A future-state experiment must fork again, never accept replication on top
  // of independently changed business state (including extra or deleted rows).
  for(const [table,keys] of specs){
   const existing=target.store.db.prepare(`SELECT * FROM ${table} ORDER BY ${keys} LIMIT 100001`).all();
   if(digest(existing)!==digest(last?.tables[table]??[]))throw Error('RECOVERY_TARGET_DIVERGED');
  }
  for(const [table,keys,,mutable] of specs){
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
  const p={workspace:pack.workspace,owner:pack.owner};target.sessions.read(p,pack.sessionId);
  let after='';do{const view=target.projection(p,pack.sessionId,after,100);after=view.next??'';}while(after);
  target.store.db.prepare('INSERT INTO work8_recovery_checkpoints VALUES(?,?,?)').run(pack.sequence,pack.digest,JSON.stringify(pack));
  return {status:'APPLIED',digest:pack.digest,authorityRestored:false};
 });
}
