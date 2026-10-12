'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{performance}=require('node:perf_hooks'),{createHash}=require('node:crypto');
const modes=['both-observers-killed','launcher-and-guard-killed'];
const lost=(expected,current)=>expected.every(pid=>!current.includes(pid));
const identity=pid=>{try{const stat=fs.readFileSync('/proc/'+pid+'/stat','utf8');const fields=stat.slice(stat.lastIndexOf(') ')+2).split(' ');return {pid,state:fields[0],startTicks:fields[19],cgroup:fs.readFileSync('/proc/'+pid+'/cgroup','utf8')};}catch{return null;}};
const membership=top=>top.split('\n').slice(1).map(line=>Number(line.trim().split(/\s+/)[0])).filter(Number.isSafeInteger).map(identity).filter(Boolean);
module.exports={lost,modes};
if(require.main===module)main().catch(error=>{console.error(String(error));process.exitCode=1});
async function main(){
 const [image,outArg]=process.argv.slice(2);if(!image||!outArg)throw Error('image and output required');const out=path.resolve(outArg);fs.mkdirSync(out,{recursive:true});const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();const pause=ms=>new Promise(r=>setTimeout(r,ms));
 const docker=(args)=>execFileSync('docker',args,{encoding:'utf8',timeout:15000,stdio:['ignore','pipe','pipe']}).trim();
 for(const mode of modes){const root=path.join(out,mode);fs.mkdirSync(root,{recursive:true});const name='work8-f29-'+process.pid+'-'+mode;let started=false,contained=false;
  try{
   const immutable='LABELLED F29 EXAMINATION SENTINEL; NO BUSINESS OR MODEL CLAIM';fs.writeFileSync(path.join(root,'immutable-sentinel.txt'),immutable);const beforeDigest=createHash('sha256').update(immutable).digest('hex');
   docker(['run','-d','--name',name,'--network','none','--cap-drop','ALL','--security-opt','no-new-privileges','--pids-limit','512','--memory','3g','--cpus','2','-v',root+':/evidence','-v',path.resolve(__dirname,'f29-contained-runtime.cjs')+':/exam.cjs:ro','-e','WORK8_F29_EXAM=NETWORK_NONE_ISOLATED','--entrypoint','node',image,'/exam.cjs']);started=true;
   const startupStarted=performance.now();for(;!fs.existsSync(path.join(root,'ready.json'));){if(performance.now()-startupStarted>=180000||fs.existsSync(path.join(root,'startup-failed.json')))throw Error('Actual runtime startup failed');if(docker(['inspect','--format','{{.State.Running}}',name])!=='true')throw Error('Container exited before injection');await pause(500);}
   assert.ok(performance.now()-startupStarted<=180000,'Startup deadline');assert.equal(JSON.parse(fs.readFileSync(path.join(root,'ready.json'))).source,source);
   const inspection=JSON.parse(docker(['inspect',name]))[0];assert.equal(inspection.HostConfig.NetworkMode,'none');assert.equal(inspection.HostConfig.Privileged,false);assert.ok(inspection.State.Pid>0);
   const cgroup=fs.readFileSync('/proc/'+inspection.State.Pid+'/cgroup','utf8');const selfCgroup=fs.readFileSync('/proc/self/cgroup','utf8');assert.notEqual(cgroup,selfCgroup,'Controller must remain outside container cgroup');
   const entries=fs.readFileSync(path.join(root,'events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);const pair=mode==='both-observers-killed'?['permanent-worker.mjs','permanent-inspector.mjs'].map(component=>entries.filter(x=>x.event==='observer'&&x.component===component).at(-1)):['launcher','guard'].map(event=>entries.find(x=>x.event===event));assert.equal(pair.length,2);assert.ok(pair.every(x=>x&&Number.isInteger(x.pid)&&x.pid>1));assert.notEqual(pair[0].pid,pair[1].pid);
   const pids=pair.map(x=>x.pid);const checkCode=`const fs=require('fs');console.log(JSON.stringify(fs.readdirSync('/proc').filter(x=>/^\\d+$/.test(x)).map(Number).filter(p=>{try{return fs.readFileSync('/proc/'+p+'/stat','utf8').split(') ')[1][0]!=='Z'}catch{return false}})))`;
   const members=()=>JSON.parse(docker(['exec',name,'node','-e',checkCode]));assert.ok(pids.every(p=>members().includes(p)));
   const beforeTop=docker(['top',name,'-eo','pid,ppid,pgid,args']),beforeMembership=membership(beforeTop);assert.ok(beforeMembership.length>=5);assert.ok(beforeMembership.every(member=>member.cgroup===cgroup),'All recorded identities inside isolated cgroup');
   const probe=docker(['exec',name,'node','-e',`const net=require('net'),s=net.connect({host:'198.51.100.1',port:443});s.on('connect',()=>process.exit(2));s.on('error',e=>{console.log(e.code);process.exit(0)});setTimeout(()=>process.exit(3),1500)`]);assert.match(probe,/ENETUNREACH|EHOSTUNREACH|EPERM/);
   fs.writeFileSync(path.join(root,'pre-injection.json'),JSON.stringify({source,mode,cgroup,selfCgroup,networkMode:'none',outboundProbe:probe,pair,beforeTop,beforeMembership,beforeDigest},null,2));
   // Confirmation is read by the external controller after both requested kills;
   // its timer is monotonic and never uses a child-supplied observation time.
   let t0=null;
   const monitoring=(async()=>{const monitorStarted=performance.now();while(performance.now()-monitorStarted<660000){if(lost(pids,members())){if(t0===null)throw Error('Pair lost before authorised injection');return performance.now();}await pause(100);}throw Error('Pair-loss detection deadline');})();
   // Poller is active before a separate docker-exec injector touches the pair.
   t0=performance.now();docker(['exec',name,'node','-e',`for(const pid of ${JSON.stringify(pids)})process.kill(pid,'SIGKILL')`]);const injectionConfirmedAt=new Date().toISOString(),injectionConfirmedMonotonicMs=performance.now();
   const detectedAt=await monitoring,detectionMs=detectedAt-t0;assert.ok(detectionMs<=660000);
   const incident={id:'F29-'+mode+'-'+source,scenarioId:'W8-F29-REMAINING-V1',seed:8029,mode,source,classification:'SUPERVISION_PAIR_LOST',status:'CONTAINMENT_REQUIRED',detectedAt:new Date().toISOString(),injectionConfirmedAt,injectionConfirmedMonotonicMs,injectorStartMonotonicMs:t0,detectionMs,detectionLatencyBasis:'conservative-from-injector-start; confirmed signal completion also recorded',action:'STOP_ISOLATED_CONTAINER',recoveryVerified:false,birth:'NOT_BORN',commerce:'LOCKED'};
   fs.writeFileSync(path.join(root,'incident.json'),JSON.stringify(incident,null,2));
   // Enforcement is the observer's action, not finally-block housekeeping.
   const faultMembership=membership(docker(['top',name,'-eo','pid,ppid,pgid,args']));const cohort=[...beforeMembership,...faultMembership];
   docker(['kill','--signal','KILL',name]);contained=true;const after=JSON.parse(docker(['inspect',name]))[0];assert.equal(after.State.Running,false);assert.equal(after.State.Pid,0);const survivingSameIdentity=cohort.filter(previous=>{const current=identity(previous.pid);return current&&current.startTicks===previous.startTicks&&current.state!=='Z';});assert.deepEqual(survivingSameIdentity,[],'Live former cohort process survived outer containment');fs.writeFileSync(path.join(root,'post-containment-membership.json'),JSON.stringify({observedAt:new Date().toISOString(),beforeMembership,faultMembership,survivingSameIdentity,pidReuseCheckedBy:'Linux /proc starttime ticks'},null,2));assert.ok(performance.now()-t0<=720000);
   assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'immutable-sentinel.txt'))).digest('hex'),beforeDigest);
   fs.writeFileSync(path.join(root,'receipt.json'),JSON.stringify({...incident,status:'PASS_F29_PAIR_CONTAINMENT',containedByExternalController:true,containerStopped:true,postFaultVerificationAt:new Date().toISOString(),elapsedMs:performance.now()-t0,verificationMaxAgeMs:180000,source,Cgroup:cgroup,hostLossTested:false,permanentExternalAlerting:false,productionChanges:0,providerEffects:0,inferenceCalls:0,immutableScope:'LABELLED_SENTINEL_ONLY; not full business/money preservation',substantiveScope:'Actual compiled primary/worker and actual launcher/guard/observers; isolated pair-loss containment only'},null,2));
  }catch(error){fs.writeFileSync(path.join(root,'failure.json'),JSON.stringify({source,mode,status:'FAILED_NOT_ACCEPTED',error:String(error),containedByExternalController:contained,hostLossTested:false},null,2));throw error;}finally{if(started){try{fs.writeFileSync(path.join(root,'container.log'),docker(['logs',name]));}catch{}if(!contained){try{docker(['kill',name])}catch{}}try{docker(['rm','-f',name])}catch{}}}
 }
}
