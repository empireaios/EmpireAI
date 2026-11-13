// Host-only binding of the actual admitted native candidate to the reviewed supplement.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(process.getuid(),0);assert.equal(process.version,'v22.23.2');
assert.equal(sha(fs.readFileSync(process.execPath)),'3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327');
assert.equal(process.argv.length,4);const runtime=process.argv[2],privateDir=process.argv[3];
for(const p of [runtime,privateDir])assert.equal(fs.realpathSync(p),p);
assert.equal(path.dirname(runtime),path.dirname(privateDir));
const control=path.dirname(fileURLToPath(import.meta.url));
const read=p=>{const s=fs.lstatSync(p);assert(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size<4194304);return JSON.parse(fs.readFileSync(p));};
const cfg=read(path.join(privateDir,'native-bootstrap.json')),outer=read(path.join(privateDir,'owner-policy.json'));
const authority=read(path.join(control,'authority.json')),build=read(path.join(control,'connector-build-manifest.json'));
const receipt=read(path.join(runtime,'runtime-output/connector-source-admission.json'));
assert.equal(receipt.status,'ADMITTED_SOURCE_OBSERVATION_ONLY');assert.equal(receipt.replayStatus,'ALREADY_ADMITTED');
assert.equal(receipt.buildManifestSHA256,sha(fs.readFileSync(path.join(control,'connector-build-manifest.json'))));
assert.equal(receipt.ownerActionObserved,false);assert.equal(receipt.ownerDecisionGranted,false);
const record=receipt.record,{digest,...body}=record;assert.equal(digest,sha(JSON.stringify(body)));
assert.equal(record.workspace,'ws_empire_1');assert.equal(record.source.supplierProductId,'2610240019051639200');
assert.equal(record.source.supplierVariantId,'2610240019061630200');assert.equal(record.source.supplierSKU,'CJYD335906902BY');
assert.equal(receipt.canonical.candidates.length,1);assert.equal(receipt.canonical.candidates[0].digest,digest);
assert.equal(cfg.connectorOperationIdentity,authority.operationIdentity);assert.equal(cfg.authoritySHA256,sha(fs.readFileSync(path.join(control,'authority.json'))));
assert.equal(outer.approvalSha256,cfg.authoritySHA256);assert.equal(Date.parse(outer.expiresAt),cfg.expiresAtMs);assert(cfg.expiresAtMs>Date.now());
assert.equal(build.applicationCommit,'6c1e63ba20619ee480742fd87dc810ca93152e22');assert.match(cfg.adapterPublicationCommit,/^[a-f0-9]{40}$/);
const module=build.backendOverlays.find(p=>p.destination==='backend/dist/runtime/commerce-runtime/governed/work8-connector-walkthrough.js');assert(module);
assert.equal(sha(fs.readFileSync(path.join(control,module.sourceFile))),module.sha256);
const policy={schema:'WORK8_CONNECTOR_WALKTHROUGH_ADMISSION_V1',operationId:authority.operationIdentity+'-WALKTHROUGH',
 workspace:'ws_empire_1',candidateId:record.id,candidateDigest:digest,authoritySHA256:cfg.authoritySHA256,
 expiresAtUTC:outer.expiresAt,expectedCurrentCount:0,applicationCommit:build.applicationCommit,
 publicationCommit:cfg.adapterPublicationCommit,moduleSHA256:module.sha256};
const target=path.join(privateDir,'connector-walkthrough-policy.json'),temporary=target+'.tmp';
const bytes=Buffer.from(JSON.stringify(policy)+'\n');assert(bytes.length<4096);
const fd=fs.openSync(temporary,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o400);
try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
assert(!fs.existsSync(target),'WALKTHROUGH_POLICY_ALREADY_PRESENT');fs.renameSync(temporary,target);assert.equal(sha(fs.readFileSync(target)),sha(bytes));
const s=fs.statSync(target);assert.equal(s.uid,0);assert.equal(s.mode&0o777,0o400);assert.equal(s.nlink,1);
fs.writeFileSync(path.join(runtime,'evidence/connector-walkthrough-policy-binding.json'),JSON.stringify({
 schema:'v128-actual-candidate-walkthrough-policy-binding-v1',candidateId:record.id,candidateDigest:digest,
 operationIdentity:policy.operationId,authoritySHA256:cfg.authoritySHA256,publicationCommit:policy.publicationCommit,
 moduleSHA256:module.sha256,policySHA256:sha(bytes),expiresAtUTC:policy.expiresAtUTC,
 actualNativeRecordReadBack:true,privatePolicyReadOnly:true,ownerDecisionGranted:false})+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:'ACTUAL_NATIVE_CANDIDATE_POLICY_BOUND',ownerDecisionGranted:false}));
