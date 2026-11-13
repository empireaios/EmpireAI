"""Bounded custody orchestration after the sealer proves all exact containers absent."""
import hashlib,json,os,pathlib,stat,subprocess

SCHEMA='v128-actual-media-store-custody-v1'
FULL='PRESERVED_ACTUAL_NATIVE_MEDIA_STORE'
PARTIAL='PRESERVED_PARTIAL_NATIVE_MEDIA_STATE_NOT_OWNER_READY'
ASSETS={
 'connector-media-original.jpg':(149719,'4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048'),
 'connector-media-revised.png':(599818,'69f1f95ab622041332d5e5e1ee43a59a2c34bd017151a6bb45e260f69e035788')}

def preserve_after_drain(control,runtime,private,run,source,scoped_names):
 """Return sanitized failure instead of interrupting mandatory secret cleanup."""
 if not os.path.lexists(runtime/'state/commerce/runtime.sqlite'):return None
 try:
  evidence=runtime/'evidence'
  if not evidence.is_dir() or evidence.is_symlink():raise RuntimeError('CUSTODY_EVIDENCE_DIRECTORY')
  drain={'schema':'v128-media-container-drain-v1','runId':run,'sourceCommit':source,
   'allScopedContainersAbsent':True,'scopedContainers':scoped_names}
  with (evidence/'connector-media-container-drain.json').open('x')as stream:
   json.dump(drain,stream,indent=2);stream.write('\n');stream.flush();os.fsync(stream.fileno())
  result=subprocess.run(['python3','-B',str(control/'snapshot_media_store.py'),str(runtime),str(private)],
   stdin=subprocess.DEVNULL,capture_output=True,timeout=35,
   env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','GITHUB_RUN_ID':run,'GITHUB_SHA':source})
  if len(result.stdout)+len(result.stderr)>1048576:raise RuntimeError('CUSTODY_OUTPUT_BOUND')
  if result.returncode!=0:raise RuntimeError('CUSTODY_SUBPROCESS_'+str(result.returncode)+'_'+hashlib.sha256(result.stdout+result.stderr).hexdigest())
  path=evidence/'connector-media-store-custody.json';s=path.lstat()
  if not stat.S_ISREG(s.st_mode)or s.st_nlink!=1 or s.st_size>4194304:raise RuntimeError('CUSTODY_RECEIPT_TYPE')
  receipt=json.loads(path.read_bytes())
  if receipt.get('schema')!=SCHEMA or receipt.get('status')not in(FULL,PARTIAL):raise RuntimeError('CUSTODY_RECEIPT_STATUS')
  return None
 except Exception as error:
  return {'schema':'v128-media-store-custody-first-failure-v1','status':'FAILED_MEDIA_STORE_CUSTODY',
   'errorClass':type(error).__name__,'errorSHA256':hashlib.sha256(str(error).encode()).hexdigest(),
   'historyRecreated':False,'ownerApproval':False,'cleanupMustContinue':True,'wholeRowAccepted':False}

def append_preserved_store(runtime,values,append,require,sha):
 receipt=values.get('connector-media-store-custody.json')
 if receipt is None:return False
 require(receipt.get('schema')==SCHEMA and receipt.get('status')in(FULL,PARTIAL),'MEDIA_STORE_CUSTODY_STATUS')
 require(receipt.get('sourceUnchanged')is True and receipt.get('originalOpenedBySQLite')is False and receipt.get('integrityCheck')=='ok'
  and receipt.get('snapshotSidecarsAbsent')is True and receipt.get('historyRecreated')is False and receipt.get('ownerApproval')is False
  and receipt.get('authStoreIncluded')is False and receipt.get('credentialByteScanPassed')is True,'MEDIA_STORE_CUSTODY_BOUNDARY')
 artifacts=receipt['artifacts'];names=[row['path']for row in artifacts]
 require(1<=len(artifacts)<=3 and len(set(names))==len(names)and set(names)<=set(ASSETS)|{'connector-media-native-store.sqlite'}
  and'connector-media-native-store.sqlite'in names,'MEDIA_STORE_ARTIFACT_SET')
 if receipt['status']==FULL:require(set(names)==set(ASSETS)|{'connector-media-native-store.sqlite'},'MEDIA_STORE_FULL_ASSETS')
 for row in artifacts:
  p=runtime/'evidence'/row['path'];s=p.lstat()
  require(stat.S_ISREG(s.st_mode)and s.st_nlink==1 and 0<s.st_size<=4194304,'MEDIA_STORE_ARTIFACT_TYPE')
  b=p.read_bytes();require(len(b)==row['bytes']and sha(b)==row['sha256'],'MEDIA_STORE_ARTIFACT_BYTES')
  if row['path']in ASSETS:require((len(b),sha(b))==ASSETS[row['path']],'MEDIA_STORE_EXACT_ASSET')
  else:require(b.startswith(b'SQLite format 3\0'),'MEDIA_STORE_SQLITE_HEADER')
  append(row['path'],b)
 return receipt['status']==FULL and receipt.get('retainedForFutureOwnerReview')is True
