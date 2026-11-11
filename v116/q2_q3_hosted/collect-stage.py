#!/usr/bin/env python3
"""Preserve bounded mandatory evidence first; teardown only the terminated owned stage."""
import hashlib,json,os,pathlib,re,shutil,stat,sys
assert os.getuid()==0 and len(sys.argv)==3 and shutil.rmtree.avoids_symlink_attacks
run_id=sys.argv[1];out=pathlib.Path(sys.argv[2]);assert re.fullmatch('[0-9]+',run_id)
stage=pathlib.Path('/var/tmp').resolve(strict=True)/('v116-q2-q3-'+run_id)
assert stage.resolve(strict=True)==stage and stage.lstat().st_uid==0 and stage.is_dir()
assert out.resolve(strict=True)==out and out.name=='evidence'
assert not any(line.split()[4]==str(stage)or line.split()[4].startswith(str(stage)+'/')for line in pathlib.Path('/proc/self/mountinfo').read_text().splitlines())
source=stage/'evidence';files=[];issues=[]
expected={'capture/execution.log':2*1024*1024,'capture/policy-controls.log':65536,'capture/receipt.json':1024*1024}
def problem(path,reason):
 if len(issues)<128:issues.append({'path':str(path)[:300],'reason':str(reason)[:500]})
def directory(p):
 i=p.lstat();assert stat.S_ISDIR(i.st_mode)and i.st_uid==0
try:
 directory(source)
 # Each admitted file has independent validation. An unrelated raw diagnostic
 # cannot prevent preservation of the bounded TAP, policy proof and receipt.
 for relative,maximum in expected.items():
  p=source/relative
  try:
   directory(p.parent)
   info=p.lstat();assert stat.S_ISREG(info.st_mode)and info.st_uid==0 and info.st_nlink==1
   assert info.st_size<=maximum,'MANDATORY_FILE_LIMIT:'+str(info.st_size)
   target=out/relative;assert not target.exists();target.parent.mkdir(mode=0o755,parents=True,exist_ok=True)
   fd=os.open(p,os.O_RDONLY|os.O_NOFOLLOW);h=hashlib.sha256();size=0
   with os.fdopen(fd,'rb')as source_file,target.open('xb')as destination:
    opened=os.fstat(source_file.fileno());assert(opened.st_dev,opened.st_ino,opened.st_size)==(info.st_dev,info.st_ino,info.st_size)
    for chunk in iter(lambda:source_file.read(65536),b''):
     size+=len(chunk);assert size<=maximum;destination.write(chunk);h.update(chunk)
    assert size==info.st_size and os.fstat(source_file.fileno()).st_size==info.st_size
   target.chmod(0o644);assert hashlib.sha256(target.read_bytes()).hexdigest()==h.hexdigest()
   files.append({'path':relative,'bytes':size,'sha256':h.hexdigest()})
  except BaseException as error:problem(relative,type(error).__name__+':'+str(error))
 # Optional/unexpected data are never promoted or copied. Inventory failures are
 # recorded after mandatory copies, then the isolated owned copy is removed.
 seen=0
 for parent,dirs,names in os.walk(source,followlinks=False):
  for name in dirs+names:
   seen+=1
   if seen>128:problem('.','UNEXPECTED_INVENTORY_LIMIT');break
   p=pathlib.Path(parent)/name;relative=str(p.relative_to(source));info=p.lstat()
   if relative=='capture'and stat.S_ISDIR(info.st_mode):continue
   if relative in expected and stat.S_ISREG(info.st_mode):continue
   problem(relative,'UNEXPECTED_OUTPUT:'+str(info.st_size))
  if seen>128:break
except BaseException as error:problem('.',type(error).__name__+':'+str(error))
finally:
 shutil.rmtree(stage);assert not stage.exists()
 receipt={'stageRemoved':True,'sourceWorkspaceUntouched':True,'mandatoryEvidenceCollection':'PASS'if not issues and len(files)==3 else'FAIL','filesCopiedAndHashVerified':files,'rejectedOrMissingEvidence':issues,'optionalNativeExportEnabled':False}
 (out/'stage-termination.json').write_text(json.dumps(receipt,indent=2)+'\n');(out/'stage-termination.json').chmod(0o644)
print(json.dumps({'mandatoryEvidenceCollection':receipt['mandatoryEvidenceCollection'],'filesPreserved':len(files),'stageRemoved':True,'issues':len(issues)}))
sys.exit(0 if receipt['mandatoryEvidenceCollection']=='PASS'else 1)
