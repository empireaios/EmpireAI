// Read-only verification of the exact completed V140 evidence package.
// Raw authenticated receipts stay outside git. No application/provider code is
// imported and no intake, original acceptance test or owner operation is replayed.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

const args=process.argv.slice(2);
assert.equal(args.length,4,'Usage: node verify-work8-fulfilment-evidence.mjs --evidence-dir DIR --base-db FILE');
assert.equal(args[0],'--evidence-dir');assert.equal(args[2],'--base-db');
const directory=fs.realpathSync(args[1]),basePath=fs.realpathSync(args[3]);
assert.ok(fs.statSync(directory).isDirectory());
const sha=b=>createHash('sha256').update(b).digest('hex');
const pins={
 'candidate-source-manifest.json':'2f6c6fad162e9f4e6e4b136b7c138dcd00acfda09ea9a0128ac731317b775257',
 'amazon-freight-applicability-read.json':'fe773c64ce130f9ba9a3164f3f1c29f505024c5942b3caeaad91ed906823cf94',
 'authorized-shops-read.json':'1717c15bea5514c847e6800b53615341e347f643b122e001069aa78faaa77240',
 'native-execution-result.json':'67ee63699576a678e4b2ff380c73c1bf6254cc8e816112ac892199a7efd4c07e',
 'native-fulfilment-readback.json':'f2e36393cdb0513d4dccdabe07cccc5341e09801d5d25f84b0b40bc448aaa4e8',
 'fulfilment-native-process-receipt.json':'a7811dcf0a1e5a0cc02a240e45808868a5e8caa5cc650ed7205dd2aebab2ade0',
 'fulfilment-native.sqlite':'dbaa32868053997f7d07064b98c5c3ddf46a32c93827c4321ca36c45ee46ac1a'
};
const BASE_SHA='87ce01b9a761cd7c2b690e401b4d4589de2852d22c9a767242ff817d9fdd5473';
const bytes={};
for(const[name,pin]of Object.entries(pins)){const file=path.join(directory,name);assert.ok(fs.lstatSync(file).isFile());assert.ok(fs.statSync(file).size<=4*1024*1024,'Evidence file bound');bytes[name]=fs.readFileSync(file);assert.equal(sha(bytes[name]),pin,'Exact evidence pin: '+name);}
assert.equal(sha(fs.readFileSync(basePath)),BASE_SHA,'Exact V139 baseline pin');
const json=name=>JSON.parse(bytes[name]),terminal=json('native-execution-result.json'),processReceipt=json('fulfilment-native-process-receipt.json'),retained=json('native-fulfilment-readback.json');
assert.equal(terminal.operation,'V140-CJ-FULFILMENT-SUPPLEMENT-01');assert.equal(terminal.sourceManifestSHA256,pins['candidate-source-manifest.json']);
assert.equal(processReceipt.exitCode,0);assert.equal(processReceipt.terminatedFor,null);assert.equal(processReceipt.automaticRetries,0);assert.ok(processReceipt.elapsedSeconds<=30&&processReceipt.peakObservedRSSBytes<=268435456);
const targetPath=path.join(directory,'fulfilment-native.sqlite'),before=new DatabaseSync(basePath,{readOnly:true,allowExtension:false}),after=new DatabaseSync(targetPath,{readOnly:true,allowExtension:false});
let priorCount=0;
try{
 const schema=db=>db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' ORDER BY name").all();assert.deepEqual(schema(before),schema(after));
 const rows=(db,table)=>{assert.match(table,/^[A-Za-z0-9_]+$/);return db.prepare('SELECT * FROM "'+table+'" ORDER BY rowid').all();};
 const original=rows(before,'objects'),current=rows(after,'objects');priorCount=original.length;
 for(const item of original)assert.deepEqual(current.find(x=>x.workspace===item.workspace&&x.kind===item.kind&&x.id===item.id),item);
 assert.equal(current.length,original.length+2);
 for(const{name}of schema(before))if(name!=='objects')assert.deepEqual(rows(before,name),rows(after,name));
 const records=current.filter(x=>x.kind==='work8_fulfilment_supplement');assert.equal(records.length,1);
 const r=JSON.parse(records[0].body),{digest,...body}=r;assert.equal(digest,sha(Buffer.from(JSON.stringify(body))));assert.deepEqual(r,retained.record);
 const imports=current.filter(x=>x.kind==='work8_fulfilment_import');assert.equal(imports.length,1);assert.deepEqual(JSON.parse(imports[0].body),retained.receipt);
 const actual=JSON.parse(json('amazon-freight-applicability-read.json').result.content[0].text);assert.equal(actual.length,29);assert.equal(r.options.length,29);
 for(let i=0;i<29;i++){
  const raw=actual[i],saved=r.options[i];assert.equal(saved.rowDigest,sha(Buffer.from(JSON.stringify(raw))));
  assert.equal(saved.optionId,raw.optionId);assert.equal(saved.arrivalTime,raw.arrivalTime??null);assert.equal(saved.optionArrivalTime,raw.option.arrivalTime??null);
  for(const field of ['discountFee','wrapPostage','postage','remoteFee','taxesFee','clearanceOperationFee','totalPostageFee'])assert.equal(saved.reportedUSD[field],raw[field]??null);
  assert.equal(saved.reportedUSD.euTariff,raw.tariff??null);assert.equal(saved.selected,false);assert.equal(saved.taxInclusiveGuarantee,false);
 }
 assert.equal(r.options.filter(x=>!x.timingFieldsAgree).length,22);assert.equal(r.options.filter(x=>x.reportedUSD.taxesFee===null).length,29);assert.equal(r.options.filter(x=>x.reportedUSD.clearanceOperationFee===null).length,23);
 assert.equal(r.disposition.status,'DEFERRED');assert.equal(r.disposition.qualified,false);assert.equal(r.disposition.privateImageRightsReopened,false);assert.equal(r.disposition.pillowAssessment,null);assert.equal(r.disposition.ownerDecision,null);
 assert.equal(r.interpretation.filterApplication,'UNVERIFIED');assert.equal(r.accountBindingObservation.amazonSellerAccountBindingProven,false);assert.equal(r.inputValidity.renewedByFreightRead,false);assert.equal(r.inputValidity.detailLocalAdmissionExpiryUTC,'2026-11-14T13:48:16.420Z');
 assert.ok(!JSON.stringify(r).includes('"uid"'));assert.equal(after.prepare('PRAGMA quick_check').get().quick_check,'ok');
}finally{before.close();after.close();}
assert.equal(sha(fs.readFileSync(basePath)),BASE_SHA);assert.equal(sha(fs.readFileSync(targetPath)),pins['fulfilment-native.sqlite']);
console.log(JSON.stringify({schema:'WORK8_V140_RETAINED_FULFILMENT_READONLY_VERIFY_V1',status:'PASS_EXACT_RETAINED_EVIDENCE',originalRowsPreserved:priorCount,newNativeObjects:2,optionRows:29,conflictingTimingRows:22,unknownUSTaxRows:29,unknownClearanceRows:23,qualification:'DEFERRED',originalPredicatesNewlyAccepted:0,wholeRequirementsNewlyAccepted:0,databaseBytesUnchanged:true,providerOperations:0,examinationReplayed:false}));
