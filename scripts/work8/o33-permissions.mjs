import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Set modes while the operator still owns the inactive directory. CAP_CHOWN
// permits handoff; it does not permit a subsequent chmod on another owner.
export function mkdir(dir,uid=0,mode=0o755){
 fs.mkdirSync(dir,{recursive:true,mode});
 const st=fs.lstatSync(dir);assert.ok(st.isDirectory()&&!st.isSymbolicLink());
 if(st.uid===process.getuid())fs.chmodSync(dir,mode);
 else{assert.equal(st.uid,uid,'DIRECTORY_OWNER_MISMATCH');assert.equal(st.mode&0o777,mode,'DIRECTORY_MODE_MISMATCH');}
 fs.chownSync(dir,uid,uid);
 const after=fs.lstatSync(dir);assert.equal(after.uid,uid);assert.equal(after.gid,uid);assert.equal(after.mode&0o777,mode);
}

// Host-created evidence is already readable by its host uploader. Preserve its
// ownership and mode; only normalize files that this operator actually owns.
export function readableEvidence(dir){
 const uploaderUid=fs.lstatSync(dir).uid;
 const normalize=(file,st,directory)=>{
  assert.ok(!st.isSymbolicLink());
  if(st.uid===process.getuid())fs.chmodSync(file,directory?0o755:0o644);
  else{
   const required=st.uid===uploaderUid?(directory?0o500:0o400):(directory?0o005:0o004);
   assert.equal(st.mode&required,required,'HOST_EVIDENCE_NOT_READABLE');
  }
 };
 const walk=directory=>{
  const root=fs.lstatSync(directory);assert.ok(root.isDirectory()&&!root.isSymbolicLink());
  for(const name of fs.readdirSync(directory)){
   const file=path.join(directory,name),st=fs.lstatSync(file);
   if(st.isDirectory())walk(file);
   else{assert.ok(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1);normalize(file,st,false);}
  }
  normalize(directory,root,true);
 };
 walk(dir);
}
