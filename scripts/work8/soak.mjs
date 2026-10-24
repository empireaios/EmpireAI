import {performance} from 'node:perf_hooks';
import {writeFileSync,rmSync} from 'node:fs';
import {runWork8JointExams} from '../../backend/src/runtime/commerce-runtime/governed/work8-joint-exams.ts';
if(process.env.WORK8_KERNEL_EGRESS!=='DENIED')throw Error('KERNEL_ISOLATION_REQUIRED');
const started=new Date().toISOString(),begin=performance.now(),runs=[];
for(let i=0;i<24;i++){
 const before=performance.now(),result=await runWork8JointExams(800+i);
 try{if(result.result!=='PASS'||result.externalEffects!==0||result.repairs!==1||result.forbiddenRepairs!==0)throw Error('SOAK_INVARIANT_FAILED');
 runs.push({seed:800+i,elapsedMs:performance.now()-begin,durationMs:performance.now()-before,checks:result.checks,missionId:result.missionId,receiptCount:result.receipts.length});
 writeFileSync('docs/work8/elapsed-soak.json',JSON.stringify({status:'IN_PROGRESS',started,node:process.version,elapsedMs:performance.now()-begin,runs,scope:'Local actual wall-clock component endurance; not hosted or multi-day proof'},null,2));
 }finally{rmSync(result.root,{recursive:true,force:true});}
 const deadline=begin+(i+1)*5000;await new Promise(resolve=>setTimeout(resolve,Math.max(0,deadline-performance.now())));
}
writeFileSync('docs/work8/elapsed-soak.json',JSON.stringify({status:'PASS_LOCAL_120_SECOND_COMPONENT_SOAK',started,node:process.version,elapsedMs:performance.now()-begin,runs,paidCalls:0,externalEffects:0,kernelEgress:'DENIED',scope:'Actual wall-clock isolated joint commerce/Assurance sampling; no hosted or multi-day endurance claim'},null,2));
console.log(JSON.stringify({runs:runs.length,elapsedMs:performance.now()-begin,status:'PASS_LOCAL_ONLY'}));
