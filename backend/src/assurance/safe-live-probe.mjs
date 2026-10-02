// Operator-only safe live injection: isolated Redis prefix and SQLite file.
// No real chat, supplier, ledger, transcript or marketplace record is mutated.
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import Redis from 'ioredis';
import {collectDurableOmissions} from './live-sources.mjs';
import {reconcileSnapshot} from './independent-assurance.mjs';
export async function runSafeLiveProbe(){
const dir=process.env.RAILWAY_VOLUME_MOUNT_PATH+'/commissioning';
if(fs.existsSync(dir+'/assurance-live-probe-proof.json'))return;
const id='probe_'+randomUUID().replaceAll('-','');
const filename=dir+'/'+id+'.sqlite',key='assurance:probe:'+id;
const redis=new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:1,connectTimeout:5000});
let proof;
try{
  const db=new DatabaseSync(filename);db.exec('CREATE TABLE transcripts(workspace TEXT,session TEXT,turns TEXT)');
  db.prepare('INSERT INTO transcripts VALUES(?,?,?)').run('ws_empire_1',id,'[]');db.close();
  const now=Date.now();const request={requestId:id,sessionId:id,workspaceId:'ws_empire_1',status:'COMPLETED',updatedAt:new Date(now-60000).toISOString(),finalResult:{message:'Explicit synthetic assurance probe; no user task or model execution'}};
  if(await redis.set(key,JSON.stringify(request),'EX',120,'NX')!=='OK')throw Error('Probe identity collision');
  // Adapt only the isolated synthetic key to the production collector interface.
  const fixtureSource={scan:async()=>['0',['pillow:chatreq:v2:'+id]],get:async()=>redis.get(key)};
  const omitted=reconcileSnapshot(await collectDurableOmissions({redis:fixtureSource,filename,now}),now,120000);
  if(omitted.status!=='FAIL'||omitted.missing!==1)throw Error('Live omission not detected');
  const restoredDb=new DatabaseSync(filename);restoredDb.prepare('UPDATE transcripts SET turns=?').run(JSON.stringify([{role:'assistant',requestId:id,content:request.finalResult.message}]));restoredDb.close();
  const restored=reconcileSnapshot(await collectDurableOmissions({redis:fixtureSource,filename,now}),now,120000);
  if(restored.status!=='PASS')throw Error('Live correction not detected');
  proof={schema:'safe-live-assurance-probe-v1',at:new Date().toISOString(),revision:process.env.RAILWAY_GIT_COMMIT_SHA,isolatedSyntheticSource:true,productionRecordsMutated:0,pillowSelfReportUsed:false,inferenceCalls:0,commerceWrites:0,omitted,restored,scope:'Live deployed collector detects a deliberately omitted synthetic delivery; not proof of all operational domains or actual unprompted Pillow fault detection'};
  fs.writeFileSync(dir+'/assurance-live-probe-proof.json',JSON.stringify(proof,null,2),{mode:0o600});console.log(JSON.stringify(proof));
}finally{await redis.del(key);redis.disconnect();if(fs.existsSync(filename))fs.unlinkSync(filename);}

}
