"""Exact bounded same-repository Git blob transport; no redirect or retry."""
import hashlib,json,os,pathlib,re,signal,time,urllib.error,urllib.request
REPOSITORY='empireaios/EmpireAI'
SOURCE='6c1e63ba20619ee480742fd87dc810ca93152e22'
ZIP_BYTES=338251567
ZIP_SHA256='39f904154764d2e70413045c7ebefbd4c04f38d0e09360ea19b2834fcc3ef755'
MAX_CHUNK=8388608
MAX_SECONDS=300
MAX_REQUEST_SECONDS=90
class TransportError(RuntimeError):pass
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):raise TransportError('REDIRECT_REFUSED')
def require(value,message):
 if not value:raise TransportError(message)
def sha256(data):return hashlib.sha256(data).hexdigest()
def exact_int(value):return type(value) is int
def validate_manifest(value):
 require(type(value) is dict,'MANIFEST_OBJECT')
 require(set(value)=={'schema','repository','sourceRevision','zipBytes','zipSHA256','chunkMaximumBytes','blobs'},'MANIFEST_FIELDS')
 require(value['schema']=='v116-retained-package-git-blobs-v1','MANIFEST_SCHEMA')
 require(value['repository']==REPOSITORY and value['sourceRevision']==SOURCE,'SOURCE_SCOPE')
 require(type(value['zipBytes']) is int and value['zipBytes']==ZIP_BYTES and value['zipSHA256']==ZIP_SHA256,'ZIP_IDENTITY')
 require(type(value['chunkMaximumBytes']) is int and value['chunkMaximumBytes']==MAX_CHUNK,'CHUNK_BOUND')
 blobs=value['blobs'];require(type(blobs) is list and len(blobs)==(ZIP_BYTES+MAX_CHUNK-1)//MAX_CHUNK,'BLOB_COUNT')
 seen=set();total=0
 for ordinal,blob in enumerate(blobs):
  require(type(blob) is dict and set(blob)=={'ordinal','bytes','sha256','gitBlobSHA'},'BLOB_FIELDS')
  require(exact_int(blob['ordinal']) and blob['ordinal']==ordinal,'ORDINAL_ORDER')
  expected=min(MAX_CHUNK,ZIP_BYTES-total)
  require(exact_int(blob['bytes']) and blob['bytes']==expected and 0<blob['bytes']<=MAX_CHUNK,'BLOB_SIZE')
  require(type(blob['sha256']) is str and re.fullmatch('[0-9a-f]{64}',blob['sha256']) is not None,'BLOB_SHA256')
  require(type(blob['gitBlobSHA']) is str and re.fullmatch('[0-9a-f]{40}',blob['gitBlobSHA']) is not None,'BLOB_GIT_SHA')
  require(blob['gitBlobSHA'] not in seen,'DUPLICATE_BLOB');seen.add(blob['gitBlobSHA']);total+=blob['bytes']
 require(total==ZIP_BYTES,'AGGREGATE_SIZE');return value
def read_manifest(path,expected_sha):
 require(re.fullmatch('[0-9a-f]{64}',expected_sha or '') is not None,'MANIFEST_PIN')
 p=pathlib.Path(path);require(p.is_file() and not p.is_symlink() and p.stat().st_size<=65536,'MANIFEST_FILE')
 raw=p.read_bytes();require(sha256(raw)==expected_sha,'MANIFEST_SHA256')
 def unique_pairs(pairs):
  out={}
  for k,v in pairs:require(k not in out,'DUPLICATE_JSON_KEY');out[k]=v
  return out
 return validate_manifest(json.loads(raw,object_pairs_hook=unique_pairs))
def blob_url(blob_sha):
 require(type(blob_sha) is str and re.fullmatch('[0-9a-f]{40}',blob_sha) is not None,'BLOB_ENDPOINT_ID')
 manifest=read_manifest(pathlib.Path(__file__).with_name('retained-blob-manifest.json'),'7b8d9cfbef07c72fe97257acc5d5245459d670f77a57aaa1e39c47bacc64e658')
 matches=[x for x in manifest['blobs'] if x['gitBlobSHA']==blob_sha];require(len(matches)==1,'EXACT_RAW_BLOB_ID')
 return 'https://raw.githubusercontent.com/'+REPOSITORY+'/794f9de9c8a0863026facd338a85315a333fdd28/chunk-'+str(matches[0]['ordinal']).zfill(3)+'.bin'
def request_for(blob,token=None):
 headers={'Accept':'application/vnd.github.raw+json','Accept-Encoding':'identity','User-Agent':'EmpireAI-V116-Exact-Retained-Blob','X-GitHub-Api-Version':'2022-11-28'}
 if token:
  require(type(token) is str and '\r' not in token and '\n' not in token,'TOKEN_FORMAT');headers['Authorization']='Bearer '+token
 return urllib.request.Request(blob_url(blob['gitBlobSHA']),headers=headers,method='GET')
def stream_blobs(manifest,destination,opener,token=None,monotonic=time.monotonic,arm_deadline=None,overall_deadline=None):
 """Internal stream primitive; production caller admits exact pinned manifest first."""
 dest=pathlib.Path(destination);part=dest.with_name(dest.name+'.part')
 require(not dest.exists() and not part.exists() and not dest.is_symlink() and not part.is_symlink(),'DESTINATION_NOT_FRESH')
 started=monotonic();deadline=started+MAX_SECONDS if overall_deadline is None else overall_deadline;aggregate=0;whole=hashlib.sha256();receipts=[]
 phase='create-partial';ordinal=None;received=0;request_budget=None;request_started=None
 def remaining():
  left=deadline-monotonic();require(left>0,'GLOBAL_DEADLINE');return left
 try:
  fd=os.open(part,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
  with os.fdopen(fd,'wb') as output:
   for blob in manifest['blobs']:
    ordinal=blob['ordinal'];received=0;request_started=None;request_budget=None;phase='construct-exact-request'
    request=request_for(blob,token);left=remaining();request_budget=min(MAX_REQUEST_SECONDS,left);request_started=monotonic();request_deadline=request_started+request_budget
    if arm_deadline:arm_deadline(request_budget,'GLOBAL_DEADLINE'if left<=MAX_REQUEST_SECONDS else'REQUEST_DEADLINE')
    received=0;digest=hashlib.sha256();git=hashlib.sha1(('blob '+str(blob['bytes'])+'\0').encode())
    phase='request-headers'
    with opener.open(request,timeout=request_budget) as response:
     require(response.status==200,'HTTP_STATUS');require(response.geturl()==request.full_url,'RESPONSE_ENDPOINT')
     require(response.headers.get('Content-Encoding','identity').lower()=='identity','CONTENT_ENCODING')
     length=response.headers.get('Content-Length')
     if length is not None:require(re.fullmatch('[0-9]+',length) is not None and int(length)==blob['bytes'],'CONTENT_LENGTH')
     phase='request-body'
     while True:
      remaining();require(monotonic()<request_deadline,'REQUEST_DEADLINE');chunk=response.read(min(1048576,blob['bytes']-received+1))
      if not chunk:break
      received+=len(chunk);aggregate+=len(chunk)
      require(received<=blob['bytes'] and aggregate<=manifest['zipBytes'],'OVERSIZE_STREAM')
      digest.update(chunk);git.update(chunk);whole.update(chunk);output.write(chunk)
    remaining();require(monotonic()<request_deadline,'REQUEST_DEADLINE');phase='verify-complete-blob'
    if arm_deadline:arm_deadline(remaining(),'GLOBAL_DEADLINE')
    require(received==blob['bytes'],'TRUNCATED_BLOB');require(digest.hexdigest()==blob['sha256'],'BLOB_HASH_MISMATCH');require(git.hexdigest()==blob['gitBlobSHA'],'GIT_BLOB_HASH_MISMATCH')
    receipts.append({'ordinal':blob['ordinal'],'bytes':received,'sha256':digest.hexdigest(),'gitBlobSHA':git.hexdigest()})
   phase='verify-complete-archive';require(aggregate==manifest['zipBytes'],'ZIP_LENGTH_MISMATCH');require(whole.hexdigest()==manifest['zipSHA256'],'ZIP_HASH_MISMATCH');remaining();output.flush();os.fsync(output.fileno())
  phase='publish-verified-archive'
  require(not dest.exists() and not dest.is_symlink(),'DESTINATION_RACE');os.link(part,dest);part.unlink()
  return {'transport':'SAME_REPOSITORY_IMMUTABLE_GIT_BLOBS','repository':REPOSITORY,'sourceRevision':SOURCE,'zipBytes':aggregate,'zipSHA256':whole.hexdigest(),'blobReceipts':receipts,'requestCount':len(receipts),'requestTimeoutSeconds':MAX_REQUEST_SECONDS,'globalDeadlineSeconds':MAX_SECONDS,'elapsedSeconds':monotonic()-started,'redirectsAllowed':False,'retries':0,'rebuild':False}
 except BaseException as error:
  now=monotonic();code=str(error)if isinstance(error,TransportError)else type(error).__name__
  if arm_deadline:arm_deadline(0,'GLOBAL_DEADLINE')
  if isinstance(error,TimeoutError):code='GLOBAL_DEADLINE'if now>=deadline else'REQUEST_DEADLINE'
  if re.fullmatch('[A-Za-z0-9_]{1,100}',code)is None:code='TRANSPORT_ERROR'
  failure={'schema':'v128-retained-transport-first-failure-v1','status':'FAILED','phase':phase,
   'repository':REPOSITORY,'sourceRevision':SOURCE,
   'errorType':type(error).__name__,'errorCode':code,'ordinal':ordinal,'receivedBlobBytes':received,
   'aggregateReceivedBytes':aggregate,'verifiedBlobCount':len(receipts),'requestBudgetSeconds':request_budget,
   'requestElapsedSeconds':None if request_started is None else now-request_started,'elapsedSeconds':now-started,
   'globalRemainingSeconds':max(0,deadline-now),'requestMaximumSeconds':MAX_REQUEST_SECONDS,
   'globalDeadlineSeconds':MAX_SECONDS,'redirectsAllowed':False,'retries':0}
  try:
   if part.exists()or part.is_symlink():part.unlink()
   failure['cleanupErrorType']=None
  except BaseException as cleanup_error:failure['cleanupErrorType']=type(cleanup_error).__name__
  failure['partialDownloadAbsent']=not os.path.lexists(part)
  failure['destinationAbsent']=not os.path.lexists(dest)
  error.transport_failure=failure
  raise

def fetch_retained_zip(manifest_path,manifest_sha,destination,token=None):
 manifest=read_manifest(manifest_path,manifest_sha)
 opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
 # SIGALRM bounds stalled reads as well as the monotonic per-loop deadline.
 require(signal.getitimer(signal.ITIMER_REAL)==(0.0,0.0),'PREEXISTING_TIMER')
 previous=signal.getsignal(signal.SIGALRM)
 global_deadline=time.monotonic()+MAX_SECONDS;timer_reason='GLOBAL_DEADLINE'
 def expired(signum,frame):raise TransportError('GLOBAL_DEADLINE'if time.monotonic()>=global_deadline else timer_reason)
 def arm(seconds,reason):
  nonlocal timer_reason
  timer_reason=reason;signal.setitimer(signal.ITIMER_REAL,seconds)
 signal.signal(signal.SIGALRM,expired);signal.setitimer(signal.ITIMER_REAL,MAX_SECONDS)
 try:return stream_blobs(manifest,destination,opener,token,arm_deadline=arm,overall_deadline=global_deadline)
 finally:signal.setitimer(signal.ITIMER_REAL,0);signal.signal(signal.SIGALRM,previous)
