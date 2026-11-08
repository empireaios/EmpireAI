#!/usr/bin/env python3
"""Protected, metadata-only resolution of the eighteen exact backend aliases.

No application import is permitted. The committed Q05-derived spec is byte
pinned; callers cannot select paths or substitute a package. All native work is
after the unchanged native qualifier and within its original principal contract.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import stat

import frontend_packages as fp

SPEC_PATH = Path(__file__).resolve().parent/'backend-alias-probe-spec.json'
SPEC_SHA256 = 'd7e425d7a37479f6d6fdd293051a79f66a36f2e052ed063094ce113677629541'


class Refusal(ValueError):
    pass


def need(ok, code):
    if not ok: raise Refusal(code)


def validate_spec(probe_spec, cp):
    need(fp.sha(SPEC_PATH) == SPEC_SHA256, 'BACKEND_ALIAS_PINNED_SPEC_CHANGED')
    exact = fp.read(SPEC_PATH, 32768)
    need(probe_spec == exact, 'BACKEND_ALIAS_EXACT_SPEC_REQUIRED')
    need(exact['schema'] == 'work8-v84-backend-alias-probe-spec-v1' and exact['aliasCount'] == len(exact['aliases']) == 18, 'BACKEND_ALIAS_COMPLETE_SPEC_REQUIRED')
    need(exact['candidateImage'] == cp.BACKEND['image'] and exact['candidateArchiveSHA256'] == cp.BACKEND['sha256'] and exact['sourceCommit'] == cp.BACKEND['commit'] and exact['sourceTree'] == cp.BACKEND['tree'], 'BACKEND_ALIAS_CANDIDATE_BINDING')
    need(exact['applicationImportAllowed'] is False and exact['providerCredentialsAllowed'] is False and exact['pillowResolve'] == {'from':'/app/backend/package.json','request':'@empireai/pillow','expected':'/app/pillow/dist/index.js'}, 'BACKEND_ALIAS_NO_APPLICATION_IMPORT_REQUIRED')
    return exact


PROBE = r'''"use strict";
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),assert=require('node:assert/strict');
const {observeChild,expectedTermination}=require('/qualification/qualification-child-observation.cjs');
const status=(pid='self')=>Object.fromEntries(fs.readFileSync('/proc/'+pid+'/status','utf8').split('\n').filter(x=>x.includes(':')).map(x=>[x.split(':')[0],x.slice(x.indexOf(':')+1).trim()]));
const namespaces=(pid='self')=>Object.fromEntries(['pid','mnt','net','ipc','uts','user','cgroup'].map(k=>[k,fs.readlinkSync('/proc/'+pid+'/ns/'+k)]));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let observation=null,child=null,step='OPERATOR',childFailure=null;
(async()=>{
 const request=JSON.parse(fs.readFileSync('/control/request.json')),spec=request.spec,op=status();
 for(const value of [process.getuid(),process.getgid(),process.geteuid(),process.getegid()])assert.equal(value,0);
 assert.equal(BigInt('0x'+op.CapEff),0x800e3n);assert.equal(BigInt('0x'+op.CapPrm),0x800e3n);assert.equal(op.NoNewPrivs,'1');
 assert.equal(hash('/native/runtime-writer-isolation.so'),request.isolationSHA256);assert.equal(hash('/qualification/native-security-observer.node'),request.observerSHA256);
 assert.equal(hash('/backend-alias-spec.json'),request.specSHA256);let readonlyRootVerified=false;try{fs.writeFileSync('/backend-alias-operator-write','x')}catch(e){readonlyRootVerified=e.code==='EROFS'}assert(readonlyRootVerified);
 for(const p of ['/control','/control/request.json']){const s=fs.lstatSync(p);assert.equal(s.uid,1001);assert.equal(s.gid,1001);assert.equal(s.mode&0o777,p==='/control'?0o700:0o600);}
 const {prepareWriterIsolation}=require('/app/deployment/runtime-writer-isolation.cjs');const isolation=prepareWriterIsolation({library:'/native/runtime-writer-isolation.so',sha256:request.isolationSHA256,operatorUid:0});
 const source=`let step='SECURITY_BEFORE_METADATA',memberKind=null,memberIndex=null;(async()=>{const fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),assert=require('node:assert/strict'),{createRequire}=require('module');
 const spec=JSON.parse(fs.readFileSync('/backend-alias-spec.json','utf8'));const observe=require('/qualification/native-security-observer.node');
 const status=()=>Object.fromEntries(fs.readFileSync('/proc/self/status','utf8').split('\\n').filter(x=>x.includes(':')).map(x=>[x.split(':')[0],x.slice(x.indexOf(':')+1).trim()]));
 for(const value of [process.getuid(),process.getgid(),process.geteuid(),process.getegid()])assert.equal(value,65534);assert(process.getgroups().every(x=>x===65534));
 const before=status();assert(/^0+$/.test(before.CapEff)&&/^0+$/.test(before.CapPrm));assert.equal(before.NoNewPrivs,'1');assert.equal(before.Seccomp,'2');assert.equal(observe(),0);assert.equal(process.version,spec.nodeVersion);
 let privateDenied=false,privateWriteDenied=false;try{fs.readFileSync('/control/request.json')}catch(e){privateDenied=e.code==='EACCES'}try{const f=fs.openSync('/control/request.json','r+');fs.closeSync(f)}catch(e){privateWriteDenied=e.code==='EACCES'}assert(privateDenied&&privateWriteDenied);assert.equal(cp.spawnSync('/bin/true').error?.code,'EPERM');
 step='EXACT_ALIAS_METADATA';const aliases=[],aliasLinkMetadata=[];
 for(const [index,expected] of spec.aliases.entries()){memberKind='alias';memberIndex=index;const l=fs.lstatSync(expected.path);assert(l.isSymbolicLink());assert.equal(l.uid,0);assert.equal(l.gid,0);assert.equal(l.mode&0o777,0o777);aliasLinkMetadata.push([l.uid,l.gid,l.mode&0o777]);const linkTarget=fs.readlinkSync(expected.path),resolvedPath=fs.realpathSync(expected.path);assert.equal(linkTarget,expected.linkTarget);assert.equal(resolvedPath,expected.resolvedPath);const s=fs.lstatSync(resolvedPath);assert.equal(s.uid,expected.uid);assert.equal(s.gid,expected.gid);assert.equal(s.mode&0o777,expected.mode);assert((s.mode&0o022)===0);const row={path:expected.path,linkTarget,resolvedPath,type:s.isFile()?'file':s.isDirectory()?'directory':'refused',mode:s.mode&0o777,uid:s.uid,gid:s.gid};assert.equal(row.type,expected.type);if(s.isFile()){assert.equal(s.nlink,1);row.bytes=s.size;row.sha256=crypto.createHash('sha256').update(fs.readFileSync(resolvedPath)).digest('hex');assert.equal(row.bytes,expected.bytes);assert.equal(row.sha256,expected.sha256);}aliases.push(row);}
 const metadata=spec.readOnlyMetadata.map((expected,index)=>{memberKind='metadata';memberIndex=index;const s=fs.lstatSync(expected.path);assert(s.isFile()&&s.nlink===1);assert.equal(fs.realpathSync(expected.path),expected.path);const row={path:expected.path,mode:s.mode&0o777,uid:s.uid,gid:s.gid,bytes:s.size,sha256:crypto.createHash('sha256').update(fs.readFileSync(expected.path)).digest('hex')};assert.deepEqual(row,expected);return row;});
 step='PILLOW_RESOLVE_WITHOUT_IMPORT';memberKind=null;memberIndex=null;const resolution=createRequire(spec.pillowResolve.from).resolve(spec.pillowResolve.request);assert.equal(resolution,spec.pillowResolve.expected);assert.equal(require.cache[resolution],undefined);assert.equal(require.cache['/app/backend/dist/index.js'],undefined);
 let rootWriteDenied=false;try{fs.writeFileSync('/a5-backend-alias-readonly-probe','x')}catch(e){rootWriteDenied=e.code==='EROFS'||e.code==='EACCES'}assert(rootWriteDenied);
 step='SECURITY_AFTER_METADATA';const after=status();assert(/^0+$/.test(after.CapEff)&&/^0+$/.test(after.CapPrm));assert.equal(after.NoNewPrivs,'1');assert.equal(after.Seccomp,'2');assert.equal(observe(),0);
 const ns=Object.fromEntries(['pid','mnt','net','ipc','uts','user','cgroup'].map(k=>[k,fs.readlinkSync('/proc/self/ns/'+k)]));const processStat=fs.readFileSync('/proc/self/stat','utf8');
 console.log(JSON.stringify({status:'PASS_PROTECTED_BACKEND_ALIAS_METADATA',uid:process.getuid(),gid:process.getgid(),euid:process.geteuid(),egid:process.getegid(),groups:process.getgroups(),pid:process.pid,startTicks:processStat.slice(processStat.lastIndexOf(')')+2).split(' ')[19],node:process.version,caps:after.CapEff,permittedCaps:after.CapPrm,noNewPrivs:Number(after.NoNewPrivs),seccomp:Number(after.Seccomp),dumpability:observe(),dumpabilityMethod:'PR_GET_DUMPABLE_SAME_PROCESS_BEFORE_AND_AFTER_METADATA',privateDenied,privateWriteDenied,spawnDenied:true,rootWriteDenied,namespaces:ns,aliases,aliasLinkMetadata,metadata,pillowResolution:resolution,applicationImported:false,applicationStarted:false}));setTimeout(()=>{},30000);
 })().catch(e=>{console.log(JSON.stringify({status:'FAIL_BACKEND_ALIAS_CHILD',step,memberKind,memberIndex,errorCode:/^[A-Z_0-9]{1,80}$/.test(e.code||'')?e.code:null,errorClass:['Error','TypeError','RangeError','SyntaxError','ReferenceError','AssertionError'].includes(e.name)?e.name:'Error',rawErrorRetained:false,applicationStarted:false}));process.exitCode=1;});`;
 step='PROTECTED_METADATA_CHILD';child=cp.spawn(process.execPath,['-e',source],{uid:65534,gid:65534,env:{PATH:'/usr/bin:/bin',HOME:'/nonexistent',...isolation.environment},stdio:['ignore','pipe','pipe']});observation=observeChild(child,{observationDeadlineMs:15000});const row=await observation.observation;
 if(row.status!=='PASS_PROTECTED_BACKEND_ALIAS_METADATA'){childFailure=row;throw Error('BACKEND_ALIAS_CHILD_FAILED');}assert.equal(row.pid,child.pid);const processStat=fs.readFileSync('/proc/'+child.pid+'/stat','utf8');assert.equal(row.startTicks,processStat.slice(processStat.lastIndexOf(')')+2).split(' ')[19]);
 const attestation=isolation.verify(child.pid);assert.deepEqual(row.namespaces,namespaces(child.pid));assert.deepEqual(row.namespaces,namespaces());
 const threads=fs.readdirSync('/proc/'+child.pid+'/task').map(t=>{const s=status(child.pid+'/task/'+t);return {tid:Number(t),seccomp:Number(s.Seccomp),seccompFilters:Number(s.Seccomp_filters),nnp:Number(s.NoNewPrivs),caps:s.CapEff};});assert(threads.length>0);assert(threads.every(s=>s.seccomp===2&&s.seccompFilters===attestation.seccompFilters&&s.nnp===1&&/^0+$/.test(s.caps)));
 step='PRIVATE_EXCHANGE';const response={schema:'work8-v84-backend-alias-private-exchange-v1',specSHA256:request.specSHA256,nonceSHA256:crypto.createHash('sha256').update(request.nonce).digest('hex')};const pending='/control/response.pending';fs.writeFileSync(pending,JSON.stringify(response),{flag:'wx',mode:0o600});fs.chownSync(pending,1001,1001);const fd=fs.openSync(pending,'r');fs.fsyncSync(fd);fs.closeSync(fd);fs.renameSync(pending,'/control/response.json');const dir=fs.openSync('/control','r');fs.fsyncSync(dir);fs.closeSync(dir);
 const termination=await observation.finish();assert(expectedTermination(termination));assert.equal(observation.diagnostic().bytes,0);
 console.log(JSON.stringify({schema:'work8-v84-backend-alias-observation-v1',status:'PASS_PROTECTED_BACKEND_ALIAS_RESOLUTION',specSHA256:request.specSHA256,candidateImage:spec.candidateImage,sourceCommit:spec.sourceCommit,sourceTree:spec.sourceTree,operator:{uid:0,gid:0,euid:0,egid:0,capEff:op.CapEff,capPrm:op.CapPrm,noNewPrivs:1},writer:row,operatorNamespaces:namespaces(),readonlyRootVerified,nativeAttestation:attestation,threadCount:threads.length,threadObservations:threads,seccompTSYNC:true,privateExchange:true,observerSHA256:request.observerSHA256,childTermination:termination,childStderr:observation.diagnostic(),applicationImported:false,applicationStarted:false}));
})().catch(async e=>{if(observation)await observation.finish();console.log(JSON.stringify({schema:'work8-v84-backend-alias-observation-v1',status:'FAIL',step,errorCode:/^[A-Z_0-9]{1,80}$/.test(e.code||'')?e.code:null,errorClass:['Error','TypeError','RangeError','SyntaxError','ReferenceError','AssertionError'].includes(e.name)?e.name:'Error',childFailure:childFailure||(observation?observation.firstFailure():null),rawErrorRetained:false,applicationStarted:false}));process.exitCode=1;});
'''


def first_cause(row):
    child=row.get('childFailure') or {};code=child.get('errorCode') or row.get('errorCode')
    if isinstance(code,str) and re.fullmatch('[A-Z_0-9]{1,80}',code): return code
    stage=child.get('step') or child.get('stage') or row.get('step')
    if stage in ('OPERATOR','SECURITY_BEFORE_METADATA','EXACT_ALIAS_METADATA','PILLOW_RESOLVE_WITHOUT_IMPORT','SECURITY_AFTER_METADATA','PROTECTED_METADATA_CHILD','PRIVATE_EXCHANGE'): return 'BACKEND_ALIAS_'+stage
    return 'BACKEND_ALIAS_PROBE_FAILED'


def validate_observation(row, spec, observer_sha, host_namespaces):
    need(row.get('schema')=='work8-v84-backend-alias-observation-v1' and row.get('status')=='PASS_PROTECTED_BACKEND_ALIAS_RESOLUTION','BACKEND_ALIAS_OBSERVATION_REQUIRED')
    need(row.get('specSHA256')==SPEC_SHA256 and row.get('candidateImage')==spec['candidateImage'] and row.get('sourceCommit')==spec['sourceCommit'] and row.get('sourceTree')==spec['sourceTree'],'BACKEND_ALIAS_OBSERVATION_BINDING')
    op=row.get('operator',{});w=row.get('writer',{});att=row.get('nativeAttestation',{})
    need(all(op.get(k)==0 for k in ('uid','gid','euid','egid')) and int(op.get('capEff','0'),16)==int(op.get('capPrm','0'),16)==0x800e3 and op.get('noNewPrivs')==1,'BACKEND_ALIAS_OPERATOR_REQUIRED')
    need(w.get('status')=='PASS_PROTECTED_BACKEND_ALIAS_METADATA' and all(w.get(k)==65534 for k in ('uid','gid','euid','egid')) and isinstance(w.get('groups'),list) and all(type(x)is int and x==65534 for x in w['groups']),'BACKEND_ALIAS_WRITER_REQUIRED')
    need(w.get('aliasLinkMetadata')==[[0,0,0o777]]*18 and w.get('aliases')==spec['aliases'] and w.get('metadata')==spec['readOnlyMetadata'] and w.get('pillowResolution')==spec['pillowResolve']['expected'] and w.get('node')==spec['nodeVersion'],'BACKEND_ALIAS_COMPLETE_METADATA_REQUIRED')
    need(int(w.get('caps','1'),16)==int(w.get('permittedCaps','1'),16)==0 and w.get('noNewPrivs')==1 and w.get('seccomp')==2 and type(w.get('dumpability'))is int and w['dumpability']==0 and w.get('dumpabilityMethod')=='PR_GET_DUMPABLE_SAME_PROCESS_BEFORE_AND_AFTER_METADATA','BACKEND_ALIAS_WRITER_SECURITY_REQUIRED')
    need(all(w.get(k)is True for k in ('privateDenied','privateWriteDenied','spawnDenied','rootWriteDenied')) and row.get('readonlyRootVerified')is True and row.get('privateExchange')is True and row.get('seccompTSYNC')is True,'BACKEND_ALIAS_DENIALS_REQUIRED')
    need(att.get('nativeSha256')==fp.ISOLATION_SHA and att.get('noNewPrivileges')is True and att.get('processCreation')=='DENIED_EXCEPT_SAME_TGID_THREADS' and att.get('processGroupEscape')=='DENIED' and type(att.get('seccompFilters'))is int and att['seccompFilters']>0,'BACKEND_ALIAS_NATIVE_ATTESTATION_REQUIRED')
    threads=row.get('threadObservations',[])
    need(isinstance(threads,list) and len(threads)==row.get('threadCount') and 0<len(threads)<=32 and len({t['tid'] for t in threads})==len(threads) and w.get('pid') in {t['tid'] for t in threads} and all(type(t['tid'])is int and t['tid']>0 and t['seccomp']==2 and t['seccompFilters']==att['seccompFilters'] and t['nnp']==1 and int(t['caps'],16)==0 for t in threads),'BACKEND_ALIAS_THREAD_CENSUS_REQUIRED')
    ns=w.get('namespaces',{})
    need(type(w.get('pid'))is int and w['pid']>0 and re.fullmatch('[1-9][0-9]*',w.get('startTicks','')) and set(ns)=={'pid','mnt','net','ipc','uts','user','cgroup'} and ns==row.get('operatorNamespaces') and all(re.fullmatch(r'[a-z]+:\[[0-9]+\]',v) for v in ns.values()) and all(ns[k]!=host_namespaces[k] for k in ('pid','mnt','net')),'BACKEND_ALIAS_NAMESPACE_IDENTITY_REQUIRED')
    need(row.get('observerSHA256')==observer_sha and all(row.get(k)is False and w.get(k)is False for k in ('applicationImported','applicationStarted')),'BACKEND_ALIAS_APPLICATION_IMPORT_REFUSED')
    t=row.get('childTermination',{});e=row.get('childStderr',{})
    need(t.get('closed')is True and t.get('forcedKill')is False and t.get('requestedSignal')==t.get('signal')=='SIGTERM' and t.get('exitCode')is None and t.get('outputViolation')is None and type(e.get('bytes'))is int and e['bytes']==0 and e.get('sha256')==hashlib.sha256(b'').hexdigest() and e.get('streamComplete')is True and e.get('rawOutputRetained')is False,'BACKEND_ALIAS_COMPLETE_TERMINATION_REQUIRED')
    return True


def qualify_backend_aliases(prepared, cp, runner, native_result, probe_spec):
    prepared=fp.production_root(prepared);spec=validate_spec(probe_spec,cp)
    need(native_result.get('status')=='CURRENT_NATIVE_CAPABILITY_OBSERVED_NO_APPLICATION_AUTHORITY' and native_result.get('applicationExecutionAuthorized')is False,'BACKEND_ALIAS_PRIOR_NATIVE_REQUIRED')
    identity=fp.read(prepared/'runner-identity.json');provenance=fp.read(prepared/'runtime-image-provenance.json');native=fp.read(prepared/'native-qualification.json')
    need(native_result.get('sessionId')==identity['sessionId'] and native_result.get('nativeQualificationSHA256')==fp.sha(prepared/'native-qualification.json'),'BACKEND_ALIAS_NATIVE_BINDING')
    runner.validate_current_executor_continuity(provenance,identity);runner.validate_executor_security(native,identity,provenance)
    runner.validate_qualification_evidence(native,identity,fp.read(prepared/'runtime-evidence/guard-controls.json'),fp.read(prepared/'runtime-evidence/dumpability-observer-build.json'),fp.sha(runner.HERE/'github_contract.py'))
    engine=json.loads(runner.run(prepared,['docker','info','--format','{{json .ID}}'],seconds=10));need(engine==native['dockerEngineId'],'BACKEND_ALIAS_DAEMON_CHANGED')
    name='work8-v65-a5-'+identity['runId'];need(re.fullmatch(r'work8-v65-a5-[1-9][0-9]{0,19}',name),'BACKEND_ALIAS_CURRENT_RUN_REQUIRED')
    root=prepared/'backend-resolution-private';need(not root.exists() and not root.is_symlink(),'BACKEND_ALIAS_FRESH_SCOPE_REQUIRED');root.mkdir(mode=0o700);fp.private(root)
    control=root/'control';control.mkdir(mode=0o700);fp.private(control)
    observer=fp.read(prepared/'runtime/native-observer-build.json',32768);need(observer['binarySHA256']==fp.sha(prepared/'runtime/native-security-observer.node'),'BACKEND_ALIAS_OBSERVER_CHANGED')
    probe=root/'probe.cjs';probe.write_text(PROBE);probe.chmod(0o444)
    nonce=secrets.token_hex(32);fp.atomic(control/'request.json',{'spec':spec,'nonce':nonce,'specSHA256':SPEC_SHA256,'observerSHA256':observer['binarySHA256'],'isolationSHA256':fp.ISOLATION_SHA})
    cname=name+'-backend-alias';primary=None;errors=[]
    try:
        options=['--name',cname,'--label','work8.native='+name,'--pull','never','--network','none','--read-only','--user','0:0','--cap-drop','ALL','--memory','256m','--cpus','1','--pids-limit','32','--security-opt','no-new-privileges']
        for cap in fp.CAPABILITIES: options+=['--cap-add',cap]
        args=['docker','run',*options,'--mount','type=bind,src='+str(prepared/'runtime')+',dst=/qualification,readonly','--mount','type=bind,src='+str(probe)+',dst=/backend-alias-probe.cjs,readonly','--mount','type=bind,src='+str(SPEC_PATH)+',dst=/backend-alias-spec.json,readonly','--mount','type=bind,src='+str(control)+',dst=/control','--entrypoint','node',spec['candidateImage'],'/backend-alias-probe.cjs']
        raw=runner.run(prepared,args,seconds=30,maximum=32768,expected=(0,1));lines=raw.decode().splitlines();need(len(lines)==1,'BACKEND_ALIAS_SINGLE_RECEIPT_REQUIRED')
        row=json.loads(lines[0]);fp.atomic(prepared/'backend-resolution-observation.json',row)
        need(row.get('status')=='PASS_PROTECTED_BACKEND_ALIAS_RESOLUTION',first_cause(row));validate_observation(row,spec,observer['binarySHA256'],provenance['actualEnvironment']['hostNamespaces'])
        response=fp.read(control/'response.json',16384);s=(control/'response.json').lstat();need(s.st_uid==s.st_gid==1001 and stat.S_IMODE(s.st_mode)==0o600,'BACKEND_ALIAS_PRIVATE_RESPONSE_MODE')
        need(response=={'schema':'work8-v84-backend-alias-private-exchange-v1','specSHA256':SPEC_SHA256,'nonceSHA256':hashlib.sha256(nonce.encode()).hexdigest()},'BACKEND_ALIAS_PRIVATE_EXCHANGE_FAILED')
        d=json.loads(runner.run(prepared,['docker','inspect',cname],seconds=10))[0];h=d['HostConfig']
        need(d['State']['ExitCode']==0 and d['Image']==spec['candidateImage'] and d['Config']['User']=='0:0' and d['Config']['Entrypoint']==['node'] and h['ReadonlyRootfs'] and not h['Privileged'] and h['NetworkMode']=='none' and runner.exact_capabilities(h['CapAdd']) and h['CapDrop']==['ALL'] and h['PidsLimit']==32 and h['Memory']==256*1024**2 and not h['PortBindings'],'BACKEND_ALIAS_CONTAINER_CHANGED')
        need(all(h.get(k,'')=='' for k in ('PidMode','UTSMode','UsernsMode')) and h['IpcMode']==h['CgroupnsMode']=='private' and any('no-new-privileges' in x for x in h['SecurityOpt']),'BACKEND_ALIAS_CONTAINER_NAMESPACE_CHANGED')
        need(not any(v.startswith(('GH_TOKEN=','GITHUB_TOKEN=','ACTIONS_RUNTIME_TOKEN=')) for v in d['Config']['Env']),'BACKEND_ALIAS_PROVIDER_CREDENTIAL_REFUSED')
        mounts={(m['Source'],m['Destination'],m['RW']) for m in d['Mounts']}
        need(len(d['Mounts'])==4 and mounts=={(str(prepared/'runtime'),'/qualification',False),(str(probe),'/backend-alias-probe.cjs',False),(str(SPEC_PATH),'/backend-alias-spec.json',False),(str(control),'/control',True)} and all(m['Type']=='bind' and m['Propagation']=='rprivate' for m in d['Mounts']),'BACKEND_ALIAS_EXACT_MOUNTS_REQUIRED')
        runner.validate_current_executor_continuity(provenance,identity);need(json.loads(runner.run(prepared,['docker','info','--format','{{json .ID}}'],seconds=10))==engine,'BACKEND_ALIAS_DAEMON_CHANGED')
        need(fp.sha(SPEC_PATH)==SPEC_SHA256,'BACKEND_ALIAS_SPEC_DRIFT')
        receipt={'schema':'work8-v84-backend-alias-qualification-v1','status':'PASS_PROTECTED_BACKEND_ALIAS_RESOLUTION','metadataOnly':True,'probeSpecSHA256':SPEC_SHA256,'archiveSHA256':spec['candidateArchiveSHA256'],'sessionId':identity['sessionId'],'workflowCommit':identity['workflowCommit'],'specSHA256':SPEC_SHA256,'candidateImage':spec['candidateImage'],'candidateArchiveSHA256':spec['candidateArchiveSHA256'],'sourceCommit':spec['sourceCommit'],'sourceTree':spec['sourceTree'],'observationSHA256':fp.sha(prepared/'backend-resolution-observation.json'),'nativeQualificationSHA256':fp.sha(prepared/'native-qualification.json'),'runtimeImageProvenanceSHA256':fp.sha(prepared/'runtime-image-provenance.json'),'runnerIdentitySHA256':fp.sha(prepared/'runner-identity.json'),'dockerEngineId':engine,'containerObservation':fp.container_observation(d),'privateResponseObservation':{'uid':s.st_uid,'gid':s.st_gid,'mode':stat.S_IMODE(s.st_mode),'nlink':s.st_nlink,'bytes':s.st_size,'sha256':fp.sha(control/'response.json'),'nonceExported':False},'applicationImported':False,'applicationStarted':False,'wholeRowsAccepted':[]}
        fp.atomic(prepared/'backend-resolution.json',receipt)
        return receipt
    except BaseException as exc:
        primary=exc;runner.preserve_first_failure(prepared,'backend-alias',runner.Refusal(str(exc)) if isinstance(exc,Refusal) else exc);raise
    finally:
        try: runner.run(prepared,['docker','rm','-fv',cname],seconds=15)
        except BaseException as exc: errors.append({'scope':'container','errorClass':type(exc).__name__})
        try: cleanup_backend_resolution(prepared)
        except BaseException as exc: errors.append({'scope':'private-files','errorClass':type(exc).__name__})
        fp.atomic(prepared/'backend-resolution-cleanup.json',{'schema':'work8-v84-backend-alias-cleanup-v1','status':'FAIL' if errors else 'PASS','errors':errors,'primaryFailurePreserved':primary is not None,'applicationStarted':False})
        if errors and primary is None: raise Refusal('BACKEND_ALIAS_CLEANUP_FAILED')


def cleanup_backend_resolution(prepared):
    prepared=fp.production_root(prepared);root=prepared/'backend-resolution-private'
    if not root.exists() and not root.is_symlink(): return {'status':'NO_BACKEND_ALIAS_SCOPE'}
    fp.private(root);paths=[root,*root.rglob('*')];need(len(paths)<=6,'BACKEND_ALIAS_CLEANUP_SCOPE_BOUND')
    control=root/'control'
    if control.exists() or control.is_symlink(): fp.private(control)
    pending=control/'response.pending'
    for p in paths:
        s=p.lstat()
        # The exact operator creates this leaf before chown/rename. A killed
        # operator may leave it UID0-owned. Permit unlink only of that bounded,
        # canonical, private regular leaf inside the verified UID1001 control
        # directory; its partial contents are never read, admitted or exported.
        interrupted_pending=(p==pending and p.resolve()==p and s.st_uid==s.st_gid==0
                             and stat.S_ISREG(s.st_mode) and s.st_nlink==1
                             and stat.S_IMODE(s.st_mode)==0o600 and 0<=s.st_size<=16384)
        need(interrupted_pending or (s.st_uid==s.st_gid==1001 and (stat.S_ISDIR(s.st_mode) or (stat.S_ISREG(s.st_mode) and s.st_nlink==1))),'BACKEND_ALIAS_CLEANUP_SCOPE_CHANGED')
    shutil.rmtree(root);need(not root.exists(),'BACKEND_ALIAS_CLEANUP_INCOMPLETE')
    return {'status':'PASS_BACKEND_ALIAS_PRIVATE_SCOPE_REMOVED'}
