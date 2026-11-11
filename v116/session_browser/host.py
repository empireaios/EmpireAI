#!/usr/bin/env python3
"""Single bounded native-browser job; exact source carriers are never started."""
import base64,gzip,hashlib,io,json,os,pathlib,re,shutil,signal,stat,subprocess,sys,tarfile,time
import retained_current_packages as packages
CONTROL=pathlib.Path(__file__).resolve().parent
RUN=os.environ['GITHUB_RUN_ID'];assert RUN.isdigit()
ROOT=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-session-browser-'+RUN)
assert ROOT.resolve(strict=True)==ROOT and os.getuid()==os.getgid()==1001
OUT=ROOT/'evidence';ENV={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','HOME':str(ROOT/'docker-home'),'PYTHONDONTWRITEBYTECODE':'1'}
PREFIX='work8-v116-session-browser-'+RUN;LABEL='empireai.v116.session-browser='+RUN
APP='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
BROWSER='sha256:fee853fafa59550d162cef52bca02d907694b44ebf6ef9fb075bcc0c65d8dedb'
BROWSER_REF='mcr.microsoft.com/playwright@sha256:c091b21d9fae78c76e85cd4356431e9b018402f172a214fc7d7a5e9a7e29d8ac'
NAMES={PREFIX+'-carrier':APP,PREFIX+'-exam':BROWSER}
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def write(name,value):
 b=(json.dumps(value,indent=2)+'\n').encode();assert len(b)<=2097152
 with(OUT/name).open('xb')as f:f.write(b);f.flush();os.fsync(f.fileno())
def command(argv,timeout=20,cap=2097152):
 p=subprocess.run(argv,env=ENV,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout)
 assert len(p.stdout)+len(p.stderr)<=cap,'CONTROL_OUTPUT_CAP'
 if p.returncode:raise RuntimeError('CONTROL_'+pathlib.Path(argv[0]).name+'_'+str(p.returncode)+':'+p.stderr.decode(errors='replace')[:600])
 return p.stdout
def docker(args,timeout=20,cap=2097152):return command(['/usr/bin/docker']+args,timeout,cap)
def inspect(name):return json.loads(docker(['inspect',name]))[0]
def absent(name):
 p=subprocess.run(['/usr/bin/docker','inspect',name],env=ENV,capture_output=True,timeout=10)
 return p.returncode!=0 and b'No such object'in p.stderr
def terminate():
 removed=[]
 for name,image in reversed(list(NAMES.items())):
  if absent(name):continue
  x=inspect(name);assert x['Name']=='/'+name and x['Image']==image and x['Config']['Labels'].get('empireai.v116.session-browser')==RUN
  docker(['rm','--force',name]);removed.append(name)
 assert all(absent(n)for n in NAMES)
 assert not docker(['ps','-aq','--filter','label='+LABEL]).strip()
 return {'scopedContainersAbsent':True,'labelledContainersAbsent':True,'removed':removed,'customNetworksCreated':False}
def inventory():
 rows=[];links=[]
 for label,root in [('app',ROOT/'app'),('frontend',ROOT/'frontend'),('redis',ROOT/'redis'),('node_modules',ROOT/'npm/node_modules'),('source-volume',ROOT/'source-volume'),('inputs',ROOT/'inputs'),('control',CONTROL)]:
  assert root.is_dir()and not root.is_symlink()
  for directory,dirs,files in os.walk(root,followlinks=False):
   for n in dirs+files:
    p=pathlib.Path(directory)/n;r=label+'/'+str(p.relative_to(root));s=p.lstat()
    if stat.S_ISLNK(s.st_mode):assert p.resolve(strict=True).is_relative_to(root.resolve());links.append({'path':r,'target':os.readlink(p)})
    elif stat.S_ISREG(s.st_mode):assert s.st_nlink==1;rows.append({'path':r,'bytes':s.st_size,'sha256':sha(p)})
    else:assert stat.S_ISDIR(s.st_mode),'NONREGULAR_INPUT'
 p=ROOT/'node';rows.append({'path':'node','bytes':p.stat().st_size,'sha256':sha(p)})
 rows.sort(key=lambda x:x['path']);links.sort(key=lambda x:x['path']);assert len(rows)<=60000 and sum(x['bytes']for x in rows)<1500000000
 return {'files':rows,'links':links}
def admit_fixture():
 m=json.loads((CONTROL/'fixture-admission.json').read_text());p=CONTROL/m['encodedBundleFile'];assert p.name==m['encodedBundleFile']and p.is_file()and not p.is_symlink()and p.stat().st_size==m['encodedBundleBytes']and sha(p)==m['encodedBundleSHA256'];raw=base64.b64decode(p.read_bytes().strip(),validate=True);assert len(raw)==m['bundleBytes']and hashlib.sha256(raw).hexdigest()==m['bundleSHA256']
 assert m['state']=='INDEPENDENTLY_REVIEWED_GENERATED_FIXTURE'and re.fullmatch('[a-f0-9]{64}',m['privacyReviewSHA256'])
 state=json.loads((CONTROL/'backend-state-inputs.json').read_text());expected={x['path']:x for x in state['files']};assert len(expected)==14
 dest=ROOT/'source-volume';dest.mkdir(mode=0o755)
 with tarfile.open(fileobj=io.BytesIO(raw),mode='r:gz')as z:
  members=z.getmembers();assert len(members)==14 and len({x.name for x in members})==14 and {x.name for x in members}==set(expected)
  for x in members:
   assert x.isfile()and not x.islnk()and not x.issym()and not x.mode&0o6000 and '..'not in pathlib.PurePosixPath(x.name).parts and not x.name.startswith('/')
   pin=expected[x.name];assert x.size==pin['bytes'];b=z.extractfile(x).read(x.size+1);assert len(b)==x.size and hashlib.sha256(b).hexdigest()==pin['sha256'];q=dest/x.name;q.parent.mkdir(parents=True,exist_ok=True);q.write_bytes(b);q.chmod(0o444)
 for p in dest.rglob('*'):
  if p.is_dir():p.chmod(0o555)
 dest.chmod(0o555);write('native-fixture-input-admission.json',{'bundleSHA256':m['bundleSHA256'],'all14ExactBytesVerified':True,'stateManifestSHA256':sha(CONTROL/'backend-state-inputs.json'),'classification':state['classification'],'privacyReviewSHA256':m['privacyReviewSHA256'],'genuineOwnerEvidence':False})
def prepare():
 (ROOT/'docker-home').mkdir(mode=0o700);assert all(absent(n)for n in NAMES)
 docker(['load','--input',str(ROOT/'backend.tar.gz')],90)
 app=json.loads(docker(['image','inspect',APP]))[0];assert app['Id']==APP and app['Architecture']=='amd64'and app['Os']=='linux'and app['Config']['Labels']['org.opencontainers.image.revision']=='6c1e63ba20619ee480742fd87dc810ca93152e22'
 write('retained-application-image.json',app)
 name=PREFIX+'-carrier';docker(['create','--name',name,'--label',LABEL,'--network','none','--cap-drop','ALL','--security-opt','no-new-privileges','--read-only','--entrypoint','/bin/false',APP])
 x=inspect(name);assert x['State']['Status']=='created'and x['State']['Pid']==0 and x['Config']['Entrypoint']==['/bin/false']and x['Image']==APP
 write('carrier-created-admission.json',{'name':name,'image':APP,'state':x['State'],'entrypoint':x['Config']['Entrypoint'],'applicationStarted':False})
 docker(['cp',name+':/app',str(ROOT/'app')],90)
 # Exact copied package bytes become publicly readable/executable as required;
 # only the owned staging copy is normalized before its immutable bind.
 for directory,dirs,files in os.walk(ROOT/'app',followlinks=False):
  for n in dirs+files:
   p=pathlib.Path(directory)/n;s=p.lstat()
   if stat.S_ISLNK(s.st_mode):assert p.resolve(strict=True).is_relative_to(ROOT/'app')
   elif stat.S_ISDIR(s.st_mode):p.chmod(0o555)
   else:assert stat.S_ISREG(s.st_mode)and s.st_nlink==1;p.chmod(0o555 if s.st_mode&0o111 else 0o444)
 (ROOT/'app').chmod(0o555)
 docker(['cp',name+':/usr/local/bin/node',str(ROOT/'node')],30);assert sha(ROOT/'node')=='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327';(ROOT/'node').chmod(0o555)
 pins=json.loads((CONTROL/'frontend-pins.json').read_text());packages.BACKEND.update(pins['backend']);packages.FRONTENDS=pins['frontends'];front=packages.verify_frontend(ROOT/'normal.tar.gz','normal',ROOT/'frontend');write('accepted-normal-frontend.json',front)
 command(['/usr/bin/python3','-B',str(CONTROL/'fetch-redis-dependencies.py'),str(ROOT/'redis-packages')],180)
 redis=ROOT/'redis';redis.mkdir(mode=0o755);(redis/'lib').mkdir(mode=0o755)
 for f in json.loads((CONTROL/'redis-abi-inputs.json').read_text())['files']:
  q=redis/f['destination'];assert not q.exists()
  if f['sourceKind']=='EXACT_RETAINED_IMAGE':docker(['cp',name+':/'+f['imagePath'],str(q)])
  else:shutil.copyfile(ROOT/'redis-packages/mounts'/f['packageFile'],q)
  assert q.is_file()and not q.is_symlink()and q.stat().st_size==f['bytes']and sha(q)==f['sha256'];q.chmod(0o555)
 end_carrier=inspect(name);assert end_carrier['State']['Status']=='created'and end_carrier['State']['Pid']==0;write('never-started-carrier.json',{'name':name,'image':APP,'initialState':x['State'],'beforeRemovalState':end_carrier['State'],'entrypoint':x['Config']['Entrypoint'],'onlyActions':['create','inspect','copy-exact-app-node-and-ABI-files','inspect','remove'],'applicationStarted':False});docker(['rm',name]);assert absent(name)
 command(['/usr/bin/python3','-B',str(CONTROL/'npm-stage.py'),str(ROOT/'npm')],120)
 write('npm-staging-receipt.json',json.loads((ROOT/'npm/staging-receipt.json').read_text()))
 write('redis-dependency-staging.json',json.loads((ROOT/'redis-packages/dependency-staging-receipt.json').read_text()))
 (ROOT/'inputs').mkdir(mode=0o755)
 for n in ['technical-authority.json','test1-committed-business-checkpoint.json']:shutil.copyfile(CONTROL/n,ROOT/'inputs'/n);(ROOT/'inputs'/n).chmod(0o444)
 admit_fixture()
 docker(['pull',BROWSER_REF],300,8388608);browser=json.loads(docker(['image','inspect',BROWSER_REF]))[0];assert browser['Id']==BROWSER and 'mcr.microsoft.com/playwright@'+BROWSER_REF.split('@')[1]in browser['RepoDigests']and browser['Architecture']=='amd64'and browser['Os']=='linux';write('immutable-browser-image.json',browser)
 rows=inventory();b=json.dumps(rows,sort_keys=True,separators=(',',':')).encode();(ROOT/'input-inventory.json').write_bytes(b)
 with(OUT/'input-inventory.json.gz').open('xb')as f:f.write(gzip.compress(b,compresslevel=6,mtime=0))
 write('prepared-inputs.json',{'status':'PASS_EXACT_INPUTS_NO_APPLICATION_STARTED','regularFiles':len(rows['files']),'safeLinks':len(rows['links']),'inventorySHA256':hashlib.sha256(b).hexdigest(),'nativeSource':'6c1e63ba20619ee480742fd87dc810ca93152e22','normalFrontend':'750483b3152f2c9c65a65b6381c8c94f081b9eb1','nodeVersion':'22.23.2','applicationRebuilt':False,'browserImage':BROWSER,'browserDigest':BROWSER_REF})
def mount(src,dst,ro=True):return'type=bind,src='+str(src)+',dst='+dst+(',readonly'if ro else'')
def execute():
 start=time.monotonic();r={'schema':'v116-hosted-native-session-browser-host-v1','status':'FAIL','runId':RUN,'genuineOwnerAcceptance':False,'wholeRowAccepted':False};phase='input-readback';name=PREFIX+'-exam'
 try:
  assert all(absent(n)for n in NAMES);before=(ROOT/'input-inventory.json').read_bytes();assert json.loads(before)==inventory()
  command(['/usr/bin/sudo','/usr/bin/install','-d','-o','0','-g','0','-m','0700',str(ROOT/'private-output')]);(ROOT/'host-identity.json').write_text(json.dumps({'networkNamespace':os.readlink('/proc/self/ns/net'),'pidNamespace':os.readlink('/proc/self/ns/pid')})+'\n');(ROOT/'host-identity.json').chmod(0o444)
  binds={str(ROOT/'app'):'/app',str(ROOT/'frontend'):'/frontend',str(CONTROL):'/control',str(ROOT/'node'):'/node',str(ROOT/'redis'):'/redis',str(ROOT/'source-volume'):'/source-volume',str(ROOT/'inputs'):'/inputs',str(ROOT/'npm/node_modules'):'/node_modules',str(ROOT/'host-identity.json'):'/host-identity.json',str(CONTROL/'hosts'):'/etc/hosts'}
  argv=['create','--name',name,'--label',LABEL,'--user','0:0','--network','none','--cap-drop','ALL','--security-opt','no-new-privileges','--read-only','--memory','2147483648','--memory-swap','2147483648','--pids-limit','256','--cpus','2','--ipc','private','--shm-size','134217728','--restart','no','--ulimit','core=0:0','--ulimit','fsize=33554432:33554432','--log-driver','json-file','--log-opt','max-size=256k','--log-opt','max-file=2']
  tmp={'/tmp':'rw,nosuid,nodev,noexec,size=268435456,mode=1777','/run':'rw,nosuid,nodev,noexec,size=16777216,mode=0755','/frontend/app/.next/cache':'rw,nosuid,nodev,noexec,size=67108864,mode=0700'}
  for a,b in binds.items():argv+=['--mount',mount(a,b)]
  argv+=['--mount',mount(ROOT/'private-output','/output',False)]
  for a,b in tmp.items():argv+=['--tmpfs',a+':'+b]
  argv+=['--entrypoint','/node',BROWSER,'--max-old-space-size=256','/control/hosted-supervisor.mjs'];phase='container-admission';docker(argv)
  x=inspect(name);h=x['HostConfig'];c=x['Config'];assert x['Image']==BROWSER and x['State']['Status']=='created'and x['State']['Pid']==0 and c['User']=='0:0'and c['Entrypoint']==['/node']and c['Cmd']==['--max-old-space-size=256','/control/hosted-supervisor.mjs']
  assert h['NetworkMode']=='none'and h['ReadonlyRootfs']and h['CapDrop']==['ALL']and not h['CapAdd']and h['SecurityOpt']==['no-new-privileges']and not h['Privileged']
  assert h['Memory']==h['MemorySwap']==2147483648 and h['PidsLimit']==256 and h['NanoCpus']==2000000000 and h['IpcMode']=='private'and h['ShmSize']==134217728 and h['Tmpfs']==tmp
  assert not h['PidMode']and not h['UTSMode']and not h['PortBindings']and not h['Devices']and not h['DeviceRequests']and h['RestartPolicy']['Name']=='no'
  assert c['Labels'].get('empireai.v116.session-browser')==RUN and set(c['Env'])=={'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin','LANG=C.UTF-8','LC_ALL=C.UTF-8','PLAYWRIGHT_BROWSERS_PATH=/ms-playwright'}
  assert {m['Destination']:(m['Source'],m['RW'])for m in x['Mounts']if m['Type']=='bind'}=={**{b:(a,False)for a,b in binds.items()},'/output':(str(ROOT/'private-output'),True)}
  assert all(m['Type']in['bind','tmpfs']for m in x['Mounts']);write('prelaunch-container.json',x)
  phase='guarded-browser-and-native-examination';docker(['start',name]);end=time.monotonic()+280
  while time.monotonic()<end:
   x=inspect(name)
   if not x['State']['Running']:break
   total=int(command(['/usr/bin/sudo','/usr/bin/du','-sb',str(ROOT/'private-output')]).split()[0]);assert total<=67108864,'PRIVATE_OUTPUT_64MIB_BOUND';time.sleep(.5)
  else:raise TimeoutError('NATIVE_BROWSER_OUTER_280S_LIMIT')
  write('terminal-container.json',x);assert x['State']['Status']=='exited'and x['State']['ExitCode']==0 and not x['State']['OOMKilled'],'NATIVE_BROWSER_EXAMINATION_FAILED';r['status']='PASS_AWAITING_INDEPENDENT_BROWSER_REVIEW'
 except BaseException as e:r['firstFailure']={'phase':phase,'name':type(e).__name__,'message':str(e)[:800]}
 finally:
  signal.signal(signal.SIGTERM,signal.SIG_IGN);signal.signal(signal.SIGINT,signal.SIG_IGN)
  try:r['termination']=terminate()
  except BaseException as e:r['terminationFailure']=str(e)[:500];r['status']='FAIL_CLEANUP'
  try:
   original=json.loads((ROOT/'input-inventory.json').read_bytes());now=inventory();assert original==now;r['allOriginalInputFilesAndLinksPreserved']=True;r['inputInventorySHA256']=sha(ROOT/'input-inventory.json')
  except BaseException as e:r['preservationFailure']=type(e).__name__;r['status']='FAIL_PRESERVATION'
  r['elapsedSeconds']=round(time.monotonic()-start,3);write('host-execution.json',r);print(json.dumps(r))
 return 0 if r['status']=='PASS_AWAITING_INDEPENDENT_BROWSER_REVIEW'else 1
def seal():
 write('provider-termination.json',terminate())
 custody=subprocess.run(['/usr/bin/sudo','/usr/bin/python3','-B',str(CONTROL/'collect.py'),str(ROOT),RUN],env=ENV,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=30)
 assert len(custody.stdout)+len(custody.stderr)<=2097152
 print(custody.stdout.decode(errors='replace'))
 if custody.returncode:raise RuntimeError('PRIVATE_CUSTODY_FAILED:'+custody.stderr.decode(errors='replace')[:800])
 rows=[];total=0
 for p in sorted(OUT.iterdir()):
  s=p.lstat();assert stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_uid==1001 and s.st_size<=8388608
  total+=s.st_size;assert total<=20971520;rows.append({'path':p.name,'bytes':s.st_size,'sha256':sha(p)})
 write('evidence-index.json',{'schema':'v116-native-session-browser-evidence-v1','runId':RUN,'launchCommit':os.environ['GITHUB_SHA'],'payloads':rows,'maximumBytes':20971520,'retentionDays':7,'privateVolumePublished':False,'wholeRowAccepted':False});assert sum(p.stat().st_size for p in OUT.iterdir())<=20971520
 for name in ['browser-capability.json','browser-result.json','backend-result.json','supervisor-result.json','host-execution.json']:
  p=OUT/name
  if p.exists():x=json.loads(p.read_text());print(json.dumps({'receipt':name,'status':x.get('status'),'firstFailure':x.get('firstFailure'),'cleanupFailure':x.get('cleanupFailure')}))
if __name__=='__main__':
 signal.signal(signal.SIGTERM,lambda n,f:(_ for _ in()).throw(InterruptedError('HOST_SIGNAL_'+str(n))));signal.signal(signal.SIGINT,lambda n,f:(_ for _ in()).throw(InterruptedError('HOST_SIGNAL_'+str(n))))
 mode=sys.argv[1:];assert mode in [['prepare'],['execute'],['seal']]
 if mode==['prepare']:
  try:prepare()
  except BaseException as e:
   write('preparation-failure.json',{'status':'FAIL_BEFORE_APPLICATION_START','errorClass':type(e).__name__,'messageSHA256':hashlib.sha256(str(e).encode()).hexdigest(),'messageLength':len(str(e)),'sourceLocations':__import__('traceback').format_tb(e.__traceback__)[-4:]});raise
 elif mode==['execute']:sys.exit(execute())
 else:seal()
