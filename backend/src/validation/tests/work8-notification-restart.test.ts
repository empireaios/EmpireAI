import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {NotificationWorkerEngine}=await import(pathToFileURL(path.resolve(import.meta.dirname,'../../../../pillow/src/notification-worker/engine.ts')).href);
test('Brain-persisted dispatch reservation survives restart and competing workers cannot resend',async()=>{
 assert.equal(process.env.WORK8_KERNEL_EGRESS,'DENIED');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'notification-restart-'));process.env.NODE_ENV='test';process.env.DATABASE_PATH=path.join(dir,'brain.sqlite');
 const {createNotificationDeliveryLedger}=await import('../../orchestration/pillow-host/notification-delivery-ledger.js');const {closeDatabase,getDatabase}=await import('../../brain/database.js');
 const input={messageId:'same-message',channel:'in_app' as const,to:'synthetic-only',body:'synthetic private content'};let effects=0;
 const build=()=>{const w=new NotificationWorkerEngine({repositoryRoot:path.resolve(import.meta.dirname,'../../../..')},{configuration:{timeoutMs:20}});w.bindDeliveryLedger(createNotificationDeliveryLedger());return w;};
 try{
 const first=build();first.setTransport({send:()=>{effects++;throw Error('post-effect transport loss');}});first.enqueueNotification(input);await first.processQueue();assert.equal(first.getMessages()[0]?.status,'unknown');closeDatabase();
 const second=build();second.setTransport({send:()=>{effects++;return {success:true};}});assert.equal(second.enqueueNotification(input).status,'unknown');await second.retryFailed();await second.processQueue();assert.equal(effects,1);assert.throws(()=>second.enqueueNotification({...input,body:'conflict'}),/identity conflict/);
 const a=build(),b=build();for(const w of [a,b]){w.setTransport({send:()=>{effects++;return {success:true};}});w.enqueueNotification({...input,messageId:'concurrent'});}await Promise.all([a.processQueue(),b.processQueue()]);assert.equal(effects,2);closeDatabase();const third=build();assert.equal(third.enqueueNotification({...input,messageId:'concurrent'}).status,'sent');await third.processQueue();assert.equal(effects,2);
 assert.equal(createNotificationDeliveryLedger('other-workspace').get(input.messageId,'different'),undefined);
 const rows=getDatabase().prepare('SELECT * FROM notification_delivery_attempts').all();assert.equal(JSON.stringify(rows).includes(input.body),false);assert.equal(JSON.stringify(rows).includes(input.to),false);
 await createNotificationDeliveryLedger().reserve('interrupted','a'.repeat(64));closeDatabase();assert.equal(createNotificationDeliveryLedger().get('interrupted','a'.repeat(64))?.status,'unknown');
 }finally{closeDatabase();fs.rmSync(dir,{recursive:true,force:true});}
});
test('physical process crash after dispatch leaves durable UNKNOWN and restarted worker never dispatches again',async()=>{
 const {spawnSync}=await import('node:child_process');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'notification-process-crash-'));
 try{const fixture=path.join(import.meta.dirname,'fixtures/notification-crash-worker.ts'),args=['--import','tsx',fixture,path.join(dir,'brain.sqlite'),path.join(dir,'effects.txt')];
 const first=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(first.status,73,first.stderr);
 const second=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(second.status,0,second.stderr);assert.match(second.stdout,/"status":"unknown","attempts":1/);assert.equal(fs.readFileSync(path.join(dir,'effects.txt'),'utf8'),'synthetic effect\n');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('hung persistence reservation and completion terminate UNKNOWN; late reservation never dispatches',async()=>{
 const input={messageId:'hung-ledger',channel:'in_app' as const,to:'synthetic',body:'synthetic'};
 for(const phase of ['reserve','finish']){let effects=0,release!:(n:number)=>void;const pending=new Promise<number>(resolve=>{release=resolve;});
 const w=new NotificationWorkerEngine({repositoryRoot:path.resolve(import.meta.dirname,'../../../..')},{configuration:{timeoutMs:20}});
 w.bindDeliveryLedger({get:()=>undefined,reserve:()=>phase==='reserve'?pending:Promise.resolve(1),finish:()=>phase==='finish'?pending.then(()=>{}):Promise.resolve()});w.setTransport({send:()=>{effects++;return {success:true};}});const m=w.enqueueNotification(input);
 await w.processQueue();assert.equal(m.status,'unknown');assert.equal(effects,phase==='reserve'?0:1);release(1);await new Promise(r=>setTimeout(r,5));await w.retryFailed();assert.equal(m.status,'unknown');assert.equal(effects,phase==='reserve'?0:1);
 }
});
