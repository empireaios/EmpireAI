#!/usr/bin/env python3
"""Freeze one bounded review outcome without auth/session export."""
import argparse,contextlib,hashlib,json,os,pathlib,sqlite3,time,zipfile
from restore_review import INPUTS,BASELINE_MANIFEST_SHA,inspect_store,read_bounded,read_baseline,require,sha,write_exclusive

def seal(state,baseline_path,receipts,out,*,runtime_manifest,source_manifest,build_provenance,runtime_sha256,source_sha256):
 state=pathlib.Path(state).absolute();receipts=pathlib.Path(receipts).absolute();out=pathlib.Path(out).absolute()
 baseline=read_baseline(baseline_path);require(not out.exists()and out.parent.resolve()==out.parent,'FRESH_EXPORT_DIRECTORY')
 restored=json.loads(read_bounded(receipts/'restore-readonly.json',131072))
 require(restored.get('schema')=='A09_EXACT_NATIVE_RESTORE_READONLY_RECEIPT_V1'and restored.get('status')=='RESTORED_EXACT_A08_VERSION_2'and restored.get('restoredVersion')==2 and restored.get('manifestSHA256')==BASELINE_MANIFEST_SHA,'RESTORE_RECEIPT_BINDING')
 require(restored.get('sourceRun')==baseline['sourceRun']and restored.get('sourceCommit')==baseline['sourceCommit']and restored.get('snapshotSHA256')==baseline['snapshot']['sha256']and restored.get('restoredInventory')==baseline['storeInventory'],'RESTORE_RECEIPT_SOURCE')
 for key in ['workspace','candidateId','candidateDigest','batchDigest']:require(restored.get(key)==baseline[key],'RESTORE_RECEIPT_IDENTITY')
 require(restored.get('expectedOwner')==baseline['owner']and restored.get('preparationCommandsReplayed')==0 and restored.get('authenticationImported')is False and restored.get('ownerActionObserved')is False and restored.get('ownerApproval')is False and restored.get('selection')==[] and restored.get('allOriginalRowsAndSchemaUnchanged')is True and restored.get('originalSourceUnchanged')is True,'RESTORE_RECEIPT_TRUTH')
 out.mkdir(mode=0o700);database=out/'review-native-store.sqlite';source=state/'commerce/runtime.sqlite'
 require(source.resolve()==source and source.stat().st_size<=4*1024*1024,'STORE_BOUND')
 deadline=time.monotonic()+2
 with contextlib.closing(sqlite3.connect(source.as_uri()+'?mode=ro',uri=True,timeout=.2))as incoming,contextlib.closing(sqlite3.connect(database,timeout=.2))as destination:
  incoming.execute('PRAGMA query_only=ON');incoming.execute('PRAGMA trusted_schema=OFF')
  def progress(status,remaining,total):require(time.monotonic()<deadline and total*4096<=4*1024*1024,'BACKUP_BOUND')
  incoming.backup(destination,pages=64,progress=progress,sleep=.001);destination.execute('PRAGMA journal_mode=DELETE')
 actual=inspect_store(database);prior=baseline['storeInventory']
 require(actual['schemaSHA256']==prior['schemaSHA256'],'SCHEMA_CHANGED')
 expected={x['name']:x for x in prior['tables']};require(set(expected)=={x['name']for x in actual['tables']},'TABLE_SET_CHANGED')
 for row in actual['tables']:
  if row['name']!='work8_connector_media':require(row==expected[row['name']],'UNRELATED_STATE_CHANGED')
 require(actual['mediaEvents'][:2]==prior['mediaEvents']and len(actual['mediaEvents'])in [2,3],'HISTORY_REWRITTEN_OR_EXTRA_EVENT')
 outcome=None;event=None
 with contextlib.closing(sqlite3.connect(database.as_uri()+'?mode=ro&immutable=1',uri=True))as db:
  if len(actual['mediaEvents'])==3:
   raw=db.execute('SELECT record FROM work8_connector_media WHERE version=3').fetchone()[0];event=json.loads(raw)
   require(event['version']==3 and event['previous']==baseline['proposalEventDigest']and event['batchDigest']==baseline['batchDigest']and event['candidateId']==baseline['candidateId']and event['candidateDigest']==baseline['candidateDigest']and event['owner']==baseline['owner']and event['workspace']==baseline['workspace'],'FINAL_EVENT_BINDING')
   require(event['action']in ['ACKNOWLEDGE_REVIEW','APPROVE_INTERNAL','REJECT']and event['ownerApproval']==(event['action']=='APPROVE_INTERNAL')and event['externalEffects']==event['paidInference']==0,'FINAL_ACTION_SCOPE')
   if event['action']=='ACKNOWLEDGE_REVIEW':require(event['assetIds']==[],'ACK_IS_NOT_SELECTION')
   body={k:v for k,v in event.items()if k!='digest'};require(sha(json.dumps(body,separators=(',',':'),ensure_ascii=False).encode())==event['digest'],'FINAL_EVENT_DIGEST')
   outcome={k:event[k]for k in ['version','action','digest','previous','batchDigest','candidateId','candidateDigest','ownerApproval','assetIds']}
 for name,(relative,length,digest)in INPUTS.items():
  if name.endswith('.sqlite'):continue
  raw=read_bounded(state/relative,length);require(sha(raw)==digest,'MEDIA_CHANGED');write_exclusive(out/pathlib.Path(relative).name,raw,0o400)
 receipt_rows=[]
 for name in ['transport-restoration.json','restore-readonly.json','startup-readonly.json','authenticated-owner-input.json','native-owner-outcome.json']:
  file=receipts/name
  if file.exists():
   raw=read_bounded(file,131072);write_exclusive(out/name,raw,0o400);receipt_rows.append({'path':name,'bytes':len(raw),'sha256':sha(raw)})
 require(any(x['path']=='restore-readonly.json'for x in receipt_rows),'RESTORE_RECEIPT_REQUIRED')
 if outcome is not None:
  input_raw=read_bounded(receipts/'authenticated-owner-input.json',131072);bound=json.loads(input_raw)
  native=json.loads(read_bounded(receipts/'native-owner-outcome.json',131072))
  require(bound.get('schema')=='A09_AUTHENTICATED_OWNER_INPUT_BINDING_V1'and bound.get('nativeOwnerPrincipalAuthenticated')is True and bound.get('expectedVersion')==2,'ATTRIBUTABLE_INPUT_REQUIRED')
  for key in ['owner','workspace','candidateId','candidateDigest','batchDigest','action']:require(bound.get(key)==event[key],'INPUT_EVENT_BINDING')
  require(bound.get('requestId')==event['id']and bound.get('personalActorAttribution')=='REQUIRES_INDEPENDENT_OWNER_HANDOFF_OBSERVATION','INPUT_EVENT_IDENTITY')
  require(native.get('schema')=='A09_NATIVE_OWNER_CHOICE_READBACK_V1'and native.get('authenticatedInputSHA256')==sha(input_raw)and native.get('version')==3 and native.get('event')==event and native.get('ownerApproval')==event['ownerApproval'],'NATIVE_OUTCOME_BINDING')
  require(native.get('selectedAssetIds')==(event['assetIds']if event['ownerApproval']else []),'NATIVE_SELECTION_BINDING')
  require(native.get('personalActorAttribution')=='REQUIRES_INDEPENDENT_OWNER_HANDOFF_OBSERVATION'and native.get('acceptanceClaimed')is False and bound.get('approvalClaimed')is False,'NO_AUTOMATIC_PERSONAL_ACCEPTANCE')
  startup=json.loads(read_bounded(receipts/'startup-readonly.json',131072))
  require(startup.get('schema')=='A09_RESTORED_NATIVE_STARTUP_READONLY_V1'and startup.get('restoredVersion')==2 and startup.get('proposalDigest')==baseline['proposalEventDigest']and startup.get('batchDigest')==baseline['batchDigest']and startup.get('originalRecordSHA256')==[e['recordSHA256']for e in baseline['storeInventory']['mediaEvents']],'STARTUP_READBACK_BINDING')
  require(startup.get('allOriginalRowsAndSchemaUnchanged')is True and startup.get('ownerAuthenticated')is False and startup.get('ownerActionObserved')is False and startup.get('ownerApproval')is False and startup.get('selection')==[] and startup.get('preparationReplayed')is False and startup.get('productionAccess')is False and startup.get('acceptanceClaimed')is False,'STARTUP_READBACK_TRUTH')
 metadata=[]
 for name,source,expected in [('runtime-manifest.json',runtime_manifest,runtime_sha256),('source-manifest.json',source_manifest,source_sha256),('build-provenance.json',build_provenance,None),('retained-a08-baseline.json',baseline_path,BASELINE_MANIFEST_SHA)]:
  raw=read_bounded(source,32*1024*1024);require(expected is None or sha(raw)==expected,'RUNTIME_SOURCE_METADATA_PIN')
  json.loads(raw);write_exclusive(out/name,raw,0o400);metadata.append({'path':name,'bytes':len(raw),'sha256':sha(raw)})
 summary={'schema':'A09_FIXED_NATIVE_OWNER_REVIEW_EXPORT_V1','sourceRun':baseline['sourceRun'],'sourceCommit':baseline['sourceCommit'],'restoredSnapshotSHA256':baseline['snapshot']['sha256'],'finalStoreSHA256':sha(database.read_bytes()),'finalInventory':actual,'finalOutcome':outcome,'originalTwoEventsUnchanged':True,'unrelatedTablesUnchanged':True,'noAuthenticationExport':True,'personalActorAttribution':'REQUIRES_INDEPENDENT_OWNER_HANDOFF_OBSERVATION','wholeRowAccepted':False,'receipts':receipt_rows,'executedSourceAndRuntimeMetadata':metadata,'maximumExpandedBytes':64*1024*1024}
 write_exclusive(out/'terminal-summary.json',json.dumps(summary,indent=2).encode()+b'\n',0o400)
 archive=out.parent/'review-evidence.zip';require(not archive.exists(),'ARCHIVE_ALREADY_EXISTS')
 members=sorted(out.iterdir());require(sum(f.stat().st_size for f in members)<=64*1024*1024,'EXPANDED_ARCHIVE_BOUND')
 class BoundedZip:
  def __init__(self,handle):self.handle=handle
  def write(self,raw):require(self.handle.tell()+len(raw)<=8*1024*1024,'COMPRESSED_ARCHIVE_BOUND');return self.handle.write(raw)
  def tell(self):return self.handle.tell()
  def seek(self,*args):return self.handle.seek(*args)
  def flush(self):return self.handle.flush()
 with archive.open('xb')as raw:
  with zipfile.ZipFile(BoundedZip(raw),'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6)as zipped:
   for file in members:
    require(file.is_file()and not file.is_symlink(),'EXPORT_MEMBER');zipped.write(file,arcname=file.name)
  raw.flush();os.fsync(raw.fileno())
 with zipfile.ZipFile(archive,'r')as zipped:
  require(len(zipped.infolist())==len(members)and {x.filename for x in zipped.infolist()}=={x.name for x in members},'ZIP_FIXED_MEMBERS')
  for file in members:require(sha(zipped.read(file.name))==sha(file.read_bytes()),'ZIP_MEMBER_READBACK')
 os.chmod(archive,0o400);require(archive.stat().st_size<=8*1024*1024,'ARCHIVE_BOUND')
 return {'archive':str(archive),'bytes':archive.stat().st_size,'sha256':sha(archive.read_bytes()),'finalVersion':outcome['version']if outcome else 2,'ownerApproval':bool(outcome and outcome['ownerApproval']),'wholeRowAccepted':False}
if __name__=='__main__':
 p=argparse.ArgumentParser()
 for key in ['state','baseline','receipts','out','runtime-manifest','source-manifest','build-provenance','runtime-sha256','source-sha256']:p.add_argument('--'+key,required=True)
 a=p.parse_args()
 print(json.dumps(seal(a.state,a.baseline,a.receipts,a.out,runtime_manifest=a.runtime_manifest,source_manifest=a.source_manifest,build_provenance=a.build_provenance,runtime_sha256=a.runtime_sha256,source_sha256=a.source_sha256)))
