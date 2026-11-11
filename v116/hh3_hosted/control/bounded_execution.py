"""Bound one original coordinator; outer service also contains detached descendants."""
import hashlib,os,pathlib,selectors,signal,subprocess,time
def run(command,*,cwd,env,logfile,childlogs,seconds,cap=1048576):
 assert seconds>0 and cap>0
 proc=None;stopped=False;previous={};selector=None
 def stop(*_):
  nonlocal stopped
  stopped=True
  if proc is not None and proc.poll()is None:
   try:os.killpg(proc.pid,signal.SIGKILL)
   except ProcessLookupError:pass
 def handler(sig,_frame):
  stop();raise InterruptedError('EXTERNAL_STOP_SIGNAL:'+str(sig))
 try:
  for sig in [signal.SIGTERM,signal.SIGINT]:previous[sig]=signal.signal(sig,handler)
  before=signal.pthread_sigmask(signal.SIG_BLOCK,{signal.SIGTERM,signal.SIGINT})
  try:
   start=time.monotonic();proc=subprocess.Popen(command,cwd=cwd,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True,preexec_fn=lambda:signal.pthread_sigmask(signal.SIG_SETMASK,before))
  finally:signal.pthread_sigmask(signal.SIG_SETMASK,before)
  selector=selectors.DefaultSelector();selector.register(proc.stdout,selectors.EVENT_READ);size=0;timed=False;overflow=False;childOverflow=None
  with pathlib.Path(logfile).open('xb')as log:
   while selector.get_map():
    if time.monotonic()-start>=seconds:timed=True;break
    for childLog in map(pathlib.Path,childlogs):
     if childLog.exists()and childLog.stat().st_size>cap:childOverflow=str(childLog);break
    if childOverflow:break
    for key,_ in selector.select(.1):
     data=os.read(key.fd,65536)
     if not data:selector.unregister(key.fd);continue
     n=min(len(data),cap-size);log.write(data[:n]);size+=n
     if n<len(data):overflow=True;break
    if overflow:break
   if timed or overflow or childOverflow:stop()
   try:code=proc.wait(timeout=5)
   except subprocess.TimeoutExpired:timed=True;stop();code=proc.wait(timeout=5)
  return {'exitCode':code,'elapsedSeconds':round(time.monotonic()-start,3),'timeoutSeconds':seconds,'timedOut':timed,'consoleCapExceeded':overflow,'childLogCapExceeded':childOverflow,'consoleBytes':size,'consoleSHA256':hashlib.sha256(pathlib.Path(logfile).read_bytes()).hexdigest(),'forcedStop':stopped}
 finally:
  stop()
  if proc is not None:
   proc.wait(timeout=5)
   proc.stdout.close()
  if selector is not None:selector.close()
  for sig,old in previous.items():signal.signal(sig,old)
