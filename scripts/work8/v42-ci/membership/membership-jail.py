#!/usr/bin/env python3
"""Exact original membership fixture in an empty, bounded synthetic jail.

Outer invocation must be the reviewed sudo/unshare command. No fixture code is
executed with host filesystem visibility. This root setup helper copies only a
closed source manifest and runner executable dependency closures into a jail.
"""
import ctypes, hashlib, json, os, pathlib, re, select, shutil, socket, subprocess, sys, tempfile, time

SOURCE='94aa919c7c39c4c9bf2c14b636232da028dba72d'
TREE='ad538f63dc1e2dfe392fea1cacb565d361e9a9e2'
INPUTS={'deployment/runtime-membership-controller.hosted.test.cjs','deployment/runtime-membership-controller.cjs','deployment/runtime-membership-bootstrap.mjs','deployment/fixtures/runtime-membership-writer.mjs','deployment/fixtures/runtime-membership-redis.cjs','deployment/fixtures/runtime-membership-runner.cjs','deployment/runtime-generation.cjs','deployment/runtime-revision.cjs'}
REQUIRED=['identitySeparation','journalProtection','durableAdmission','currentPriorCensus','staleGenerationRefusal','competingAdmission','crashRestart','captureExclusion','incompleteMembershipRefusal','scopeBinding','secretFreeReadback']
CAPS={0,1,3,5,6,7} # CHOWN,DAC_OVERRIDE,FOWNER,KILL,SETGID,SETUID only.
MAX_LOG=2*1024*1024
def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def run(args,**kw): return subprocess.run(args,check=True,timeout=15,**kw)
def check(condition,reason):
    if not condition: raise RuntimeError(reason)

def main():
    check(len(sys.argv)==5,'ARGUMENTS')
    source=pathlib.Path(sys.argv[1]).resolve();out=pathlib.Path(sys.argv[2]).resolve();node=pathlib.Path(sys.argv[3]).resolve();manifest_path=pathlib.Path(sys.argv[4]).resolve()
    check(os.getuid()==0 and os.getpid()==1,'PRIVATE_PID_NAMESPACE_ROOT_REQUIRED')
    check(not any(k in os.environ for k in ['GITHUB_TOKEN','GH_TOKEN','ACTIONS_RUNTIME_TOKEN','SSH_AUTH_SOCK','NODE_OPTIONS','LD_PRELOAD']),'HOST_AUTH_ENV_REFUSED')
    check(subprocess.check_output([str(node),'--version'],text=True).strip()=='v22.23.2','EXACT_NODE_REQUIRED')
    check(subprocess.check_output(['/usr/bin/git','-c','safe.directory='+str(source),'-C',str(source),'rev-parse','HEAD'],text=True).strip()==SOURCE,'SOURCE_COMMIT_MISMATCH')
    check(subprocess.check_output(['/usr/bin/git','-c','safe.directory='+str(source),'-C',str(source),'rev-parse','HEAD^{tree}'],text=True).strip()==TREE,'SOURCE_TREE_MISMATCH')
    check(not subprocess.check_output(['/usr/bin/git','-c','safe.directory='+str(source),'-C',str(source),'diff','--name-only','HEAD'],text=True).strip(),'SOURCE_DIRTY')
    manifest=json.loads(manifest_path.read_text());check(manifest['sourceCommit']==SOURCE and manifest['sourceTree']==TREE,'MANIFEST_BINDING')
    check(manifest['schema']=='work8-isolated-membership-inputs-v1' and set(manifest)=={'schema','sourceCommit','sourceTree','files'},'MANIFEST_SCHEMA')
    check(len(manifest['files'])==len(INPUTS) and {x['path'] for x in manifest['files']}==INPUTS,'MANIFEST_EXACT_PATH_SET')
    for entry in manifest['files']:
        check(set(entry)=={'path','sha256','gitBlob','bytes'},'MANIFEST_ENTRY_SCHEMA')
        check(re.fullmatch('[a-f0-9]{64}',entry['sha256']) and re.fullmatch('[a-f0-9]{40}',entry['gitBlob']) and isinstance(entry['bytes'],int) and 0<entry['bytes']<100000,'MANIFEST_ENTRY_VALUES')
    check(out.is_dir() and not out.is_symlink(),'OUTPUT_DIRECTORY_REQUIRED')
    check(not list(out.iterdir()),'OUTPUT_MUST_BE_EMPTY')
    owner=out.stat().st_uid;group=out.stat().st_gid
    run(['/usr/bin/mount','--make-rprivate','/'])
    run(['/usr/sbin/ip','link','set','lo','up'])
    links=json.loads(subprocess.check_output(['/usr/sbin/ip','-j','link'],text=True));check([x['ifname'] for x in links]==['lo'],'NONPRIVATE_NETWORK')
    check(not json.loads(subprocess.check_output(['/usr/sbin/ip','-j','route','show','table','main'],text=True)),'NETWORK_ROUTE_PRESENT')
    check(not json.loads(subprocess.check_output(['/usr/sbin/ip','-j','-6','route','show','table','main'],text=True)),'IPV6_ROUTE_PRESENT')
    # Do not copy checkout metadata, HOME, workspace mounts, sockets, credentials,
    # runtime stores, package caches, or provider settings into the jail.
    jail=pathlib.Path(tempfile.mkdtemp(prefix='work8-membership-jail-'));os.chmod(jail,0o755)
    run(['/usr/bin/mount','-t','tmpfs','-o','size=192m,mode=755,nosuid,nodev','tmpfs',str(jail)])
    binary_manifest=[];source_manifest=[]
    for name in ['opt/exam','usr/bin','dev','proc','tmp','work8-exam','evidence','etc']:(jail/name).mkdir(parents=True,exist_ok=True)
    os.chmod(jail/'tmp',0o1777)
    def copy_binary(origin,target):
        origin=pathlib.Path(origin).resolve();target=jail/target.lstrip('/');target.parent.mkdir(parents=True,exist_ok=True)
        check(origin.is_file(),'EXECUTABLE_NOT_REGULAR');shutil.copyfile(origin,target);os.chmod(target,0o555);check(sha(origin)==sha(target),'EXECUTABLE_COPY_MISMATCH')
        binary_manifest.append({'path':'/'+str(target.relative_to(jail)),'sha256':sha(target),'source':str(origin)})
        raw=subprocess.check_output(['/usr/bin/ldd',str(origin)],text=True)
        check('not found' not in raw,'SHARED_LIBRARY_MISSING')
        for line in raw.splitlines():
            match=re.search(r'(?:=>\s*)?(/[^\s]+)\s+\(',line)
            if not match:
                check('linux-vdso' in line or not line.strip(),'UNRECOGNIZED_LDD_LINE');continue
            library=pathlib.Path(match.group(1));dst=jail/str(library).lstrip('/');dst.parent.mkdir(parents=True,exist_ok=True)
            if not dst.exists():
                shutil.copyfile(library.resolve(),dst);os.chmod(dst,0o555);check(sha(library.resolve())==sha(dst),'LIBRARY_COPY_MISMATCH')
                binary_manifest.append({'path':'/'+str(dst.relative_to(jail)),'sha256':sha(dst),'source':str(library.resolve())})
    copy_binary(node,'/usr/bin/node');copy_binary('/usr/bin/redis-server','/usr/bin/redis-server')
    for entry in manifest['files']:
        p=source/entry['path'];check(p.is_file() and not p.is_symlink() and sha(p)==entry['sha256'],'SOURCE_BYTES_MISMATCH')
        check(p.stat().st_size==entry['bytes'] and hashlib.sha1(b'blob '+str(entry['bytes']).encode()+b'\0'+p.read_bytes()).hexdigest()==entry['gitBlob'],'SOURCE_GIT_BLOB_MISMATCH')
        dst=jail/'opt/exam'/entry['path'];dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dst);os.chmod(dst,0o444);check(sha(dst)==entry['sha256'],'SOURCE_COPY_MISMATCH')
        source_manifest.append(entry)
    # Node and Redis receive only private proc and null; no host /proc or /dev
    # directory is mounted. proc presents this new PID namespace only.
    run(['/usr/bin/mount','-t','proc','-o','ro,nosuid,nodev,noexec','proc',str(jail/'proc')])
    (jail/'dev/null').touch();run(['/usr/bin/mount','--bind','/dev/null',str(jail/'dev/null')])
    (jail/'etc/hosts').write_text('127.0.0.1 localhost\n')
    # Prohibit source mutation even by the jailed trusted operator.
    run(['/usr/bin/mount','--bind',str(jail/'opt/exam'),str(jail/'opt/exam')]);run(['/usr/bin/mount','-o','remount,bind,ro',str(jail/'opt/exam')])
    libc=ctypes.CDLL(None,use_errno=True)
    check(libc.prctl(4,0,0,0,0)==0 and libc.prctl(3,0,0,0,0)==0,'SETUP_HELPER_NON_DUMPABLE_REQUIRED')
    class Header(ctypes.Structure):_fields_=[('version',ctypes.c_uint32),('pid',ctypes.c_int)]
    class Data(ctypes.Structure):_fields_=[('effective',ctypes.c_uint32),('permitted',ctypes.c_uint32),('inheritable',ctypes.c_uint32)]
    def enter():
        os.chdir(jail);os.chroot('.');os.chdir('/opt/exam');os.setgroups([])
        # Root remains the distinct controller identity. After chroot it loses
        # namespace/mount/chroot/admin/ptrace privileges and cannot escape jail.
        for cap in range(41):
            if cap not in CAPS and libc.prctl(24,cap,0,0,0)!=0:os._exit(126)
        mask=sum(1<<c for c in CAPS);header=Header(0x20080522,0);data=(Data*2)(Data(mask,mask,0),Data(0,0,0))
        if libc.capset(ctypes.byref(header),data)!=0 or libc.prctl(38,1,0,0,0)!=0:os._exit(126)
    env={'PATH':'/usr/bin','LANG':'C.UTF-8','TZ':'UTC','WORK8_SOURCE_SHA':SOURCE,'WORK8_MEMBERSHIP_REDIS_URL':'redis://127.0.0.1:6379/0','WORK8_EVIDENCE_DIR':'/evidence'}
    redis=subprocess.Popen(['/usr/bin/redis-server','--bind','127.0.0.1','--port','6379','--save','','--appendonly','no','--dir','/work8-exam','--protected-mode','yes'],env=env,preexec_fn=enter,stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    test=None;output=bytearray();output_printed=False
    try:
        deadline=time.monotonic()+5
        while True:
            check(redis.poll() is None,'REDIS_EXITED')
            try:
                with socket.create_connection(('127.0.0.1',6379),.1) as s:s.sendall(b'*1\r\n$4\r\nPING\r\n');check(s.recv(32)==b'+PONG\r\n','REDIS_NOT_READY')
                break
            except (ConnectionError,TimeoutError):
                check(time.monotonic()<deadline,'REDIS_START_DEADLINE');time.sleep(.05)
        probe=r'''const fs=require('node:fs'),assert=require('node:assert/strict');assert.equal(process.getuid(),0);const s=fs.readFileSync('/proc/self/status','utf8');assert.match(s,/^NoNewPrivs:\s+1$/m);assert.match(s,/^CapEff:\s+00000000000000eb$/m);for(const p of ['/root','/home','/run','/var/run/docker.sock'])assert.equal(fs.existsSync(p),false,p);assert.throws(()=>fs.statSync('/proc/1/root'),{code:'EACCES'});assert.throws(()=>fs.openSync('/opt/exam/.write-probe','wx'),{code:'EROFS'});console.log('JAIL_BOUNDARY_PROBE_PASS');'''
        verified=subprocess.run(['/usr/bin/node','-e',probe],env=env,preexec_fn=enter,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=5)
        check(verified.returncode==0 and verified.stdout==b'JAIL_BOUNDARY_PROBE_PASS\n','JAIL_BOUNDARY_PROBE_FAILED')
        copied_bytes=sum((jail/x['path'].lstrip('/')).stat().st_size for x in binary_manifest)+sum(x['bytes'] for x in source_manifest)
        check(copied_bytes<192*1024*1024,'JAIL_COPY_BUDGET')
        print('WORK8_CI_ISOLATED_ASSERTION_ENTERED',flush=True)
        args=['/usr/bin/node','--test','--test-reporter=tap','deployment/runtime-membership-controller.hosted.test.cjs']
        test=subprocess.Popen(args,env=env,preexec_fn=enter,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
        # Exercise the exact original assertive fixture; enforce finite output
        # and a stronger 90-second outer bound around its original45s test.
        deadline=time.monotonic()+90
        while True:
            check(time.monotonic()<deadline,'TEST_DEADLINE')
            ready,_,_=select.select([test.stdout],[],[],.2)
            if ready:
                chunk=os.read(test.stdout.fileno(),65536)
                if not chunk:break
                output.extend(chunk);check(len(output)<=MAX_LOG,'OUTPUT_LIMIT')
            elif test.poll() is not None:break
        code=test.wait(timeout=5);log=output.decode('utf8','strict');sys.stdout.write(log);output_printed=True
        check(code==0,'ORIGINAL_MEMBERSHIP_ASSERTION_FAILED')
        for label,expected in [('tests',1),('pass',1),('fail',0),('cancelled',0),('skipped',0),('todo',0)]:
            match=re.search(r'^# '+label+r' (\d+)$',log,re.M);check(match and int(match.group(1))==expected,'TAP_GATE_'+label)
        evidence=jail/'evidence/journal-examination.json';check(evidence.is_file() and not evidence.is_symlink() and evidence.stat().st_nlink==1 and evidence.stat().st_size<65536,'EVIDENCE_FILE')
        receipt=json.loads(evidence.read_text());check(receipt['source']==SOURCE and receipt['node']=='22.23.2' and receipt['operatorUid']==0 and receipt['runtimeUids']==[65534],'EVIDENCE_IDENTITIES')
        check(receipt['externalEffects']==0 and receipt['acceptedRows']==[] and receipt['productionGraphIntegrated'] is False and receipt['operatingRecoveryCertified'] is False,'EVIDENCE_SCOPE')
        check(all(receipt['assertions'].get(k) is True for k in REQUIRED),'EVIDENCE_ASSERTIONS')
        check({x.name for x in (jail/'evidence').iterdir()}=={'journal-examination.json'},'EVIDENCE_ALLOWLIST')
        (out/'journal-examination.json').write_bytes(evidence.read_bytes())
        (out/'jail-proof.json').write_text(json.dumps({'schema':'work8-membership-jail-proof-v1','source':SOURCE,'tree':TREE,'node':'22.23.2','jailBoundaryProbe':'PASS','copiedBytes':copied_bytes,'privatePid':True,'privateMount':True,'privateNetwork':True,'networkInterfaces':['lo'],'externalNetworkRoutes':[],'chrootHostMounts':['/dev/null only'],'operatorCapabilities':sorted(CAPS),'noNewPrivileges':True,'sourceReadOnlyMount':True,'copiedSources':source_manifest,'runtimeBinariesAndLibraries':binary_manifest,'testExit':code,'testLogSHA256':hashlib.sha256(output).hexdigest(),'productionOperations':0,'acceptedRows':[]},indent=2)+'\n')
        for file in out.iterdir():os.chown(file,owner,group);os.chmod(file,0o600)
    finally:
        if output and not output_printed:sys.stdout.write(output[:MAX_LOG].decode('utf8','replace'))
        if test and test.poll() is None:test.kill()
        if redis.poll() is None:redis.terminate()
        try:redis.wait(timeout=3)
        except subprocess.TimeoutExpired:redis.kill();redis.wait(timeout=2)
    # Exiting namespace PID1 kills any surviving synthetic descendants and
    # destroys all namespace mounts. The host sees an empty disposable mountpoint.

if __name__=='__main__':
    try:main()
    except Exception as exc:
        print(type(exc).__name__+':'+str(exc),file=sys.stderr);sys.exit(1)
