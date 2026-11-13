#!/usr/bin/env python3
"""Start exact native runtime privately, no external ingress/egress.

Only after root admits configured owner bootstrap, exact authority and reservation.
Arguments: runtime, private config directory, name, independently read source-manifest
SHA256, independently read prepared-runtime receipt SHA256.
The provider timeout remains the independent outer stop. No public port is created.
"""
import hashlib,json,os,pathlib,re,subprocess,sys
CONTROL=pathlib.Path(__file__).resolve().parent
IMAGE='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
def docker(args):
 p=subprocess.run(['docker']+args,stdin=subprocess.DEVNULL,capture_output=True,timeout=30)
 assert len(p.stdout)+len(p.stderr)<=1048576
 if p.returncode:
  error=RuntimeError('DOCKER_OPERATION_FAILED_'+str(p.returncode))
  error.diagnostic={'argv':['docker']+args,'exitCode':p.returncode,'stderr':p.stderr.decode(errors='replace')[:8192]}
  raise error
 return p.stdout
def main():
 assert len(sys.argv)==6
 root=pathlib.Path(sys.argv[1]);private=pathlib.Path(sys.argv[2]);name=sys.argv[3]
 source_sha,prepared_sha=sys.argv[4:]
 assert re.fullmatch('[a-f0-9]{64}',source_sha)and re.fullmatch('[a-f0-9]{64}',prepared_sha)
 assert re.fullmatch(r'work8-v126-native-[a-z0-9-]{1,60}',name)
 for p in [root,private,CONTROL]:assert p.is_absolute()and p.resolve(strict=True)==p and p.is_dir()and not p.is_symlink()and ','not in str(p)
 manifest=(CONTROL/'source-manifest.json').read_bytes();assert hashlib.sha256(manifest).hexdigest()==source_sha
 for pin in json.loads(manifest)['files']:
  assert pathlib.Path(pin['path']).name==pin['path']
  p=CONTROL/pin['path'];assert p.is_file()and not p.is_symlink()
  b=p.read_bytes();assert len(b)==pin['bytes']and hashlib.sha256(b).hexdigest()==pin['sha256']
 prepared_bytes=(root/'evidence/prepared-runtime.json').read_bytes();assert hashlib.sha256(prepared_bytes).hexdigest()==prepared_sha
 prepared=json.loads(prepared_bytes)
 assert prepared['image']==IMAGE and prepared['applicationStarted']is False and prepared['historyImported']is False
 for n in ['native-bootstrap.json','owner-policy.json','connector-policy.json']:
  p=private/n;s=p.lstat();assert p.is_file()and not p.is_symlink()and s.st_nlink==1 and s.st_size<4096 and s.st_uid==0 and s.st_mode&0o777==0o400
 assert subprocess.run(['docker','inspect',name],capture_output=True,timeout=10).returncode!=0
 for n in ['state','private-output','runtime-output']:
  p=root/n;assert not p.exists();p.mkdir(mode=0o700)
 label='empireai.v126.native='+name
 build=json.loads((CONTROL/'connector-build-manifest.json').read_text())
 assert {p['destination']for p in build['backendOverlays']}=={
  'backend/dist/runtime/commerce-runtime/governed/runtime.js',
  'backend/dist/runtime/commerce-runtime/governed/runtime.js.map',
  'backend/dist/runtime/commerce-runtime/governed/work8-connector-source.js',
  'backend/dist/runtime/commerce-runtime/governed/work8-connector-source.js.map'}
 assert (root/'evidence/connector-runtime-prepared.json').is_file()
 binds={root/'connector-frontend':'/frontend',root/'redis':'/redis',CONTROL:'/control',private:'/private',
  root/'app':'/retained-app',root/'connector-inputs':'/connector-inputs'}
 for pin in build['backendOverlays']:
  assert pathlib.Path(pin['sourceFile']).name==pin['sourceFile']
  src=CONTROL/pin['sourceFile'];b=src.read_bytes()
  assert len(b)==pin['bytes']and hashlib.sha256(b).hexdigest()==pin['sha256']
  binds[src]='/app/'+pin['destination']
 argv=['create','--name',name,'--label',label,'--pull','never','--network','none','--user','0:0',
  '--cap-drop','ALL','--security-opt','no-new-privileges','--read-only','--memory','2147483648',
  '--memory-swap','2147483648','--cpus','2','--pids-limit','128','--ipc','private',
  '--restart','no','--ulimit','core=0:0','--ulimit','fsize=33554432:33554432',
  '--log-driver','none','--entrypoint','/usr/local/bin/node']
 for src,dst in binds.items():argv+=['--mount','type=bind,src='+str(src)+',dst='+dst+',readonly']
 writable={'state':'/state','runtime-output':'/evidence','private-output':'/private-output'}
 for n,dst in writable.items():argv+=['--mount','type=bind,src='+str(root/n)+',dst='+dst]
 argv+=['--tmpfs','/tmp:rw,noexec,nosuid,nodev,size=134217728,mode=1777',
  '--tmpfs','/frontend/app/.next/cache:rw,noexec,nosuid,nodev,size=67108864,mode=0700',
  IMAGE,'--max-old-space-size=128','/control/fresh-supervisor.mjs']
 created=False
 try:
  docker(argv);created=True
  x=json.loads(docker(['inspect',name]))[0];h=x['HostConfig']
  assert x['Image']==IMAGE and x['State']['Status']=='created'and x['State']['Pid']==0
  assert h['NetworkMode']=='none'and h['ReadonlyRootfs']and h['CapDrop']==['ALL']and not h['Privileged']and not h['PortBindings']
  assert h['Memory']==h['MemorySwap']==2147483648 and h['NanoCpus']==2000000000 and h['PidsLimit']==128
  assert h['SecurityOpt']==['no-new-privileges']and h['RestartPolicy']['Name']=='no'
  expected_mounts={dst:(str(src),False)for src,dst in binds.items()}
  expected_mounts.update({dst:(str(root/n),True)for n,dst in writable.items()})
  assert {m['Destination']:(m['Source'],m['RW'])for m in x['Mounts']if m['Type']=='bind'}==expected_mounts
  assert all(m['Type']in ['bind','tmpfs']for m in x['Mounts'])
  assert not any(m['Source']==str(root/'evidence')for m in x['Mounts']if m['Type']=='bind')
  with(root/'evidence/private-container-admission.json').open('x')as f:json.dump(x,f,indent=2)
  docker(['start',name]);x=json.loads(docker(['inspect',name]))[0]
  assert x['State']['Running']and x['Image']==IMAGE
  print(json.dumps({'schema':'v126-private-native-started-v1','name':name,'containerId':x['Id'],
   'image':IMAGE,'network':'none','publicPorts':[],'ownerAuthenticated':False,'ownerSessionCreated':False,
   'sourceManifestSHA256':source_sha,'preparedReceiptSHA256':prepared_sha,
   'wholeRowAccepted':False,'providerTimeoutRequired':True}))
 except BaseException as error:
  with(root/'evidence/private-launch-first-failure.json').open('x')as f:json.dump({'errorClass':type(error).__name__,
   'message':str(error)[:1000],'diagnostic':getattr(error,'diagnostic',None)},f,indent=2)
  if created:
   try:
    x=json.loads(docker(['inspect',name]))[0];assert x['Image']==IMAGE and x['Config']['Labels'].get('empireai.v126.native')==name
    docker(['rm','--force',name])
   except BaseException as cleanup_error:
    with(root/'evidence/private-launch-cleanup-failure.json').open('x')as f:json.dump({'errorClass':type(cleanup_error).__name__,'earliestFailurePreserved':True},f)
  raise
if __name__=='__main__':main()
