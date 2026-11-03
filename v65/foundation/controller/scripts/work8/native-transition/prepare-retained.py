#!/usr/bin/env python3
"""Import an exact prior Actions ZIP and lock-bound browser driver; never build apps."""
import base64, hashlib, io, json, os, pathlib, re, subprocess, sys, tarfile, tempfile, urllib.error, urllib.request, zipfile
import candidate_packages

REPOSITORY = 'empireaios/EmpireAI'
BRANCH = 'work8/v25-20261031-return'
PRIOR_RUN = 41186780720
PRIOR_CONTROLLER = '8cb258e05b83ab5a5b36676f3457b610444f3732'
ARTIFACT_ID = 13037177457
ARCHIVE_BYTES = 398575029
ARCHIVE_SHA = '3fa3cf875e23cd4ff201c053f49915ba2007cfdf369ad2bbde6eadd629861d23'
INDEX_SHA = '7b6dd98dabe7488b786531ab9d13d3dab78ed956e1c57f2d24f6efa2f65fa056'
LOCK_SHA = '84f99595b7564d9196b0eeb25c054b290801bfe2e3a148f61ab2c9c2871d37b4'
DRIVER_PACKAGES = {
 'playwright': {'version':'1.62.1','resolved':'https://registry.npmjs.org/playwright/-/playwright-1.62.1.tgz','integrity':'sha512-0M+L3LAD8/nm554LOla9Ayx0j0tmFZ0FBcoQ7F1VuVHpM/XpiC8RcDzBQB8W5+hA8L22THxELzeF+2WcUzvcLg=='},
 'playwright-core': {'version':'1.62.1','resolved':'https://registry.npmjs.org/playwright-core/-/playwright-core-1.62.1.tgz','integrity':'sha512-wPYSwEBJY9GHraISXqyqtx0na0LpO3XEX7jNDhntbex7tzUS7kLnZsOlFruFJB4Hi/rhDMjXGqHewDZ68nYZVw=='}}

def sha(path):
 with path.open('rb') as f: return hashlib.file_digest(f,'sha256').hexdigest()

class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self, req, fp, code, msg, headers, newurl): return None

def api(path, token, redirect=False):
 assert path.startswith('/repos/'+REPOSITORY+'/actions/artifacts/')
 request=urllib.request.Request('https://api.github.com'+path,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
 try:
  with urllib.request.build_opener(NoRedirect).open(request,timeout=30) as response:
   assert not redirect,'ARTIFACT_REDIRECT_REQUIRED'
   return json.loads(response.read(1048576))
 except urllib.error.HTTPError as error:
  assert redirect and error.code in (302,307),'GITHUB_READ_FAILED'
  url=error.headers.get('Location','')
  parsed=urllib.parse.urlparse(url)
  assert parsed.scheme=='https' and not parsed.username and not parsed.password
  assert parsed.hostname and (parsed.hostname.endswith('.blob.core.windows.net') or parsed.hostname.endswith('.githubusercontent.com') or parsed.hostname.endswith('.s3.amazonaws.com') or parsed.hostname.endswith('.actions.githubusercontent.com')),'UNREVIEWED_ARTIFACT_REDIRECT_HOST'
  return url

def download(url,target,max_bytes,expected_bytes=None):
 # No Authorization header follows the provider's signed redirect.
 request=urllib.request.Request(url,headers={'Accept':'application/octet-stream'})
 with urllib.request.urlopen(request,timeout=120) as response, target.open('xb') as out:
  count=0
  while chunk:=response.read(1048576):
   count+=len(chunk);assert count<=max_bytes,'DOWNLOAD_SIZE_BOUND'
   out.write(chunk)
 assert expected_bytes is None or count==expected_bytes,'DOWNLOAD_SIZE_MISMATCH'

def verify_archive(path,destination):
 assert path.stat().st_size==ARCHIVE_BYTES and sha(path)==ARCHIVE_SHA,'PRIOR_OUTER_ARCHIVE_IDENTITY_MISMATCH'
 with zipfile.ZipFile(path) as z:
  index_bytes=z.read('artifact-index.json');assert hashlib.sha256(index_bytes).hexdigest()==INDEX_SHA
  index=json.loads(index_bytes);assert index['schema']=='work8-candidate-upload-v1' and index['secretScanPassed'] is True and index['beforeRuntimeSecrets'] is True
  expected={r['path']:r for r in index['files']}
  assert len(expected)==9 and set(z.namelist())==set(expected)|{'artifact-index.json'} and len(z.namelist())==10
  destination.mkdir()
  for name in z.namelist():
   assert '/' not in name and '\\' not in name and name not in ('.','..')
   p=destination/name
   with z.open(name) as src,p.open('xb') as out:
    while chunk:=src.read(1048576):out.write(chunk)
   if name in expected:assert p.stat().st_size==expected[name]['bytes'] and sha(p)==expected[name]['sha256'],'PRIOR_MEMBER_IDENTITY_MISMATCH'
 components=json.loads((destination/'immutable-images.json').read_text())
 return components

def verify_image_archive(path,component):
 assert path.stat().st_size==component['archiveBytes'] and sha(path)==component['archiveSha256']
 hashes={};small={}
 with tarfile.open(path,mode='r|gz') as t:
  for member in t:
   if not member.isfile():continue
   assert member.name not in hashes
   stream=t.extractfile(member)
   if member.size<131072:
    data=stream.read();hashes[member.name]=hashlib.sha256(data).hexdigest();small[member.name]=data
   else:hashes[member.name]=hashlib.file_digest(stream,'sha256').hexdigest()
 manifest=json.loads(small['manifest.json']);assert len(manifest)==1
 m=manifest[0];config=json.loads(small[m['Config']])
 assert 'sha256:'+hashes[m['Config']]==component['image']
 labels=config['config']['Labels'];assert labels['org.opencontainers.image.revision']==component['commit'] and labels['io.empireai.source-tree']==component['tree']
 assert ['sha256:'+hashes[n] for n in m['Layers']]==config['rootfs']['diff_ids']
 assert 'NODE_VERSION=22.23.2' in config['config']['Env']
 return len(m['Layers'])

def prepare_driver(root,private):
 lock=root/'normal-source/empireai-web/package-lock.json';assert sha(lock)==LOCK_SHA,'BROWSER_LOCK_IDENTITY_MISMATCH'
 package_lock=json.loads(lock.read_text());driver=root/'native-transition-driver';driver.mkdir()
 (driver/'package.json').write_text('{"name":"work8-retained-browser-driver","private":true}')
 receipts=[]
 for name,expected in DRIVER_PACKAGES.items():
  entry=package_lock['packages']['node_modules/'+name]
  assert all(entry[k]==v for k,v in expected.items()),'BROWSER_DRIVER_PIN_MISMATCH'
  path=private/(name+'.tgz');download(expected['resolved'],path,16*1024**2)
  data=path.read_bytes();assert 'sha512-'+base64.b64encode(hashlib.sha512(data).digest()).decode()==entry['integrity'],'BROWSER_DRIVER_INTEGRITY_MISMATCH'
  out=driver/'node_modules'/name;out.mkdir(parents=True)
  with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as archive:
   for member in archive.getmembers():
    parts=pathlib.PurePosixPath(member.name).parts
    assert parts[0]=='package' and '..' not in parts and not member.issym() and not member.islnk() and (member.isdir() or member.isfile()),'BROWSER_DRIVER_MEMBER_REFUSED'
    member.name=str(pathlib.PurePosixPath(*parts[1:]))
    if member.name=='.':continue
    archive.extract(member,out,filter='data')
  assert json.loads((out/'package.json').read_text())['version']==expected['version']
  receipts.append({'package':name,**expected,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'lifecycleScriptsExecuted':False})
 return receipts

def main():
 root=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve();out=root/'native-transition-output';out.mkdir();stage='event-authority';result={'status':'FAIL','productionAccess':False,'buildsRepeated':False,'broadBuildScansRepeated':False}
 try:
  assert os.environ['GITHUB_EVENT_NAME']=='create' and os.environ['GITHUB_REF']=='refs/heads/'+BRANCH
  event=json.load(open(os.environ['GITHUB_EVENT_PATH']));assert event['ref_type']=='branch' and event['ref']==BRANCH
  assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and os.environ['GITHUB_RUN_NUMBER']=='1'
  assert subprocess.check_output(['node','--version'],text=True).strip()=='v22.23.2'
  with tempfile.TemporaryDirectory(prefix='work8-retained-import-',dir=os.environ['RUNNER_TEMP']) as temp:
   private=pathlib.Path(temp);stage='prior-artifact-metadata'
   token=os.environ.pop('GH_RETAINED_READ_TOKEN');meta=api('/repos/'+REPOSITORY+'/actions/artifacts/'+str(ARTIFACT_ID),token)
   assert meta['id']==ARTIFACT_ID and meta['size_in_bytes']==ARCHIVE_BYTES and meta['digest']=='sha256:'+ARCHIVE_SHA and meta['expired'] is False
   assert meta['workflow_run']['id']==PRIOR_RUN and meta['workflow_run']['head_sha']==PRIOR_CONTROLLER
   signed=api('/repos/'+REPOSITORY+'/actions/artifacts/'+str(ARTIFACT_ID)+'/zip',token,redirect=True);del token
   stage='prior-artifact-download';archive=private/'candidates.zip';download(signed,archive,ARCHIVE_BYTES,ARCHIVE_BYTES);del signed
   stage='prior-artifact-and-image-validation';candidates=root/'native-transition-candidates';components=verify_archive(archive,candidates)
   pins=json.loads((pathlib.Path(__file__).with_name('components.json')).read_text());verified=[]
   for role in ['backend','normal','recovery']:
    component=components[role];assert component['commit']==pins[role]['commit'] and component['tree']==pins[role]['tree']
    layers=verify_image_archive(candidates/component['archiveFile'],component)
    verified.append({'role':role,'image':component['image'],'source':component['commit'],'tree':component['tree'],'layersVerified':layers,'archiveSha256':component['archiveSha256']})
   assert sum(x['layersVerified'] for x in verified)==23
   stage='load-verified-prior-images'
   for role in ['backend','normal','recovery']:
    component=components[role];subprocess.run(['docker','load','--input',str(candidates/component['archiveFile'])],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=180,check=True)
    actual=json.loads(subprocess.check_output(['docker','image','inspect',component['image']]))[0]
    assert actual['Id']==component['image']
    assert actual['Config']['Labels']['org.opencontainers.image.revision']==component['commit'] and actual['Config']['Labels']['io.empireai.source-tree']==component['tree']
   stage='locked-browser-driver';drivers=prepare_driver(root,private)
   result.update(status='PASS_RETAINED_BYTES_LOADED_DRIVER_READY',priorRunId=PRIOR_RUN,artifactId=ARTIFACT_ID,outerArchiveBytes=ARCHIVE_BYTES,outerArchiveSha256=ARCHIVE_SHA,indexSha256=INDEX_SHA,images=verified,browserDriver=drivers,applicationImagesRebuilt=False,newCandidateUpload=False,providerCredentialPassedToRuntime=False)
 except Exception:
  result['failedStage']=stage;result['error']='RETAINED_PREPARATION_REFUSED'
 finally:
  (out/'retained-import-result.json').write_text(json.dumps(result,indent=2)+'\n')
  candidate_packages.write_index(out,'work8-bounded-upload-v1',exactGeneratedSecretCheck=True)
 if result['status']=='FAIL':raise SystemExit(1)

if __name__=='__main__':main()
