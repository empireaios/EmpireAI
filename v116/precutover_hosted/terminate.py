#!/usr/bin/python3
"""Stop exact current-run resource, then normalize only terminated native output."""
import json,os,pathlib,stat,subprocess,sys
root=pathlib.Path(sys.argv[1]);run=sys.argv[2];assert run.isdigit()and root.is_absolute()and root.resolve(strict=True)==root and root.name=='v116-precutover-'+run
name='work8-v116-precutover-'+run;image='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0';out=root/'evidence';env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','HOME':str(root/'docker-home')}
def command(args,check=True):
 r=subprocess.run(['/usr/bin/docker',*args],env=env,capture_output=True,timeout=20);assert len(r.stdout)+len(r.stderr)<=1048576
 if check:assert r.returncode==0
 return r
r=command(['inspect',name],False);removed=False
if r.returncode==0:
 x=json.loads(r.stdout)[0];assert x['Name']=='/'+name and x['Image']==image and x['Config']['Labels'].get('empireai.v116.precutover')==run
 if x['State']['Running']:command(['stop','--time','10',name],False)
 logs=command(['logs',name],False)
 if not(out/'console.log').exists():(out/'console.log').write_bytes(logs.stdout+logs.stderr)
 command(['rm','--force',name]);removed=True
assert command(['container','ls','-aq','--filter','name=^/'+name+'$']).stdout.strip()==b''
assert command(['container','ls','-aq','--filter','label=empireai.v116.precutover='+run]).stdout.strip()==b''
# Only this fresh, terminated output root is normalized. No source, image,
# credentials or application data outside the disposable output can be touched.
normalizer=pathlib.Path(__file__).resolve().parent/'normalize.py'
subprocess.run(['sudo','-n','/usr/bin/python3','-B',str(normalizer),str(root/'raw/evidence'),str(os.getuid()),str(os.getgid()),run],check=True,timeout=30,env={'PATH':'/usr/bin:/bin'})
result={'schema':'v116-precutover-independent-termination-v1','runId':run,'containerName':name,'imageId':image,'removed':removed,'exactContainerAbsent':True,'currentRunLabelAbsent':True,'nativeOutputNormalized':True,'nativeOutputExisted':(root/'raw/evidence').exists(),'productionMutation':False}
(out/'independent-termination.json').write_text(json.dumps(result,indent=2)+'\n')
