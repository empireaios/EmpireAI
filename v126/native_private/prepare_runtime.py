#!/usr/bin/env python3
"""Admit retained exact app/frontend/Redis; never starts an application.

Usage: python3 prepare_runtime.py /absolute/retained.zip /absolute/fresh-root
Run only inside the reserved isolated executor. Docker carrier is never started.
"""
import hashlib, json, os, pathlib, shutil, stat, subprocess, sys, zipfile
import retained_current_packages as packages
CONTROL=pathlib.Path(__file__).resolve().parent
IMAGE='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
SOURCE='6c1e63ba20619ee480742fd87dc810ca93152e22'
ZIP_BYTES=338251567
ZIP_SHA='39f904154764d2e70413045c7ebefbd4c04f38d0e09360ea19b2834fcc3ef755'
ARCHIVES={
 'archives/backend-v65-source-equivalent.tar.gz':('backend.tar.gz',207560277,'b99d11a65d40d6a6a197da6ba805e72a72ac55d4551ad13f31930ec5eeadbcb6'),
  'archives/EmpireAI_V65_NORMAL_750483b3152f_node22_linux_x64.tar.gz':('normal.tar.gz',65297561,'391b15ded61649159291a4cad6f8071ce1fdf05f2e0f3732d3b1cf695a43e1d9')}
class PreparationFailure(RuntimeError):
 def __init__(self,argv,p):
  super().__init__('COMMAND_FAILED_'+pathlib.Path(argv[0]).name+'_'+str(p.returncode))
  self.diagnostic={'argv':argv,'exitCode':p.returncode,'stderr':p.stderr.decode(errors='replace')[:8192],
   'stdoutTail':p.stdout.decode(errors='replace')[-2048:]}
def sha(p):
 with pathlib.Path(p).open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def run(argv,seconds=30):
 p=subprocess.run(argv,stdin=subprocess.DEVNULL,capture_output=True,timeout=seconds)
 assert len(p.stdout)+len(p.stderr)<=1048576,'OUTPUT_BOUND'
 if p.returncode:raise PreparationFailure(argv,p)
 return p.stdout
def docker(args,seconds=30):return run(['docker']+args,seconds)
def inspect(name):return json.loads(docker(['inspect',name]))[0]
def save(root,name,data):
 with(root/name).open('x') as f:json.dump(data,f,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
def freeze(root):
 for folder,dirs,files in os.walk(root,followlinks=False):
  for name in dirs+files:
   p=pathlib.Path(folder)/name;s=p.lstat()
   if stat.S_ISLNK(s.st_mode):assert p.resolve(strict=True).is_relative_to(root)
   elif stat.S_ISDIR(s.st_mode):p.chmod(0o555)
   else:assert stat.S_ISREG(s.st_mode)and s.st_nlink==1;p.chmod(0o555 if s.st_mode&0o111 else 0o444)
 root.chmod(0o555)
def main():
 assert len(sys.argv)==3 and os.uname().machine=='x86_64'
 archive=pathlib.Path(sys.argv[1]);root=pathlib.Path(sys.argv[2])
 assert archive.is_absolute()and archive.resolve(strict=True)==archive and archive.is_file()and not archive.is_symlink()
 assert archive.stat().st_size==ZIP_BYTES and sha(archive)==ZIP_SHA
 assert root.is_absolute()and root.parent.resolve(strict=True)==root.parent and not root.exists()and not root.is_symlink()
 assert ','not in str(root);root.mkdir(mode=0o700);(root/'evidence').mkdir(mode=0o700)
 name='work8-v126-carrier-'+hashlib.sha256(str(root).encode()).hexdigest()[:16]
 assert subprocess.run(['docker','inspect',name],capture_output=True,timeout=10).returncode!=0
 carrier=False;failure=None
 try:
  with zipfile.ZipFile(archive)as z:
   for source,(target,size,digest)in ARCHIVES.items():
    assert z.namelist().count(source)==1 and z.getinfo(source).file_size==size
    with z.open(source)as f,(root/target).open('xb')as out:shutil.copyfileobj(f,out,1048576)
    assert(root/target).stat().st_size==size and sha(root/target)==digest
  docker(['load','--input',str(root/'backend.tar.gz')],120)
  image=json.loads(docker(['image','inspect',IMAGE]))[0]
  assert image['Id']==IMAGE and image['Architecture']=='amd64'and image['Os']=='linux'
  assert image['Config']['Labels']['org.opencontainers.image.revision']==SOURCE
  save(root/'evidence','retained-application-image.json',image)
  docker(['create','--name',name,'--label','empireai.v126.native.carrier='+name,'--network','none',
   '--cap-drop','ALL','--security-opt','no-new-privileges','--read-only','--entrypoint','/bin/false',IMAGE])
  carrier=True;x=inspect(name);assert x['State']['Pid']==0 and x['State']['Status']=='created'and x['Image']==IMAGE
  docker(['cp',name+':/app',str(root/'app')],120);freeze(root/'app')
  docker(['cp',name+':/usr/local/bin/node',str(root/'node')]);assert sha(root/'node')=='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
  (root/'node').chmod(0o555)
  pins=json.loads((CONTROL/'native-source-pins.json').read_text())
  for pin in pins['nativeSourcePins']:
   p=root/'app'/pin['path'];assert p.is_file()and not p.is_symlink()and p.stat().st_size==pin['bytes']and sha(p)==pin['sha256']
  front=json.loads((CONTROL/'frontend-pins.json').read_text());packages.BACKEND.update(front['backend']);packages.FRONTENDS=front['frontends']
  receipt=packages.verify_frontend(root/'normal.tar.gz','normal',root/'frontend');save(root/'evidence','exact-frontend.json',receipt)
  run([sys.executable,'-B',str(CONTROL/'fetch-redis-dependencies.py'),str(root/'redis-packages')],240)
  redis=root/'redis';redis.mkdir(mode=0o755);(redis/'lib').mkdir(mode=0o755)
  for pin in json.loads((CONTROL/'redis-abi-inputs.json').read_text())['files']:
   p=redis/pin['destination']
   if pin['sourceKind']=='EXACT_RETAINED_IMAGE':docker(['cp',name+':/'+pin['imagePath'],str(p)])
   else:shutil.copyfile(root/'redis-packages/mounts'/pin['packageFile'],p)
   assert p.is_file()and not p.is_symlink()and p.stat().st_size==pin['bytes']and sha(p)==pin['sha256'];p.chmod(0o555)
  freeze(redis)
  x=inspect(name);assert x['State']['Pid']==0 and x['State']['Status']=='created'
  save(root/'evidence','prepared-runtime.json',{'schema':'v126-prepared-genuine-native-runtime-v1',
   'source':SOURCE,'image':IMAGE,'retainedZipSHA256':ZIP_SHA,'retainedZipBytes':ZIP_BYTES,
   'nativePinsVerified':len(pins['nativeSourcePins']),'frontend':receipt,'nodeVersion':'22.23.2',
   'nodeSHA256':sha(root/'node'),'applicationStarted':False,'historyImported':False,
   'ownerCredentialsConfigured':False,'productionAccess':False,'wholeRowAccepted':False})
 except BaseException as error:
  failure=error
  save(root/'evidence','preparation-first-failure.json',{'schema':'v126-native-preparation-first-failure-v1',
   'errorClass':type(error).__name__,'message':str(error)[:1000],
   'diagnostic':getattr(error,'diagnostic',None),'applicationStarted':False})
  raise
 finally:
  if carrier:
   try:
    x=inspect(name);assert x['Image']==IMAGE and x['Config']['Labels'].get('empireai.v126.native.carrier')==name
    docker(['rm','--force',name]);assert subprocess.run(['docker','inspect',name],capture_output=True,timeout=10).returncode!=0
    save(root/'evidence','carrier-termination.json',{'name':name,'absent':True,'carrierNeverStarted':x['State']['Pid']==0 and x['State']['Status']=='created'})
   except BaseException as error:
    save(root/'evidence','carrier-termination-failure.json',{'errorClass':type(error).__name__,
     'message':str(error)[:1000],'diagnostic':getattr(error,'diagnostic',None),'earliestFailurePreserved':failure is not None})
    if failure is None:raise
if __name__=='__main__':main()
