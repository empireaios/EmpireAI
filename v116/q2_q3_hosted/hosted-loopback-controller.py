#!/usr/bin/env python3
"""Three allowlisted technical phases inside a reviewed private bwrap namespace.
Not a namespace creator: fails closed unless mount/network isolation is demonstrated.
"""
import datetime,errno,hashlib,json,os,pathlib,re,selectors,signal,socket,subprocess,sys,tempfile,time

APP=pathlib.Path('/app');CONTROL=pathlib.Path('/control');EVIDENCE=pathlib.Path('/evidence')
NODE=pathlib.Path('/node/bin/node');REDIS=pathlib.Path('/usr/bin/redis-server')
AUTH_SHA='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'
NODE_SHA='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
GUARD_SHA='ec0edaf624414ceb0a631f7fef967d93915d6e48aad466f2dea101416f6bcdf4'
NAMES=['actual app recovery entrypoint composes inherited primary IPC, local fences and real Redis','concurrent runtime writers capture with actual pending missions then replay once while restored Redis stays fenced']
assert len(sys.argv)==4,'phase host-net-namespace exact-source-head required'
phase,host_net,expected_head=sys.argv[1:]
assert phase in ['capture','reasoning-admission','response-delivery']
assert re.fullmatch(r'net:\[\d+\]',host_net) and re.fullmatch(r'[a-f0-9]{40}',expected_head)
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def mounted_ro(target):
 rows=[line.split() for line in pathlib.Path('/proc/self/mountinfo').read_text().splitlines()]
 return any(row[4]==target and 'ro'in row[5].split(',') for row in rows)
output=EVIDENCE/phase;output.mkdir(mode=0o700) # no overwrite / no duplicate phase
receipt={'schema':'v116-hosted-private-loopback-phase-v1','phase':phase,'startedUTC':now(),'status':'FAIL_CLOSED','sourceHead':expected_head,'nativeOwnerAcceptance':False,'productionAccess':False,'externalProviderEffects':0,'newCommitmentRecordedBy':'root ledger only'}
policy=None;proc=None;temporary=None
def run_bounded(command,cwd,env,limit,logpath,maximum):
 global proc
 proc=subprocess.Popen(command,cwd=cwd,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True)
 started=time.monotonic();size=0;timed_out=False;overflow=False
 selector=selectors.DefaultSelector();selector.register(proc.stdout,selectors.EVENT_READ)
 try:
  with logpath.open('wb')as log:
   while selector.get_map():
    if time.monotonic()-started>=limit:timed_out=True;break
    for key,_ in selector.select(timeout=min(0.2,max(0,limit-(time.monotonic()-started)))):
     chunk=os.read(key.fd,65536)
     if not chunk:selector.unregister(key.fd);continue
     allowed=min(len(chunk),maximum-size);log.write(chunk[:allowed]);size+=allowed
     if allowed<len(chunk):overflow=True;break
    if overflow:break
   if timed_out or overflow:
    try:os.killpg(proc.pid,signal.SIGTERM)
    except ProcessLookupError:pass
   try:code=proc.wait(timeout=5)
   except subprocess.TimeoutExpired:
    timed_out=True;os.killpg(proc.pid,signal.SIGKILL);code=proc.wait()
 finally:
  selector.close();proc.stdout.close()
  try:os.killpg(proc.pid,signal.SIGKILL)
  except ProcessLookupError:pass
 return {'exitCode':code,'timedOut':timed_out,'outputCapExceeded':overflow,'outputBytes':size,'elapsedSeconds':round(time.monotonic()-started,3)}
try:
 receipt['stage']='verify-read-only-mounts-and-absent-sensitive-paths'
 assert mounted_ro('/app') and mounted_ro('/control'),'Read-only source/control mounts required'
 assert not any(pathlib.Path(p).exists() for p in ['/data','/home/runner','/root/.ssh','/var/run/docker.sock','/run/docker.sock']),'Host/production-sensitive paths exposed'
 receipt['stage']='verify-actual-v116-authority-payload';assert sha(CONTROL/'authority.json')==AUTH_SHA
 receipt['stage']='verify-exact-node-binary';assert sha(NODE)==NODE_SHA
 receipt['stage']='verify-unchanged-application-owner-write-guard';assert sha(APP/'backend/src/runtime/owner-write-restriction.ts')==GUARD_SHA
 receipt['stage']='verify-input-manifest-schema'
 manifest=json.loads((CONTROL/'hosted-inputs.json').read_text())
 assert manifest['schema']=='v116-hosted-q2-q3-inputs-v1'
 assert manifest['authoritySHA256']==AUTH_SHA
 for relative,digest in manifest['sourceSHA256'].items():
  receipt['stage']='verify-source-bytes:'+relative
  assert not pathlib.PurePosixPath(relative).is_absolute() and '..'not in pathlib.PurePosixPath(relative).parts
  assert sha(APP/relative)==digest,relative
 receipt['stage']='verify-policy-probe-bytes';assert sha(CONTROL/'hosted-policy-probe.mjs')==manifest['policyProbeSHA256']
 receipt['stage']='verify-private-network-namespace-and-routes'
 own_net=os.readlink('/proc/self/ns/net');assert own_net!=host_net
 interfaces=sorted(name for _,name in socket.if_nameindex());assert interfaces==['lo'],interfaces
 routes=pathlib.Path('/proc/net/route').read_text().splitlines();assert len(routes)==1,'Unexpected IPv4 route'
 ipv6=pathlib.Path('/proc/net/ipv6_route')
 if ipv6.exists():
  for line in ipv6.read_text().splitlines(): assert line.split()[-1]=='lo','Unexpected IPv6 interface'
 receipt['stage']='prove-private-loopback-handshake'
 server=socket.socket(socket.AF_INET,socket.SOCK_STREAM);server.settimeout(2);server.bind(('127.0.0.1',0));server.listen(1)
 client=socket.create_connection(server.getsockname(),2);peer,_=server.accept();client.sendall(b'v116-private-loopback');assert peer.recv(128)==b'v116-private-loopback';peer.close();client.close();server.close()
 receipt['stage']='prove-kernel-external-network-refusal';external=socket.socket();external.settimeout(2)
 try:
  external.connect(('203.0.113.1',443));raise AssertionError('External network unexpectedly reachable')
 except OSError as error:
  assert error.errno in [errno.ENETUNREACH,errno.EHOSTUNREACH,errno.EPERM,errno.EACCES],repr(error)
  network_error={'errno':error.errno,'name':errno.errorcode[error.errno]}
 finally:external.close()
 receipt['isolation']={'hostNet':host_net,'privateNet':own_net,'interfaces':interfaces,'ipv4Routes':len(routes)-1,'loopbackHandshake':True,'externalRefusal':network_error,'applicationReadOnly':True,'controlReadOnly':True,'hostSensitivePathsAbsent':True}
 env={'PATH':'/node/bin:/usr/bin:/bin','LANG':'C.UTF-8','TZ':'UTC','NODE_NO_WARNINGS':'1','NODE_ENV':'test','LOG_LEVEL':'fatal','EMPIRE_ENGINEERING_TEST_MODE':'true','REDIS_OPTIONAL':'true','PILLOW_TEST_REDIS_SERVER':str(REDIS),'GIT_CONFIG_COUNT':'1','GIT_CONFIG_KEY_0':'safe.directory','GIT_CONFIG_VALUE_0':'/app'}
 receipt['stage']='verify-node-git-head-and-redis-runtime-identities'
 assert subprocess.check_output([str(NODE),'--version'],env=env,text=True,timeout=10).strip()=='v22.23.2'
 actual_head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=APP,env=env,text=True,timeout=10).strip();assert actual_head==expected_head
 redis_version=subprocess.check_output([str(REDIS),'--version'],env=env,text=True,timeout=10).strip();assert 'v=7.0.15'in redis_version
 receipt['inputs']={'authoritySHA256':AUTH_SHA,'manifestSHA256':sha(CONTROL/'hosted-inputs.json'),'nodeSHA256':sha(NODE),'redisSHA256':sha(REDIS),'redisVersion':redis_version,'guardSHA256':GUARD_SHA,'sourceHead':actual_head}
 limit=360 if phase=='capture' else 900
 receipt['stage']='create-temporary-authorized-technical-policy-after-isolation'
 temporary=pathlib.Path(tempfile.mkdtemp(prefix='v116-'+phase+'-',dir='/tmp'));temporary.chmod(0o700)
 policy=temporary/'technical-policy.json'
 payload={'schema':1,'mode':'RELEASED','approvalSha256':AUTH_SHA,'expiresAt':(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(seconds=limit+60)).isoformat()}
 fd=os.open(policy,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
 with os.fdopen(fd,'w')as handle:json.dump(payload,handle)
 stat=policy.stat();assert stat.st_uid==os.getuid() and stat.st_nlink==1 and stat.st_mode&0o777==0o600
 receipt['policy']={'sha256':sha(policy),'uid':stat.st_uid,'mode':'0600','scope':'Isolated technical CI only','expiresAt':payload['expiresAt'],'afterKernelIsolationProof':True}
 env.update({'TMPDIR':str(temporary),'EMPIRE_OWNER_WRITE_POLICY':str(policy),'V116_TECHNICAL_TEST_ROOT':str(temporary),'DATABASE_PATH':str(temporary/'brain.db'),'RAILWAY_VOLUME_MOUNT_PATH':str(temporary),'SHADOW_CEO_DATA_DIR':str(temporary/'shadow')})
 receipt['stage']='execute-policy-denial-and-release-controls'
 probe=run_bounded([str(NODE),'--import','/app/backend/node_modules/tsx/dist/loader.mjs','/control/hosted-policy-probe.mjs'],APP/'backend',env,30,output/'policy-controls.log',65536)
 assert probe['exitCode']==0 and not probe['timedOut'] and not probe['outputCapExceeded']
 control=json.loads((output/'policy-controls.log').read_text().strip());assert control['pass'] and len(control['checks'])==6
 receipt['policyControls']=control
 if phase=='capture':
  pattern='|'.join('(?:'+re.escape(x)+')'for x in NAMES)
  command=[str(NODE),'--import','tsx','--test','--test-concurrency=1','--test-reporter=tap','--test-name-pattern',pattern,'src/validation/tests/capture-shared-brain-redis.test.ts'];cwd=APP/'backend'
 else:
  command=[str(NODE),'--import','/app/backend/node_modules/tsx/dist/loader.mjs','/app/backend/scripts/'+phase+'-full-path.mjs',str(output/'corpus-result.json')];cwd=APP
 receipt['command']=command;receipt['cwd']=str(cwd);receipt['timeoutSeconds']=limit
 baseline_pids={p.name for p in pathlib.Path('/proc').iterdir() if p.name.isdigit()}
 receipt['stage']='execute-exact-allowlisted-phase:'+phase
 receipt.update(run_bounded(command,cwd,env,limit,output/'execution.log',2*1024*1024))
 receipt['executionLogSHA256']=sha(output/'execution.log')
 assert receipt['exitCode']==0 and not receipt['timedOut'] and not receipt['outputCapExceeded'],'Phase process failed, exceeded deadline or exceeded bounded output'
 receipt['stage']='adjudicate-exact-phase-result-counts-and-fences'
 if phase=='capture':
  content=(output/'execution.log').read_text();counts={k:int(v)for k,v in re.findall(r'^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$',content,re.M)}
  assert counts=={'tests':2,'pass':2,'fail':0,'cancelled':0,'skipped':0,'todo':0},counts
  for name in NAMES:assert re.search(r'^ok \d+ - '+re.escape(name)+r'$',content,re.M),name
  receipt['TAPCounts']=counts;receipt['exactSelectedNames']=NAMES
 else:
  assert (output/'corpus-result.json').stat().st_size<=1024*1024
  result=json.loads((output/'corpus-result.json').read_text());expected=1950 if phase=='reasoning-admission' else 1381
  assert result['result']=='PASS' and result['cases']>=expected and result['limited']is False
  for key in ['effectCalls','externalConnections','paidInference']:assert result[key]==0,key
  assert result['productionStorageAccess']is False and result['ownerAcceptance']=='PENDING'
  assert result['liveEffectRouteLocks']==7 and result['modelWriteToolDenied']is True and result['missingConstitutionIncomplete']is True
  if phase=='response-delivery':
   for key in ['ownerVisibleRelease','transcriptPreserved','retrievalRepeatPreserved']:assert result[key]is True,key
   assert result['deniedOutputCount']>0
  receipt['corpusResult']=result;receipt['corpusResultSHA256']=sha(output/'corpus-result.json')
 receipt['stage']='verify-no-surviving-new-processes'
 remaining={p.name for p in pathlib.Path('/proc').iterdir() if p.name.isdigit()}-baseline_pids
 receipt['remainingNewPIDs']=sorted(remaining);assert not remaining,'Unexpected surviving processes; namespace teardown required'
 receipt['stage']='complete-scoped-technical-phase';receipt['status']='PASS_SCOPED_TECHNICAL_PHASE'
except BaseException as error:
 receipt['firstFailure']={'stage':receipt.get('stage'),'type':type(error).__name__,'message':str(error)}
finally:
 if proc and proc.poll()is None:
  try:os.killpg(proc.pid,signal.SIGKILL)
  except ProcessLookupError:pass
  proc.wait()
 if policy and policy.exists():policy.unlink()
 receipt['policyRemoved']=policy is None or not policy.exists();receipt['finishedUTC']=now()
 encoded=json.dumps(receipt,indent=2)+'\n'
 if len(encoded.encode())>1024*1024:
  receipt={'schema':'v116-hosted-private-loopback-phase-v1','phase':phase,'status':'FAIL_CLOSED','firstFailure':{'type':'ReceiptSizeLimit','message':'Receipt exceeded1MiB; bounded logs preserved'},'unwrittenReceiptSHA256':hashlib.sha256(encoded.encode()).hexdigest(),'policyRemoved':receipt['policyRemoved']};encoded=json.dumps(receipt,indent=2)+'\n'
 (output/'receipt.json').write_text(encoded)
 print(json.dumps({'phase':phase,'status':receipt['status'],'receiptSHA256':sha(output/'receipt.json'),'policyRemoved':receipt['policyRemoved'],'firstFailure':receipt.get('firstFailure')}),flush=True)
sys.exit(0 if receipt['status']=='PASS_SCOPED_TECHNICAL_PHASE' else 1)
