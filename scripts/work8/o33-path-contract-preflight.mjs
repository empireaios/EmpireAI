// Runs only in a throwaway topology, with the same uid/gid and native process
// isolation as admitted writers. It is not an application/capture examination.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {acquireAuthorityJsonCaptureFence} from '../../backend/dist/orchestration/shadow-ceo-authority/repository/json-authority-store.js';
import {acquireRequestOwnerCaptureFence} from '../../backend/dist/orchestration/shadow-ceo-integration/request-owner.js';
import contract from '../../deployment/o33-path-contract.cjs';
import {acquireVisualMemoryLock} from '../../pillow/dist/visual-memory-engine/recovery-lock.js';
import {acquireSessionContinuityLock} from '../../pillow/dist/session-continuity-engine/recovery-snapshot.js';
import {acquireExecutiveDecisionJournalLock,executiveDecisionCoordinationRoot} from '../../pillow/dist/digital-soul/recovery-snapshot.js';
const p=contract.paths(process.argv[2]),evidence=process.argv[3],repo=path.resolve(import.meta.dirname,'../..');
assert.equal(process.getuid(),65534);assert.equal(process.getgid(),65534);assert.deepEqual(process.getgroups(),[65534]);
const status=fs.readFileSync('/proc/self/status','utf8');assert.match(status,/^CapEff:\s*0+$/m);assert.match(status,/^NoNewPrivs:\s*1$/m);assert.match(status,/^Seccomp:\s*2$/m);
assert.equal(Number(status.match(/^Seccomp_filters:\s*(\d+)$/m)[1]),Number(process.env.O33_EXPECTED_FILTERS));
assert.ok(fs.readFileSync('/proc/self/maps','utf8').split('\n').some(line=>line.trim().endsWith(' '+process.env.LD_PRELOAD)),'PINNED_NATIVE_IMAGE_NOT_MAPPED');
const checked=[];
function atomic(file){fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});const temp=file+'.permission-preflight.tmp';fs.writeFileSync(temp,'contract',{flag:'wx',mode:0o600});fs.renameSync(temp,file);assert.equal(fs.readFileSync(file,'utf8'),'contract');const fd=fs.openSync(file,'r');fs.fsyncSync(fd);fs.closeSync(fd);fs.unlinkSync(file);checked.push(file);}
for(const relative of Object.values(contract.SQL)){
 const file=path.join(p.volume,relative);fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
 for(const mode of ['DELETE','WAL']){const db=new DatabaseSync(file);try{assert.equal(db.prepare('PRAGMA journal_mode='+mode).get().journal_mode,mode.toLowerCase());db.exec('CREATE TABLE IF NOT EXISTS permission_probe(n); BEGIN IMMEDIATE; INSERT INTO permission_probe VALUES(1);');assert.ok(fs.existsSync(file+(mode==='WAL'?'-wal':'-journal')));if(mode==='WAL')assert.ok(fs.existsSync(file+'-shm'));db.exec('ROLLBACK');}finally{db.close();}}
 fs.unlinkSync(file);checked.push(file+'{,-journal,-wal,-shm}');
}
for(const relative of contract.CONTROL)atomic(path.join(p.volume,relative));
process.env.SHADOW_CEO_DATA_DIR=path.join(p.volume,'commissioning/empireai-brain.db.shadow');
for(const [file,acquire] of [[path.join(process.env.SHADOW_CEO_DATA_DIR,'shadow-ceo-authority/authority-store.json'),()=>acquireAuthorityJsonCaptureFence()],[path.join(process.env.SHADOW_CEO_DATA_DIR,'shadow-ceo-request-owners.json'),acquireRequestOwnerCaptureFence]]){const release=acquire();assert.ok(fs.statSync(file+'.capture-write-lock').isDirectory());assert.throws(acquire,/CAPTURE_BUSY/);release();assert.ok(!fs.existsSync(file+'.capture-write-lock'));acquire()();checked.push(file+'.capture-write-lock');}
for(const [root,acquire]of [[p.visual,acquireVisualMemoryLock],[p.session,acquireSessionContinuityLock]]){
 const release=acquire(root);assert.ok(fs.statSync(root+'.capture-write-lock').isDirectory());assert.throws(()=>acquire(root),/SHARED_CAPTURE_BUSY/);release();assert.ok(!fs.existsSync(root+'.capture-write-lock'));acquire(root)();checked.push(root+'.capture-write-lock');
}
for(const relative of ['index.json','records/permission-probe.json'])atomic(path.join(p.visual,relative));
atomic(path.join(p.session,'session-snapshot.json'));
const journalRoot=executiveDecisionCoordinationRoot(repo),release=acquireExecutiveDecisionJournalLock(repo);assert.equal(path.dirname(journalRoot),p.journalLocks);assert.throws(()=>acquireExecutiveDecisionJournalLock(repo),/SHARED_CAPTURE_BUSY/);release();checked.push(journalRoot+'.capture-write-lock');
const journal=path.join(repo,'docs/governance/digital-soul/executive-decision-records.jsonl');fs.readFileSync(journal);assert.throws(()=>fs.accessSync(journal,fs.constants.W_OK));
atomic(path.join(p.authority,'members/permission-probe.admitted.json'));
for(const name of ['store/checkpoint.db','store/manifest.json','runtime-recovery.pending.json','runtime-recovery.json','redis.json','session-continuity.json','executive-decisions.json'])atomic(path.join(p.capture,'point',name));
assert.equal(os.tmpdir(),p.temporary);const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sqlite-contract-'));atomic(path.join(tmp,'temporary'));fs.rmdirSync(tmp);
for(const dir of [p.base,p.volume,p.authority,p.operator,path.join(p.operator,'sealed'),evidence]){
 assert.throws(()=>fs.mkdirSync(path.join(dir,'forbidden-write')));checked.push('DENIED:'+dir);
}
for(const file of [path.join(p.authority,'generation.sqlite'),path.join(p.authority,'cutover.json'),path.join(evidence,'application-image.json')]){fs.readFileSync(file);assert.throws(()=>fs.accessSync(file,fs.constants.W_OK));}
assert.throws(()=>fs.renameSync(p.authority,path.join(p.volume,'moved-authority')));assert.throws(()=>fs.readdirSync(p.operator));
console.log(JSON.stringify({status:'PASS',uid:process.getuid(),gid:process.getgid(),checked,redis:'NETWORK_ONLY; server state belongs to isolated Redis containers, never application filesystem'}));
