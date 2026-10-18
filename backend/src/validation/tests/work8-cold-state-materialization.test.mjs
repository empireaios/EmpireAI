import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {createRequire} from 'node:module';import {DatabaseSync} from 'node:sqlite';import {test} from 'node:test';
const require=createRequire(import.meta.url),{verifyColdState,materializeColdState}=require('../../../../deployment/work8-cold-state-materialization.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-cold-state-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const directory=path.join(root,'capture'),destination=path.join(root,'restored');fs.mkdirSync(directory,{mode:0o700});fs.mkdirSync(path.join(directory,'payload'),{mode:0o700});
 const contract={sourceCommit:'a'.repeat(40),frontendRevision:'b'.repeat(40),entries:[{id:'brain',target:'commissioning/brain.sqlite',kind:'sqlite'},{id:'authority',target:'shadow/authority.json',kind:'json'},{id:'redis',target:'sealed-redis.json',kind:'redis'},{id:'marker',target:'finance/evidence.sqlite.initialized',kind:'bytes'}],directories:['visual/records','continuity']};
 const db=new DatabaseSync(path.join(directory,'payload/brain'));db.exec("CREATE TABLE records(id TEXT PRIMARY KEY,value TEXT);INSERT INTO records VALUES('original','retained')");db.close();
 fs.writeFileSync(path.join(directory,'payload/authority'),JSON.stringify({birth:'NOT_BORN',commerce:'LOCKED',approvals:[]}));fs.writeFileSync(path.join(directory,'payload/redis'),JSON.stringify([{key:Buffer.from('session').toString('base64'),dump:Buffer.from('opaque-test-dump').toString('base64'),ttl:1000}]));fs.writeFileSync(path.join(directory,'payload/marker'),'initialized');
 const manifest={schema:'WORK8_COLD_STATE_MANIFEST_V1',sourceCommit:contract.sourceCommit,frontendRevision:contract.frontendRevision,inventoryComplete:true,bootAllowed:false,noExecutionAuthority:true,directories:contract.directories,entries:contract.entries.map(e=>{const b=fs.readFileSync(path.join(directory,'payload',e.id));return {...e,size:b.length,sha256:sha(b)};})};
 function seal(){const bytes=JSON.stringify(manifest);fs.writeFileSync(path.join(directory,'cold-state.json'),bytes);return sha(bytes);}
 const f={root,directory,destination,contract,manifest,seal,digest:seal()};return f;
}
test('materializes pinned closed inventory into a fresh target without changing source or enabling boot',t=>{
 const f=fixture(t),before=fs.readFileSync(path.join(f.directory,'cold-state.json'));const result=materializeColdState(f);
 assert.equal(result.receipt.bootAllowed,false);assert.equal(result.receipt.redisActivated,false);assert.equal(result.receipt.sourceQuarantineProven,false);assert.equal(result.receipt.noExecutionAuthority,true);
 for(const e of f.manifest.entries)assert.equal(sha(fs.readFileSync(path.join(f.destination,e.target))),e.sha256);
 for(const d of f.contract.directories)assert.deepEqual(fs.readdirSync(path.join(f.destination,d)),[]);
 assert.deepEqual(fs.readFileSync(path.join(f.directory,'cold-state.json')),before);assert.equal(fs.existsSync(f.destination+'.restore-lock'),false);
 const db=new DatabaseSync(path.join(f.destination,'commissioning/brain.sqlite'),{readOnly:true});try{assert.equal(db.prepare('SELECT value FROM records').get().value,'retained');}finally{db.close();}
});
test('rejects inspection archives and incomplete inventory despite self-consistent digests',t=>{
 const f=fixture(t);f.manifest.schema='WORK8_RUNTIME_RECOVERY_SET_V1';assert.throws(()=>materializeColdState({...f,digest:f.seal()}),/COMPLETE_MANIFEST_REQUIRED/);f.manifest.schema='WORK8_COLD_STATE_MANIFEST_V1';f.manifest.inventoryComplete=false;assert.throws(()=>materializeColdState({...f,digest:f.seal()}),/INCOMPLETE/);f.manifest.inventoryComplete=true;f.manifest.entries.pop();assert.throws(()=>materializeColdState({...f,digest:f.seal()}),/CONTRACT_MISMATCH/);assert.equal(fs.existsSync(f.destination),false);
});
test('rejects digest tampering and unexpected payload files',t=>{
 const f=fixture(t);fs.appendFileSync(path.join(f.directory,'payload/marker'),'tamper');assert.throws(()=>materializeColdState(f),/SIZE|DIGEST/);fs.writeFileSync(path.join(f.directory,'payload/marker'),'initialized');fs.writeFileSync(path.join(f.directory,'payload/extra'),'unknown');assert.throws(()=>materializeColdState(f),/CONTRACT_MISMATCH/);assert.equal(fs.existsSync(f.destination),false);
});
test('rejects aliased, linked and partial destinations without modifying them',t=>{
 const f=fixture(t);assert.throws(()=>materializeColdState({...f,destination:path.join(f.directory,'target')}),/ALIAS/);fs.mkdirSync(f.destination);fs.writeFileSync(path.join(f.destination,'existing'),'preserve');assert.throws(()=>materializeColdState(f),/NOT_FRESH/);assert.equal(fs.readFileSync(path.join(f.destination,'existing'),'utf8'),'preserve');
 fs.symlinkSync(f.directory,path.join(f.root,'linked'));assert.throws(()=>verifyColdState({...f,directory:path.join(f.root,'linked')}),/SYMLINK/);
 fs.renameSync(path.join(f.directory,'payload/marker'),path.join(f.root,'marker'));fs.symlinkSync(path.join(f.root,'marker'),path.join(f.directory,'payload/marker'));assert.throws(()=>verifyColdState(f),/SYMLINK/);
});
test('rejects traversal, duplicated paths and parent/file collisions in pinned contract',t=>{
 const f=fixture(t),copy=()=>structuredClone(f.contract);let contract=copy();contract.entries[0].target='../escape';assert.throws(()=>verifyColdState({...f,contract}),/RELATIVE_PATH/);contract=copy();contract.entries[1].target=contract.entries[0].target;assert.throws(()=>verifyColdState({...f,contract}),/DUPLICATE/);contract=copy();contract.entries[1].target='commissioning';assert.throws(()=>verifyColdState({...f,contract}),/PATH_COLLISION/);
});
test('copy failure cleans new staging and never leaves a final target or admission marker',t=>{
 const f=fixture(t);const original=fs.writeFileSync;let injected=false;
 fs.writeFileSync=function(file,...args){if(String(file).includes('.work8-cold-stage-')&&!injected){injected=true;throw Error('INJECTED_WRITE_FAILURE');}return original.call(this,file,...args);};
 try{assert.throws(()=>materializeColdState(f),/INJECTED_WRITE_FAILURE/);}finally{fs.writeFileSync=original;}
 assert.equal(injected,true);assert.equal(fs.existsSync(f.destination),false);assert.equal(fs.existsSync(f.destination+'.restore-lock'),false);assert.deepEqual(fs.readdirSync(f.root),['capture']);
});
test('existing crash lock fails closed without stealing it',t=>{
 const f=fixture(t);fs.mkdirSync(f.destination+'.restore-lock');assert.throws(()=>materializeColdState(f),/EEXIST/);assert.equal(fs.existsSync(f.destination),false);assert.ok(fs.statSync(f.destination+'.restore-lock').isDirectory());
});

test('dangling target symlinks and hard-linked payloads are not fresh isolated state',t=>{
 const f=fixture(t);fs.symlinkSync(path.join(f.root,'missing'),f.destination);assert.throws(()=>materializeColdState(f),/NOT_FRESH/);assert.ok(fs.lstatSync(f.destination).isSymbolicLink());fs.unlinkSync(f.destination);
 fs.linkSync(path.join(f.directory,'payload/marker'),path.join(f.root,'marker-link'));assert.throws(()=>materializeColdState(f),/UNSAFE_FILE/);assert.equal(fs.existsSync(f.destination),false);
});
