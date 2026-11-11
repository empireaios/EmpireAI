"""Finite operator policy for one admitted generated HH4 fixture only."""
import datetime,hashlib,json,os,pathlib,stat,time
SOURCE='6c1e63ba20619ee480742fd87dc810ca93152e22'
IMAGE='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
AUTHORITY='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'
def sha(data):return hashlib.sha256(data).hexdigest()
def regular(p,maximum=16384):
 s=p.lstat();assert stat.S_ISREG(s.st_mode)and not p.is_symlink()and s.st_nlink==1 and s.st_size<=maximum
 assert p.resolve(strict=True)==p
 return p.read_bytes(),s
def context(root,control,run):
 assert run.isdigit()and root.is_absolute()and root.resolve(strict=True)==root and root.name=='v116-hh4-'+run
 assert control.is_absolute()and control.resolve(strict=True)==control
 data,_=regular(control/'technical-authority.json');assert sha(data)==AUTHORITY
 return root/'technical-policy.json',root/'evidence/fixture-policy-admission.json'
def write(p,data,mode):
 fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,mode)
 try:
  os.fchmod(fd,mode)
  with os.fdopen(fd,'wb',closefd=False)as f:f.write(data);f.flush();os.fsync(fd)
 finally:os.close(fd)
def encode(value):return(json.dumps(value,indent=2)+'\n').encode()
def create(root,control,run):
 policy,receipt=context(root,control,run);assert not policy.exists()and not receipt.exists()
 issued=int(time.time()*1000);expires=issued+300000
 value={'schema':1,'mode':'RELEASED','approvalSha256':AUTHORITY,'expiresAt':datetime.datetime.fromtimestamp(expires/1000,datetime.timezone.utc).isoformat(timespec='milliseconds')}
 data=encode(value);write(policy,data,0o400)
 actual,st=regular(policy,4096);assert actual==data and stat.S_IMODE(st.st_mode)==0o400 and st.st_uid==os.getuid()
 r={'schema':'v116-hh4-generated-fixture-host-policy-v1','runId':run,'source':SOURCE,'image':IMAGE,'authoritySHA256':AUTHORITY,'policySHA256':sha(data),'policyBytes':len(data),'policyMode':'0400','policyUid':st.st_uid,'issuedAtMs':issued,'expiresAtMs':expires,'maximumLifetimeMs':300000,'policyDevice':st.st_dev,'policyInode':st.st_ino,'scope':'one admitted synthetic HH4 generated worker only','originalApplicationGuardChanged':False,'genuineOwnerApproval':False,'productionAuthority':False}
 write(receipt,encode(r),0o600);validate(root,control,run);return r
def validate(root,control,run,require_current=True):
 policy,receipt=context(root,control,run);r=json.loads(regular(receipt)[0]);data,st=regular(policy,4096);p=json.loads(data)
 assert r['schema']=='v116-hh4-generated-fixture-host-policy-v1'and r['runId']==run and r['source']==SOURCE and r['image']==IMAGE and r['authoritySHA256']==AUTHORITY
 assert r['scope']=='one admitted synthetic HH4 generated worker only'
 assert set(p)=={'schema','mode','approvalSha256','expiresAt'}and p['schema']==1 and p['mode']=='RELEASED'and p['approvalSha256']==AUTHORITY
 assert r['policySHA256']==sha(data)and r['policyBytes']==len(data)and r['policyMode']=='0400'and stat.S_IMODE(st.st_mode)==0o400
 assert st.st_uid==os.getuid()==r['policyUid']and st.st_dev==r['policyDevice']and st.st_ino==r['policyInode']
 expiry=int(datetime.datetime.fromisoformat(p['expiresAt']).timestamp()*1000)
 assert expiry==r['expiresAtMs']and expiry-r['issuedAtMs']==300000==r['maximumLifetimeMs']
 assert r['originalApplicationGuardChanged']is False and r['genuineOwnerApproval']is False and r['productionAuthority']is False
 if require_current:assert r['issuedAtMs']<=int(time.time()*1000)<expiry
 return r
def remove_after_termination(root,control,run,termination):
 policy,receipt=context(root,control,run)
 assert termination['runId']==run and termination['currentRunLabelAbsent']is True
 assert all(x['formerSessionLiveMembers']==[]for x in termination['hostControllers'])
 if not policy.exists()and not receipt.exists():return{'created':False,'policyRemoved':True,'afterOwnedContainersAbsent':True,'genuineOwnerApproval':False}
 r=validate(root,control,run,False);policy.unlink()
 fd=os.open(root,os.O_RDONLY|os.O_DIRECTORY)
 try:os.fsync(fd)
 finally:os.close(fd)
 assert not policy.exists()
 return{'created':True,'policyRemoved':True,'afterOwnedContainersAbsent':True,'policySHA256':r['policySHA256'],'expiresAtMs':r['expiresAtMs'],'genuineOwnerApproval':False}
