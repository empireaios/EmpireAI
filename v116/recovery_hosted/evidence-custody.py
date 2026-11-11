#!/usr/bin/env python3
"""Bounded private evidence handoff only after exact isolated resources terminate.
Never opens application databases or production paths. No artifact acceptance claim.
"""
import hashlib,json,os,pathlib,re,stat,subprocess,sys,time
MAX_BYTES=133000000
MAX_FILES=2000
SAFE_NAMES={
 'test1':['v116-test1-result.json','coordinator.log','container.log'],
 'test2':['v116-test2-result.json','test2-concurrent-supervisor.json','test2-frontend-controller.json','test2-native-controller-output.log','container.log']}
def read_regular(p,maximum):
 fd=os.open(p,os.O_RDONLY|os.O_NOFOLLOW)
 try:
  s=os.fstat(fd);assert stat.S_ISREG(s.st_mode) and s.st_nlink==1 and s.st_size<=maximum,'UNSAFE_OR_OVERSIZE_EVIDENCE'
  data=b''
  while chunk:=os.read(fd,min(65536,maximum+1-len(data))):
   data+=chunk;assert len(data)<=maximum
  assert len(data)==s.st_size
  last=os.fstat(fd);assert (last.st_dev,last.st_ino,last.st_size,last.st_mtime_ns)==(s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns),'EVIDENCE_CHANGED_DURING_READ'
  return data,s
 finally:os.close(fd)
def diagnostic_rows(root,kind):
 rows=[]
 for name in SAFE_NAMES[kind]:
  p=root/name
  if not p.exists():rows.append({'path':name,'status':'NOT_PRODUCED'});continue
  try:
   data,s=read_regular(p,8388608);row={'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
   values=[]
   if name.endswith('.json'):
    value=json.loads(data)
    if isinstance(value,dict):values=[value]
   else:
    for line in data[-65536:].decode('utf-8','replace').splitlines():
     try:
      value=json.loads(line)
      if isinstance(value,dict) and ('firstFailure'in value or 'status'in value):values.append(value)
     except (ValueError,TypeError):pass
   chosen=values[-1]if values else None
   if chosen:
    row['reportedStatus']=str(chosen.get('status','UNSPECIFIED'))[:160]
    failure=chosen.get('firstFailure')
    if isinstance(failure,dict):row['firstFailure']={k:str(failure[k])[:1024] for k in ['stage','phase','name','type','message'] if k in failure}
    elif failure is not None:row['firstFailure']=str(failure)[:1024]
    elif chosen.get('evidenceHandoffFailure') is not None:row['firstFailure']={'stage':'evidence-handoff','message':str(chosen['evidenceHandoffFailure'])[:1024]}
    elif chosen.get('cleanupFailure') is not None:row['firstFailure']={'stage':'cleanup','message':str(chosen['cleanupFailure'])[:1024]}
    elif chosen.get('error') is not None:row['firstFailure']={'stage':str(chosen.get('stage','native-examination'))[:160],'message':str(chosen['error'])[:1024]}
   if len(json.dumps(row).encode())>2048 and 'firstFailure'in row:
    failure=row['firstFailure'];row['firstFailure']={k:str(v)[:64]for k,v in failure.items()}if isinstance(failure,dict)else str(failure)[:64]
   rows.append(row)
  except BaseException as e:rows.append({'path':name,'status':'DIAGNOSTIC_READ_REFUSED','error':type(e).__name__+':'+str(e)[:256]})
 return rows

def audit_tree(root,allowed_uids):
 anchor=root.lstat();assert stat.S_ISDIR(anchor.st_mode) and not root.is_symlink()
 files=[];dirs=[];total=0
 def walk(p):
  nonlocal total
  s=p.lstat();assert stat.S_ISDIR(s.st_mode) and s.st_dev==anchor.st_dev and s.st_uid in allowed_uids,'UNSAFE_EVIDENCE_DIRECTORY'
  dirs.append((p,s))
  for entry in sorted(p.iterdir()):
   assert len(entry.name)<=255 and not any(ord(c)<32 for c in entry.name),'UNSAFE_EVIDENCE_NAME'
   s=entry.lstat();assert not stat.S_ISLNK(s.st_mode) and s.st_dev==anchor.st_dev and s.st_uid in allowed_uids,'UNSAFE_EVIDENCE_IDENTITY'
   if stat.S_ISDIR(s.st_mode):walk(entry);continue
   assert stat.S_ISREG(s.st_mode) and s.st_nlink==1,'SPECIAL_OR_LINKED_EVIDENCE_REFUSED'
   total+=s.st_size;assert total<=MAX_BYTES and len(files)<MAX_FILES,'EVIDENCE_BOUND_EXCEEDED'
   data,actual=read_regular(entry,MAX_BYTES);assert (actual.st_dev,actual.st_ino)==(s.st_dev,s.st_ino)
   files.append((entry,s,hashlib.sha256(data).hexdigest()))
 walk(root);return files,dirs,total

def transfer(root,uid,gid):
 files,dirs,total=audit_tree(root,{0,65534,uid});rows=[]
 # Complete validation precedes every chmod/chown. Sources are exclusively in
 # this terminated synthetic examination's evidence tree; no recursive shell.
 for p,old,digest in files:
  fd=os.open(p,os.O_RDONLY|os.O_NOFOLLOW)
  try:
   s=os.fstat(fd);assert (s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns)==(old.st_dev,old.st_ino,old.st_size,old.st_mtime_ns)
   os.fchmod(fd,0o600);os.fchown(fd,uid,gid)
   data=b''
   while chunk:=os.read(fd,65536):data+=chunk
   assert hashlib.sha256(data).hexdigest()==digest,'CUSTODY_BYTES_CHANGED'
   final=os.fstat(fd);assert final.st_uid==uid and final.st_gid==gid and stat.S_IMODE(final.st_mode)==0o600 and final.st_nlink==1
   rows.append({'path':str(p.relative_to(root)),'bytes':old.st_size,'sha256':digest,'priorUid':old.st_uid,'priorMode':oct(stat.S_IMODE(old.st_mode)),'uid':uid,'gid':gid,'mode':'0600'})
  finally:os.close(fd)
 for p,old in reversed(dirs):
  fd=os.open(p,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
  try:
   s=os.fstat(fd);assert(s.st_dev,s.st_ino)==(old.st_dev,old.st_ino)
   os.fchmod(fd,0o700);os.fchown(fd,uid,gid)
  finally:os.close(fd)
 return {'files':rows,'totalBytes':total,'directories':len(dirs),'exactBytesPreserved':True,'filesMode':'0600','directoriesMode':'0700','uploaderUid':uid,'uploaderGid':gid}

def save_owned(p,value,uid,gid):
 data=(json.dumps(value,indent=2)+'\n').encode();assert len(data)<=524288
 fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
 try:
  os.fchmod(fd,0o600);position=0
  while position<len(data):position+=os.write(fd,data[position:])
  os.fsync(fd);os.fchown(fd,uid,gid)
 finally:os.close(fd)

def prove_termination(run,kind):
 assert run.isdigit() and kind in SAFE_NAMES
 name='work8-v116-'+kind+'-'+run
 suffixes='exam|redis|target-redis'if kind=='test1'else'exam|redis|normal|prepared|selected'
 env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','HOME':'/nonexistent'}
 for argv in [['/usr/bin/docker','ps','-aq','--filter','name=^/'+name+'-('+suffixes+')$'],['/usr/bin/docker','network','ls','-q','--filter','name=^'+name+'-net$']]:
  r=subprocess.run(argv,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=15,env=env)
  assert r.returncode==0 and len(r.stdout)+len(r.stderr)<=65536 and not r.stdout.strip(),'PROVIDER_TERMINATION_NOT_ESTABLISHED'
 return {'scope':kind,'runId':run,'allNamedContainersAndNetworkAbsent':True}

def main():
 assert os.getuid()==0 and os.getgid()==0,'HOST_OPERATOR_REQUIRED'
 assert len(sys.argv)==6
 raw=pathlib.Path(sys.argv[1]);run,kind=sys.argv[2:4];uid,gid=map(int,sys.argv[4:6])
 assert run.isdigit() and kind in SAFE_NAMES and uid not in [0,65534] and gid>0
 assert raw.is_absolute() and raw.resolve(strict=True)==raw and raw.name=='v116-'+kind+'-'+run
 root=raw/'evidence';s=root.lstat();assert stat.S_ISDIR(s.st_mode) and s.st_uid==uid and s.st_gid==gid and not root.is_symlink()
 prove_termination(run,kind)
 # Bounded first failure is durable in provider logs even if later custody or
 # sealing refuses an unrelated payload. No raw records, sessions or tokens.
 diagnostics={'schema':'v116-bounded-first-failure-diagnostics-v1','runId':run,'scope':kind,'acceptanceClaim':False,'rows':diagnostic_rows(root,kind)}
 encoded=json.dumps(diagnostics,separators=(',',':'));assert len(encoded.encode())<=16384
 print('V116_BOUNDED_FIRST_FAILURE '+encoded,flush=True)
 save_owned(root/'first-failure-diagnostics.json',diagnostics,uid,gid)
 transferred=transfer(root,uid,gid)
 receipt={'schema':'v116-post-termination-private-evidence-custody-v1','status':'PASS','runId':run,'scope':kind,'providerContainersAndNetworkAbsent':True,'productionAccess':False,'onlyIsolatedSyntheticEvidence':True,**transferred}
 save_owned(root/'evidence-custody.json',receipt,uid,gid)
 print(json.dumps({'scope':kind,'custody':'PASS','files':len(transferred['files']),'bytes':transferred['totalBytes'],'uploaderUid':uid,'runtimePrivateModesMaintainedUntilTermination':True}),flush=True)
if __name__=='__main__':
 try:main()
 except BaseException as e:
  print('V116_EVIDENCE_CUSTODY_REFUSED '+json.dumps({'type':type(e).__name__,'message':str(e)[:1024],'acceptanceClaim':False}),flush=True);raise
