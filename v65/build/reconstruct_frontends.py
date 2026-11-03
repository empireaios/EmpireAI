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

def command(argv,cwd,env,logs,label,seconds=300):
    need(re.fullmatch('[a-z0-9-]+',label) is not None,'COMMAND_LABEL')
    path=logs/(label+'.log');start=time.monotonic();total=0
    with path.open('xb') as out:
        path.chmod(0o600)
        p=subprocess.Popen(argv,cwd=cwd,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True)
        sel=selectors.DefaultSelector();os.set_blocking(p.stdout.fileno(),False);sel.register(p.stdout,selectors.EVENT_READ)
        try:
            while sel.get_map():
                need(time.monotonic()-start<seconds,'COMMAND_TIMEOUT_'+label)
                for key,_ in sel.select(.1):
                    b=os.read(key.fd,65536)
                    if not b:sel.unregister(key.fileobj);continue
                    total+=len(b);need(total<=MAX_LOG,'COMMAND_LOG_LIMIT_'+label);out.write(b)
            p.wait(timeout=max(.1,seconds-(time.monotonic()-start)))
            need(p.returncode==0,'COMMAND_FAILED_'+label)
        finally:
            if p.poll() is None:os.killpg(p.pid,signal.SIGKILL);p.wait(timeout=5)
            sel.close();p.stdout.close()
    return {'step':label,'exitCode':p.returncode,'seconds':round(time.monotonic()-start,3),'logSHA256':sha(path),'logBytes':total,'rawLogExported':False}

def capture(argv,cwd,env):
    p=subprocess.run(argv,cwd=cwd,env=env,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=30)
    need(p.returncode==0 and len(p.stdout)<131072,'CAPTURE_REFUSED')
    return p.stdout

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
    need(capture([str(node),'--version'],root,env).strip()==b'v22.23.2','NODE_VERSION')
    need(capture([str(node),str(npm),'--version'],root,env).strip()==b'10.9.8','NPM_VERSION')
    return node,npm

def verify_source(repo,spec,env):
    need(capture(['git','rev-parse','HEAD'],repo,env).decode().strip()==spec['commit'],'SOURCE_COMMIT')
    need(capture(['git','rev-parse','HEAD^{tree}'],repo,env).decode().strip()==spec['tree'],'SOURCE_TREE')
    need(not capture(['git','diff','--name-only','HEAD'],repo,env).strip(),'SOURCE_MODIFIED')
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
    parser=argparse.ArgumentParser();parser.add_argument('--root',required=True);parser.add_argument('--backend-manifest',required=True);parser.add_argument('--toolchain-cache');args=parser.parse_args()
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
            actual=json.loads(capture([str(node),'-e',"console.log(JSON.stringify({node:process.version,next:require('next/package.json').version,sharp:require('sharp').versions.sharp,sharpBinary:require('@img/sharp-linux-x64/package.json').version,libvips:require('@img/sharp-libvips-linux-x64/package.json').version}))"],web,env))
            need(actual=={'node':'v22.23.2','next':'16.2.9','sharp':'0.34.5','sharpBinary':'0.34.5','libvips':'1.2.4'},'SHARP_RUNTIME_COMPATIBILITY')
            step=name+'-identity'
            result['buildReceipts'].append(command([str(node),'--import','tsx','--test','lib/owner/runtime-release-identity.test.ts'],web,env,logs,name+'-identity',60))
            step=name+'-build';build=command([str(node),str(npm),'run','build'],web,env,logs,name+'-build',600);result['buildReceipts'].append(build)
            step=name+'-package';result['frontends'][name]=package(root,repo,spec,node,backend,build,env)
            verify_source(repo,spec,env)
        result['elapsedSeconds']=round(time.monotonic()-started,3)
        result['recordedAtUTC']=datetime.datetime.now(datetime.timezone.utc).isoformat()
        atomic(root/'v65-packages.json',result);print(json.dumps({'status':'CANDIDATES_BUILT_AWAITING_INDEPENDENT_QUALIFICATION','manifestSHA256':sha(root/'v65-packages.json'),'nativeAcceptanceClaimed':False}))
    except Exception as error:
        receipt={'schema':'work8-v65-build-first-failure-v1','stage':step,'code':str(error) if isinstance(error,Refusal) else type(error).__name__,'elapsedSeconds':round(time.monotonic()-started,3),'nativeAcceptanceClaimed':False,'rawLogsExported':False}
        atomic(root/'receipts/first-build-failure.json',receipt);print(json.dumps(receipt));raise SystemExit(17)

if __name__=='__main__':main()
