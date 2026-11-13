#!/usr/bin/env python3
"""Extract exact retained OCI build inputs without Docker, never start the app."""
import argparse,hashlib,json,os,pathlib,shutil,stat,tarfile,tempfile
IMAGE='f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
SOURCE='6c1e63ba20619ee480742fd87dc810ca93152e22'
ARCHIVE_SIZE=207560277;ARCHIVE_SHA='b99d11a65d40d6a6a197da6ba805e72a72ac55d4551ad13f31930ec5eeadbcb6'
LAYERS=['34467cc93912af891dfee8a3902adf9b4f355a9bca4eaa46f658d1181a21de0d','fa308e2890c6e8792de63890c6311ed9fd21e6390db51e340b6085a1b23852e1','e05e1884319cd6aba2cbbc7a2afb655ca032bc83988020a9088439cac50dca76','c518045d8fcb97604685082962ab1cf5647e0baa5d33dd8e4c7ac5e05118a513','a483d4ed4858cfb9b72c8b6175ad924777e38b5695f4e26b860ace4d652273ad','ff56401bf0f0768a5c41e7f5296ba38871e6ff2e5581f6f5b2a7c9c62af659aa','6fcdd30fe8eb828dab2789e05166a1a3622a872fd32aa9e3c5256de438058229','67d7eeaa5a454ac7a9102a8e20a1e804fb2e0b9fd3d881e800786d49fe5759f3','8a2d0a06d2cd345ade52cbb352f003de6b7222cbb90bb279c23af2b20f2ade5b','32e092618c37ba48e77e69510f8623fb3251a6a04e73afbdd283e7aa25f7fd8b']
def sha(p):
 with pathlib.Path(p).open('rb')as f:return hashlib.file_digest(f,'sha256').hexdigest()
def h(b):return hashlib.sha256(b).hexdigest()
def tree(root):
 rows=[]
 for p in sorted(root.rglob('*')):
  mode=p.lstat().st_mode;name=p.relative_to(root).as_posix()
  if stat.S_ISDIR(mode):continue
  if stat.S_ISLNK(mode):
   target=os.readlink(p);assert not target.startswith('/')and p.resolve(strict=True).is_relative_to(root)
   rows.append({'path':name,'type':'symlink','target':target})
  else:
   assert stat.S_ISREG(mode)and p.stat().st_nlink==1
   rows.append({'path':name,'type':'file','bytes':p.stat().st_size,'sha256':sha(p)})
 return rows
def digest_rows(rows):return h(json.dumps(rows,sort_keys=True,separators=(',',':')).encode())
def main():
 a=argparse.ArgumentParser();a.add_argument('--backend-archive',required=True);a.add_argument('--output',required=True);a.add_argument('--controls',required=True);a=a.parse_args()
 archive=pathlib.Path(a.backend_archive).resolve();out=pathlib.Path(a.output).absolute();control=pathlib.Path(a.controls).resolve()
 assert archive.is_file()and not archive.is_symlink()and archive.stat().st_size==ARCHIVE_SIZE and sha(archive)==ARCHIVE_SHA
 assert out.parent.resolve()==out.parent and not out.exists()and not out.is_symlink();out.mkdir(mode=0o700)
 redis=json.loads((control/'redis-abi-inputs.json').read_bytes())
 native=json.loads((control/'native-source-pins.json').read_bytes())['nativeSourcePins']
 front=json.loads((control/'frontend-build-inputs.json').read_bytes())
 retained_libs={p['imagePath']for p in redis['files']if p['sourceKind']=='EXACT_RETAINED_IMAGE'}
 prefixes=('app/backend/','app/pillow/','app/deployment/','app/empireai-web/','usr/local/lib/node_modules/npm/')
 exact=retained_libs|{'usr/local/bin/node'}
 selected=lambda n:n in exact or any(n==p[:-1]or n.startswith(p)for p in prefixes)
 files=links=0;layer_receipts=[]
 with tempfile.TemporaryDirectory(prefix='oci-',dir=out.parent)as td:
  cache=pathlib.Path(td)
  with tarfile.open(archive,'r|gz')as outer:
   manifest=config=None
   for member in outer:
    name=member.name.removeprefix('./')
    if name=='manifest.json':
     assert manifest is None and member.isfile()and member.size<65536;manifest=json.load(outer.extractfile(member))
    elif name=='blobs/sha256/'+IMAGE:
     assert config is None and member.isfile()and member.size<1048576;raw=outer.extractfile(member).read();assert h(raw)==IMAGE;config=json.loads(raw)
    elif name.startswith('blobs/sha256/')and name.split('/')[-1]in LAYERS:
     digest=name.split('/')[-1];p=cache/digest;assert member.isfile()and not p.exists()
     with outer.extractfile(member)as f,p.open('xb')as sink:shutil.copyfileobj(f,sink,1048576)
     assert sha(p)==digest;layer_receipts.append({'sha256':digest,'bytes':p.stat().st_size})
  assert len(layer_receipts)==len(LAYERS)and {x['sha256']for x in layer_receipts}==set(LAYERS)
  assert len(manifest)==1 and manifest[0]['Config']=='blobs/sha256/'+IMAGE
  assert manifest[0]['Layers']==['blobs/sha256/'+x for x in LAYERS]
  assert config['architecture']=='amd64'and config['os']=='linux'and config['config']['Labels']['org.opencontainers.image.revision']==SOURCE
  assert config['rootfs']['diff_ids']==['sha256:'+x for x in LAYERS]
  for digest in LAYERS:
   with tarfile.open(cache/digest,'r:')as layer:
    for member in layer:
     name=member.name.removeprefix('./');rel=pathlib.PurePosixPath(name)
     assert not rel.is_absolute()and '..'not in rel.parts
     if not selected(name):continue
     assert not any(x.startswith('.wh.')for x in rel.parts),'UNREVIEWED_SELECTED_WHITEOUT'
     assert rel.name not in ['.env','.env.local','.env.production']and not name.endswith(('.sqlite','.sqlite3','.db')),'PRIVATE_STATE_OR_CREDENTIAL_FILE_REFUSED'
     target=out/name;target.parent.mkdir(parents=True,exist_ok=True)
     assert target.parent.resolve().is_relative_to(out)
     if member.isdir():
      assert not target.is_symlink();target.mkdir(exist_ok=True);continue
     if target.exists()or target.is_symlink():
      assert not target.is_dir();target.unlink()
     if member.isfile():
      with layer.extractfile(member)as source,target.open('xb')as sink:shutil.copyfileobj(source,sink,1048576)
      target.chmod(0o755 if member.mode&0o111 else 0o644);files+=1
     elif member.issym():
      assert not pathlib.PurePosixPath(member.linkname).is_absolute()
      assert (target.parent/member.linkname).resolve(strict=False).is_relative_to(out)
      target.symlink_to(member.linkname);links+=1
     elif member.islnk():
      link=pathlib.PurePosixPath(member.linkname.removeprefix('./'));assert not link.is_absolute()and '..'not in link.parts
      source=out/link;assert source.resolve(strict=True).is_relative_to(out)and source.is_file()and not source.is_symlink()
      shutil.copyfile(source,target);target.chmod(0o755 if member.mode&0o111 else 0o644);files+=1
     else:raise AssertionError('UNSUPPORTED_SELECTED_MEMBER_TYPE')
  for pin in native:
   p=out/'app'/pin['path'];assert p.is_file()and not p.is_symlink()and p.stat().st_size==pin['bytes']and sha(p)==pin['sha256']
  node=out/'usr/local/bin/node';assert sha(node)==front['nodeSHA256']=='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
  npm_rows=tree(out/'usr/local/lib/node_modules/npm');assert len(npm_rows)==front['npmFileCount']==1964 and digest_rows(npm_rows)==front['npmTreeSHA256']
  frontend_rows=tree(out/'app/empireai-web');assert len(frontend_rows)==front['baseFileCount']==957 and digest_rows(frontend_rows)==front['baseTreeSHA256']
  for pin in redis['files']:
   if pin['sourceKind']=='EXACT_RETAINED_IMAGE':
    p=out/pin['imagePath'];assert p.stat().st_size==pin['bytes']and sha(p)==pin['sha256']
  receipt={'schema':'A09_DAEMONLESS_EXACT_RETAINED_RUNTIME_EXTRACTION_V1','status':'PASS','archiveSHA256':ARCHIVE_SHA,'archiveBytes':ARCHIVE_SIZE,
   'imageConfigSHA256':IMAGE,'applicationCommit':SOURCE,'layers':layer_receipts,'nativeSourcePinsVerified':len(native),'extractedFileVersions':files,'symlinkVersions':links,
   'nodeSHA256':sha(node),'npmFileCount':len(npm_rows),'npmTreeSHA256':digest_rows(npm_rows),'frontendBaseFileCount':len(frontend_rows),'frontendBaseTreeSHA256':digest_rows(frontend_rows),
   'allRetainedRedisLibraryPinsVerified':True,'containerDaemonUsed':False,'nativeApplicationStarted':False,'privateStateImported':False,'credentialsConfigured':False}
  (out/'extraction-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
  print(json.dumps(receipt,indent=2))
if __name__=='__main__':main()
