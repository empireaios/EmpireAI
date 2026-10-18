import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import { acquireAuthorityJsonCaptureFence, emptyAuthorityStore, loadAuthorityStore, resolveStorePath, saveAuthorityStore } from '../../orchestration/shadow-ceo-authority/repository/json-authority-store.js';
const url = new URL('../../orchestration/shadow-ceo-authority/repository/json-authority-store.ts', import.meta.url).href;
const prefix = `import fs from 'node:fs'; import * as m from ${JSON.stringify(url)};`;
function invocation(kind: string, root: string) {
  const args = kind === 'BlockedAction' ? "{id:'a',decision:'BLOCKED'}" : kind === 'ApprovalRequest' ? "{id:'a',source:'deterministic_store'}" : "{...m.emptyAuthorityStore().loop,running:false,reason:'updated'}";
  return `m.persist${kind}(${args},${JSON.stringify(root)});`;
}
function run(code: string) { return spawnSync(process.execPath, ['--import','tsx','--input-type=module','-e',prefix+code], {encoding:'utf8',timeout:15000}); }
for (const kind of ['BlockedAction','ApprovalRequest','LoopState']) {
  test(`${kind} locks the full read-modify-write and preserves competing records`, {timeout:30000}, async t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(),'authority-atomic-'));
    t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
    saveAuthorityStore(emptyAuthorityStore(),root);
    // Pause A just after the snapshot read. Previously B could commit here and
    // A would subsequently overwrite B. Updated writers must refuse and retry.
    const code = prefix+`const original=fs.readFileSync;let held=false;
      fs.readFileSync=function(file,...args){const result=original.call(this,file,...args);
      if(file===${JSON.stringify(resolveStorePath(root))}&&!held){held=true;fs.writeSync(1,'snapshot-read\\n');fs.readSync(0,Buffer.alloc(1),0,1,null);}return result;};`+invocation(kind,root);
    const child=spawn(process.execPath,['--import','tsx','--input-type=module','-e',code],{stdio:['pipe','pipe','pipe']});
    t.after(()=>child.kill('SIGKILL'));
    let errors='';child.stderr.on('data',chunk=>{errors+=chunk;});
    const exit=once(child,'exit');
    assert.match(String((await once(child.stdout,'data'))[0]),/snapshot-read/);
    const other=`m.persistApprovalRequest({id:'b',source:'deterministic_store'},${JSON.stringify(root)});`;
    const refused=run(other);
    assert.notEqual(refused.status,0);assert.match(refused.stderr,/AUTHORITY_JSON_SHARED_CAPTURE_BUSY/);
    child.stdin.end('x');assert.equal((await exit)[0],0,errors);
    const retry=run(other);assert.equal(retry.status,0,retry.stderr);
    const result=loadAuthorityStore(root);
    assert.ok(result.approvals.some(row=>(row as unknown as {id:string}).id==='b'));
    if(kind==='BlockedAction')assert.equal(result.blocked.length,1);
    if(kind==='ApprovalRequest')assert.equal(result.approvals.length,2);
    if(kind==='LoopState')assert.equal((result.loop as unknown as {reason:string}).reason,'updated');
  });
}
test('all mutators refuse cross-process capture without changing bytes',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'authority-capture-'));
  try{
    saveAuthorityStore(emptyAuthorityStore(),root);
    const before=fs.readFileSync(resolveStorePath(root),'utf8');
    const release=acquireAuthorityJsonCaptureFence(root);
    try{for(const kind of ['BlockedAction','ApprovalRequest','LoopState']){
      const result=run(invocation(kind,root));assert.notEqual(result.status,0);
      assert.match(result.stderr,/AUTHORITY_JSON_SHARED_CAPTURE_BUSY/);
      assert.equal(fs.readFileSync(resolveStorePath(root),'utf8'),before);
    }}finally{release();}
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
