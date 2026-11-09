#!/usr/bin/env python3
"""One controller invocation with a hard examination deadline and cleanup grace."""
import argparse,hashlib,json,os,pathlib,re,selectors,signal,subprocess,sys,time
sys.dont_write_bytecode=True
from runtime_common import configuration,regular,require,Refusal,atomic
LIMITS={'preflight':900,'full':1500}
CLEANUP=600
EXPORT=2400
MARGIN=60

def remaining_gate(c,phase,now=None):
 require(phase in LIMITS,'CONTROLLER_PHASE_REFUSED')
 require(c['expiresAtEpoch']-(time.time() if now is None else now)>LIMITS[phase]+CLEANUP+EXPORT+MARGIN+(LIMITS['full'] if phase=='preflight' else 0),'CONTROLLER_LIFETIME_RESERVE_REFUSED')

class NativeFailureCapture:
 """Bounded stream framing; retain only the caller's allowlisted projection."""
 PREFIX=b'WORK8_NATIVE_FIRST_FAILURE '
 MAX_LINE=16384
 def __init__(self,sanitizer):
  self.sanitizer=sanitizer;self.buffers={};self.discarding=set();self.first=None
 def feed(self,stream,data):
  if self.first is not None or self.sanitizer is None:return False
  buffer=self.buffers.setdefault(stream,bytearray())
  for part in data.splitlines(keepends=True):
   ended=part.endswith(b'\n')
   if stream in self.discarding:
    if ended:self.discarding.remove(stream)
    continue
   if len(buffer)+len(part)>self.MAX_LINE:
    buffer.clear()
    if not ended:self.discarding.add(stream)
    continue
   buffer.extend(part)
   if not ended:continue
   line=bytes(buffer);buffer.clear()
   if not line.startswith(self.PREFIX):continue
   try:
    value=self.sanitizer(json.loads(line[len(self.PREFIX):].decode('utf-8')))
    canonical=json.dumps(value,sort_keys=True,separators=(',',':')).encode('utf-8')
    if (not isinstance(value,dict) or value.get('schema')!='work8-v31-native-first-failure-v1'
        or value.get('firstFailure') is not True or value.get('rawErrorOrRecordsRetained') is not False
        or len(canonical)>self.MAX_LINE):continue
    self.first=json.loads(canonical);self.buffers.clear();self.discarding.clear();return True
   except Exception:pass # A diagnostic projection must not replace the process cause.
  return False

def supervise(args,env,seconds,cleanup_seconds=CLEANUP,native_sanitizer=None):
 p=subprocess.Popen(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,start_new_session=True)
 selector=selectors.DefaultSelector()
 for stream in [p.stdout,p.stderr]:os.set_blocking(stream.fileno(),False);selector.register(stream,selectors.EVENT_READ)
 digest=hashlib.sha256();count=0;start=time.monotonic();cause=None;interrupted=None;requested=False;forced=False
 capture=NativeFailureCapture(native_sanitizer);sequence=0;native_sequence=None;supervisor_sequence=None
 def signal_group(sig):
  try:os.killpg(p.pid,sig)
  except ProcessLookupError:pass
 def request(*_):
  nonlocal requested;requested=True
 old={s:signal.signal(s,request) for s in [signal.SIGINT,signal.SIGTERM]}
 try:
  while selector.get_map() or p.poll() is None:
   now=time.monotonic()
   if interrupted is None and (requested or now-start>=seconds or count>2*1024*1024):
    cause='EXTERNAL_TERMINATION' if requested else 'CONTROLLER_STAGE_DEADLINE' if now-start>=seconds else 'CONTROLLER_OUTPUT_BOUND';interrupted=now
    sequence+=1;supervisor_sequence=sequence
    signal_group(signal.SIGINT)
   if interrupted is not None and (now-interrupted>=cleanup_seconds or count>4*1024*1024):
    signal_group(signal.SIGKILL);forced=True
    if p.poll() is None:p.wait(timeout=5)
    break
   for key,_ in selector.select(.1):
    data=os.read(key.fd,65536)
    if not data:selector.unregister(key.fileobj);continue
    count+=len(data);digest.update(data)
    if capture.feed(key.fd,data):sequence+=1;native_sequence=sequence
  p.wait(timeout=5)
  first_kind=('NATIVE_DIAGNOSTIC' if supervisor_sequence is None or native_sequence is not None and native_sequence<supervisor_sequence else 'SUPERVISOR') if native_sequence is not None or supervisor_sequence is not None else None
  return {'controllerExitCode':p.returncode,'firstSupervisorCause':cause,'firstNativeFailure':capture.first,'firstObservedFailureKind':first_kind,'nativeFailureObservationSequence':native_sequence,'supervisorCauseObservationSequence':supervisor_sequence,'observationOrderOnly':True,'forcedKill':forced,'stdoutAndStderrBytes':count,'combinedOutputSHA256':digest.hexdigest(),'rawOutputRetained':False,'elapsedSeconds':round(time.monotonic()-start,3),'cleanupGraceSeconds':cleanup_seconds,'requiresImmediateRuntimeCleanup':bool(cause) or p.returncode!=0}
 finally:
  if p.poll() is None:signal_group(signal.SIGKILL);p.wait(timeout=5)
  selector.close();p.stdout.close();p.stderr.close()
  for sig,handler in old.items():signal.signal(sig,handler)

def launch(root,phase):
 root=pathlib.Path(root);c=configuration(root);require(os.getuid()==os.geteuid()==1001 and os.getgid()==os.getegid()==1001,'CONTROLLER_HOST_IDENTITY_REFUSED');remaining_gate(c,phase)
 require(os.environ.get('WORK8_SANDBOX_ID')==c['sessionId'],'CONTROLLER_SESSION_BINDING_REFUSED')
 require(os.environ.get('DOCKER_HOST')=='unix://'+str(root/'docker.sock'),'CONTROLLER_DAEMON_BINDING_REFUSED')
 keys=['WORK8_SANDBOX_ID','WORK8_RUN_CONTRACT_SHA256','WORK8_SOURCE_REVIEW_SHA256','WORK8_EXECUTOR_REVIEW_SHA256']+(['WORK8_PREFLIGHT_REVIEW_SHA256'] if phase=='full' else [])
 for key in keys[1:]:require(re.fullmatch('[a-f0-9]{64}',os.environ.get(key,'')) is not None,'CONTROLLER_EXTERNAL_RECEIPT_PIN_REQUIRED')
 receipt=root/('controller-supervisor-'+phase+'.json');attempt=root/('controller-supervisor-'+phase+'-attempt.json');require(not receipt.exists() and not attempt.exists(),'CONTROLLER_SUPERVISOR_ALREADY_ATTEMPTED')
 script=root/'controller/scripts/work8/native-transition/run-native-examination.py';regular(script)
 env={key:os.environ[key] for key in keys};env.update(PATH=str(root/'bin')+':/usr/sbin:/usr/bin:/sbin:/bin',DOCKER_HOST=os.environ['DOCKER_HOST'],PYTHONDONTWRITEBYTECODE='1',WORK8_EXECUTION_ROOT=str(root))
 atomic(attempt,{'schema':'work8-v62-controller-supervisor-attempt-v1','sessionId':c['sessionId'],'phase':phase,'stageSeconds':LIMITS[phase],'cleanupGraceSeconds':CLEANUP,'startedAtEpoch':time.time()},exclusive=True)
 observed=supervise(['/usr/bin/python3','-B',str(script),'--preflight-v62-native-brain' if phase=='preflight' else '--examine-v62-native-brain'],env,LIMITS[phase])
 value={'schema':'work8-v62-controller-supervisor-v1','phase':phase,'sessionId':c['sessionId'],'status':'CONTROLLER_EXITED_ZERO_REQUIRES_INDEPENDENT_REVIEW' if observed['controllerExitCode']==0 and not observed['firstSupervisorCause'] else 'FAIL_CLOSED','wholeRowsAccepted':[],**observed};atomic(receipt,value,exclusive=True);return value

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--root',required=True);p.add_argument('--phase',choices=list(LIMITS),required=True);a=p.parse_args()
 try:
  result=launch(a.root,a.phase);print(json.dumps(result,sort_keys=True));raise SystemExit(0 if result['status']=='CONTROLLER_EXITED_ZERO_REQUIRES_INDEPENDENT_REVIEW' else 13)
 except Refusal as error:print(json.dumps({'schema':'work8-v62-controller-supervisor-refusal-v1','code':str(error),'rawOutputRetained':False}));raise SystemExit(13)
