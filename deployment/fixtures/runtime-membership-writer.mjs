import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {registerCaptureParticipant} from '../runtime-membership-bootstrap.mjs';
const require=createRequire(import.meta.url),{command}=require('./runtime-membership-redis.cjs');
const root=process.env.WORK8_RUNTIME_STATE,id=process.env.WORK8_MEMBERSHIP_ID;
const db=new DatabaseSync(path.join(root,'state.sqlite'));db.exec('CREATE TABLE IF NOT EXISTS writes(sequence INTEGER PRIMARY KEY,value TEXT)');
const journal=process.env.WORK8_CONTROLLER_JOURNAL_PATH,journalAccess={};
for(const [name,operation] of Object.entries({overwrite:()=>fs.writeFileSync(journal,'untrusted overwrite'),append:()=>fs.appendFileSync(journal,'untrusted append'),unlink:()=>fs.unlinkSync(journal),rename:()=>fs.renameSync(journal,journal+'.removed')})){
 try{operation();journalAccess[name]='UNEXPECTED_WRITE';}catch(e){journalAccess[name]=e.code;}
}
fs.writeFileSync(path.join(root,'first-write.json'),JSON.stringify({uid:process.getuid(),gid:process.getgid(),member:id,journalAccess}));
let held=false,sequence=db.prepare('SELECT COALESCE(MAX(sequence),0) n FROM writes').get().n,inflight=Promise.resolve();
const cycle=()=>{if(held)return;inflight=inflight.then(async()=>{if(held)return;
 if(process.env.REDIS_URL)await command(process.env.REDIS_URL,['INCR','work8:member:'+id],{name:'work8-member-'+id});
 db.prepare('INSERT INTO writes VALUES(?,?)').run(++sequence,'bounded-synthetic-write');
 fs.appendFileSync(path.join(root,'writes.jsonl'),JSON.stringify({sequence})+'\n');
}).catch(()=>process.exit(72));};
const timer=setInterval(cycle,10);
registerCaptureParticipant({async hold(){held=true;await inflight;},async release(){held=false;}});
process.on('SIGTERM',()=>{held=true;clearInterval(timer);void inflight.then(()=>process.exit(0));});
