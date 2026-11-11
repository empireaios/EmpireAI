#!/usr/bin/env python3
"""Collect already validated terminated evidence, then delete only the exact stage."""
import hashlib,json,os,pathlib,re,shutil,stat,sys
assert os.getuid()==0 and len(sys.argv)==3
run_id=sys.argv[1];out=pathlib.Path(sys.argv[2]);assert re.fullmatch('[0-9]+',run_id)
stage=pathlib.Path('/var/tmp').resolve(strict=True)/('v116-o30-'+run_id)
assert stage.resolve(strict=True)==stage and stage.lstat().st_uid==0 and stage.is_dir()
assert out.resolve(strict=True)==out and out.name=='evidence'
assert not any(line.split()[4]==str(stage) or line.split()[4].startswith(str(stage)+'/') for line in pathlib.Path('/proc/self/mountinfo').read_text().splitlines())
source=stage/'evidence';files=[]
for p in sorted(source.rglob('*')):
 info=p.lstat();assert stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode)
 if stat.S_ISREG(info.st_mode):
  assert info.st_nlink==1 and stat.S_IMODE(info.st_mode)==0o644
  relative=p.relative_to(source);target=out/relative;assert not target.exists()
  target.parent.mkdir(mode=0o755,parents=True,exist_ok=True)
  shutil.copy2(p,target);d=p.read_bytes();assert target.read_bytes()==d
  files.append({'path':str(relative),'bytes':len(d),'sha256':hashlib.sha256(d).hexdigest()})
shutil.rmtree(stage)
assert not stage.exists()
(out/'stage-termination.json').write_text(json.dumps({'stageRemoved':True,'sourceWorkspaceUntouched':True,'filesCopiedAndHashVerified':files},indent=2)+'\n')
