import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {REQUIRED_DOMAINS,inspectAssurance} from './independent-assurance.mjs';
const policy={epoch:0,intervalMs:300000,graceMs:120000};
/** Read the due independent cycle, never a cached/older PASS or conversation count.
 * Missing/conflicting/stale evidence carries no current numeric assertion.
 */
export function readCurrentAssuranceTruth(filename,now=Date.now()) {
 const base={metric:'independent_assurance_domains',source:'assurance.sqlite:assurance_cycles',readAt:now,
  observedAt:null,evidenceReference:null,passed:null,total:REQUIRED_DOMAINS.length,
  status:'UNKNOWN',grantsAuthority:false,scope:'Partial internal monitoring; not Birth diagnostics or commerce readiness'};
 let db;
 try {
  const stat=fs.lstatSync(filename);
  if(!stat.isFile()||fs.realpathSync(filename)!==filename||stat.size>64*1024*1024)throw Error('Unsafe source');
  const verdict=inspectAssurance(filename,{...policy,now});
  if(!verdict.receipt)return {...base,status:verdict.status};
  db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:1000});
  db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF');
  const row=db.prepare('SELECT id,completed_at,receipt FROM assurance_cycles WHERE scheduled_at=?').get(verdict.due);
  if(!row?.receipt)return {...base,status:'SOURCE_UNAVAILABLE'};
  const receipt=JSON.parse(row.receipt),checks=receipt.checks;
  const evidence={...base,observedAt:row.completed_at,evidenceReference:row.id};
  if(receipt.schema!=='independent-assurance-cycle-v1'||!checks||Object.keys(checks).length!==REQUIRED_DOMAINS.length||REQUIRED_DOMAINS.some(k=>!['PASS','FAIL','STALE','NOT_CHECKED','SOURCE_UNAVAILABLE'].includes(checks[k]?.status))||
    receipt.coverage?.required!==REQUIRED_DOMAINS.length||receipt.coverage?.passed!==Object.values(checks).filter(c=>c.status==='PASS').length)
   return {...evidence,status:'CONFLICT'};
  const heartbeat=JSON.parse(fs.readFileSync(filename+'.watchdog','utf8'));
  if(!Number.isSafeInteger(heartbeat.observedAt)||heartbeat.observedAt>now||now-heartbeat.observedAt>90000)
   return {...evidence,status:'STALE'};
  return {...evidence,status:'CURRENT',passed:receipt.coverage.passed};
 }catch{return {...base,status:'SOURCE_UNAVAILABLE'};}
 finally{db?.close();}
}
