import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {capabilities,digest,jobSchema,key,defaultStrategy,type Evidence,type JobInput} from './model.js';
export type Row=Record<string,any>;
const decode=(r:any):Row|null=>r?JSON.parse(r.body):null;
/** Independent evidence store, not another CEO memory. Work3 remains decision/learning authority. */
export class IntelligenceStore{
 constructor(readonly filename:string,readonly now=()=>Date.now()){}
 use<T>(fn:(db:DatabaseSync)=>T):T{
  if(!path.isAbsolute(this.filename)||fs.realpathSync(path.dirname(this.filename))!==path.dirname(this.filename))throw Error('INTELLIGENCE_PATH');
  if(!fs.existsSync(this.filename))fs.closeSync(fs.openSync(this.filename,'wx',0o600));
  const st=fs.lstatSync(this.filename);if(!st.isFile()||st.nlink!==1||fs.realpathSync(this.filename)!==this.filename)throw Error('INTELLIGENCE_PATH');
  const db=new DatabaseSync(this.filename,{timeout:1000,allowExtension:false});
  try{db.exec(`PRAGMA trusted_schema=OFF; PRAGMA synchronous=FULL; PRAGMA max_page_count=32768;
   CREATE TABLE IF NOT EXISTS objects(workspace TEXT NOT NULL,kind TEXT NOT NULL,id TEXT NOT NULL,updated INTEGER NOT NULL,body TEXT NOT NULL,PRIMARY KEY(workspace,kind,id)) STRICT;
   CREATE INDEX IF NOT EXISTS recent_objects ON objects(workspace,kind,updated DESC);
   CREATE TABLE IF NOT EXISTS jobs(workspace TEXT NOT NULL,id TEXT NOT NULL,status TEXT NOT NULL,lease TEXT,lease_until INTEGER NOT NULL,created INTEGER NOT NULL,body TEXT NOT NULL,PRIMARY KEY(workspace,id)) STRICT;
   CREATE TABLE IF NOT EXISTS schedules(workspace TEXT NOT NULL,id TEXT NOT NULL,next_at INTEGER NOT NULL,body TEXT NOT NULL,PRIMARY KEY(workspace,id)) STRICT;
   CREATE TABLE IF NOT EXISTS quotas(provider TEXT NOT NULL,day TEXT NOT NULL,used INTEGER NOT NULL,PRIMARY KEY(provider,day)) STRICT;`);return fn(db);}finally{db.close();}
 }
 get(workspace:string,kind:string,id:string){key.parse(workspace);return this.use(db=>decode(db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? AND id=?').get(workspace,kind,id)));}
 list(workspace:string,kind:string,after='',limit=20){key.parse(workspace);return this.use(db=>db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? AND id>? ORDER BY id LIMIT ?').all(workspace,kind,after,Math.min(100,Math.max(1,limit))).map(decode) as Row[]);}
 recent(workspace:string,kind:string,limit=20){return this.use(db=>db.prepare('SELECT body FROM objects WHERE workspace=? AND kind=? ORDER BY updated DESC LIMIT ?').all(workspace,kind,Math.min(100,limit)).map(decode) as Row[]);}
 put(workspace:string,kind:string,id:string,body:unknown){key.parse(workspace);key.parse(id);const raw=JSON.stringify(body);if(raw.length>48000)throw Error('OBJECT_BOUND');this.use(db=>db.prepare('INSERT INTO objects VALUES(?,?,?,?,?) ON CONFLICT(workspace,kind,id) DO UPDATE SET updated=excluded.updated,body=excluded.body').run(workspace,kind,id,this.now(),raw));}
 arsenal(workspace:string){return capabilities.map(c=>{const s=this.get(workspace,'health',c.id);const credentialPresent=c.credentials.length?c.credentials.every(k=>Boolean(process.env[k])):null;const stale=Boolean(s?.lastGoodAt&&Date.parse(s.lastGoodAt)+c.ttlMs<this.now());return {...c,credentialNames:c.credentials,credentialPresent,configurationState:c.implemented?'CONFIGURED':'CAPABILITY_GAP',authenticationState:s?.authenticatedAt?'AUTHENTICATION_VERIFIED':'UNVERIFIED',readState:s?.lastGoodAt?'READ_VERIFIED':'UNVERIFIED',availability:!c.implemented?'UNAVAILABLE':s?.failure?'DEGRADED':stale?'STALE':s?.lastGoodAt?'AVAILABLE':credentialPresent===false?'UNAVAILABLE':'UNVERIFIED',lastVerifiedRead:s?.lastGoodAt??null,verifiedEndpoint:s?.endpoint??null,currentFailure:s?.failure??null,lastAttemptAt:s?.lastAttemptAt??null,grantsAuthority:false};});}
 evidence(workspace:string,e:Evidence){
  if(!Number.isFinite(Date.parse(e.observedAt))||Date.parse(e.observedAt)>this.now()+60000||Date.parse(e.staleAfter)<=Date.parse(e.observedAt))throw Error('EVIDENCE_TIME');
  if(e.digest!==digest(e.facts)||e.grantsAuthority!==false)throw Error('EVIDENCE_PROVENANCE');
  const prior=this.get(workspace,'evidence',e.id);if(prior&&digest(prior)!==digest(e))throw Error('IMMUTABLE_EVIDENCE');
  this.put(workspace,'evidence',e.id,e);return e;
 }
 cached(workspace:string,capability:string,subject:unknown){return this.recent(workspace,'evidence',100).find(e=>e.capabilityId===capability&&digest(e.subject)===digest(subject)&&e.authenticity!=='SYNTHETIC'&&Date.parse(e.staleAfter)>this.now());}
 enqueue(workspace:string,requester:string,input:unknown){const p=jobSchema.parse(input);key.parse(workspace);if(p.capabilities.some(id=>!capabilities.some(c=>c.id===id&&c.implemented)))throw Error('CAPABILITY_UNAVAILABLE');for(const id of p.evidenceRefs)if(!this.get(workspace,'evidence',id))throw Error('EVIDENCE_REFERENCE');
  const job={...p,workspace,requester,createdAt:new Date(this.now()).toISOString(),status:'QUEUED',attempts:0,requestsUsed:0,evidence:[],failures:[],inferenceCalls:0,commerceEffects:0,grantsAuthority:false};
  return this.use(db=>{db.exec('BEGIN IMMEDIATE');try{const old=decode(db.prepare('SELECT body FROM jobs WHERE workspace=? AND id=?').get(workspace,p.id));if(old){if(digest(jobSchema.parse(Object.fromEntries(Object.keys(p).map(k=>[k,old[k]]))))!==digest(p)||old.requester!==requester)throw Error('JOB_ID_CONFLICT');db.exec('COMMIT');return old;}
   const count=Number(db.prepare("SELECT count(*) n FROM jobs WHERE workspace=? AND status IN ('QUEUED','RUNNING')").get(workspace)?.n);if(count>=20)throw Error('QUEUE_BOUND');
   db.prepare('INSERT INTO jobs VALUES(?,?,?,NULL,0,?,?)').run(workspace,p.id,'QUEUED',this.now(),JSON.stringify(job));db.exec('COMMIT');return job;}catch(e){db.exec('ROLLBACK');throw e;}});
 }
 job(workspace:string,id:string){return this.use(db=>decode(db.prepare('SELECT body FROM jobs WHERE workspace=? AND id=?').get(workspace,id)));}
 recentJobs(workspace:string,limit=20){return this.use(db=>db.prepare('SELECT body FROM jobs WHERE workspace=? ORDER BY created DESC LIMIT ?').all(workspace,Math.min(50,limit)).map(decode) as Row[]);}
 jobs(workspace:string,after='',limit=20){return this.use(db=>db.prepare('SELECT body FROM jobs WHERE workspace=? AND id>? ORDER BY id LIMIT ?').all(workspace,after,Math.min(50,limit)).map(decode) as Row[]);}
 claim(workspace:string){return this.use(db=>{db.exec('BEGIN IMMEDIATE');try{
  // Never blindly replay a possibly consumed provider call after process death.
  const expired=db.prepare("SELECT id,body FROM jobs WHERE workspace=? AND status='RUNNING' AND lease_until<?").all(workspace,this.now());
  for(const r of expired){const j=decode(r)!;j.status='INTERRUPTED';j.failures.push({code:'PROCESS_INTERRUPTED_RECONCILE_BEFORE_RETRY'});db.prepare("UPDATE jobs SET status='INTERRUPTED',body=? WHERE workspace=? AND id=?").run(JSON.stringify(j),workspace,String(r.id));}
  const r=db.prepare("SELECT body FROM jobs WHERE workspace=? AND status='QUEUED' ORDER BY created LIMIT 1").get(workspace);const j=decode(r);if(!j){db.exec('COMMIT');return null;}j.status='RUNNING';j.attempts++;j.startedAt=new Date(this.now()).toISOString();j.lease=randomUUID();db.prepare("UPDATE jobs SET status='RUNNING',lease=?,lease_until=?,body=? WHERE workspace=? AND id=?").run(j.lease,this.now()+300000,JSON.stringify(j),workspace,j.id);db.exec('COMMIT');return j;
 }catch(e){db.exec('ROLLBACK');throw e;}});}
 saveJob(workspace:string,j:Row){const n=this.use(db=>db.prepare('UPDATE jobs SET status=?,body=? WHERE workspace=? AND id=? AND lease=?').run(j.status,JSON.stringify(j),workspace,j.id,j.lease));if(!n.changes)throw Error('JOB_LEASE_LOST');}
 reserve(provider:string,units:number){const day=new Date(this.now()).toISOString().slice(0,10);const ceiling=provider==='CJ'?1000:provider==='Keepa'?100:100;return this.use(db=>{db.exec('BEGIN IMMEDIATE');try{const n=Number(db.prepare('SELECT used FROM quotas WHERE provider=? AND day=?').get(provider,day)?.used??0);if(n+units>ceiling)throw Error('DAILY_PROVIDER_BOUND');db.prepare('INSERT INTO quotas VALUES(?,?,?) ON CONFLICT(provider,day) DO UPDATE SET used=excluded.used').run(provider,day,n+units);db.exec('COMMIT');return n+units;}catch(e){db.exec('ROLLBACK');throw e;}});}
 schedules(workspace:string){return this.use(db=>db.prepare('SELECT body,next_at FROM schedules WHERE workspace=? ORDER BY id').all(workspace).map(r=>({...decode(r),nextAt:new Date(Number(r.next_at)).toISOString()})));}
 seed(workspace:string){const defaults=[['amazon.account','account',86400000],['amazon.catalog','organizer',21600000],['cj.catalog','organizer',21600000],['internet.safety','organizer',86400000],['empire.state','empire',900000]] as const;this.use(db=>{for(const [id,subject,intervalMs] of defaults)db.prepare('INSERT OR IGNORE INTO schedules VALUES(?,?,?,?)').run(workspace,id,this.now(),JSON.stringify({id,enabled:true,intervalMs,subject:{id:subject,marketplace:'US',...(id.endsWith('catalog')?{query:'desk organizer'}:{})},failures:0,timezone:'UTC'}));});if(!this.get(workspace,'strategy','active'))this.put(workspace,'strategy','active',defaultStrategy);}
 due(workspace:string){return this.use(db=>{db.exec('BEGIN IMMEDIATE');try{const rows=db.prepare('SELECT id,body FROM schedules WHERE workspace=? AND next_at<=? LIMIT 8').all(workspace,this.now());const result:Row[]=[];for(const r of rows){const s=decode(r)!;if(!s.enabled)continue;const c=capabilities.find(c=>c.id===s.id)!;if(c.credentials.length&&!c.credentials.every(k=>process.env[k])){db.prepare('UPDATE schedules SET next_at=? WHERE workspace=? AND id=?').run(this.now()+s.intervalMs,workspace,String(r.id));continue;}s.lastQueuedAt=new Date(this.now()).toISOString();db.prepare('UPDATE schedules SET next_at=?,body=? WHERE workspace=? AND id=?').run(this.now()+s.intervalMs,JSON.stringify(s),workspace,String(r.id));result.push(s);}db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}});}
 setSchedule(workspace:string,id:string,enabled:boolean){this.use(db=>{const r=decode(db.prepare('SELECT body FROM schedules WHERE workspace=? AND id=?').get(workspace,id));if(!r)throw Error('SCHEDULE_NOT_FOUND');r.enabled=enabled;db.prepare('UPDATE schedules SET body=? WHERE workspace=? AND id=?').run(JSON.stringify(r),workspace,id);});}
 prune(workspace:string){this.use(db=>{db.prepare("DELETE FROM objects WHERE workspace=? AND kind='evidence' AND updated<? AND id NOT IN (SELECT id FROM objects WHERE workspace=? AND kind='evidence' ORDER BY updated DESC LIMIT 1000)").run(workspace,this.now()-30*86400000,workspace);db.prepare("DELETE FROM jobs WHERE workspace=? AND status IN ('COMPLETED','PARTIAL','FAILED','INTERRUPTED') AND created<?").run(workspace,this.now()-90*86400000);db.prepare('DELETE FROM quotas WHERE day<?').run(new Date(this.now()-90*86400000).toISOString().slice(0,10));});}
}
export function productionIntelligence(){const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;return root&&process.env.EMPIRE_RUNTIME_PROFILE==='LOCKED_COMMISSIONING_V1'?new IntelligenceStore(path.join(root,'commissioning','intelligence.sqlite')):null;}
