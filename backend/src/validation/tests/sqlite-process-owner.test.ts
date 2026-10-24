import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork,type ChildProcess} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {EmpireDatabase} from '../../brain/sqlite-database.js';
const childFile=fileURLToPath(new URL('./fixtures/sqljs-process-owner-child.ts',import.meta.url));
function next(c:ChildProcess){return new Promise<any>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('child deadline')),8000);c.once('message',m=>{clearTimeout(timer);resolve(m);});c.once('error',e=>{clearTimeout(timer);reject(e);});});}
function start(file:string){const child=fork(childFile,[file],{stdio:['ignore','ignore','ignore','ipc']});return {child,reply:next(child)};}
async function stop(c:ChildProcess){if(c.exitCode!==null||c.signalCode!==null)return;const exited=new Promise(r=>c.once('exit',r));c.kill('SIGKILL');await exited;}
test('independent SQL.js opener cannot retain stale RAM before or during capture; close transfers ownership',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sqljs-owner-')),file=path.join(root,'brain.db');const db=new EmpireDatabase(file);const children:ChildProcess[]=[];
 t.after(async()=>{for(const c of children)await stop(c);db.close();fs.rmSync(root,{recursive:true,force:true});});
 db.exec('CREATE TABLE events(id INTEGER); INSERT INTO events VALUES(1)');await db.requestCriticalPersist();
 for(const capture of [false,true]){const release=capture?db.holdWritesForCapture():()=>{};try{const c=start(file);children.push(c.child);assert.match((await c.reply).error,/SQLJS_PROCESS_OWNERSHIP_UNAVAILABLE/);}finally{release();}}
 db.close();const c=start(file);children.push(c.child);assert.equal((await c.reply).kind,'opened');assert.throws(()=>new EmpireDatabase(file),/SQLJS_PROCESS_OWNERSHIP_UNAVAILABLE/);let reply=next(c.child);c.child.send({action:'write',id:2});assert.equal((await reply).kind,'written');reply=next(c.child);c.child.send({action:'close'});assert.equal((await reply).kind,'closed');
 const restored=new EmpireDatabase(file);try{assert.deepEqual(restored.prepare('SELECT id FROM events ORDER BY id').all().map(r=>r.id),[1,2]);}finally{restored.close();}
});
test('process interruption releases kernel ownership and committed records survive restart',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sqljs-owner-crash-')),file=path.join(root,'brain.db');const db=new EmpireDatabase(file);db.exec('CREATE TABLE events(id INTEGER); INSERT INTO events VALUES(1)');db.close();const c=start(file);
 t.after(async()=>{await stop(c.child);fs.rmSync(root,{recursive:true,force:true});});assert.equal((await c.reply).kind,'opened');const reply=next(c.child);c.child.send({action:'write',id:2});assert.equal((await reply).kind,'written');await stop(c.child);
 const restored=new EmpireDatabase(file);try{assert.deepEqual(restored.prepare('SELECT id FROM events ORDER BY id').all().map(r=>r.id),[1,2]);}finally{restored.close();}
});
test('hard-link database aliases and replaced ownership inode fail closed',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sqljs-owner-alias-')),file=path.join(root,'brain.db'),alias=path.join(root,'alias.db');const db=new EmpireDatabase(file);db.exec('CREATE TABLE events(id INTEGER)');await db.requestCriticalPersist();
 try{fs.linkSync(file,alias);assert.throws(()=>new EmpireDatabase(alias),/ALIAS_UNSAFE/);assert.throws(()=>db.holdWritesForCapture(),/ALIAS_UNSAFE/);fs.unlinkSync(alias);
  const lock=file+'.sqljs-owner.sqlite';fs.renameSync(lock,lock+'.old');fs.writeFileSync(lock,'');assert.throws(()=>db.exec('INSERT INTO events VALUES(1)'),/OWNERSHIP_LOST/);assert.throws(()=>db.close(),/OWNERSHIP_LOST/);fs.unlinkSync(lock);fs.renameSync(lock+'.old',lock);
 }finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});

test('recovery-owned read-only SQL.js view excludes independent late flush owners',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sqljs-owner-readonly-')),file=path.join(root,'brain.db');const source=new EmpireDatabase(file);source.exec('CREATE TABLE events(id INTEGER); INSERT INTO events VALUES(1)');source.close();const bytes=fs.readFileSync(file);const read=new EmpireDatabase(file,true);const c=start(file);
 t.after(async()=>{await stop(c.child);read.close();fs.rmSync(root,{recursive:true,force:true});});assert.match((await c.reply).error,/SQLJS_PROCESS_OWNERSHIP_UNAVAILABLE/);const release=read.holdWritesForCapture();try{assert.equal(read.prepare('SELECT id FROM events').get()?.id,1);}finally{release();}read.close();assert.deepEqual(fs.readFileSync(file),bytes);
});

test('symlink opener exports to canonical owner path and never splits aliases',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sqljs-owner-symlink-')),file=path.join(root,'brain.db'),alias=path.join(root,'alias.db');const seed=new EmpireDatabase(file);seed.exec('CREATE TABLE events(id INTEGER)');seed.close();fs.symlinkSync(file,alias);const db=new EmpireDatabase(alias);const children:ChildProcess[]=[];
 t.after(async()=>{for(const c of children)await stop(c);db.close();fs.rmSync(root,{recursive:true,force:true});});db.exec('INSERT INTO events VALUES(1)');await db.requestCriticalPersist();assert.ok(fs.lstatSync(alias).isSymbolicLink());
 for(const name of [file,alias]){const c=start(name);children.push(c.child);assert.match((await c.reply).error,/SQLJS_PROCESS_OWNERSHIP_UNAVAILABLE/);}
});

test('ownership loss during snapshot refuses release and retains the write fence',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sqljs-owner-capture-loss-')),file=path.join(root,'brain.db');const db=new EmpireDatabase(file);db.exec('CREATE TABLE events(id INTEGER)');await db.requestCriticalPersist();const release=db.holdWritesForCapture(),lock=file+'.sqljs-owner.sqlite';
 try{fs.renameSync(lock,lock+'.old');fs.writeFileSync(lock,'');assert.throws(release,/OWNERSHIP_LOST/);fs.unlinkSync(lock);fs.renameSync(lock+'.old',lock);assert.throws(()=>db.exec('INSERT INTO events VALUES(1)'),/quiesced/);release();db.exec('INSERT INTO events VALUES(1)');}finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});
