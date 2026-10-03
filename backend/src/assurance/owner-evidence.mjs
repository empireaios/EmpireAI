import fs from 'node:fs';
import {readDemo} from './owner-demo.mjs';
import {DatabaseSync} from 'node:sqlite';
import {inspectAssurance,REQUIRED_DOMAINS,validateRetainedAssuranceReceipt} from './independent-assurance.mjs';
import {readCurrentAssuranceTruth} from './current-state-provenance.mjs';
export const policy={epoch:0,intervalMs:300000,graceMs:120000};
const internal=new Set(['runtime','workers','scheduler','pillow-omissions','authority-spending']);
const safeCheck=c=>Object.fromEntries(Object.entries(c??{}).filter(([k,v])=>['status','reason','missing','unexpected','mismatched','observedAt','unbound','authoritativeDigest','internalDigest'].includes(k)&&['string','number','boolean'].includes(typeof v)).map(([k,v])=>[k,typeof v==='string'?v.slice(0,240):v]));
/** Only the independent inspector may reconcile durable incidents. */
export function recordOwnerAssurance(filename,now=Date.now()){ return ownerEvidence(filename,now,true); }
/** Owner/operator reads never create schemas, reopen incidents or resolve findings. */
export function readOwnerAssurance(filename,now=Date.now()){ return ownerEvidence(filename,now,false); }
function ownerEvidence(filename,now,persist){
 const verdict=inspectAssurance(filename,{...policy,now});
 const stat=fs.lstatSync(filename);if(!stat.isFile()||fs.realpathSync(filename)!==filename||stat.size>64*1024*1024)throw Error('Evidence unavailable');
 const db=new DatabaseSync(filename,{readOnly:!persist,timeout:1000,allowExtension:false});
 try{
  if(persist)db.exec(`PRAGMA trusted_schema=OFF; CREATE TABLE IF NOT EXISTS assurance_findings(id TEXT PRIMARY KEY,source TEXT NOT NULL,severity TEXT NOT NULL,status TEXT NOT NULL,first_at INTEGER NOT NULL,last_at INTEGER NOT NULL,resolved_at INTEGER,detail TEXT NOT NULL);`);
  const rows=db.prepare('SELECT id,scheduled_at,started_at,completed_at,receipt FROM assurance_cycles ORDER BY scheduled_at DESC LIMIT 20').all();
  const cycles=rows.map(r=>{
   let checks=null;
   try{const receipt=validateRetainedAssuranceReceipt(r);checks=Object.fromEntries(Object.entries(receipt.checks).map(([d,c])=>[d,safeCheck(c)]));}catch{}
   return {id:r.id,scheduledAt:r.scheduled_at,startedAt:r.started_at,completedAt:r.completed_at,checks};
  });
  let heartbeat=null;try{heartbeat=JSON.parse(fs.readFileSync(filename+'.watchdog','utf8'));}catch{}
  const watchdogFresh=Number.isSafeInteger(heartbeat?.observedAt)&&heartbeat.observedAt<=now&&now-heartbeat.observedAt<=90000;
  const active=new Map();
  const currentTruth=readCurrentAssuranceTruth(filename,now);
  if(currentTruth.status==='CONFLICT')active.set('current-state-provenance',{severity:'HIGH',detail:'Independent coverage count conflicts with its source checks; current numeric assertion withheld'});
  if(verdict.status==='ASSURANCE_OVERDUE'||verdict.status==='SOURCE_UNAVAILABLE')active.set('cycle-monitor',{severity:'CRITICAL',detail:verdict.status});
  if(!watchdogFresh)active.set('watchdog',{severity:'CRITICAL',detail:'Independent inspector heartbeat stale or unavailable'});
  // Reconcile every retained cycle oldest-first so a recovery cannot erase an intervening incident.
  if(persist){
  const upsert=db.prepare(`INSERT INTO assurance_findings VALUES(?,?,?,'OPEN',?,?,NULL,?) ON CONFLICT(id) DO UPDATE SET status='OPEN',last_at=excluded.last_at,resolved_at=NULL,detail=excluded.detail`);
  const resolve=db.prepare("UPDATE assurance_findings SET status='RESOLVED',resolved_at=? WHERE source=? AND status='OPEN'");
  db.exec('BEGIN IMMEDIATE');
  try{
   for(const c of [...cycles].reverse())if(c.checks){for(const [source,check] of Object.entries(c.checks)){
    const id=source+':'+c.id;
    if(['FAIL','STALE','SOURCE_UNAVAILABLE'].includes(check.status))upsert.run(id,source,check.status==='FAIL'?'HIGH':'WARNING',c.completedAt,c.completedAt,JSON.stringify(check));
    // Only a subsequent affirmative check resolves an incident; unknown does not.
    if(check.status==='PASS')db.prepare("UPDATE assurance_findings SET status='RESOLVED',resolved_at=? WHERE source=? AND status='OPEN' AND last_at<?").run(c.completedAt,source,c.completedAt);
   }}
   for(const source of ['cycle-monitor','watchdog','current-state-provenance']){
    const a=active.get(source);
    if(a){
      // A new outage gets a new identity; never overwrite a resolved outage.
      const open=db.prepare("SELECT id FROM assurance_findings WHERE source=? AND status='OPEN' ORDER BY first_at LIMIT 1").get(source);
      upsert.run(open?.id??source+':'+now,source,a.severity,now,now,a.detail);
    }else if(source!=='current-state-provenance'||currentTruth.status==='CURRENT')resolve.run(now,source);
   }
   db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
  }
  const findings=db.prepare("SELECT * FROM assurance_findings ORDER BY (status='OPEN') DESC,last_at DESC LIMIT 100").all();
  let demonstration=null;try{demonstration=readDemo(filename);}catch{}
  const latest=cycles.find(c=>c.completedAt!==null);
  return {schema:'owner-assurance-evidence-v1',observedAt:now,status:!watchdogFresh?'ASSURANCE_OVERDUE':currentTruth.status==='CONFLICT'?'DEGRADED':verdict.status,healthy:watchdogFresh&&verdict.healthy&&currentTruth.status==='CURRENT',
   demonstration,currentTruth,scope:'Partial internal coverage; external commerce is unverified',nextCycleAt:(Math.floor(now/policy.intervalMs)+1)*policy.intervalMs,
   dueAt:verdict.due??null,lastCompletedAt:latest?.completedAt??null,lastSuccessfulAt:cycles.find(c=>c.checks&&Object.values(c.checks).every(v=>v.status==='PASS'))?.completedAt??null,
   watchdog:{fresh:watchdogFresh,observedAt:heartbeat?.observedAt??null},policy,
   coverage:REQUIRED_DOMAINS.map(source=>({source,classification:internal.has(source)?'IMPLEMENTED_UNVERIFIED':'NOT_IMPLEMENTED',...(latest?.checks?.[source]??{status:'NOT_CHECKED'}),evidenceReference:latest?.id??null})),
   findings,cycles,inferenceCalls:0,commerceWrites:0};
 }finally{db.close();}
}
