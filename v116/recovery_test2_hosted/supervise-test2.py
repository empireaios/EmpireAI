#!/usr/bin/env python3
"""Bound one exact native container attach and its frontend controller together."""
import json,os,pathlib,re,selectors,signal,subprocess,sys,time
root=pathlib.Path(sys.argv[1]).resolve(strict=True);exam=sys.argv[2];label=sys.argv[3]
assert re.fullmatch(r'work8-v116-test2-[0-9]+-exam',exam)
assert label==exam.removesuffix('-exam')
assert root.name=='v116-test2-'+label.removeprefix('work8-v116-test2-')
assert not any(k in os.environ for k in ['GH_TOKEN','GITHUB_TOKEN','ACTIONS_RUNTIME_TOKEN'])
control=pathlib.Path(__file__).resolve().parent
out=root/'evidence';assert out.is_dir() and not out.is_symlink()
env={'PATH':'/usr/bin:/bin','HOME':str(root),'PYTHONDONTWRITEBYTECODE':'1'}
commands=[('native',['docker','start','--attach',exam]),('frontend',['python3','-B',str(control/'frontend-controller.py'),str(root),exam,label])]
processes=[];selector=selectors.DefaultSelector();started=time.monotonic();deadline=started+450;receipt={'schema':'v116-test2-concurrent-supervisor-v1','status':'FAIL','maximumSeconds':450,'productionMutation':False,'children':[]};failure=None

def interrupted(signum,frame):
 raise RuntimeError('SUPERVISOR_SIGNAL:'+str(signum))
for sig in [signal.SIGTERM,signal.SIGINT]:signal.signal(sig,interrupted)

def await_native_running(process,exam,deadline):
 barrier_deadline=min(deadline,time.monotonic()+30);observed=[]
 while time.monotonic()<barrier_deadline:
  if process.poll() is not None:raise RuntimeError('NATIVE_ATTACH_TERMINATED_BEFORE_FRONTEND:'+str(process.returncode))
  result=subprocess.run(['docker','inspect','--format','{{json .State}}',exam],stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env,timeout=min(3,max(.01,barrier_deadline-time.monotonic())))
  assert len(result.stdout.encode())+len(result.stderr.encode())<=16384,'NATIVE_STATE_OUTPUT_BOUND'
  if result.returncode:raise RuntimeError('NATIVE_START_STATE_INSPECTION_FAILED')
  state=json.loads(result.stdout);status=state['Status'];observed.append(status)
  if state['Running'] is True:
   assert status=='running' and state['Pid']>0,'NATIVE_RUNNING_STATE_REQUIRED'
   return {'status':'PASS_ACTUAL_NATIVE_CONTAINER_RUNNING','observedStates':observed,'nativeContainer':exam,'pid':state['Pid']}
  if status not in ['created','restarting']:raise RuntimeError('NATIVE_TERMINAL_BEFORE_FRONTEND:'+status)
  time.sleep(.1)
 raise TimeoutError('NATIVE_START_BARRIER_DEADLINE')

try:
 for name,argv in commands:
  if name=='frontend':receipt['nativeStartBarrier']=await_native_running(processes[0]['process'],exam,deadline)
  f=(out/('test2-'+name+'-controller-output.log')).open('xb')
  try:p=subprocess.Popen(argv,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,env=env,start_new_session=True)
  except BaseException:
   f.close();raise
  item={'name':name,'process':p,'file':f,'bytes':0,'pid':p.pid,'maxBytes':8388608};processes.append(item);selector.register(p.stdout,selectors.EVENT_READ,item)
 while selector.get_map() or any(item['process'].poll() is None for item in processes):
  if time.monotonic()>=deadline:raise TimeoutError('COMBINED_TEST2_DEADLINE')
  for key,_ in selector.select(.1):
   item=key.data;b=os.read(key.fd,65536)
   if not b:selector.unregister(key.fileobj);continue
   item['bytes']+=len(b)
   if item['bytes']>item['maxBytes']:raise RuntimeError('TEST2_OUTPUT_CAP:'+item['name'])
   item['file'].write(b);item['file'].flush()
  for item in processes:
   code=item['process'].poll()
   if code is not None and code!=0:raise RuntimeError('TEST2_CHILD_FAILED:'+item['name']+':'+str(code))
 assert all(item['process'].returncode==0 for item in processes)
 receipt['status']='PASS_BOTH_CONTROLLERS_EXITED_ZERO'
except BaseException as error:
 failure=error;receipt['firstFailure']={'type':type(error).__name__,'message':str(error)}
finally:
 # Once stopping, finish bounded group cleanup despite a repeated outer signal.
 for sig in [signal.SIGTERM,signal.SIGINT]:signal.signal(sig,signal.SIG_IGN)
 for item in processes:
  p=item['process']
  if p.poll() is None:
   try:os.killpg(p.pid,signal.SIGTERM)
   except ProcessLookupError:pass
 stop_by=time.monotonic()+10
 for item in processes:
  p=item['process']
  try:p.wait(timeout=max(.01,stop_by-time.monotonic()))
  except subprocess.TimeoutExpired:
   try:os.killpg(p.pid,signal.SIGKILL)
   except ProcessLookupError:pass
   p.wait(timeout=5)
  item['file'].close();receipt['children'].append({'name':item['name'],'pid':p.pid,'exitCode':p.returncode,'bytes':item['bytes']})
 selector.close();receipt['elapsedSeconds']=round(time.monotonic()-started,3);(out/'test2-concurrent-supervisor.json').write_text(json.dumps(receipt,indent=2)+'\n')
if failure:raise failure
