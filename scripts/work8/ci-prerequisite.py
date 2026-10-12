#!/usr/bin/env python3
"""Host-side bounded prerequisite controller; never launches a 45-minute run.

Docker daemon is the external containment boundary. The controller and evidence
export run on the existing CI runner, outside all tested container processes.
"""
import datetime, hashlib, json, os, pathlib, shutil, sqlite3, subprocess, sys, time

SOURCE = 'd69fe8aaa2bb1801aa3561e9db4beabc8eb614b5'
def command(args, timeout=30, check=True):
    return subprocess.run(args, text=True, capture_output=True, timeout=timeout, check=check)
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def save(path, value):
    tmp=path.with_suffix(path.suffix+'.tmp'); tmp.write_text(json.dumps(value,indent=2)+'\n'); tmp.replace(path)
def file_hashes(root):
    return {str(f.relative_to(root)):digest(f) for f in sorted(root.rglob('*')) if f.is_file() and not f.is_symlink()}
def inspect(cid):
    return json.loads(command(['docker','inspect',cid]).stdout)[0]
def launch(source, output, image, args):
    return command(['docker','run','--detach','--user',f'{os.getuid()}:{os.getgid()}','--network','none','--memory','2g','--memory-swap','2g',
        '--pids-limit','256','--cpus','2','--cap-drop','ALL','--security-opt','no-new-privileges',
        '--read-only','--tmpfs','/tmp:rw,nosuid,nodev,size=128m',
        '--mount',f'type=bind,src={source},dst=/app,readonly',
        '--mount',f'type=bind,src={output},dst=/evidence',image,*args]).stdout.strip()
def assert_boundary(info):
    h=info['HostConfig']
    assert h['NetworkMode']=='none' and h['Memory']==2147483648 and h['PidsLimit']==256
    assert h['ReadonlyRootfs'] and not h['Privileged']
    assert all(m['Destination'] in ['/app','/evidence'] for m in info['Mounts'])
    assert all(not m['RW'] for m in info['Mounts'] if m['Destination']=='/app')
def frozen_capture(cid, source, target):
    command(['docker','pause',cid]); paused_at=time.monotonic()
    try:
        assert inspect(cid)['State']['Paused']
        before=file_hashes(source)
        target.mkdir()
        for name in before:
            f=target/name; f.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(source/name,f)
        time.sleep(.3)
        assert before==file_hashes(source)==file_hashes(target)
        return {'allContainerWritersPaused':True,'files':before,'pauseSeconds':time.monotonic()-paused_at,
                'scope':'Entire isolated examination container; not production or arbitrary writers outside this boundary'}
    finally:
        command(['docker','unpause',cid])
def validate_sqlite_copies(root):
    result=[]
    for p in root.rglob('*.sqlite'):
        db=sqlite3.connect('file:'+str(p)+'?mode=ro',uri=True)
        assert db.execute('PRAGMA quick_check').fetchone()[0]=='ok'; db.close()
        result.append(str(p.relative_to(root)))
    assert result
    return result

def main():
    source, output = [pathlib.Path(p).resolve() for p in sys.argv[1:3]]
    image = sys.argv[3]
    output.mkdir(parents=True,exist_ok=False)
    receipt={'status':'FAIL_CLOSED','startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'applicationSource':SOURCE,'phase':'PREREQUISITE_ONLY','longRunStarted':False,
        'protectedOffHostCertified':False,'productionMutation':False,'paidInference':0,'externalCommerce':0}
    owned=[]
    try:
        assert os.environ.get('GITHUB_ACTIONS')=='true', 'Actual CI required; no local environment substitution'
        assert os.environ.get('GITHUB_REPOSITORY')=='empireaios/EmpireAI'
        assert command(['git','-C',str(source),'rev-parse','HEAD']).stdout.strip()==SOURCE
        assert not command(['git','-C',str(source),'diff','--name-only','--','backend','pillow','deployment']).stdout.strip()
        receipt['applicationTree']=command(['git','-C',str(source),'rev-parse','HEAD^{tree}']).stdout.strip()
        receipt['workflowSha']=os.environ.get('GITHUB_SHA')
        receipt['harnessHashes']={p.name:digest(p) for p in sorted((source/'scripts/work8').glob('ci-*')) if p.is_file()}
        info=json.loads(command(['docker','info','--format','{{json .}}']).stdout)
        assert info['CgroupVersion']=='2', 'External cgroup v2 boundary required'
        receipt['runtime']={'cgroupVersion':info['CgroupVersion'],'dockerVersion':info['ServerVersion'],
            'imageId':json.loads(command(['docker','image','inspect',image]).stdout)[0]['Id'],
            'nodeVersion':command(['docker','run','--rm','--network','none',image,'node','--version']).stdout.strip()}
        assert receipt['runtime']['nodeVersion']=='v22.23.2'
        boundary=output/'boundary'; boundary.mkdir()
        cid=launch(source,boundary,image,['python3','scripts/work8/ci-isolated-unix.py','python3','scripts/work8/ci-boundary.py','egress']); owned.append(cid)
        code=command(['docker','wait',cid]).stdout.strip(); assert code=='0',command(['docker','logs',cid]).stdout
        receipt['egress']=json.loads(command(['docker','logs',cid]).stdout)
        cid=launch(source,boundary,image,['python3','scripts/work8/ci-boundary.py']); owned.append(cid)
        assert_boundary(inspect(cid))
        deadline=time.monotonic()+15
        while not all((boundary/f'heartbeat-{i}.json').exists() for i in range(3)):
            assert time.monotonic()<deadline; time.sleep(.1)
        receipt['descendantCapture']=frozen_capture(cid,boundary,output/'boundary-copy')
        receipt['capturedSqliteIntegrity']=validate_sqlite_copies(output/'boundary-copy')
        # Record host process identities before killing the entire boundary.
        top=command(['docker','top',cid,'-eo','pid']).stdout.splitlines()[1:]
        host_pids=[int(x.strip()) for x in top if x.strip().isdigit()]
        assert len(host_pids)>=3
        command(['docker','kill','--signal','KILL',cid]); command(['docker','wait',cid])
        time.sleep(.3)
        assert not inspect(cid)['State']['Running'] and inspect(cid)['State']['Pid']==0
        live=[]
        for pid in host_pids:
            f=pathlib.Path('/proc')/str(pid)/'stat'
            if f.exists() and f.read_text().split(') ')[1][0] not in ['Z','X']:live.append(pid)
        assert not live, f'Orphan fixture processes: {live}'
        receipt['externalDescendantContainment']={'pass':True,'hostPids':host_pids,
            'scope':'Kernel/container fixture capability, not application F29 acceptance'}
        runroot=output/'coupled'; runroot.mkdir()
        cid=launch(source,runroot,image,['python3','scripts/work8/ci-isolated-unix.py','node','--import',
            './backend/node_modules/tsx/dist/loader.mjs','scripts/work8/ci-coupled.mjs','observe','/evidence/run','preflight']);owned.append(cid)
        assert_boundary(inspect(cid)); start=time.monotonic(); captured=False
        with (output/'host-resource.jsonl').open('w') as log:
            while inspect(cid)['State']['Running']:
                elapsed=time.monotonic()-start; assert elapsed<540,'Bounded prerequisite exceeded nine minutes'
                stats=command(['docker','stats','--no-stream','--format','{{json .}}',cid]).stdout.strip()
                log.write(json.dumps({'elapsedSeconds':elapsed,'wallAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'stats':json.loads(stats)})+'\n');log.flush()
                if elapsed>=75 and not captured:
                    receipt['coupledGlobalCapture']=frozen_capture(cid,runroot,output/'coupled-copy')
                    receipt['coupledCopySqliteIntegrity']=validate_sqlite_copies(output/'coupled-copy')
                    captured=True
                time.sleep(5)
        state=inspect(cid)['State'];receipt['containerExit']=state['ExitCode']
        logs=command(['docker','logs',cid])
        (output/'coupled-console.log').write_text(logs.stdout)
        (output/'coupled-console.stderr.log').write_text(logs.stderr)
        assert state['ExitCode']==0, 'Coupled prerequisite failed; inspect original run receipt'
        assert captured
        verification=command(['python3',str(source/'scripts/work8/ci-verify.py'),str(runroot/'run')])
        receipt['independentOracle']=json.loads(verification.stdout)
        assert receipt['independentOracle']['status']=='PASS_INDEPENDENT_PREFLIGHT_NOT_ENDURANCE'
        receipt['status']='PASS_PREREQUISITE_NOT_ENDURANCE_NOT_WORK8_CERTIFICATION'
        receipt['remaining']=['Actual 45-minute run not executed','Separate application watchdog/launcher acceptance',
            'Protected independently authenticated distinct-failure-domain restoration','Genuine evidence and accounting dependencies']
    except Exception as error:
        receipt['error']=str(error)
        raise
    finally:
        for cid in owned:
            command(['docker','rm','--force',cid],check=False)
        receipt['endedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
        save(output/'PREREQUISITE-RECEIPT.json',receipt)
        print(json.dumps(receipt))

if __name__=='__main__':main()
