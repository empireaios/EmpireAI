#!/usr/bin/env python3
"""Single-attempt GitHub host adapter. Application acceptance is external only.

Provider credentials are used only by identity/review methods and are excluded
from every build, Docker, diagnostic and native subprocess environment.
"""
import argparse,ast,base64,datetime,hashlib,importlib.util,io,json,os,pathlib,re,secrets,shutil,stat,subprocess,sys,tarfile,time,urllib.error,urllib.parse,urllib.request
sys.dont_write_bytecode=True
from github_contract import *

HERE=pathlib.Path(__file__).resolve().parent
FOUNDATION=HERE.parent/'foundation'
sys.path.insert(0,str(FOUNDATION/'runtime'))
from runtime_common import atomic,bounded_process,Refusal as RuntimeRefusal
NODE_SHA='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
CONTROLLER_SHA='daa27901f6f19e62c1f2069c7843cbc2806c9b6e77b050082e7e38507b214e04'
DRIVER_SHA='49d50e3d985e0a544780422f8ad56c9a10311d835bbea667f8c384ccf9d9e480'
REVIEW_REF='work8/v65-review-20261103'
LAUNCH_REF='refs/heads/work8/v65-a5-20261103'
ENV_KEYS=('GITHUB_ACTIONS','GITHUB_REPOSITORY','GITHUB_REPOSITORY_ID','GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT','GITHUB_SHA','GITHUB_JOB','RUNNER_OS','RUNNER_ARCH')

def load_module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def clean_env(root):
 e={k:os.environ[k] for k in ENV_KEYS if k in os.environ}
 e.update(PATH=str(root/'bin')+':/usr/sbin:/usr/bin:/sbin:/bin',PYTHONDONTWRITEBYTECODE='1',LANG='C.UTF-8')
 if pathlib.Path('/run/docker.sock').exists():e['DOCKER_HOST']='unix:///run/docker.sock'
 return e

def exact_capabilities(observed):
 return isinstance(observed,list) and all(isinstance(cap,str) for cap in observed) and sorted(cap.removeprefix('CAP_') for cap in observed)==sorted(CAPABILITIES)

def public_error_classes(data):
 lowered=data.lower();matches=[]
 patterns={'REGISTRY_RATE_LIMIT':(b'toomanyrequests',b'too many requests',b'429 too many'),
 'REGISTRY_AUTHORIZATION_REFUSED':(b'authentication required',b'unauthorized',b'denied: requested access'),
 'REGISTRY_MANIFEST_UNAVAILABLE':(b'manifest unknown',b'no matching manifest',b'manifest not found'),
 'NETWORK_TIMEOUT':(b'i/o timeout',b'context deadline exceeded',b'tls handshake timeout',b'client.timeout exceeded'),
 'DNS_RESOLUTION_FAILED':(b'no such host',b'temporary failure in name resolution'),
 'NETWORK_CONNECTION_FAILURE':(b'connection refused',b'connection reset'),
 'ENOSPC':(b'no space left on device',),'EACCES':(b'permission denied',),'EPERM':(b'operation not permitted',),'ENOMEM':(b'cannot allocate memory',b'out of memory'),
 'CRITICAL_IMAGE_HASH_MISMATCH':(b'critical_image_hash_mismatch',),'PROTECTED_IMAGE_MEMBER_REQUIRED':(b'protected_image_member_required',),'RETAINED_SQLJS_SMOKE_FAILED':(b'retained_sqljs_smoke_failed',)}
 for name,tokens in patterns.items():
  if any(token in lowered for token in tokens):matches.append(name)
 return matches

def command_identity(args):
 executable=pathlib.Path(args[0]).name;kind=executable.upper().replace('-','_');result={'executable':executable}
 if executable=='docker':
  if len(args)>1 and args[1] in ('info','inspect','pull','load','run','rm','stop','ps','image','network'):
   kind='DOCKER_'+args[1].upper()
   if args[1] in ('image','network') and len(args)>2 and args[2] in ('inspect','create','rm','ls'):kind+='_'+args[2].upper()
  if args[1]=='pull':
   for role,pin in DEPENDENCY_IMAGES.items():
    if pin in args:result['dependencyRole']=role;result['immutableReference']=pin
  if '/qualification/native-probe.cjs' in args:kind='DOCKER_NATIVE_BOUNDARY_PROBE'
  elif '/examination/packaging-smoke.mjs' in args:kind='DOCKER_SQLJS_PACKAGING_SMOKE'
  elif '-e' in args and any(x.startswith('const fs=require') for x in args):kind='DOCKER_CRITICAL_IMAGE_FILE_READBACK'
 elif executable.startswith('python') and any(pathlib.Path(x).name=='test_command_diagnostics.py' for x in args):kind='PYTHON_SEVEN_FIRST_ERROR_CONTROLS'
 result['commandClass']=kind;return result

def run(root,args,seconds=60,maximum=2*1024*1024,expected=(0,),env=None):
 try:result=bounded_process(args,clean_env(root) if env is None else env,seconds,maximum)
 except (subprocess.TimeoutExpired,RuntimeRefusal,OSError) as exc:
  code='COMMAND_DEADLINE' if isinstance(exc,subprocess.TimeoutExpired) else 'COMMAND_OUTPUT_BOUND' if isinstance(exc,RuntimeRefusal) and str(exc)=='COMMAND_OUTPUT_BOUND' else 'COMMAND_OS_ERROR'
  p=root/'runtime-evidence/first-runtime-command-failure.json'
  if not p.exists():atomic(p,{'schema':'work8-v65-runtime-command-failure-v1',**command_identity(args),'code':code,'errno':getattr(exc,'errno',None),'maximumSeconds':seconds,'maximumOutputBytes':maximum,'rawOutputRetained':False,'partialOutputHashesUnavailable':True},exclusive=True)
  raise Refusal(code) from None
 if result.returncode not in expected:
  p=root/'runtime-evidence/first-runtime-command-failure.json'
  classes=public_error_classes(result.stdout+result.stderr)
  if not p.exists():atomic(p,{'schema':'work8-v65-runtime-command-failure-v1',**command_identity(args),'exitCode':result.returncode,'stdoutBytes':len(result.stdout),'stderrBytes':len(result.stderr),'stdoutSHA256':hashlib.sha256(result.stdout).hexdigest(),'stderrSHA256':hashlib.sha256(result.stderr).hexdigest(),'publicErrorClasses':classes,'classificationLimitation':None if classes else 'UNCLASSIFIED_OUTPUT_RETAINED_AS_HASHES_ONLY','rawOutputRetained':False},exclusive=True)
  raise Refusal('RUNTIME_COMMAND_FAILED')
 return result.stdout

class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):raise Refusal('GITHUB_API_REDIRECT_REFUSED')

def api(path,allow_missing=False):
 require(path.startswith('/repos/'+REPOSITORY+'/') or path=='/repos/'+REPOSITORY,'API_SCOPE_REFUSED')
 token=os.environ.get('GH_TOKEN');require(token and '\n' not in token,'SCOPED_READ_TOKEN_REQUIRED')
 request=urllib.request.Request('https://api.github.com'+path,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'EmpireAI-V65-read-only-review'})
 try:
  with urllib.request.build_opener(NoRedirect).open(request,timeout=30) as response:
   data=response.read(4*1024*1024+1);require(len(data)<=4*1024*1024,'API_RESPONSE_BOUND');return json.loads(data)
 except urllib.error.HTTPError as exc:
  if exc.code==404 and allow_missing:return None
  raise Refusal('GITHUB_READ_API_HTTP_'+str(exc.code)) from None

def identity(root,job_name):
 require(os.getuid()==os.geteuid()==os.getgid()==os.getegid()==1001,'ORIGINAL_HOST_PRINCIPAL_REQUIRED')
 require(os.environ.get('GITHUB_RUN_ATTEMPT')=='1' and os.environ.get('GITHUB_REF')==LAUNCH_REF,'EXACT_BRANCH_FIRST_ATTEMPT_REQUIRED')
 require(os.environ.get('GITHUB_REPOSITORY')==REPOSITORY and os.environ.get('GITHUB_REPOSITORY_ID')==REPOSITORY_ID,'ACTUAL_REPOSITORY_REQUIRED')
 require(not root.exists(),'FRESH_EXECUTION_ROOT_REQUIRED');root.mkdir(mode=0o700,parents=True)
 repo=api('/repos/'+REPOSITORY);require(repo['id']==int(REPOSITORY_ID) and repo['visibility']=='public' and not repo['archived'],'PUBLIC_ACTIVE_REPOSITORY_REQUIRED')
 run_id=os.environ['GITHUB_RUN_ID'];r=api('/repos/'+REPOSITORY+'/actions/runs/'+run_id)
 require(str(r['id'])==run_id and r['run_attempt']==1 and r['head_sha']==os.environ['GITHUB_SHA'] and r['event']=='create' and r['status']=='in_progress','CURRENT_FIRST_RUN_SERVICE_BINDING')
 jobs=api('/repos/'+REPOSITORY+'/actions/runs/'+run_id+'/attempts/1/jobs?per_page=100');require(jobs['total_count']==1 and len(jobs['jobs'])==1,'ONE_JOB_REQUIRED');j=jobs['jobs'][0]
 require(j['name']==job_name and j['status']=='in_progress' and 'ubuntu-24.04' in j['labels'] and 'self-hosted' not in j['labels'],'CURRENT_STANDARD_HOSTED_JOB_REQUIRED')
 started=datetime.datetime.fromisoformat(j['started_at'].replace('Z','+00:00')).timestamp()
 require(started<=time.time() and time.time()-started<900,'FRESH_JOB_START_REQUIRED')
 image=os.environ.get('ImageVersion');require(image and os.environ.get('ImageOS')=='ubuntu24','ACTUAL_UBUNTU24_IMAGE_REQUIRED')
 disk=shutil.disk_usage(root);memory=int(next(x.split()[1] for x in pathlib.Path('/proc/meminfo').read_text().splitlines() if x.startswith('MemTotal:')))*1024
 result={'schema':'work8-v65-current-github-identity-v1','provider':'github-actions','repository':REPOSITORY,'repositoryId':REPOSITORY_ID,'runId':run_id,'runAttempt':1,'jobId':j['id'],'jobKey':os.environ['GITHUB_JOB'],'workflowCommit':r['head_sha'],'sessionId':'github-actions:'+run_id+':1:'+str(j['id']),'jobStartedAtEpoch':started,'timeoutSeconds':18000,'expiresAtEpoch':started+18000,'runnerImageVersion':image,'runnerName':j.get('runner_name'),'runnerId':j.get('runner_id'),'runnerGroupName':j.get('runner_group_name'),'labels':j['labels'],'hostUid':os.getuid(),'hostGid':os.getgid(),'architecture':'amd64','hostArtifactEgress':'github-provider-endpoints','nativeNetworkPolicy':'docker-internal-no-published-ports','ports':[],'productionMounts':[],'observedCapacity':{'cpus':os.cpu_count(),'memoryBytes':memory,'diskTotalBytes':disk.total,'diskFreeBytes':disk.free},'serviceRunSHA256':hashlib.sha256(json.dumps(r,sort_keys=True).encode()).hexdigest(),'serviceJobSHA256':hashlib.sha256(json.dumps(j,sort_keys=True).encode()).hexdigest(),'observedAtEpoch':time.time(),'applicationStarted':False}
 atomic(root/'runner-identity.json',result,exclusive=True)
 return {'status':'ACTUAL_RUNNER_IDENTITY_RECORDED_NOT_LAUNCH_READY','sessionId':result['sessionId'],'observedCapacity':result['observedCapacity']}

def replace_assignments(path,replacements):
 text=path.read_text();lines=text.splitlines(keepends=True);edits=[]
 for node in ast.parse(text).body:
  if isinstance(node,ast.Assign) and len(node.targets)==1 and isinstance(node.targets[0],ast.Name) and node.targets[0].id in replacements:
   name=node.targets[0].id;edits.append((node.lineno-1,node.end_lineno,name+' = '+repr(replacements[name])+'\n'))
 require(len(edits)==len(replacements),'EXACT_PACKAGE_ASSIGNMENTS_REQUIRED')
 for start,end,new in sorted(edits,reverse=True):lines[start:end]=[new]
 path.write_text(''.join(lines))

def fetch_driver(root):
 target=root/'native-transition-driver';target.mkdir(mode=0o700)
 sources=json.loads((FOUNDATION/'driver/sources.json').read_text())
 for row in sources:
  require(row['name'] in ('playwright','playwright-core') and row['source']=='https://registry.npmjs.org/'+row['name']+'/-/'+row['name']+'-1.62.1.tgz','EXACT_DRIVER_SOURCE_REQUIRED')
  with urllib.request.build_opener(NoRedirect).open(row['source'],timeout=30) as response:data=response.read(row['bytes']+1)
  require(len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256'],'DRIVER_ARCHIVE_IDENTITY')
  dest=target/'node_modules'/row['name'];dest.mkdir(mode=0o700,parents=True)
  with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as t:
   seen=set()
   for member in t:
    name=relative_name(member.name);require(name.startswith('package/'),'DRIVER_ARCHIVE_SCOPE');relative=name[len('package/'):]
    if not relative:continue
    relative_name(relative);require(relative not in seen,'DRIVER_ARCHIVE_DUPLICATE');seen.add(relative);p=dest/relative
    if member.isdir():p.mkdir(parents=True,exist_ok=True);continue
    require(member.isfile(),'DRIVER_LINK_REFUSED');p.parent.mkdir(parents=True,exist_ok=True)
    with p.open('xb') as out:shutil.copyfileobj(t.extractfile(member),out)
    p.chmod(0o755 if member.mode&0o111 else 0o644)
 shutil.copyfile(FOUNDATION/'driver/package.json',target/'package.json');shutil.copyfile(FOUNDATION/'driver/controller-manifest.json',target/'controller-manifest.json')
 verify_manifest(target,target/'controller-manifest.json',DRIVER_SHA)

def controller_manifest(path):
 files=[{'path':p.relative_to(path).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(path.rglob('*')) if p.is_file() and p.name!='controller-manifest.json']
 atomic(path/'controller-manifest.json',{'schema':'work8-v65-execution-controller-manifest-v1','historicalControllerManifestSHA256':CONTROLLER_SHA,'files':files})
 return sha(path/'controller-manifest.json')

def prepare(root):
 require(root.resolve()==root and stat.S_IMODE(root.stat().st_mode)==0o700 and root.stat().st_uid==1001,'PRIVATE_EXECUTION_ROOT_REQUIRED')
 packages=json.loads((root/'v65-packages.json').read_text());require(set(packages['frontends'])=={'normal','recovery'},'BOTH_FRONTENDS_REQUIRED')
 for role,pin in [('backend',packages['backend']),*packages['frontends'].items()]:
  require({k:pin[k] for k in ('commit','tree')}==SOURCES[role],'EXACT_SOURCE_PINS_REQUIRED');regular(root/'artifacts'/relative_name(pin['file']));require(sha(root/'artifacts'/pin['file'])==pin['sha256'],'CANDIDATE_ARCHIVE_HASH')
 source=FOUNDATION/'controller/scripts/work8/native-transition';verify_manifest(source,source/'controller-manifest.json',CONTROLLER_SHA)
 destination=root/'controller';require(not destination.exists(),'CONTROLLER_ASSEMBLY_ALREADY_ATTEMPTED');shutil.copytree(FOUNDATION/'controller',destination)
 script=destination/'scripts/work8/native-transition';replace_assignments(script/'current_packages.py',{'BACKEND':packages['backend'],'FRONTENDS':packages['frontends']})
 p=script/'current_packages.py';p.write_text(p.read_text().replace('"packageRebuilt": False','"packageRebuilt": True').replace('Verify/import the existing V55 distributions. Never build or publish packages.','Verify/import independently admitted V65 source-equivalent distributions.'))
 p=script/'examine-v26.py';text=p.read_text();old="assert underlying_contract==accepted_private_contract['backend'],'ACCEPTED_PRIVATE_BACKEND_CONTRACT_CHANGED'";require(text.count(old)==1,'EXACT_PRIVATE_CONTRACT_REBINDING_REQUIRED')
 text=text.replace(old,"assert underlying_contract=={**accepted_private_contract['backend'],'image':current_packages.BACKEND['image']},'ACCEPTED_PRIVATE_BACKEND_CONTRACT_CHANGED'")
 require(text.count("'packagesRebuilt':False")==1,'EXACT_REBUILT_RECEIPT_REQUIRED');p.write_text(text.replace("'packagesRebuilt':False","'packagesRebuilt':True"))
 shutil.copyfile(HERE/'github_contract.py',script/'execution_contract.py')
 for p in script.glob('*.py'):compile(p.read_bytes(),str(p),'exec')
 controller_sha=controller_manifest(script);verify_manifest(script,script/'controller-manifest.json',controller_sha)
 fetch_driver(root)
 shutil.copytree(FOUNDATION/'runtime',root/'runtime')
 node=root/'bin/node';node.parent.mkdir(mode=0o755)
 with tarfile.open(root/'artifacts'/packages['frontends']['normal']['file'],'r:gz') as t:
  m=t.getmember('runtime/bin/node');require(m.isfile() and m.size==124836408,'HOST_NODE_MEMBER_IDENTITY')
  with node.open('xb') as out:shutil.copyfileobj(t.extractfile(m),out)
 node.chmod(0o755);require(sha(node)==NODE_SHA,'HOST_NODE_HASH');require(run(root,[str(node),'--version']).strip()==b'v22.23.2','HOST_NODE_VERSION')
 cp=load_module('v65_current_packages',script/'current_packages.py')
 observations={'backend':cp.verify_backend(root/'artifacts'/cp.BACKEND['file']),'frontends':{role:cp.verify_frontend(root/'artifacts'/pin['file'],role) for role,pin in cp.FRONTENDS.items()}}
 inventory={p.name for p in (root/'artifacts').iterdir()};require(inventory=={p['file'] for p in [cp.BACKEND,*cp.FRONTENDS.values()]},'COMPLETE_EXCLUSIVE_PACKAGE_INVENTORY')
 atomic(root/'package-delivery.json',{'schema':'work8-v65-runner-local-package-qualification-v1','status':'PASS_COMPLETE_LOCAL_SHA256_PENDING_INDEPENDENT_EQUIVALENCE','delivery':'source-reconstruction-on-this-runner','packageManifestSHA256':sha(root/'v65-packages.json'),'observations':observations,'applicationStarted':False,'wholeRowsAccepted':[]},exclusive=True)
 atomic(root/'source-identities.json',{'schema':'work8-v65-reconstructed-source-identities-v1','components':SOURCES,'historicalControllerManifestSHA256':CONTROLLER_SHA,'controllerManifestSHA256':controller_sha,'packageManifestSHA256':sha(root/'v65-packages.json'),'historicalPackageBytesClaimed':False,'independentlyAdmitted':False},exclusive=True)
 return {'status':'COMPLETE_CURRENT_PACKAGES_VERIFIED_AWAITING_EXTERNAL_EQUIVALENCE','controllerManifestSHA256':controller_sha,'packageManifestSHA256':sha(root/'v65-packages.json')}

def qualify(root,authority_file):
 identity=json.loads((root/'runner-identity.json').read_text());packages=json.loads((root/'v65-packages.json').read_text());backend=packages['backend'];name='work8-v65-a5-'+identity['runId'];socket=pathlib.Path('/run/docker.sock');st=socket.lstat()
 require(socket.resolve()==socket and stat.S_ISSOCK(st.st_mode) and st.st_uid==0 and stat.S_IMODE(st.st_mode)==0o660 and (st.st_gid in os.getgroups() or st.st_gid==os.getgid()),'ROOT_OWNED_ACCESSIBLE_DOCKER_SOCKET_REQUIRED')
 info=json.loads(run(root,['docker','info','--format','{{json .}}'],20));require(info['CgroupVersion']=='2' and 'seccomp' in str(info['SecurityOptions']),'CGROUP2_SECCOMP_REQUIRED')
 require(info['NCPU']>=4 and info['MemTotal']>=12*1024**3,'NATIVE_CAPACITY_BELOW_REVIEWED_FLOOR')
 require(shutil.disk_usage(root).free>=6*1024**3,'NATIVE_FREE_STORAGE_BELOW_REVIEWED_FLOOR')
 image=json.loads(run(root,['docker','image','inspect',backend['image']],20))[0];require(image['Id']==backend['image'],'BUILT_IMAGE_ID_REQUIRED')
 deps={}
 for role,pin in DEPENDENCY_IMAGES.items():
  run(root,['docker','pull','--platform','linux/amd64',pin],240)
  d=json.loads(run(root,['docker','image','inspect',pin],20))[0];require(d['Os']=='linux' and d['Architecture']=='amd64' and any(x.endswith('@'+pin.split('@')[1]) for x in d.get('RepoDigests',[])),'DEPENDENCY_DIGEST_REQUIRED');deps[role]={'reference':pin,'imageId':d['Id'],'repoDigests':d['RepoDigests'],'bytes':d['Size']}
 expanded_frontends=0
 for pin in packages['frontends'].values():
  with tarfile.open(root/'artifacts'/pin['file'],'r:gz') as t:expanded_frontends+=sum(m.size for m in t if m.isfile())
 # Two native phases may retain both extracted copies until scoped cleanup;
 # native output maxima unchanged:128MiB preflight+1920MiB full. Reserve1GiB
 # for isolated stores and1GiB host margin beyond measured extraction bytes.
 required_free=max(6*1024**3,2*expanded_frontends+(128+1920)*1024**2+2*1024**3)
 require(shutil.disk_usage(root).free>=required_free,'POST_PULL_NATIVE_STORAGE_RESERVE_REQUIRED')
 script=root/'controller/scripts/work8/native-transition'
 expected={}
 overlays=json.loads((script/'startup-overlays.json').read_text())
 for row in overlays['files']:expected[row['target']]={'sha256':row['originalSha256'],'bytes':row['originalBytes']}
 live=json.loads((script/'live-brain-overlay.json').read_text());expected[live['originalPath']]={'sha256':live['originalSha256'],'bytes':live['originalBytes']}
 stores=json.loads((script/'store-applicability.json').read_text())
 for row in stores['sourceEvidence'].values():
  prior=expected.get(row['imagePath'],{});require(not prior or prior['sha256']==row['sha256'],'CRITICAL_SOURCE_PINS_CONFLICT');expected[row['imagePath']]={**prior,'sha256':row['sha256']}
 expected['/native/runtime-writer-isolation.so']={'sha256':'5048f19ec38c708dd1b139f7a3f60cb8eb5e9146cd4fdb6e978caffbcac87a1b','bytes':15472}
 expected['/app/deployment/runtime-membership-controller.cjs']={'sha256':overlays['originalMembershipControllerSha256']}
 reader="const fs=require('fs'),c=require('crypto');const spec=JSON.parse(process.argv[1]),out={};for(const [p,pin]of Object.entries(spec)){const s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.uid!==0||(s.mode&0o022))throw Error('PROTECTED_IMAGE_MEMBER_REQUIRED');const b=fs.readFileSync(p);const h=c.createHash('sha256').update(b).digest('hex');if(h!==pin.sha256||('bytes'in pin&&b.length!==pin.bytes))throw Error('CRITICAL_IMAGE_HASH_MISMATCH');out[p]={sha256:h,bytes:b.length,uid:s.uid,mode:s.mode&0o777};}console.log(JSON.stringify({status:'PASS_EXACT_CRITICAL_IMAGE_FILES',files:out,applicationStarted:false}));"
 safe_options=['--rm','--label','work8.native='+name,'--pull','never','--network','none','--read-only','--user','65534:65534','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','512m','--cpus','0.5','--pids-limit','32']
 critical=json.loads(run(root,['docker','run',*safe_options,'--entrypoint','node',backend['image'],'-e',reader,json.dumps(expected,separators=(',',':'))],30,131072));require(critical['status']=='PASS_EXACT_CRITICAL_IMAGE_FILES' and set(critical['files'])==set(expected),'ACTUAL_CRITICAL_IMAGE_READBACK_REQUIRED')
 atomic(root/'critical-image-readback.json',critical,exclusive=True)
 smoke=json.loads(run(root,['docker','run',*safe_options,'--mount','type=bind,src='+str(script)+',dst=/examination,readonly','--entrypoint','timeout',backend['image'],'--signal=KILL','25s','node','/examination/packaging-smoke.mjs','/app/backend/node_modules/sql.js','-'],30,16384))
 require(smoke['status']=='PASS' and smoke['applicationAcceptance'] is False and smoke['databaseBytesRetained'] is False,'ACTUAL_IMAGE_SQLJS_PACKAGING_SMOKE_REQUIRED');atomic(root/'sqljs-packaging-smoke.json',smoke,exclusive=True)
 private=root/'qualification-private';private.mkdir(mode=0o700);control=private/'control';control.mkdir(mode=0o700);nonce=secrets.token_hex(32);atomic(control/'qualification-request.json',{'schema':'work8-v62-private-exchange-probe-v1','nonce':nonce},exclusive=True)
 cname=name+'-qualification';network=name+'-qualification-network';created=False
 try:
  options=['--pull','never','--network','none','--read-only','--user','0:0','--cap-drop','ALL','--memory','256m','--cpus','1','--pids-limit','32','--security-opt','no-new-privileges']
  for cap in CAPABILITIES:options+=['--cap-add',cap]
  args=['docker','run','--name',cname,'--label','work8.native='+name,*options,'--mount','type=bind,src='+str(root/'runtime')+',dst=/qualification,readonly','--mount','type=bind,src='+str(control)+',dst=/control','--entrypoint','node',backend['image'],'/qualification/native-probe.cjs']
  raw=run(root,args,30,16384,expected=(0,1));rows=[json.loads(x) for x in raw.decode().splitlines() if x.startswith('{')];require(len(rows)==1,'NATIVE_CAPABILITY_RECEIPT_REQUIRED');row=rows[0];atomic(root/'runtime-evidence/native-capability-observation.json',row,exclusive=True)
  allowed_probe_steps={'OPERATOR_IDENTITY','NATIVE_LIBRARY_IDENTITY','READONLY_ROOT','NATIVE_LIBRARY_ADMISSION','WRITER_PROCESS_START','WRITER_IDENTITY_AND_DENIAL','CROSS_PRINCIPAL_PROC_ATTESTATION','THREAD_SYNCHRONIZED_FILTERS','PRIVATE_FILE_EXCHANGE'}
  failure='NATIVE_CAPABILITY_'+row['assertion'] if row.get('assertion') in allowed_probe_steps else 'NATIVE_CAPABILITY_PROBE_FAILED'
  require(row['status']=='PASS_NATIVE_CAPABILITY_ONLY',failure)
  response=json.loads((control/'qualification-response.json').read_text());require(response=={'schema':'work8-v62-private-exchange-response-v1','nonceSHA256':hashlib.sha256(nonce.encode()).hexdigest()},'PRIVATE_EXCHANGE_READBACK_FAILED')
  d=json.loads(run(root,['docker','inspect',cname],10))[0];h=d['HostConfig'];require(d['State']['ExitCode']==0 and h['ReadonlyRootfs'] and not h['Privileged'] and h['NetworkMode']=='none' and exact_capabilities(h['CapAdd']) and h['CapDrop']==['ALL'] and h['PidsLimit']==32 and h['Memory']==268435456 and not h['PortBindings'],'NATIVE_CONTAINER_CONFIG_CHANGED')
  require(d['Image']==backend['image'] and d['Config']['User']=='0:0' and not any(x.startswith(('GH_TOKEN=','GITHUB_TOKEN=','ACTIONS_RUNTIME_TOKEN=')) for x in d['Config']['Env']),'NATIVE_IDENTITY_OR_CREDENTIAL_EXCLUSION_FAILED')
  run(root,['docker','network','create','--internal','--label','work8.native='+name,network],15);created=True;net=json.loads(run(root,['docker','network','inspect',network],10))[0];require(net['Internal'] is True and net['Driver']=='bridge' and not net['Containers'],'INTERNAL_ISOLATED_NETWORK_REQUIRED')
  q={'schema':'work8-v65-native-qualification-v1','status':'PASS_CURRENT_EXECUTOR_NATIVE_PREREQUISITES','sessionId':identity['sessionId'],'criticalImageReadbackSHA256':sha(root/'critical-image-readback.json'),'sqlJsPackagingSmokeSHA256':sha(root/'sqljs-packaging-smoke.json'),'dockerSocketPath':str(socket),'dockerSocket':{'uid':st.st_uid,'gid':st.st_gid,'mode':stat.S_IMODE(st.st_mode),'dev':st.st_dev,'ino':st.st_ino},'dockerEngineId':info['ID'],'dockerInfo':{k:info.get(k) for k in ('ServerVersion','CgroupVersion','CgroupDriver','Driver','NCPU','MemTotal','SecurityOptions')},'storageCapacity':{'measuredFrontendLogicalBytes':expanded_frontends,'requiredRemainingBytes':required_free,'actualFreeBytes':shutil.disk_usage(root).free,'privateStoreReserveBytes':1024**3},'requiredCapabilities':CAPABILITIES,'seccompTSYNC':row['seccompTSYNC'],'crossPrincipalProcReadback':row['crossPrincipalProcReadback'],'readonlyRootVerified':row['readonlyRootVerified'],'privateFileExchangeVerified':True,'internalNetworkVerified':True,'noPublishedPortsVerified':True,'providerCredentialsExcluded':True,'dependencyImages':DEPENDENCY_IMAGES,'dependencyObservations':deps,'hostNodeVersion':'v22.23.2','hostNodeSHA256':NODE_SHA,'nativeObservation':row,'applicationStarted':False,'wholeRowsAccepted':[]}
 finally:
  run(root,['docker','rm','-fv',cname],15)
  if created:run(root,['docker','network','rm',network],15)
  # Probe only wrote fixed non-secret response, root-owned files chowned1001.
  shutil.rmtree(private)
 # Exercise the unchanged seven first-error controls on this exact copied controller.
 diagnostics=root/'diagnostic-controls';env=clean_env(root);env.update(WORK8_TEST_NODE=str(root/'bin/node'),WORK8_TEST_MEMBERSHIP=str(root/'runtime/runtime-membership-bootstrap.mjs'),WORK8_TEST_EVIDENCE=str(diagnostics))
 script=root/'controller/scripts/work8/native-transition';run(root,['/usr/bin/python3','-B',str(script/'test_command_diagnostics.py')],120,1024*1024,env=env)
 diagnostic=json.loads((diagnostics/'negative-control-result.json').read_text());require(diagnostic['status']=='PASS' and diagnostic['testsRun']==7 and diagnostic['testsPassed']==7,'SEVEN_FIRST_ERROR_CONTROLS_REQUIRED');q['diagnosticControlsSHA256']=sha(diagnostics/'negative-control-result.json')
 atomic(root/'native-qualification.json',q,exclusive=True)
 launch=json.loads(pathlib.Path(authority_file).read_text());require(launch['schema']=='work8-v65-reviewed-launch-plan-v1','REVIEWED_LAUNCH_PLAN_REQUIRED');launch['workflowCommit']=identity['workflowCommit'];atomic(root/'launch-contract.json',launch,exclusive=True)
 c={'schema':SCHEMA,'campaignId':name,'executor':identity,'authority':launch['authority'],'durationPlan':launch['durationPlan'],'dependencyImages':DEPENDENCY_IMAGES,'sources':SOURCES,'packageManifestSHA256':sha(root/'v65-packages.json'),'controllerManifestSHA256':sha(script/'controller-manifest.json'),'driverManifestSHA256':DRIVER_SHA,'sourceIdentitiesSHA256':sha(root/'source-identities.json'),'nativeQualificationSHA256':sha(root/'native-qualification.json'),'launchContractSHA256':sha(root/'launch-contract.json'),'packageDeliverySHA256':sha(root/'package-delivery.json')}
 validate_contract(c,time.time());atomic(root/'run-contract.json',c,exclusive=True)
 return {'status':'PACKAGE_AND_NATIVE_PREREQUISITES_OBSERVED_EXTERNAL_REVIEW_PENDING','applicationStarted':False,'bindings':package_bindings(c)}

def service_artifact(c,artifact_id,digest):
 require(re.fullmatch('[0-9]+',str(artifact_id)) is not None,'ARTIFACT_ID_REQUIRED')
 digest=digest.removeprefix('sha256:');require(digest_string(digest),'ARTIFACT_DIGEST_REQUIRED')
 a=api('/repos/'+REPOSITORY+'/actions/artifacts/'+str(artifact_id));require(a['id']==int(artifact_id) and not a['expired'] and a['workflow_run']['id']==int(c['executor']['runId']) and a['workflow_run']['head_sha']==c['executor']['workflowCommit'],'CURRENT_ARTIFACT_BINDING')
 require(a.get('digest')=='sha256:'+digest,'SERVICE_ARTIFACT_DIGEST_MISMATCH')
 created=datetime.datetime.fromisoformat(a['created_at'].replace('Z','+00:00')).timestamp();expiry=datetime.datetime.fromisoformat(a['expires_at'].replace('Z','+00:00')).timestamp();require(0<expiry-created<=7*86400+3600,'ARTIFACT_RETENTION_BOUND')
 listing=api('/repos/'+REPOSITORY+'/actions/runs/'+str(c['executor']['runId'])+'/artifacts?per_page=100');require(listing['total_count']==len(listing['artifacts'])<=4 and sum(x['size_in_bytes'] for x in listing['artifacts'])<=2*1024**3,'CUMULATIVE_ARTIFACT_EXPOSURE_BOUND')
 return {'id':a['id'],'name':a['name'],'sha256':digest,'bytes':a['size_in_bytes'],'createdAtUTC':a['created_at'],'expiresAtUTC':a['expires_at'],'cumulativeObjects':len(listing['artifacts']),'cumulativeServiceZipBytes':sum(x['size_in_bytes'] for x in listing['artifacts'])}

def await_review(root,stage,artifact_id,artifact_digest,max_seconds=1500):
 c=json.loads((root/'run-contract.json').read_text());validate_contract(c,time.time());artifact=service_artifact(c,artifact_id,artifact_digest)
 expected=package_bindings(c)
 if stage=='preflight':expected.update(runContractSHA256=sha(root/'run-contract.json'),runnerResultSHA256=sha(root/'evidence/preflight/runner-result.json'),artifactIndexSHA256=sha(root/'evidence/preflight/artifact-index.json'))
 destination=root/('source-review.json' if stage=='packages-and-executor' else 'preflight-review.json');require(not destination.exists(),'INDEPENDENT_ACK_ALREADY_COMMITTED')
 require(type(max_seconds) is int and 0<max_seconds<=1500,'EXTERNAL_REVIEW_TIME_BOUND');limit=max_seconds;start=time.monotonic();filename='v65-review/'+str(c['executor']['runId'])+'/'+stage+'.json'
 while time.monotonic()-start<limit:
  require_remaining_lifetime(c,'preflight' if stage=='packages-and-executor' else 'full',time.time())
  ref=api('/repos/'+REPOSITORY+'/git/ref/heads/'+REVIEW_REF,allow_missing=True)
  if ref:
   commit=ref['object']['sha'];require(re.fullmatch('[a-f0-9]{40}',commit) is not None and commit!=c['executor']['workflowCommit'],'DISTINCT_REVIEW_COMMIT_REQUIRED')
   ci=api('/repos/'+REPOSITORY+'/commits/'+commit+'?per_page=1')
   # API-linked GitHub identity, not arbitrary git author/email strings.
   require((ci.get('author') or {}).get('login')=='empireaios' and (ci.get('author') or {}).get('id')==295548100,'TRUSTED_EXTERNAL_REVIEW_AUTHOR_REQUIRED')
   file=api('/repos/'+REPOSITORY+'/contents/'+filename+'?ref='+commit,allow_missing=True)
   if file:
    require(file['type']=='file' and file['encoding']=='base64' and file['size']<=32768,'ACK_REGULAR_SIZE_BOUND');data=base64.b64decode(file['content'],validate=False);require(len(data)==file['size'],'ACK_COMPLETE_BYTES_REQUIRED');ack=json.loads(data)
    verify_ack(ack,c,stage,expected,time.time());require(ack['artifactId']==artifact['id'] and ack['artifactSHA256']==artifact['sha256'],'INDEPENDENT_ACK_CURRENT_ARTIFACT_REQUIRED')
    atomic(destination,ack,exclusive=True);atomic(root/('review-transport-'+stage+'.json'),{'schema':'work8-v65-external-review-transport-v1','reviewCommit':commit,'reviewAuthorLogin':'empireaios','reviewAuthorId':295548100,'ackSHA256':sha(destination),'artifact':artifact,'applicationAcceptance':False},exclusive=True)
    return {'status':'EXTERNAL_REVIEW_ACKNOWLEDGED','stage':stage,'ackSHA256':sha(destination),'applicationAcceptance':False}
  time.sleep(15)
 raise Refusal('INDEPENDENT_REVIEW_DEADLINE')

def native(root,stage):
 c=json.loads((root/'run-contract.json').read_text());validate_contract(c,time.time());require_remaining_lifetime(c,stage,time.time())
 receipt=root/('controller-supervisor-'+stage+'.json');attempt=root/('controller-supervisor-'+stage+'-attempt.json');require(not receipt.exists() and not attempt.exists(),'NATIVE_PHASE_ALREADY_ATTEMPTED')
 env=clean_env(root);env.update(WORK8_EXECUTION_ROOT=str(root),WORK8_EXECUTOR_ID=c['executor']['sessionId'],WORK8_RUN_CONTRACT_SHA256=sha(root/'run-contract.json'),WORK8_SOURCE_REVIEW_SHA256=sha(root/'source-review.json'))
 if stage=='full':env['WORK8_PREFLIGHT_REVIEW_SHA256']=sha(root/'preflight-review.json')
 # Gate again inside the child's immutable source before any subprocess. The
 # host only announces readiness after checking the external review receipts.
 verify_ack(json.loads((root/'source-review.json').read_text()),c,'packages-and-executor',package_bindings(c),time.time())
 if stage=='preflight':
  atomic(root/'launch-readiness.json',{'schema':'work8-v65-launch-readiness-v1','verdict':'A5 LAUNCH READY — PASS','scope':'Admitted packages and isolated executor; application assertions still require actual native preflight and examination','sessionId':c['executor']['sessionId'],'packageAndExecutorReviewSHA256':sha(root/'source-review.json'),'runContractSHA256':sha(root/'run-contract.json'),'applicationAcceptance':False},exclusive=True)
 atomic(attempt,{'schema':'work8-v65-native-attempt-v1','stage':stage,'sessionId':c['executor']['sessionId'],'startedAtEpoch':time.time()},exclusive=True)
 supervisor=load_module('v65_supervisor',root/'runtime/launch-controller.py')
 script=root/'controller/scripts/work8/native-transition/run-native-examination.py';observed=supervisor.supervise(['/usr/bin/python3','-B',str(script),'--preflight-v62-native-brain' if stage=='preflight' else '--examine-v62-native-brain'],env,900 if stage=='preflight' else 1500,600)
 result={'schema':'work8-v65-controller-supervisor-v1','phase':stage,'sessionId':c['executor']['sessionId'],'status':'CONTROLLER_EXITED_ZERO_REQUIRES_INDEPENDENT_REVIEW' if observed['controllerExitCode']==0 and not observed['firstSupervisorCause'] else 'FAIL_CLOSED','wholeRowsAccepted':[],**observed};atomic(receipt,result,exclusive=True)
 require(result['status']=='CONTROLLER_EXITED_ZERO_REQUIRES_INDEPENDENT_REVIEW','NATIVE_CONTROLLER_FIRST_FAILURE');return result

def exporter(root):
 module=load_module('v65_exporter',root/'runtime/export-evidence.py' if (root/'runtime/export-evidence.py').exists() else FOUNDATION/'runtime/export-evidence.py')
 # Explicit new provider receipts only; original secret scan, per-file,
 # logical2MiB and compressed512KiB bounds remain exactly unchanged.
 module.TOP_NAMES.update({'launch-readiness.json','runner-identity.json','artifact-service-packages.json','artifact-service-final.json','review-transport-packages-and-executor.json','review-transport-preflight.json'})
 return module

def review_export(root):
 e=exporter(root);dest=root/'review-exports/packages-and-executor';dest.mkdir(parents=True,mode=0o700)
 names=['runner-identity.json','v65-packages.json','source-identities.json','package-delivery.json','native-qualification.json','run-contract.json','launch-contract.json','package-source-scan.json','artifact-service-packages.json','critical-image-readback.json','sqljs-packaging-smoke.json','diagnostic-controls/negative-control-result.json','controller/scripts/work8/native-transition/controller-manifest.json','native-transition-driver/controller-manifest.json']
 files={name:e.safe_bytes(root/name) for name in names}
 # Only schema-checked build receipt metadata, never build logs, source snapshots,
 # generated application databases, credentials, or native private directories.
 receipts=root/'build-receipts'
 if receipts.exists():
  for p in sorted(receipts.rglob('*.json')):
   require(len(files)<128,'REVIEW_RECEIPT_COUNT_BOUND');name=p.relative_to(root).as_posix();files[name]=e.safe_bytes(p)
 require(sum(map(len,files.values()))<=64*1024**2,'REVIEW_METADATA_BOUND')
 for name,data in files.items():p=dest/name;p.parent.mkdir(mode=0o700,parents=True,exist_ok=True);p.write_bytes(data)
 index={'schema':'work8-v65-review-inventory-v1','files':[{'path':n,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()} for n,b in sorted(files.items())],'nativeApplicationStarted':False,'rawPrivateDataIncluded':False,'bindings':package_bindings(json.loads((root/'run-contract.json').read_text()))};atomic(dest/'review-index.json',index,exclusive=True)
 total=sum(map(len,files.values()))+(dest/'review-index.json').stat().st_size;require(total<=64*1024**2 and len(files)+1<=129,'COMPLETE_REVIEW_UPLOAD_BOUND')
 return {'status':'SAFE_REVIEW_METADATA_READY_FOR_DURABLE_UPLOAD','path':str(dest),'files':len(files)+1,'bytes':total}

def package_export(root):
 regular(root/'v65-packages.json',4*1024**2);regular(root/'package-source-scan.json',1024**2)
 packages=json.loads((root/'v65-packages.json').read_text());scan=json.loads((root/'package-source-scan.json').read_text())
 require(scan.get('status')=='PASS_COMPLETE_SOURCE_ONLY_PACKAGE_SCAN' and scan.get('applicationRuntimeStarted') is False and scan.get('providerCredentialsSupplied') is False and scan.get('productionDataSupplied') is False,'SOURCE_ONLY_PACKAGE_SCAN_REQUIRED')
 pins=[packages['backend'],*packages['frontends'].values()]
 require(scan['packageManifestSHA256']==sha(root/'v65-packages.json') and scan['archives']=={p['file']:p['sha256'] for p in pins},'SOURCE_SCAN_EXACT_PACKAGE_BINDING')
 target=root/'package-export';require(not target.exists(),'PACKAGE_EXPORT_ALREADY_ATTEMPTED');target.mkdir(mode=0o700)
 total=sum(p['bytes'] for p in pins)+(root/'v65-packages.json').stat().st_size+(root/'package-source-scan.json').stat().st_size;require(total<=1024**3,'PACKAGE_EXPORT_ONE_GIB_BOUND')
 for pin in pins:
  source=root/'artifacts'/relative_name(pin['file']);regular(source);require(source.stat().st_size==pin['bytes'] and sha(source)==pin['sha256'],'PACKAGE_EXPORT_IDENTITY_CHANGED');shutil.copyfile(source,target/pin['file'])
 for name in ('v65-packages.json','package-source-scan.json'):shutil.copyfile(root/name,target/name)
 return {'status':'SOURCE_ONLY_PACKAGES_READY_FOR_DURABLE_UPLOAD','bytes':total,'path':str(target),'packageIdentities':{p['file']:p['sha256'] for p in pins},'applicationAcceptance':False}

def artifact_check(root,artifact_id,digest,label):
 require(label in ('packages','final'),'ARTIFACT_CHECK_LABEL')
 c=json.loads((root/'run-contract.json').read_text()) if (root/'run-contract.json').exists() else {'executor':json.loads((root/'runner-identity.json').read_text())}
 result=service_artifact(c,artifact_id,digest);atomic(root/('artifact-service-'+label+'.json'),result,exclusive=True);return result

def cleanup(root):
 ident=root/'runner-identity.json'
 if not ident.exists():return {'status':'NO_EXECUTOR_IDENTITY_NO_RESOURCES_STARTED','applicationAcceptance':False}
 identity=json.loads(ident.read_text());prefix='work8-v65-a5-'+identity['runId'];removed=[];networks=[]
 for typ,query in [('container',['docker','ps','-aq','--filter','label=work8.native']),('network',['docker','network','ls','-q','--filter','label=work8.native'])]:
  ids=run(root,query,10).decode().split()
  for item in ids:
   require(re.fullmatch('[a-f0-9]{12,64}',item) is not None,'CLEANUP_ID_REFUSED');args=['docker','inspect',item] if typ=='container' else ['docker','network','inspect',item];d=json.loads(run(root,args,10))[0];labels=(d['Config'].get('Labels') or {}) if typ=='container' else (d.get('Labels') or {});require(labels.get('work8.native','').startswith(prefix),'FOREIGN_RESOURCE_REFUSED')
   if typ=='container':run(root,['docker','stop','--time','15',item],25);run(root,['docker','rm','-fv',item],20);removed.append(item)
   else:run(root,['docker','network','rm',item],15);networks.append(item)
 private=root/'private'
 if private.exists():
  require(private.resolve()==private and private.stat().st_uid==1001 and stat.S_IMODE(private.stat().st_mode)==0o700,'PRIVATE_CLEANUP_ROOT_REFUSED')
  # User-owned controller parent only; sudo can remove app-owned fixture files
  # only after this exact fresh private root binding has been verified.
  run(root,['sudo','-n','/bin/rm','-rf','--',str(private)],30)
 result={'schema':'work8-v65-cleanup-v1','status':'PASS_SCOPED_CLEANUP','containersRemoved':removed,'networksRemoved':networks,'privateTemporaryDataRemoved':not private.exists(),'sharedDockerDaemonStopped':False,'applicationAcceptance':False};atomic(root/'runtime-evidence/receipt-cleanup.json',result);return result

def preserve_build_failure(root,build_root):
 if build_root:
  source=pathlib.Path(build_root)/'reconstruction-first-failure.json'
  if source.is_file():
   regular(source,16384);failure=json.loads(source.read_text())
   candidates=[source]
   # Select the known originating child only. Never parse or publish build logs.
   if failure.get('stage')=='backend-reconstruction':candidates.insert(0,pathlib.Path(build_root)/'backend-build/evidence/backend-build-result.json')
   elif failure.get('stage')=='frontend-reconstruction':candidates.insert(0,pathlib.Path(build_root)/'frontend-build/receipts/first-build-failure.json')
   chain=[]
   for candidate in candidates:
    if not candidate.is_file():continue
    regular(candidate,2*1024**2);value=json.loads(candidate.read_text());value=value.get('firstError',value)
    if not isinstance(value,dict):continue
    observed={}
    for key in ('stage','class','code','commandLabel'):
     value_field=value.get(key)
     if isinstance(value_field,str) and re.fullmatch('[A-Za-z0-9_:.-]{1,160}',value_field):observed[key]=value_field
    for key in ('stdoutSHA256','stderrSHA256'):
     if digest_string(value.get(key)):observed[key]=value[key]
    if type(value.get('exitCode')) is int and -255<=value['exitCode']<=255:observed['exitCode']=value['exitCode']
    codes=value.get('knownDiagnosticCodes',[])
    if isinstance(codes,list) and len(codes)<=32 and all(isinstance(x,str) and re.fullmatch('(?:TS[0-9]{3,6}|E[A-Z]{1,30}|COMMAND_TIMEOUT)',x) for x in codes):observed['knownDiagnosticCodes']=codes
    observed['sourceReceiptSHA256']=sha(candidate);chain.append(observed)
   code=next((x['code'] for x in chain if 'code' in x),'SOURCE_RECONSTRUCTION_FIRST_FAILURE')
   target=root/'runtime-evidence/first-runtime-failure.json'
   if not target.exists():atomic(target,{'schema':'work8-v65-runtime-first-failure-v1','stage':'source-reconstruction','code':code,'causalChain':chain,'buildFailureReceiptSHA256':sha(source),'rawOutputRetained':False,'applicationAcceptance':False},exclusive=True)

def native_export(root,label):
 result=exporter(root).build(root,label);destination=root/'evidence-exports'/label
 require({p.name for p in destination.iterdir()}=={'evidence-export.tar.gz','evidence-export-receipt.json'} and sum(p.stat().st_size for p in destination.iterdir())<=1024**2,'NATIVE_UPLOAD_AGGREGATE_BOUND')
 return result

def final_export(root,build_root=None):
 e=exporter(root);preserve_build_failure(root,build_root)
 # First-error export is allowed before complete run contract exists.
 label='final' if (root/'evidence/full/artifact-index.json').exists() and (root/'evidence/preflight/artifact-index.json').exists() else 'failure'
 if not any((root/x).exists() for x in ('run-contract.json','runtime-evidence/first-runtime-failure.json','runtime-evidence/receipt-cleanup.json')):
  atomic(root/'runtime-evidence/first-runtime-failure.json',{'schema':'work8-v65-runtime-first-failure-v1','code':'BUILD_OR_SETUP_DID_NOT_REACH_CONTROLLER','rawOutputRetained':False,'applicationAcceptance':False},exclusive=True)
 result=native_export(root,label);dest=root/'final-export';dest.mkdir(mode=0o700)
 for file in ('evidence-export.tar.gz','evidence-export-receipt.json'):shutil.copyfile(root/'evidence-exports'/label/file,dest/file)
 require(sum(p.stat().st_size for p in dest.iterdir())<=1024**2,'FINAL_UPLOAD_AGGREGATE_BOUND')
 return result

def main():
 parser=argparse.ArgumentParser();parser.add_argument('command',choices=['identity','prepare','qualify','package-export','artifact-check','review-export','await-review','native','native-export','cleanup','final-export']);parser.add_argument('--root',required=True);parser.add_argument('--job-name');parser.add_argument('--authority-file');parser.add_argument('--build-root');parser.add_argument('--max-seconds',type=int,default=1500);parser.add_argument('--stage',choices=['packages-and-executor','preflight','full']);parser.add_argument('--label',choices=['preflight','packages','final']);parser.add_argument('--artifact-id');parser.add_argument('--artifact-digest');args=parser.parse_args();root=pathlib.Path(args.root)
 try:
  require(root.is_absolute() and root.resolve()==root,'CANONICAL_ROOT_REQUIRED')
  if args.command=='identity':result=identity(root,args.job_name)
  elif args.command=='prepare':result=prepare(root)
  elif args.command=='qualify':result=qualify(root,args.authority_file)
  elif args.command=='package-export':result=package_export(root)
  elif args.command=='artifact-check':result=artifact_check(root,args.artifact_id,args.artifact_digest,args.label)
  elif args.command=='review-export':result=review_export(root)
  elif args.command=='await-review':result=await_review(root,args.stage,args.artifact_id,args.artifact_digest,args.max_seconds)
  elif args.command=='native':result=native(root,args.stage)
  elif args.command=='native-export':result=native_export(root,args.label)
  elif args.command=='cleanup':preserve_build_failure(root,args.build_root);result=cleanup(root)
  else:result=final_export(root,args.build_root)
  print(json.dumps(result,sort_keys=True))
 except BaseException as exc:
  if isinstance(exc,SystemExit):raise
  code=str(exc) if isinstance(exc,Refusal) and re.fullmatch('[A-Z0-9_]{1,100}',str(exc)) else 'ADAPTER_'+type(exc).__name__.upper()
  receipt={'schema':'work8-v65-runtime-first-failure-v1','stage':args.command,'code':code,'errno':getattr(exc,'errno',None),'rawOutputRetained':False,'applicationAcceptance':False}
  p=root/'runtime-evidence/first-runtime-failure.json'
  if not root.exists() and root.is_absolute() and root.resolve()==root:root.mkdir(mode=0o700,parents=True)
  if root.exists() and root.resolve()==root and root.stat().st_uid==os.getuid() and stat.S_IMODE(root.stat().st_mode)==0o700 and not p.exists():atomic(p,receipt,exclusive=True)
  print(json.dumps(receipt));raise SystemExit(19)

if __name__=='__main__':main()
