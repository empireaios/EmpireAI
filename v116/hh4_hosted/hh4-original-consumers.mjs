// Execute the two original inspection consumers against one verified held copy.
// Raw synthetic session/database values stay in this isolated reader's tmpfs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),[source,digest]=process.argv.slice(2);
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(source,'6c1e63ba20619ee480742fd87dc810ca93152e22');assert.match(digest,/^[a-f0-9]{64}$/);
assert.equal(process.version,'v22.23.2');
assert.equal(fs.readFileSync('/proc/net/route','utf8').trim().split('\n').length,1);
assert(fs.readFileSync('/proc/net/ipv6_route','utf8').trim().split('\n').every(x=>!x||x.trim().endsWith('lo')));
assert.equal(require('/app/deployment/runtime-revision.cjs').resolveRuntimeRevision('/app',undefined),source);
const inputs=JSON.parse(fs.readFileSync('/control/hh4-consumer-source-inputs.json','utf8'));
for(const[relative,hash]of Object.entries(inputs.appSHA256))assert.equal(sha(fs.readFileSync('/app/'+relative)),hash,relative);
const ready=JSON.parse(fs.readFileSync('/input/hh4-worker-ready.json','utf8'));
assert.equal(ready.source,source);assert.equal(ready.inventory.source,source);assert.equal(ready.inventory.classification,'LABELLED_SYNTHETIC_INITIALIZATION');
const held=JSON.parse(fs.readFileSync('/input/hh4-held.json','utf8'));assert.equal(held.source,source);assert.equal(held.digest,digest);assert.equal(held.runId,ready.runId);
const producer=JSON.parse(fs.readFileSync('/input/held-capture-result.json','utf8'));assert.equal(producer.status,'PASS_HELD_CAPTURE_AND_CONTAINMENT_ONLY');assert.equal(producer.source,source);assert.equal(producer.contained,true);
const reports=[];
try{
 const {examineDomainRehydration}=await import('/app/scripts/work8/hh4-domain-rehydration.mjs');
 const domains=await examineDomainRehydration({repo:'/app',directory:'/capture',digest,source,inventory:ready.inventory,mode:'HELD_CAPTURE'});
 assert.equal(domains.status,'PASS_SCOPED_DOMAIN_REHYDRATION_ONLY');assert.equal(domains.checked.length,4);assert(domains.checked.every(x=>x.canonicalRecordsPreserved));
 fs.writeFileSync('/result/domain-rehydration-result.json',JSON.stringify(domains,null,2),{flag:'wx',mode:0o600});reports.push({scope:'original-four-domain-consumer',status:'PASS'});
}catch(error){reports.push({scope:'original-four-domain-consumer',status:'FAIL',error:String(error)});}
try{
 const {examineInspectionRestoration}=await import('/app/scripts/work8/hh4-inspection-restoration.mjs');
 const original=examineInspectionRestoration({directory:'/capture',digest,source,destination:'/tmp/inspection'});
 assert.equal(original.status,'PASS_INSPECTION_RESTORATION_ONLY');assert.equal(original.equality.equal,true);assert.equal(original.sourceCanonicalSha256,original.restoredCanonicalSha256);
 const{canonicalRecords,...publicResult}=original;
 publicResult.originalRawResultSHA256=sha(fs.readFileSync('/tmp/inspection/canonical-inspection-result.json'));
 publicResult.rawCanonicalRecordsPublished=false;publicResult.scope='All original inspection assertions executed; raw synthetic sessions/rows retained only in private disposable reader tmpfs.';
 fs.writeFileSync('/result/inspection-restoration-result.json',JSON.stringify(publicResult,null,2),{flag:'wx',mode:0o600});reports.push({scope:'original-canonical-inspection-consumer',status:'PASS'});
}catch(error){reports.push({scope:'original-canonical-inspection-consumer',status:'FAIL',error:String(error)});}
for(const[relative,hash]of Object.entries(inputs.appSHA256))assert.equal(sha(fs.readFileSync('/app/'+relative)),hash,relative);
const result={schema:'v116-original-hh4-consumer-summary-v1',source,digest,reports,status:reports.every(x=>x.status==='PASS')?'PASS_TWO_ORIGINAL_INSPECTION_CONSUMERS':'FAIL_CLOSED',sourceBytesUnchanged:true,rawCanonicalRecordsPublished:false,productionData:false,originalRequirementsAccepted:[]};
fs.writeFileSync('/result/consumer-summary.json',JSON.stringify(result,null,2),{flag:'wx',mode:0o600});
process.exitCode=result.status==='PASS_TWO_ORIGINAL_INSPECTION_CONSUMERS'?0:1;
