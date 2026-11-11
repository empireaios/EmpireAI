#!/usr/bin/python3
import os,pathlib,stat,sys
p=pathlib.Path(sys.argv[1]);uid,gid=map(int,sys.argv[2:4]);run=sys.argv[4];assert run.isdigit()and uid>0 and gid>0 and os.geteuid()==0
assert p.is_absolute()and p.parts[-3:]==('v116-precutover-'+run,'raw','evidence')
cur=p.anchor
for part in p.parts[1:]:
 cur=os.path.join(cur,part)
 if not os.path.lexists(cur):
  assert cur in [str(p.parent),str(p)]and not p.exists();sys.exit(0)
 assert stat.S_ISDIR(os.lstat(cur).st_mode),'UNSAFE_OUTPUT_PARENT'
assert p.resolve(strict=True)==p
files=[];dirs=[];total=0
for current,subdirs,names in os.walk(p,followlinks=False):
 d=pathlib.Path(current);s=d.lstat();assert stat.S_ISDIR(s.st_mode)and s.st_uid in[0,uid];dirs.append(d)
 for name in subdirs:assert stat.S_ISDIR((d/name).lstat().st_mode),'SYMLINK_DIRECTORY_REFUSED'
 for name in names:
  f=d/name;s=f.lstat();assert stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_uid in[0,uid],'UNSAFE_OUTPUT_FILE';total+=s.st_size;assert len(files)<100 and total<=64*1048576,'OUTPUT_NORMALIZATION_BOUND';files.append(f)
for f in files:os.chown(f,uid,gid,follow_symlinks=False);os.chmod(f,0o600,follow_symlinks=False)
for d in dirs:os.chown(d,uid,gid,follow_symlinks=False);os.chmod(d,0o700,follow_symlinks=False)
print('SCOPED_TERMINATED_OUTPUT_NORMALIZED')
