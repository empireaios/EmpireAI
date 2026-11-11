#!/usr/bin/env python3
"""After namespace termination, expose only this run's bounded evidence to upload."""
import os,pathlib,re,stat,sys
assert len(sys.argv)==4
root=pathlib.Path(sys.argv[1]);run_id=sys.argv[2];runner_uid=int(sys.argv[3])
assert re.fullmatch(r'[0-9]+',run_id) and 0<runner_uid<2**31
assert root.is_absolute() and root.name=='v116-o30-'+run_id
assert root.resolve(strict=True)==root
evidence=root/'evidence';base=evidence.lstat()
assert stat.S_ISDIR(base.st_mode) and base.st_uid in [0,runner_uid]
entries=[];total=0
def inspect(p):
 global total
 info=p.lstat()
 assert info.st_dev==base.st_dev and info.st_uid in [0,runner_uid]
 assert stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode),'Nonregular evidence refused'
 assert len(entries)<200,'Unexpected evidence inventory size'
 if stat.S_ISREG(info.st_mode):
  assert info.st_nlink==1,'Hardlinked evidence refused'
  assert info.st_size<=2*1024*1024
  total+=info.st_size;assert total<=10*1024*1024
 entries.append((p,info))
 if stat.S_ISDIR(info.st_mode):
  for child in sorted(p.iterdir()):inspect(child)
inspect(evidence)
# Validate the complete tree before any permission change. Open every admitted
# inode without following links, then recheck identity before fchmod.
for p,previous in entries:
 flags=os.O_RDONLY|os.O_NOFOLLOW
 if stat.S_ISDIR(previous.st_mode):flags|=os.O_DIRECTORY
 fd=os.open(p,flags)
 try:
  actual=os.fstat(fd)
  assert (actual.st_dev,actual.st_ino,actual.st_mode,actual.st_uid,actual.st_nlink)==(previous.st_dev,previous.st_ino,previous.st_mode,previous.st_uid,previous.st_nlink)
  os.fchmod(fd,0o755 if stat.S_ISDIR(actual.st_mode) else 0o644)
 finally:os.close(fd)
print('Bounded terminated evidence made readable: '+str(len(entries))+' entries, '+str(total)+' bytes')
