import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';

export function processIdentity(pid) {
  try {
    const stat=fs.readFileSync(`/proc/${pid}/stat`,'utf8');
    const fields=stat.slice(stat.lastIndexOf(') ')+2).trim().split(/\s+/);
    return {pid:Number(pid),state:fields[0],startTicks:fields[19],cgroup:fs.readFileSync(`/proc/${pid}/cgroup`,'utf8')};
  } catch (e) { if(e.code==='ENOENT'||e.code==='ESRCH')return null;throw e; }
}
export function inCohort(candidate,root) {
  const rows=text=>text.trim().split('\n').map(x=>{const a=x.indexOf(':'),b=x.indexOf(':',a+1);return [x.slice(0,b),x.slice(b+1)];});
  const roots=rows(root);assert.ok(roots.length&&roots.every(([,p])=>p!=='/'&&p.startsWith('/')),'NONISOLATED_CGROUP');
  const actual=new Map(rows(candidate));
  return roots.every(([id,p])=>actual.has(id)&&(actual.get(id)===p||actual.get(id).startsWith(p+'/')));
}
export function assertExternal(controller,container) {
  assert.ok(controller&&container,'PROCESS_IDENTITY_UNAVAILABLE');
  assert.notEqual(controller.pid,container.pid,'CONTROLLER_IS_TESTED_PROCESS');
  assert.ok(!inCohort(controller.cgroup,container.cgroup),'CONTROLLER_INSIDE_TESTED_COHORT');
}
const pause=ms=>new Promise(r=>setTimeout(r,ms));

// External lifecycle primitive only. Callers must independently verify actual
// held capture and original recovery assertions; this module grants no restart.
export function createHh4OuterCohort({imageId,source,evidenceRoot,terminationDeadlineMs=5000}) {
  assert.match(imageId,/^sha256:[a-f0-9]{64}$/);assert.match(source,/^[a-f0-9]{40}$/);
  assert.equal(terminationDeadlineMs,5000,'PRESERVE_FIXED_TERMINATION_BOUNDARY');
  const root=path.resolve(evidenceRoot);assert.equal(root,evidenceRoot);
  assert.deepEqual(fs.readdirSync(root),[],'NEW_EMPTY_EVIDENCE_ROOT_REQUIRED');
  const mounted=path.join(root,'container-evidence');fs.mkdirSync(mounted,{mode:0o700});
  const name='work8-hh4-'+randomUUID(),controller=processIdentity(process.pid);
  const origin=performance.now();let id=null,cohortRoot=null,closed=false,creationAttempted=false,containing=false,failureSequence=0;
  const known=new Map();
  const write=(file,value)=>fs.writeFileSync(path.join(root,file),JSON.stringify(value,null,2),{flag:'wx',mode:0o600});
  const docker=(args,timeout=15000)=>execFileSync('docker',args,{encoding:'utf8',timeout,stdio:['ignore','pipe','pipe']}).trim();
  const inspect=(timeout=15000)=>{const v=JSON.parse(docker(['inspect',id??name],timeout))[0];assert.equal(v.Name,'/'+name,'CONTAINER_NAME_CHANGED');assert.equal(v.Config.Labels['work8.hh4'],name,'CONTAINER_LABEL_CHANGED');assert.equal(v.Image,imageId,'CONTAINER_IMAGE_CHANGED');assert.match(v.Id,/^[a-f0-9]{64}$/);if(id)assert.equal(v.Id,id,'CONTAINER_ID_CHANGED');else id=v.Id;return v;};
  const inventory=()=>{
    if(!cohortRoot)return [];
    const members=fs.readdirSync('/proc').filter(p=>/^\d+$/.test(p)).map(processIdentity).filter(p=>p&&inCohort(p.cgroup,cohortRoot));
    for(const p of members)known.set(p.pid+':'+p.startTicks,p);
    return members;
  };
  const captureDiagnostics=()=>{
    for(const [file,args]of [['container-inspect.json',['inspect',id]],['container-logs.txt',['logs',id]]]){
      try{fs.writeFileSync(path.join(root,file),docker(args),{flag:'wx',mode:0o600});}
      catch(error){fs.writeFileSync(path.join(root,file+'.error'),String(error)+'\n'+String(error.stderr??''),{flag:'wx',mode:0o600});}
    }
  };
  return {
    async start(){
      assert.ok(!creationAttempted&&!closed,'COHORT_CANNOT_RESTART');creationAttempted=true;
      // Create first so a start failure never loses the exact container identity.
      id=docker(['create','--name',name,'--label','work8.hh4='+name,'--user',`${process.getuid()}:${process.getgid()}`,
        '--network','none','--cap-drop','ALL','--security-opt','no-new-privileges','--read-only',
        '--tmpfs','/tmp:rw,nosuid,nodev,size=1073741824,mode=1777','--pids-limit','512','--memory','3g','--cpus','2',
        '--restart','no','--mount',`type=bind,src=${mounted},dst=/evidence`,
        '-e','NODE_ENV=test','-e','EMPIRE_ENGINEERING_TEST_MODE=true','-e','HH4_SOURCE='+source,'-e','RAILWAY_GIT_COMMIT_SHA='+source,'-e','WORK8_KERNEL_EGRESS=DENIED',
        '--entrypoint','node',imageId,'scripts/work8/hh4-generated-primary.mjs']);
      assert.match(id,/^[a-f0-9]{64}$/);
      const created=inspect();assert.equal(created.Image,imageId);assert.equal(created.Config.Labels['work8.hh4'],name);
      assert.equal(created.HostConfig.NetworkMode,'none');assert.equal(created.HostConfig.Privileged,false);
      assert.equal(created.HostConfig.ReadonlyRootfs,true);assert.deepEqual(created.HostConfig.CapDrop,['ALL']);
      assert.equal(created.HostConfig.RestartPolicy.Name,'no');
      write('container-created.json',{source,imageId,id,name,controller,created,elapsedMs:performance.now()-origin});
      docker(['start',id]);const running=inspect();assert.equal(running.State.Running,true);
      const leader=processIdentity(running.State.Pid);assertExternal(controller,leader);cohortRoot=leader.cgroup;
      const members=inventory();assert.ok(members.some(p=>p.pid===leader.pid&&p.startTicks===leader.startTicks));
      write('cohort-started.json',{source,imageId,id,controller,leader,members,elapsedMs:performance.now()-origin});
      return {id,source,imageId};
    },
    observe(){assert.ok(id&&!closed,'COHORT_NOT_ACTIVE');return {inspection:inspect(),members:inventory()};},
    async contain(reason){
      assert.ok(creationAttempted&&!closed&&!containing,'COHORT_NOT_ACTIVE');containing=true;const started=performance.now();
      try{
      const remaining=()=>{const left=Math.floor(terminationDeadlineMs-(performance.now()-started));assert.ok(left>0,'COHORT_TERMINATION_DEADLINE');return left;};
      const before=inspect(remaining());let members=[];
      if(before.State.Running){const leader=processIdentity(before.State.Pid);assertExternal(controller,leader);
        if(cohortRoot)assert.equal(leader.cgroup,cohortRoot,'COHORT_IDENTITY_CHANGED');else cohortRoot=leader.cgroup;
        members=inventory();
        try{docker(['kill','--signal','KILL',id],remaining());}catch(error){if(inspect(remaining()).State.Running)throw error;}
      }
      let after,survivors;
      do{
        after=inspect(remaining());const live=inventory().filter(p=>p.state!=='Z'&&p.state!=='X');
        const retained=[...known.values()].map(old=>({old,now:processIdentity(old.pid)})).filter(({old,now})=>now&&now.startTicks===old.startTicks&&now.state!=='Z'&&now.state!=='X').map(x=>x.now);
        survivors=[...new Map([...live,...retained].map(p=>[p.pid+':'+p.startTicks,p])).values()];
        if(!after.State.Running&&after.State.Pid===0&&survivors.length===0)break;
        assert.ok(performance.now()-started<terminationDeadlineMs,'COHORT_TERMINATION_DEADLINE');await pause(25);
      }while(true);
      assert.ok(performance.now()-started<terminationDeadlineMs,'COHORT_TERMINATION_DEADLINE');
      const receipt={containedAt:Date.now(),containedMonotonicMs:performance.now(),scope:'HH4_EXTERNAL_COHORT_CONTAINMENT_ONLY',reason,source,imageId,id,controller,cohortRoot,beforeMembers:members,observedIdentities:[...known.values()],after,survivors,elapsedMs:performance.now()-started,noRestart:true,recoveryAcceptance:false};
      write('cohort-containment.json',receipt);closed=true;captureDiagnostics();return receipt;
      }catch(error){write('cohort-containment-failure-'+(++failureSequence)+'.json',{status:'CONTAINMENT_UNVERIFIED',reason,source,imageId,id,name,error:String(error),stderr:String(error.stderr??''),elapsedMs:performance.now()-started,retryPermitted:true});throw error;}finally{containing=false;}
    }
  };
}
