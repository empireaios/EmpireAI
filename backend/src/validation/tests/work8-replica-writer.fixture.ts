import fs from 'node:fs';
import {GovernedCommerceStore} from '../../runtime/commerce-runtime/governed/store.js';
import {Work8TwinSessions} from '../../runtime/commerce-runtime/governed/work8-twin.js';
const [file,signals]=process.argv.slice(2) as [string,string];
const store=new GovernedCommerceStore(file),sessions=new Work8TwinSessions(store,()=>1791676800000);
const pause=new Int32Array(new SharedArrayBuffer(4));
function publish(name:string,value:string){fs.writeFileSync(signals+'/'+name+'.tmp',value);fs.renameSync(signals+'/'+name+'.tmp',signals+'/'+name);}
function wait(name:string){const end=Date.now()+15000;while(!fs.existsSync(signals+'/'+name)){if(Date.now()>end)throw Error('REPLICA_BARRIER_TIMEOUT');Atomics.wait(pause,0,0,10);}}
try{
 store.db.exec('PRAGMA busy_timeout=100');publish('ready','ready');
 for(const phase of ['locked','released']){
  wait(phase);let result;
  try{const receipt=sessions.transition({workspace:'synthetic:replica',owner:'owner'},{id:'pause',sessionId:'exam',expectedVersion:2,action:'PAUSE'});result={status:'COMMITTED',version:receipt.version};}
  catch(error){result={status:'REFUSED',message:String((error as Error).message)};}
  publish(phase+'.json',JSON.stringify(result));
 }
}finally{store.close();}
