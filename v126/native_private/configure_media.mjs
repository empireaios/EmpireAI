// Host-only binding after an actual authenticated browser principal/source read.
// This creates a narrow private technical policy, never a media event or owner review.
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
const request=read(path.join(runtime,'browser-output/connector-media-binding-request.json'));
assert.equal(request.schema,'v128-media-native-binding-request-v1');assert.equal(request.ownerActionObserved,false);assert.equal(request.ownerApproval,false);
const principal=request.principal,record=request.candidate,{digest,...body}=record;
assert.equal(principal.id,'usr_'+sha(cfg.founderEmail).slice(0,16));assert.equal(principal.role,'founder');assert.equal(principal.workspaceId,'ws_empire_1');assert.equal(principal.emailSHA256,sha(cfg.founderEmail));
assert.deepEqual(Object.keys(principal).sort(),['emailSHA256','id','role','workspaceId']);
for(const [key,route]of [['principalRead','/api/auth/me'],['candidateRead','/api/owner/commerce/portfolio?classification=REAL_READ_ONLY&page=1&pageSize=10']]){
 const r=request[key];assert.equal(r.route,route);assert.equal(r.method,'GET');assert.equal(r.status,200);assert.equal(r.transport,'AUTHENTICATED_BROWSER_FETCH');assert(Number.isSafeInteger(r.responseBytes)&&r.responseBytes>0&&r.responseBytes<=4194304);assert.match(r.responseSHA256,/^[a-f0-9]{64}$/);
}
assert.equal(sha(JSON.stringify(body)),digest);assert.equal(record.schema,'WORK8_CONNECTOR_SOURCE_CANDIDATE_V1');
assert.equal(record.workspace,principal.workspaceId);assert.equal(record.ownerApproval,false);assert.equal(record.qualifiedDossierAdmission,false);assert.equal(record.externalEffects,0);
assert.equal(record.source.supplierProductId,'2610240019051639200');assert.equal(record.source.supplierVariantId,'2610240019061630200');
const admission=read(path.join(runtime,'runtime-output/connector-source-admission.json'));
assert.equal(admission.status,'ADMITTED_SOURCE_OBSERVATION_ONLY');assert.deepEqual(admission.record,record,'ACTUAL_BROWSER_AND_NATIVE_SOURCE_MUST_MATCH');
assert.equal(record.softwareIdentity.adapterPublicationCommit,cfg.adapterPublicationCommit);assert.equal(record.softwareIdentity.applicationCommit,build.applicationCommit);
assert.equal(cfg.connectorOperationIdentity,authority.operationIdentity);assert.equal(cfg.authoritySHA256,sha(fs.readFileSync(path.join(control,'authority.json'))));
assert.equal(outer.approvalSha256,cfg.authoritySHA256);assert.equal(Date.parse(outer.expiresAt),cfg.expiresAtMs);assert(cfg.expiresAtMs>Date.now()+60000);
const module=build.backendOverlays.find(p=>p.destination==='backend/dist/runtime/commerce-runtime/governed/work8-connector-media.js');assert(module);assert.equal(sha(fs.readFileSync(path.join(control,module.sourceFile))),module.sha256);
const directory=path.join(privateDir,'media');assert.equal(fs.realpathSync(directory),directory);assert.equal(fs.statSync(directory).mode&0o777,0o700);
for(const [name,size,hash]of [['retained-original.jpg',149719,'4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048'],['retained-revised.png',599818,'69f1f95ab622041332d5e5e1ee43a59a2c34bd017151a6bb45e260f69e035788']]){
 const p=path.join(directory,name),s=fs.lstatSync(p);assert(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.uid===0&&s.size===size&&(s.mode&0o777)===0o444);assert.equal(sha(fs.readFileSync(p)),hash);
}
const policy={schema:'WORK8_CONNECTOR_PRIVATE_MEDIA_BINDING_V1',workspace:record.workspace,owner:principal.id,candidateId:record.id,candidateDigest:digest,rights:'PRIVATE_FACTUAL_PREPARATION_ONLY',publicPublicationAllowed:false,retainedReviewSHA256:'bd45ebfea787feef24dcd429044672c7aab4a76bd0176c0217070dc3432777d0',originalSHA256:'4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048',revisedSHA256:'69f1f95ab622041332d5e5e1ee43a59a2c34bd017151a6bb45e260f69e035788',authoritySHA256:cfg.authoritySHA256,expiresAtUTC:outer.expiresAt,applicationCommit:build.applicationCommit,publicationCommit:cfg.adapterPublicationCommit,moduleSHA256:module.sha256};
const target=path.join(directory,'private-media-binding.json'),temporary=target+'.tmp',bytes=Buffer.from(JSON.stringify(policy)+'\n');assert(bytes.length<8192);assert(!fs.existsSync(target));
const fd=fs.openSync(temporary,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o400);
try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
assert(!fs.existsSync(target));fs.renameSync(temporary,target);assert.equal(sha(fs.readFileSync(target)),sha(bytes));
fs.writeFileSync(path.join(runtime,'evidence/connector-media-policy-binding.json'),JSON.stringify({schema:'v128-actual-principal-candidate-media-policy-binding-v1',candidateId:record.id,candidateDigest:digest,principal,principalRead:request.principalRead,candidateRead:request.candidateRead,operationIdentity:authority.operationIdentity,authoritySHA256:cfg.authoritySHA256,publicationCommit:cfg.adapterPublicationCommit,moduleSHA256:module.sha256,policySHA256:sha(bytes),actualNativePrincipalAndCandidateReadBack:true,privatePolicyReadOnly:true,ownerActionObserved:false,ownerApproval:false})+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:'ACTUAL_NATIVE_PRINCIPAL_CANDIDATE_PRIVATE_MEDIA_BOUND',ownerApproval:false}));
