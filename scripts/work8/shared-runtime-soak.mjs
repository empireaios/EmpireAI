import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {performance} from 'node:perf_hooks';import {createHash} from 'node:crypto';
import {IntelligenceStore} from '../../backend/src/intelligence/store.ts';
import {ReadAcquirer} from '../../backend/src/intelligence/acquisition.ts';
import {runIntelligenceJob} from '../../backend/src/intelligence/runtime.ts';
import {advanceWork8Acquisition,readWork8Acquisition} from '../../backend/src/intelligence/work8-acquisition.ts';
import {advanceWork8Enrichment,readWork8Enrichment} from '../../backend/src/intelligence/work8-enrichment.ts';
import {GovernedCommerceStore,digest} from '../../backend/src/runtime/commerce-runtime/governed/store.ts';
import {GovernedCommerceEngine} from '../../backend/src/runtime/commerce-runtime/governed/engine.ts';
import {CommerceWorker} from '../../backend/src/runtime/commerce-runtime/governed/worker.ts';
import {DurableSimulatedFinance} from '../../backend/src/runtime/commerce-runtime/governed/work8-durable-finance.ts';
import {makeWork8CommerceRecovery} from '../../backend/src/assurance/work8-commerce-recovery.ts';
import {makeWork8FulfilmentProbes} from '../../backend/src/assurance/work8-fulfilment-probes.ts';
import {AssuranceControlPlane} from '../../backend/src/assurance/control-plane.mjs';
import {clearCjAuthCache} from '../../backend/src/suppliers/cj-dropshipping/cj-auth.ts';
assert.equal(process.env.WORK8_KERNEL_EGRESS,'DENIED');
const smoke=process.argv.includes('--smoke'),intervalMs=smoke?10:5000,samples=120,ws='synthetic:shared-runtime:1800';
const output=smoke?'docs/work8/shared-runtime-smoke.json':'docs/work8/shared-runtime-soak.json';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'w8-shared-runtime-'));
const thresholds={samples,intervalMs,minimumElapsedMs:smoke?0:600000,p99SliceMs:2000,maxSliceMs:5000,peakRssBytes:536870912,rssGrowthBytes:134217728,cpuMicroseconds:120000000};
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=[...walk('backend/src').filter(p=>/\.(ts|mjs|js)$/.test(p)&&!p.includes('/validation/')), 'scripts/work8/shared-runtime-soak.mjs','scripts/work8/isolated-exec.py'];
const hashes=()=>Object.fromEntries(files.sort().map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const before=hashes(),started=new Date().toISOString(),begin=performance.now(),cpu=process.cpuUsage(),rss0=process.memoryUsage().rss;
let now=Date.parse('2026-10-10T01:00:00Z'),calls=0,providerFailures=0,gapRecovered=false,dayAdvanced=false,discoveryTargetSnapshot=null;const pages=[],runs=[],traces=[];
process.env.CJ_API_KEY='isolated-never-real-key';clearCjAuthCache();
const intel=new IntelligenceStore(path.join(root,'intelligence.sqlite'),()=>now),store=new GovernedCommerceStore(path.join(root,'commerce.sqlite')),engine=new GovernedCommerceEngine(store,()=>now),worker=new CommerceWorker(engine),finance=new DurableSimulatedFinance(store,worker,()=>now),recovery=makeWork8CommerceRecovery({store,worker,now:()=>now}),fulfilment=makeWork8FulfilmentProbes({store,now:()=>now}),cp=new AssuranceControlPlane({root,now:()=>now,revision:'shared-runtime-local',runbooks:{work8_checkpoint_replay:recovery.runbook}});
intel.seed(ws);for(const schedule of intel.schedules(ws))if(schedule.id!=='cj.catalog')intel.setSchedule(ws,schedule.id,false);
const task=worker.enqueue(ws,'isolated-owner','shared-runtime-examination');
const transport=async raw=>{calls++;const u=new URL(String(raw));assert.equal(u.origin,'https://developers.cjdropshipping.com');let data;
 if(u.pathname.endsWith('getAccessToken'))data={accessToken:'offline-token',accessTokenExpiryDate:new Date(Date.now()+86400000).toISOString()};
 else if(u.pathname.endsWith('/product/list')){const page=Number(u.searchParams.get('pageNum'));pages.push(page);data={pageNum:page,pageSize:10,total:100000,list:Array.from({length:10},(_,i)=>({pid:`isolated-${page*10+i}`,productNameEn:`Synthetic injected protocol product ${page*10+i}`,sellPrice:'2.48',productSku:`sku-${page*10+i}`}))};}
 else if(u.pathname.endsWith('/product/query')){if(providerFailures===0){providerFailures++;return new Response('{}',{status:429,headers:{'retry-after':'60'}});}const pid=u.searchParams.get('pid');data={pid,variants:[{pid,vid:'variant-'+pid,variantSellPrice:2.48}]};}
 else throw Error('UNEXPECTED_INJECTED_TRANSPORT:'+u.pathname);
 return Response.json({code:200,result:true,data});};const acquirer=new ReadAcquirer(intel,transport);
function report(status){const durations=runs.map(r=>r.durationMs).sort((a,b)=>a-b),usage=process.cpuUsage(cpu);return {schema:'work8-shared-runtime-soak-v1',status,started,seed:1800,node:process.version,root,smoke,thresholds,elapsedMs:performance.now()-begin,cpuMicroseconds:usage.user+usage.system,p99SliceMs:durations[Math.max(0,Math.ceil(durations.length*.99)-1)]??0,maxSliceMs:Math.max(0,...durations),peakRssBytes:Math.max(rss0,...runs.map(r=>r.rss)),rssGrowthBytes:Math.max(0,...runs.map(r=>r.rss-rss0)),sourceBefore:before,sourceAfter:null,runs,traces,transportCalls:calls,providerFailures,pages,gapRecovered,virtualBusinessDayAdvanced:dayAdvanced,discoveryTargetSnapshot,discovery:readWork8Acquisition(intel,ws),enrichment:readWork8Enrichment(intel,ws),finance:finance.ownerRead(ws,task.mission),externalEffects:0,paidInference:0,scope:'One persistent isolated runtime/store set with injected provider responses. Source products are synthetic protocol fixtures, not real-product visibility evidence. Manual cadence orchestration uses actual planners/workers/collectors, not deployed timers or hosted endurance. Virtual business day advances explicitly for simulated settlement; wall time is measured independently.'};}
try{
 for(let i=0;i<samples;i++){
  const start=performance.now();now+=5000;
  if(i%6===0){intel.due(ws);advanceWork8Acquisition(intel,ws);if(readWork8Acquisition(intel,ws).status==='TARGET_REACHED')advanceWork8Enrichment(intel,ws);for(let n=0;n<4;n++){const job=await runIntelligenceJob(intel,ws,acquirer,undefined,false);if(!job)break;assert.equal(job.inferenceCalls,0);assert.equal(job.commerceEffects,0);if(job.status!=='COMPLETED')traces.push({sample:i,kind:'ACTUAL_PROVIDER_JOB_FAILURE',jobId:job.id,status:job.status,failures:job.failures});}advanceWork8Acquisition(intel,ws);}
  if(!gapRecovered){worker.runBounded(ws,task.id,4);const t=worker.get(ws,task.id),step=t.steps[t.cursor];engine.execute(step.actor,{id:digest({task:t.id,step:t.cursor}),missionId:t.mission,expectedVersion:t.cursor,command:step.command});const historyBefore=digest(store.history(ws,task.mission)),probe=recovery.probes(ws).find(p=>p.status==='DEGRADED'||p.status==='FAILED');assert.ok(probe);const incident=cp.observe(ws,probe),result=await cp.recover(ws,incident.id);assert.equal(result.status,'VERIFIED');assert.equal(digest(store.history(ws,task.mission)),historyBefore);gapRecovered=true;traces.push({sample:i,kind:'ACTUAL_COMMITTED_RECEIPT_GAP_RECOVERED',historyBefore});}
  else if(worker.get(ws,task.id).status!=='COMPLETE')worker.runBounded(ws,task.id,4);
  if(i===90){discoveryTargetSnapshot=readWork8Acquisition(intel,ws);assert.equal(discoveryTargetSnapshot.newCandidates,100);now+=86400000;dayAdvanced=true;traces.push({sample:i,kind:'EXPLICIT_VIRTUAL_DAY_ADVANCE_FOR_SIMULATED_PAYOUT'});}
  finance.tick(ws);
  if(i%6===0){for(const p of [...recovery.probes(ws),...fulfilment.probes(ws),...finance.probes(ws)]){cp.observe(ws,p);traces.push({sample:i,kind:'FRESH_ASSURANCE_OBSERVATION',probeId:p.id,status:p.status,observedAt:p.evidence.observedAt});}}
  const history=store.history(ws,task.mission);assert.ok(history.every(r=>r.state.externalEffects===0&&r.state.paidInference===0));runs.push({sample:i,virtualAt:now,durationMs:performance.now()-start,rss:process.memoryUsage().rss,commerceReceipts:history.length,commerceDigest:digest(history),taskCursor:worker.get(ws,task.id).cursor});
  const current=report('IN_PROGRESS');assert.ok(current.peakRssBytes<=thresholds.peakRssBytes);assert.ok(current.rssGrowthBytes<=thresholds.rssGrowthBytes);fs.writeFileSync(output,JSON.stringify(current,null,2));await new Promise(resolve=>setTimeout(resolve,Math.max(0,begin+(i+1)*intervalMs-performance.now())));
 }
 const final=report(smoke?'PASS_SHORT_SMOKE_NOT_ENDURANCE':'PASS_SCOPED_SHARED_RUNTIME');final.sourceAfter=hashes();assert.equal(digest(final.sourceAfter),digest(before),'Source manifest changed during examination');assert.equal(worker.get(ws,task.id).status,'COMPLETE');assert.equal(final.finance.status,'COMPLETE_SIMULATION');assert.equal(providerFailures,1);assert.ok(final.enrichment.deferred>0);assert.ok(traces.some(t=>t.kind==='ACTUAL_COMMITTED_RECEIPT_GAP_RECOVERED'));assert.ok(pages.includes(10));assert.ok(traces.some(t=>t.kind==='ACTUAL_PROVIDER_JOB_FAILURE'&&t.failures.some(f=>f.code==='HTTP_429')));assert.ok(traces.some(t=>t.kind==='FRESH_ASSURANCE_OBSERVATION'&&t.probeId.startsWith('sim-finance:')&&t.status==='HEALTHY'));assert.ok(final.elapsedMs>=thresholds.minimumElapsedMs);for(const field of ['p99SliceMs','maxSliceMs','peakRssBytes','rssGrowthBytes','cpuMicroseconds'])assert.ok(final[field]<=thresholds[field],field);fs.writeFileSync(output,JSON.stringify(final,null,2));console.log(JSON.stringify({status:final.status,elapsedMs:final.elapsedMs,providerFailures,finance:final.finance.status,deferred:final.enrichment.deferred}));
}catch(error){fs.writeFileSync(output,JSON.stringify({...report('FAIL'),error:String(error)},null,2));throw error;}finally{cp.close();store.close();clearCjAuthCache();delete process.env.CJ_API_KEY;}
