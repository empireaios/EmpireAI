"""Real process-group containment for external interruption of an outer examiner."""
import os,signal,subprocess
class ProcessBoundary:
 def __init__(self):self.stop_requested=False;self.signal_received=None;self.owned=[]
 def install(self):
  signal.signal(signal.SIGTERM,self.interrupt);signal.signal(signal.SIGINT,self.interrupt)
 def check(self):
  if self.stop_requested:raise InterruptedError('EXTERNAL_STOP_ALREADY_REQUESTED')
 def own(self,process):
  self.owned.append(process)
  if self.stop_requested:self.stop(process);self.check()
 def stop(self,process):
  if process.poll()is not None:return # Never signal a reused PID/group from an already reaped owner.
  try:os.killpg(process.pid,signal.SIGKILL)
  except ProcessLookupError:pass
  try:process.wait(timeout=5)
  except subprocess.TimeoutExpired:raise RuntimeError('OWNED_CONTROLLER_DID_NOT_EXIT')
 def interrupt(self,number,_frame):
  if self.stop_requested:return
  self.stop_requested=True;self.signal_received=number
  for process in self.owned:self.stop(process)
  raise InterruptedError('EXTERNAL_STOP_SIGNAL_'+str(number))
