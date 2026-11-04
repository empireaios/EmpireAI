#!/usr/bin/env python3
"""One bounded same-runner candidate reconstruction; no application is launched.

Inputs are public immutable sources plus reviewed controller/native bytes.
Success means packages exist for independent qualification, never A5 PASS.
"""
import argparse, datetime, json, os, pathlib, re, shutil, stat, sys, time
from reconstruct_frontends import Refusal, acquire, atomic, command, need, sha
from scan_package_archives import scan_packages, classifications
from component_checkpoints import seal as seal_component
from capture_diagnostics import CaptureFailure, failure_fields

HERE=pathlib.Path(__file__).resolve().parent
BACKEND='6c1e63ba20619ee480742fd87dc810ca93152e22'

def validate_execution_seed(execution,env=None,now=None):
    """Admit two identity receipts and the exact source-bound guard control file.

    This is reconstruction admission, not native security qualification. Image
    labels remain diagnostic observations; their agreement never admits native
    execution. A prior run, additional file, link or changed workflow is refused.
    """
    env=os.environ if env is None else env;now=time.time() if now is None else now
    execution=pathlib.Path(execution)
    need(execution.is_absolute() and execution.resolve()==execution,'EXECUTION_ROOT_CANONICAL_REQUIRED')
    s=execution.lstat()
    need(stat.S_ISDIR(s.st_mode) and s.st_uid==s.st_gid==1001 and stat.S_IMODE(s.st_mode)==0o700,'EXECUTION_ROOT_PRIVATE_OWNER_MODE')
    need({p.name for p in execution.iterdir()}=={'runner-identity.json','runtime-image-provenance.json','runtime-evidence'},'EXECUTION_ROOT_NOT_FRESH')
    evidence=execution/'runtime-evidence';es=evidence.lstat()
    need(stat.S_ISDIR(es.st_mode) and es.st_uid==es.st_gid==1001 and stat.S_IMODE(es.st_mode)==0o700,'EXECUTION_SEED_EVIDENCE_PRIVATE_REQUIRED')
    need({p.name for p in evidence.iterdir()}=={'guard-controls.json'},'EXECUTION_SEED_EVIDENCE_INVENTORY')
    def unique(pairs):
        result={}
        for key,value in pairs:
            need(key not in result,'EXECUTION_SEED_DUPLICATE_JSON_KEY');result[key]=value
        return result
    def load(name):
        path=execution/name
        try:fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW)
        except OSError:raise Refusal('EXECUTION_SEED_REGULAR_REQUIRED') from None
        with os.fdopen(fd,'rb') as stream:
            before=os.fstat(stream.fileno())
            need(stat.S_ISREG(before.st_mode) and before.st_nlink==1 and before.st_uid==before.st_gid==1001 and stat.S_IMODE(before.st_mode)==0o600,'EXECUTION_SEED_PRIVATE_FILE_REQUIRED')
            need(0<before.st_size<=1024*1024,'EXECUTION_SEED_SIZE_BOUND')
            data=stream.read(1024*1024+1);after=os.fstat(stream.fileno())
            def fingerprint(value):return tuple(getattr(value,k) for k in ('st_dev','st_ino','st_mode','st_uid','st_gid','st_nlink','st_size','st_mtime_ns','st_ctime_ns'))
            need(fingerprint(before)==fingerprint(after)==fingerprint(path.lstat()) and len(data)==before.st_size,'EXECUTION_SEED_CHANGED_DURING_READ')
        return json.loads(data,object_pairs_hook=unique)
    identity=load('runner-identity.json');provenance=load('runtime-image-provenance.json');controls=load('runtime-evidence/guard-controls.json')
    need(identity.get('schema')=='work8-v65-current-github-identity-v1' and identity.get('provider')=='github-actions','EXECUTION_SEED_PROVIDER_IDENTITY')
    expected={'GITHUB_ACTIONS':'true','GITHUB_REPOSITORY':'empireaios/EmpireAI','GITHUB_REPOSITORY_ID':'1275922460','GITHUB_RUN_ID':str(identity.get('runId')),'GITHUB_RUN_ATTEMPT':'1','GITHUB_SHA':identity.get('workflowCommit'),'GITHUB_JOB':identity.get('jobKey'),'RUNNER_OS':'Linux','RUNNER_ARCH':'X64'}
    need(all(env.get(k)==v for k,v in expected.items()),'EXECUTION_SEED_CURRENT_ENVIRONMENT_REQUIRED')
    need(identity.get('repository')==expected['GITHUB_REPOSITORY'] and str(identity.get('repositoryId'))==expected['GITHUB_REPOSITORY_ID'],'EXECUTION_SEED_REPOSITORY_BINDING')
    need(re.fullmatch('[a-f0-9]{40}',identity.get('workflowCommit','')) is not None and str(identity.get('runId','')).isdigit() and type(identity.get('jobId')) is int and identity['jobId']>0 and identity.get('runAttempt')==1,'EXECUTION_SEED_RUN_WORKFLOW_BINDING')
    need(identity.get('sessionId')=='github-actions:'+str(identity['runId'])+':1:'+str(identity['jobId']),'EXECUTION_SEED_SESSION_BINDING')
    need(identity.get('hostUid')==identity.get('hostGid')==1001 and identity.get('architecture')=='amd64' and identity.get('applicationStarted') is False,'EXECUTION_SEED_SCOPE_REQUIRED')
    need(type(identity.get('timeoutSeconds')) is int and 0<identity['timeoutSeconds']<=21600 and identity.get('expiresAtEpoch')==identity.get('jobStartedAtEpoch',0)+identity['timeoutSeconds'] and identity['jobStartedAtEpoch']<=now<identity['expiresAtEpoch'],'EXECUTION_SEED_CURRENT_JOB_LIFETIME')
    sys.path.insert(0,str(HERE.parent/'adapter'))
    try:
        from github_contract import validate_image_provenance, validate_current_executor_continuity
        from collect_runtime_image_provenance import bind_current_identity
        bind_current_identity(identity,env)
        validate_image_provenance(provenance,identity)
        need(provenance['runtimeIdentityReceipt']['sha256']==sha(execution/'runner-identity.json'),'EXECUTION_SEED_IDENTITY_DIGEST_BINDING')
        validate_current_executor_continuity(provenance,identity)
    finally:sys.path.pop(0)
    need(controls.get('schema')=='work8-v75-guard-controls-v1' and controls.get('status')=='PASS_SOURCE_BOUND_REJECTION_CONTROLS' and type(controls.get('testsRun')) is int and controls['testsRun']>0 and all(controls.get(k)==[] for k in ('failures','errors','skipped')),'EXECUTION_SEED_GUARD_CONTROLS_REQUIRED')
    need(all(controls.get(k)==identity.get(k) for k in ('runId','runAttempt','jobId','workflowCommit','sessionId')),'EXECUTION_SEED_GUARD_RUN_BINDING')
    need(all(controls.get(k) is False for k in ('actualRunnerQualified','applicationStarted','rawOutputRetained')),'EXECUTION_SEED_GUARD_SCOPE_REQUIRED')
    source_root=HERE.parent
    inputs=[source_root/'adapter/github_contract.py',source_root/'adapter/collect_runtime_image_provenance.py',source_root/'adapter/compare_executor_provenance.py',source_root/'tests/run_guard_controls.py',*sorted((source_root/'tests').glob('test_*guard*.py'))]
    need(len(inputs)>4,'EXECUTION_SEED_GUARD_TEST_SOURCE_REQUIRED')
    expected={p.relative_to(source_root).as_posix():sha(p) for p in inputs}
    need(controls.get('sourceSHA256')==expected,'EXECUTION_SEED_GUARD_SOURCE_BINDING')
    return {'identity':identity,'provenance':provenance,'guardControls':controls}

def finalize_package_scan(execution,candidate):
    execution=pathlib.Path(execution)
    atomic(execution/'v65-packages.json',candidate)
    scan=scan_packages(execution/'artifacts',candidate)
    scan.update(status='PASS_COMPLETE_SOURCE_ONLY_PACKAGE_SCAN',packageManifestSHA256=sha(execution/'v65-packages.json'),applicationRuntimeStarted=False,providerCredentialsSupplied=False,archives={p['file']:p['sha256'] for p in [candidate['backend'],*candidate['frontends'].values()]})
    atomic(execution/'package-source-scan.json',scan)
    return scan

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--root',required=True,type=pathlib.Path)
    p.add_argument('--controller',required=True,type=pathlib.Path)
    p.add_argument('--execution-root',type=pathlib.Path)
    args=p.parse_args();root=args.root.resolve();ctl=args.controller.resolve()
    need(os.environ.get('GITHUB_ACTIONS')=='true','ACTIONS_CONTEXT_REQUIRED')
    need(os.getuid()==os.geteuid()==os.getgid()==os.getegid()==1001,'REVIEWED_RUNNER_PRINCIPAL_1001_REQUIRED')
    need(not root.exists(),'FRESH_CAMPAIGN_ROOT_REQUIRED')
    os.umask(0o077);root.mkdir(parents=True,mode=0o700)
    for name in ('logs','home','tool-preparation','runtime-bin'):(root/name).mkdir(mode=0o700)
    execution=args.execution_root.absolute() if args.execution_root else root/'execution'
    logs=root/'logs';started=time.monotonic();stage='execution-seed';steps=[]
    env={'PATH':'/usr/bin:/bin','HOME':str(root/'home'),'LANG':'C.UTF-8','CI':'true','GITHUB_ACTIONS':'true','NEXT_TELEMETRY_DISABLED':'1','npm_config_audit':'false','npm_config_fund':'false','npm_config_fetch_retries':'0','npm_config_fetch_timeout':'30000','npm_config_cache':str(root/'npm-cache'),'npm_config_update_notifier':'false'}
    try:
        validate_execution_seed(execution)
        stage='prebuild-capacity'
        memory=int(next(x.split()[1] for x in pathlib.Path('/proc/meminfo').read_text().splitlines() if x.startswith('MemTotal:')))*1024
        capacity={'cpus':os.cpu_count(),'memoryBytes':memory,'diskFreeBytes':shutil.disk_usage(root).free,'minimumCpus':4,'minimumMemoryBytes':12*1024**3,'minimumFreeDiskBytes':13*1024**3,'purpose':'Source checkouts, three dependency/build trees, duplicate verified staging, bounded image saves, candidate archives, up to1GiB sealed component checkpoint copies and dependency-image pulls; later native gate separately requires6GiB free.'}
        atomic(execution/'prebuild-capacity.json',capacity)
        need(capacity['cpus']>=4 and memory>=12*1024**3 and capacity['diskFreeBytes']>=13*1024**3,'PREBUILD_RESOURCE_CAPACITY')
        stage='prebuild-public-binary-classification';classifications()
        stage='toolchain'
        node,npm=acquire(root/'tool-preparation',env,logs)
        (root/'runtime-bin/node').symlink_to(node)
        (root/'runtime-bin/npm').symlink_to(npm)
        env['PATH']=str(root/'runtime-bin')+':/usr/bin:/bin'
        src=root/'backend-source';stage='backend-source'
        steps.append(command(['git','init',str(src)],root,env,logs,'backend-init',30))
        steps.append(command(['git','remote','add','origin','https://github.com/empireaios/EmpireAI.git'],src,env,logs,'backend-origin',30))
        steps.append(command(['git','fetch','--depth=1','origin',BACKEND],src,env,logs,'backend-fetch',300))
        steps.append(command(['git','checkout','--detach',BACKEND],src,env,logs,'backend-checkout',120))
        backend=root/'backend-build';stage='backend-reconstruction'
        steps.append(command(['python3',str(HERE/'reconstruct-backend.py'),'--source',str(src),'--controller',str(ctl),'--output',str(backend),'--max-seconds','1200'],root,env,logs,'backend-reconstruction',1260))
        manifest=backend/'backend-manifest.json'
        need(manifest.is_file(),'BACKEND_MANIFEST_REQUIRED')
        stage='backend-local-component-checkpoint'
        backend_pin=json.loads(manifest.read_text())
        seal_component(execution,'backend',backend_pin,backend/'artifacts'/backend_pin['file'],[manifest,backend/'evidence/backend-build-result.json',backend/'evidence/backend-packaging-removal.json'])
        front=root/'frontend-build';stage='frontend-reconstruction'
        steps.append(command(['python3',str(HERE/'reconstruct_frontends.py'),'--root',str(front),'--backend-manifest',str(manifest),'--toolchain-cache',str(root/'tool-preparation/toolchain'),'--execution-root',str(execution)],root,env,logs,'frontend-reconstruction',1800))
        candidate=json.loads((front/'v65-packages.json').read_text())
        artifacts=execution/'artifacts';artifacts.mkdir(mode=0o700)
        for role,item in [('backend',candidate['backend']),*candidate['frontends'].items()]:
            source=(backend/'artifacts' if role=='backend' else front/'artifacts')/item['file']
            need(source.is_file() and not source.is_symlink() and source.stat().st_size==item['bytes'] and sha(source)==item['sha256'],'PACKAGE_FULL_DESTINATION_VERIFY_'+role)
            target=artifacts/item['file'];os.rename(source,target)
            need(target.stat().st_size==item['bytes'] and sha(target)==item['sha256'],'PACKAGE_MOVED_VERIFY_'+role)
        need(len(list(artifacts.iterdir()))==3,'COMPLETE_THREE_PACKAGE_INVENTORY')
        stage='final-source-only-package-scan'
        finalize_package_scan(execution,candidate)
        receipts=execution/'build-receipts';receipts.mkdir(mode=0o700)
        backend_result=json.loads((backend/'evidence/backend-build-result.json').read_text())
        need(backend_result['schema']=='WORK8_V65_BACKEND_RECONSTRUCTION_V1' and backend_result['applicationRuntimeStarted'] is False and backend_result['acceptanceGranted'] is False and backend_result['status']=='BUILT_SOURCE_EQUIVALENCE_CANDIDATE_REQUIRES_INDEPENDENT_RUNTIME_QUALIFICATION','SAFE_BACKEND_RECEIPT_REQUIRED')
        atomic(receipts/'backend-build-result.json',backend_result)
        omission=json.loads((backend/'evidence/backend-packaging-removal.json').read_text())
        need(omission['status']=='EXACT_FIVE_UNUSED_ASM_VARIANTS_REMOVED_BEFORE_IMAGE_BUILD','EXACT_PACKAGING_OMISSION_RECEIPT_REQUIRED')
        atomic(receipts/'backend-packaging-removal.json',omission)
        stage='complete-candidates'
        receipt={'schema':'work8-v65-reconstruction-result-v1','status':'CANDIDATES_EXIST_AWAITING_INDEPENDENT_QUALIFICATION','manifestSHA256':sha(execution/'v65-packages.json'),'packageCount':3,'elapsedSeconds':round(time.monotonic()-started,3),'steps':steps,'applicationRuntimeStarted':False,'A5AcceptanceClaimed':False,'rawLogsExported':False,'recordedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()}
        atomic(root/'reconstruction-result.json',receipt)
        atomic(receipts/'reconstruction-result.json',receipt)
        print(json.dumps({'status':receipt['status'],'manifestSHA256':receipt['manifestSHA256'],'packageCount':3}))
    except Exception as error:
        receipt={'schema':'work8-v65-reconstruction-first-failure-v1','stage':stage,'class':type(error).__name__,'code':str(error) if type(error).__name__ in ('Refusal','AssertionError','CaptureFailure') else 'BOUNDED_BUILD_OPERATION_FAILED','elapsedSeconds':round(time.monotonic()-started,3),'applicationRuntimeStarted':False,'A5AcceptanceClaimed':False,'rawLogsExported':False}
        if isinstance(error,CaptureFailure):receipt.update(failure_fields(error))
        atomic(root/'reconstruction-first-failure.json',receipt)
        # Never write through an invalid identity seed. The separate private
        # build root still preserves the first cause for final-export.
        if stage!='execution-seed':
            failure_dir=execution/'build-receipts';failure_dir.mkdir(mode=0o700,exist_ok=True)
            atomic(failure_dir/'reconstruction-first-failure.json',receipt)
        print(json.dumps(receipt));raise SystemExit(17)

if __name__=='__main__':main()
