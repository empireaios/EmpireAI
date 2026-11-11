#!/usr/bin/env python3
"""Bounded browser-only diagnosis. Backend carrier is never started; only Node is copied."""
import hashlib,json,os,pathlib,selectors,signal,stat,subprocess,sys,time
CONTROL=pathlib.Path(__file__).resolve().parent
RUN=os.environ['GITHUB_RUN_ID'];assert RUN.isdigit()
ROOT=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-browser-renderer-'+RUN)
assert ROOT.is_absolute()and ROOT.resolve(strict=True)==ROOT and os.getuid()==os.getgid()==1001
OUT=ROOT/'evidence';ENV={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','HOME':str(ROOT/'docker-home'),'PYTHONDONTWRITEBYTECODE':'1'}
PREFIX='work8-v116-browser-renderer-'+RUN;LABEL='empireai.v116.browser-renderer='+RUN
APP='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
BROWSER='sha256:fee853fafa59550d162cef52bca02d907694b44ebf6ef9fb075bcc0c65d8dedb'
BROWSER_REF='mcr.microsoft.com/playwright@sha256:c091b21d9fae78c76e85cd4356431e9b018402f172a214fc7d7a5e9a7e29d8ac'
NODE_SHA='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
NAMES={PREFIX+'-carrier':APP,PREFIX+'-original96':BROWSER};STOP=False

def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def write(name,value):
 b=(json.dumps(value,indent=2)+'\n').encode();assert len(b)<=1048576 and pathlib.Path(name).name==name
 with(OUT/name).open('xb')as f:f.write(b);f.flush();os.fsync(f.fileno())
def command(argv,timeout=20,cap=2097152,check=True):
 p=None;parts=[bytearray(),bytearray()];sel=selectors.DefaultSelector();start=time.monotonic()
 try:
  blocked=signal.pthread_sigmask(signal.SIG_BLOCK,{signal.SIGTERM,signal.SIGINT})
  try:p=subprocess.Popen(argv,env=ENV,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
  finally:signal.pthread_sigmask(signal.SIG_SETMASK,blocked)
  for i,s in enumerate([p.stdout,p.stderr]):os.set_blocking(s.fileno(),False);sel.register(s,selectors.EVENT_READ,i)
  while sel.get_map():
   if time.monotonic()-start>timeout:raise TimeoutError('CONTROL_DEADLINE')
   for key,_ in sel.select(.1):
    b=os.read(key.fileobj.fileno(),65536)
    if not b:sel.unregister(key.fileobj);continue
    parts[key.data].extend(b)
    if sum(map(len,parts))>cap:raise RuntimeError('CONTROL_OUTPUT_CAP')
  code=p.wait(timeout=1)
  if check and code:raise RuntimeError('CONTROL_'+pathlib.Path(argv[0]).name+'_'+str(code)+'_'+hashlib.sha256(parts[1]).hexdigest())
  return {'code':code,'stdout':bytes(parts[0]),'stderr':bytes(parts[1])}
 finally:
  sel.close()
  if p:
   if p.poll()is None:
    try:os.killpg(p.pid,signal.SIGKILL)
    except ProcessLookupError:pass
   p.wait(timeout=5)
def docker(args,timeout=20,cap=2097152,check=True):return command(['/usr/bin/docker']+args,timeout,cap,check)
def inspect(name):return json.loads(docker(['inspect',name])['stdout'])[0]
def absent(name):
 x=docker(['inspect',name],check=False);return x['code']!=0 and b'No such object'in x['stderr']
def terminate():
 removed=[]
 for name,image in reversed(list(NAMES.items())):
  if absent(name):continue
  x=inspect(name);assert x['Name']=='/'+name and x['Image']==image and x['Config']['Labels'].get('empireai.v116.browser-renderer')==RUN
  docker(['rm','--force',name]);removed.append(name)
 assert all(absent(n)for n in NAMES)
 assert not docker(['ps','-aq','--filter','label='+LABEL])['stdout'].strip()
 return{'scopedContainersAbsent':True,'labelledContainersAbsent':True,'removed':removed,'customNetworksCreated':False}
def inventory():
 rows=[]
 for label,root in [('npm',ROOT/'npm/node_modules'),('control',ROOT/'runtime-control')]:
  assert root.is_dir()and not root.is_symlink()
  for directory,dirs,files in os.walk(root,followlinks=False):
   for n in dirs+files:
    p=pathlib.Path(directory)/n;s=p.lstat();assert not stat.S_ISLNK(s.st_mode)
    if stat.S_ISREG(s.st_mode):assert s.st_nlink==1;rows.append({'path':label+'/'+str(p.relative_to(root)),'bytes':s.st_size,'sha256':sha(p),'mode':stat.S_IMODE(s.st_mode)})
    else:assert stat.S_ISDIR(s.st_mode)
 p=ROOT/'node';assert p.is_file()and not p.is_symlink()and p.stat().st_nlink==1;rows.append({'path':'node','bytes':p.stat().st_size,'sha256':sha(p),'mode':stat.S_IMODE(p.stat().st_mode)});assert len(rows)<=200 and sum(x['bytes']for x in rows)<160000000;return sorted(rows,key=lambda x:x['path'])
def prepare():
 (ROOT/'docker-home').mkdir(mode=0o700);assert all(absent(n)for n in NAMES)
 docker(['load','--input',str(ROOT/'backend.tar.gz')],90)
 x=json.loads(docker(['image','inspect',APP])['stdout'])[0];assert x['Id']==APP and x['Architecture']=='amd64'and x['Os']=='linux'and x['Config']['Labels']['org.opencontainers.image.revision']=='6c1e63ba20619ee480742fd87dc810ca93152e22'
 write('retained-application-image.json',x)
 name=PREFIX+'-carrier';docker(['create','--name',name,'--label',LABEL,'--network','none','--cap-drop','ALL','--security-opt','no-new-privileges','--read-only','--entrypoint','/bin/false',APP]);first=inspect(name);assert first['State']['Status']=='created'and first['State']['Pid']==0 and first['Config']['Entrypoint']==['/bin/false']
 write('carrier-created-admission.json',{'name':name,'image':APP,'state':first['State'],'entrypoint':first['Config']['Entrypoint'],'applicationStarted':False,'copiedNodeYet':False})
 docker(['cp',name+':/usr/local/bin/node',str(ROOT/'node')],30);assert sha(ROOT/'node')==NODE_SHA;(ROOT/'node').chmod(0o555)
 final=inspect(name);assert final['State']['Status']=='created'and final['State']['Pid']==0
 write('never-started-carrier.json',{'name':name,'image':APP,'initialState':first['State'],'beforeRemovalState':final['State'],'onlyCopiedPath':'/usr/local/bin/node','nodeSHA256':NODE_SHA,'applicationStarted':False,'applicationFilesCopied':False});docker(['rm',name]);assert absent(name)
 command(['/usr/bin/python3','-B',str(CONTROL/'npm-stage.py'),str(ROOT/'npm')],100);write('npm-staging-receipt.json',json.loads((ROOT/'npm/staging-receipt.json').read_text()))
 r=ROOT/'runtime-control';r.mkdir(mode=0o755)
 for n in ['browser-renderer-probe.mjs']:
  source=CONTROL/n;assert source.is_file()and not source.is_symlink()and source.stat().st_nlink==1;b=source.read_bytes();assert len(b)<=131072
  with(r/n).open('xb')as f:f.write(b)
  (r/n).chmod(0o444)
 r.chmod(0o555)
 docker(['pull',BROWSER_REF],300,8388608);x=json.loads(docker(['image','inspect',BROWSER_REF])['stdout'])[0];assert x['Id']==BROWSER and BROWSER_REF in x['RepoDigests']and x['Architecture']=='amd64'and x['Os']=='linux';write('immutable-browser-image.json',x)
 before=inventory();write('input-inventory.json',{'files':before});(ROOT/'input-inventory.json').write_text(json.dumps(before,sort_keys=True));write('prepared-inputs.json',{'status':'PASS_BROWSER_ONLY_INPUTS','files':len(before),'nodeSHA256':NODE_SHA,'applicationStarted':False,'applicationFilesCopied':False,'applicationOrOwnerStateMounted':False,'browserImage':BROWSER,'browserDigest':BROWSER_REF})
def mount(src,dst,ro=True):return'type=bind,src='+str(src)+',dst='+dst+(',readonly'if ro else'')
def run_case(case,pids):
 assert not STOP and(case,pids)==('original96',96);name=PREFIX+'-'+case;out=ROOT/('private-'+case);command(['/usr/bin/sudo','/usr/bin/install','-d','-o','0','-g','0','-m','0700',str(out)])
 binds={str(ROOT/'runtime-control'):'/control',str(ROOT/'node'):'/node',str(ROOT/'npm/node_modules'):'/node_modules'}
 argv=['create','--name',name,'--label',LABEL,'--user','0:0','--network','none','--cap-drop','ALL','--security-opt','no-new-privileges','--read-only','--memory','2147483648','--memory-swap','2147483648','--pids-limit',str(pids),'--cpus','2','--ipc','private','--shm-size','134217728','--restart','no','--ulimit','core=0:0','--ulimit','fsize=33554432:33554432','--log-driver','json-file','--log-opt','max-size=256k','--log-opt','max-file=2','--env','DEBUG=pw:browser','--env','DEBUG_COLORS=0','--env','HOME=/tmp/home','--env','TZ=UTC']
 tmp={'/tmp':'rw,nosuid,nodev,noexec,size=268435456,mode=1777','/run':'rw,nosuid,nodev,noexec,size=16777216,mode=0755'}
 for a,b in binds.items():argv+=['--mount',mount(a,b)]
 argv+=['--mount',mount(out,'/output',False)]
 for a,b in tmp.items():argv+=['--tmpfs',a+':'+b]
 cmd=['--max-old-space-size=256','/control/browser-renderer-probe.mjs',case];argv+=['--entrypoint','/node',BROWSER]+cmd;docker(argv)
 x=inspect(name);h=x['HostConfig'];c=x['Config'];assert x['Image']==BROWSER and x['State']['Status']=='created'and x['State']['Pid']==0 and c['User']=='0:0'and c['Entrypoint']==['/node']and c['Cmd']==cmd
 assert len(x['Id'])==64 and c['Hostname']==x['Id'][:12]
 assert h['NetworkMode']=='none'and h['ReadonlyRootfs']and h['CapDrop']==['ALL']and not h['CapAdd']and h['SecurityOpt']==['no-new-privileges']and not h['Privileged']
 assert h['Memory']==h['MemorySwap']==2147483648 and h['PidsLimit']==pids and h['NanoCpus']==2000000000 and h['IpcMode']=='private'and h['ShmSize']==134217728 and h['Tmpfs']==tmp
 assert not h['PidMode']and not h['UTSMode']and not h['PortBindings']and not h['Devices']and not h['DeviceRequests']and h['RestartPolicy']['Name']=='no'
 assert h['CgroupnsMode']=='private'and not h['Binds'] and h['Ulimits']==[{'Name':'core','Hard':0,'Soft':0},{'Name':'fsize','Hard':33554432,'Soft':33554432}]
 assert h['LogConfig']=={'Type':'json-file','Config':{'max-file':'2','max-size':'256k'}}
 assert c['Labels'].get('empireai.v116.browser-renderer')==RUN and set(c['Env'])=={'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin','LANG=C.UTF-8','LC_ALL=C.UTF-8','PLAYWRIGHT_BROWSERS_PATH=/ms-playwright','DEBUG=pw:browser','DEBUG_COLORS=0','HOME=/tmp/home','TZ=UTC'}
 assert{m['Destination']:(m['Source'],m['RW'])for m in x['Mounts']if m['Type']=='bind'}=={**{b:(a,False)for a,b in binds.items()},'/output':(str(out),True)}and all(m['Type']in['bind','tmpfs']for m in x['Mounts'])
 write(case+'-prelaunch-container.json',x);docker(['start',name]);end=time.monotonic()+45;timed=False
 try:
  while time.monotonic()<end:
   x=inspect(name)
   if not x['State']['Running']:break
   if STOP:raise InterruptedError('STOP_NO_LATER_CASE')
   time.sleep(.2)
  else:timed=True;docker(['kill','--signal','KILL',name]);x=inspect(name)
 finally:
  x=inspect(name)
  if x['State']['Running']:docker(['kill','--signal','KILL',name]);x=inspect(name)
  assert not x['State']['Running'];write(case+'-terminal-container.json',x)
  logs=docker(['logs','--timestamps',name],cap=1048576,check=False)
  for stream in ['stdout','stderr']:
   with(OUT/(case+'-'+stream+'.log')).open('xb')as f:f.write(logs[stream]);f.flush();os.fsync(f.fileno())
  docker(['rm',name]);assert absent(name)
 write(case+'-host-outcome.json',{'case':case,'expectedPidsMax':pids,'outer45sTimedOut':timed,'exitCode':x['State']['ExitCode'],'OOMKilled':x['State']['OOMKilled'],'removed':True,'diagnosticOnly':True,'boundedLogRotationPossible':True,'logDriverRetentionMaximumBytesApproximate':524288})
 return json.loads(command(['/usr/bin/sudo','/usr/bin/python3','-B',str(CONTROL/'collect.py'),'case',str(ROOT),RUN,case])['stdout'])
def execute():
 start=time.monotonic();r={'schema':'v116-browser-renderer-host-diagnostic-v1','status':'FAIL','runId':RUN,'applicationStarted':False,'acceptanceEvidence':False,'cases':[],'resourceDifferentialPermitted':False};phase='admission'
 try:
  assert all(absent(n)for n in NAMES)and inventory()==json.loads((ROOT/'input-inventory.json').read_text());write('host-namespaces.json',{'network':os.readlink('/proc/self/ns/net'),'pid':os.readlink('/proc/self/ns/pid')})
  phase='original96';a=run_case('original96',96);r['cases'].append(a)
  r['subsequentResourceChangeAuthorized']=False
  r['status']='DIAGNOSTIC_CAPTURE_COMPLETE_NOT_ACCEPTANCE'
 except BaseException as e:r['firstFailure']={'phase':phase,'class':type(e).__name__,'messageSHA256':hashlib.sha256(str(e).encode()).hexdigest(),'messageBytes':len(str(e).encode())}
 finally:
  signal.signal(signal.SIGTERM,signal.SIG_IGN);signal.signal(signal.SIGINT,signal.SIG_IGN)
  try:r['termination']=terminate()
  except BaseException as e:r['cleanupFailure']=type(e).__name__;r['status']='FAIL_CLEANUP'
  try:assert inventory()==json.loads((ROOT/'input-inventory.json').read_text());r['allInputsPreserved']=True
  except BaseException as e:r['preservationFailure']=type(e).__name__;r['status']='FAIL_PRESERVATION'
  r['elapsedSeconds']=round(time.monotonic()-start,3);write('host-execution.json',r)
 return 0 if r['status']=='DIAGNOSTIC_CAPTURE_COMPLETE_NOT_ACCEPTANCE'else 1
def seal():
 signal.signal(signal.SIGTERM,signal.SIG_IGN);signal.signal(signal.SIGINT,signal.SIG_IGN)
 write('provider-termination.json',terminate());command(['/usr/bin/sudo','/usr/bin/python3','-B',str(CONTROL/'collect.py'),'seal',str(ROOT),RUN],30)
 rows=[];total=0
 for p in sorted(OUT.iterdir()):
  s=p.lstat();assert stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_uid==1001 and s.st_size<=2097152;total+=s.st_size;assert total<=8388608;rows.append({'path':p.name,'bytes':s.st_size,'sha256':sha(p)})
 write('evidence-index.json',{'schema':'v116-browser-renderer-diagnostic-index-v1','runId':RUN,'launchCommit':os.environ['GITHUB_SHA'],'payloads':rows,'maximumTotalBytesIncludingIndex':8388608,'retentionDays':7,'applicationStarted':False,'acceptanceEvidence':False});assert sum(p.stat().st_size for p in OUT.iterdir())<=8388608

def interrupted(n,f):
 global STOP
 STOP=True;raise InterruptedError('HOST_SIGNAL_'+str(n))
if __name__=='__main__':
 signal.signal(signal.SIGTERM,interrupted);signal.signal(signal.SIGINT,interrupted);mode=sys.argv[1:];assert mode in[['prepare'],['execute'],['seal']]
 if mode==['prepare']:
  try:prepare()
  except BaseException as e:write('preparation-failure.json',{'status':'FAIL_BEFORE_BROWSER_START','errorClass':type(e).__name__,'messageSHA256':hashlib.sha256(str(e).encode()).hexdigest()});raise
 elif mode==['execute']:sys.exit(execute())
 else:seal()
