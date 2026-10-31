"""Exact reviewed runtime-package omission; no detector exceptions or source edits."""
import hashlib,json,pathlib,stat
SCRIPT=pathlib.Path(__file__).resolve().parent
POLICY_PATH=SCRIPT/'package-exclusions.json'

def sha(path):
 with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def regular(path,root):
 assert path.is_relative_to(root) and path.resolve().is_relative_to(root) and path.is_file() and not path.is_symlink(),'PACKAGING_FILE_SHAPE_REFUSED'
 assert stat.S_ISREG(path.lstat().st_mode),'PACKAGING_FILE_TYPE_REFUSED'
 return path

def package_inventory(package):
 result={}
 for p in sorted(package.rglob('*')):
  assert not p.is_symlink(),'SQLJS_PACKAGE_SYMLINK_REFUSED'
  if p.is_file():result[str(p.relative_to(package))]=sha(p)
 return result

def apply_exact_omission(context,evidence):
 context=context.resolve();policy=json.loads(POLICY_PATH.read_text());package=context/policy['packageRoot']
 assert package.is_dir() and not package.is_symlink() and package.resolve().is_relative_to(context),'SQLJS_PACKAGE_ROOT_REFUSED'
 assert len(policy['remove'])==5 and len({e['path'] for e in policy['remove']})==5,'EXACT_REMOVAL_SET_REFUSED'
 assert policy['scannerExceptions']==[] and policy['applicationPinsChanged'] is False
 package_json=regular(package/'package.json',context)
 assert sha(package_json)==policy['packageJsonSha256'],'SQLJS_PACKAGE_IDENTITY_REFUSED'
 metadata=json.loads(package_json.read_text())
 assert metadata['name']==policy['packageName'] and metadata['version']==policy['packageVersion'],'SQLJS_PACKAGE_VERSION_REFUSED'
 assert metadata['main']=='./'+policy['defaultEntry'] and metadata['exports']['.']['default']=='./'+policy['defaultEntry'],'SQLJS_DEFAULT_ENTRY_REFUSED'
 assert sha(regular(context/policy['lockfilePath'],context))==policy['lockfileSha256'],'SQLJS_LOCKFILE_IDENTITY_REFUSED'
 assert sha(regular(context/policy['canonicalConsumerPath'],context))==policy['canonicalConsumerSha256'],'SQLJS_CONSUMER_IDENTITY_REFUSED'
 before=package_inventory(package)
 retained={}
 for relative,expected in policy['preserve'].items():
  p=regular(package/relative,context);assert sha(p)==expected,'SQLJS_RETAINED_FILE_IDENTITY_REFUSED';retained[relative]=expected
 # Validate the complete exact set before the first deletion; a changed file
 # cannot cause a partial omission or a broader wildcard deletion.
 targets=[]
 for entry in policy['remove']:
  p=regular(context/entry['path'],context)
  assert p.is_relative_to(package/'dist'),'SQLJS_REMOVAL_SCOPE_REFUSED'
  assert p.stat().st_size==entry['bytes'] and sha(p)==entry['sha256'],'SQLJS_REMOVAL_HASH_MISMATCH'
  targets.append(p)
 for p in targets:p.unlink()
 after=package_inventory(package);removed={str(p.relative_to(package)) for p in targets}
 assert set(before)-set(after)==removed and not set(after)-set(before),'SQLJS_UNEXPECTED_FILE_SET_CHANGE'
 assert all(before[path]==digest for path,digest in after.items()),'SQLJS_UNEXPECTED_CONTENT_CHANGE'
 assert all(after[path]==digest for path,digest in retained.items())
 receipt={'schema':'work8-v23-exact-package-omission-receipt-v1','status':'EXACT_FIVE_UNUSED_ASM_VARIANTS_REMOVED_BEFORE_IMAGE_BUILD','policySha256':sha(POLICY_PATH),'helperSha256':sha(pathlib.Path(__file__)),'sourceCommit':policy['sourceCommit'],'classificationReviewSha256':policy['classificationReviewSha256'],'diagnosticRunId':policy['diagnosticRunId'],'package':{'name':metadata['name'],'version':metadata['version'],'packageJsonSha256':policy['packageJsonSha256'],'defaultEntry':policy['defaultEntry']},'removed':policy['remove'],'preserved':retained,'remainingPackageFileCount':len(after),'remainingPackageManifestSha256':hashlib.sha256(json.dumps(after,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'otherFileContentChanged':False,'detectorExceptions':[],'licenseAndReadmePreserved':True,'removedAfterCompilationBeforeDockerCopy':True}
 (evidence/'backend-packaging-removal.json').write_text(json.dumps(receipt,indent=2)+'\n')
 return receipt
