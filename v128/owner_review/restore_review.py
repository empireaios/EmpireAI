#!/usr/bin/env python3
"""Restore the reviewed A08 private snapshot without replay or auth import."""
import argparse, hashlib, json, os, pathlib, re, sqlite3, stat

EXPECTED_RUN='43434940694'
EXPECTED_COMMIT='690f66acf64d9d40a8e39a87b5a24d31982f9cad'
EXPECTED_STORE_SHA='8097305c3253118be8bf41564184b9b6db78447894dc0b8a7a35b5a2b8510675'
BASELINE_MANIFEST_SHA='90a84ca98be89e8861a1c9eda801921fcfe6aff68449168824b663836dcbc650'
INPUTS={
 'connector-media-native-store.sqlite':('commerce/runtime.sqlite',425984,EXPECTED_STORE_SHA),
 'connector-media-original.jpg':('media/retained-original.jpg',149719,'4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048'),
 'connector-media-revised.png':('media/retained-revised.png',599818,'69f1f95ab622041332d5e5e1ee43a59a2c34bd017151a6bb45e260f69e035788'),
}
def require(condition,code):
 if not condition:raise ValueError(code)
def sha(raw):return hashlib.sha256(raw).hexdigest()
def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
def read_bounded(path,maximum):
 path=pathlib.Path(path).absolute();require(path.resolve()==path,'SOURCE_LINK_PATH')
 fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW)
 try:
  before=os.fstat(fd);require(stat.S_ISREG(before.st_mode)and before.st_nlink==1 and before.st_size<=maximum,'SOURCE_FILE_BOUND')
  with os.fdopen(os.dup(fd),'rb')as f:raw=f.read(maximum+1)
  after=os.fstat(fd);require((before.st_dev,before.st_ino,before.st_size,before.st_mtime_ns,before.st_ctime_ns)==(after.st_dev,after.st_ino,after.st_size,after.st_mtime_ns,after.st_ctime_ns),'SOURCE_CHANGED')
  require(len(raw)==before.st_size,'SOURCE_SIZE');return raw
 finally:os.close(fd)
def inspect_store(path):
 path=pathlib.Path(path).absolute();require(path.resolve()==path,'STORE_LINK_PATH')
 require(not any(pathlib.Path(str(path)+s).exists()for s in ['-wal','-shm','-journal']),'STORE_SIDECAR')
 connection=sqlite3.connect(path.as_uri()+'?mode=ro&immutable=1',uri=True,timeout=1)
 try:
  connection.execute('PRAGMA query_only=ON');connection.execute('PRAGMA trusted_schema=OFF')
  require(connection.execute('PRAGMA integrity_check').fetchall()==[('ok',)],'STORE_INTEGRITY')
  schema=connection.execute("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY type,name").fetchall()
  tables=[];events=[]
  for (name,)in connection.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
   require(re.fullmatch('[a-z0-9_]+',name) is not None,'TABLE_NAME')
   require(not any(term in name for term in ['auth','session','user'])or name=='work8_preparation_authority' or name=='work8_twin_authority','AUTH_STORE_IMPORT')
   columns=[r[1]for r in connection.execute('PRAGMA table_info("'+name+'")')]
   rows=connection.execute('SELECT * FROM "'+name+'"').fetchall();require(len(rows)<=128,'ROW_BOUND')
   encoded=sorted(canonical(list(row)).decode()for row in rows)
   tables.append({'name':name,'columns':columns,'rows':len(rows),'rowsSHA256':sha(canonical(encoded))})
   if name=='work8_connector_media':
    for row in sorted(rows,key=lambda r:r[2]):
     raw=row[columns.index('record')];event=json.loads(raw)
     events.append({'version':event['version'],'action':event['action'],'recordBytes':len(raw.encode()),'recordSHA256':sha(raw.encode()),'digest':event['digest'],'previous':event['previous'],'batchDigest':event['batchDigest'],'ownerApproval':event['ownerApproval']})
  return {'schemaSHA256':sha(canonical(schema)),'tables':tables,'mediaEvents':events}
 finally:connection.close()
def write_exclusive(path,raw,mode):
 fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,mode)
 try:
  with os.fdopen(os.dup(fd),'wb')as stream:stream.write(raw);stream.flush()
  os.fsync(fd)
 finally:os.close(fd)
def read_baseline(path):
 raw=read_bounded(path,65536);require(sha(raw)==BASELINE_MANIFEST_SHA,'EXACT_BASELINE_MANIFEST_REQUIRED');return json.loads(raw)
def restore(source,target,receipt,manifest_path):
 source=pathlib.Path(source).absolute();target=pathlib.Path(target).absolute();receipt=pathlib.Path(receipt).absolute()
 manifest=read_baseline(manifest_path);require(manifest['schema']=='A09_RETAINED_A08_OWNER_REVIEW_BASELINE_V1','MANIFEST_SCHEMA')
 require(manifest['sourceRun']==EXPECTED_RUN and manifest['sourceCommit']==EXPECTED_COMMIT,'SOURCE_IDENTITY')
 require(manifest['snapshot']['sha256']==EXPECTED_STORE_SHA,'SOURCE_STORE_PIN')
 require(target.parent.resolve()==target.parent and not target.exists(),'TARGET_MUST_BE_NEW')
 require(receipt.parent.resolve()==receipt.parent and not receipt.exists(),'RECEIPT_MUST_BE_NEW')
 blobs={}
 for name,(_destination,length,digest)in INPUTS.items():
  raw=read_bounded(source/name,length);require(len(raw)==length and sha(raw)==digest,'SOURCE_PIN_'+name);blobs[name]=raw
 target.mkdir(mode=0o700);(target/'commerce').mkdir(mode=0o700);(target/'media').mkdir(mode=0o700)
 for name,(destination,_length,_digest)in INPUTS.items():write_exclusive(target/destination,blobs[name],0o600 if name.endswith('.sqlite')else 0o400)
 actual=inspect_store(target/'commerce/runtime.sqlite')
 require(actual==manifest['storeInventory'],'RESTORED_ALL_ROWS_OR_SCHEMA_MISMATCH')
 require([x['version']for x in actual['mediaEvents']]==[1,2]and[x['action']for x in actual['mediaEvents']]==['REQUEST_EDIT','PROPOSE_RETAINED']and all(x['ownerApproval']is False for x in actual['mediaEvents']),'ORIGINAL_PREPARATION_HISTORY')
 # Re-read both copies: callers may not replace the preserved source during restore.
 for name,(destination,length,digest)in INPUTS.items():
  require(sha(read_bounded(source/name,length))==digest,'PRESERVED_SOURCE_CHANGED')
  require(sha(read_bounded(target/destination,length))==digest,'RESTORED_BYTES_CHANGED')
 record={'schema':'A09_EXACT_NATIVE_RESTORE_READONLY_RECEIPT_V1','status':'RESTORED_EXACT_A08_VERSION_2','sourceRun':EXPECTED_RUN,'sourceCommit':EXPECTED_COMMIT,'manifestSHA256':sha(read_bounded(manifest_path,65536)),'snapshotSHA256':EXPECTED_STORE_SHA,'restoredInventory':actual,'restoredVersion':2,'expectedOwner':manifest['owner'],'workspace':manifest['workspace'],'candidateId':manifest['candidateId'],'candidateDigest':manifest['candidateDigest'],'batchDigest':manifest['batchDigest'],'originalSourceUnchanged':True,'allOriginalRowsAndSchemaUnchanged':True,'preparationCommandsReplayed':0,'authenticationImported':False,'ownerActionObserved':False,'ownerApproval':False,'selection':[],'commerce':'LOCKED','pillow':'NOT_BORN','work9':'INACTIVE','productionAccess':False,'acceptanceClaimed':False}
 write_exclusive(receipt,json.dumps(record,indent=2).encode()+b'\n',0o400);return record
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--source',required=True);parser.add_argument('--target',required=True);parser.add_argument('--receipt',required=True);parser.add_argument('--manifest',required=True);args=parser.parse_args()
 result=restore(args.source,args.target,args.receipt,args.manifest)
 print(json.dumps({'status':result['status'],'snapshotSHA256':result['snapshotSHA256'],'restoredVersion':2,'ownerActionObserved':False}))
