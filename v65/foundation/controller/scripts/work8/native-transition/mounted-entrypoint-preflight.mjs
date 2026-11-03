import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {protectedPath}=require('/app/deployment/runtime-membership-controller.cjs');
const source='6c1e63ba20619ee480742fd87dc810ca93152e22';
const membershipSha256='59e7ea679ad41cd8663d80c1e98364242fcec00c98744e77f682814a8d124f1b';
const hash=b=>createHash('sha256').update(b).digest('hex');
const mode=process.argv[2];
assert.ok(['original','checkout','corrected','writer-refusal'].includes(mode));
const base=JSON.parse(fs.readFileSync('/examination/live-brain-overlay.json','utf8'));
const instrumentation=JSON.parse(fs.readFileSync('/examination/startup-overlays.json','utf8'));
assert.equal(base.underlyingSource,source);assert.equal(instrumentation.backendSource,source);
const files=[{sourceFile:'live-brain-index-overlay.js',target:base.originalPath,originalSha256:base.originalSha256,overlaySha256:base.overlaySha256},...instrumentation.files];
assert.equal(new Set(files.map(x=>x.target)).size,files.length);
assert.ok(files.every(x=>x.target==='/app/backend/dist/index.js'||/^\/app\/deployment\/[a-z0-9-]+\.(cjs|mjs)$/.test(x.target)));
const status=fs.readFileSync('/proc/self/status','utf8');
const identity={uid:process.getuid(),gid:process.getgid(),groups:process.getgroups(),capEff:status.match(/^CapEff:\s+(\S+)/m)[1],capPrm:status.match(/^CapPrm:\s+(\S+)/m)[1],capBnd:status.match(/^CapBnd:\s+(\S+)/m)[1],noNewPrivileges:status.match(/^NoNewPrivs:\s+(\S+)/m)[1]==='1'};
assert.equal(process.versions.node,'22.23.2');assert.equal(identity.noNewPrivileges,true);
assert.equal(hash(fs.readFileSync('/app/deployment/runtime-membership-controller.cjs')),membershipSha256);
const {resolveRuntimeRevision}=require('/app/deployment/runtime-revision.cjs');
assert.equal(resolveRuntimeRevision('/app',source),source);
const mountRows=fs.readFileSync('/proc/self/mountinfo','utf8').trim().split('\n').map(line=>line.split(' '));
function metadata(target){
 const ancestors=[];for(let p=target;;p=path.dirname(p)){const s=fs.lstatSync(p);ancestors.push({path:p,uid:s.uid,gid:s.gid,mode:s.mode&0o7777,isSymlink:s.isSymbolicLink(),dev:s.dev,ino:s.ino});if(path.dirname(p)===p)break;}
 const mount=mountRows.find(fields=>fields[4]===target);
 return {canonicalRealpath:fs.realpathSync(target)===target,ancestors,readOnlyBindMount:mount?mount[5].split(',').includes('ro'):null,sha256:hash(fs.readFileSync(target))};
}
const rows=[];let failure=null;
try{
if(mode==='writer-refusal'){
 assert.equal(identity.uid,65534);assert.equal(identity.gid,65534);assert.equal(identity.capEff,'0000000000000000');assert.equal(identity.capPrm,'0000000000000000');
 for(const item of files){
  const before=metadata(item.target);const row={target:item.target,...before,writeOpenErrno:null,renameRefusalErrno:null,parentWriteErrno:null,contentUnchanged:null};rows.push(row);let error=null;
  try{const fd=fs.openSync(item.target,fs.constants.O_WRONLY);fs.closeSync(fd);}catch(e){error=e.code;}
  row.writeOpenErrno=error;
  assert.ok(['EROFS','EACCES','EPERM'].includes(error),'OVERLAY_WRITER_ACCESS_NOT_REFUSED');
  let replacement=null;
  // Attempt to move only this disposable instrumentation mount. Successful
  // mutation is a hard pre-startup failure; application startup never follows.
  try{fs.renameSync(item.target,item.target+'.work8-forbidden-replacement');}catch(e){replacement=e.code;}
  row.renameRefusalErrno=replacement;
  assert.ok(['EROFS','EACCES','EPERM','EBUSY'].includes(replacement),'OVERLAY_REPLACEMENT_NOT_REFUSED');
  let parentWrite=null;try{fs.accessSync(path.dirname(item.target),fs.constants.W_OK);}catch(e){parentWrite=e.code;}
  row.parentWriteErrno=parentWrite;
  assert.ok(['EROFS','EACCES','EPERM'].includes(parentWrite),'APPLICATION_PARENT_WRITABLE');
  assert.equal(hash(fs.readFileSync(item.target)),before.sha256);assert.equal(before.sha256,item.overlaySha256);
  row.contentUnchanged=true;
 }
}else{
 assert.equal(identity.uid,0);assert.equal(identity.gid,0);
 for(const item of files){
  const observed=metadata(item.target);let protectedResult='PASS',error=null;
  try{protectedPath(item.target,0);}catch(e){protectedResult='REFUSED';error=['OPERATOR_PATH_NOT_PROTECTED','NONCANONICAL_OPERATOR_PATH'].includes(e.message)?e.message:'UNCLASSIFIED_PROTECTED_PATH_REFUSAL';}
  const expected=(mode==='original'||(mode==='checkout'&&item.target!=='/app/backend/dist/index.js'))?item.originalSha256:item.overlaySha256;
  rows.push({target:item.target,...observed,originalProtectedPathResult:protectedResult,code:error,expectedSha256:expected});
  assert.equal(observed.sha256,expected,'EXACT_ENTRYPOINT_HASH_CHANGED');
  if(mode!=='checkout'){assert.equal(protectedResult,'PASS','ORIGINAL_PROTECTED_PATH_REFUSED');assert.equal(observed.canonicalRealpath,true);}
  if(mode==='corrected')assert.equal(observed.readOnlyBindMount,true,'OVERLAY_BIND_MOUNT_NOT_READONLY');
 }
}
}catch(error){
 const allowed=new Set(['EXACT_ENTRYPOINT_HASH_CHANGED','ORIGINAL_PROTECTED_PATH_REFUSED','OVERLAY_BIND_MOUNT_NOT_READONLY','OVERLAY_WRITER_ACCESS_NOT_REFUSED','OVERLAY_REPLACEMENT_NOT_REFUSED','APPLICATION_PARENT_WRITABLE']);
 const firstLine=String(error.message??'').split('\n')[0];const errno=['EACCES','EPERM','EROFS','ENOENT','EBUSY'].includes(error.code)?error.code:null;
 failure={operation:mode,code:allowed.has(firstLine)?firstLine:'UNCLASSIFIED_ENTRYPOINT_CONTRACT_FAILURE',errno,sourceFrames:(String(error.stack??'').match(/mounted-entrypoint-preflight\.mjs:[0-9]+:[0-9]+/g)??[]).slice(0,3),rawErrorRetained:false};
}
// A receipt is observation only. The host persists it and gates on explicit
// PASS; a zero process exit is never used as the security acceptance predicate.
console.log(JSON.stringify({schema:'work8-v32-mounted-entrypoint-observation-v1',status:failure?'FAIL_ENTRYPOINT_CONTRACT':'PASS_COMPLETED_OBSERVATION',firstFailure:failure,mode,source,nodeVersion:process.versions.node,membershipSourceSha256:membershipSha256,originalProtectedPathExecuted:true,applicationStarted:false,identity,files:rows,rawApplicationContentsRetained:false}));
