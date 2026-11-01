import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
const {digest,requestDiscrepancyReadback}=createRequire(import.meta.url)('../../../deployment/assurance-discrepancy-readback.cjs');
import {AssuranceStore,runAssuranceCycle,inspectAssurance} from './independent-assurance.mjs';

// Isolated injected evidence only. Never grants live-source coverage credit.
export async function runSafeDiscrepancyProbe(root){
 // Historical proof presence never grants current success. Each invocation
 // requires a fresh nonce, committed database and independent readback.
 const dir=path.join(root,'commissioning'),id=randomUUID();
 const proofFile=path.join(dir,'assurance-discrepancy-proof-v2-'+id+'.json');
 const filename=path.join(dir,'assurance-probe-'+id+'.sqlite'),store=new AssuranceStore(filename);
 const now=Date.now(),epoch=now-1000,intervalMs=10000,graceMs=5000;
 const snapshot=(domain,observedAt=Date.now(),actual=true)=>({origin:'independent-adapter',source:'isolated-assurance-injection:'+domain,evidenceId:'probe-'+domain,observedAt,authoritative:[{id:domain,value:true}],internal:[{id:domain,value:actual}]});
 let receipt;
 try{
  receipt=await runAssuranceCycle(store,{id:'discrepancy',scheduledAt:epoch,maxAgeMs:1000,timeoutMs:1000,collectors:{
   runtime:async()=>snapshot('runtime',Date.now(),false),
   workers:async()=>{throw Error('Deliberately unavailable isolated collector');},
   scheduler:async()=>snapshot('scheduler',Date.now()-10000),
   'authority-spending':async()=>snapshot('authority-spending',Date.now(),false),
  }});
  if(receipt.checks.runtime.status!=='FAIL'||receipt.checks.workers.status!=='SOURCE_UNAVAILABLE'||receipt.checks.scheduler.status!=='STALE'||receipt.checks['authority-spending'].status!=='FAIL')throw Error('Injected discrepancy escaped');
  store.begin('interrupted',epoch+intervalMs,epoch+intervalMs);
 }finally{store.close();}
 const interrupted=inspectAssurance(filename,{now:epoch+intervalMs+graceMs,epoch,intervalMs,graceMs});
 const missed=inspectAssurance(filename,{now:epoch+2*intervalMs+graceMs,epoch,intervalMs,graceMs});
 if(interrupted.status!=='ASSURANCE_OVERDUE'||missed.status!=='ASSURANCE_OVERDUE')throw Error('Overdue probe escaped');
 // The already independent inspector reopens committed evidence. The writer
 // creates no descendant; fresh process restart remains a separate assertion.
 const readback=await requestDiscrepancyReadback({id,digest:digest(JSON.stringify(receipt))});
 const proof={schema:'isolated-assurance-discrepancy-v2',at:new Date().toISOString(),revision:process.env.RAILWAY_GIT_COMMIT_SHA,isolatedSyntheticSource:true,clockScenarios:'Injected schedule timestamps in separate database; real scheduler restart remains separately required',checks:{runtimeDiscrepancy:receipt.checks.runtime.status,unavailableCollector:receipt.checks.workers.status,staleEvidence:receipt.checks.scheduler.status,authorityDiscrepancy:receipt.checks['authority-spending'].status,interruptedCycle:interrupted.status,missedCycle:missed.status,reopenedInIndependentProcess:true,freshProcessRestart:false},readback,productionRecordsMutated:0,inferenceCalls:0,commerceWrites:0,pillowSelfReportUsed:false};
 fs.writeFileSync(proofFile,JSON.stringify(proof,null,2),{mode:0o600,flag:'wx'});console.log(JSON.stringify(proof));
 // Retain the isolated database as durable evidence, separate from real cycles.
 return proof;
}
