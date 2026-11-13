#!/usr/bin/env python3
"""Assemble public executable runtime bytes only; private restore inputs stay outside."""
import argparse,hashlib,json,os,pathlib,shutil,stat,subprocess,re
D=pathlib.Path(__file__).resolve().parent
h=lambda b:hashlib.sha256(b).hexdigest()
def copy_regular_tree(source,target,allowed_root=None,skip_missing=False):
 """Copy dereferenced regular contents; refuse symlinks escaping the admitted tree."""
 root=source.resolve();allowed=allowed_root or (root.parent.parent if source.name in ['backend','pillow']else root)
 seen=[]
 def inner(src,dst):
  
  if skip_missing and src.is_symlink()and not src.exists():return
  real=src.resolve(strict=True);assert real.is_relative_to(allowed),'COPY_LINK_ESCAPES_ADMITTED_SOURCE'
  if real.is_dir():
   assert real not in seen,'DIRECTORY_LINK_CYCLE';seen.append(real);dst.mkdir(parents=True,exist_ok=True)
   for p in sorted(real.iterdir()):inner(p,dst/p.name)
   seen.pop();return
  assert real.is_file()and stat.S_ISREG(real.stat().st_mode)
  dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(real,dst);dst.chmod(0o555 if real.stat().st_mode&0o111 else 0o444)
 inner(source,target)
def main():
 p=argparse.ArgumentParser();p.add_argument('--retained',required=True);p.add_argument('--frontend',required=True);p.add_argument('--repository',required=True);p.add_argument('--output',required=True);p.add_argument('--base-root');a=p.parse_args()
 R=pathlib.Path(a.retained).resolve();F=pathlib.Path(a.frontend).resolve();repo=pathlib.Path(a.repository).resolve();O=pathlib.Path(a.output).absolute();base=pathlib.Path(a.base_root).resolve()if a.base_root else pathlib.Path('/')
 assert O.parent.resolve()==O.parent and not O.exists();O.mkdir(mode=0o755)
 for name in ['backend','pillow','deployment']:copy_regular_tree(R/'app'/name,O/'app'/name)
 copy_regular_tree(F,O/'frontend/app')
 node=R/'usr/local/bin/node';assert h(node.read_bytes())=='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
 (O/'usr/local/bin').mkdir(parents=True);shutil.copyfile(node,O/'usr/local/bin/node');(O/'usr/local/bin/node').chmod(0o555)
 owner=repo/'v128/owner_review';C=O/'control/owner_review';C.mkdir(parents=True)
 copied=[]
 for path in sorted(owner.rglob('*')):
  if not path.is_file():continue
  rel=path.relative_to(owner)
  if '__pycache__'in rel.parts or path.name.startswith('test_')or'.test.'in path.name or rel.parts[0]=='portable' or path.suffix=='.md':continue
  assert path.suffix in ['.py','.mjs','.json','.pem','.js','.map'],path
  assert path.name not in ['runtime-manifest.json','build-provenance.json']
  data=path.read_bytes();assert re.search(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/=]{32,}',data)is None
  dst=C/rel;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(data);dst.chmod(0o444);copied.append(rel.as_posix())
 native=repo/'v126/native_private'
 reused=['native-tier0-session-routes.mjs','recipient-public-key.pem','evidence-envelope-runtime-pin.json']
 for name in reused:
  data=(native/name).read_bytes();dst=C/name
  if dst.exists():assert dst.read_bytes()==data
  else:dst.write_bytes(data);dst.chmod(0o444)
 overlay=json.loads((owner/'backend-overlays.json').read_bytes());assert len(overlay['files'])==8
 for item in overlay['files']:
  src=owner/item['sourceFile'];data=src.read_bytes();assert len(data)==item['bytes']and h(data)==item['sha256']
  assert item['destination'].startswith('/app/backend/dist/')and'..'not in pathlib.PurePosixPath(item['destination']).parts
  dst=O/item['destination'].lstrip('/');dst.parent.mkdir(parents=True,exist_ok=True);assert not dst.is_symlink()
  if dst.exists():dst.chmod(0o644)
  dst.write_bytes(data);dst.chmod(0o444)
 for item in overlay['repositorySourceFiles']:
  src=repo/item['path'];data=src.read_bytes()if src.is_file()else subprocess.check_output(['git','-C',str(repo),'show',':'+item['path']])
  assert len(data)==item['bytes']and h(data)==item['sha256'];dst=O/'app'/item['path'];dst.parent.mkdir(parents=True,exist_ok=True)
  if dst.exists():dst.chmod(0o644)
  dst.write_bytes(data);dst.chmod(0o444)
 redis_pins=json.loads((native/'redis-abi-inputs.json').read_bytes())['files'];redis=O/'opt/redis';(redis/'lib').mkdir(parents=True)
 packages=D/'redis-packages/mounts'
 for item in redis_pins:
  src=R/item['imagePath']if item['sourceKind']=='EXACT_RETAINED_IMAGE'else packages/item['packageFile'];data=src.read_bytes();assert len(data)==item['bytes']and h(data)==item['sha256']
  dst=redis/item['destination'];dst.write_bytes(data);dst.chmod(0o555)
 (O/'usr/bin').mkdir(parents=True,exist_ok=True)
 launcher=b'#!/bin/sh\nexec /opt/redis/ld-linux-x86-64.so.2 --library-path /opt/redis/lib /opt/redis/redis-server "$@"\n'
 (O/'usr/bin/redis-server').write_bytes(launcher);(O/'usr/bin/redis-server').chmod(0o555)
 # Pin complete Python/base shared library bytes as regular files, including invocation aliases.
 for sub in ['usr/local/lib','usr/lib']:copy_regular_tree(base/sub,O/sub,allowed_root=base,skip_missing=True)
 for name in ['usr/bin/timeout','usr/bin/setpriv','usr/bin/env','usr/bin/dash']:
  src=base/name;assert src.is_file();shutil.copyfile(src.resolve(),O/name);(O/name).chmod(0o555)
 shutil.copyfile(O/'usr/bin/dash',O/'usr/bin/sh');(O/'usr/bin/sh').chmod(0o555)
 (O/'bin').mkdir();shutil.copyfile(O/'usr/bin/dash',O/'bin/sh');(O/'bin/sh').chmod(0o555)
 python=(base/'usr/local/bin/python3.11').resolve();assert python.is_file()
 for name in ['usr/local/bin/python3.11','usr/local/bin/python3','usr/bin/python3']:
  shutil.copyfile(python,O/name);(O/name).chmod(0o555)
 # The ELF interpreter must resolve to the admitted base loader, with no aliases.
 (O/'lib64').mkdir();shutil.copyfile(O/'usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2',O/'lib64/ld-linux-x86-64.so.2');(O/'lib64/ld-linux-x86-64.so.2').chmod(0o555)
 (O/'etc').mkdir();shutil.copyfile(base/'etc/ld.so.cache',O/'etc/ld.so.cache');(O/'etc/ld.so.conf').write_text('/usr/local/lib\n/usr/lib/x86_64-linux-gnu\n')
 (O/'etc/passwd').write_text('root:x:0:0:root:/root:/bin/sh\nreview:x:1001:1001:review:/tmp:/bin/sh\n');(O/'etc/group').write_text('root:x:0:\nreview:x:1001:\n')
 for name in ['private','state','evidence','inputs','tmp','dev','proc','root']:(O/name).mkdir(mode=0o755)
 (O/'tmp').chmod(0o1777)
 receipt={'schema':'A09_PUBLIC_PORTABLE_RUNTIME_ASSEMBLY_V1','status':'PUBLIC_RUNTIME_BYTES_ASSEMBLED','retainedNodeSHA256':h(node.read_bytes()),'backendOverlayManifestSHA256':h((owner/'backend-overlays.json').read_bytes()),'backendOverlayCount':8,'ownerControlFiles':copied,'reusedNativeControlFiles':[{ 'path':n,'sha256':h((native/n).read_bytes())}for n in reused],
  'symlinksDereferencedToRegularCopies':True,'nativePackagePillowAliasCopiedFromSamePinnedTarget':True,'privateSQLiteImagesOrCredentialsIncluded':False,'nativeApplicationStarted':False,'sourceManifestFinalized':(C/'source-manifest.json').exists(),'runtimeManifestFinalized':False}
 (D/'assembly-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt,indent=2))
if __name__=='__main__':main()
