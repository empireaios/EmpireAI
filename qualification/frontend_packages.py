#!/usr/bin/env python3
"""Complete, non-application qualification of the two preserved distributions.

The filesystem audit is deliberately separable from hosted execution. Production
entrypoints require the original UID/GID1001 custody and a source-bound native
qualification. A root-only filesystem audit is never native evidence.
"""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import secrets
import shutil
import stat
import tarfile

ROLES = ('normal', 'recovery')
PINNED = {
    'normal': ('750483b3152f2c9c65a65b6381c8c94f081b9eb1', 'f589a8f0f94fbcdf113f162abac11d03c19acc25', '391b15ded61649159291a4cad6f8071ce1fdf05f2e0f3732d3b1cf695a43e1d9'),
    'recovery': ('94d34cab7b0739849839ea3c66e50c8fdd3a2b27', '5da61811a035b9504d74f699df8b164cc7f9f0ac', '2c9a14895e7888ef5f29964a894b9ab99c4affb6ed038f83e5039c2ddf781167'),
}
# Explicitly identical to the original native contract.
CAPABILITIES = ['SETUID', 'SETGID', 'CHOWN', 'DAC_OVERRIDE', 'KILL', 'SYS_PTRACE']
NODE_SHA = '3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
ISOLATION_SHA = '5048f19ec38c708dd1b139f7a3f60cb8eb5e9146cd4fdb6e978caffbcac87a1b'
MAX_FILES = 12000
MAX_EXPANDED_BYTES = 2 * 1024**3


class Refusal(ValueError):
    pass


def need(ok, code):
    if not ok:
        raise Refusal(code)


def sha(path):
    with Path(path).open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def canonical(path):
    p = Path(path)
    need(p.is_absolute() and p.resolve() == p and ',' not in str(p), 'FRONTEND_CANONICAL_PATH_REQUIRED')
    return p


def private(path):
    p = canonical(path); s = p.lstat()
    need(stat.S_ISDIR(s.st_mode) and s.st_uid == s.st_gid == 1001 and stat.S_IMODE(s.st_mode) == 0o700, 'FRONTEND_PRIVATE_UID1001_REQUIRED')
    return p


def production_root(prepared):
    need(os.getuid() == os.geteuid() == os.getgid() == os.getegid() == 1001, 'FRONTEND_HOST_PRINCIPAL_REQUIRED')
    return private(prepared)


def atomic(path, value):
    p = Path(path)
    data = (json.dumps(value, sort_keys=True, separators=(',', ':'))+'\n').encode()
    need(len(data) <= 2*1024**2, 'FRONTEND_RECEIPT_BOUND')
    fd = os.open(p, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'wb') as f:
        f.write(data); f.flush(); os.fsync(f.fileno())
    return sha(p)


def read(path, maximum=3*1024**2):
    p = canonical(path); s = p.lstat()
    need(stat.S_ISREG(s.st_mode) and s.st_nlink == 1 and s.st_size <= maximum, 'FRONTEND_REGULAR_RECEIPT_REQUIRED')
    return json.loads(p.read_bytes())


def member_name(name):
    need(isinstance(name, str) and 0 < len(name) < 1024 and '\\' not in name and '\x00' not in name, 'FRONTEND_UNSAFE_MEMBER')
    p = PurePosixPath(name)
    need(not p.is_absolute() and p.as_posix() == name and all(x not in ('', '.', '..') for x in p.parts), 'FRONTEND_UNSAFE_MEMBER')
    need('__pycache__' not in p.parts and not name.endswith(('.pyc', '.pyo')), 'FRONTEND_BYTECODE_MEMBER_REFUSED')
    return name


def archive_inventory(archive):
    """Complete exact inventory, including MEMBERS.json and all parent dirs."""
    p = canonical(archive); s = p.lstat()
    need(stat.S_ISREG(s.st_mode) and s.st_nlink == 1, 'FRONTEND_REGULAR_ARCHIVE_REQUIRED')
    files, directories, total = {}, {''}, 0
    with tarfile.open(p, 'r:gz') as t:
        for m in t:
            name = member_name(m.name)
            need(m.isfile() and not m.mode & 0o6000 and not m.linkname, 'FRONTEND_NONREGULAR_MEMBER_REFUSED')
            need(name not in files, 'FRONTEND_DUPLICATE_MEMBER')
            total += m.size
            need(len(files) < MAX_FILES and 0 <= m.size and total <= MAX_EXPANDED_BYTES, 'FRONTEND_ARCHIVE_EXPANSION_BOUND')
            files[name] = {'path':name, 'bytes':m.size, 'sha256':hashlib.file_digest(t.extractfile(m), 'sha256').hexdigest(), 'mode':0o555 if m.mode & 0o111 else 0o444}
            for parent in PurePosixPath(name).parents:
                directories.add('' if parent.as_posix() == '.' else parent.as_posix())
    need(files and not (set(files) & directories), 'FRONTEND_FILE_DIRECTORY_CONFLICT')
    return {'files':files, 'directories':directories, 'logicalBytes':total}


def audit_extracted(archive, destination, *, expected_uid, expected_gid):
    """Filesystem-only readback; accepting root here never authorizes execution."""
    root = canonical(destination); expected = archive_inventory(archive)
    observed_files, observed_dirs = {}, set()
    paths = [root, *root.rglob('*')]
    need(len(paths) <= MAX_FILES*3, 'FRONTEND_EXTRACTED_INVENTORY_BOUND')
    for p in paths:
        s = p.lstat(); name = p.relative_to(root).as_posix()
        name = '' if name == '.' else member_name(name)
        need(s.st_uid == expected_uid and s.st_gid == expected_gid, 'FRONTEND_EXTRACTED_OWNER_CHANGED')
        if stat.S_ISDIR(s.st_mode):
            need(stat.S_IMODE(s.st_mode) == 0o555, 'FRONTEND_DIRECTORY_MODE_CHANGED')
            observed_dirs.add(name)
        elif stat.S_ISREG(s.st_mode):
            need(s.st_nlink == 1, 'FRONTEND_EXTRACTED_HARDLINK_REFUSED')
            row = expected['files'].get(name)
            need(row is not None, 'FRONTEND_EXTRA_EXTRACTED_MEMBER')
            need(s.st_size == row['bytes'] and stat.S_IMODE(s.st_mode) == row['mode'], 'FRONTEND_EXTRACTED_METADATA_CHANGED')
            fd = os.open(p, os.O_RDONLY | os.O_NOFOLLOW)
            with os.fdopen(fd, 'rb') as f:
                before = os.fstat(f.fileno())
                need(stat.S_ISREG(before.st_mode) and before.st_nlink == 1 and (before.st_dev,before.st_ino) == (s.st_dev,s.st_ino), 'FRONTEND_READBACK_RACE')
                value = hashlib.file_digest(f, 'sha256').hexdigest(); after = os.fstat(f.fileno())
            need((before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns) == (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns), 'FRONTEND_READBACK_RACE')
            need(value == row['sha256'], 'FRONTEND_EXTRACTED_DIGEST_CHANGED')
            observed_files[name] = row
        else:
            raise Refusal('FRONTEND_EXTRACTED_NONREGULAR_REFUSED')
    need(set(observed_files) == set(expected['files']), 'FRONTEND_EXTRACTED_MEMBER_SET_CHANGED')
    need(observed_dirs == expected['directories'], 'FRONTEND_EXTRACTED_DIRECTORY_SET_CHANGED')
    rows = [observed_files[n] for n in sorted(observed_files)]
    directory_rows = [{'path':n, 'mode':0o555} for n in sorted(observed_dirs)]
    return {'schema':'work8-v84-full-frontend-extracted-inventory-v1','status':'PASS_FILESYSTEM_READBACK_ONLY','archiveSHA256':sha(archive),'files':rows,'directories':directory_rows,'fileCount':len(rows),'directoryCount':len(directory_rows),'logicalBytes':expected['logicalBytes'],'owner':{'uid':expected_uid,'gid':expected_gid},'inventorySHA256':hashlib.sha256(json.dumps({'files':rows,'directories':directory_rows},sort_keys=True,separators=(',',':')).encode()).hexdigest(),'nativeExecutionClaimed':False,'applicationStarted':False,'cacheFilesCreated':0}


def validate_pins(cp):
    need(set(cp.FRONTENDS) == set(ROLES), 'FRONTEND_BOTH_ROLES_REQUIRED')
    for role in ROLES:
        pin = cp.FRONTENDS[role]
        need(tuple(pin[k] for k in ('commit','tree','sha256')) == PINNED[role], 'FRONTEND_CURRENT_CANDIDATE_PIN_REQUIRED')


def extract_frontends(prepared, cp):
    prepared = production_root(prepared); validate_pins(cp)
    logical = sum(archive_inventory(prepared/'artifacts'/cp.FRONTENDS[role]['file'])['logicalBytes'] for role in ROLES)
    native_floor = max(6*1024**3, 2*logical+(128+1920)*1024**2+2*1024**3)
    available = shutil.disk_usage(prepared).free
    need(available >= logical + native_floor, 'FRONTEND_EXTRACTION_STORAGE_BOUND')
    root = prepared/'frontend-qualification'
    need(not root.exists() and not root.is_symlink(), 'FRONTEND_FRESH_QUALIFICATION_REQUIRED')
    root.mkdir(mode=0o700); private(root)
    receipt = {'schema':'work8-v84-complete-frontend-extraction-v1','status':'PASS_BOTH_COMPLETE_EXTRACTIONS','roles':{},'storageBeforeExtraction':{'freeBytes':available,'frontendLogicalBytes':logical,'requiredFreeBytes':logical+native_floor,'preservedNativeFloorBytes':native_floor,'postPullMeasurementStillRequired':True},'applicationStarted':False,'packageRebuilt':False,'nativeLoading':'NOT_EXECUTED'}
    for role in ROLES:
        pin = cp.FRONTENDS[role]; archive = prepared/'artifacts'/pin['file']
        archive_inventory(archive)
        output = root/role
        result = cp.verify_frontend(archive, role, destination=output)
        need(result['extracted'] is True and result['archiveSHA256'] == pin['sha256'], 'FRONTEND_COMPLETE_EXTRACTION_REQUIRED')
        reused = cp.verify_extracted_frontend(archive, role, output)
        audit = audit_extracted(archive, output, expected_uid=1001, expected_gid=1001)
        need(audit['archiveSHA256'] == pin['sha256'], 'FRONTEND_EXTRACTION_ARCHIVE_CHANGED')
        need(sha(output/'runtime/bin/node') == NODE_SHA, 'FRONTEND_BUNDLED_NODE_HASH')
        audit.update(role=role, sourceCommit=pin['commit'], sourceTree=pin['tree'], buildId=pin['buildId'], archive=pin['file'])
        inventory_sha = atomic(prepared/('frontend-'+role+'-inventory.json'), audit)
        receipt['roles'][role] = {'sourceCommit':pin['commit'],'sourceTree':pin['tree'],'archiveSHA256':pin['sha256'],'buildId':pin['buildId'],'extraction':result,'originalVerifierReadback':reused,'inventoryReceiptSHA256':inventory_sha,'inventorySHA256':audit['inventorySHA256'],'fileCount':audit['fileCount'],'directoryCount':audit['directoryCount'],'logicalBytes':audit['logicalBytes'],'nodeSHA256':NODE_SHA}
    atomic(prepared/'frontend-extraction.json', receipt)
    return receipt


# Source-bound operator/child probe. It imports dependencies, never an app entry.
PROBE = r'''"use strict";
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),assert=require('node:assert/strict');
const {observeChild,expectedTermination}=require('/qualification/qualification-child-observation.cjs');
const status=(pid='self')=>Object.fromEntries(fs.readFileSync('/proc/'+pid+'/status','utf8').split('\n').filter(x=>x.includes(':')).map(x=>[x.split(':')[0],x.slice(x.indexOf(':')+1).trim()]));
const ns=(pid='self')=>Object.fromEntries(['pid','mnt','net','ipc','uts','user','cgroup'].map(k=>[k,fs.readlinkSync('/proc/'+pid+'/ns/'+k)]));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let child=null,observation=null,step='OPERATOR',failure=null;
(async()=>{
 const request=JSON.parse(fs.readFileSync('/control/request.json'));const op=status();
 assert.equal(process.getuid(),0);assert.equal(process.getgid(),0);assert.equal(process.geteuid(),0);assert.equal(process.getegid(),0);
 assert.equal(BigInt('0x'+op.CapEff),0x800e3n);assert.equal(BigInt('0x'+op.CapPrm),0x800e3n);assert.equal(op.NoNewPrivs,'1');
 assert.equal(hash('/frontend/runtime/bin/node'),request.nodeSHA256);
 assert.equal(hash('/qualification/native-security-observer.node'),request.observerSHA256);
 assert.equal(hash('/native/runtime-writer-isolation.so'),request.isolationSHA256);
 for(const p of ['/control','/control/request.json']){const s=fs.lstatSync(p);assert.equal(s.uid,1001);assert.equal(s.gid,1001);assert.equal(s.mode&0o777,p==='/control'?0o700:0o600);}
 const {prepareWriterIsolation}=require('/app/deployment/runtime-writer-isolation.cjs');
 const isolation=prepareWriterIsolation({library:'/native/runtime-writer-isolation.so',sha256:request.isolationSHA256,operatorUid:0});
 step='PROTECTED_DEPENDENCY_LOAD';
 const source=`let step='SECURITY_BEFORE_LOAD';(async()=>{const fs=require('fs'),cp=require('child_process'),assert=require('node:assert/strict'),crypto=require('crypto');
 const observe=require('/qualification/native-security-observer.node');const parseStatus=()=>Object.fromEntries(fs.readFileSync('/proc/self/status','utf8').split('\\n').filter(x=>x.includes(':')).map(x=>[x.split(':')[0],x.slice(x.indexOf(':')+1).trim()]));
 const before=parseStatus();assert.equal(process.getuid(),65534);assert.equal(process.getgid(),65534);assert.equal(process.geteuid(),65534);assert.equal(process.getegid(),65534);assert(process.getgroups().every(x=>x===65534));assert(/^0+$/.test(before.CapEff)&&/^0+$/.test(before.CapPrm));assert.equal(before.NoNewPrivs,'1');assert.equal(before.Seccomp,'2');assert.equal(observe(),0);
 let privateDenied=false,privateWriteDenied=false;try{fs.readFileSync('/control/request.json')}catch(e){privateDenied=e.code==='EACCES'}try{const fd=fs.openSync('/control/request.json','r+');fs.closeSync(fd)}catch(e){privateWriteDenied=e.code==='EACCES'}assert(privateDenied);assert(privateWriteDenied);assert.equal(cp.spawnSync('/bin/true').error?.code,'EPERM');
 step='LOAD_COMPLETE_DISTRIBUTION_DEPENDENCIES';const req=require('module').createRequire('/frontend/app/package.json');
 const next=req('next'),react=req('react'),reactDom=req('react-dom'),sharp=req('sharp');
 const pkg=n=>JSON.parse(fs.readFileSync('/frontend/app/node_modules/'+n+'/package.json','utf8'));
 const nextVersion=pkg('next').version,sharpLinux=pkg('@img/sharp-linux-x64').version,libvipsLinux=pkg('@img/sharp-libvips-linux-x64').version;
 assert.equal(process.version,'v22.23.2');assert.equal(process.platform,'linux');assert.equal(process.arch,'x64');assert.equal(typeof next,'function');assert.equal(nextVersion,'16.2.9');assert.equal(react.version,pkg('react').version);assert.equal(reactDom.version,pkg('react-dom').version);assert.equal(sharp.versions.sharp,'0.34.5');assert.equal(sharpLinux,'0.34.5');assert.equal(libvipsLinux,'1.2.4');
 const png=await sharp({create:{width:1,height:1,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer();assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 step='SECURITY_AFTER_LOAD';const after=parseStatus();assert.equal(observe(),0);assert(/^0+$/.test(after.CapEff)&&/^0+$/.test(after.CapPrm));assert.equal(after.NoNewPrivs,'1');assert.equal(after.Seccomp,'2');
 const directoryReadOnly=[];for(const p of ['/frontend','/frontend/app','/frontend/app/.next','/frontend/app/node_modules']){const s=fs.lstatSync(p);assert(s.isDirectory());assert.equal(s.mode&0o777,0o555);let denied=false;try{fs.writeFileSync(p+'/v84-probe-write','x',{flag:'wx'})}catch(e){denied=e.code==='EROFS'||e.code==='EACCES'}assert(denied);directoryReadOnly.push(p);}
 const namespaces=Object.fromEntries(['pid','mnt','net','ipc','uts','user','cgroup'].map(k=>[k,fs.readlinkSync('/proc/self/ns/'+k)]));
 const processStat=fs.readFileSync('/proc/self/stat','utf8');const startTicks=processStat.slice(processStat.lastIndexOf(')')+2).split(' ')[19];
 console.log(JSON.stringify({status:'PASS_PROTECTED_FRONTEND_DEPENDENCIES',uid:process.getuid(),gid:process.getgid(),euid:process.geteuid(),egid:process.getegid(),groups:process.getgroups(),pid:process.pid,startTicks,node:process.version,platform:process.platform,architecture:process.arch,next:nextVersion,react:react.version,reactDom:reactDom.version,sharp:sharp.versions.sharp,sharpLinuxX64:sharpLinux,libvipsLinuxX64:libvipsLinux,libvipsRuntime:sharp.versions.vips,sharpOperation:'ONE_PIXEL_PNG_MEMORY_ONLY',sharpOutputSHA256:crypto.createHash('sha256').update(png).digest('hex'),caps:after.CapEff,permittedCaps:after.CapPrm,noNewPrivs:Number(after.NoNewPrivs),seccomp:Number(after.Seccomp),dumpability:observe(),dumpabilityMethod:'PR_GET_DUMPABLE_SAME_PROCESS_BEFORE_AND_AFTER_LOAD',privateDenied,privateWriteDenied,spawnDenied:true,directoryReadOnly,namespaces,applicationStarted:false}));setTimeout(()=>{},30000);
 })().catch(e=>{console.log(JSON.stringify({status:'FAIL_FRONTEND_CHILD',step,errorCode:/^[A-Z_0-9]{1,80}$/.test(e.code||'')?e.code:null,errorClass:['Error','TypeError','RangeError','SyntaxError','ReferenceError','AssertionError'].includes(e.name)?e.name:'Error',rawErrorRetained:false,applicationStarted:false}));process.exitCode=1;});`;
 child=cp.spawn('/frontend/runtime/bin/node',['-e',source],{uid:65534,gid:65534,cwd:'/frontend/app',env:{PATH:'/usr/bin:/bin',NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',HOME:'/nonexistent',...isolation.environment},stdio:['ignore','pipe','pipe']});
 observation=observeChild(child,{observationDeadlineMs:20000});const row=await observation.observation;
 if(row.status!=='PASS_PROTECTED_FRONTEND_DEPENDENCIES'){failure=row;throw Error('FRONTEND_CHILD_LOAD_FAILED');}assert.equal(row.pid,child.pid);assert.equal(row.dumpability,0);
 const processStat=fs.readFileSync('/proc/'+child.pid+'/stat','utf8');assert.equal(row.startTicks,processStat.slice(processStat.lastIndexOf(')')+2).split(' ')[19]);
 const native=isolation.verify(child.pid);assert.deepEqual(row.namespaces,ns(child.pid));assert.deepEqual(row.namespaces,ns());
 const threads=fs.readdirSync('/proc/'+child.pid+'/task').map(t=>{const s=status(child.pid+'/task/'+t);return {tid:Number(t),seccomp:Number(s.Seccomp),seccompFilters:Number(s.Seccomp_filters),nnp:Number(s.NoNewPrivs),caps:s.CapEff};});assert(threads.length>0);assert(threads.every(s=>s.seccomp===2&&s.seccompFilters===native.seccompFilters&&s.nnp===1&&/^0+$/.test(s.caps)));
 step='PRIVATE_EXCHANGE';const response={schema:'work8-v84-frontend-private-exchange-v1',role:request.role,archiveSHA256:request.archiveSHA256,nonceSHA256:crypto.createHash('sha256').update(request.nonce).digest('hex')};const pending='/control/response.pending';fs.writeFileSync(pending,JSON.stringify(response),{flag:'wx',mode:0o600});fs.chownSync(pending,1001,1001);const fd=fs.openSync(pending,'r');fs.fsyncSync(fd);fs.closeSync(fd);fs.renameSync(pending,'/control/response.json');const dir=fs.openSync('/control','r');fs.fsyncSync(dir);fs.closeSync(dir);
 const termination=await observation.finish();assert(expectedTermination(termination));assert.equal(observation.diagnostic().bytes,0);
 console.log(JSON.stringify({schema:'work8-v84-frontend-protected-loading-v1',status:'PASS_FULL_FRONTEND_PROTECTED_LOADING',role:request.role,archiveSHA256:request.archiveSHA256,sourceCommit:request.sourceCommit,sourceTree:request.sourceTree,operator:{uid:0,gid:0,euid:0,egid:0,capEff:op.CapEff,capPrm:op.CapPrm,noNewPrivs:1},writer:row,operatorNamespaces:ns(),nativeAttestation:native,threadCount:threads.length,threadObservations:threads,seccompTSYNC:true,privateExchange:true,observerSHA256:request.observerSHA256,nodeSHA256:request.nodeSHA256,childTermination:termination,childStderr:observation.diagnostic(),applicationStarted:false}));
})().catch(async e=>{if(observation)await observation.finish();console.log(JSON.stringify({schema:'work8-v84-frontend-protected-loading-v1',status:'FAIL',step,errorCode:/^[A-Z_0-9]{1,80}$/.test(e.code||'')?e.code:null,errorClass:['Error','TypeError','RangeError','SyntaxError','ReferenceError','AssertionError'].includes(e.name)?e.name:'Error',childFailure:failure||(observation?observation.firstFailure():null),rawErrorRetained:false,applicationStarted:false}));process.exitCode=1;});
'''


def qualify_frontends(prepared, cp, runner, native_result):
    prepared = production_root(prepared); validate_pins(cp); root = private(prepared/'frontend-qualification')
    need(native_result.get('status') == 'CURRENT_NATIVE_CAPABILITY_OBSERVED_NO_APPLICATION_AUTHORITY' and native_result.get('applicationExecutionAuthorized') is False, 'FRONTEND_PRIOR_NATIVE_QUALIFICATION_REQUIRED')
    identity = read(prepared/'runner-identity.json'); extraction = read(prepared/'frontend-extraction.json')
    provenance = read(prepared/'runtime-image-provenance.json')
    native = read(prepared/'native-qualification.json')
    need(native_result.get('sessionId') == identity['sessionId'] and native_result.get('nativeQualificationSHA256') == sha(prepared/'native-qualification.json'), 'FRONTEND_NATIVE_RECEIPT_BINDING')
    runner.validate_current_executor_continuity(provenance, identity)
    runner.validate_executor_security(native, identity, provenance)
    runner.validate_qualification_evidence(native, identity, read(prepared/'runtime-evidence/guard-controls.json'), read(prepared/'runtime-evidence/dumpability-observer-build.json'), sha(runner.HERE/'github_contract.py'))
    engine_id = json.loads(runner.run(prepared,['docker','info','--format','{{json .ID}}'],seconds=10))
    need(engine_id == native['dockerEngineId'], 'FRONTEND_DOCKER_ENGINE_CHANGED')
    need(set(extraction['roles']) == set(ROLES), 'FRONTEND_BOTH_EXTRACTION_RECEIPTS_REQUIRED')
    name = 'work8-v65-a5-'+identity['runId']
    need(re.fullmatch(r'work8-v65-a5-[1-9][0-9]{0,19}', name), 'FRONTEND_CURRENT_RUN_REQUIRED')
    observer = prepared/'runtime/native-security-observer.node'; build = read(prepared/'runtime/native-observer-build.json', 32768)
    need(sha(observer) == build['binarySHA256'], 'FRONTEND_OBSERVER_IDENTITY_CHANGED')
    probe = root/'probe.cjs'; need(not probe.exists(), 'FRONTEND_PROBE_ALREADY_ATTEMPTED')
    probe.write_text(PROBE); probe.chmod(0o444)
    roles = {}
    for role in ROLES:
        pin = cp.FRONTENDS[role]; package = root/role
        runner.validate_current_executor_continuity(provenance, identity)
        need(json.loads(runner.run(prepared,['docker','info','--format','{{json .ID}}'],seconds=10)) == engine_id, 'FRONTEND_DOCKER_ENGINE_CHANGED')
        audit_before = audit_extracted(prepared/'artifacts'/pin['file'], package, expected_uid=1001, expected_gid=1001)
        need(audit_before['inventorySHA256'] == extraction['roles'][role]['inventorySHA256'] and audit_before['archiveSHA256'] == pin['sha256'], 'FRONTEND_PRELOAD_INVENTORY_CHANGED')
        control = root/(role+'-control'); control.mkdir(mode=0o700); private(control)
        nonce = secrets.token_hex(32)
        request = {'role':role,'nonce':nonce,'archiveSHA256':pin['sha256'],'sourceCommit':pin['commit'],'sourceTree':pin['tree'],'nodeSHA256':NODE_SHA,'isolationSHA256':ISOLATION_SHA,'observerSHA256':build['binarySHA256']}
        atomic(control/'request.json', request)
        cname = name+'-frontend-'+role; primary = None; cleanup = []
        try:
            options = ['--name',cname,'--label','work8.native='+name,'--pull','never','--network','none','--read-only','--user','0:0','--cap-drop','ALL','--memory','768m','--cpus','1','--pids-limit','64','--security-opt','no-new-privileges']
            for cap in CAPABILITIES: options += ['--cap-add',cap]
            args = ['docker','run',*options,'--mount','type=bind,src='+str(package)+',dst=/frontend,readonly','--mount','type=bind,src='+str(prepared/'runtime')+',dst=/qualification,readonly','--mount','type=bind,src='+str(probe)+',dst=/frontend-probe.cjs,readonly','--mount','type=bind,src='+str(control)+',dst=/control','--entrypoint','node',cp.BACKEND['image'],'/frontend-probe.cjs']
            raw = runner.run(prepared,args,seconds=35,maximum=32768,expected=(0,1))
            lines = raw.decode().splitlines(); need(len(lines) == 1, 'FRONTEND_SINGLE_LOADING_RECEIPT_REQUIRED')
            row = json.loads(lines[0]); atomic(prepared/('frontend-'+role+'-loading.json'), row)
            need(row.get('status') == 'PASS_FULL_FRONTEND_PROTECTED_LOADING', first_cause(row))
            need(row.get('role') == role and row.get('archiveSHA256') == pin['sha256'] and row.get('sourceCommit') == pin['commit'] and row.get('sourceTree') == pin['tree'] and row.get('applicationStarted') is False, 'FRONTEND_LOADING_RECEIPT_BINDING')
            validate_loading_observation(row, role, pin, build['binarySHA256'])
            response = read(control/'response.json', 16384)
            response_stat = (control/'response.json').lstat()
            need(response_stat.st_uid == response_stat.st_gid == 1001 and stat.S_IMODE(response_stat.st_mode) == 0o600, 'FRONTEND_PRIVATE_RESPONSE_PERMISSIONS')
            need(response == {'schema':'work8-v84-frontend-private-exchange-v1','role':role,'archiveSHA256':pin['sha256'],'nonceSHA256':hashlib.sha256(nonce.encode()).hexdigest()}, 'FRONTEND_PRIVATE_EXCHANGE_READBACK_FAILED')
            d = json.loads(runner.run(prepared,['docker','inspect',cname],seconds=10))[0]; h = d['HostConfig']
            need(d['State']['ExitCode'] == 0 and d['Image'] == cp.BACKEND['image'] and d['Config']['User'] == '0:0' and h['ReadonlyRootfs'] and not h['Privileged'] and h['NetworkMode'] == 'none' and runner.exact_capabilities(h['CapAdd']) and h['CapDrop'] == ['ALL'] and h['PidsLimit'] == 64 and h['Memory'] == 768*1024**2 and not h['PortBindings'], 'FRONTEND_CONTAINER_CONFIG_CHANGED')
            need(not any(v.startswith(('GH_TOKEN=','GITHUB_TOKEN=','ACTIONS_RUNTIME_TOKEN=')) for v in d['Config']['Env']), 'FRONTEND_PROVIDER_CREDENTIAL_REFUSED')
            actual = {(x['Source'],x['Destination'],x['RW']) for x in d['Mounts']}
            need(actual == {(str(package),'/frontend',False),(str(prepared/'runtime'),'/qualification',False),(str(probe),'/frontend-probe.cjs',False),(str(control),'/control',True)}, 'FRONTEND_EXACT_MOUNTS_REQUIRED')
            need(all(x['Type'] == 'bind' and x['Propagation'] == 'rprivate' for x in d['Mounts']), 'FRONTEND_PRIVATE_BIND_PROPAGATION_REQUIRED')
            need(all(h.get(k, '') == '' for k in ('PidMode','UTSMode','UsernsMode')) and h.get('IpcMode') == h.get('CgroupnsMode') == 'private', 'FRONTEND_NAMESPACE_CONFIG_CHANGED')
            need(row['writer']['namespaces'] == row['operatorNamespaces'] and all(row['operatorNamespaces'][key] != provenance['actualEnvironment']['hostNamespaces'][key] for key in ('pid','mnt','net')), 'FRONTEND_HOST_NAMESPACE_ISOLATION_REQUIRED')
            need(any('no-new-privileges' in x for x in h['SecurityOpt']), 'FRONTEND_NO_NEW_PRIVILEGES_CONFIG_REQUIRED')
            runner.validate_current_executor_continuity(provenance, identity)
            need(json.loads(runner.run(prepared,['docker','info','--format','{{json .ID}}'],seconds=10)) == engine_id, 'FRONTEND_DOCKER_ENGINE_CHANGED')
            audit_after = audit_extracted(prepared/'artifacts'/pin['file'], package, expected_uid=1001, expected_gid=1001)
            need(audit_after == audit_before, 'FRONTEND_DEPENDENCY_LOAD_CHANGED_PACKAGE')
            roles[role] = {'status':'PASS_COMPLETE_FRONTEND_EXTRACTION_AND_PROTECTED_LOADING','archiveSHA256':pin['sha256'],'sourceCommit':pin['commit'],'sourceTree':pin['tree'],'inventorySHA256':audit_after['inventorySHA256'],'loadingReceiptSHA256':sha(prepared/('frontend-'+role+'-loading.json')),'extractedPackageUnchanged':True,'dockerEngineId':engine_id,'containerObservation':container_observation(d),'privateResponseObservation':{'uid':response_stat.st_uid,'gid':response_stat.st_gid,'mode':stat.S_IMODE(response_stat.st_mode),'nlink':response_stat.st_nlink,'bytes':response_stat.st_size,'receiptSHA256':sha(control/'response.json'),'nonceExported':False},'applicationStarted':False}
        except BaseException as exc:
            primary = exc
            runner.preserve_first_failure(prepared,'frontend-'+role,runner.Refusal(str(exc)) if isinstance(exc,Refusal) else exc)
            raise
        finally:
            try: runner.run(prepared,['docker','rm','-fv',cname],seconds=15)
            except BaseException as exc: cleanup.append({'scope':'container','errorClass':type(exc).__name__})
            try:
                private(control); need(all(not p.is_symlink() for p in control.rglob('*')), 'FRONTEND_CONTROL_CLEANUP_SYMLINK'); shutil.rmtree(control)
            except BaseException as exc: cleanup.append({'scope':'private-exchange','errorClass':type(exc).__name__})
            atomic(prepared/('frontend-'+role+'-cleanup.json'), {'schema':'work8-v84-frontend-role-cleanup-v1','status':'FAIL' if cleanup else 'PASS','errors':cleanup,'primaryFailurePreserved':primary is not None,'applicationStarted':False})
            if cleanup and primary is None: raise Refusal('FRONTEND_ROLE_CLEANUP_FAILED')
    result = {'schema':'work8-v84-complete-frontends-qualification-v1','status':'PASS_BOTH_COMPLETE_FRONTENDS_CURRENT_RUNNER','sessionId':identity['sessionId'],'workflowCommit':identity['workflowCommit'],'nativeQualificationSHA256':sha(prepared/'native-qualification.json'),'runnerIdentitySHA256':sha(prepared/'runner-identity.json'),'runtimeImageProvenanceSHA256':sha(prepared/'runtime-image-provenance.json'),'roles':roles,'applicationStarted':False,'wholeRowsAccepted':[],'Q05EquivalenceClaimed':False}
    atomic(prepared/'frontend-qualification.json', result)
    return result


def container_observation(d):
    """Retain actual non-secret operands for independent outside adjudication."""
    h = d['HostConfig']
    return {'image':d['Image'],'user':d['Config']['User'],'entrypoint':d['Config']['Entrypoint'],'exitCode':d['State']['ExitCode'],'privileged':h['Privileged'],'readonlyRootfs':h['ReadonlyRootfs'],'networkMode':h['NetworkMode'],'pidMode':h['PidMode'],'ipcMode':h['IpcMode'],'utsMode':h['UTSMode'],'usernsMode':h['UsernsMode'],'cgroupnsMode':h['CgroupnsMode'],'memory':h['Memory'],'pidsLimit':h['PidsLimit'],'securityOpt':h['SecurityOpt'],'capAdd':h['CapAdd'],'capDrop':h['CapDrop'],'publishedPorts':h['PortBindings'] or {},'providerCredentialsExcluded':not any(v.startswith(('GH_TOKEN=','GITHUB_TOKEN=','ACTIONS_RUNTIME_TOKEN=')) for v in d['Config']['Env']),'mounts':[{'type':m['Type'],'source':m['Source'],'destination':m['Destination'],'rw':m['RW'],'propagation':m['Propagation']} for m in d['Mounts']]}


def validate_loading_observation(row, role, pin, observer_sha):
    """Independent host-side adjudication of the positive child observation."""
    need(row.get('schema') == 'work8-v84-frontend-protected-loading-v1' and row.get('status') == 'PASS_FULL_FRONTEND_PROTECTED_LOADING', 'FRONTEND_LOADING_SCHEMA_REQUIRED')
    need(row.get('role') == role and row.get('archiveSHA256') == pin['sha256'] and row.get('sourceCommit') == pin['commit'] and row.get('sourceTree') == pin['tree'], 'FRONTEND_LOADING_RECEIPT_BINDING')
    op = row.get('operator', {}); writer = row.get('writer', {})
    need(all(op.get(k) == 0 for k in ('uid','gid','euid','egid')) and int(op.get('capEff','0'),16) == int(op.get('capPrm','0'),16) == 0x800e3 and op.get('noNewPrivs') == 1, 'FRONTEND_OPERATOR_SECURITY_REQUIRED')
    need(all(writer.get(k) == 65534 for k in ('uid','gid','euid','egid')) and isinstance(writer.get('groups'),list) and all(type(x) is int and x == 65534 for x in writer['groups']), 'FRONTEND_WRITER_PRINCIPAL_REQUIRED')
    need(writer.get('status') == 'PASS_PROTECTED_FRONTEND_DEPENDENCIES' and writer.get('node') == 'v22.23.2' and writer.get('platform') == 'linux' and writer.get('architecture') == 'x64', 'FRONTEND_ACTUAL_RUNTIME_REQUIRED')
    need(writer.get('next') == '16.2.9' and writer.get('sharp') == writer.get('sharpLinuxX64') == '0.34.5' and writer.get('libvipsLinuxX64') == '1.2.4' and writer.get('sharpOperation') == 'ONE_PIXEL_PNG_MEMORY_ONLY', 'FRONTEND_ACTUAL_DEPENDENCIES_REQUIRED')
    need(int(writer.get('caps','1'),16) == int(writer.get('permittedCaps','1'),16) == 0 and writer.get('noNewPrivs') == 1 and writer.get('seccomp') == 2 and writer.get('dumpability') == 0 and writer.get('dumpabilityMethod') == 'PR_GET_DUMPABLE_SAME_PROCESS_BEFORE_AND_AFTER_LOAD', 'FRONTEND_WRITER_SECURITY_REQUIRED')
    need(writer.get('privateDenied') is True and writer.get('privateWriteDenied') is True and writer.get('spawnDenied') is True and row.get('privateExchange') is True and row.get('seccompTSYNC') is True and type(row.get('threadCount')) is int and row['threadCount'] > 0, 'FRONTEND_PROCESS_ISOLATION_REQUIRED')
    att = row.get('nativeAttestation',{})
    need(att.get('nativeSha256') == ISOLATION_SHA and att.get('noNewPrivileges') is True and att.get('processCreation') == 'DENIED_EXCEPT_SAME_TGID_THREADS' and att.get('processGroupEscape') == 'DENIED' and type(att.get('seccompFilters')) is int and att['seccompFilters'] > 0, 'FRONTEND_PINNED_NATIVE_FILTER_REQUIRED')
    threads = row.get('threadObservations',[])
    need(len(threads) == row['threadCount'] <= 64 and len({x['tid'] for x in threads}) == len(threads) and writer.get('pid') in {x['tid'] for x in threads} and all(type(x['tid']) is int and x['tid'] > 0 and x['seccomp'] == 2 and x['seccompFilters'] == row['nativeAttestation']['seccompFilters'] and x['nnp'] == 1 and int(x['caps'],16) == 0 for x in threads), 'FRONTEND_THREAD_SECURITY_CENSUS_REQUIRED')
    need(type(writer.get('pid')) is int and writer['pid'] > 0 and re.fullmatch('[1-9][0-9]*', writer.get('startTicks','')) and set(writer.get('namespaces',{})) == {'pid','mnt','net','ipc','uts','user','cgroup'} and writer['namespaces'] == row.get('operatorNamespaces') and all(re.fullmatch(r'[a-z]+:\[[0-9]+\]',x) for x in writer['namespaces'].values()), 'FRONTEND_PROCESS_IDENTITY_REQUIRED')
    need(row.get('observerSHA256') == observer_sha and row.get('nodeSHA256') == NODE_SHA and row.get('applicationStarted') is False and writer.get('applicationStarted') is False, 'FRONTEND_OBSERVATION_IDENTITY_REQUIRED')
    termination = row.get('childTermination', {})
    need(termination.get('closed') is True and termination.get('forcedKill') is False and termination.get('requestedSignal') == termination.get('signal') == 'SIGTERM' and termination.get('exitCode') is None and termination.get('outputViolation') is None , 'FRONTEND_CHILD_CLEAN_TERMINATION_REQUIRED')
    stderr = row.get('childStderr',{})
    need(type(stderr.get('bytes')) is int and stderr['bytes'] == 0 and stderr.get('sha256') == hashlib.sha256(b'').hexdigest() and stderr.get('streamComplete') is True and stderr.get('rawOutputRetained') is False, 'FRONTEND_COMPLETE_SANITIZED_DIAGNOSTICS_REQUIRED')
    return True


def first_cause(row):
    child = row.get('childFailure') or {}
    code = child.get('errorCode') or row.get('errorCode')
    if isinstance(code,str) and re.fullmatch('[A-Z_0-9]{1,80}',code): return code
    step = child.get('step') or child.get('stage') or row.get('step')
    if step in {'SECURITY_BEFORE_LOAD','LOAD_COMPLETE_DISTRIBUTION_DEPENDENCIES','SECURITY_AFTER_LOAD','OPERATOR','PROTECTED_DEPENDENCY_LOAD','PRIVATE_EXCHANGE'}: return 'FRONTEND_'+step
    return 'FRONTEND_PROTECTED_DEPENDENCY_LOADING_FAILED'


def cleanup_frontends(prepared):
    prepared = production_root(prepared); root = prepared/'frontend-qualification'
    if not root.exists() and not root.is_symlink(): return {'status':'NO_FRONTEND_SCOPE'}
    private(root)
    paths = [root,*root.rglob('*')]
    need(len(paths) <= MAX_FILES*6+16, 'FRONTEND_CLEANUP_INVENTORY_BOUND')
    for p in paths:
        s = p.lstat()
        need(s.st_uid == s.st_gid == 1001 and (stat.S_ISDIR(s.st_mode) or stat.S_ISREG(s.st_mode)) and (not stat.S_ISREG(s.st_mode) or s.st_nlink == 1), 'FRONTEND_CLEANUP_SCOPE_CHANGED')
    for p in paths:
        if p.is_dir(): p.chmod(0o700)
    shutil.rmtree(root)
    need(not root.exists(), 'FRONTEND_CLEANUP_INCOMPLETE')
    receipt = {'schema':'work8-v84-frontend-scope-cleanup-v1','status':'PASS_SCOPED_EXTRACTIONS_REMOVED','remainingFrontendScope':False,'applicationStarted':False}
    atomic(prepared/'frontend-scope-cleanup.json',receipt)
    return receipt
