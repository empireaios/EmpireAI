#!/usr/bin/env python3
"""Recover exact accepted bytes through pinned immutable same-repository blobs."""
import hashlib,json,os,pathlib,sys,urllib.request,urllib.error,urllib.parse,zipfile
ROOT=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-session-browser-'+os.environ['GITHUB_RUN_ID'])
ZIP_BYTES=338251567; ZIP_SHA='39f904154764d2e70413045c7ebefbd4c04f38d0e09360ea19b2834fcc3ef755'
BACK_BYTES=207560277; BACK_SHA='b99d11a65d40d6a6a197da6ba805e72a72ac55d4551ad13f31930ec5eeadbcb6'
from git_blob_transport import fetch_retained_zip
MANIFEST_SHA256='7b8d9cfbef07c72fe97257acc5d5245459d670f77a57aaa1e39c47bacc64e658'
def sha(data):return hashlib.sha256(data).hexdigest()
ROOT.mkdir(mode=0o700,parents=False,exist_ok=True); out=ROOT/'evidence';out.mkdir(mode=0o700,exist_ok=True)
zip_path=ROOT/'retained-input.zip'
transport=fetch_retained_zip(pathlib.Path(__file__).with_name('retained-blob-manifest.json'),MANIFEST_SHA256,zip_path,os.environ.get('GH_TOKEN'))
(out/'retained-input-metadata.json').write_text(json.dumps({'originalArtifactId':13340201255,'originalRunId':41860150363,'originalArtifactExpired':True,'exactSameBytesTransport':transport},indent=2)+'\n')
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

# Reuse the exact accepted normal standalone archive from the same verified ZIP.
FRONT_NAME='archives/EmpireAI_V65_NORMAL_750483b3152f_node22_linux_x64.tar.gz'
FRONT_BYTES=65297561;FRONT_SHA='391b15ded61649159291a4cad6f8071ce1fdf05f2e0f3732d3b1cf695a43e1d9'
with zipfile.ZipFile(zip_path)as z:
 assert z.namelist().count(FRONT_NAME)==1 and z.getinfo(FRONT_NAME).file_size==FRONT_BYTES
 data=z.read(FRONT_NAME);assert len(data)==FRONT_BYTES and sha(data)==FRONT_SHA
 with(ROOT/'normal.tar.gz').open('xb')as f:f.write(data)
(out/'normal-input-integrity.json').write_text(json.dumps({'artifactId':13340201255,'runId':41860150363,'archiveBytes':FRONT_BYTES,'archiveSHA256':FRONT_SHA,'source':'750483b3152f2c9c65a65b6381c8c94f081b9eb1','rebuild':False},indent=2)+'\n')
