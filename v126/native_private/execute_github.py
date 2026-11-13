#!/usr/bin/env python3
import hashlib,json,os,pathlib,subprocess,time
assert os.getuid()==0
CONTROL=pathlib.Path(__file__).resolve().parent;run=os.environ['GITHUB_RUN_ID'];assert run.isdigit()
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v126-native-'+run);runtime=root/'runtime';private=root/'private'
name='work8-v126-native-gh-'+run
assert(root/'admission.json').is_file()
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def call(argv,seconds=30,env=None):
 p=subprocess.run(argv,stdin=subprocess.DEVNULL,capture_output=True,timeout=seconds,env=env)
 if len(p.stdout)+len(p.stderr)>1048576:raise RuntimeError('BOUNDED_OPERATION_OUTPUT_EXCEEDED')
 if p.returncode:
  error=RuntimeError('NATIVE_OPERATION_FAILED_'+pathlib.Path(argv[0]).name+'_'+str(p.returncode))
  error.cause={'argvWithoutInlineProgram':argv[:6],'exitCode':p.returncode,'stderrSHA256':hashlib.sha256(p.stderr).hexdigest(),'stderrBytes':len(p.stderr)};raise error
 return p.stdout
try:
 expiry=int(time.time()*1000)+150000
 call(['python3','-B',str(CONTROL/'configure_private.py'),str(private),sha(CONTROL/'authority.json'),str(expiry)])
 call(['python3','-B',str(CONTROL/'launch_private.py'),str(runtime),str(private),name,sha(CONTROL/'source-manifest.json'),sha(runtime/'evidence/prepared-runtime.json')])
 until=time.monotonic()+60
 while not(runtime/'runtime-output/runtime-ready.json').exists():
  assert time.monotonic()<until,'NATIVE_RUNTIME_READY_DEADLINE'
  x=json.loads(call(['docker','inspect',name]))[0];assert x['State']['Running'],'NATIVE_CONTAINER_EARLY_EXIT';time.sleep(.2)
 code=(CONTROL/'delegated-session.mjs').read_text()
 call(['docker','exec',name,'/usr/local/bin/node','--input-type=module','-e',code],60)
 with(root/'technical-client-result.json').open('x')as f:json.dump({'status':'PASS_DELEGATED_CLIENT_RETURNED_ZERO','inputActor':'DELEGATED_TECHNICAL_OPERATOR','ownerActionObserved':False,'wholeRowAccepted':False},f)
except BaseException as e:
 with(root/'execution-first-failure.json').open('x')as f:json.dump({'errorClass':type(e).__name__,'message':str(e)[:300],'cause':getattr(e,'cause',None),'ownerActionObserved':False,'wholeRowAccepted':False},f,indent=2)
 raise
