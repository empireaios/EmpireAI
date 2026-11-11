#!/usr/bin/env python3
"""Stage six pinned, read-only HH4 dependency files; never install packages."""
import argparse,hashlib,io,json,os,pathlib,subprocess,tarfile,urllib.parse,urllib.request

parser=argparse.ArgumentParser()
parser.add_argument('destination')
parser.add_argument('--verified-package-cache')
args=parser.parse_args()
control=pathlib.Path(__file__).resolve().parent
manifest_path=control/'pinned-dependencies.json'
assert hashlib.sha256(manifest_path.read_bytes()).hexdigest()=='4718286af9c9a747f98da2197305271433a2a57505b9939f7bc34b64ce6bb87b'
manifest=json.loads(manifest_path.read_text())
assert manifest['applicationImage']=='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
assert len(manifest['packages'])==6 and len(manifest['mounts'])==6
root=pathlib.Path(args.destination)
assert root.is_absolute() and root.parent.resolve(strict=True)==root.parent
assert not root.exists() and not root.is_symlink(),'Fresh explicit dependency directory required'
root.mkdir(mode=0o700);(root/'packages').mkdir(mode=0o700);(root/'mounts').mkdir(mode=0o700)
cache=pathlib.Path(args.verified_package_cache).resolve(strict=True) if args.verified_package_cache else None
class SafeRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,url):
  u=urllib.parse.urlsplit(url)
  assert u.scheme=='https' and u.hostname in ['deb.debian.org','security.debian.org'] and not u.username and not u.password and u.port is None
  return super().redirect_request(req,fp,code,msg,headers,url)
opener=urllib.request.build_opener(SafeRedirect)
receipts=[];staged=[];symlink_seen=False
for package in manifest['packages']:
 name=package['fileName'];assert pathlib.Path(name).name==name and name.endswith('_amd64.deb')
 u=urllib.parse.urlsplit(package['url']);assert u.scheme=='https' and u.hostname=='deb.debian.org' and not u.query and not u.fragment and not u.username and not u.password
 size=package['bytes'];assert 0<size<3000000
 if cache:
  p=cache/name;assert p.is_file() and not p.is_symlink();data=p.read_bytes()
 else:
  with opener.open(urllib.request.Request(package['url'],headers={'User-Agent':'EmpireAI-V116-HH4-Dependency'}),timeout=30) as response:data=response.read(size+1)
 assert len(data)==size and hashlib.sha256(data).hexdigest()==package['sha256']
 local=root/'packages'/name
 with local.open('xb') as stream:stream.write(data)
 result=subprocess.run(['dpkg-deb','--fsys-tarfile',str(local)],capture_output=True,timeout=30)
 assert result.returncode==0 and len(result.stdout)<=33554432
 selected=[m for m in manifest['mounts'] if m['package']==package['name']]
 with tarfile.open(fileobj=io.BytesIO(result.stdout),mode='r:') as archive:
  members={}
  for member in archive:
   path=member.name.removeprefix('./');assert not path.startswith('/') and '..' not in pathlib.PurePosixPath(path).parts
   assert path not in members,'Duplicate archive member';members[path]=member
  if package['name']=='redis-server':
   proof=manifest['serverSymlinkProof'];member=members[proof['dataTarMember']]
   assert member.issym() and member.linkname==proof['linkTarget'];symlink_seen=True
  for item in selected:
   member=members[item['dataTarMember']];assert member.isfile() and not member.islnk() and not member.issym() and member.size==item['bytes']
   data=archive.extractfile(member).read(item['bytes']+1)
   assert len(data)==item['bytes'] and hashlib.sha256(data).hexdigest()==item['sha256']
   assert pathlib.Path(item['name']).name==item['name']
   target=root/'mounts'/item['name']
   with target.open('xb') as stream:stream.write(data)
   target.chmod(int(item['mode'],8));info=target.lstat()
   assert info.st_nlink==1 and info.st_uid==os.getuid()
   staged.append({**item,'source':str(target),'actualUid':info.st_uid,'actualGid':info.st_gid})
 receipts.append({'name':package['name'],'version':package['version'],'bytes':size,'sha256':package['sha256'],'originalPackageDataOnly':True})
assert symlink_seen and len(staged)==6 and sum(x['bytes'] for x in staged)==8706040
receipt={'schema':'v116-hh4-dependency-staging-receipt-v1','manifestSHA256':hashlib.sha256(manifest_path.read_bytes()).hexdigest(),'applicationImage':manifest['applicationImage'],'packages':receipts,'mounts':staged,'packageInstallationPerformed':False,'packageScriptsExecuted':False,'applicationChanged':False,'redisServiceStarted':False,'dockerMountVerified':False,'wholeRowAccepted':False}
(root/'dependency-staging-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'stagedFiles':len(staged),'bytes':sum(x['bytes'] for x in staged),'manifestSHA256':receipt['manifestSHA256'],'packageInstallationPerformed':False}))
