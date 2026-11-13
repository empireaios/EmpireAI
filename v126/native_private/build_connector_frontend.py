#!/usr/bin/env python3
"""Build the changed complete frontend from exact retained source and lockfile.

Run after native preparation, before any private owner credentials exist.
Arguments: prepared runtime directory, exact source checkout root, unique run ID.
Inputs are flat beside this script: frontend-build-inputs.json.
No application is launched. npm lifecycle scripts are disabled. The actual Next
build runs in the admitted retained image with network=none and finite limits.
"""
import gzip,hashlib,json,os,pathlib,selectors,shutil,signal,stat,subprocess,sys,tarfile,time
CONTROL=pathlib.Path(__file__).resolve().parent
IMAGE='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
MAX_LOG=4*1024*1024
def digest(b):return hashlib.sha256(b).hexdigest()
def tree(root):
 rows=[]
 for p in sorted(root.rglob('*')):
  rel=p.relative_to(root).as_posix();s=p.lstat()
  if stat.S_ISDIR(s.st_mode):continue
  if stat.S_ISLNK(s.st_mode):
   target=os.readlink(p);assert not target.startswith('/')and p.resolve(strict=True).is_relative_to(root)
   rows.append({'path':rel,'type':'symlink','target':target})
  else:
   assert stat.S_ISREG(s.st_mode)and s.st_nlink==1
   rows.append({'path':rel,'type':'file','bytes':s.st_size,'sha256':digest(p.read_bytes())})
 return rows
def canonical_hash(rows):return digest(json.dumps(rows,sort_keys=True,separators=(',',':')).encode())
def retain_frontend_archive(source,rows,path):
 class LimitedWriter:
  def __init__(self,stream):self.stream=stream;self.written=0
  def write(self,b):
   self.written+=len(b)
   assert self.written<=209715200,'COMPRESSED_FRONTEND_ARCHIVE_LIMIT'
   return self.stream.write(b)
  def flush(self):return self.stream.flush()
 with path.open('xb')as raw:
  with gzip.GzipFile(fileobj=LimitedWriter(raw),mode='wb',compresslevel=6,mtime=0)as gz:
   with tarfile.open(fileobj=gz,mode='w|')as archive:
    for row in rows:
     p=source/row['path'];info=tarfile.TarInfo(row['path']);info.mtime=0
     if row['type']=='symlink':info.type=tarfile.SYMTYPE;info.linkname=row['target'];info.mode=0o777;archive.addfile(info)
     else:
      info.size=row['bytes'];info.mode=0o555 if p.stat().st_mode&0o111 else 0o444
      with p.open('rb')as f:archive.addfile(info,f)
 expected={r['path']:r for r in rows};observed=set()
 with tarfile.open(path,'r:gz')as archive:
  for member in archive:
   assert member.name in expected and member.name not in observed;observed.add(member.name);row=expected[member.name]
   if row['type']=='symlink':assert member.issym()and member.linkname==row['target']
   else:
    assert member.isfile()and member.size==row['bytes']
    with archive.extractfile(member)as f:assert hashlib.file_digest(f,'sha256').hexdigest()==row['sha256']
 assert observed==set(expected)
 with path.open('rb')as f:sha=hashlib.file_digest(f,'sha256').hexdigest()
 return {'path':path.name,'bytes':path.stat().st_size,'sha256':sha,'memberCount':len(rows),'allMembersReadBack':True,'maximumBytes':209715200}
def save(path,value):
 with path.open('x')as f:json.dump(value,f,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
def command(argv,seconds,env,cwd=None,log_path=None):
 start=time.monotonic();p=subprocess.Popen(argv,cwd=cwd,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True)
 selector=selectors.DefaultSelector();selector.register(p.stdout,selectors.EVENT_READ);chunks=[];size=0;failure=None
 try:
  while selector.get_map():
   if time.monotonic()-start>seconds:raise TimeoutError('BOUNDED_COMMAND_DEADLINE')
   for key,_ in selector.select(.2):
    b=os.read(key.fileobj.fileno(),65536)
    if not b:selector.unregister(key.fileobj);continue
    size+=len(b)
    if size>MAX_LOG:raise RuntimeError('BOUNDED_COMMAND_LOG_LIMIT')
    chunks.append(b)
  code=p.wait(timeout=3)
  if code:raise RuntimeError('COMMAND_EXIT_'+str(code))
 except BaseException as error:
  failure=error
  try:os.killpg(p.pid,signal.SIGTERM)
  except ProcessLookupError:pass
  try:p.wait(timeout=3)
  except subprocess.TimeoutExpired:
   try:os.killpg(p.pid,signal.SIGKILL)
   except ProcessLookupError:pass
   p.wait(timeout=3)
 finally:
  selector.close();raw=b''.join(chunks)
  if log_path:log_path.write_bytes(raw)
 if failure:
  failure.diagnostic={'binary':pathlib.Path(argv[0]).name,'exitCode':p.returncode,'elapsedSeconds':round(time.monotonic()-start,3),'outputSHA256':digest(raw),'outputBytes':len(raw),'safeOutputTail':raw[-8192:].decode(errors='replace')}
  raise failure
 return raw
def main():
 assert len(sys.argv)==4 and os.getuid()==0
 runtime,repo=map(lambda x:pathlib.Path(x).resolve(strict=True),sys.argv[1:3]);run=sys.argv[3];assert run.isdigit()
 assert not(runtime.parent/'private').exists(),'NO_OWNER_CREDENTIALS_DURING_BUILD'
 pins=json.loads((CONTROL/'frontend-build-inputs.json').read_bytes())
 assert pins['image']==IMAGE and pins['nodeSHA256']==digest((runtime/'node').read_bytes())
 source=runtime/'app/empireai-web';base=tree(source)
 assert len(base)==pins['baseFileCount']and canonical_hash(base)==pins['baseTreeSHA256'],'COMPLETE_FRONTEND_SOURCE_MISMATCH'
 work=runtime/'connector-build';assert not work.exists();work.mkdir(mode=0o700)
 env={'PATH':str(runtime)+':/usr/local/bin:/usr/bin:/bin','HOME':str(work/'home'),'LANG':'C.UTF-8','TZ':'UTC','CI':'1','NEXT_TELEMETRY_DISABLED':'1','PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD':'1'}
 (work/'home').mkdir();(work/'empty-user-npmrc').write_text('');(work/'empty-global-npmrc').write_text('')
 env.update({'NPM_CONFIG_USERCONFIG':str(work/'empty-user-npmrc'),'NPM_CONFIG_GLOBALCONFIG':str(work/'empty-global-npmrc'),'NPM_CONFIG_CACHE':str(work/'npm-cache')})
 def cmd(args,seconds=30,log=None,cwd=None):return command(args,seconds,env,cwd,work/log if log else None)
 def docker(args,seconds=30,log=None):return cmd(['docker']+args,seconds,log)
 def inventory():return [json.loads(l)for l in docker(['ps','-a','--format','{{json .}}']).decode().splitlines()if l.strip()]
 names=['work8-v128-frontend-carrier-'+run,'work8-v128-frontend-build-'+run]
 assert not any(x['Names']in names for x in inventory()),'EXISTING_BUILD_OPERATION_REQUIRES_RECONCILIATION'
 created=[];first=None;phase='admit-source'
 try:
  image=json.loads(docker(['image','inspect',IMAGE]))[0];assert image['Id']==IMAGE
  phase='recover-pinned-npm'
  docker(['create','--name',names[0],'--label','empireai.v128.frontend='+run,'--pull','never','--network','none','--cap-drop','ALL','--security-opt','no-new-privileges','--read-only','--entrypoint','/bin/false',IMAGE]);created.append(names[0])
  carrier=json.loads(docker(['inspect',names[0]]))[0];assert carrier['Image']==IMAGE and carrier['State']['Status']=='created'and carrier['State']['Pid']==0
  docker(['cp',names[0]+':/usr/local/lib/node_modules/npm',str(work/'npm')],60)
  npm_rows=tree(work/'npm');assert canonical_hash(npm_rows)==pins['npmTreeSHA256']and len(npm_rows)==pins['npmFileCount']
  docker(['rm',names[0]]);created.remove(names[0])
  src=work/'source';shutil.copytree(source,src,symlinks=True)
  for p in src.rglob('*'):
   if p.is_file()and not p.is_symlink():p.chmod(0o644)
   elif p.is_dir():p.chmod(0o755)
  src.chmod(0o755)
  for pin in pins['overlays']:
   p=repo/pin['repositoryPath'];assert p.is_file()and not p.is_symlink();b=p.read_bytes();assert len(b)==pin['bytes']and digest(b)==pin['sha256']
   target=src/pin['frontendPath'];assert target.parent.resolve(strict=True).is_relative_to(src);target.write_bytes(b)
  merged=tree(src);assert canonical_hash(merged)==pins['changedSourceTreeSHA256']
  lock_raw=(src/'package-lock.json').read_bytes();assert digest(lock_raw)==pins['packageLockSHA256'];lock=json.loads(lock_raw)
  assert not(src/'.npmrc').exists()
  for name,p in lock['packages'].items():
   if not name:continue
   assert p['resolved'].startswith('https://registry.npmjs.org/')and p['integrity'].startswith('sha512-'),'UNPINNED_DEPENDENCY'
  phase='install-locked-build-dependencies'
  cmd([str(runtime/'node'),str(work/'npm/bin/npm-cli.js'),'ci','--ignore-scripts','--no-audit','--no-fund','--include=dev','--fetch-retries=0','--fetch-timeout=45000','--progress=false','--registry=https://registry.npmjs.org/'],360,'dependency-install.log',str(src))
  assert digest((src/'package-lock.json').read_bytes())==pins['packageLockSHA256']
  for name,version in pins['requiredPackageVersions'].items():assert json.loads((src/'node_modules'/name/'package.json').read_bytes())['version']==version
  documentation=[];docs=src/'node_modules/next/dist/docs'
  if docs.is_dir():
   for p in sorted(docs.rglob('*')):
    if p.is_file()and p.suffix in ['.md','.mdx']and ('cli'in p.as_posix()or p.stem in ['output','deploying']):
     b=p.read_bytes();assert len(b)<=1048576;documentation.append({'path':p.relative_to(src).as_posix(),'bytes':len(b),'sha256':digest(b)})
  save(work/'bundled-next-documentation.json',{'nextVersion':'16.2.9','available':docs.is_dir(),'relevantGuidesRead':documentation,'frameworkApplicationCodeChangedByBuilder':False})
  phase='network-disabled-complete-next-build'
  argv=['create','--name',names[1],'--label','empireai.v128.frontend='+run,'--pull','never','--network','none','--cap-drop','ALL','--security-opt','no-new-privileges','--read-only','--memory','4294967296','--memory-swap','4294967296','--cpus','2','--pids-limit','256','--restart','no','--log-driver','none','--mount','type=bind,src='+str(src)+',dst=/build','--tmpfs','/tmp:rw,nosuid,nodev,size=268435456,mode=1777','--workdir','/build','--entrypoint','/usr/bin/env',IMAGE,'-i','PATH=/usr/local/bin:/usr/bin:/bin','HOME=/tmp','LANG=C.UTF-8','TZ=UTC','CI=1','NODE_ENV=production','NEXT_TELEMETRY_DISABLED=1','PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1','BRAIN_API_URL=http://127.0.0.1:9','/usr/local/bin/node','--max-old-space-size=3072','/build/node_modules/next/dist/bin/next','build','--webpack']
  docker(argv);created.append(names[1]);x=json.loads(docker(['inspect',names[1]]))[0];h=x['HostConfig']
  assert x['Image']==IMAGE and x['State']['Status']=='created'and h['NetworkMode']=='none'and h['ReadonlyRootfs']and not h['PortBindings']and not h['Privileged']
  assert h['Memory']==h['MemorySwap']==4294967296 and h['NanoCpus']==2000000000 and h['PidsLimit']==256 and h['CapDrop']==['ALL']and h['SecurityOpt']==['no-new-privileges']
  assert [(m['Source'],m['Destination'],m['RW'])for m in x['Mounts']if m['Type']=='bind']==[(str(src),'/build',True)]
  docker(['start','--attach',names[1]],420,'next-build.log')
  x=json.loads(docker(['inspect',names[1]]))[0];assert not x['State']['Running']and x['State']['ExitCode']==0
  docker(['rm',names[1]]);created.remove(names[1])
  for pin in merged:
   p=src/pin['path'];assert pin['type']=='file'and p.is_file()and digest(p.read_bytes())==pin['sha256'],'SOURCE_CHANGED_DURING_BUILD'
  phase='stage-complete-new-frontend'
  standalone=src/'.next/standalone';assert(standalone/'server.js').is_file()
  target=runtime/'connector-frontend';assert not target.exists();target.mkdir();shutil.copytree(standalone,target/'app',symlinks=True)
  shutil.copytree(src/'public',target/'app/public',dirs_exist_ok=True,symlinks=True)
  shutil.copytree(src/'.next/static',target/'app/.next/static',dirs_exist_ok=True,symlinks=True)
  browser=runtime/'browser-deps';assert not browser.exists();(browser/'node_modules').mkdir(parents=True)
  for name in ['playwright','playwright-core']:shutil.copytree(src/'node_modules'/name,browser/'node_modules'/name,symlinks=True)
  (browser/'package.json').write_text(json.dumps({'private':True,'type':'commonjs','dependencies':{'playwright':'1.62.1'}})+'\n')
  front_files=tree(target);browser_files=tree(browser)
  phase='retain-new-frontend-complete-bytes'
  archive=retain_frontend_archive(target,front_files,runtime/'connector-frontend.tar.gz')
  receipt={'schema':'v128-changed-frontend-build-v1','status':'BUILT_FROM_PINNED_FULL_SOURCE','applicationCommit':pins['applicationCommit'],'frontendBaseCommit':pins['frontendBaseCommit'],'sourcePublicationCommit':os.environ.get('GITHUB_SHA'),'sourceInputManifestSHA256':digest((CONTROL/'frontend-build-inputs.json').read_bytes()),'baseTreeSHA256':pins['baseTreeSHA256'],'changedSourceTreeSHA256':pins['changedSourceTreeSHA256'],'overlays':pins['overlays'],'nodeVersion':'22.23.2','nodeSHA256':pins['nodeSHA256'],'packageLockSHA256':pins['packageLockSHA256'],'dependencyLifecycleScriptsEnabled':False,'actualNextBuildCommand':['node','--max-old-space-size=3072','next','build','--webpack'],'buildNetwork':'none','buildMemoryBytes':4294967296,'buildPidsLimit':256,'frontendFiles':front_files,'browserDependencyFiles':browser_files,'frontendTreeSHA256':canonical_hash(front_files),'browserDependencyTreeSHA256':canonical_hash(browser_files),'buildID':(src/'.next/BUILD_ID').read_text().strip(),'nextDocumentation':documentation,'nativeApplicationStarted':False,'ownerCredentialsPresent':False,'ownerDecisionObserved':False,'wholeRowAccepted':False}
  receipt['frontendArchive']=archive
  receipt['retainedFrontendSourceCommit']=pins['retainedFrontendSourceCommit']
  receipt['retainedFrontendGitTree']=pins['retainedFrontendGitTree']
  receipt['qualifiedReferenceFrontendGitTree']=pins['qualifiedReferenceFrontendGitTree']
  receipt['qualifiedReferenceReconciliation']=pins['qualifiedReferenceReconciliation']
  assert len(json.dumps(receipt).encode())<4194304
  save(runtime/'evidence/connector-frontend-build.json',receipt)
 except BaseException as error:
  first=error;save(runtime/'evidence/connector-frontend-build-first-failure.json',{'schema':'v128-changed-frontend-build-first-failure-v1','phase':phase,'errorClass':type(error).__name__,'message':str(error)[:400],'diagnostic':getattr(error,'diagnostic',None),'nativeApplicationStarted':False,'wholeRowAccepted':False});raise
 finally:
  cleanup=[]
  try:
   current={x['Names']for x in inventory()}
   for name in names:
    if name not in current:continue
    x=json.loads(docker(['inspect',name]))[0];assert x['Image']==IMAGE and x['Config']['Labels'].get('empireai.v128.frontend')==run
    docker(['rm','--force',name]);cleanup.append(name)
   assert not any(x['Names']in names for x in inventory())
   save(runtime/'evidence/connector-frontend-build-termination.json',{'schema':'v128-build-container-termination-v1','names':names,'allAbsent':True,'removedDuringFinally':cleanup,'earliestFailurePreserved':first is not None})
  except BaseException as error:
   save(runtime/'evidence/connector-frontend-build-cleanup-failure.json',{'errorClass':type(error).__name__,'message':str(error)[:400],'earliestFailurePreserved':first is not None})
   if first is None:raise
if __name__=='__main__':main()
