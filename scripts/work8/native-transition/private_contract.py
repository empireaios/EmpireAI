"""The exact private-mount/identity options shared by Phase A and live Phase B."""
import errno, hashlib, json, os, pathlib, stat

BACKEND_CAPS=('SETUID','SETGID','CHOWN','DAC_OVERRIDE','KILL','SYS_PTRACE')

def mounts(private,script):
 return [(private/'policy','/run/empire-policy',True),(private/'control','/control',False),(private/'evidence','/evidence',False),(script,'/examination',True)]

def backend_options(private,script):
 args=['--read-only','--user','0:0','--cap-drop','ALL']
 for cap in BACKEND_CAPS:args+=['--cap-add',cap]
 args+=['--security-opt','no-new-privileges','--tmpfs','/data/work8-exam:rw,noexec,nosuid,nodev,mode=0755,size=2g','--tmpfs','/tmp:rw,noexec,nosuid,size=16m']
 for source,dest,ro in mounts(private,script):args+=['--mount','type=bind,src='+str(source)+',dst='+dest+(',readonly' if ro else '')]
 return args

def browser_options(private,script,driver,uid=None,gid=None):
 uid=os.getuid() if uid is None else uid;gid=os.getgid() if gid is None else gid
 args=['--user',str(uid)+':'+str(gid),'--env','HOME=/tmp','--env','NODE_OPTIONS=--dns-result-order=ipv4first']
 for source,dest,ro in [(script,'/examination',True),(driver,'/frontend-package',True),(private/'control','/control',False),(private/'evidence','/evidence',False)]:args+=['--mount','type=bind,src='+str(source)+',dst='+dest+(',readonly' if ro else '')]
 return args

def host_identity():
 status=pathlib.Path('/proc/self/status').read_text();fields={line.split(':',1)[0]:line.split(':',1)[1].strip() for line in status.splitlines() if ':' in line}
 return {'effectiveUid':os.geteuid(),'effectiveGid':os.getegid(),'realUid':os.getuid(),'realGid':os.getgid(),'groups':os.getgroups(),'capabilities':{key:fields.get(key) for key in ['CapInh','CapPrm','CapEff','CapBnd','CapAmb']},'noNewPrivileges':fields.get('NoNewPrivs')=='1'}

def safe_stat(path):
 try:
  s=path.lstat();return {'present':True,'uid':s.st_uid,'gid':s.st_gid,'mode':oct(stat.S_IMODE(s.st_mode)),'bytes':s.st_size,'regularFile':stat.S_ISREG(s.st_mode),'directory':stat.S_ISDIR(s.st_mode),'symlink':stat.S_ISLNK(s.st_mode)}
 except OSError as error:return {'present':False,'errno':errno.errorcode.get(error.errno,'OTHER')}

def private_write(target,value):
 """Host controls: completed 0600 bytes, fsync, atomic publication; no chown."""
 target=pathlib.Path(target);pending=target.with_name(target.name+'.host-pending');fd=None;directory=None;operation='HOST_VALIDATE_PRIVATE_PARENT'
 try:
  parent=target.parent.lstat()
  assert stat.S_ISDIR(parent.st_mode) and not stat.S_ISLNK(parent.st_mode) and stat.S_IMODE(parent.st_mode)==0o700 and parent.st_uid==os.geteuid() and parent.st_gid==os.getegid(),'HOST_PRIVATE_PARENT_CONTRACT'
  assert target.parent.resolve()==target.parent and not target.exists() and not target.is_symlink(),'HOST_PRIVATE_TARGET_CONTRACT'
  operation='HOST_SERIALIZE_BOUNDED_CONTROL';data=json.dumps(value,separators=(',',':')).encode();assert len(data)<=1048576,'HOST_PRIVATE_PAYLOAD_BOUND'
  operation='HOST_CREATE_PRIVATE_0600';fd=os.open(pending,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
  operation='HOST_SET_MODE_WHILE_OWNED';os.fchmod(fd,0o600)
  operation='HOST_WRITE_PRIVATE_CONTENT';offset=0
  while offset<len(data):
   written=os.write(fd,data[offset:]);assert written>0;offset+=written
  operation='HOST_SYNC_PRIVATE_CONTENT';os.fsync(fd)
  operation='HOST_VERIFY_PRIVATE_METADATA';st=os.fstat(fd);assert stat.S_IMODE(st.st_mode)==0o600 and st.st_uid==os.geteuid() and st.st_gid==os.getegid() and st.st_size==len(data)
  operation='HOST_CLOSE_COMPLETED_CONTENT';os.close(fd);fd=None
  operation='HOST_VERIFY_PRIVATE_CHECKSUM';assert hashlib.sha256(pending.read_bytes()).digest()==hashlib.sha256(data).digest()
  operation='HOST_ATOMIC_CONTROL_PUBLICATION';os.replace(pending,target)
  operation='HOST_OPEN_PRIVATE_PARENT';directory=os.open(target.parent,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
  operation='HOST_SYNC_PRIVATE_PARENT';os.fsync(directory);os.close(directory);directory=None
  return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'uid':target.stat().st_uid,'gid':target.stat().st_gid,'mode':'0600','atomicPublication':True,'identity':host_identity()}
 except Exception as error:
  failure={'schema':'WORK8_HOST_PRIVATE_HANDOFF_FAILURE_V1','status':'FAIL','operation':operation,'errno':errno.errorcode.get(getattr(error,'errno',None),'HOST_CONTRACT_ASSERTION'),'numericErrno':getattr(error,'errno',None),'identity':host_identity(),'target':safe_stat(target),'pending':safe_stat(pending),'parent':safe_stat(target.parent),'rawPath':False,'rawContents':False,'rawErrorMessage':False}
  safe=RuntimeError('HOST_PRIVATE_HANDOFF_FAILED');safe.safe_handoff=failure;raise safe from None
 finally:
  if fd is not None:
   try:os.close(fd)
   except OSError:pass
  if directory is not None:
   try:os.close(directory)
   except OSError:pass

def host_control_metadata(control):
 ancestors=[]
 for p in [control,*control.parents]:
  s=p.stat();ancestors.append({'classification':'control' if p==control else 'ancestor-'+str(len(ancestors)),'uid':s.st_uid,'gid':s.st_gid,'mode':oct(stat.S_IMODE(s.st_mode))})
 acl={}
 for key in ['system.posix_acl_access','system.posix_acl_default']:
  try:
   raw=os.getxattr(control,key);acl[key]={'present':True,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
  except OSError as error:
   assert error.errno in [errno.ENODATA,errno.ENOTSUP],'PRIVATE_ACL_OBSERVATION_FAILED'
   acl[key]={'present':False,'errno':errno.errorcode[error.errno]}
 assert all(not item['present'] for item in acl.values()),'UNREVIEWED_PRIVATE_ACL_PRESENT'
 assert control.stat().st_uid==os.getuid() and control.stat().st_gid==os.getgid() and stat.S_IMODE(control.stat().st_mode)==0o700
 return {'uid':os.getuid(),'gid':os.getgid(),'groups':os.getgroups(),'ancestors':ancestors,'acl':acl,'privateControlOwnerModeVerified':True}

def safe_docker_contract(payload):
 """No environment or host private paths; measured identity and mount policy only."""
 host=payload['HostConfig'];config=payload['Config']
 return {'image':payload['Image'],'user':config['User'],'readOnlyRootfs':host['ReadonlyRootfs'],'capAdd':sorted(host.get('CapAdd') or []),'capDrop':sorted(host.get('CapDrop') or []),'securityOpt':sorted(host.get('SecurityOpt') or []),'groupAdd':host.get('GroupAdd') or [],'privileged':host['Privileged'],'mounts':sorted([{'destination':x['Destination'],'rw':x['RW'],'type':x['Type'],'mode':x['Mode'],'propagation':x['Propagation']} for x in payload['Mounts']],key=lambda x:x['destination'])}
