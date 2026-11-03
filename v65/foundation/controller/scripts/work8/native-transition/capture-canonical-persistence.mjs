import {writeControlPrivate} from './private-exchanges.mjs';
import {safeHandoffFailure} from './private-handoff.mjs';
// Independent bounded read-only SQL operands for the V28 comparison.
// Raw selected-session records stay in the private control mount and are erased.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
const phase=process.argv[2];assert.ok(['normal','returned','replayed'].includes(phase));
const control=process.env.WORK8_CONTROL_DIR??'/control',evidence=process.env.WORK8_EVIDENCE_DIR??'/evidence';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
let db,operation='READ_PRIVATE_EXPECTATION';const receipt={schema:'work8-v29-private-canonical-capture-v1',phase,status:'FAIL',readOnlySqlite:true,rawRecordsPublished:false,readStartedAtMs:Date.now()};
try{
 const expected=JSON.parse(fs.readFileSync(control+'/expected-commerce.json','utf8'));
 const {session}=expected.snapshot;operation='VERIFY_SELECTED_SESSION';
 assert.match(session.sessionId,/^[A-Za-z0-9_.:-]{1,100}$/);assert.equal(session.workspace,'ws_empire_1');
 assert.equal(session.twinWorkspace,'twin_'+sha({workspace:session.workspace,owner:session.owner,sessionId:session.sessionId}).slice(0,48));
 operation='OPEN_READ_ONLY_COMMERCE_DATABASE';
 db=new DatabaseSync(process.env.WORK8_READBACK_DATABASE??'/data/work8-exam/native-transition/volume/commerce/runtime.sqlite',{readOnly:true,allowExtension:false});
 operation='CAPTURE_READ_ONLY_CANONICAL_RECORDS';
 db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 const tables=[];
 function rows(table,clause,bindings){const r=db.prepare('SELECT * FROM '+table+' WHERE '+clause+' ORDER BY rowid LIMIT 1025').all(...bindings);assert.ok(r.length<=1024,'CAPTURE_ROW_BOUND');tables.push({table,scopeSha256:sha(bindings),count:r.length,rowsSha256:sha(r)});return r;}
 const sessions=rows('work8_twin_events','workspace=? AND session=?',[session.workspace,session.sessionId]);
 const authorities=rows('work8_twin_authority','workspace=? AND session=?',[session.workspace,session.sessionId]);
 for(const table of ['work8_twin_admissions','work8_twin_observations'])rows(table,'workspace=? AND session=?',[session.workspace,session.sessionId]);
 for(const table of ['commerce_runtime_tasks','commerce_runtime_receipts'])rows(table,'workspace=?',[session.twinWorkspace]);
 const plans=rows('work8_sim_finance_plans','workspace=?',[session.twinWorkspace]);
 const eventRows=rows('work8_sim_finance_events','workspace=?',[session.twinWorkspace]);
 for(const table of ['work8_sim_finance_admission','work8_sim_finance_cursor'])rows(table,'workspace IN (?,?,?)',[session.twinWorkspace,'admit:'+session.twinWorkspace,'probe:'+session.twinWorkspace]);
 rows('work8_twin_scheduler','1=1',[]);
 db.exec('ROLLBACK');
 const latest=JSON.parse(sessions.at(-1)?.record??'null'),authority=JSON.parse(authorities.at(-1)?.record??'null');
 const canonical={sessionId:session.sessionId,sessionDigest:latest?.digest??null,authorityDigest:authority?.digest??null,tables};
 const finance=plans.map(row=>({missionId:row.mission,plan:JSON.parse(row.record),planDigest:row.digest,events:eventRows.filter(e=>e.mission===row.mission).sort((a,b)=>a.sequence-b.sequence).map(e=>JSON.parse(e.record))}));
 const payload={canonical,finance};const content=JSON.stringify(payload);assert.ok(Buffer.byteLength(content)<=1048576,'CAPTURE_PRIVATE_BYTE_BOUND');
 operation='TRANSFER_PRIVATE_CANONICAL_CAPTURE';receipt.privateHandoff=writeControlPrivate(phase+'-persistence.json',content,control,evidence);
 receipt.canonicalSha256=sha(canonical);receipt.tables=tables.map(({scopeSha256,...rest})=>rest);receipt.financePlans=finance.map(f=>({missionIdSha256:sha(f.missionId),planDigest:f.planDigest,eventsSha256:sha(f.events),recordedEventCount:f.events.length}));receipt.status='PASS_PRIVATE_CANONICAL_CAPTURE';
}catch(error){receipt.safeFailure=safeHandoffFailure(error,{operation,target:control+'/'+phase+'-persistence.json',label:phase.toUpperCase()+'_CANONICAL_PERSISTENCE'});process.exitCode=1;}
finally{try{db?.close();}catch(error){receipt.closeFailure=safeHandoffFailure(error,{operation:'CLOSE_READ_ONLY_COMMERCE_DATABASE',target:control+'/'+phase+'-persistence.json',label:phase.toUpperCase()+'_CANONICAL_PERSISTENCE'});receipt.status='FAIL';process.exitCode=1;}receipt.readCompletedAtMs=Date.now();fs.writeFileSync(evidence+'/'+phase+'-persistence-capture.json',JSON.stringify(receipt,null,2)+'\n');}
