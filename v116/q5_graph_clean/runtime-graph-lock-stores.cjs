'use strict';
// Explicit synthetic control-test stores, never canonical owner/business evidence.
// The schemas reproduce the existing seven-lock-boundary fixture contracts.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const definitions=[
 {relative:'commissioning/empireai-brain.db.missions.sqlite',id:0x454d5352,version:3,ddl:'CREATE TABLE mission_snapshot(value INTEGER);INSERT INTO mission_snapshot VALUES(1)'},
 {relative:'commissioning/empireai-brain.db.mission-execution.sqlite',id:0x454d4558,version:1,ddl:'CREATE TABLE execution_events(value INTEGER);CREATE TABLE execution_jobs(value INTEGER);CREATE TABLE execution_meta(value INTEGER)'},
 ...['commissioning/intelligence.sqlite','commissioning/pillow-institutional.sqlite','commissioning/pillow-request-receipts.sqlite','commissioning/pillow-reasoning.sqlite','commissioning/communications.sqlite','commissioning/openai-october-2026.sqlite','commissioning/assurance.sqlite','finance/evidence.sqlite','commerce/runtime.sqlite'].map(relative=>({relative,id:0,version:0,ddl:'CREATE TABLE boundary(value INTEGER);INSERT INTO boundary VALUES(1)'}))
];
function createNativeLockFixtures(volume,state){
 assert.equal(process.getuid(),0);assert.equal(state,path.join(volume,'commissioning'));
 assert.match(volume,/^\/work8-exam\/case-[a-f0-9-]{36}\/volume$/);
 assert.equal(fs.realpathSync(volume),volume);assert.equal(fs.statSync(volume).uid,0);
 for(const directory of ['finance','commerce']){const p=path.join(volume,directory);assert.equal(fs.existsSync(p),false);fs.mkdirSync(p,{mode:0o700});fs.chownSync(p,65534,65534);}
 for(const spec of definitions){
  const file=path.join(volume,spec.relative);assert.equal(fs.existsSync(file),false);
  const db=new DatabaseSync(file);try{db.exec('PRAGMA journal_mode=DELETE;'+spec.ddl+';PRAGMA application_id='+spec.id+';PRAGMA user_version='+spec.version);assert.equal(db.prepare('PRAGMA quick_check').get().quick_check,'ok');}finally{db.close();}
  fs.chmodSync(file,0o600);fs.chownSync(file,65534,65534);
  const s=fs.lstatSync(file);assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1);assert.equal(s.uid,65534);assert.equal(s.gid,65534);assert.equal(s.mode&0o777,0o600);
  for(const suffix of ['-wal','-shm','-journal'])assert.equal(fs.existsSync(file+suffix),false);
 }
}
module.exports={createNativeLockFixtures,definitions};
