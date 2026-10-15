import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {writeFileSync,rmSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runWork8JointExams} from '../../backend/src/runtime/commerce-runtime/governed/work8-joint-exams.ts';
import {GovernedCommerceStore,digest} from '../../backend/src/runtime/commerce-runtime/governed/store.ts';
import {makeWork8FulfilmentProbes} from '../../backend/src/assurance/work8-fulfilment-probes.ts';
assert.equal(process.env.WORK8_KERNEL_EGRESS,'DENIED');
const sources=['backend/src/runtime/commerce-runtime/governed/work8-joint-exams.ts','backend/src/runtime/commerce-runtime/governed/engine.ts','backend/src/runtime/commerce-runtime/governed/worker.ts','backend/src/assurance/control-plane.mjs','backend/src/assurance/work8-fulfilment-probes.ts','scripts/work8/resource-soak.mjs'];
const sourceHashes=()=>Object.fromEntries(sources.map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));
const sourceBefore=sourceHashes(),started=new Date().toISOString(),begin=performance.now(),cpu=process.cpuUsage(),rss0=process.memoryUsage().rss,runs=[];
const thresholds={samples:120,intervalMs:5000,minimumElapsedMs:600000,p99SampleMs:2000,peakRssBytes:536870912,rssGrowthBytes:134217728,externalEffects:0,paidCalls:0};
function report(status){const sorted=runs.map(r=>r.durationMs).sort((a,b)=>a-b);return {schema:'work8-resource-soak-v1',status,started,node:process.version,elapsedMs:performance.now()-begin,cpuMicroseconds:process.cpuUsage(cpu),thresholds,sourceBefore,runs,p99SampleMs:sorted[Math.max(0,Math.ceil(sorted.length*.99)-1)]??null,peakRssBytes:Math.max(rss0,...runs.map(r=>r.rss)),rssGrowthBytes:Math.max(0,...runs.map(r=>r.rss-rss0)),externalEffects:0,paidCalls:0,scope:'Measured local joint recovery, finance containment and canonical fulfilment sampling; each scenario uses a fresh store. Not hosted, sustained shared-volume or whole-system certification.'};}
try{
 for(let i=0;i<thresholds.samples;i++){
  const sampleStart=performance.now(),result=await runWork8JointExams(1800+i);let store;
  try{assert.equal(result.result,'PASS');assert.equal(result.repairs,1);assert.equal(result.forbiddenRepairs,0);assert.equal(result.externalEffects,0);store=new GovernedCommerceStore(result.root+'/commerce.sqlite');const before=digest(store.history(result.workspace,result.missionId));const probes=makeWork8FulfilmentProbes({store}).probes(result.workspace);assert.equal(probes.find(p=>p.capability==='commerce-fulfilment').status,'BLOCKED');assert.equal(digest(store.history(result.workspace,result.missionId)),before);runs.push({seed:1800+i,durationMs:performance.now()-sampleStart,rss:process.memoryUsage().rss,checks:result.checks,receiptDigest:before,fulfilmentStatus:'BLOCKED',repairs:result.repairs});}
  finally{store?.close();rmSync(result.root,{recursive:true,force:true});}
  const current=report('IN_PROGRESS');assert.ok(current.peakRssBytes<=thresholds.peakRssBytes);assert.ok(current.rssGrowthBytes<=thresholds.rssGrowthBytes);writeFileSync('docs/work8/resource-soak.json',JSON.stringify(current,null,2));
  await new Promise(r=>setTimeout(r,Math.max(0,begin+(i+1)*thresholds.intervalMs-performance.now())));
 }
 assert.deepEqual(sourceHashes(),sourceBefore);const final=report('PASS_SCOPED_LOCAL_RESOURCE_SOAK');assert.ok(final.elapsedMs>=thresholds.minimumElapsedMs);assert.ok(final.p99SampleMs<=thresholds.p99SampleMs);writeFileSync('docs/work8/resource-soak.json',JSON.stringify(final,null,2));console.log(JSON.stringify({status:final.status,samples:runs.length,elapsedMs:final.elapsedMs,p99SampleMs:final.p99SampleMs,peakRssBytes:final.peakRssBytes,rssGrowthBytes:final.rssGrowthBytes}));
}catch(error){writeFileSync('docs/work8/resource-soak.json',JSON.stringify({...report('FAIL'),error:String(error)},null,2));throw error;}
