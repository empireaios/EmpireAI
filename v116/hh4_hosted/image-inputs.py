#!/usr/bin/python3
"""Copy only the 35 mandatory declared inputs from the never-started exact image."""
import hashlib,json,pathlib,re,subprocess,sys
from source_binding import contract,regular,IMAGE
root=pathlib.Path(sys.argv[1]);name=sys.argv[2];run=sys.argv[3];assert run.isdigit()and root.is_absolute()and root.resolve(strict=True)==root and root.name=='v116-hh4-'+run and name=='v116-hh4-package-'+run
control=pathlib.Path(__file__).resolve().parent;original,split=contract(control);env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8'}
r=subprocess.run(['/usr/bin/docker','inspect',name],env=env,capture_output=True,check=True,timeout=10);assert len(r.stdout)<=1048576;x=json.loads(r.stdout)[0];assert x['Image']==IMAGE and x['Name']=='/'+name and x['Config']['Labels'].get('empireai.v116.hh4.package')==run and x['State']['Status']=='created'and not x['State']['Running']and x['State']['Pid']==0
out=root/'image-inputs';out.mkdir(mode=0o700);files=[]
for relative,expected in original['applicationSHA256'].items():
 assert not pathlib.PurePosixPath(relative).is_absolute()and'..'not in pathlib.PurePosixPath(relative).parts
 target=out/relative;target.parent.mkdir(parents=True,exist_ok=True);subprocess.run(['/usr/bin/docker','cp',name+':/app/'+relative,str(target)],env=env,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,timeout=10);b=regular(target);assert hashlib.sha256(b).hexdigest()==expected,'DECLARED_IMAGE_BYTE_MISMATCH';files.append({'path':relative,'bytes':len(b),'sha256':expected})
r=subprocess.run(['/usr/bin/docker','inspect',name],env=env,capture_output=True,check=True,timeout=10);after=json.loads(r.stdout)[0];assert after['Id']==x['Id']and after['State']['Status']=='created'and not after['State']['Running']and after['State']['Pid']==0
receipt={'status':'PASS_ALL_ORIGINAL_INPUTS_FROM_NEVER_STARTED_EXACT_IMAGE','imageId':IMAGE,'containerId':x['Id'],'containerNeverStarted':True,'sourceBindingSHA256':hashlib.sha256(regular(control/'source-binding.json')).hexdigest(),'files':files,'originalInputs':35,'trackedSource':23,'compiledDistribution':12,'arbitraryMissingFilesAllowed':False}
(root/'evidence/image-original-inputs.json').write_text(json.dumps(receipt,indent=2)+'\n')
