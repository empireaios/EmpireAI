"""Bounded allowlisted causal metadata; never prints raw process output or data."""
import errno,hashlib,json,os,pathlib,re,sys
SCHEMA='work8-v31-native-first-failure-v1'
PREFIX='WORK8_NATIVE_FIRST_FAILURE '
_ALLOW=json.loads(pathlib.Path(__file__).with_name('native-diagnostic-codes.json').read_text());CODES=set(_ALLOW['codes']);ERRNOS=set(_ALLOW['errnos'])
SAFE_FILES={'live-brain-hook.mjs','live-brain-preflight.mjs','live-brain-observation.mjs','independent-brain-readback.mjs','coordinator.mjs','native-diagnostic.mjs','index.js','database.js','sqlite-database.js','quiesced-sqlite-save.js','examine-v26.py','whole-app-readback.mjs','run-native-examination.py'}
SAFE_FILES.update(_ALLOW.get('startupFrameFiles',[]))
SAFE_FILES.update({'execution_contract.py','current_packages.py'})
BOOL_KEYS=['moduleInitialized','applicationInitialized','captureRequestReached','privateReceiptWritten','captureFenceAcquired','captureFenceReleased','persistenceCompleted']
def token(value,default='UNKNOWN'):
 return value if isinstance(value,str) and value in CODES else default
def integer(value):return value if type(value) is int and 0<=value<=2147483647 else None
def identity(value):
 value=value if isinstance(value,dict) else {};caps=value.get('capabilities',{});caps=caps if isinstance(caps,dict) else {}
 return {'pid':integer(value.get('pid')),'effectiveUid':integer(value.get('effectiveUid',value.get('uid'))),'effectiveGid':integer(value.get('effectiveGid',value.get('gid'))),'capabilities':{k:v for k,v in caps.items() if k in ['CapInh','CapPrm','CapEff','CapBnd','CapAmb'] and isinstance(v,str) and re.fullmatch('[a-fA-F0-9]{16}',v)},'noNewPrivileges':value.get('noNewPrivileges') if type(value.get('noNewPrivileges')) is bool else None,'seccomp':integer(value.get('seccomp'))}
def host_identity():
 fields=dict(line.split(':',1) for line in pathlib.Path('/proc/self/status').read_text().splitlines() if ':' in line)
 return identity({'pid':os.getpid(),'effectiveUid':os.geteuid(),'effectiveGid':os.getegid(),'capabilities':{k:fields.get(k,'').strip() for k in ['CapInh','CapPrm','CapEff','CapBnd','CapAmb']},'noNewPrivileges':fields.get('NoNewPrivs','').strip()=='1','seccomp':int(fields.get('Seccomp','0'))})
def sanitize(value):
 if not isinstance(value,dict) or value.get('schema')!=SCHEMA:raise ValueError('DIAGNOSTIC_SCHEMA_REFUSED')
 frames=[]
 for f in value.get('sourceFrames',[])[:8]:
  if isinstance(f,str):
   parts=f.split(':')
   if len(parts)==3 and parts[0] in SAFE_FILES and all(x.isdigit() and len(x)<=6 for x in parts[1:]):frames.append(f)
 state=value.get('state',{});state=state if isinstance(state,dict) else {}
 code=value.get('errno');code=code if code in ERRNOS else None
 lifecycle=value.get('containerLifecycle',{});lifecycle=lifecycle if isinstance(lifecycle,dict) else {}
 return {'schema':SCHEMA,'firstFailure':True,'stage':token(value.get('stage')),'assertion':token(value.get('assertion')),'operation':token(value.get('operation')),'errno':code,'sourceFrames':frames,'identityScope':token(value.get('identityScope'),'HOST_CONTROLLER'),'identity':identity(value.get('identity')),'state':{k:state.get(k) if type(state.get(k)) is bool else None for k in BOOL_KEYS},'containerLifecycle':{'role':lifecycle.get('role') if lifecycle.get('role') in ['backend','module','browser','redis'] else None,'status':lifecycle.get('status') if lifecycle.get('status') in ['created','running','paused','restarting','removing','exited','dead'] else None,'exitCode':lifecycle.get('exitCode') if type(lifecycle.get('exitCode')) is int and -255<=lifecycle['exitCode']<=255 else None,'oomKilled':lifecycle.get('oomKilled') if type(lifecycle.get('oomKilled')) is bool else None},**({'commandException':command_exception(value['commandException'])} if isinstance(value.get('commandException'),dict) else {}),**({'origin':startup_origin(value['origin'])} if isinstance(value.get('origin'),dict) else {}),'rawErrorOrRecordsRetained':False}
def command_exception(value):
 return {'exceptionClass':value.get('exceptionClass') if value.get('exceptionClass') in [None,'TimeoutExpired','OSError'] else None,'numericErrno':integer(value.get('numericErrno')),'configuredDeadlineMs':integer(value.get('configuredDeadlineMs')),'elapsedMonotonicMs':integer(value.get('elapsedMonotonicMs'))}
def startup_origin(value):
 def hexvalue(x,n):return x if isinstance(x,str) and re.fullmatch('[a-f0-9]{'+str(n)+'}',x) else None
 def digits(x):return x if isinstance(x,str) and re.fullmatch('[0-9]{1,30}',x) else None
 entries={pathlib.PurePosixPath(x).name for x in _ALLOW.get('startupEntrypoints',[])}
 return {'role':value.get('role') if value.get('role') in _ALLOW.get('startupRoles',[]) else 'admitted-child','pid':integer(value.get('pid')),'parentPid':integer(value.get('parentPid')),'startTicks':digits(value.get('startTicks')),'entrypoint':value.get('entrypoint') if value.get('entrypoint') in entries else 'UNRECOGNIZED_ENTRY','entrySha256':hexvalue(value.get('entrySha256'),64),'source':hexvalue(value.get('source'),40),'generationSha256':hexvalue(value.get('generationSha256'),64),'observedMonotonicNs':digits(value.get('observedMonotonicNs')),'messageSha256':hexvalue(value.get('messageSha256'),64)}
def parse_stream(text):
 for line in text.splitlines():
  if line.startswith(PREFIX) and len(line)<16384:
   try:return sanitize(json.loads(line[len(PREFIX):]))
   except Exception:pass
 return None
def from_error(error,stage,operation,output='',exit_code=None):
 found=parse_stream(output)
 if found:return found
 import traceback
 frames=[]
 for frame in traceback.extract_tb(error.__traceback__) if error.__traceback__ else []:
  name=pathlib.Path(frame.filename).name
  if name in SAFE_FILES:frames.append(f'{name}:{frame.lineno}:0')
 text=str(error);assertion=token(text.splitlines()[0] if text else None,token(text.splitlines()[0].split(':')[0] if text else None))
 known_errno=errno.errorcode.get(getattr(error,'errno',None))
 return sanitize({'schema':SCHEMA,'stage':stage.upper().replace('-','_'),'assertion':assertion,'operation':operation,'errno':known_errno,'sourceFrames':frames,'identityScope':'HOST_CONTROLLER','identity':host_identity(),'containerLifecycle':{'exitCode':exit_code}})
def save_first(root,value):
 root=pathlib.Path(root);safe=sanitize(value);p=root/'first-native-failure.json'
 try:
  with p.open('x') as f:json.dump(safe,f,indent=2);f.write('\n')
 except FileExistsError:pass
 return safe

def emit_fallback(root):
 try:
  p=pathlib.Path(root)/'first-native-failure.json';s=p.lstat()
  if p.is_symlink() or not p.is_file() or s.st_size>16384 or s.st_nlink!=1:raise ValueError('INVALID_SAFE_RECEIPT')
  safe=sanitize(json.loads(p.read_text()))
  encoded=json.dumps(safe,separators=(',',':'))
  from candidate_packages import PATTERNS
  if any(pattern.search(encoded.encode()) for _,pattern in PATTERNS):raise ValueError('SAFE_DIAGNOSTIC_PATTERN_REFUSED')
  print(PREFIX+encoded,flush=True)
 except Exception:
  print('WORK8_NATIVE_DIAGNOSTIC_UNAVAILABLE '+json.dumps({'assertion':'SAFE_CAUSAL_RECEIPT_UNAVAILABLE','rawOutputRetained':False},separators=(',',':')),flush=True)
if __name__=='__main__':emit_fallback(pathlib.Path(sys.argv[1]))
