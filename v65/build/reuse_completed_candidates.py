#!/usr/bin/env python3
"""Reuse the exact V75 completed packages and execute real controller preparation.

This is an offline preparation path, never GitHub identity/native admission.
The original reconstruction main is not replayed or reported as replayed.
No compiler, package manager, Docker, network, upload or application is invoked.
"""
import argparse,datetime,hashlib,importlib.util,json,os,pathlib,shutil,stat,subprocess,sys,zipfile
sys.dont_write_bytecode=True
HERE=pathlib.Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'adapter'))
import github_contract as guard
import reconstruct_all as reconstruction
import reconstruct_frontends as frontend
from capture_diagnostics import capture, atomic

ARTIFACT_SHA='39f904154764d2e70413045c7ebefbd4c04f38d0e09360ea19b2834fcc3ef755'
ARTIFACT_BYTES=338251567
MANIFEST_SHA='ec74f2565b34867d6164382a666f429ad998fec2bb57a98e540d19e1b9665fa4'
CONTROLLER_SHA='daa27901f6f19e62c1f2069c7843cbc2806c9b6e77b050082e7e38507b214e04'


def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module


def inventory(root):
 rows=[]
 for p in sorted(root.rglob('*')):
  s=p.lstat();guard.require(not stat.S_ISLNK(s.st_mode),'SOURCE_SYMLINK_REFUSED')
  if stat.S_ISREG(s.st_mode):rows.append({'path':str(p.relative_to(root)),'bytes':s.st_size,'sha256':guard.sha(p)})
 return rows


def admitted_private_root(root):
 guard.require(root.is_absolute() and root.resolve()==root,'CANONICAL_REUSE_ROOT_REQUIRED')
 value=root.lstat()
 guard.require(stat.S_ISDIR(value.st_mode) and not stat.S_ISLNK(value.st_mode) and value.st_uid==value.st_gid==1001 and stat.S_IMODE(value.st_mode)==0o700,'PRIVATE_REUSE_ROOT_REQUIRED')
 evidence=root/'reuse-evidence';value=evidence.lstat()
 guard.require(stat.S_ISDIR(value.st_mode) and not stat.S_ISLNK(value.st_mode) and value.st_uid==value.st_gid==1001 and stat.S_IMODE(value.st_mode)==0o700,'PRIVATE_REUSE_EVIDENCE_REQUIRED')
 return root


def observation(role):
 guard.require(os.getuid()==os.geteuid()==os.getgid()==os.getegid()==1001,'REVIEWED_PREPARATION_PRINCIPAL_REQUIRED')
 guard.require(os.environ.get('PYTHONDONTWRITEBYTECODE')=='1' and sys.dont_write_bytecode,'BYTECODE_SUPPRESSION_REQUIRED')
 guard.require(not any(k.startswith('GITHUB_') or k in ('GH_TOKEN','GITHUB_TOKEN') for k in os.environ),'LOCAL_REUSE_MUST_NOT_CLAIM_PROVIDER_IDENTITY')
 return {'role':role,'pid':os.getpid(),'ppid':os.getppid(),'uid':os.getuid(),'gid':os.getgid(),'pythonVersion':sys.version.split()[0],'environmentBytecodeDisabled':os.environ.get('PYTHONDONTWRITEBYTECODE'),'interpreterBytecodeDisabled':sys.dont_write_bytecode,'actualProviderIdentityClaimed':False,'applicationStarted':False}


def packages(root):
 candidate=guard.pinned_json(root/'v65-packages.json',MANIFEST_SHA)
 guard.require(set(candidate['frontends'])=={'normal','recovery'},'COMPLETE_FRONTEND_SET_REQUIRED')
 for role,pin in [('backend',candidate['backend']),*candidate['frontends'].items()]:
  guard.require({k:pin[k] for k in ('commit','tree')}==guard.SOURCES[role],'EXACT_SOURCE_PINS_REQUIRED')
  archive=root/'artifacts'/guard.relative_name(pin['file']);s=guard.regular(archive)
  guard.require(s.st_size==pin['bytes'] and guard.sha(archive)==pin['sha256'],'PRESERVED_PACKAGE_IDENTITY_CHANGED')
 return candidate


def verify_role(root,role):
 admitted_private_root(root)
 obs=observation(role+'-verification-grandchild')
 ctl=HERE.parent/'foundation/controller/scripts/work8/native-transition'
 before=inventory(ctl);guard.verify_manifest(ctl,ctl/'controller-manifest.json',CONTROLLER_SHA)
 candidate=packages(root)
 if role=='backend':
  backend=load('v81_reconstruction_backend',HERE/'reconstruct-backend.py')
  # These are the actual helper imports performed after backend assembly.
  correction=backend.load_module('a5_backend_packaging',ctl/'packaging_corrections.py')
  scanner=backend.load_module('a5_backend_scanner',ctl/'candidate_packages.py')
  guard.require(callable(correction.apply_exact_omission) and callable(scanner.scan_context),'ACTUAL_RECONSTRUCTION_HELPERS_REQUIRED')
 cp=load('v81_actual_package_verifier',ctl/'current_packages.py')
 cp.BACKEND=candidate['backend'];cp.FRONTENDS=candidate['frontends']
 results={'backend':cp.verify_backend(root/'artifacts'/candidate['backend']['file'])} if role=='backend' else {r:cp.verify_frontend(root/'artifacts'/p['file'],r) for r,p in candidate['frontends'].items()}
 after=inventory(ctl);guard.require(before==after,'CONTROLLER_IMPORT_FILESYSTEM_DRIFT')
 guard.verify_manifest(ctl,ctl/'controller-manifest.json',CONTROLLER_SHA)
 obs.update(status='PASS_ACTUAL_REUSE_CHILD_VERIFICATION',controllerFiles=len(before),controllerManifestSHA256=CONTROLLER_SHA,controllerInventoryUnchanged=True,cacheFilesCreated=0,actualPackageVerification=results,originalReconstructionMainExecuted=False,packagesRebuilt=False)
 atomic(root/'reuse-evidence'/(role+'-grandchild.json'),obs,exclusive=True)
 return obs


def child(root,role):
 admitted_private_root(root)
 obs=observation(role+'-child')
 if role=='backend':
  backend=load('v81_reconstruction_backend',HERE/'reconstruct-backend.py');env=backend.reconstruction_env()
 else:env=frontend.reconstruction_env(root)
 # Explicitly reuse the same environment constructor and bounded capture as
 # the real reconstruction entrypoints; no monkeypatch or subprocess substitute.
 argv=[sys.executable,'-B',str(__file__),'verify-role','--root',str(root),'--role',role]
 output=capture(argv,root,env,label='reuse-'+role+'-verification',receipts=root/'reuse-evidence/capture',seconds=180,maximum_seconds=180,maximum_stream_bytes=1024*1024,plain_diagnostic_codes=True)
 result=json.loads(output);guard.require(result['status']=='PASS_ACTUAL_REUSE_CHILD_VERIFICATION','ACTUAL_CHILD_VERIFICATION_FAILED')
 obs.update(status='PASS_ACTUAL_REUSE_CHILD',grandchildPID=result['pid'],grandchildPPID=result['ppid'],childEnvironmentKeys=sorted(env),childPYTHONDONTWRITEBYTECODE=env['PYTHONDONTWRITEBYTECODE'],grandchildBytecodeDisabled=result['interpreterBytecodeDisabled'])
 guard.require(result['ppid']==os.getpid(),'ACTUAL_DESCENDANT_RELATION_REQUIRED')
 atomic(root/'reuse-evidence'/(role+'-child.json'),obs,exclusive=True)
 return obs


def import_artifact(root,path):
 path=pathlib.Path(path);s=guard.regular(path)
 guard.require(s.st_size==ARTIFACT_BYTES and guard.sha(path)==ARTIFACT_SHA,'EXACT_PRESERVED_ARTIFACT_REQUIRED')
 with zipfile.ZipFile(path) as z:
  names=z.namelist();guard.require(len(names)==len(set(names)),'ARTIFACT_DUPLICATE_MEMBER')
  for n in names:guard.relative_name(n);guard.require(not stat.S_ISLNK(z.getinfo(n).external_attr>>16),'ARTIFACT_LINK_REFUSED')
  index=json.loads(z.read('checkpoint-export-index.json'));expected={e['path']:e for e in index['files']}
  guard.require(len(expected)==len(index['files'])==45 and set(names)==set(expected)|{'checkpoint-export-index.json'},'COMPLETE_PRESERVED_ARTIFACT_INDEX_REQUIRED')
  candidate_bytes=z.read('v65-packages.json');guard.require(hashlib.sha256(candidate_bytes).hexdigest()==MANIFEST_SHA,'EXACT_PACKAGE_MANIFEST_REQUIRED')
  candidate=json.loads(candidate_bytes);artifacts=root/'artifacts';artifacts.mkdir(mode=0o700)
  pins={p['file']:p for p in [candidate['backend'],*candidate['frontends'].values()]}
  metadata=root/'retained-component-evidence';metadata.mkdir(mode=0o700)
  for name,e in sorted(expected.items()):
   if name.startswith('archives/'):
    basename=pathlib.PurePosixPath(name).name;guard.require(basename in pins and e['sha256']==pins[basename]['sha256'] and e['bytes']==pins[basename]['bytes'],'ARCHIVE_INDEX_PIN_MISMATCH');target=artifacts/basename
   elif name=='v65-packages.json':target=root/name
   else:target=metadata/name;target.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
   h=hashlib.sha256();size=0
   with z.open(name) as src,target.open('xb') as out:
    while block:=src.read(1024*1024):size+=len(block);h.update(block);out.write(block)
   target.chmod(0o600);guard.require(size==e['bytes'] and h.hexdigest()==e['sha256'],'PRESERVED_ARTIFACT_MEMBER_CHANGED')
  origin={'schema':'work8-v81-preserved-package-reuse-v1','artifactSHA256':ARTIFACT_SHA,'artifactBytes':ARTIFACT_BYTES,'packageManifestSHA256':MANIFEST_SHA,'historicalRunId':41860150363,'historicalJobId':126679410501,'historicallyReconstructed':True,'rebuiltThisExecution':False,'applicationStarted':False,'nativeAdmissionGranted':False,'executionAuthorityGranted':False,'all45CheckpointEntriesVerified':True}
  atomic(root/'package-origin.json',origin,exclusive=True)
  return origin


def prepare(args):
 root=pathlib.Path(args.root)
 guard.require(root.is_absolute() and root.resolve()==root and not root.exists(),'FRESH_ABSOLUTE_REUSE_ROOT_REQUIRED')
 guard.require(os.getuid()==os.geteuid()==os.getgid()==os.getegid()==1001,'REVIEWED_PREPARATION_PRINCIPAL_REQUIRED')
 guard.require(not any(k.startswith('GITHUB_') or k in ('GH_TOKEN','GITHUB_TOKEN') for k in os.environ),'NO_LOCAL_PROVIDER_IMPERSONATION')
 os.umask(0o077);root.mkdir(mode=0o700);args.admitted_root=True
 for name in ('home','logs','reuse-evidence','runtime-evidence'):(root/name).mkdir(mode=0o700)
 source=HERE.parent;before=inventory(source);origin=import_artifact(root,pathlib.Path(args.candidate_artifact))
 env=reconstruction.reconstruction_env(root,hosted=False)
 steps=[]
 for role in ('backend','frontends'):
  argv=[sys.executable,'-B',str(__file__),'child','--root',str(root),'--role',role]
  steps.append(frontend.command(argv,root,env,root/'logs','backend-reconstruction' if role=='backend' else 'frontend-reconstruction',240))
  receipt=json.loads((root/'reuse-evidence'/(role+'-child.json')).read_text());guard.require(receipt['ppid']==os.getpid(),'ACTUAL_CHILD_RELATION_REQUIRED')
 # Exact package/manifest/driver/native Node validation is the real adapter CLI.
 argv=[sys.executable,'-B',str(HERE.parent/'adapter/runner.py'),'prepare','--root',str(root),'--retained-driver',str(pathlib.Path(args.retained_driver))]
 output=capture(argv,root,env,label='reuse-controller-prepare',receipts=root/'reuse-evidence/capture',seconds=240,maximum_seconds=240,maximum_stream_bytes=1024*1024,plain_diagnostic_codes=True)
 controller_result=json.loads(output)
 guard.require(controller_result['status']=='COMPLETE_CURRENT_PACKAGES_VERIFIED_AWAITING_EXTERNAL_EQUIVALENCE','ACTUAL_CONTROLLER_PREPARATION_REQUIRED')
 after=inventory(source);guard.require(before==after,'SOURCE_FILESYSTEM_DRIFT')
 result={'schema':'work8-v81-sequential-reuse-handoff-v1','status':'PASS_COMPLETE_RETAINED_PACKAGE_TO_CONTROLLER_PREPARATION','actualSequence':['verify exact V75 artifact and45 indexed entries','backend reconstruction environment child','backend reconstruction environment grandchild and actual helper imports plus full OCI verification','frontend reconstruction environment child','frontend reconstruction environment grandchild and full package-member verification','actual runner.prepare CLI and exact retained driver import','bundled Node22.23.2 --version','full controller/package/driver manifests and member hashes'],'orchestratorPID':os.getpid(),'uid':os.getuid(),'gid':os.getgid(),'sourceFileSetSHA256':hashlib.sha256(json.dumps(before,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'sourceFileCount':len(before),'sourceInventoryUnchanged':True,'cacheFilesCreated':0,'controller':controller_result,'steps':steps,'origin':origin,'actualProviderIdentityClaimed':False,'originalReconstructionMainExecuted':False,'packagesRebuilt':False,'hostedSequenceQualified':False,'nativeSecurityAdmissionGranted':False,'applicationStarted':False,'A5AcceptanceGranted':False,'originalEightGroupsReexamined':False,'noNewFinancialAuthority':True,'recordedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 atomic(root/'reuse-evidence/sequential-handoff.json',result,exclusive=True)
 return result


def main():
 p=argparse.ArgumentParser();p.add_argument('command',choices=['prepare','child','verify-role']);p.add_argument('--root',required=True);p.add_argument('--role',choices=['backend','frontends']);p.add_argument('--candidate-artifact');p.add_argument('--retained-driver');args=p.parse_args()
 try:
  result=prepare(args) if args.command=='prepare' else child(pathlib.Path(args.root),args.role) if args.command=='child' else verify_role(pathlib.Path(args.root),args.role)
  print(json.dumps(result,sort_keys=True))
 except Exception as exc:
  root=pathlib.Path(args.root);code=str(exc) if isinstance(exc,(guard.Refusal,frontend.Refusal)) else type(exc).__name__
  receipt={'schema':'work8-v81-reuse-first-failure-v1','stage':args.command,'code':code,'applicationStarted':False,'rawOutputsExported':False}
  # An invalid or repeated preparation root is never a diagnostic destination.
  # Preserve only inside the admitted private owned tree, without following links.
  admitted=getattr(args,'admitted_root',False) or args.command in ('child','verify-role')
  try:
   guard.require(admitted and root.is_absolute() and root.resolve()==root,'ADMITTED_DIAGNOSTIC_ROOT_REQUIRED')
   rs=root.lstat();guard.require(stat.S_ISDIR(rs.st_mode) and rs.st_uid==os.getuid()==1001 and rs.st_gid==1001 and stat.S_IMODE(rs.st_mode)==0o700,'PRIVATE_DIAGNOSTIC_ROOT_REQUIRED')
   directory=root/'reuse-evidence';ds=directory.lstat();guard.require(stat.S_ISDIR(ds.st_mode) and not stat.S_ISLNK(ds.st_mode) and ds.st_uid==os.getuid() and ds.st_gid==1001 and stat.S_IMODE(ds.st_mode)==0o700,'PRIVATE_DIAGNOSTIC_DIRECTORY_REQUIRED')
   dfd=os.open(directory,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
   try:
    try:fd=os.open('first-reuse-failure.json',os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600,dir_fd=dfd)
    except FileExistsError:fd=None
    if fd is not None:
     with os.fdopen(fd,'w') as stream:json.dump(receipt,stream,sort_keys=True);stream.write('\n');stream.flush();os.fsync(stream.fileno())
   finally:os.close(dfd)
  except Exception:pass
  print(json.dumps(receipt,sort_keys=True));raise SystemExit(18)

if __name__=='__main__':main()
