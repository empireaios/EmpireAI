// Phase A executes only synthetic file exchanges. No application imports or startup.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {preparePrivateHandoff,completePrivateHandoff,readPrivateHandoff,processSecurityIdentity,safeHandoffFailure,privateControlOwner} from './private-handoff.mjs';
import {transferredFiles,browserFiles,writerOnlyFiles,hostFiles,exchangeOptions,writeControlPrivate} from './private-exchanges.mjs';
const mode=process.argv[2],control='/control',identity=processSecurityIdentity();
const synthetic=name=>JSON.stringify({schema:'WORK8_V29_SYNTHETIC_PRIVATE_BYTES',syntheticOnly:true,exchange:name});
const digest=name=>createHash('sha256').update(synthetic(name)).digest('hex');
const emit=x=>console.log(JSON.stringify(x));
let owner,operation='VERIFY_PRIVATE_PARENT',operationTarget=control+'/synthetic-only.json';
const receipt={schema:'work8-v29-private-file-role-v1',mode,status:'FAIL',identity,applicationStarted:false,syntheticBytesOnly:true,rawContents:false};
function verifyIdentity(root=false){
 assert.equal(identity.effectiveUid,root?0:mode==='wrong-reader'?65534:owner.uid);assert.equal(identity.effectiveGid,root?0:mode==='wrong-reader'?65534:owner.gid);
 for(const key of ['CapInh','CapAmb'])assert.equal(identity.capabilities[key],'0000000000000000');
 for(const key of ['CapEff','CapPrm'])assert.equal(identity.capabilities[key],root?'00000000000800e3':'0000000000000000');
 if(root){assert.equal(identity.capabilities.CapBnd,'00000000000800e3');assert.equal(identity.noNewPrivileges,true);assert.equal(identity.nodeVersion,'v22.23.2');}
 else{assert.match(identity.capabilities.CapBnd,/^[a-f0-9]{16}$/);assert.equal(typeof identity.noNewPrivileges,'boolean');}
}
const read=(name,ownerUid,ownerGid,ownerContract='CONTROL_READER')=>{operation='ACTUAL_READER_READFILE';operationTarget=control+'/'+name;const actual=fs.readFileSync(operationTarget);operation='ACTUAL_READER_CHECKSUM';assert.equal(createHash('sha256').update(actual).digest('hex'),digest(name),'ACTUAL_READFILE_CHECKSUM_CHANGED');return {...readPrivateHandoff({target:operationTarget,expectedSha256:digest(name),expectedBytes:Buffer.byteLength(synthetic(name)),ownerUid,ownerGid,ownerContract,label:name.toUpperCase().replaceAll(/[^A-Z0-9]/g,'_')}),actualReadFileSyncChecksumVerified:true};};
try{
 owner=mode==='wrong-reader'?null:privateControlOwner(control);operation='VERIFY_ACTUAL_PROCESS_IDENTITY';
 verifyIdentity(['writer','root-final-reader'].includes(mode));
 if(mode==='writer'){
  assert.equal(identity.effectiveUid,0);assert.equal(identity.effectiveGid,0);assert.equal(identity.capabilities.CapEff,'00000000000800e3');assert.equal(identity.noNewPrivileges,true);assert.equal(identity.nodeVersion,'v22.23.2');assert.notEqual(owner.uid,0);assert.notEqual(owner.uid,65534);
  receipt.hostControls=hostFiles.map(name=>read(name,owner.uid,owner.gid));
  receipt.immutableWriteRefusals=[];
  for(const target of ['/examination/.work8-v29-write-refusal','/run/empire-policy/.work8-v29-write-refusal','/app/backend/.work8-v29-write-refusal']){
   operation='VERIFY_IMMUTABLE_WRITE_REFUSAL';operationTarget=target;let denied;try{fs.writeFileSync(target,'synthetic',{flag:'wx',mode:0o600});}catch(error){denied=error.code;}
   assert.equal(denied,'EROFS','IMMUTABLE_MOUNT_WRITE_NOT_REFUSED');receipt.immutableWriteRefusals.push({classification:target.split('/')[1],errno:denied});
  }
  const legacy=control+'/old-ordering-synthetic.json';operationTarget=legacy;operation='LEGACY_CREATE_PRIVATE_0600';fs.writeFileSync(legacy,synthetic('old-ordering-synthetic.json'),{flag:'wx',mode:0o600});operation='LEGACY_TRANSFER_OWNERSHIP';fs.chownSync(legacy,owner.uid,owner.gid);operation='LEGACY_CHMOD_AFTER_OWNERSHIP_TRANSFER';
  let reproduced;try{fs.chmodSync(legacy,0o600);}catch(error){reproduced=safeHandoffFailure(error,{operation:'LEGACY_CHMOD_AFTER_OWNERSHIP_TRANSFER',target:legacy,label:'SYNTHETIC_OLD_ORDERING'});}
  receipt.oldOrderingReproduction={...(reproduced??{status:'UNEXPECTED_LEGACY_CHMOD_SUCCESS',operation:'LEGACY_CHMOD_AFTER_OWNERSHIP_TRANSFER',errno:null,identity}),historicalFailureErrno:'UNKNOWN',currentReproductionOnly:true};assert.equal(reproduced?.errno,'EPERM','OLD_ORDERING_REPRODUCTION_DIFFERENT');operation='REMOVE_OLD_ORDERING_SYNTHETIC_FILE';fs.unlinkSync(legacy);
  const tokens=transferredFiles.map(name=>preparePrivateHandoff(exchangeOptions(name,synthetic(name))));
  emit({schema:receipt.schema,event:'PREPARED_NOT_TRANSFERRED',identity,pending:tokens.map(t=>({name:path.basename(t.target),pendingName:path.basename(t.pendingPath),receipt:t.receipt}))});
  const deadline=Date.now()+90000;while(!fs.existsSync(control+'/phase-a-release.json')){assert.ok(Date.now()<deadline,'PHASE_A_RELEASE_TIMEOUT');await new Promise(resolve=>setTimeout(resolve,50));}
  receipt.transferred=tokens.map(completePrivateHandoff);
  receipt.writerOnly=writerOnlyFiles.map(name=>writeControlPrivate(name,synthetic(name)));
  receipt.writerOnlyReadback=writerOnlyFiles.map(name=>read(name,0,0,'WRITER_ONLY'));
  receipt.status='PASS_PRIVATE_WRITER';
 }else if(mode==='reader-before'){
  assert.equal(identity.effectiveUid,owner.uid);assert.equal(identity.effectiveGid,owner.gid);assert.equal(identity.capabilities.CapEff,'0000000000000000');
  receipt.refusals=transferredFiles.map(name=>{
   operation='READER_LIST_PREPARED_PRIVATE_FILE';operationTarget=control+'/'+name;
   const candidates=fs.readdirSync(control).filter(file=>file.startsWith('.'+name+'.pending-'));assert.equal(candidates.length,1);
   const target=control+'/'+candidates[0];operation='READER_BEFORE_FINAL_OWNERSHIP';operationTarget=target;let failure;try{fs.readFileSync(target);}catch(error){failure=safeHandoffFailure(error,{operation:'READER_BEFORE_FINAL_OWNERSHIP',target,label:name.toUpperCase().replaceAll(/[^A-Z0-9]/g,'_')});}
   assert.equal(failure?.errno,'EACCES','READER_ACCESSED_UNTRANSFERRED_BYTES');assert.equal(fs.existsSync(control+'/'+name),false);return failure;
  });receipt.status='PASS_READER_REFUSED_BEFORE_TRANSFER';
 }else if(mode==='reader-after'){
  assert.equal(identity.effectiveUid,owner.uid);assert.equal(identity.effectiveGid,owner.gid);assert.equal(identity.capabilities.CapEff,'0000000000000000');
  receipt.transferredReads=transferredFiles.map(name=>read(name,owner.uid,owner.gid));
  receipt.hostControls=hostFiles.map(name=>read(name,owner.uid,owner.gid));
  receipt.browserWrites=browserFiles.map(name=>writeControlPrivate(name,synthetic(name)));
  receipt.browserReadback=browserFiles.map(name=>read(name,owner.uid,owner.gid));
  receipt.rootBaselineRefusal=[];
  for(const name of writerOnlyFiles){let denied;try{fs.readFileSync(control+'/'+name);}catch(error){denied=error.code;}assert.equal(denied,'EACCES');receipt.rootBaselineRefusal.push({classification:name.toUpperCase().replaceAll(/[^A-Z0-9]/g,'_'),errno:denied});}
  receipt.status='PASS_ACTUAL_BROWSER_READER_AND_WRITER';
 }else if(mode==='root-final-reader'){
  assert.equal(identity.effectiveUid,0);assert.equal(identity.effectiveGid,0);assert.equal(identity.capabilities.CapEff,'00000000000800e3');assert.equal(identity.noNewPrivileges,true);
  receipt.privateInputs=[...browserFiles,...transferredFiles,...hostFiles].map(name=>read(name,owner.uid,owner.gid));
  receipt.finalWholeAppBaseline=read('whole-app-baseline.json',0,0,'WRITER_ONLY');
  receipt.finalCommerceInputs=['expected-commerce.json','expected-recovery-commerce.json'].map(name=>read(name,owner.uid,owner.gid));
  receipt.status='PASS_INDEPENDENT_FINAL_READER_EXCHANGES';
 }else if(mode==='wrong-reader'){
  assert.equal(identity.effectiveUid,65534);assert.equal(identity.effectiveGid,65534);assert.equal(identity.capabilities.CapEff,'0000000000000000');
  receipt.refusals=[...transferredFiles,...browserFiles,...writerOnlyFiles,...hostFiles].map(name=>{let failure;const target=control+'/'+name;try{fs.readFileSync(target);}catch(error){failure=safeHandoffFailure(error,{operation:'WRONG_PRINCIPAL_PRIVATE_READ',target,label:name.toUpperCase().replaceAll(/[^A-Z0-9]/g,'_')});}assert.equal(failure?.errno,'EACCES','WRONG_PRINCIPAL_READ_NOT_REFUSED');return failure;});
  receipt.status='PASS_WRONG_PRINCIPAL_REFUSED';
 }else throw Error('UNREVIEWED_PREFLIGHT_MODE');
}catch(error){receipt.failure=safeHandoffFailure(error,{operation,target:operationTarget,label:'PHASE_A_SYNTHETIC_ONLY'});process.exitCode=1;}
emit(receipt);
