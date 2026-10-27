import test from 'node:test';
import assert from 'node:assert/strict';
import {validateIsolatedRedisBinding} from './work8-isolated-redis-capability.ts';
const binding={source:'a'.repeat(40),captureDigest:'b'.repeat(64),sourceRunId:'c'.repeat(40),targetRunId:'d'.repeat(40),host:'target-redis',port:6379,db:0};
const proof={schema:'work8-isolated-redis-restore-v1',mode:'inspection-only',nonce:'11111111-1111-1111-1111-111111111111',expiresAt:2000,sourceGeneration:'22222222-2222-2222-2222-222222222222',targetGeneration:'33333333-3333-3333-3333-333333333333',...binding};
test('exact binding accepted',()=>validateIsolatedRedisBinding(proof,binding,1000));
for(const [key,value] of Object.entries({source:'e'.repeat(40),captureDigest:'e'.repeat(64),sourceRunId:'e'.repeat(40),targetRunId:'e'.repeat(40),host:'remote.example',port:6380,db:1,mode:'operational',expiresAt:999,targetGeneration:proof.sourceGeneration}))test('refuse '+key,()=>assert.throws(()=>validateIsolatedRedisBinding({...proof,[key]:value},binding,1000)));
test('refuse source target alias',()=>assert.throws(()=>validateIsolatedRedisBinding({...proof,targetRunId:binding.sourceRunId},{...binding,targetRunId:binding.sourceRunId},1000)));
test('refuse oversized lifetime',()=>assert.throws(()=>validateIsolatedRedisBinding({...proof,expiresAt:182000},binding,1000)));
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {protectedFile,verifyIsolatedRedisAuthorities,reserveIsolatedRedisCapability} from './work8-isolated-redis-capability.ts';
const base=fs.mkdtempSync('/root/work8-redis-proof-');
process.on('exit',()=>fs.rmSync(base,{recursive:true,force:true}));
function fixture(){const dir=fs.mkdtempSync(path.join(base,'case-'));const file=path.join(dir,'proof.json');fs.writeFileSync(file,'{}',{mode:0o444});return {dir,file};}
test('actual immutable root file accepted and chmod rejected',()=>{const {file}=fixture();assert.equal(protectedFile(file,true).toString(),'{}');fs.chmodSync(file,0o644);assert.throws(()=>protectedFile(file,true));});
test('actual writable ancestry rejected',()=>{const {dir,file}=fixture();fs.chmodSync(dir,0o777);assert.throws(()=>protectedFile(file,true));});
test('actual symlink and hardlink rejected',()=>{const {dir,file}=fixture();fs.symlinkSync(file,path.join(dir,'link'));assert.throws(()=>protectedFile(path.join(dir,'link'),true));fs.linkSync(file,path.join(dir,'hard'));assert.throws(()=>protectedFile(file,true));});
test('actual runtime-owned file rejected',t=>{const {file}=fixture();try{fs.chownSync(file,65534,65534);}catch(e){if(['EINVAL','EPERM'].includes(e.code)){t.skip('Host cannot map runtime UID65534; hosted proof required');return;}throw e;}assert.throws(()=>protectedFile(file,true));});
test('actual exclusive durable consume rejects replay',()=>{const {file}=fixture();const p={...proof,expiresAt:Date.now()+10000};reserveIsolatedRedisCapability(file,p,binding);assert.deepEqual(JSON.parse(fs.readFileSync(file+'.consumed')),{nonce:p.nonce,...binding});assert.throws(()=>reserveIsolatedRedisCapability(file,p,binding),/EEXIST/);});
test('expired proof creates no consumed marker',()=>{const {file}=fixture();assert.throws(()=>reserveIsolatedRedisCapability(file,{...proof,expiresAt:Date.now()-1},binding));assert.equal(fs.existsSync(file+'.consumed'),false);});
test('actual SQLite generation and lineage mismatch rejection',()=>{
 const root='/data/work8-exam/redis-proof-'+process.pid;fs.mkdirSync(root,{recursive:true,mode:0o755});
 try{const p={...proof};for(const role of ['source','target']){
  const dir=root+'-'+role+'/volume/authority';fs.mkdirSync(dir,{recursive:true,mode:0o755});const file=dir+'/generation.sqlite';
  const db=new DatabaseSync(file);db.exec('CREATE TABLE authority(id INTEGER,generation TEXT,sources TEXT)');db.prepare('INSERT INTO authority VALUES(1,?,?)').run(p[role+'Generation'],JSON.stringify([binding.source]));db.close();fs.chmodSync(file,0o644);p[role+'Authority']=file;
 }
 verifyIsolatedRedisAuthorities(p,binding);assert.throws(()=>verifyIsolatedRedisAuthorities({...p,targetGeneration:p.sourceGeneration},binding));assert.throws(()=>verifyIsolatedRedisAuthorities(p,{...binding,source:'e'.repeat(40)}));
 }finally{for(const x of [root,root+'-source',root+'-target'])fs.rmSync(x,{recursive:true,force:true});}
});
