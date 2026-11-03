"""Bounded V62 runtime helpers. Importing this module performs no action."""
import hashlib,json,os,pathlib,re,selectors,signal,stat,subprocess,tempfile,time

CAPABILITIES=['SETUID','SETGID','CHOWN','DAC_OVERRIDE','KILL','SYS_PTRACE']
DEPENDENCIES={
 'node':'node:22.23.2-bookworm-slim@sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9',
 'redis':'redis:7.4.2-alpine@sha256:02419de7eddf55aa5bcf49efb74e88fa8d931b4d77c07eff8a6b2144472b6952',
 'browser':'mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e'}
BACKEND={'file':'backend-6c1e63b-derived-image.tar.gz','bytes':201715406,'sha256':'8aa72fac4c3a99a1b1013f0d30349298616a00dc526d881a6bf0f7f1abe20863','image':'sha256:65382b8f19482851212fe7a21746ca7ad7bf5af5708fec8f083165ac42e61573'}
NODE_SHA='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
NATIVE_SHA='5048f19ec38c708dd1b139f7a3f60cb8eb5e9146cd4fdb6e978caffbcac87a1b'
class Refusal(Exception):pass
def require(ok,code):
 if not ok:raise Refusal(code)
def sha(path):
 with pathlib.Path(path).open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def regular(path):
 p=pathlib.Path(path);s=p.lstat();require(p.is_absolute() and p.resolve()==p and stat.S_ISREG(s.st_mode) and s.st_nlink==1,'CANONICAL_REGULAR_FILE_REQUIRED');return s
def atomic(path,value,exclusive=False):
 path=pathlib.Path(path);path.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
 data=(json.dumps(value,sort_keys=True,separators=(',',':'))+'\n').encode()
 require(len(data)<=1024*1024,'RECEIPT_SIZE_BOUND')
 tmp=path.with_name(path.name+'.pending-'+str(os.getpid()))
 fd=os.open(tmp,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
 try:
  with os.fdopen(fd,'wb') as f:f.write(data);f.flush();os.fsync(f.fileno())
  if exclusive:os.link(tmp,path);tmp.unlink()
  else:os.replace(tmp,path)
  d=os.open(path.parent,os.O_RDONLY|os.O_DIRECTORY);os.fsync(d);os.close(d)
 finally:
  if tmp.exists():tmp.unlink()
 return sha(path)
def pinned_json(path,digest):
 require(re.fullmatch('[a-f0-9]{64}',digest or '') is not None,'EXTERNAL_DIGEST_REQUIRED');regular(path);require(sha(path)==digest,'PINNED_RECEIPT_CHANGED');return json.loads(pathlib.Path(path).read_text())
def configuration(root,cleanup=False):
 root=pathlib.Path(root);require(str(root)=='/vercel/v62' and root.resolve()==root,'CANONICAL_ROOT_REQUIRED')
 c=pinned_json(root/'bootstrap-contract.json',os.environ.get('WORK8_BOOTSTRAP_SHA256'))
 require(c['schema']=='work8-v62-runtime-bootstrap-v1','BOOTSTRAP_SCHEMA')
 require(c['root']==str(root) and re.fullmatch('sbx_[A-Za-z0-9]{8,80}',c['sessionId']) is not None,'BOOTSTRAP_SESSION')
 require(c['teamId']=='team_gdcskAnaJteKW7BYtw8zlSWy' and c['projectId']=='prj_F4UZtqA8mIpIrRaIu2V6LOM664Kr','BOOTSTRAP_ACCOUNT')
 require(c['hostUid']==c['hostGid']==1001 and c['resources']=={'vcpus':8,'memory':16384},'BOOTSTRAP_RESOURCES')
 require(c['timeoutSeconds']==10800 and c['expiresAtEpoch']==c['startedAtEpoch']+10800 and (cleanup or c['expiresAtEpoch']>time.time()+900),'BOOTSTRAP_LIFETIME')
 require(re.fullmatch('work8-v62-a5-[a-z0-9-]{1,40}',c['campaignId']) is not None,'BOOTSTRAP_CAMPAIGN')
 require(c['startedAtEpoch']<=time.time() and isinstance(c['driverManifestSHA256'],str) and re.fullmatch('[a-f0-9]{64}',c['driverManifestSHA256']) is not None,'BOOTSTRAP_START_AND_DRIVER')
 require(c['dependencyImages']==DEPENDENCIES and c['backend']==BACKEND,'BOOTSTRAP_IMAGE_PINS')
 require(0<=c['maximumProspectiveUSD']<=5 and c['newReservationUSD']==5 and c['priorV61HeldUSD']==2.02,'BOOTSTRAP_FINANCIAL_BOUND')
 return c
def network(root,c,mode):
 n=pinned_json(pathlib.Path(root)/'provider-network.json',os.environ.get('WORK8_PROVIDER_NETWORK_SHA256'))
 require(n['schema']=='work8-v62-provider-network-readback-v1' and n['sessionId']==c['sessionId'] and n['providerStatus']=='running','PROVIDER_READBACK_REQUIRED')
 require(n['policy']['mode']==mode and n['observedAtEpoch']<=time.time() and time.time()-n['observedAtEpoch']<=300,'FRESH_NETWORK_MODE_REQUIRED')
 require(re.fullmatch('[a-f0-9]{64}',n['rawProviderResponseSHA256']) is not None,'PROVIDER_RESPONSE_BINDING')
 if mode=='deny-all':require(set(n['policy'])=={'mode'},'DENY_ALL_EXACT')
 return n
def bounded_process(args,env,limit,max_bytes):
 p=subprocess.Popen(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,start_new_session=True)
 result=[bytearray(),bytearray()];deadline=time.monotonic()+limit
 selector=selectors.DefaultSelector()
 for i,stream in enumerate([p.stdout,p.stderr]):os.set_blocking(stream.fileno(),False);selector.register(stream,selectors.EVENT_READ,i)
 try:
  while selector.get_map():
   if time.monotonic()>deadline:raise subprocess.TimeoutExpired(args,limit)
   for key,_ in selector.select(min(.1,max(0,deadline-time.monotonic()))):
    data=os.read(key.fd,65536)
    if not data:selector.unregister(key.fileobj);continue
    require(sum(map(len,result))+len(data)<=max_bytes,'COMMAND_OUTPUT_BOUND');result[key.data].extend(data)
  p.wait(timeout=max(.01,deadline-time.monotonic()))
  return subprocess.CompletedProcess(args,p.returncode,bytes(result[0]),bytes(result[1]))
 except BaseException:
  try:os.killpg(p.pid,signal.SIGKILL)
  except ProcessLookupError:pass
  if p.poll() is None:p.wait(timeout=5)
  raise
 finally:
  selector.close();p.stdout.close();p.stderr.close()
def run(args,root,limit=60,max_bytes=2*1024*1024,expected=(0,)):
 env={'PATH':'/usr/sbin:/usr/bin:/sbin:/bin','DOCKER_HOST':'unix://'+str(pathlib.Path(root)/'docker.sock'),'PYTHONDONTWRITEBYTECODE':'1'}
 p=bounded_process(args,env,limit,max_bytes)
 if p.returncode not in expected:
  a,b=p.stdout,p.stderr
  diagnostic={'schema':'work8-v62-runtime-command-failure-v1','executable':pathlib.Path(args[0]).name,'exitCode':p.returncode,'stdoutBytes':len(a),'stderrBytes':len(b),'stdoutSHA256':hashlib.sha256(a).hexdigest(),'stderrSHA256':hashlib.sha256(b).hexdigest(),'knownErrnos':sorted(set(re.findall(rb'(?<![A-Z_])(?:EACCES|EROFS|EPERM|ENOENT|ENOMEM|ENOSPC|ETIMEDOUT)(?![A-Z_])',a+b))),'rawOutputRetained':False,'diagnosticLimitation':'UNCLASSIFIED_COMMAND_OUTPUT_RETAINED_AS_HASHES_ONLY'}
  diagnostic['knownErrnos']=[x.decode() for x in diagnostic['knownErrnos']];target=pathlib.Path(root)/'runtime-evidence/first-runtime-command-failure.json'
  if not target.exists():atomic(target,diagnostic,exclusive=True)
  raise Refusal('RUNTIME_COMMAND_FAILED_'+str(p.returncode).replace('-','NEG'))
 return p.stdout

def container_options():
 args=['--pull','never','--read-only','--user','0:0','--cap-drop','ALL','--network','none','--memory','256m','--cpus','1','--pids-limit','32','--security-opt','no-new-privileges']
 for cap in CAPABILITIES:args+=['--cap-add',cap]
 return args
def socket_identity(path):
 p=pathlib.Path(path);st=p.lstat()
 require(p.is_absolute() and p.resolve()==p and stat.S_ISSOCK(st.st_mode) and not p.is_symlink() and st.st_uid==0 and st.st_gid==1001 and stat.S_IMODE(st.st_mode)==0o660,'DOCKER_SOCKET_IDENTITY_REFUSED')
 return {'uid':st.st_uid,'gid':st.st_gid,'mode':stat.S_IMODE(st.st_mode),'dev':st.st_dev,'ino':st.st_ino}

def error_receipt(root,stage,exc):
 code=str(exc) if isinstance(exc,Refusal) and re.fullmatch('[A-Z0-9_]{1,100}',str(exc)) else 'RUNTIME_'+type(exc).__name__.upper()
 r={'schema':'work8-v62-runtime-first-failure-v1','stage':stage,'code':code,'errno':getattr(exc,'errno',None),'rawOutputRetained':False,'applicationAcceptance':False}
 p=pathlib.Path(root)/'runtime-evidence/first-runtime-failure.json'
 if not p.exists():atomic(p,r,exclusive=True)
 return r
