#!/usr/bin/env python3
"""Fetch and unpack two exact public npm packages; never execute package code."""
import base64,datetime,gzip,hashlib,hmac,io,json,os,pathlib,signal,ssl,stat,sys,tarfile,time,urllib.parse,urllib.request
BASE=pathlib.Path(__file__).resolve().parent
VERSION='1.62.1';HOST='registry.npmjs.org';MAX_COMPRESSED=16*1048576
URLS={name:f'https://{HOST}/{name}/-/{name}-{VERSION}.tgz' for name in ['playwright','playwright-core']}
def fail(message):raise ValueError(message)
def check(ok,message):
 if not ok:fail(message)
def digest(data):return hashlib.sha256(data).hexdigest()
def valid_url(url,expected):
 p=urllib.parse.urlsplit(url)
 check(url==expected and expected in URLS.values() and p.scheme=='https' and p.hostname==HOST and p.port in [None,443] and not p.username and not p.password and not p.query and not p.fragment,'NPM_URL_NOT_EXACT_ALLOWED_PUBLIC_TARBALL')
class ExactRedirect(urllib.request.HTTPRedirectHandler):
 def __init__(self,expected):self.expected=expected;self.count=0
 def redirect_request(self,request,fp,code,msg,headers,newurl):
  self.count+=1;check(self.count<=2,'NPM_REDIRECT_BOUND');valid_url(newurl,self.expected)
  return urllib.request.Request(newurl,headers={'User-Agent':'EmpireAI-V116-public-integrity-stager','Accept':'application/octet-stream'})
def fetch(url):
 valid_url(url,url);redirect=ExactRedirect(url)
 opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),ExactRedirect(url),urllib.request.HTTPSHandler(context=ssl.create_default_context()))
 started=time.monotonic();request=urllib.request.Request(url,headers={'User-Agent':'EmpireAI-V116-public-integrity-stager','Accept':'application/octet-stream'})
 with opener.open(request,timeout=10) as response:
  check(response.status==200,'NPM_HTTP_STATUS');valid_url(response.url,url)
  check(response.headers.get('Content-Encoding','identity')=='identity','NPM_UNEXPECTED_CONTENT_ENCODING')
  declared=response.headers.get('Content-Length')
  if declared is not None:check(declared.isdigit() and int(declared)<=MAX_COMPRESSED,'NPM_DECLARED_COMPRESSED_BOUND')
  data=bytearray()
  while True:
   check(time.monotonic()-started<30,'NPM_DOWNLOAD_DEADLINE')
   chunk=response.read(min(65536,MAX_COMPRESSED+1-len(data)))
   if not chunk:break
   data.extend(chunk);check(len(data)<=MAX_COMPRESSED,'NPM_COMPRESSED_BOUND')
  if declared is not None:check(len(data)==int(declared),'NPM_CONTENT_LENGTH_MISMATCH')
 return bytes(data),{'requestedURL':url,'finalURL':url,'status':200,'compressedBytes':len(data),'sha256':digest(data),'elapsedSeconds':round(time.monotonic()-started,3),'credentialsSent':False,'proxiesUsed':False}
def validate_integrity(data,spec):
 check(len(data)<=MAX_COMPRESSED,'NPM_COMPRESSED_BOUND')
 integrity=spec['integrity'];check(integrity.startswith('sha512-') and ' ' not in integrity,'NPM_SRI_FORMAT')
 try:expected=base64.b64decode(integrity[7:],validate=True)
 except Exception:fail('NPM_SRI_BASE64')
 check(len(expected)==64 and hmac.compare_digest(hashlib.sha512(data).digest(),expected),'NPM_SRI_MISMATCH')
 check(len(data)==spec['compressedBytes'] and digest(data)==spec['compressedSHA256'],'NPM_EXACT_COMPRESSED_IDENTITY_MISMATCH')
def inspect_archive(data,spec):
 # Integrity precedes gzip or tar parsing. No tarfile extract/extractall is used.
 validate_integrity(data,spec)
 tar_limit=spec['unpackedSize']+spec['fileCount']*2048+1048576
 with gzip.GzipFile(fileobj=io.BytesIO(data),mode='rb') as compressed:raw=compressed.read(tar_limit+1)
 check(len(raw)<=tar_limit,'NPM_UNCOMPRESSED_TAR_BOUND')
 files=[];seen=set();total=0
 with tarfile.open(fileobj=io.BytesIO(raw),mode='r:') as archive:
  for member in archive:
   check(member.isreg() and not member.issym() and not member.islnk() and not member.sparse,'NPM_NONREGULAR_MEMBER')
   name=member.name;parts=name.split('/')
   check(len(name.encode())<=512 and name.startswith('package/') and '\\' not in name and '\x00' not in name and all(x not in ['','.','..']for x in parts) and not pathlib.PurePosixPath(name).is_absolute(),'NPM_UNSAFE_MEMBER_PATH')
   relative='/'.join(parts[1:]);check(relative and relative not in seen,'NPM_DUPLICATE_MEMBER');seen.add(relative)
   check(isinstance(member.size,int) and 0<=member.size<=spec['unpackedSize'],'NPM_MEMBER_SIZE_BOUND')
   total+=member.size;check(total<=spec['unpackedSize'] and len(seen)<=spec['fileCount'],'NPM_UNPACKED_BOUND')
   f=archive.extractfile(member);check(f is not None,'NPM_MEMBER_DATA_MISSING');content=f.read(member.size+1);check(len(content)==member.size,'NPM_MEMBER_SIZE_MISMATCH')
   files.append((relative,content))
 check(total==spec['unpackedSize'] and len(files)==spec['fileCount'],'NPM_EXACT_UNPACKED_METADATA_MISMATCH')
 package=json.loads(dict(files)['package.json']);check(package['name']==spec['name'] and package['version']==VERSION,'NPM_PACKAGE_IDENTITY_MISMATCH')
 if spec['name']=='playwright':check(package.get('dependencies')=={'playwright-core':VERSION},'NPM_DEPENDENCY_IDENTITY_MISMATCH')
 else:
  check(not package.get('dependencies'),'NPM_UNEXPECTED_CORE_DEPENDENCIES')
  browsers=json.loads(dict(files)['browsers.json']);chromium=[x for x in browsers['browsers']if x['name']=='chromium'];check(len(chromium)==1 and str(chromium[0]['revision'])=='1234' and chromium[0]['browserVersion']=='151.0.7922.34','NPM_BROWSER_REGISTRY_MISMATCH')
 return files
def create_fresh_output(value):
 out=pathlib.Path(value);check(out.is_absolute() and not out.exists() and not out.is_symlink(),'NPM_OUTPUT_NOT_FRESH_ABSOLUTE')
 parent=out.parent;check(parent.resolve(strict=True)==parent and parent.is_dir() and not parent.is_symlink(),'NPM_OUTPUT_PARENT_NOT_CANONICAL')
 st=parent.stat();check(st.st_uid==os.getuid() and not st.st_mode&0o022,'NPM_OUTPUT_PARENT_NOT_PRIVATE_CALLER_OWNED')
 out.mkdir(mode=0o700);check(out.stat().st_uid==os.getuid(),'NPM_OUTPUT_OWNER');return out
def write_exclusive(path,data,mode=0o444):
 path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
 fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,mode)
 try:
  with os.fdopen(fd,'wb',closefd=False)as stream:stream.write(data);stream.flush();os.fsync(stream.fileno())
  os.fchmod(fd,mode)
 finally:os.close(fd)
def stage(out,specs,archives):
 check(set(archives)=={'playwright','playwright-core'} and [x['name']for x in specs]==['playwright','playwright-core'],'NPM_PACKAGE_SET')
 # Validate both complete archives before writing any package files.
 packages={spec['name']:inspect_archive(archives[spec['name']],spec)for spec in specs};inventory=[]
 for spec in specs:
  for relative,data in packages[spec['name']]:
   target=out/'node_modules'/spec['name']/relative;write_exclusive(target,data)
   inventory.append({'path':str(target.relative_to(out)),'bytes':len(data),'sha256':digest(data),'mode':'0444'})
 for directory in sorted((out/'node_modules').rglob('*'),key=lambda p:len(p.parts),reverse=True):
  if directory.is_dir():directory.chmod(0o555)
 (out/'node_modules').chmod(0o555)
 for item in inventory:
  p=out/item['path'];s=p.lstat();check(stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_size==item['bytes']and stat.S_IMODE(s.st_mode)==0o444 and digest(p.read_bytes())==item['sha256'],'NPM_EXTRACTED_READBACK_MISMATCH')
 return inventory
def load_inputs():
 value=json.loads((BASE/'inputs.json').read_text());check(value['schema']=='v116-exact-playwright-npm-inputs-v1','NPM_INPUT_SCHEMA');check(value['version']==VERSION and len(value['packages'])==2,'NPM_INPUT_VERSION')
 for spec in value['packages']:
  check(spec['name']in URLS and spec['version']==VERSION and spec['url']==URLS[spec['name']],'NPM_CLOSED_INPUT_IDENTITY')
  check(spec['gitHead']=='26a9e470a7b3c7822084b09fb7f13902c5f37b51','NPM_SOURCE_COMMIT')
  check(0<spec['fileCount']<=200 and 0<spec['unpackedSize']<=16*1048576 and 0<spec['compressedBytes']<=MAX_COMPRESSED,'NPM_INPUT_BOUNDS')
 return value
def main():
 check(len(sys.argv)==2,'usage: fetch-and-stage.py FRESH_ABSOLUTE_OUTPUT')
 def deadline(_signal,_frame):raise TimeoutError('NPM_STAGING_TOTAL_DEADLINE')
 signal.signal(signal.SIGALRM,deadline);signal.alarm(90)
 inputs=load_inputs();out=create_fresh_output(sys.argv[1]);archives={};transports=[]
 for spec in inputs['packages']:
  raw,transport=fetch(spec['url']);validate_integrity(raw,spec);archives[spec['name']]=raw;transports.append({'name':spec['name'],**transport})
 inventory=stage(out,inputs['packages'],archives)
 receipt={'schema':'v116-exact-playwright-npm-staging-receipt-v1','status':'PASS_DOWNLOAD_INTEGRITY_AND_EXTRACTION_ONLY','atUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'inputsSHA256':digest((BASE/'inputs.json').read_bytes()),'helperSHA256':digest(pathlib.Path(__file__).read_bytes()),'version':VERSION,'transport':transports,'fileCount':len(inventory),'unpackedBytes':sum(x['bytes']for x in inventory),'inventory':inventory,'installScriptsExecuted':False,'browserExecuted':False,'applicationExecuted':False,'packages':['playwright','playwright-core'],'chromiumRevision':'1234','chromiumVersion':'151.0.7922.34','newCommitmentUSD':0}
 write_exclusive(out/'staging-receipt.json',(json.dumps(receipt,indent=2)+'\n').encode(),0o600)
 signal.alarm(0);print(json.dumps({'status':receipt['status'],'fileCount':len(inventory),'receiptSHA256':digest((out/'staging-receipt.json').read_bytes())}))
if __name__=='__main__':main()
