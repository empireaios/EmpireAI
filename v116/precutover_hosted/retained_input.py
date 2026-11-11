#!/usr/bin/env python3
"""Fetch one exact historical input; token stays on api.github.com only."""
import hashlib,json,os,pathlib,sys,urllib.request,urllib.error,urllib.parse,zipfile
ROOT=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-precutover-'+os.environ['GITHUB_RUN_ID'])
ZIP_BYTES=338251567; ZIP_SHA='39f904154764d2e70413045c7ebefbd4c04f38d0e09360ea19b2834fcc3ef755'
BACK_BYTES=207560277; BACK_SHA='b99d11a65d40d6a6a197da6ba805e72a72ac55d4551ad13f31930ec5eeadbcb6'
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs): return None
opener=urllib.request.build_opener(NoRedirect)
base='https://api.github.com/repos/empireaios/EmpireAI/actions/artifacts/13340201255'
def api(url):
 assert url.startswith('https://api.github.com/repos/empireaios/EmpireAI/')
 return opener.open(urllib.request.Request(url,headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}),timeout=30)
def sha(data):return hashlib.sha256(data).hexdigest()
ROOT.mkdir(mode=0o700,parents=False,exist_ok=True); out=ROOT/'evidence';out.mkdir(mode=0o700,exist_ok=True)
with api(base) as r: meta=json.load(r)
assert meta['id']==13340201255 and meta['size_in_bytes']==ZIP_BYTES and meta['expired'] is False
assert meta['workflow_run']['id']==41860150363
(out/'retained-input-metadata.json').write_text(json.dumps(meta,indent=2)+'\n')
try:
 with api(base+'/zip') as r: raise RuntimeError('Expected authenticated provider redirect')
except urllib.error.HTTPError as e:
 assert e.code==302
 location=e.headers['Location'];u=urllib.parse.urlsplit(location)
 assert u.scheme=='https' and not u.username and not u.password and not u.port
 assert u.hostname.endswith('.blob.core.windows.net') or u.hostname.endswith('.githubusercontent.com')
# A fresh opener and headers exclude credentials from the signed object request.
zip_path=ROOT/'retained-input.zip'; h=hashlib.sha256();total=0
with opener.open(urllib.request.Request(location,headers={'User-Agent':'EmpireAI-V116-Q5'}),timeout=60) as r,zip_path.open('xb') as f:
 while True:
  b=r.read(1048576)
  if not b:break
  total+=len(b);assert total<=ZIP_BYTES;h.update(b);f.write(b)
assert total==ZIP_BYTES and h.hexdigest()==ZIP_SHA
with zipfile.ZipFile(zip_path) as z:
 name='archives/backend-v65-source-equivalent.tar.gz';assert z.namelist().count(name)==1
 info=z.getinfo(name);assert info.file_size==BACK_BYTES
 dest=ROOT/'backend.tar.gz';h=hashlib.sha256();total=0
 with z.open(name) as r,dest.open('xb') as f:
  while True:
   b=r.read(1048576)
   if not b:break
   total+=len(b);assert total<=BACK_BYTES;h.update(b);f.write(b)
 assert total==BACK_BYTES and h.hexdigest()==BACK_SHA
(out/'retained-input-integrity.json').write_text(json.dumps({'artifactId':13340201255,'runId':41860150363,'zipBytes':ZIP_BYTES,'zipSHA256':ZIP_SHA,'backendBytes':BACK_BYTES,'backendSHA256':BACK_SHA,'applicationSource':'6c1e63ba20619ee480742fd87dc810ca93152e22','imageConfigSHA256':'f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0','downloadCount':1,'rebuild':False},indent=2)+'\n')
