#!/usr/bin/env python3
"""Recover one exact retained supplier photograph for private native examination."""
import hashlib,json,os,pathlib,signal,sys,time,urllib.request
URL='https://cf.cjdropshipping.com/quick/product/18734b38-bfa6-4d27-ad8e-deb7b3fc0cb3.jpg'
EXPECTED_BYTES=149719
EXPECTED_SHA256='4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048'
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):raise RuntimeError('MEDIA_REDIRECT_REFUSED')
def require(value,message):
 if not value:raise RuntimeError(message)
def main():
 require(os.getuid()==0 and len(sys.argv)==2,'MEDIA_HOST_ARGUMENTS')
 runtime=pathlib.Path(sys.argv[1]);require(runtime.is_absolute()and runtime.resolve(strict=True)==runtime,'MEDIA_RUNTIME_PATH')
 marker=runtime.parent/'private-phase-started.json';s=marker.lstat()
 require(marker.is_file()and not marker.is_symlink()and s.st_uid==0 and s.st_mode&0o777==0o400,'PRIVATE_PHASE_MARKER_REQUIRED')
 directory=runtime/'connector-inputs';require(directory.is_dir()and not directory.is_symlink(),'MEDIA_INPUT_DIRECTORY')
 dest=directory/'retained-original.jpg';part=directory/'retained-original.jpg.part'
 require(not os.path.lexists(dest)and not os.path.lexists(part),'MEDIA_DESTINATION_NOT_FRESH')
 require(signal.getitimer(signal.ITIMER_REAL)==(0.0,0.0),'MEDIA_PREEXISTING_TIMER')
 old=signal.getsignal(signal.SIGALRM);started=time.monotonic();phase='request-exact-original';count=0
 def expired(*args):raise RuntimeError('MEDIA_GLOBAL_DEADLINE')
 signal.signal(signal.SIGALRM,expired);signal.setitimer(signal.ITIMER_REAL,60)
 try:
  request=urllib.request.Request(URL,headers={'Accept':'image/jpeg','Accept-Encoding':'identity','User-Agent':'EmpireAI-private-retained-media-verification'},method='GET')
  opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
  h=hashlib.sha256()
  with opener.open(request,timeout=30)as response:
   require(response.status==200 and response.geturl()==URL,'MEDIA_ENDPOINT_OR_STATUS')
   require(response.headers.get('Content-Encoding','identity').lower()=='identity','MEDIA_CONTENT_ENCODING')
   require(response.headers.get_content_type()in('image/jpeg','image/jpg'),'MEDIA_CONTENT_TYPE')
   length=response.headers.get('Content-Length')
   if length is not None:require(length==str(EXPECTED_BYTES),'MEDIA_CONTENT_LENGTH')
   phase='read-exact-bounded-original'
   fd=os.open(part,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
   with os.fdopen(fd,'wb')as output:
    while True:
     b=response.read(min(65536,EXPECTED_BYTES-count+1))
     if not b:break
     count+=len(b);require(count<=EXPECTED_BYTES,'MEDIA_OVERSIZE');h.update(b);output.write(b)
    output.flush();os.fsync(output.fileno())
  phase='verify-retained-byte-identity'
  require(count==EXPECTED_BYTES and h.hexdigest()==EXPECTED_SHA256,'MEDIA_EXACT_IDENTITY')
  with part.open('rb')as source:require(hashlib.file_digest(source,'sha256').hexdigest()==EXPECTED_SHA256,'MEDIA_READBACK_SHA256')
  os.link(part,dest);part.unlink();dest.chmod(0o444)
  require(dest.stat().st_nlink==1,'MEDIA_SINGLE_LINK')
  receipt={'schema':'v128-private-retained-media-transport-v1','status':'PASS_EXACT_RETAINED_ORIGINAL_BYTES',
   'sourceURL':URL,'bytes':count,'sha256':EXPECTED_SHA256,'readOnly':True,'redirectsAllowed':False,'retries':0,
   'globalDeadlineSeconds':60,'elapsedSeconds':time.monotonic()-started,'privatePhaseMarkerPresent':True,
   'rights':'PRIVATE_FACTUAL_PREPARATION_ONLY','publicPublicationAllowed':False}
  with(runtime/'evidence/connector-media-transport.json').open('x')as output:json.dump(receipt,output,indent=2);output.write('\n')
 except BaseException as error:
  signal.setitimer(signal.ITIMER_REAL,0)
  cleanup=None
  try:
   if os.path.lexists(part):part.unlink()
  except BaseException as cleanup_error:cleanup=type(cleanup_error).__name__
  receipt={'schema':'v128-private-retained-media-first-failure-v1','phase':phase,'errorType':type(error).__name__,
   'errorMessageSHA256':hashlib.sha256(str(error).encode()).hexdigest(),'receivedBytes':count,
   'elapsedSeconds':time.monotonic()-started,'partialAbsent':not os.path.lexists(part),'cleanupErrorType':cleanup,
   'privatePhaseMarkerPresent':True,'publicPublicationAllowed':False}
  with(runtime/'evidence/connector-media-first-failure.json').open('x')as output:json.dump(receipt,output,indent=2);output.write('\n')
  raise
 finally:signal.setitimer(signal.ITIMER_REAL,0);signal.signal(signal.SIGALRM,old)
if __name__=='__main__':main()
