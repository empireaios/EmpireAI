#!/usr/bin/env python3
"""Retrieve exact accepted A07 bytes and copy only its readonly technical capture."""
import hashlib,json,os,pathlib,stat,urllib.request,urllib.error,urllib.parse,zipfile
ROOT=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-redis-cohort-'+os.environ['GITHUB_RUN_ID'])
ARTIFACT=13850322384;RUN=43010870519;SIZE=319439
DIGEST='036ef6cddf1cd9ef0921a91a9eb27b35865690d3a3cb4b20769b45144d2211ce'
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
opener=urllib.request.build_opener(NoRedirect)
base='https://api.github.com/repos/empireaios/EmpireAI/actions/artifacts/'+str(ARTIFACT)
def api(url):
 assert url.startswith('https://api.github.com/repos/empireaios/EmpireAI/')
 return opener.open(urllib.request.Request(url,headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}),timeout=30)
with api(base)as r:meta=json.load(r)
assert meta['id']==ARTIFACT and meta['workflow_run']['id']==RUN and meta['size_in_bytes']==SIZE and not meta['expired']
try:
 with api(base+'/zip'):raise AssertionError('EXPECTED_SIGNED_REDIRECT')
except urllib.error.HTTPError as e:
 assert e.code==302;location=e.headers['Location'];u=urllib.parse.urlsplit(location)
 assert u.scheme=='https'and not u.username and not u.password and not u.port
 assert u.hostname.endswith('.blob.core.windows.net')or u.hostname.endswith('.githubusercontent.com')
target=ROOT/'accepted-capture-artifact.zip';h=hashlib.sha256();total=0
with opener.open(urllib.request.Request(location,headers={'User-Agent':'EmpireAI-V116-RedisCohort'}),timeout=60)as r,target.open('xb')as f:
 while True:
  b=r.read(1048576)
  if not b:break
  total+=len(b);assert total<=SIZE;h.update(b);f.write(b)
assert total==SIZE and h.hexdigest()==DIGEST
capture=ROOT/'capture';capture.mkdir(mode=0o700);inventory=[]
with zipfile.ZipFile(target)as z:
 names=z.namelist();assert len(names)==len(set(names))and z.testzip()is None
 assert sum(i.file_size for i in z.infolist())<=16*1048576
 for i in z.infolist():
  p=pathlib.PurePosixPath(i.filename);assert not p.is_absolute()and'..'not in p.parts and not stat.S_ISLNK(i.external_attr>>16)
 index=json.loads(z.read('evidence-index.json'));rows=index['payloads'];assert len(rows)==98
 assert index['runId']==str(RUN)and index['applicationCommit']=='6c1e63ba20619ee480742fd87dc810ca93152e22'
 assert set(x['path']for x in rows)==set(names)-{'evidence-index.json'}
 for x in rows:
  b=z.read(x['path']);assert len(b)==x['bytes']and hashlib.sha256(b).hexdigest()==x['sha256']
  if x['path'].startswith('sealed-capture/'):
   rel=pathlib.PurePosixPath(x['path']).relative_to('sealed-capture');dest=capture/rel;dest.parent.mkdir(mode=0o755,parents=True,exist_ok=True)
   with dest.open('xb')as f:f.write(b)
   dest.chmod(0o444);inventory.append({'path':str(rel),'bytes':len(b),'sha256':x['sha256']})
 assert inventory
for p in sorted(capture.rglob('*'),reverse=True):
 if p.is_dir():p.chmod(0o555)
capture.chmod(0o555)
(ROOT/'evidence/accepted-capture-input.json').write_text(json.dumps({'artifactId':ARTIFACT,'runId':RUN,'zipBytes':SIZE,'zipSHA256':DIGEST,'payloadsVerified':98,'captureFiles':inventory,'acceptedOriginalNotModified':True,'historicalRedisNotCurrent':True},indent=2)+'\n')
