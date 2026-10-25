import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';
import {mkdir,readableEvidence} from '../o33-correction/scripts/work8/o33-permissions.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'o33-permission-local-'));
try{
 const d=path.join(root,'owned');mkdir(d,0,0o700);assert.equal(fs.statSync(d).mode&0o777,0o700);
 const f=path.join(d,'evidence');fs.writeFileSync(f,'preserve',{mode:0o600});readableEvidence(d);assert.equal(fs.statSync(d).mode&0o777,0o755);assert.equal(fs.statSync(f).mode&0o777,0o644);assert.equal(fs.readFileSync(f,'utf8'),'preserve');
 fs.symlinkSync(f,path.join(d,'symlink'));assert.throws(()=>readableEvidence(d));fs.unlinkSync(path.join(d,'symlink'));
 fs.linkSync(f,path.join(d,'hardlink'));assert.throws(()=>readableEvidence(d));
 console.log(JSON.stringify({node:process.version,status:'PASS',checks:['operator-owned directory exact mode','operator-owned evidence readability and bytes','symlink refusal','hardlink refusal'],limits:'UID0 only; foreign ownership/nonroot access require staged hosted preflight'},null,2));
}finally{fs.rmSync(root,{recursive:true,force:true});}
