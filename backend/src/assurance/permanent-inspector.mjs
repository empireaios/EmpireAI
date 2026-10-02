import { inspectAssurance } from './independent-assurance.mjs';
import { assurancePaths } from './live-sources.mjs';
import fs from 'node:fs';
import {observeDemo} from './owner-demo.mjs';
import {readOwnerAssurance} from './owner-evidence.mjs';
import {setTimeout as delay} from 'node:timers/promises';
const {database}=assurancePaths(process.env.RAILWAY_VOLUME_MOUNT_PATH);
const shutdown=new AbortController();
let stopping=false;for(const s of ['SIGTERM','SIGINT'])process.on(s,()=>{stopping=true;shutdown.abort();});
while(!stopping){
  const verdict=inspectAssurance(database,{now:Date.now(),epoch:0,intervalMs:300000,graceMs:120000});
  fs.writeFileSync(database+'.watchdog.tmp',JSON.stringify({observedAt:Date.now(),status:verdict.status}),{mode:0o600});
  fs.renameSync(database+'.watchdog.tmp',database+'.watchdog');
  try{observeDemo(database);readOwnerAssurance(database);}catch{}
  console.log(JSON.stringify({event:'independent_assurance_watchdog',...verdict}));
  await delay(30000,undefined,{signal:shutdown.signal}).catch(error=>{if(error.name!=='AbortError')throw error;});
}
