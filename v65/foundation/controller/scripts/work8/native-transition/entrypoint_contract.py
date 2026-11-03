"""Pre-startup checks against original protectedPath and exact retained image."""
import hashlib,json,os,pathlib,stat
from private_contract import backend_options,safe_docker_contract
from startup_fixture_host import execute as execute_child_fixtures, lifecycle as fixture_lifecycle

def sha(path):
 with path.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()

def entries(script):
 index=json.loads((script/'live-brain-overlay.json').read_text())
 extra=json.loads((script/'startup-overlays.json').read_text())
 assert extra['backendSource']==index['underlyingSource']
 return [{'sourceFile':'live-brain-index-overlay.js','target':index['originalPath'],'originalSha256':index['originalSha256'],'overlaySha256':index['overlaySha256'],'originalBytes':index['originalBytes'],'overlayBytes':index['overlayBytes']},*extra['files']]

def execute(private,script,image,label,run,inspect,created,out):
 files=entries(script);receipt={'schema':'work8-v32-mounted-entrypoint-preflight-v1','status':'FAIL','applicationStarted':False,'originalControllerCheckUnmodified':True,'image':image,'observations':{},'repositoryOwnershipChanged':False,'newCapabilities':False}
 target=out/'mounted-entrypoint-preflight.json'
 def save():target.write_text(json.dumps(receipt,indent=2)+'\n')
 def observe(mode,mounts):
  name=label+'-entrypoint-'+mode
  cmd=['docker','run','--name',name,'--label','work8.native='+label,'--pull','never','--network','none','--memory','256m','--cpus','1','--pids-limit','16',*backend_options(private,script)]
  for source,dest in mounts:cmd+=['--mount','type=bind,src='+str(source)+',dst='+dest+',readonly']
  cmd+=['--entrypoint','node',image,'/examination/mounted-entrypoint-preflight.mjs',mode]
  created.append(name)
  receipt.setdefault('probeProgress',[]).append({'probe':mode,'phase':'STARTING'});save()
  try:
   raw=run(cmd,timeout=35,log='entrypoint-'+mode+'-command.log')
   # Node's known SQLite warning can accompany this one fixed JSON receipt.
   rows=[json.loads(line) for line in raw.splitlines() if line.startswith('{')]
   assert len(rows)==1 and rows[0]['schema']=='work8-v32-mounted-entrypoint-observation-v1','ENTRYPOINT_OBSERVATION_REQUIRED'
   row=rows[0];contract=safe_docker_contract(inspect(name))
   assert contract['image']==image and contract['readOnlyRootfs'] and not contract['privileged']
   assert contract['user']=='0:0' and contract['capDrop']==['ALL']
   receipt['observations'][mode]={'observation':row,'container':contract};save()
   assert row['status']=='PASS_COMPLETED_OBSERVATION',(row.get('firstFailure') or {}).get('code','UNCLASSIFIED_ENTRYPOINT_CONTRACT_FAILURE')
   return row
  finally:
   receipt.setdefault('probeLifecycle',[]).append(fixture_lifecycle(name,mode));save()
 save()
 observe('original',[])
 checkout=observe('checkout',[(script/'live-brain-index-overlay.js','/app/backend/dist/index.js')])
 observed=next(row for row in checkout['files'] if row['target']=='/app/backend/dist/index.js')
 assert observed['code'] in [None,'OPERATOR_PATH_NOT_PROTECTED','NONCANONICAL_OPERATOR_PATH'],'UNCLASSIFIED_ENTRYPOINT_CONTRACT_FAILURE'
 receipt['checkoutMountViolatesOriginalContract']=observed['originalProtectedPathResult']!='PASS'
 receipt['historicalRunRootCauseEstablished']=False
 # This directory contains instrumentation only. Source checkout is never
 # re-owned. Each completed copy is chmodded before its final ownership handoff.
 owned=private/'operator-overlays';owned.mkdir(mode=0o700)
 mounts=[];copy_rows=[]
 for item in files:
  assert pathlib.PurePath(item['sourceFile']).name==item['sourceFile'],'OVERLAY_SOURCE_FILENAME_REFUSED'
  src=script/item['sourceFile'];before=src.lstat();assert stat.S_ISREG(before.st_mode) and not src.is_symlink() and before.st_nlink==1
  assert src.resolve()==src and before.st_size==item['overlayBytes'] and sha(src)==item['overlaySha256'],'OVERLAY_SOURCE_CHANGED'
  dst=owned/item['sourceFile'];fd=os.open(dst,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
  try:
   data=src.read_bytes();offset=0
   while offset<len(data):offset+=os.write(fd,data[offset:])
   os.fchmod(fd,0o444);os.fsync(fd)
  finally:os.close(fd)
  assert sha(dst)==item['overlaySha256']
  run(['sudo','-n','chown','0:0',str(dst)])
  after=dst.lstat();assert after.st_uid==0 and after.st_gid==0 and stat.S_IMODE(after.st_mode)==0o444
  assert src.lstat().st_uid==before.st_uid and src.lstat().st_gid==before.st_gid and src.lstat().st_mode==before.st_mode and sha(src)==item['overlaySha256']
  mounts.append((dst,item['target']));copy_rows.append({'target':item['target'],'sha256':sha(dst),'uid':after.st_uid,'gid':after.st_gid,'mode':stat.S_IMODE(after.st_mode),'sourceMetadataUnchanged':True})
 os.chmod(owned,0o700);run(['sudo','-n','chown','0:0',str(owned)])
 corrected=observe('corrected',mounts)
 # Use the identical corrected mounts in a running startup-free container for
 # real unprivileged exec checks. No application, Redis or business state starts.
 name=label+'-entrypoint-reader';cmd=['docker','run','-d','--name',name,'--label','work8.native='+label,'--pull','never','--network','none','--memory','256m','--cpus','1','--pids-limit','16',*backend_options(private,script)]
 for src,dst in mounts:cmd+=['--mount','type=bind,src='+str(src)+',dst='+dst+',readonly']
 cmd+=['--entrypoint','node',image,'-e','setTimeout(()=>process.exit(0),60000)'];created.append(name)
 try:
  run(cmd)
  raw=run(['docker','exec','--user','65534:65534',name,'node','/examination/mounted-entrypoint-preflight.mjs','writer-refusal'],timeout=20,log='entrypoint-writer-refusal-command.log')
  row=[json.loads(line) for line in raw.splitlines() if line.startswith('{')];assert len(row)==1
  receipt['observations']['writerRefusal']=row[0];receipt['copies']=copy_rows;save()
  assert row[0]['status']=='PASS_COMPLETED_OBSERVATION',(row[0].get('firstFailure') or {}).get('code','UNCLASSIFIED_ENTRYPOINT_CONTRACT_FAILURE')
 finally:
  receipt['readerLifecycleBeforeCleanup']=fixture_lifecycle(name,'writer-refusal');save()
 # Preserve reader exit state before removing it; fixture children then run
 # one at a time in foreground containers under the identical pids=16 envelope.
 run(['docker','rm','-f',name]);created.remove(name)
 diagnostic=execute_child_fixtures(private,script,image,label,mounts,run,created,out)
 assert diagnostic['status']=='PASS_CHILD_STARTUP_CAUSE_PROPAGATION' and len(diagnostic['fixtures'])==3 and diagnostic['nativeApplicationStarted'] is False,'CHILD_STARTUP_DIAGNOSTIC_PATH_NOT_PROVEN'
 receipt['childDiagnosticPathProven']=True
 receipt.update(status='PASS_ORIGINAL_ENTRYPOINT_CONTRACT_AND_RESTRICTED_WRITER_REFUSAL',originalEntryAndAncestorsVerified=True,readOnlyExactMountsVerified=True,writerRefusalsVerified=True,applicationStarted=False)
 save();return mounts
