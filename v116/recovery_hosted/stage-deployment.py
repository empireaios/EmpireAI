#!/usr/bin/env python3
"""Stage only four exact reviewed public deployment files as operator-owned inputs.
No app imports, container startup, production paths, credentials or database access.
"""
import hashlib,json,os,pathlib,re,stat,sys
PINS={'runtime-writer-controller.cjs': '37c64693591b96e828d598a0b3923042056930dbed4f6e59da66937398da6f5c', 'runtime-startup-readback.mjs': 'b6dd126a0508fa44444513ed5b0cb47c085f7937b2d9468c8587061621725f63', 'v116-isolated-enrollment.cjs': 'c6c770aff3a0f325846c211a277811eb42aaed8eae1520a45ffe7cdc216376b9', 'v116-enrollment-entry.mjs': '26747457e01036e1f9b3779c7fe2e4bf311f05e3f891c35f5f9aba11e1d670ea'}
assert os.getuid()==0 and os.getgid()==0,'EXPLICIT_HOST_OPERATOR_REQUIRED'
assert len(sys.argv)==4
source,inputRoot=map(lambda x:pathlib.Path(x),sys.argv[1:3]);run=sys.argv[3]
assert run.isdigit() and inputRoot.name=='v116-test1-'+run
assert source.name=='test1' and source.parent.name=='v116'
for p in [source,inputRoot]:
 assert p.is_dir() and not p.is_symlink() and p.resolve(strict=True)==p
stage=inputRoot/'reviewed-deployment';assert not stage.exists()
# All inputs are checked before creating any privileged destination.
verified={}
for name,digest in PINS.items():
 p=source/name;fd=os.open(p,os.O_RDONLY|os.O_NOFOLLOW)
 try:
  st=os.fstat(fd);assert stat.S_ISREG(st.st_mode) and st.st_nlink==1 and st.st_size<=20000
  data=os.read(fd,20001);assert len(data)==st.st_size and hashlib.sha256(data).hexdigest()==digest
  verified[name]=data
 finally:os.close(fd)
stage.mkdir(mode=0o755);os.chmod(stage,0o755);assert stage.stat().st_uid==0 and stage.stat().st_gid==0
rows=[]
for name,data in verified.items():
 p=stage/name;fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o444)
 try:
  os.fchmod(fd,0o444);written=0
  while written<len(data):written+=os.write(fd,data[written:])
  os.fsync(fd)
 finally:os.close(fd)
 st=p.lstat();assert st.st_uid==0 and st.st_gid==0 and stat.S_IMODE(st.st_mode)==0o444 and st.st_nlink==1
 assert hashlib.sha256(p.read_bytes()).hexdigest()==PINS[name]
 rows.append({'name':name,'sha256':PINS[name],'bytes':len(data),'uid':st.st_uid,'gid':st.st_gid,'mode':'0444'})
assert sorted(x.name for x in stage.iterdir())==sorted(PINS)
receipt={'schema':'v116-a05-reviewed-deployment-root-staging-v1','status':'PASS','runId':run,'operatorUid':0,'nativeApplicationModulesUnchanged':True,'explicitControllerOverlays':True,'sourceInputsChanged':False,'rows':rows,'productionAccess':False}
out=inputRoot/'evidence'/'deployment-input-staging.json';fd=os.open(out,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o644)
try:
 os.fchmod(fd,0o644);data=(json.dumps(receipt,indent=2)+'\n').encode();written=0
 while written<len(data):written+=os.write(fd,data[written:])
 os.fsync(fd)
finally:os.close(fd)
