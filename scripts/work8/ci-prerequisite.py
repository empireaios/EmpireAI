#!/usr/bin/env python3
"""Host-side controller for the single owner-authorised 45-minute examination.

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
        'applicationSource':SOURCE,'phase':'ENDURANCE','longRunStarted':False,
        'protectedOffHostCertified':False,'productionMutation':False,'paidInference':0,'externalCommerce':0}
    owned=[]
    try:
        assert os.environ.get('GITHUB_ACTIONS')=='true', 'Actual CI required; no local environment substitution'
        assert os.environ.get('GITHUB_REPOSITORY')=='empireaios/EmpireAI'
        assert command(['git','-C',str(source),'rev-parse','HEAD']).stdout.strip()==SOURCE
        assert not command(['git','-C',str(source),'diff','--name-only','--','backend','pillow','deployment']).stdout.strip()
        receipt['applicationTree']=command(['git','-C',str(source),'rev-parse','HEAD^{tree}']).stdout.strip()
        receipt['workflowSha']=os.environ.get('GITHUB_SHA')
        receipt['runId']=os.environ.get('GITHUB_RUN_ID')
        receipt['scheduleReview']=json.loads(command(['python3',str(source/'scripts/work8/ci-schedule.py')]).stdout)
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
        receipt['reusedContainmentEvidence']={'runId':38211521264,'artifactId':11729636436,'scope':'Previously passing three-writer external containment fixture; not application watchdog acceptance'}
        runroot=output/'coupled'; runroot.mkdir()
        cid=launch(source,runroot,image,['python3','scripts/work8/ci-isolated-unix.py','node','--import',
            './backend/node_modules/tsx/dist/loader.mjs','scripts/work8/ci-coupled.mjs','observe','/evidence/run','endurance']);owned.append(cid)
        assert_boundary(inspect(cid)); receipt['longRunStarted']=True; receipt['containerId']=cid;save(output/'RUN-IDENTITY.json',receipt); start=time.monotonic(); captured=False
        with (output/'host-resource.jsonl').open('w') as log:
            while inspect(cid)['State']['Running']:
                elapsed=time.monotonic()-start; assert elapsed<3000,'Endurance exceeded fifty-minute containment deadline'
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
        assert receipt['independentOracle']['status']=='PASS_INDEPENDENT_COUPLED_ELAPSED_ORACLE'
        receipt['status']='PASS_SCOPED_ENDURANCE_NOT_WORK8_CERTIFICATION'
        receipt['remaining']=['Separate application watchdog/launcher acceptance',
            'Protected independently authenticated distinct-failure-domain restoration','Genuine evidence and accounting dependencies']
    except Exception as error:
        receipt['error']=str(error)
        if isinstance(error,subprocess.CalledProcessError):receipt['subprocess']={'args':error.cmd,'returncode':error.returncode,'stdout':error.stdout,'stderr':error.stderr}
        raise
    finally:
        for cid in owned:
            diagnostics=command(['docker','logs',cid],check=False)
            (output/('container-'+cid[:12]+'.log')).write_text(diagnostics.stdout+'\nSTDERR\n'+diagnostics.stderr)
            command(['docker','rm','--force',cid],check=False)
        receipt['endedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
        save(output/'ENDURANCE-RECEIPT.json',receipt)
        print(json.dumps(receipt))

if __name__=='__main__':main()
