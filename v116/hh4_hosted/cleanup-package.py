#!/usr/bin/env python3
import json,pathlib,re,subprocess,sys
root=pathlib.Path(sys.argv[1]).resolve(strict=True);run=sys.argv[2];assert run.isdigit()
name='v116-hh4-package-'+run;image='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8'}
r=subprocess.run(['/usr/bin/docker','inspect',name],capture_output=True,env=env,timeout=15)
if r.returncode==0:
 assert len(r.stdout)<=1048576;d=json.loads(r.stdout)[0]
 assert d['Image']==image and d['Config']['Labels'].get('empireai.v116.hh4.package')==run and d['State']['Running']is False
 subprocess.run(['/usr/bin/docker','rm',name],env=env,check=True,stdout=subprocess.DEVNULL,timeout=15)
r=subprocess.run(['/usr/bin/docker','container','ls','-aq','--filter','name=^/'+name+'$'],env=env,capture_output=True,timeout=15)
assert r.returncode==0 and r.stdout.strip()==b''
(root/'evidence/package-termination.json').write_text(json.dumps({'packageContainerRemoved':True,'name':name,'neverStartedByWrapper':True},indent=2)+'\n')
