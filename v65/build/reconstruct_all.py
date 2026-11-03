#!/usr/bin/env python3
"""One bounded same-runner candidate reconstruction; no application is launched.

Inputs are public immutable sources plus reviewed controller/native bytes.
Success means packages exist for independent qualification, never A5 PASS.
"""
import argparse, datetime, json, os, pathlib, shutil, time
from reconstruct_frontends import acquire, atomic, command, need, sha
from scan_package_archives import scan_packages, classifications

HERE=pathlib.Path(__file__).resolve().parent
BACKEND='6c1e63ba20619ee480742fd87dc810ca93152e22'

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
    need(not execution.is_symlink(),'EXECUTION_ROOT_SYMLINK_REFUSED')
    if execution.exists():
        need(execution.is_dir() and execution.stat().st_uid==1001 and execution.stat().st_mode&0o777==0o700,'EXECUTION_ROOT_PRIVATE_OWNER_MODE')
        need({x.name for x in execution.iterdir()} <= {'runner-identity.json'},'EXECUTION_ROOT_NOT_FRESH')
        for existing in execution.iterdir():need(existing.is_file() and not existing.is_symlink(),'EXECUTION_ROOT_INVALID_IDENTITY_FILE')
    else:execution.mkdir(parents=True,mode=0o700)
    logs=root/'logs';started=time.monotonic();stage='prebuild-capacity';steps=[]
    env={'PATH':'/usr/bin:/bin','HOME':str(root/'home'),'LANG':'C.UTF-8','CI':'true','GITHUB_ACTIONS':'true','NEXT_TELEMETRY_DISABLED':'1','npm_config_audit':'false','npm_config_fund':'false','npm_config_fetch_retries':'0','npm_config_fetch_timeout':'30000','npm_config_cache':str(root/'npm-cache'),'npm_config_update_notifier':'false'}
    try:
        memory=int(next(x.split()[1] for x in pathlib.Path('/proc/meminfo').read_text().splitlines() if x.startswith('MemTotal:')))*1024
        capacity={'cpus':os.cpu_count(),'memoryBytes':memory,'diskFreeBytes':shutil.disk_usage(root).free,'minimumCpus':4,'minimumMemoryBytes':12*1024**3,'minimumFreeDiskBytes':12*1024**3,'purpose':'Source checkouts, three dependency/build trees, duplicate verified staging, bounded image saves, candidate archives and dependency-image pulls; later native gate separately requires6GiB free.'}
        atomic(execution/'prebuild-capacity.json',capacity)
        need(capacity['cpus']>=4 and memory>=12*1024**3 and capacity['diskFreeBytes']>=12*1024**3,'PREBUILD_RESOURCE_CAPACITY')
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
        front=root/'frontend-build';stage='frontend-reconstruction'
        steps.append(command(['python3',str(HERE/'reconstruct_frontends.py'),'--root',str(front),'--backend-manifest',str(manifest),'--toolchain-cache',str(root/'tool-preparation/toolchain')],root,env,logs,'frontend-reconstruction',1800))
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
        receipt={'schema':'work8-v65-reconstruction-first-failure-v1','stage':stage,'class':type(error).__name__,'code':str(error) if type(error).__name__ in ('Refusal','AssertionError') else 'BOUNDED_BUILD_OPERATION_FAILED','elapsedSeconds':round(time.monotonic()-started,3),'applicationRuntimeStarted':False,'A5AcceptanceClaimed':False,'rawLogsExported':False}
        atomic(root/'reconstruction-first-failure.json',receipt)
        failure_dir=execution/'build-receipts';failure_dir.mkdir(mode=0o700,exist_ok=True)
        atomic(failure_dir/'reconstruction-first-failure.json',receipt)
        print(json.dumps(receipt));raise SystemExit(17)

if __name__=='__main__':main()
