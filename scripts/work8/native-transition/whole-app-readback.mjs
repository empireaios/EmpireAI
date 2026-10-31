// Source-declared bounded, read-only logical inventory. No raw database rows leave this process.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
const require=createRequire(import.meta.url),contract=require('/app/deployment/o33-path-contract.cjs');
const phase=process.argv[2];assert.ok(['normal','recovery','final'].includes(phase));
const root='/data/work8-exam/native-transition/volume';
const sha=x=>createHash('sha256').update(x).digest('hex');
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v);
const requiredDomains=['runtime','workers','scheduler','pillow-omissions','marketplace-orders','supplier-fulfilment-tracking','listing-drift','money-transactions','refunds-reimbursements','provider-accounting','evidence-freshness','authority-spending','persistence-backups-recovery'];
const validTime=n=>Number.isSafeInteger(n)&&n>=0;
const q=x=>'"'+x.replaceAll('"','""')+'"';
const state={schema:'work8-v26-whole-app-logical-inventory-v1',phase,stores:{},controls:{},native:{},generation:{}};
const receipt={schema:state.schema,phase,status:'FAIL',readOnlySqlite:true,sourceDeclaredSqliteStores:Object.keys(contract.SQL).length,rawRowsRetained:false,wholeRowsAccepted:[],dynamicDiagnosticChanges:[]};
function dbSnapshot(file,domain){
 if(!fs.existsSync(file))return {present:false};
 const st=fs.lstatSync(file);assert.ok(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1);assert.equal(fs.realpathSync(file),file);
 const db=new DatabaseSync(file,{readOnly:true,allowExtension:false,timeout:2000});
 try{db.exec('PRAGMA query_only=ON; BEGIN');assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  const tables={};const names=db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='table' ORDER BY name").all();assert.ok(names.length<=2000);
  for(const {name,sql} of names){const rows=db.prepare('SELECT * FROM '+q(name)+' LIMIT 50001').all();assert.ok(rows.length<=50000);const hashes=rows.map(r=>sha(json(r))).sort();tables[name]={schemaSha256:sha(sql||''),count:rows.length,hashes,logicalSha256:sha(json(hashes))};if(name==='sqlite_sequence')tables[name].sequences=Object.fromEntries(rows.map(r=>[r.name,Number(r.seq)]));
   if(domain==='assurance'&&name==='assurance_cycles')tables[name].mutableRows=Object.fromEntries(rows.map(r=>[sha(String(r.id)),{identitySha256:sha(json([r.id,r.scheduled_at,r.started_at])),scheduledAt:r.scheduled_at,startedAt:r.started_at,completedAt:r.completed_at,receiptSha256:r.receipt===null?null:sha(r.receipt),validCompletion:r.receipt===null?false:validCycle(r)}]));
   if(domain==='assurance'&&name==='cp_records')tables[name].mutableRows=Object.fromEntries(rows.map(r=>[sha(json([r.workspace,r.kind,r.id])),cpRecord(r)]));
   if(domain==='commerce'&&name==='work8_fulfilment_scan')tables[name].mutableRows=Object.fromEntries(rows.map(r=>[sha(r.workspace),JSON.parse(r.record)]));
   if(domain==='assurance'&&name==='assurance_findings')tables[name].mutableRows=Object.fromEntries(rows.map(r=>[sha(String(r.id)),{identitySha256:sha(json([r.id,r.source,r.severity,r.first_at])),firstAt:r.first_at,lastAt:r.last_at,status:r.status,resolvedAt:r.resolved_at,detailSha256:sha(r.detail)}]));}
  db.exec('COMMIT');return {present:true,applicationId:db.prepare('PRAGMA application_id').get().application_id,userVersion:db.prepare('PRAGMA user_version').get().user_version,tables};
 }finally{db.close();}
}
function validCycle(row){try{const r=JSON.parse(row.receipt),checks=Object.values(r.checks||{});return validTime(row.started_at)&&validTime(row.scheduled_at)&&validTime(row.completed_at)&&row.completed_at>=row.started_at&&row.started_at>=row.scheduled_at&&r.schema==='independent-assurance-cycle-v1'&&json(Object.keys(r.checks).sort())===json([...requiredDomains].sort())&&checks.length===13&&r.coverage.required===13&&checks.every(c=>['PASS','FAIL','NOT_CHECKED','STALE','SOURCE_UNAVAILABLE'].includes(c.status))&&r.coverage.passed===checks.filter(c=>c.status==='PASS').length&&r.healthy===(r.coverage.passed===13)&&r.liveProof===false&&r.commerceWrites===0&&r.inferenceCalls===0;}catch{return false;}}
function cpRecord(row){
 const body=JSON.parse(row.body),copy=structuredClone(body),base={kind:row.kind,bodySha256:sha(row.body)};
 if(row.kind==='heartbeat'){delete copy.at;return {...base,identitySha256:sha(json(copy)),at:body.at};}
 if(row.kind==='probe'){for(const key of ['status','summary','evidence','observedAt','sourceObservedAt','scopeContext'])delete copy[key];return {...base,identitySha256:sha(json(copy)),at:body.observedAt,status:body.status};}
 if(row.kind==='incident'){for(const key of ['lastAt','recurrence','status','limitation'])delete copy[key];return {...base,identitySha256:sha(json(copy)),at:body.lastAt,firstAt:body.firstAt,recurrence:body.recurrence,status:body.status,attempts:body.attempts,limitation:body.limitation??null};}
 return base;
}
function checkCp(prior,current){
 assert.ok(current,'CONTROL_PLANE_RECORD_DELETED');assert.equal(current.kind,prior.kind);
 if(prior.bodySha256===current.bodySha256)return;
 assert.ok(['heartbeat','probe','incident'].includes(prior.kind),'CONTROL_PLANE_AUTHORITY_OR_HISTORY_CHANGED');
 assert.equal(current.identitySha256,prior.identitySha256,'CONTROL_PLANE_IDENTITY_CHANGED');assert.ok(validTime(current.at)&&current.at>=prior.at,'CONTROL_PLANE_TIME_REGRESSED');
 if(prior.kind==='probe')assert.ok(['HEALTHY','DEGRADED','FAILED','NOT_APPLICABLE','EXTERNALLY_BLOCKED','UNAVAILABLE','STALE','NOT_CHECKED','UNVERIFIED','BLOCKED','NOT_INSTALLED'].includes(current.status));
 if(prior.kind==='incident'){assert.ok(current.recurrence>=prior.recurrence&&Number.isSafeInteger(current.recurrence));assert.equal(current.attempts,0,'NEW_RECOVERY_ATTEMPT');assert.ok(['DETECTED','UNRESOLVED'].includes(prior.status)&&['DETECTED','UNRESOLVED'].includes(current.status),'UNEXAMINED_INCIDENT_LIFECYCLE');if(prior.status==='UNRESOLVED')assert.equal(current.status,'UNRESOLVED');assert.ok(current.limitation===null||current.limitation==='No permitted recovery runbook');}
}
function fileSnapshot(file){if(!fs.existsSync(file))return {present:false};const s=fs.lstatSync(file);assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size<=1048576);return {present:true,bytes:s.size,sha256:sha(fs.readFileSync(file))};}
function nativeSnapshot(dir){if(!fs.existsSync(dir))return {present:false};const files={};function walk(p){for(const name of fs.readdirSync(p).sort()){const file=path.join(p,name),s=fs.lstatSync(file);assert.ok(!s.isSymbolicLink());if(s.isDirectory())walk(file);else{assert.ok(s.isFile()&&s.nlink===1&&s.size<=1048576);files[path.relative(dir,file)]={bytes:s.size,sha256:sha(fs.readFileSync(file))};}}}walk(dir);return {present:true,files};}
function assertSubset(before,after){const counts=new Map();for(const h of after)counts.set(h,(counts.get(h)||0)+1);for(const h of before){assert.ok(counts.get(h)>0,'ORIGINAL_LOGICAL_ROW_NOT_PRESERVED');counts.set(h,counts.get(h)-1);}}
try{
 assert.equal(Object.keys(contract.SQL).length,13);
 for(const [id,relative] of Object.entries(contract.SQL))state.stores[id]=dbSnapshot(path.join(root,relative),id);
 for(const relative of contract.CONTROL)state.controls[relative]=fileSnapshot(path.join(root,relative));
 for(const id of Object.keys(contract.NATIVE))state.native[id]=nativeSnapshot(contract.nativeRoot(root,id));
 state.generation=dbSnapshot(path.join(root,'authority/generation.sqlite'));assert.equal(state.generation.present,true,'GENERATION_AUTHORITY_MISSING');
 if(phase==='normal')fs.writeFileSync('/control/whole-app-baseline.json',json(state));
 else{
  const baseline=JSON.parse(fs.readFileSync('/control/whole-app-baseline.json','utf8'));
  assert.deepEqual(state.generation,baseline.generation,'GENERATION_AUTHORITY_CHANGED');
  assert.deepEqual(state.native,baseline.native,'NATIVE_CHILD_ROOT_CHANGED');
  for(const [name,before] of Object.entries(baseline.controls)){
   const after=state.controls[name];
   if(name==='commissioning/assurance.sqlite.watchdog'){if(json(before)!==json(after))receipt.dynamicDiagnosticChanges.push({store:'assuranceWatchdog',classification:'DIAGNOSTIC_ACTIVITY_NOT_HEALTH_ACCEPTANCE'});}
   else assert.deepEqual(after,before,'DECLARED_CONTROL_FILE_CHANGED');
  }
  for(const [id,before] of Object.entries(baseline.stores)){
   const after=state.stores[id];assert.equal(after.present,before.present,'DECLARED_STORE_PRESENCE_CHANGED');if(!before.present)continue;
   assert.equal(after.applicationId,before.applicationId);assert.equal(after.userVersion,before.userVersion);
   assert.deepEqual(Object.keys(after.tables),Object.keys(before.tables),'DECLARED_STORE_SCHEMA_CHANGED');
   for(const [name,table] of Object.entries(before.tables)){
    const next=after.tables[name];assert.equal(next.schemaSha256,table.schemaSha256,'DECLARED_TABLE_SCHEMA_CHANGED');
    if(id==='assurance'){
     if(name==='cp_records'){
      for(const [key,prior] of Object.entries(table.mutableRows))checkCp(prior,next.mutableRows[key]);
      for(const [key,current] of Object.entries(next.mutableRows))if(!table.mutableRows[key]){assert.ok(['heartbeat','probe','incident'].includes(current.kind),'NEW_CONTROL_PLANE_AUTHORITY');assert.ok(validTime(current.at));if(current.kind==='incident'){assert.equal(current.attempts,0);assert.ok(['DETECTED','UNRESOLVED'].includes(current.status));assert.ok(validTime(current.firstAt)&&current.firstAt<=current.at);assert.ok(Number.isSafeInteger(current.recurrence)&&current.recurrence>=1);assert.ok(current.limitation===null||current.limitation==='No permitted recovery runbook');}}
     }else if(name==='sqlite_sequence'){
      for(const [k,v] of Object.entries(table.sequences||{})){if(k==='cp_events')assert.ok(next.sequences[k]>=v);else assert.equal(next.sequences[k],v);}
      assert.ok(Object.keys(next.sequences).every(k=>k==='cp_events'||k in table.sequences));
     }else if(name==='assurance_cycles'||name==='assurance_findings'){
      for(const [key,prior] of Object.entries(table.mutableRows)){
       const current=next.mutableRows[key];assert.ok(current,'HISTORIC_ASSURANCE_ROW_DELETED');assert.equal(current.identitySha256,prior.identitySha256,'HISTORIC_ASSURANCE_IDENTITY_CHANGED');
       if(name==='assurance_cycles'){
        if(prior.completedAt!==null)assert.deepEqual(current,prior,'COMPLETED_ASSURANCE_RECEIPT_CHANGED');
        else if(current.completedAt===null)assert.deepEqual(current,prior,'UNFINISHED_ASSURANCE_ROW_CHANGED');
        else assert.ok(current.completedAt>=current.startedAt&&current.validCompletion,'INVALID_ASSURANCE_COMPLETION');
       }else{
        assert.ok(current.lastAt>=prior.lastAt&&current.lastAt>=current.firstAt,'ASSURANCE_FINDING_TIME_REGRESSED');
        assert.ok(['OPEN','RESOLVED'].includes(current.status));
        if(current.status==='OPEN'){assert.equal(current.resolvedAt,null);if(prior.status==='RESOLVED')assert.ok(current.lastAt>prior.resolvedAt&&current.lastAt>prior.lastAt,'STALE_FINDING_REOPEN');}
        else assert.ok(current.resolvedAt>=current.lastAt,'ASSURANCE_FINDING_RESOLUTION_INVALID');
        if(current.lastAt===prior.lastAt)assert.equal(current.detailSha256,prior.detailSha256,'HISTORIC_ASSURANCE_DETAIL_REWRITTEN');
       }
      }
      for(const [key,current] of Object.entries(next.mutableRows))if(!table.mutableRows[key]){
       if(name==='assurance_cycles'){assert.ok(validTime(current.scheduledAt)&&validTime(current.startedAt)&&current.startedAt>=current.scheduledAt,'NEW_CYCLE_TIME_INVALID');if(current.completedAt===null)assert.equal(current.receiptSha256,null);else assert.ok(current.validCompletion,'NEW_CYCLE_RECEIPT_INVALID');}
       else{assert.ok(validTime(current.firstAt)&&validTime(current.lastAt)&&current.lastAt>=current.firstAt);assert.ok(['OPEN','RESOLVED'].includes(current.status));if(current.status==='OPEN')assert.equal(current.resolvedAt,null);else assert.ok(validTime(current.resolvedAt)&&current.resolvedAt>=current.lastAt);}
      }
     }else assertSubset(table.hashes,next.hashes);
     if(table.logicalSha256!==next.logicalSha256)receipt.dynamicDiagnosticChanges.push({store:id,table:name,beforeCount:table.count,afterCount:next.count,classification:'SOURCE_DEFINED_DIAGNOSTIC_LIFECYCLE_NO_HEALTH_ACCEPTANCE'});
    }else if(id==='commerce'&&name==='work8_fulfilment_scan'){
     assert.deepEqual(Object.keys(next.mutableRows),Object.keys(table.mutableRows));
     for(const [key,prior] of Object.entries(table.mutableRows)){const current=next.mutableRows[key];assert.equal(current.after,'');assert.equal(current.blocked,false);assert.equal(current.watermark,prior.watermark);assert.ok(validTime(current.startedAt)&&current.startedAt>=prior.startedAt);assert.ok(validTime(current.completedAt)&&current.completedAt>=current.startedAt);}
     if(table.logicalSha256!==next.logicalSha256)receipt.dynamicDiagnosticChanges.push({store:id,table:name,classification:'BOUNDED_DERIVED_FULFILMENT_CURSOR_WITH_UNCHANGED_CANONICAL_WATERMARK'});
    }else if(id==='brain'&&name==='audit_logs')assertSubset(table.hashes,next.hashes);
    else if(id==='brain'&&name==='sqlite_sequence'){for(const [k,v] of Object.entries(table.sequences||{})){if(k==='audit_logs')assert.ok(next.sequences[k]>=v);else assert.equal(next.sequences[k],v,'UNEXPECTED_SEQUENCE_CHANGE');}assert.ok(Object.keys(next.sequences).every(k=>k==='audit_logs'||k in table.sequences));}
    else assert.deepEqual(next,table,'UNEXPLAINED_WHOLE_APPLICATION_DOMAIN_CHANGE:'+id+':'+name);
   }
  }
  receipt.unchangedNativeChildRoots=true;receipt.unchangedGenerationAuthority=true;receipt.originalBusinessAndStaticRowsPreserved=true;
 }
 receipt.stores=Object.fromEntries(Object.entries(state.stores).map(([id,s])=>[id,{...s,tables:s.tables&&Object.fromEntries(Object.entries(s.tables).map(([name,{hashes,mutableRows,...t}])=>[name,t]))}]));
 receipt.controls=state.controls;receipt.native=Object.fromEntries(Object.entries(state.native).map(([id,s])=>[id,{present:s.present,fileCount:Object.keys(s.files||{}).length,logicalSha256:sha(json(s.files||{}))}]));
 receipt.generationSha256=sha(json(state.generation));receipt.status='PASS_DECLARED_DOMAIN_PRESERVATION_WITH_SEPARATE_DIAGNOSTIC_CLASSIFICATION';
}finally{fs.writeFileSync('/evidence/'+phase+'-whole-app-readback.json',JSON.stringify(receipt,null,2)+'\n');}
