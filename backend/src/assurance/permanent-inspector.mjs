import { inspectAssurance } from './independent-assurance.mjs';
import { assurancePaths } from './live-sources.mjs';
import fs from 'node:fs';
const {database}=assurancePaths(process.env.RAILWAY_VOLUME_MOUNT_PATH);
let stopping=false;for(const s of ['SIGTERM','SIGINT'])process.on(s,()=>{stopping=true;});
while(!stopping){
  const verdict=inspectAssurance(database,{now:Date.now(),epoch:0,intervalMs:300000,graceMs:120000});
  fs.writeFileSync(database+'.watchdog.tmp',JSON.stringify({observedAt:Date.now(),status:verdict.status}),{mode:0o600});
  fs.renameSync(database+'.watchdog.tmp',database+'.watchdog');
  console.log(JSON.stringify({event:'independent_assurance_watchdog',...verdict}));
  await new Promise(r=>setTimeout(r,30000));
}
