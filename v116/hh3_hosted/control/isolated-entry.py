#!/usr/bin/env python3
"""Fail-closed HH3 entry after independently reviewed kernel namespace/cgroup setup."""
import datetime,errno,hashlib,json,os,pathlib,re,resource,selectors,signal,socket,subprocess,sys,time
assert len(sys.argv)==6,'Expected original host net namespace, publication source head, actual host service cgroup root, device and inode'
host_net,publication,expected_cgroup,expected_cgroup_dev,expected_cgroup_ino=sys.argv[1:]
assert re.fullmatch(r'net:\[\d+\]',host_net)and re.fullmatch(r'[a-f0-9]{40}',publication)
assert re.fullmatch(r'/system.slice/v116-hh3-[0-9]+\.service',expected_cgroup)
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
receipt={'schema':'v116-hh3-isolated-entry-v1','startedUTC':now(),'status':'FAIL_CLOSED','publicationHead':publication,'applicationSource':'6c1e63ba20619ee480742fd87dc810ca93152e22','productionAccess':False,'messagesSent':0,'ownerACK':False,'fullCampaignStarted':False,'originalHH3Scope':'HH3_COMPILED_COORDINATOR_ONLY','originalFiveSecondHoldChanged':False,'wholeQ5Accepted':False}
proc=None;stage='verify-closed-inputs-before-node-import'
try:
 assert sha(NODE)=='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
 assert sha(CONTROL/'technical-authority.json')=='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'
 manifest=json.loads((CONTROL/'operation-inputs.json').read_text())
 assert manifest['schema']=='v116-hh3-original-operation-inputs-v1'
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
 memory=cgroup_limit('memory.max',3221225472);pids=cgroup_limit('pids.max',256)
 assert pathlib.Path('/limits/memory.swap.max').read_text().strip()=='0','SWAP_MUST_BE_DISABLED'
 quota,period=(pathlib.Path('/limits/cpu.max').read_text().split());assert quota.isdigit()and period.isdigit()and 0<int(quota)/int(period)<=2
 tmp=mount('/tmp');assert tmp[tmp.index('-')+1]=='tmpfs';vfs=os.statvfs('/tmp');assert vfs.f_blocks*vfs.f_frsize<=536870912
 receipt['resourceControls']={'memoryMaxBytes':memory,'memorySwapMaxBytes':0,'pidsMax':pids,'cpuMax':[int(quota),int(period)],'tmpfsMaxBytes':vfs.f_blocks*vfs.f_frsize,'effectiveCapabilities':0,'NoNewPrivs':1,'hostServiceCgroup':expected_cgroup,'cgroupDevice':limits_stat.st_dev,'cgroupInode':limits_stat.st_ino,'cgroupMountRoot':limits_mount[3],'membership':membership}
 stage='prove-private-loopback-and-unreachable-external-network'
 own=os.readlink('/proc/self/ns/net');assert own!=host_net
 interfaces=sorted(name for _,name in socket.if_nameindex());assert interfaces==['lo']
 assert len(pathlib.Path('/proc/net/route').read_text().splitlines())==1
 server=socket.socket();server.settimeout(2);server.bind(('127.0.0.1',0));server.listen(1);client=socket.create_connection(server.getsockname(),2);peer,_=server.accept();client.sendall(b'v116-hh3');assert peer.recv(32)==b'v116-hh3';peer.close();client.close();server.close()
 test=socket.socket();test.settimeout(2)
 try:test.connect(('203.0.113.1',443));raise AssertionError('Unexpected external network')
 except OSError as e:assert e.errno in [errno.ENETUNREACH,errno.EHOSTUNREACH,errno.EPERM,errno.EACCES];external={'errno':e.errno,'name':errno.errorcode[e.errno]}
 finally:test.close()
 receipt['network']={'host':host_net,'private':own,'interfaces':interfaces,'ipv4Routes':0,'loopbackHandshake':True,'externalRefusal':external}
 stage='verify-runtime-binaries-and-launch-original-three-case-coordinator'
 env={'PATH':'/node/bin:/usr/bin:/bin','LANG':'C.UTF-8','TZ':'UTC','NODE_NO_WARNINGS':'1','HH3_SOURCE':'6c1e63ba20619ee480742fd87dc810ca93152e22'}
 assert subprocess.check_output([str(NODE),'--version'],env=env,text=True,timeout=10).strip()=='v22.23.2'
 redisVersion=subprocess.check_output(['/usr/bin/redis-server','--version'],env=env,text=True,timeout=10).strip();assert 'v=7.0.15' in redisVersion
 receipt['redis']={'sha256':sha('/usr/bin/redis-server'),'version':redisVersion}
 resource.setrlimit(resource.RLIMIT_CORE,(0,0));resource.setrlimit(resource.RLIMIT_FSIZE,(16777216,16777216));resource.setrlimit(resource.RLIMIT_NOFILE,(512,512))
 command=[str(NODE),'/app/scripts/work8/hh3-compiled-coordinator.mjs'];receipt['command']=command
 from bounded_execution import run
 execution=run(command,cwd=APP,env=env,logfile=OUT/'coordinator-console.log',childlogs=[OUT/mode/'child.log'for mode in ['timeout','observer-error','invalidate-error']],seconds=540)
 receipt['execution']=execution
 assert execution['exitCode']==0 and not execution['timedOut'] and not execution['consoleCapExceeded'] and not execution['childLogCapExceeded']
 stage='adjudicate-exact-original-three-case-receipts-and-termination'
 cases=[]
 for mode in ['timeout','observer-error','invalidate-error']:
  result=json.loads((OUT/mode/'receipt.json').read_text());cleanup=json.loads((OUT/mode/'process-cleanup.json').read_text())
  assert result['source']==source['sourceCommit'] and result['mode']==mode and result['scope']=='HH3_COMPILED_COORDINATOR_ONLY'
  assert result['fullDomainRecovery'] is False and result['protectedCustody'] is False
  if mode=='invalidate-error':
   assert result['primaryHeld'] and result['redisHeld'] and result['nativeHeld'] and result['settled'] is False and result['requiresExternalTermination']
  else:
   assert result['manifestInvalidated'] and result['primaryReleased'] and result['redisReleased'] and result['nativeReleased']
   assert ('HELD_EPOCH_EXPIRED' if mode=='timeout' else 'HH3_LABELLED_OBSERVER_FAILURE') in result['error']
  assert cleanup['source']==source['sourceCommit'] and cleanup['mode']==mode and cleanup['signal']=='SIGKILL'
  assert cleanup['remainingLive']==0 and cleanup['observedIdentitySurvivors']==0 and cleanup['group']!=cleanup['controllerGroup']
  assert cleanup['observed'] and all(isinstance(x['pid'],int) and x['pid']>0 and str(x['start']).isdigit() for x in cleanup['observed'])
  assert result['events'].count('primary-enter')==1
  if mode=='invalidate-error':assert 'primary-release' not in result['events']
  else:assert result['events'].count('primary-release')==1
  cases.append({'mode':mode,'resultSHA256':sha(OUT/mode/'receipt.json'),'cleanupSHA256':sha(OUT/mode/'process-cleanup.json'),'result':result,'cleanup':cleanup})
 for relative,digest in source['appSHA256'].items():assert sha(APP/relative)==digest,relative
 receipt['cases']=cases;receipt['sourceBytesUnchanged']=True;receipt['status']='PASS_ORIGINAL_HH3_THREE_CASES'
except BaseException as error:receipt['firstFailure']={'stage':stage,'type':type(error).__name__,'message':str(error)}
finally:
 if proc:
  if proc.poll() is None:
   try:os.killpg(proc.pid,signal.SIGKILL)
   except ProcessLookupError:pass
   proc.wait(timeout=5)
 receipt['finishedUTC']=now();(OUT/'isolated-entry-result.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'status':receipt['status'],'firstFailure':receipt.get('firstFailure')}),flush=True)
sys.exit(0 if receipt['status']=='PASS_ORIGINAL_HH3_THREE_CASES'else 1)
