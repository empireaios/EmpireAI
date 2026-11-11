#!/usr/bin/python3
"""Set the real PID before exec so the transport restricts exact original names."""
import os,signal,sys
assert len(sys.argv)==5
node,phase,source,out=sys.argv[1:];assert phase in ['f27','f29']
os.environ['V116_Q5_CONTROLLER_PID']=str(os.getpid())
signal.pthread_sigmask(signal.SIG_UNBLOCK,{signal.SIGTERM,signal.SIGINT})
os.chdir(source)
os.execve(node,[node,'scripts/work8/'+phase+'-outer-controller.cjs','sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0',out],os.environ)
