import path from 'node:path';
import fs from 'node:fs';
import { AssuranceStore, runAssuranceCycle, inspectAssurance } from './independent-assurance.mjs';
import { createRuntimeCollector } from './runtime-collector.mjs';

// Separate entry points permit independently supervised scheduling/inspection.
// Deployment must not place both under a single scheduler as the sole dead-man.
const mode=process.argv[2];
const filename=process.env.ASSURANCE_DATABASE;
const integer=(key,min,max)=>{const n=Number(process.env[key]);if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('Invalid '+key);return n;};
try {
  if (!['cycle','inspect'].includes(mode) || !filename || !path.isAbsolute(filename) || path.resolve(filename)!==filename) throw Error('Explicit mode and absolute durable database required');
  const epoch=integer('ASSURANCE_EPOCH_MS',0,Number.MAX_SAFE_INTEGER);
  const intervalMs=integer('ASSURANCE_INTERVAL_MS',30000,21600000);
  const graceMs=integer('ASSURANCE_GRACE_MS',1000,intervalMs-1);
  const now=Date.now();
  if (mode==='inspect') {
    const verdict=inspectAssurance(filename,{now,epoch,intervalMs,graceMs});
    console.log(JSON.stringify(verdict));process.exitCode=verdict.healthy?0:2;
  } else {
    if(now<epoch)throw Error('First cycle not due');
    // Store directory must already be an operator-provisioned durable mount.
    if(fs.realpathSync(path.dirname(filename))!==path.dirname(filename))throw Error('Durable directory path refused');
    if(fs.existsSync(filename)&&(!fs.lstatSync(filename).isFile()||fs.realpathSync(filename)!==filename))throw Error('Database path refused');
    const scheduledAt=epoch+Math.floor((now-epoch)/intervalMs)*intervalMs;
    const runtime=createRuntimeCollector({origin:process.env.ASSURANCE_RUNTIME_ORIGIN,expectedRevision:process.env.ASSURANCE_EXPECTED_REVISION});
    const store=new AssuranceStore(filename);
    try {
      fs.chmodSync(filename,0o600);
      const receipt=await runAssuranceCycle(store,{id:'cycle_'+scheduledAt,scheduledAt,collectors:{runtime},maxAgeMs:graceMs,timeoutMs:Math.min(graceMs,10000)});
      console.log(JSON.stringify(receipt));process.exitCode=receipt.healthy?0:2;
    } finally {store.close();}
  }
} catch {
  console.log(JSON.stringify({status:'SOURCE_UNAVAILABLE',healthy:false,reason:'Assurance execution unavailable; investigate protected configuration or store',inferenceCalls:0,commerceWrites:0}));
  process.exitCode=2;
}
