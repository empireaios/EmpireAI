"""Seal source-only completed components locally; one later bounded artifact commit.

These checkpoints are NOT durable remotely until the Actions upload commits.
Partial component sets never qualify for native execution or application PASS.
"""
import hashlib,json,os,pathlib,re,shutil,stat,time
from scan_package_archives import scan_packages
from retained_candidate_packages import PATTERNS
from capture_diagnostics import atomic

MAX_BYTES=1024**3
SOURCES={'backend':('6c1e63ba20619ee480742fd87dc810ca93152e22','a78aa0e0a91c1e765afb23e70fe05c75cddc836e'),'normal':('750483b3152f2c9c65a65b6381c8c94f081b9eb1','f589a8f0f94fbcdf113f162abac11d03c19acc25'),'recovery':('94d34cab7b0739849839ea3c66e50c8fdd3a2b27','5da61811a035b9504d74f699df8b164cc7f9f0ac')}

def sha(path):
 with pathlib.Path(path).open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()

def regular(path,maximum=MAX_BYTES):
 path=pathlib.Path(path);s=path.lstat()
 assert path.is_absolute() and path.resolve()==path and stat.S_ISREG(s.st_mode) and s.st_nlink==1 and s.st_size<=maximum,'CHECKPOINT_REGULAR_BOUND'
 return s

def metadata(path):
 regular(path,1024**2);data=path.read_bytes();json.loads(data)
 assert not any(pattern.search(data) for _,pattern in PATTERNS),'CHECKPOINT_METADATA_SECRET_PATTERN'
 return data

def summary(root):
 root=pathlib.Path(root);roles={}
 for role in SOURCES:
  receipt=root/'component-checkpoints'/role/'checkpoint.json'
  if receipt.exists():
   value=json.loads(metadata(receipt));assert value['role']==role and value['applicationAcceptance'] is False,'CHECKPOINT_RECEIPT_SCOPE'
   roles[role]={'package':value['package'],'checkpointSHA256':sha(receipt),'scanSHA256':value['scanSHA256'],'sourceReceiptFiles':value['sourceReceiptFiles']}
 value={'schema':'work8-v65-component-checkpoint-summary-v1','status':'COMPLETE_COMPONENT_CANDIDATES_UNQUALIFIED' if set(roles)==set(SOURCES) else 'PARTIAL_COMPONENT_CANDIDATES_UNQUALIFIED','components':roles,'missingComponents':sorted(set(SOURCES)-set(roles)),'remoteArtifactCommitted':False,'localOnlyUntilActionsArtifactCommit':True,'applicationAcceptance':False}
 atomic(root/'component-checkpoint-summary.json',value);return value

def seal(root,role,pin,archive,known_receipts=()):
 root=pathlib.Path(root).absolute();archive=pathlib.Path(archive).absolute();started=time.monotonic()
 assert root.resolve()==root and root.stat().st_uid==os.getuid() and stat.S_IMODE(root.stat().st_mode)==0o700,'PRIVATE_CHECKPOINT_ROOT_REQUIRED'
 assert role in SOURCES and (pin['commit'],pin['tree'])==SOURCES[role],'CHECKPOINT_SOURCE_BINDING'
 assert pathlib.PurePosixPath(pin['file']).name==pin['file'] and re.fullmatch('[a-f0-9]{64}',pin['sha256']),'CHECKPOINT_PACKAGE_IDENTITY'
 s=regular(archive);assert s.st_size==pin['bytes'] and sha(archive)==pin['sha256'],'CHECKPOINT_COMPLETE_ARCHIVE_REQUIRED'
 parent=root/'component-checkpoints';parent.mkdir(mode=0o700,exist_ok=True);target=parent/role
 assert not target.exists(),'COMPONENT_ALREADY_CHECKPOINTED';pending=parent/(role+'.partial');assert not pending.exists(),'PARTIAL_CHECKPOINT_REFUSED';pending.mkdir(mode=0o700)
 # The unchanged archive scanner examines only this complete immutable component;
 # all three are still required later by the complete-package/native gate.
 candidate={'backend':pin if role=='backend' else None,'frontends':{role:pin} if role!='backend' else {}}
 scan=scan_packages(archive.parent,candidate,roles=(role,));atomic(pending/'scan.json',scan)
 dest=pending/pin['file'];shutil.copyfile(archive,dest);dest.chmod(0o600);assert dest.stat().st_size==pin['bytes'] and sha(dest)==pin['sha256'],'CHECKPOINT_COPY_HASH_MISMATCH'
 receipt_inventory=[]
 for source in known_receipts:
  source=pathlib.Path(source).absolute();assert re.fullmatch(r'[a-zA-Z0-9_.-]+\.json',source.name),'KNOWN_RECEIPT_FILENAME'
  data=metadata(source);directory=pending/'receipts';directory.mkdir(mode=0o700,exist_ok=True);output=directory/source.name
  assert not output.exists(),'DUPLICATE_KNOWN_RECEIPT';output.write_bytes(data);output.chmod(0o600)
  receipt_inventory.append({'file':'receipts/'+source.name,'bytes':len(data),'sha256':sha(output)})
 value={'schema':'work8-v65-sealed-component-checkpoint-v1','role':role,'package':pin,'scanSHA256':sha(pending/'scan.json'),'sourceReceiptFiles':receipt_inventory,'completeArchiveVerified':True,'sourceOnlyScanPassed':True,'remoteArtifactCommitted':False,'applicationAcceptance':False}
 atomic(pending/'checkpoint.json',value);assert time.monotonic()-started<300,'COMPONENT_CHECKPOINT_DEADLINE'
 total=sum(p.stat().st_size for p in parent.rglob('*') if p.is_file());assert total<=MAX_BYTES-1024**2,'COMPONENT_CHECKPOINT_TOTAL_BOUND'
 os.rename(pending,target);return summary(root)

def export(root):
 root=pathlib.Path(root);current=summary(root);assert current['components'],'NO_COMPLETED_COMPONENT_CHECKPOINT'
 destination=root/'package-export';assert not destination.exists(),'CANDIDATE_ARTIFACT_ALREADY_STAGED';files={}
 for role,item in current['components'].items():
  source=root/'component-checkpoints'/role;receipt=json.loads(metadata(source/'checkpoint.json'));pin=receipt['package'];archive=source/pin['file']
  assert sha(source/'checkpoint.json')==item['checkpointSHA256'] and regular(archive).st_size==pin['bytes'] and sha(archive)==pin['sha256'],'SEALED_COMPONENT_CHANGED'
  assert sha(source/'scan.json')==receipt['scanSHA256'],'SEALED_SCAN_CHANGED'
  inventory={pin['file']:'archives/'+pin['file'],'checkpoint.json':'components/'+role+'/checkpoint.json','scan.json':'components/'+role+'/scan.json'}
  for row in receipt['sourceReceiptFiles']:
   p=source/row['file'];assert regular(p,1024**2).st_size==row['bytes'] and sha(p)==row['sha256'],'SEALED_KNOWN_RECEIPT_CHANGED';inventory[row['file']]='components/'+role+'/'+row['file']
  assert {p.relative_to(source).as_posix() for p in source.rglob('*') if p.is_file()}==set(inventory),'SEALED_COMPONENT_INVENTORY_CHANGED'
  for relative,name in inventory.items():assert name not in files,'DUPLICATE_EXPORT_FILE';files[name]=source/relative
 files['component-checkpoint-summary.json']=root/'component-checkpoint-summary.json'
 for name in ('v65-packages.json','package-source-scan.json'):
  p=root/name
  if p.exists():metadata(p);files[name]=p
 assert len(files)<=64 and sum(regular(p).st_size for p in files.values())<=MAX_BYTES-65536,'CHECKPOINT_EXPORT_BOUND'
 index={'schema':'work8-v65-candidate-checkpoint-export-v1','status':current['status'],'files':[{'path':name,'bytes':p.stat().st_size,'sha256':sha(p)} for name,p in sorted(files.items())],'missingComponents':current['missingComponents'],'nativeLaunchQualified':False,'applicationAcceptance':False,'remoteArtifactCommitted':False}
 destination.mkdir(mode=0o700)
 for name,p in files.items():out=destination/name;out.parent.mkdir(mode=0o700,parents=True,exist_ok=True);shutil.copyfile(p,out)
 atomic(destination/'checkpoint-export-index.json',index)
 total=sum(p.stat().st_size for p in destination.rglob('*') if p.is_file());assert total<=MAX_BYTES,'CHECKPOINT_EXPORT_AGGREGATE_BOUND'
 return {'status':current['status'],'path':str(destination),'bytes':total,'missingComponents':current['missingComponents'],'nativeLaunchQualified':False,'applicationAcceptance':False}
