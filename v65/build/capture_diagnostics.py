"""Bounded named capture with sanitized first-error receipts; no raw logs exported."""
import hashlib,json,os,pathlib,re,selectors,signal,subprocess,time

MAX_STREAM=131072
class CaptureFailure(Exception):
 def __init__(self,receipt):self.receipt=receipt;super().__init__(receipt['code'])

def failure_fields(error):
 assert isinstance(error,CaptureFailure),'CAPTURE_FAILURE_REQUIRED'
 keys=('commandLabel','exitCode','stdoutBytes','stderrBytes','stdoutSHA256','stderrSHA256','knownDiagnosticCodes','errorClass','streamComplete','maximumStreamBytes','maximumSeconds','stopCause','errno')
 return {key:error.receipt[key] for key in keys if key in error.receipt}

def atomic(path,value,exclusive=False):
 path=pathlib.Path(path);path.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
 data=(json.dumps(value,sort_keys=True,separators=(',',':'))+'\n').encode();assert len(data)<=32768,'CAPTURE_RECEIPT_BOUND'
 temporary=path.with_name(path.name+'.partial-'+str(os.getpid()))
 with temporary.open('xb') as out:out.write(data);out.flush();os.fsync(out.fileno())
 temporary.chmod(0o600)
 if exclusive:os.link(temporary,path);temporary.unlink()
 else:os.replace(temporary,path)

def capture(argv,cwd,env,*,label,receipts,seconds=30,maximum_stream_bytes=MAX_STREAM,maximum_seconds=30,plain_diagnostic_codes=False):
 assert re.fullmatch('[a-z0-9-]{1,100}',label),'CAPTURE_FIXED_LABEL_REQUIRED'
 assert type(maximum_seconds) is int and 0<maximum_seconds<=1800 and 0<seconds<=maximum_seconds,'CAPTURE_DEADLINE_BOUND'
 assert type(maximum_stream_bytes) is int and 0<maximum_stream_bytes<=128*1024**2,'CAPTURE_STREAM_BOUND'
 receipts=pathlib.Path(receipts);receipts.mkdir(mode=0o700,parents=True,exist_ok=True)
 buffers=[bytearray(),bytearray()];hashes=[hashlib.sha256(),hashlib.sha256()];counts=[0,0]
 selector=selectors.DefaultSelector();started=time.monotonic();stop=None;proc=None;complete=True
 try:
  proc=subprocess.Popen(argv,cwd=cwd,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
  for index,stream in enumerate((proc.stdout,proc.stderr)):
   os.set_blocking(stream.fileno(),False);selector.register(stream,selectors.EVENT_READ,index)
  while selector.get_map():
   if time.monotonic()-started>=seconds:stop='CAPTURE_TIMEOUT';complete=False;break
   for key,_ in selector.select(.05):
    chunk=os.read(key.fd,16384)
    if not chunk:selector.unregister(key.fileobj);continue
    index=key.data;counts[index]+=len(chunk);hashes[index].update(chunk)
    if counts[index]>=maximum_stream_bytes:stop='CAPTURE_OUTPUT_BOUND';complete=False;break
    buffers[index].extend(chunk)
   if stop:break
  if stop:
   try:os.killpg(proc.pid,signal.SIGKILL)
   except ProcessLookupError:pass
  proc.wait(timeout=5 if stop else max(.001,seconds-(time.monotonic()-started)))
  if not stop and proc.returncode!=0:stop='CAPTURE_COMMAND_NONZERO'
 except subprocess.TimeoutExpired:
  stop='CAPTURE_TIMEOUT';complete=False
 except OSError as exc:
  stop='CAPTURE_OS_ERROR';complete=False;os_errno=exc.errno
 finally:
  if proc and proc.poll() is None:
   try:os.killpg(proc.pid,signal.SIGKILL)
   except ProcessLookupError:pass
   proc.wait(timeout=5)
  selector.close()
  if proc:
   proc.stdout.close();proc.stderr.close()
 codes=[];error_class=None
 for line in bytes(buffers[1]).splitlines():
  try:row=json.loads(line)
  except (ValueError,UnicodeDecodeError):continue
  if not isinstance(row,dict) or row.get('schema')!='work8-v65-named-probe-error-v1':continue
  code=row.get('code')
  if isinstance(code,str) and re.fullmatch('(?:ERR_[A-Z0-9_]{1,80}|MODULE_NOT_FOUND|E[A-Z]{1,30})',code):codes.append(code)
  if row.get('errorClass') in ('Error','TypeError','RangeError','SyntaxError','ReferenceError'):error_class=row['errorClass']
 codes=sorted(set(codes))[:16]
 if plain_diagnostic_codes:
  fixed=re.findall(rb'(?<![A-Z0-9_])(?:TS[0-9]{3,6}|EACCES|EROFS|EPERM|ENOENT|ENOMEM|ENOSPC|ETIMEDOUT)(?![A-Z0-9_])',bytes(buffers[0])+bytes(buffers[1]))
  codes=sorted(set(codes)|{code.decode('ascii') for code in fixed})[:16]
 receipt={'schema':'work8-v65-bounded-capture-v1','commandLabel':label,'status':'FAIL' if stop else 'PASS_CAPTURE_ONLY','code':codes[0] if stop and codes else stop or 'CAPTURE_COMPLETE','stopCause':stop,'exitCode':proc.returncode if proc else None,'stdoutBytes':counts[0],'stderrBytes':counts[1],'stdoutSHA256':hashes[0].hexdigest(),'stderrSHA256':hashes[1].hexdigest(),'knownDiagnosticCodes':codes,'errorClass':error_class,'streamComplete':complete,'maximumStreamBytes':maximum_stream_bytes,'maximumSeconds':seconds,'elapsedSeconds':round(time.monotonic()-started,3),'rawOutputExported':False,'applicationAcceptance':False}
 if stop=='CAPTURE_OS_ERROR':receipt['errno']=os_errno
 if stop:
  first=receipts/'first-capture-failure.json'
  if not first.exists():atomic(first,receipt,exclusive=True)
  raise CaptureFailure(receipt)
 # Atomic per-probe receipt; repeated source checks retain distinct observations.
 index=0
 while (receipts/(label+'-'+str(index)+'.json')).exists():index+=1
 atomic(receipts/(label+'-'+str(index)+'.json'),receipt,exclusive=True)
 return bytes(buffers[0])

def node_probe_source(expression):
 # Expressions are fixed source literals; never user/provider supplied code.
 return "try{console.log(JSON.stringify({value:("+expression+")}));}catch(e){const code=typeof e.code==='string'&&/^(?:ERR_[A-Z0-9_]{1,80}|MODULE_NOT_FOUND|E[A-Z]{1,30})$/.test(e.code)?e.code:null;const errorClass=['Error','TypeError','RangeError','SyntaxError','ReferenceError'].includes(e.name)?e.name:'Error';console.error(JSON.stringify({schema:'work8-v65-named-probe-error-v1',code,errorClass}));process.exitCode=1;}"
