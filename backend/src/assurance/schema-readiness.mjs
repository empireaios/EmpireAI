import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {setTimeout as delay} from 'node:timers/promises';

// The worker owns assurance_cycles. Wait for its existing initialization without
// creating a database, a schema, a receipt or an inspector heartbeat.
export async function waitForAssuranceSchema(filename,{signal,timeoutMs=5000}={}) {
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>5000)throw Error('Invalid schema readiness deadline');
  const deadline=performance.now()+timeoutMs;
  let causeCode='ASSURANCE_SCHEMA_ABSENT';
  while(true){
    signal?.throwIfAborted();
    let db;
    try{
      const stat=fs.lstatSync(filename);
      if(!stat.isFile()||stat.size>64*1024*1024||fs.realpathSync(filename)!==filename)throw Error('Unsafe Assurance source');
      db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:100});
      db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF');
      if(db.prepare("SELECT type FROM sqlite_schema WHERE name='assurance_cycles'").get()?.type!=='table')throw Error('Assurance schema absent');
      db.prepare('SELECT id,scheduled_at,started_at,completed_at,receipt FROM assurance_cycles LIMIT 0').all();
      return;
    }catch(error){
      causeCode=typeof error?.code==='string'?error.code:'ASSURANCE_SCHEMA_ABSENT';
    }finally{db?.close();}
    const remaining=deadline-performance.now();
    if(remaining<=0){
      const error=new Error('Assurance worker schema not ready');
      error.code='ASSURANCE_SCHEMA_UNAVAILABLE';error.causeCode=causeCode;throw error;
    }
    await delay(Math.min(25,remaining),undefined,{signal});
  }
}
