import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const repo=path.resolve(process.argv[2]),root=fs.mkdtempSync(path.join(os.tmpdir(),'o33-control-local-'));
try{
process.env.SHADOW_CEO_DATA_DIR=path.join(root,'shadow');process.env.RAILWAY_VOLUME_MOUNT_PATH=root;
const {acquireAuthorityJsonCaptureFence}=await import(pathToFileURL(path.join(repo,'backend/dist/orchestration/shadow-ceo-authority/repository/json-authority-store.js')));
const {acquireRequestOwnerCaptureFence}=await import(pathToFileURL(path.join(repo,'backend/dist/orchestration/shadow-ceo-integration/request-owner.js')));
const {acquireExecutiveDecisionJournalLock}=await import(pathToFileURL(path.join(repo,'pillow/dist/digital-soul/recovery-snapshot.js')));
const checks=[];for(const [name,acquire]of [['authority',acquireAuthorityJsonCaptureFence],['request-owner',acquireRequestOwnerCaptureFence],['executive',()=>acquireExecutiveDecisionJournalLock(repo)]]){const release=acquire();assert.throws(acquire,/CAPTURE_BUSY/);release();acquire()();checks.push(name+': actual compiled helper import/acquire/busy/release/reacquire');}
console.log(JSON.stringify({status:'PASS_LOCAL_ONLY',checks,scope:'Additional control helper checks only; previous local native/SQL checks not repeated; foreign UID permission proof remains hosted-pending'},null,2));
}finally{fs.rmSync(root,{recursive:true,force:true});}
