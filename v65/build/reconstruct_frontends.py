#!/usr/bin/env python3
"""V65 runner-local frontend reconstruction; emits candidates, never acceptance.

The immutable V55 application source is rebuilt with its unchanged lock and
accepted prebuilt-Sharp remedy. New archive/build IDs are recorded honestly.
No production endpoint or provider credential is passed to build processes.
"""
import argparse, datetime, gzip, hashlib, json, os, pathlib, platform, re
import selectors, shutil, signal, subprocess, tarfile, time, urllib.request
from retained_candidate_packages import BoundedCompressedWriter
from scan_package_archives import scan_frontend_stage
from capture_diagnostics import capture as diagnostic_capture, CaptureFailure, node_probe_source, failure_fields, atomic as diagnostic_atomic
from component_checkpoints import seal as seal_component

HERE=pathlib.Path(__file__).resolve().parent
BACKEND_COMMIT='6c1e63ba20619ee480742fd87dc810ca93152e22'
BACKEND_TREE='a78aa0e0a91c1e765afb23e70fe05c75cddc836e'
SPECS=json.loads((HERE/'build-preflight.json').read_text())['components']
TOOLS=json.loads((HERE/'toolchain-acquisition.json').read_text())
MAX_LOG=4*1024*1024
MAX_ARCHIVE=128*1024*1024

class Refusal(Exception): pass
def need(value,code):
    if not value:raise Refusal(code)
def sha(p):
    with pathlib.Path(p).open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def atomic(p,obj):
    p=pathlib.Path(p);tmp=p.with_suffix(p.suffix+'.partial')
    with tmp.open('x') as f:json.dump(obj,f,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
    tmp.chmod(0o600);os.replace(tmp,p)

COMMAND_LABELS=frozenset({'backend-init','backend-origin','backend-fetch','backend-checkout','backend-reconstruction','frontend-reconstruction','git-init','git-origin'} | {role+'-'+step for role in ('normal','recovery') for step in ('fetch','checkout','dependencies','sharp-remedy','identity','build')})
COMMAND_DIAGNOSTIC_CODES=frozenset({'ENOENT','EACCES','EPERM','ENOSPC','ENOMEM','EIO','ETIMEDOUT','ECONNREFUSED','ECONNRESET','ENOTFOUND','EAI_AGAIN','ERESOLVE','EINTEGRITY','ENOTEMPTY','EBADENGINE','MODULE_NOT_FOUND','ERR_MODULE_NOT_FOUND','ERR_PACKAGE_PATH_NOT_EXPORTED','ERR_DLOPEN_FAILED','ERR_REQUIRE_ESM','ERR_INVALID_ARG_TYPE'})

def command(argv,cwd,env,logs,label,seconds=300):
    # Labels are tied to the unchanged reconstruction call sites, not output.
    need(label in COMMAND_LABELS,'COMMAND_LABEL_REFUSED')
    need(type(seconds) in (int,float) and 0<seconds<=1800,'COMMAND_DEADLINE_BOUND')
    logs=pathlib.Path(logs);path=logs/(label+'.log');start=time.monotonic()
    total=0;counts=[0,0];hashes=[hashlib.sha256(),hashlib.sha256()];tails=[b'',b''];codes=set()
    p=None;sel=selectors.DefaultSelector();stop=None;complete=True;os_errno=None
    with path.open('xb') as out:
        path.chmod(0o600)
        try:
            p=subprocess.Popen(argv,cwd=cwd,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
            for index,stream in enumerate((p.stdout,p.stderr)):
                os.set_blocking(stream.fileno(),False);sel.register(stream,selectors.EVENT_READ,index)
            while sel.get_map():
                if time.monotonic()-start>=seconds:stop='COMMAND_TIMEOUT';complete=False;break
                for key,_ in sel.select(.05):
                    chunk=os.read(key.fd,min(65536,MAX_LOG-total+1))
                    if not chunk:sel.unregister(key.fileobj);continue
                    index=key.data;counts[index]+=len(chunk);hashes[index].update(chunk)
                    sample=tails[index]+chunk;tails[index]=sample[-128:]
                    for match in re.finditer(rb'(?<![A-Z0-9_])(?:ERR_[A-Z0-9_]{1,80}|MODULE_NOT_FOUND|E[A-Z]{1,30}|TS[0-9]{3,6})(?![A-Z0-9_])',sample):
                        code=match.group().decode('ascii')
                        if code in COMMAND_DIAGNOSTIC_CODES or re.fullmatch('TS[0-9]{3,6}',code):codes.add(code)
                    remaining=MAX_LOG-total;out.write(chunk[:remaining]);total+=len(chunk)
                    if total>MAX_LOG:stop='COMMAND_OUTPUT_BOUND';complete=False;break
                if stop:break
            if stop:
                try:os.killpg(p.pid,signal.SIGKILL)
                except ProcessLookupError:pass
            p.wait(timeout=5 if stop else max(.001,seconds-(time.monotonic()-start)))
            if not stop and p.returncode!=0:stop='COMMAND_NONZERO'
        except subprocess.TimeoutExpired:stop='COMMAND_TIMEOUT';complete=False
        except OSError as error:stop='COMMAND_OS_ERROR';complete=False;os_errno=error.errno
        finally:
            if p and p.poll() is None:
                try:os.killpg(p.pid,signal.SIGKILL)
                except ProcessLookupError:pass
                p.wait(timeout=5)
            sel.close()
            if p:p.stdout.close();p.stderr.close()
        out.flush();os.fsync(out.fileno())
    receipt={'schema':'work8-v66-bounded-build-command-v1','commandLabel':label,'code':('COMMAND_FAILED_'+label if stop=='COMMAND_NONZERO' else stop or 'COMMAND_COMPLETE'),'stopCause':stop,'exitCode':p.returncode if p else None,'stdoutBytes':counts[0],'stderrBytes':counts[1],'stdoutSHA256':hashes[0].hexdigest(),'stderrSHA256':hashes[1].hexdigest(),'knownDiagnosticCodes':sorted(codes)[:16],'streamComplete':complete,'maximumStreamBytes':MAX_LOG,'maximumSeconds':seconds,'rawOutputExported':False,'applicationAcceptance':False,'elapsedSeconds':round(time.monotonic()-start,3),'logBytes':path.stat().st_size,'logSHA256':sha(path)}
    if os_errno is not None:receipt['errno']=os_errno
    if stop:
        first=logs.parent/'command-receipts/first-command-failure.json'
        if not first.exists():diagnostic_atomic(first,receipt,exclusive=True)
        raise CaptureFailure(receipt)
    return {'step':label,'exitCode':p.returncode,'seconds':receipt['elapsedSeconds'],'logSHA256':receipt['logSHA256'],'logBytes':receipt['logBytes'],'stdoutBytes':counts[0],'stderrBytes':counts[1],'stdoutSHA256':receipt['stdoutSHA256'],'stderrSHA256':receipt['stderrSHA256'],'rawLogExported':False}

def capture(argv,cwd,env,*,label,receipts):
    return diagnostic_capture(argv,cwd,env,label=label,receipts=receipts)

def acquire(root,env,logs,cache=None):
    dest=root/'toolchain';dest.mkdir()
    for item in TOOLS:
        url=item['tarballURL'];need(url.startswith('https://registry.npmjs.org/'),'TOOL_URL')
        archive=dest/(item['package']+'.tgz');partial=archive.with_suffix('.partial');total=0;started=time.monotonic()
        cached=pathlib.Path(cache)/(item['package']+'.tgz') if cache else None
        source=cached.open('rb') if cached else urllib.request.urlopen(url,timeout=30)
        with source as src,partial.open('xb') as out:
            while chunk:=src.read(1024*1024):
                need(time.monotonic()-started<300,'TOOL_TRANSFER_TIMEOUT')
                total+=len(chunk);need(total<=item['bytes'],'TOOL_SIZE_OVERFLOW');out.write(chunk)
        need(total==item['bytes'] and sha(partial)==item['sha256'],'TOOL_DIGEST')
        os.rename(partial,archive);directory=dest/item['package'];directory.mkdir()
        with tarfile.open(archive,'r:gz') as tf:tf.extractall(directory,filter='data')
    node=dest/'node-linux-x64/package/bin/node';npm=dest/'npm/package/bin/npm-cli.js'
    need(capture([str(node),'--version'],root,env,label='toolchain-node-version',receipts=root/'capture-receipts').strip()==b'v22.23.2','NODE_VERSION')
    need(capture([str(node),str(npm),'--version'],root,env,label='toolchain-npm-version',receipts=root/'capture-receipts').strip()==b'10.9.8','NPM_VERSION')
    return node,npm

def verify_source(repo,spec,env):
    need(capture(['git','rev-parse','HEAD'],repo,env,label=spec['name']+'-source-commit',receipts=repo.parent/'capture-receipts').decode().strip()==spec['commit'],'SOURCE_COMMIT')
    need(capture(['git','rev-parse','HEAD^{tree}'],repo,env,label=spec['name']+'-source-tree',receipts=repo.parent/'capture-receipts').decode().strip()==spec['tree'],'SOURCE_TREE')
    need(not capture(['git','diff','--name-only','HEAD'],repo,env,label=spec['name']+'-source-clean',receipts=repo.parent/'capture-receipts').strip(),'SOURCE_MODIFIED')
    web=repo/'empireai-web';need(sha(web/'package-lock.json')==spec['lockSHA256'],'SOURCE_LOCK')
    for contract in spec['contracts']:need(sha(web/contract['path'])==contract['sha256'],'SOURCE_CONTRACT')

def package(root,repo,spec,node,backend,build,env):
    name=spec['name'];web=repo/'empireai-web';stage=root/'staging'/name
    need(not stage.exists(),'STAGE_ALREADY_EXISTS');verify_source(repo,spec,env)
    shutil.copytree(web/'.next/standalone',stage/'app')
    shutil.copytree(web/'.next/static',stage/'app/.next/static')
    shutil.copytree(web/'public',stage/'app/public')
    (stage/'runtime/bin').mkdir(parents=True)
    shutil.copy2(node,stage/'runtime/bin/node')
    shutil.copy2(node.parent.parent/'LICENSE',stage/'runtime/NODE-LICENSE')
    proof=stage/'provenance';proof.mkdir();shutil.copy2(web/'package-lock.json',proof/'package-lock.json')
    for c in spec['contracts']:
        dst=proof/'contracts'/c['path'];dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(web/c['path'],dst)
    (proof/'build-inputs.json').write_text(json.dumps({'source':spec,'toolchain':TOOLS,'build':build},indent=2)+'\n')
    build_id=(web/'.next/BUILD_ID').read_text().strip()
    need(BACKEND_COMMIT.encode() in (web/'.next/server/app/api/owner/runtime/route.js').read_bytes(),'COMPILED_BACKEND_BINDING')
    release={'schema':'EMPIREAI_V55_FRONTEND_STANDALONE_RELEASE_V1','component':name.upper(),'source':spec,
      'build':build,'nextBuildId':build_id,'nodeVersion':'22.23.2','npmBuildVersion':'10.9.8',
      'platform':{'os':'linux','arch':'x64','libc':'glibc','buildHostGlibc':os.confstr('CS_GNU_LIBC_VERSION')},
      'format':'Next.js standalone distribution with bundled Node executable','backendImageRequired':backend['image'],
      'backendIncluded':False,'containerImage':False,'ownerDataIncluded':False,'ownerCredentialsIncluded':False,
      'reconstruction':{'campaign':'V65','historicalBytesClaimed':False,'independentQualification':'PENDING'},
      'acceptanceScope':'Candidate build only; requires independent source/runtime compatibility qualification and native A5 examination.'}
    (stage/'release.json').write_text(json.dumps(release,indent=2)+'\n')
    (stage/'launch.sh').write_text('#!/bin/sh\nset -eu\n: "${BRAIN_API_URL:?authorised isolated backend required}"\nPACKAGE_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nexport NODE_ENV=production NEXT_TELEMETRY_DISABLED=1\nexport HOSTNAME="${HOSTNAME:-127.0.0.1}" PORT="${PORT:-3000}"\ncd "$PACKAGE_ROOT/app"\nexec "$PACKAGE_ROOT/runtime/bin/node" server.js\n')
    (stage/'launch.sh').chmod(0o755)
    scan=scan_frontend_stage(stage,name)
    (proof/'candidate-secret-scan.json').write_text(json.dumps({'schema':'work8-v65-frontend-candidate-secret-scan-v1','generatedRuntimeSecretsExist':False,'providerCredentialsSupplied':False,'productionDataSupplied':False,'scan':scan},indent=2)+'\n')
    members=[]
    for p in sorted(stage.rglob('*')):
        need(not p.is_symlink(),'PACKAGE_SYMLINK')
        if p.is_file():
            need(not p.name.startswith('.env'),'PACKAGE_ENV_FILE')
            members.append({'path':p.relative_to(stage).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)})
    (stage/'MEMBERS.json').write_text(json.dumps({'schema':'EMPIREAI_RELEASE_MEMBERS_V1','selfExcluded':'MEMBERS.json','members':members},indent=2)+'\n')
    target=root/'artifacts'/f'EmpireAI_V65_{name.upper()}_{spec["commit"][:12]}_node22_linux_x64.tar.gz'
    with target.open('xb') as raw,gzip.GzipFile(filename='',mode='wb',fileobj=BoundedCompressedWriter(raw,MAX_ARCHIVE),mtime=0,compresslevel=6) as compressed,tarfile.open(fileobj=compressed,mode='w|',format=tarfile.PAX_FORMAT) as tf:
        for p in sorted(stage.rglob('*')):
            if not p.is_file():continue
            info=tf.gettarinfo(str(p),arcname=p.relative_to(stage).as_posix());info.uid=info.gid=0;info.uname=info.gname='';info.mtime=0;info.mode=0o755 if p.stat().st_mode&0o111 else 0o644
            with p.open('rb') as f:tf.addfile(info,f)
    return {'commit':spec['commit'],'tree':spec['tree'],'file':target.name,'bytes':target.stat().st_size,'sha256':sha(target),'membersSHA256':sha(stage/'MEMBERS.json'),'members':len(members),'buildId':build_id}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--root',required=True);parser.add_argument('--backend-manifest',required=True);parser.add_argument('--toolchain-cache');parser.add_argument('--execution-root',required=True,type=pathlib.Path);args=parser.parse_args()
    root=pathlib.Path(args.root).absolute()
    need(os.environ.get('GITHUB_ACTIONS')=='true','GITHUB_ACTIONS_CONTEXT_REQUIRED')
    need(platform.system()=='Linux' and platform.machine()=='x86_64','LINUX_AMD64_REQUIRED')
    need(not root.exists(),'FRESH_BUILD_ROOT_REQUIRED');root.mkdir(mode=0o700,parents=True)
    for name in ('logs','home','artifacts','receipts','staging'): (root/name).mkdir(mode=0o700)
    logs=root/'logs';step='inputs';started=time.monotonic()
    try:
        backend_manifest=pathlib.Path(args.backend_manifest)
        backend=json.loads(backend_manifest.read_text());backend=backend.get('backend',backend)
        need(backend['commit']==BACKEND_COMMIT and backend['tree']==BACKEND_TREE and re.fullmatch('sha256:[a-f0-9]{64}',backend['image']),'BACKEND_CANDIDATE_BINDING')
        need(isinstance(backend['bytes'],int) and 0<backend['bytes']<=400*1024*1024 and re.fullmatch('[a-f0-9]{64}',backend['sha256']) and re.fullmatch('sha256:[a-f0-9]{64}',backend['manifest']),'BACKEND_MANIFEST_SHAPE')
        need(pathlib.PurePosixPath(backend['file']).name==backend['file'],'BACKEND_FILENAME')
        backend_archive=backend_manifest.parent/'artifacts'/backend['file']
        need(backend_archive.is_file() and not backend_archive.is_symlink() and backend_archive.stat().st_size==backend['bytes'] and sha(backend_archive)==backend['sha256'],'BACKEND_ARCHIVE_READBACK')
        env={'PATH':'/usr/bin:/bin','HOME':str(root/'home'),'LANG':'C.UTF-8','CI':'1','NEXT_TELEMETRY_DISABLED':'1','npm_config_audit':'false','npm_config_fund':'false','npm_config_fetch_retries':'0','npm_config_fetch_timeout':'30000','npm_config_cache':str(root/'npm-cache'),'npm_config_update_notifier':'false'}
        step='toolchain';node,npm=acquire(root,env,logs,args.toolchain_cache);env['PATH']=str(node.parent)+':/usr/bin:/bin'
        bare=root/'source.git';command(['git','init','--bare',str(bare)],root,env,logs,'git-init',30)
        command(['git','--git-dir',str(bare),'remote','add','origin','https://github.com/empireaios/EmpireAI.git'],root,env,logs,'git-origin',30)
        result={'schema':'work8-v65-source-reconstructed-packages-v1','backend':backend,'frontends':{},'nativeAcceptanceClaimed':False,'qualification':'PENDING_INDEPENDENT_REVIEW','buildReceipts':[]}
        for spec in SPECS:
            name=spec['name'];step=name+'-source'
            command(['git','--git-dir',str(bare),'fetch','--depth=1','origin',spec['commit']],root,env,logs,name+'-fetch',300)
            repo=root/name;command(['git','--git-dir',str(bare),'worktree','add','--detach',str(repo),spec['commit']],root,env,logs,name+'-checkout',120)
            verify_source(repo,spec,env);web=repo/'empireai-web'
            step=name+'-dependencies'
            result['buildReceipts'].append(command([str(node),str(npm),'ci','--ignore-scripts','--no-audit','--no-fund','--include=optional'],web,env,logs,name+'-dependencies',600))
            step=name+'-sharp-remedy'
            result['buildReceipts'].append(command([str(node),str(npm),'rebuild','--offline','--no-audit','--no-fund'],web,env,logs,name+'-sharp-remedy',180))
            probes=(('sharp-native-load',"require('sharp').versions.sharp",'0.34.5'),
                    ('node-runtime-version','process.version','v22.23.2'),
                    ('next-package-version',"require('next/package.json').version",'16.2.9'),
                    ('sharp-binary-package-version',"require('@img/sharp-linux-x64/package').version",'0.34.5'),
                    ('libvips-package-version',"require('@img/sharp-libvips-linux-x64/package').version",'1.2.4'))
            for label,expression,expected in probes:
                step=name+'-'+label
                actual=json.loads(capture([str(node),'-e',node_probe_source(expression)],web,env,label=step,receipts=root/'capture-receipts'))
                need(actual=={'value':expected},'PINNED_RUNTIME_VERSION_MISMATCH')
            step=name+'-identity'
            result['buildReceipts'].append(command([str(node),'--import','tsx','--test','lib/owner/runtime-release-identity.test.ts'],web,env,logs,name+'-identity',60))
            step=name+'-build';build=command([str(node),str(npm),'run','build'],web,env,logs,name+'-build',600);result['buildReceipts'].append(build)
            step=name+'-package';result['frontends'][name]=package(root,repo,spec,node,backend,build,env)
            verify_source(repo,spec,env)
            component_receipt=root/'receipts'/(name+'-component-build.json')
            atomic(component_receipt,{'schema':'work8-v65-frontend-component-build-v1','role':name,'source':spec,'package':result['frontends'][name],'commands':result['buildReceipts'],'runtimeProbes':probes,'applicationRuntimeStarted':False,'applicationAcceptance':False})
            step=name+'-local-component-checkpoint'
            seal_component(args.execution_root,name,result['frontends'][name],root/'artifacts'/result['frontends'][name]['file'],[component_receipt,*sorted((root/'capture-receipts').glob(name+'-*.json'))])
        result['elapsedSeconds']=round(time.monotonic()-started,3)
        result['recordedAtUTC']=datetime.datetime.now(datetime.timezone.utc).isoformat()
        atomic(root/'v65-packages.json',result);print(json.dumps({'status':'CANDIDATES_BUILT_AWAITING_INDEPENDENT_QUALIFICATION','manifestSHA256':sha(root/'v65-packages.json'),'nativeAcceptanceClaimed':False}))
    except Exception as error:
        receipt={'schema':'work8-v65-build-first-failure-v1','stage':step,'code':str(error) if isinstance(error,(Refusal,CaptureFailure)) else type(error).__name__,'elapsedSeconds':round(time.monotonic()-started,3),'nativeAcceptanceClaimed':False,'rawLogsExported':False}
        if isinstance(error,CaptureFailure):receipt.update(failure_fields(error))
        atomic(root/'receipts/first-build-failure.json',receipt);print(json.dumps(receipt));raise SystemExit(17)

if __name__=='__main__':main()
