import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {MemoryController} from '../../visual-memory-engine/memory-controller.js';
import {MemoryPersistenceStore} from '../../visual-memory-engine/memory-persistence-store.js';
import {DEFAULT_VISUAL_MEMORY_CONFIGURATION} from '../../visual-memory-engine/configuration.js';
const {verifyVisualMemorySnapshot}=createRequire(import.meta.url)('../../../../deployment/work8-recovery-set.cjs');
const fixture=()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'visual-recovery-'));const store=new MemoryPersistenceStore(root,{...DEFAULT_VISUAL_MEMORY_CONFIGURATION,storageRoot:'visual'});store.initialize();return {root,store};};
test('exact byte capture holds all local mutations and cleans up success/failure',async()=>{
 const {root,store}=fixture();try{
  store.saveIndex([]);fs.writeFileSync(path.join(store.getRecordsDir(),'record-a.json'),' {"record":{"memoryRecordId":"record-a"}}\n');
  let release!:()=>void;const gate=new Promise<void>(r=>{release=r;});let captured=false;
  const capture=store.withRecoverySnapshot(async snapshot=>{captured=true;verifyVisualMemorySnapshot(snapshot);assert.equal(Buffer.from(snapshot.files.find(x=>x.path==='records/record-a.json')!.bytes,'base64').toString(),' {"record":{"memoryRecordId":"record-a"}}\n');await gate;return snapshot;});
  assert.equal(captured,true);assert.equal(store.isRecoveryHeld(),true);
  const other=new MemoryPersistenceStore(root,{...DEFAULT_VISUAL_MEMORY_CONFIGURATION,storageRoot:'visual'});
  assert.throws(()=>other.saveIndex([]),/SHARED_CAPTURE_BUSY/);
  const moduleURL=new URL('../../visual-memory-engine/memory-persistence-store.ts',import.meta.url).href;
  const configURL=new URL('../../visual-memory-engine/configuration.ts',import.meta.url).href;
  const program=`import assert from 'node:assert/strict';import {MemoryPersistenceStore} from ${JSON.stringify(moduleURL)};import {DEFAULT_VISUAL_MEMORY_CONFIGURATION} from ${JSON.stringify(configURL)};const s=new MemoryPersistenceStore(${JSON.stringify(root)},{...DEFAULT_VISUAL_MEMORY_CONFIGURATION,storageRoot:'visual'});assert.throws(()=>s.initialize(),/SHARED_CAPTURE_BUSY/);assert.throws(()=>s.delete('record-a'),/SHARED_CAPTURE_BUSY/);assert.throws(()=>s.saveIndex([]),/SHARED_CAPTURE_BUSY/);`;
  const child=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',program],{encoding:'utf8',timeout:10000});assert.equal(child.status,0,child.stderr);

  assert.throws(()=>store.saveIndex([]),/RECOVERY_HELD/);assert.throws(()=>store.delete('record-a'),/RECOVERY_HELD/);assert.throws(()=>store.write({record:{memoryRecordId:'b'}} as never),/RECOVERY_HELD/);
  await assert.rejects(store.withRecoverySnapshot(async()=>0),/ALREADY_HELD/);
  release();await capture;assert.equal(store.isRecoveryHeld(),false);store.delete('record-a');
  await assert.rejects(store.withRecoverySnapshot(async()=>{throw Error('injected');}),/injected/);assert.equal(store.isRecoveryHeld(),false);store.saveIndex([]);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('unsafe aliases corrupt bytes and unknown inventory refuse without retaining hold',async()=>{
 const {root,store}=fixture();try{
  fs.writeFileSync(path.join(root,'outside.json'),'{}');fs.symlinkSync(path.join(root,'outside.json'),path.join(store.getRecordsDir(),'alias.json'));
  await assert.rejects(store.withRecoverySnapshot(async()=>0),/FILE_UNSAFE/);assert.equal(store.isRecoveryHeld(),false);
  fs.unlinkSync(path.join(store.getRecordsDir(),'alias.json'));fs.writeFileSync(path.join(store.getRecordsDir(),'bad.json'),'{');
  await assert.rejects(store.withRecoverySnapshot(async()=>0),SyntaxError);
  fs.unlinkSync(path.join(store.getRecordsDir(),'bad.json'));fs.writeFileSync(path.join(store.getStorageDir(),'unmapped'),'state');
  await assert.rejects(store.withRecoverySnapshot(async()=>0),/INVENTORY_UNKNOWN/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('sealed inventory rejects duplicate paths and traversal',()=>{
 const base={schema:'VISUAL_MEMORY_INSPECTION_V1',sourceStoragePath:'/isolated/visual',operationalRestoreAvailable:false,files:[{path:'index.json',mode:0o600,bytes:Buffer.from('{}').toString('base64')}]};
 verifyVisualMemorySnapshot(base);assert.throws(()=>verifyVisualMemorySnapshot({...base,files:[...base.files,...base.files]}));assert.throws(()=>verifyVisualMemorySnapshot({...base,files:[{...base.files[0],path:'records/../escape.json'}]}));
});
test('complete recovery manifest binds visual inventory and rejects changed sealed bytes',async()=>{
 const {root,store}=fixture();const parent=fs.mkdtempSync(path.join(os.tmpdir(),'visual-seal-'));
 const require=createRequire(import.meta.url);const {DatabaseSync}=require('node:sqlite');
 const adapter=require('../../../../deployment/work8-recovery-set.cjs');
 try{
  const names={...require('../../../../deployment/work8-system-vault.cjs').STORES,brain:'brain.sqlite',missions:'brain.sqlite.missions.sqlite',execution:'brain.sqlite.mission-execution.sqlite',shadow:'shadow.sqlite'};
  for(const relative of Object.values(names) as string[]){const file=path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});const db=new DatabaseSync(file);db.exec('CREATE TABLE preserved(id TEXT PRIMARY KEY); INSERT INTO preserved VALUES (\'original\')');db.close();}
  store.saveIndex([]);const originalBytes=' {"record":{"memoryRecordId":"kept"}}\n';fs.writeFileSync(path.join(store.getRecordsDir(),'kept.json'),originalBytes,{mode:0o640});
  for(const name of ['authority','requestOwners'])fs.writeFileSync(path.join(root,name+'.json'),'{}');
  const result=await store.withRecoverySnapshot(visualMemorySnapshot=>adapter.captureRuntimeRecoverySet({root,primaryPath:path.join(root,'brain.sqlite'),shadowPath:path.join(root,'shadow.sqlite'),authorityFile:path.join(root,'authority.json'),requestOwnersFile:path.join(root,'requestOwners.json'),destination:path.join(parent,'sealed'),sourceCommit:'a'.repeat(40),frontendRevision:'b'.repeat(40),captureId:'11111111-1111-4111-8111-111111111111',captureRedis:async()=>[],visualMemorySnapshot}));
  adapter.finalizeRuntimeRecoverySet(result);assert.match(result.manifest.visualMemoryDigest,/^[a-f0-9]{64}$/);adapter.verifyRuntimeRecoverySet(result);
  const restored=adapter.materializeVisualMemoryInspection({...result,destination:path.join(parent,'restored')});assert.equal(restored.bootAllowed,false);assert.ok(fs.existsSync(path.join(restored.visualMemoryPath,'records')));assert.equal(fs.readFileSync(path.join(restored.visualMemoryPath,'records/kept.json'),'utf8'),originalBytes);assert.equal(fs.statSync(path.join(restored.visualMemoryPath,'records/kept.json')).mode&0o777,0o640);const reopened=new MemoryPersistenceStore(restored.directory,{...DEFAULT_VISUAL_MEMORY_CONFIGURATION,storageRoot:'visual-memory'});reopened.initialize();assert.equal(reopened.read('kept')?.record.memoryRecordId,'kept');
  assert.throws(()=>adapter.materializeVisualMemoryInspection({...result,destination:path.join(parent,'restored')}));
  const staged=adapter.stageRuntimeRecoveryInspection({...result,destination:path.join(parent,'staged')});assert.ok(fs.existsSync(path.join(staged.directory,'visual-memory-inspection','INSPECTION_ONLY.json')));
  const file=path.join(result.directory,'visual-memory.json');fs.appendFileSync(file,' ');assert.throws(()=>adapter.verifyRuntimeRecoverySet(result));assert.throws(()=>adapter.materializeVisualMemoryInspection({...result,destination:path.join(parent,'corrupt')}));assert.equal(fs.existsSync(path.join(parent,'corrupt')),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(parent,{recursive:true,force:true});}
});

test('controller cleanup skips only shared capture contention and rejects aliased writer roots',async()=>{
 const {root,store}=fixture();try{
  const config={...DEFAULT_VISUAL_MEMORY_CONFIGURATION,storageRoot:'visual'};
  const controller=new MemoryController(root,null as never,null as never,null as never,null as never,null as never,null as never,null as never,config);
  await controller.initialize();
  await store.withRecoverySnapshot(async()=>{assert.doesNotThrow(()=>controller.runCleanup());});
  assert.doesNotThrow(()=>controller.runCleanup());
  fs.symlinkSync(store.getStorageDir(),path.join(root,'alias'));
  const alias=new MemoryPersistenceStore(root,{...config,storageRoot:'alias'});
  await store.withRecoverySnapshot(async()=>{assert.throws(()=>alias.saveIndex([]),/LOCK_ROOT_UNSAFE/);assert.throws(()=>alias.initialize(),/LOCK_ROOT_UNSAFE/);});
  const aliasController=new MemoryController(root,null as never,null as never,null as never,null as never,null as never,null as never,null as never,{...config,storageRoot:'alias'});
  assert.throws(()=>aliasController.runCleanup(),/LOCK_ROOT_UNSAFE/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
