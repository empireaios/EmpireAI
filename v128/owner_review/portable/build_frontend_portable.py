#!/usr/bin/env python3
"""One credentialless exact-lock Next build; no Docker daemon or native app run."""
import hashlib,json,os,pathlib,selectors,shutil,signal,subprocess,sys,time
from extract_portable_runtime import tree,digest_rows
D=pathlib.Path(__file__).resolve().parent;source=pathlib.Path(sys.argv[1]).resolve();retained=pathlib.Path(sys.argv[2]).resolve();pins=json.loads(pathlib.Path(sys.argv[3]).read_bytes())
node=retained/'usr/local/bin/node';npm=retained/'usr/local/lib/node_modules/npm/bin/npm-cli.js'
h=lambda b:hashlib.sha256(b).hexdigest()
assert h(node.read_bytes())==pins['nodeSHA256']
before=tree(source);assert len(before)==pins['changedSourceFileCount']and digest_rows(before)==pins['changedSourceTreeSHA256']
assert h((source/'package-lock.json').read_bytes())==pins['packageLockSHA256']
lock=json.loads((source/'package-lock.json').read_bytes());assert len(lock['packages'])==pins['packageLockEntryCount']
for name,item in lock['packages'].items():
 if name:assert item['resolved'].startswith('https://registry.npmjs.org/')and item['integrity'].startswith('sha512-')
work=D/'build-work';assert not work.exists();work.mkdir();(work/'home').mkdir();(work/'empty-user-npmrc').write_text('');(work/'empty-global-npmrc').write_text('')
env={'PATH':str(node.parent)+':/usr/local/bin:/usr/bin:/bin','HOME':str(work/'home'),'LANG':'C.UTF-8','TZ':'UTC','CI':'1','NEXT_TELEMETRY_DISABLED':'1','PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD':'1','NPM_CONFIG_USERCONFIG':str(work/'empty-user-npmrc'),'NPM_CONFIG_GLOBALCONFIG':str(work/'empty-global-npmrc'),'NPM_CONFIG_CACHE':str(work/'npm-cache')}
def command(argv,seconds,name,extra=None):
 e=env.copy();e.update(extra or {});start=time.monotonic();p=subprocess.Popen(argv,cwd=source,env=e,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True)
 sel=selectors.DefaultSelector();sel.register(p.stdout,selectors.EVENT_READ);parts=[];size=0;failure=None
 try:
  while sel.get_map():
   if time.monotonic()-start>seconds:raise TimeoutError('BOUNDED_BUILD_DEADLINE')
   for key,_ in sel.select(.2):
    b=os.read(key.fileobj.fileno(),65536)
    if not b:sel.unregister(key.fileobj);continue
    size+=len(b);assert size<=4194304,'BUILD_LOG_BOUND';parts.append(b)
  code=p.wait(timeout=3)
  if code:raise RuntimeError('COMMAND_EXIT_'+str(code))
 except BaseException as error:
  failure=error
  try:os.killpg(p.pid,signal.SIGTERM)
  except ProcessLookupError:pass
  try:p.wait(timeout=3)
  except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait(timeout=3)
 finally:
  sel.close();raw=b''.join(parts);(work/(name+'.log')).write_bytes(raw)
 receipt={'command':argv,'exitCode':p.returncode,'elapsedSeconds':round(time.monotonic()-start,3),'logSHA256':h(raw),'logBytes':len(raw)}
 (work/(name+'.json')).write_text(json.dumps(receipt,indent=2)+'\n')
 if failure:
  print(json.dumps({'phase':name,**receipt,'safeOutputTail':raw[-8192:].decode(errors='replace')}));raise failure
 return raw
command([str(node),'--version'],10,'node-version');assert (work/'node-version.log').read_text().strip()=='v22.23.2'
command([str(node),str(npm),'--version'],10,'npm-version');assert (work/'npm-version.log').read_text().strip()==pins['npmVersion']
proxy={k:v for k,v in os.environ.items()if k in ['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy','NO_PROXY','no_proxy','NODE_EXTRA_CA_CERTS']}
print('Installing exact lockfile without lifecycle scripts',flush=True)
command([str(node),str(npm),'ci','--ignore-scripts','--no-audit','--no-fund','--include=dev','--fetch-retries=0','--fetch-timeout=45000','--progress=false','--registry=https://registry.npmjs.org/'],360,'dependency-install',proxy)
assert h((source/'package-lock.json').read_bytes())==pins['packageLockSHA256']
for name,version in pins['requiredPackageVersions'].items():assert json.loads((source/'node_modules'/name/'package.json').read_bytes())['version']==version
print('Building complete Next source with IPv4/IPv6 blocked',flush=True)
command([sys.executable,str(D/'deny_build_network.py'),str(node),'--max-old-space-size=3072',str(source/'node_modules/next/dist/bin/next'),'build','--webpack'],420,'next-build',{'NODE_ENV':'production','BRAIN_API_URL':'http://127.0.0.1:9'})
for row in before:
 p=source/row['path'];assert row['type']=='file'and p.is_file()and h(p.read_bytes())==row['sha256'],'SOURCE_CHANGED_DURING_BUILD'
standalone=source/'.next/standalone';assert(standalone/'server.js').is_file()
out=D/'frontend-runtime';assert not out.exists();shutil.copytree(standalone,out,symlinks=True)
shutil.copytree(source/'public',out/'public',dirs_exist_ok=True,symlinks=True);shutil.copytree(source/'.next/static',out/'.next/static',dirs_exist_ok=True,symlinks=True)
rows=tree(out);receipt={'schema':'A09_CREDENTIALLESS_COMPLETE_FRONTEND_BUILD_V1','status':'PASS','sourceFiles':len(before),'sourceTreeSHA256':digest_rows(before),'nodeVersion':'v22.23.2','nodeSHA256':pins['nodeSHA256'],'packageLockSHA256':pins['packageLockSHA256'],'sourcePublicationCommit':None,'dependencyLifecycleScriptsEnabled':False,'buildIPv4AndIPv6SocketCreation':'SECCOMP_DENIED_EPERM_INHERITED_BY_CHILDREN','unixIPCAllowed':True,'nativeApplicationStarted':False,'ownerCredentialsPresent':False,'ownerReviewPerformed':False,'containerDaemonUsed':False,'buildID':(source/'.next/BUILD_ID').read_text().strip(),'frontendFileCount':len(rows),'frontendTreeSHA256':digest_rows(rows),'frontendFiles':rows}
(D/'frontend-build-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({k:v for k,v in receipt.items()if k!='frontendFiles'},indent=2))
