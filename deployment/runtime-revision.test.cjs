'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {resolveRuntimeRevision}=require('./runtime-revision.cjs');
test('rollback without Git environment metadata retains the image revision; drift fails closed',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'image-revision-'));
 try{
  fs.mkdirSync(path.join(root,'backend/dist'),{recursive:true});
  const file=path.join(root,'backend/dist/runtime-revision.json'),revision='a'.repeat(40);
  fs.writeFileSync(file,JSON.stringify({revision}));
  assert.equal(resolveRuntimeRevision(root,undefined),revision);
  assert.equal(resolveRuntimeRevision(root,''),revision);
  assert.equal(resolveRuntimeRevision(root,revision),revision);
  assert.throws(()=>resolveRuntimeRevision(root,'b'.repeat(40)),/mismatch/);
  assert.throws(()=>resolveRuntimeRevision(root,'main'),/mismatch/);
  fs.writeFileSync(file,JSON.stringify({revision:'main'}));
  assert.throws(()=>resolveRuntimeRevision(root,undefined),/Invalid image/);
  fs.unlinkSync(file);assert.throws(()=>resolveRuntimeRevision(root,undefined));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
