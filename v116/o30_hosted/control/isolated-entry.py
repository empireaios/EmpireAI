#!/usr/bin/env python3
"""Fail-closed O30 entry after independently reviewed kernel namespace/cgroup setup."""
import datetime,errno,hashlib,json,os,pathlib,re,resource,selectors,signal,socket,subprocess,sys,time
assert len(sys.argv)==6,'Expected original host net namespace, publication source head, actual host service cgroup root, device and inode'
host_net,publication,expected_cgroup,expected_cgroup_dev,expected_cgroup_ino=sys.argv[1:]
assert re.fullmatch(r'net:\[\d+\]',host_net)and re.fullmatch(r'[a-f0-9]{40}',publication)
assert re.fullmatch(r'/system.slice/v116-o30-[0-9]+\.service',expected_cgroup)
assert expected_cgroup_dev.isdigit()and expected_cgroup_ino.isdigit()and int(expected_cgroup_ino)>0
CONTROL=pathlib.Path('/control');APP=pathlib.Path('/app');OUT=pathlib.Path('/evidence');NODE=pathlib.Path('/node/bin/node')
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def mount(target):
 rows=[line.split()for line in pathlib.Path('/proc/self/mountinfo').read_text().splitlines()]
 matches=[r for r in rows if r[4]==target];assert len(matches)==1,target
 return matches[0]
def cgroup_limit(name,bound):
 raw=(pathlib.Path('/limits')/name).read_text().strip();assert raw.isdigit()and 0<int(raw)<=bound,name+':'+raw;return int(raw)
receipt={'schema':'v116-o30-isolated-entry-v1','startedUTC':now(),'status':'FAIL_CLOSED','publicationHead':publication,'applicationSource':'6c1e63ba20619ee480742fd87dc810ca93152e22','productionAccess':False,'messagesSent':0,'ownerACK':False,'fullCampaignStarted':False}
proc=None;stage='verify-closed-inputs-before-node-import'
try:
 assert sha(NODE)=='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
 assert sha(CONTROL/'technical-authority.json')=='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'
 manifest=json.loads((CONTROL/'operation-inputs.json').read_text())
 assert manifest['schema']=='v116-o30-native-operation-inputs-v1'
 for relative,digest in manifest['controlSHA256'].items():
  assert not pathlib.PurePosixPath(relative).is_absolute()and'..'not in pathlib.PurePosixPath(relative).parts
  assert sha(CONTROL/relative)==digest,relative
 source=json.loads((CONTROL/'source-inputs.json').read_text())
 for relative,digest in source['appSHA256'].items():assert sha(APP/relative)==digest,relative
 for relative,digest in source['controlSHA256'].items():assert sha(CONTROL/relative)==digest,relative
 receipt['operationInputsSHA256']=sha(CONTROL/'operation-inputs.json');receipt['sourceInputsSHA256']=sha(CONTROL/'source-inputs.json')
 stage='verify-read-only-source-empty-sensitive-paths-and-kernel-resource-caps'
 for target in ['/app','/control','/node']:
  assert 'ro'in mount(target)[5].split(','),target
 assert not any(pathlib.Path(p).exists()for p in ['/data','/home/runner','/root/.ssh','/var/run/docker.sock','/run/docker.sock'])
 status=pathlib.Path('/proc/self/status').read_text();assert re.search(r'^CapEff:\s+0+$',status,re.M);assert re.search(r'^NoNewPrivs:\s+1$',status,re.M)
 limits_mount=mount('/limits');assert limits_mount[limits_mount.index('-')+1]=='cgroup2';assert'ro'in limits_mount[5].split(',')
 # cgroup namespaces virtualize mountinfo root text. Bind identity uses the actual
 # host service directory's kernel device/inode, recorded before bwrap, rather
 # than assuming the host pathname remains visible in the private namespace.
 limits_stat=os.stat('/limits');assert(limits_stat.st_dev,limits_stat.st_ino)==(int(expected_cgroup_dev),int(expected_cgroup_ino)),'CGROUP_BIND_KERNEL_OBJECT_MISMATCH'
 assert limits_mount[3]in['/',expected_cgroup],'UNEXPECTED_CGROUP_NAMESPACE_MOUNT_ROOT'
 membership=pathlib.Path('/proc/self/cgroup').read_text().strip();assert membership=='0::/','PRIVATE_CGROUP_NAMESPACE_ROOT_REQUIRED'
 memory=cgroup_limit('memory.max',2147483648);pids=cgroup_limit('pids.max',128)
 assert pathlib.Path('/limits/memory.swap.max').read_text().strip()=='0','SWAP_MUST_BE_DISABLED'
 quota,period=(pathlib.Path('/limits/cpu.max').read_text().split());assert quota.isdigit()and period.isdigit()and 0<int(quota)/int(period)<=2
 tmp=mount('/tmp');assert tmp[tmp.index('-')+1]=='tmpfs';vfs=os.statvfs('/tmp');assert vfs.f_blocks*vfs.f_frsize<=268435456
 receipt['resourceControls']={'memoryMaxBytes':memory,'memorySwapMaxBytes':0,'pidsMax':pids,'cpuMax':[int(quota),int(period)],'tmpfsMaxBytes':vfs.f_blocks*vfs.f_frsize,'effectiveCapabilities':0,'NoNewPrivs':1,'hostServiceCgroup':expected_cgroup,'cgroupDevice':limits_stat.st_dev,'cgroupInode':limits_stat.st_ino,'cgroupMountRoot':limits_mount[3],'membership':membership}
 stage='prove-private-loopback-and-unreachable-external-network'
 own=os.readlink('/proc/self/ns/net');assert own!=host_net
 interfaces=sorted(name for _,name in socket.if_nameindex());assert interfaces==['lo']
 assert len(pathlib.Path('/proc/net/route').read_text().splitlines())==1
 server=socket.socket();server.settimeout(2);server.bind(('127.0.0.1',0));server.listen(1);client=socket.create_connection(server.getsockname(),2);peer,_=server.accept();client.sendall(b'v116-o30');assert peer.recv(32)==b'v116-o30';peer.close();client.close();server.close()
 test=socket.socket();test.settimeout(2)
 try:test.connect(('203.0.113.1',443));raise AssertionError('Unexpected external network')
 except OSError as e:assert e.errno in [errno.ENETUNREACH,errno.EHOSTUNREACH,errno.EPERM,errno.EACCES];external={'errno':e.errno,'name':errno.errorcode[e.errno]}
 finally:test.close()
 receipt['network']={'host':host_net,'private':own,'interfaces':interfaces,'ipv4Routes':0,'loopbackHandshake':True,'externalRefusal':external}
 stage='verify-runtime-binaries-and-launch-actual-probe'
 env={'PATH':'/node/bin:/usr/bin:/bin','LANG':'C.UTF-8','TZ':'UTC','NODE_NO_WARNINGS':'1'}
 assert subprocess.check_output([str(NODE),'--version'],env=env,text=True,timeout=10).strip()=='v22.23.2'
 redisVersion=subprocess.check_output(['/usr/bin/redis-server','--version'],env=env,text=True,timeout=10).strip();assert'v=7.0.15'in redisVersion
 receipt['redis']={'sha256':sha('/usr/bin/redis-server'),'version':redisVersion}
 resource.setrlimit(resource.RLIMIT_CORE,(0,0));resource.setrlimit(resource.RLIMIT_FSIZE,(8388608,8388608));resource.setrlimit(resource.RLIMIT_NOFILE,(256,256))
 command=[str(NODE),'--max-old-space-size=256','/control/native-timing-probe.mjs'];receipt['command']=command
 started=time.monotonic();proc=subprocess.Popen(command,cwd=APP,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True)
 selector=selectors.DefaultSelector();selector.register(proc.stdout,selectors.EVENT_READ);size=0;timed=False;overflow=False
 with(OUT/'probe-console.log').open('xb')as log:
  while selector.get_map():
   if time.monotonic()-started>=870:timed=True;break
   for key,_ in selector.select(0.2):
    chunk=os.read(key.fd,65536)
    if not chunk:selector.unregister(key.fd);continue
    n=min(len(chunk),1048576-size);log.write(chunk[:n]);size+=n
    if n<len(chunk):overflow=True;break
   if overflow:break
  if timed or overflow:
   try:os.killpg(proc.pid,signal.SIGTERM)
   except ProcessLookupError:pass
  try:code=proc.wait(timeout=5)
  except subprocess.TimeoutExpired:timed=True;os.killpg(proc.pid,signal.SIGKILL);code=proc.wait()
 selector.close();proc.stdout.close()
 receipt['execution']={'exitCode':code,'elapsedSeconds':round(time.monotonic()-started,3),'timeoutSeconds':870,'timedOut':timed,'outputCapExceeded':overflow,'consoleBytes':size,'consoleSHA256':sha(OUT/'probe-console.log')}
 assert code==0 and not timed and not overflow
 stage='independently-adjudicate-native-timing-result-and-stopped-processes'
 result=json.loads((OUT/'native-timing-result.json').read_text());assert result['status']=='PASS_SCOPED_REAL_NATIVE_TIMING'
 assert result['allNativeChildrenStopped']and result['redisStopped']and result['fullCampaignOperatingGuardRefused']
 assert len(result['children'])==2
 for child in result['children']:
  assert child['identity']['bootId']==result['bootId']and child['identity']['startTicks']>0
  assert child['progressCount']>0 and child['lastProgress']and child['osStopped']
  assert child['quarantine']['elapsedSinceLastProgressMs']<=child['quarantine']['approvedBoundMs']
  assert child['nativeExit']['elapsedFromOSExitObservationMs']<=30000 and child['finalExitSignal']=='SIGKILL'
 receipt['nativeResultSHA256']=sha(OUT/'native-timing-result.json');receipt['assertions']=result['assertions'];receipt['status']='PASS_SCOPED_NATIVE_TIMING_ENTRY'
except BaseException as error:receipt['firstFailure']={'stage':stage,'type':type(error).__name__,'message':str(error)}
finally:
 if proc:
  try:os.killpg(proc.pid,signal.SIGKILL)
  except ProcessLookupError:pass
  if proc.poll()is None:proc.wait(timeout=5)
 receipt['finishedUTC']=now();(OUT/'isolated-entry-result.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'status':receipt['status'],'firstFailure':receipt.get('firstFailure')}),flush=True)
sys.exit(0 if receipt['status']=='PASS_SCOPED_NATIVE_TIMING_ENTRY'else 1)
