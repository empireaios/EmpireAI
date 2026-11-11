import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash}from'node:crypto';
const digest=b=>createHash('sha256').update(b).digest('hex');
const SOURCE='6c1e63ba20619ee480742fd87dc810ca93152e22';
const NAMES=['test2-native-startup.json','test2-independent-sqlite-readback.json','v116-test2-result.json'];
/** Publish only three declared synthetic examination receipts. Never enumerate,
 * chmod or read uploader-private files, canaries or other evidence. */
export function publishNativeReceipts(directory){
 assert.equal(process.getuid(),0,'EXAMINATION_OPERATOR_REQUIRED');assert.ok(path.isAbsolute(directory));assert.equal(fs.realpathSync(directory),directory);
 const root=fs.lstatSync(directory);assert.ok(root.isDirectory()&&!root.isSymbolicLink());const selected=[];
 for(const name of NAMES){
  const file=path.join(directory,name);if(!fs.existsSync(file)){assert.notEqual(name,'v116-test2-result.json','FINAL_NATIVE_RECEIPT_REQUIRED');continue;}
  const st=fs.lstatSync(file);assert.ok(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1,'REGULAR_EXCLUSIVE_RECEIPT_REQUIRED');assert.equal(st.uid,0,'OPERATOR_RECEIPT_OWNER_REQUIRED');assert.ok([0o600,0o644].includes(st.mode&0o777),'DECLARED_RECEIPT_MODE_REQUIRED');assert.ok(st.size>0&&st.size<=4194304,'BOUNDED_RECEIPT_REQUIRED');
  const bytes=fs.readFileSync(file),value=JSON.parse(bytes);
  if(name==='test2-native-startup.json'){assert.equal(value.source,SOURCE);assert.equal(value.syntheticOwnerOnly,true);assert.equal(value.captureRequested,false);}
  else if(name==='test2-independent-sqlite-readback.json'){assert.equal(value.integrity,'ok');assert.equal(value.readOnly,true);assert.equal(value.writersDrained,true);}
  else{assert.equal(value.source,SOURCE);assert.equal(value.scope,'V116_A2_21_ACTIVE_ORDER_UPGRADE');assert.equal(value.productionAccess,false);assert.equal(value.genuineOwnerEvidence,false);assert.equal(value.wholeRowAccepted,false);}
  selected.push({name,file,bytes,sha256:digest(bytes),modeBefore:st.mode&0o777});
 }
 // Validate every selected receipt before changing any mode.
 for(const item of selected){fs.chmodSync(item.file,0o644);assert.ok(fs.readFileSync(item.file).equals(item.bytes),'EVIDENCE_BYTES_CHANGED');assert.equal(fs.lstatSync(item.file).mode&0o777,0o644);}
 return {schema:'v116-test2-declared-native-evidence-handoff-v1',source:SOURCE,classification:'THREE_DECLARED_SYNTHETIC_EXAMINATION_RECEIPTS_ONLY',uploaderPrivateFilesTouched:false,receiptBytesUnchanged:true,files:selected.map(({name,bytes,sha256,modeBefore})=>({name,bytes:bytes.length,sha256,modeBefore,modeAfter:0o644})),wholeRowAccepted:false};
}
/** Host waits for this atomic complete marker before reading the final result.
 * A complete readable inode is linked without replacing any existing receipt. */
export function publishHandoffCompletion(directory,value){
 assert.equal(process.getuid(),0);assert.equal(value.schema,'v116-test2-declared-native-evidence-handoff-v1');assert.equal(value.source,SOURCE);assert.equal(fs.realpathSync(directory),directory);
 const final=path.join(directory,'test2-native-evidence-handoff.json'),temporary=final+'.publishing';assert.equal(fs.existsSync(final),false,'HANDOFF_ALREADY_PUBLISHED');
 const bytes=Buffer.from(JSON.stringify(value,null,2)),fd=fs.openSync(temporary,'wx',0o600);let created=true;
 try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);fs.fchmodSync(fd,0o644);fs.closeSync(fd);created=false;fs.linkSync(temporary,final);fs.unlinkSync(temporary);const dir=fs.openSync(directory,'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}assert.ok(fs.readFileSync(final).equals(bytes));return final;}
 finally{if(created)fs.closeSync(fd);if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
}
