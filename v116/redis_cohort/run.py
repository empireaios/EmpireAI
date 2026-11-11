#!/usr/bin/env python3
"""Bounded fresh Redis-only inspection; no normal EmpireAI application startup."""
import hashlib,json,os,pathlib,re,signal,stat,subprocess,sys,time
SOURCE='6c1e63ba20619ee480742fd87dc810ca93152e22'
APP='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
REDIS='sha256:8f5c54441eb93183170be8c9fc2d8e8275171a6866ca1b4ae682a2ced6a98889'
REF='redis:7.4.2-alpine@sha256:02419de7eddf55aa5bcf49efb74e88fa8d931b4d77c07eff8a6b2144472b6952'
run=os.environ['GITHUB_RUN_ID'];assert run.isdigit()
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-redis-cohort-'+run);control=pathlib.Path(__file__).resolve().parent
assert root.resolve(strict=True)==root and os.getuid()==os.getgid()==1001
out=root/'evidence';out.mkdir(mode=0o700,exist_ok=True);home=root/'docker-home';home.mkdir(mode=0o700,exist_ok=True)
env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','HOME':str(home)};prefix='work8-v116-redis-'+run;label='empireai.v116.redis-cohort='+run
names=[prefix+'-source',prefix+'-target',prefix+'-inspect'];images=[REDIS,REDIS,APP]
def write(name,value):
 b=(json.dumps(value,indent=2)+'\n').encode();assert len(b)<=1048576
 with(out/name).open('xb')as f:f.write(b);f.flush();os.fsync(f.fileno())
def command(args,timeout=15,include_stderr=False):
 p=subprocess.run(['/usr/bin/docker']+args,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout)
 assert len(p.stdout)+len(p.stderr)<=2*1048576,'DOCKER_CONTROL_OUTPUT_CAP'
 if p.returncode:raise RuntimeError('DOCKER_'+args[0]+'_FAILED:'+p.stderr.decode(errors='replace')[:600])
 return p.stdout+p.stderr if include_stderr else p.stdout
def inspect(name):return json.loads(command(['inspect',name]))[0]
def absent(name):
 p=subprocess.run(['/usr/bin/docker','inspect',name],env=env,capture_output=True,timeout=10)
 return p.returncode!=0 and b'No such object' in p.stderr
def terminate():
 removed=[]
 for name,image in reversed(list(zip(names,images))):
  if absent(name):continue
  x=inspect(name);assert x['Name']=='/'+name and x['Image']==image and x['Config']['Labels'].get('empireai.v116.redis-cohort')==run
  command(['rm','--force',name]);removed.append(name)
 for name in names:assert absent(name),'SCOPED_CONTAINER_SURVIVES'
 remaining=command(['ps','-aq','--filter','label='+label]).decode().strip();assert not remaining
 return {'runId':run,'scopedContainersAbsent':True,'labelledContainersAbsent':True,'removed':removed,'noCustomNetworkCreated':True,'productionAccess':False}
def signal_stop(signum,frame):raise InterruptedError('HOST_SIGNAL_'+str(signum))
signal.signal(signal.SIGTERM,signal_stop);signal.signal(signal.SIGINT,signal_stop)
def mount(src,dst):return'type=bind,src='+str(src)+',dst='+dst+',readonly'
def verify_created(x,name,image,network,user,memory,pids,expected_mounts,command_args):
 assert x['Name']=='/'+name and x['Image']==image and x['State']['Status']=='created'and not x['State']['Running']and x['State']['Pid']==0
 c=x['Config'];h=x['HostConfig'];assert c['Labels'].get('empireai.v116.redis-cohort')==run and c['User']==user and c['Entrypoint']==[command_args[0]]and c['Cmd']==command_args[1:]
 assert h['NetworkMode']==network and h['ReadonlyRootfs']and h['CapDrop']==['ALL']and not h['CapAdd']and not h['Privileged']
 assert h['SecurityOpt']==['no-new-privileges']and h['Memory']==memory and h['MemorySwap']==memory and h['PidsLimit']==pids and h['NanoCpus']==1000000000
 assert h['RestartPolicy']['Name']=='no'and not h['PortBindings']and not h['Devices']and not h['DeviceRequests']
 assert not h['PidMode']and not h['IpcMode']=='host'and not h['UTSMode']
 assert h['Tmpfs']==({'/data':'rw,nosuid,nodev,noexec,size=67108864,uid=999,gid=999,mode=0700'}if image==REDIS else{'/tmp':'rw,nosuid,nodev,noexec,size=67108864,mode=1777'})
 assert h['LogConfig']=={'Type':'json-file','Config':{'max-file':'2','max-size':'256k'}}
 actual={m['Destination']:(m['Source'],m['RW'])for m in x['Mounts']if m['Type']=='bind'};assert actual==expected_mounts
 assert all(m['Type']in['bind','tmpfs']for m in x['Mounts'])
 expected_env={'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin','GOSU_VERSION=1.17','REDIS_VERSION=7.4.2','REDIS_DOWNLOAD_URL=http://download.redis.io/releases/redis-7.4.2.tar.gz','REDIS_DOWNLOAD_SHA=4ddebbf09061cbb589011786febdb34f29767dd7f89dbe712d2b68e808af6a1f'}if image==REDIS else{'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin','NODE_VERSION=22.23.2','YARN_VERSION=1.22.22'}
 assert set(c['Env'])==expected_env
def create(name,image,network,user,memory,pids,entry,args,mounts,tmpfs):
 a=['create','--name',name,'--label',label,'--user',user,'--network',network,'--cap-drop','ALL','--security-opt','no-new-privileges','--read-only','--memory',str(memory),'--memory-swap',str(memory),'--pids-limit',str(pids),'--cpus','1','--restart','no','--log-driver','json-file','--log-opt','max-size=256k','--log-opt','max-file=2']
 for spec in tmpfs:a+=['--tmpfs',spec]
 for spec in mounts:a+=['--mount',spec]
 a+=['--entrypoint',entry,image]+args;identifier=command(a).decode().strip();assert re.fullmatch('[a-f0-9]{64}',identifier);return identifier
def execute():
 summary={'schema':'v116-current-redis-host-execution-v1','status':'FAIL_CLOSED','runId':run,'source':SOURCE,'appImage':APP,'redisImage':REDIS,'redisDigest':REF,'normalApplicationStarted':False,'productionAccess':False};start=time.monotonic()
 try:
  for name in names:assert absent(name),'PREEXISTING_EQUIVALENT_RESOURCE'
  # Loading the retained image does not execute its Dockerfile or entrypoint.
  command(['load','--input',str(root/'backend.tar.gz')],60)
  command(['pull',REF],60)
  app=json.loads(command(['image','inspect',APP]))[0];redis=json.loads(command(['image','inspect',REF]))[0]
  assert app['Id']==APP and app['Config']['Labels']['org.opencontainers.image.revision']==SOURCE and app['Config']['Labels']['io.empireai.source-tree']=='a78aa0e0a91c1e765afb23e70fe05c75cddc836e' and app['Architecture']=='amd64'and app['Os']=='linux'
  assert redis['Id']==REDIS and 'redis@'+REF.split('@')[1]in redis['RepoDigests']and redis['Architecture']=='amd64'and redis['Os']=='linux'
  write('redis-image.json',redis);write('application-image.json',app)
  anchor=None;created=[]
  for i,port in enumerate([6379,6380]):
   network='none'if i==0 else'container:'+anchor
   args=['--bind','127.0.0.1','--port',str(port),'--protected-mode','yes','--requirepass','v116-private-inspection-only','--dir','/data','--save','','--appendonly','no','--maxmemory','64mb','--maxmemory-policy','noeviction']
   identifier=create(names[i],REDIS,network,'999:999',128*1048576,32,'/usr/local/bin/redis-server',args,[],['/data:rw,nosuid,nodev,noexec,size=67108864,uid=999,gid=999,mode=0700'])
   x=inspect(names[i]);verify_created(x,names[i],REDIS,network,'999:999',128*1048576,32,{},['/usr/local/bin/redis-server']+args);created.append(x)
   command(['start',names[i]])
   ready_deadline=time.monotonic()+10
   while True:
    try:
     assert command(['exec',names[i],'/usr/local/bin/redis-cli','-h','127.0.0.1','-p',str(port),'-a','v116-private-inspection-only','--no-auth-warning','PING'],3).strip()==b'PONG';break
    except (RuntimeError,subprocess.TimeoutExpired):
     if time.monotonic()>=ready_deadline:raise TimeoutError('FRESH_REDIS_STARTUP_LIMIT')
     time.sleep(.1)
   if i==0:anchor=identifier
  mounts=[mount(root/'capture','/capture'),mount(control/'current-redis-cohort.mjs','/control/current-redis-cohort.mjs'),mount(control/'input-admission.json','/control/input-admission.json'),mount(control/'frozen-cohort-validation.mjs','/control/frozen-cohort-validation.mjs'),mount(control/'frozen-cohort','/cohort-input'),'type=bind,src='+str(out)+',dst=/evidence']
  expected={'/capture':(str(root/'capture'),False),'/control/current-redis-cohort.mjs':(str(control/'current-redis-cohort.mjs'),False),'/evidence':(str(out),True),'/control/input-admission.json':(str(control/'input-admission.json'),False),'/control/frozen-cohort-validation.mjs':(str(control/'frozen-cohort-validation.mjs'),False),'/cohort-input':(str(control/'frozen-cohort'),False)}
  assert json.loads((control/'input-admission.json').read_text())['frozenCohort']['manifestSHA256']=='0259bb825217cbb1ed5e150941478a9912ff6179a25f5f4f7cc38c37996b8ebb'
  args=['/control/current-redis-cohort.mjs'];create(names[2],APP,'container:'+anchor,'1001:1001',512*1048576,64,'/usr/local/bin/node',args,mounts,['/tmp:rw,nosuid,nodev,noexec,size=67108864,mode=1777'])
  x=inspect(names[2]);verify_created(x,names[2],APP,'container:'+anchor,'1001:1001',512*1048576,64,expected,['/usr/local/bin/node']+args);created.append(x);write('prelaunch-container-inspection.json',created)
  command(['start',names[2]])
  deadline=time.monotonic()+120
  while time.monotonic()<deadline:
   x=inspect(names[2])
   if not x['State']['Running']:break
   time.sleep(.2)
  else:raise TimeoutError('NATIVE_REDIS_HELPER_120S_LIMIT')
  assert x['State']['Status']=='exited'and x['State']['ExitCode']==0 and not x['State']['OOMKilled'],'NATIVE_REDIS_HELPER_FAILED'
  result=json.loads((out/'current-redis-cohort-result.json').read_text());assert result['status']=='PASS_CURRENT_CLOSED_FENCED_REDIS_INSPECTION_COHORT'
  assert len(result['assertions'])==9 and all(result['assertions'].values())and result['clientsDisconnected']
  assert result['frozenCohort']['status']=='PASS_MEASURED_EQUIVALENCE_AT_EXPLICIT_FROZEN_CUTOFFS'and result['frozenCohort']['currentImmutableRuntimeInputsMatched']==5
  composition=json.loads((out/'declared-sql-file-redis-composition.json').read_text());assert composition['status']=='PASS_ATTRIBUTABLE_MEASURED_EQUIVALENCE_AT_DECLARED_CUTOFFS'and composition['sqlAndFilesReobservedInRedisJob']is False and composition['globalHealth']=='UNKNOWN'
  summary.update(status='PASS_CURRENT_REDIS_INSPECTION_ONLY',nativeResultSHA256=hashlib.sha256((out/'current-redis-cohort-result.json').read_bytes()).hexdigest())
 except BaseException as e:summary['firstFailure']={'type':type(e).__name__,'message':str(e)[:1200]}
 finally:
  signal.signal(signal.SIGTERM,signal.SIG_IGN);signal.signal(signal.SIGINT,signal.SIG_IGN)
  for name in names:
   try:
    if not absent(name):
     b=command(['logs','--tail','100',name],include_stderr=True);assert len(b)<=1048576
     (out/(name.rsplit('-',1)[1]+'-console.log')).write_bytes(b)
   except BaseException as e:summary.setdefault('diagnosticErrors',[]).append(type(e).__name__)
  try:summary['termination']=terminate()
  except BaseException as e:summary['terminationFailure']=str(e)[:600];summary['status']='FAIL_CLOSED'
  summary['elapsedSeconds']=round(time.monotonic()-start,3);write('host-execution.json',summary)
  print(json.dumps({'status':summary['status'],'firstFailure':summary.get('firstFailure'),'terminationFailure':summary.get('terminationFailure')}))
 return 0 if summary['status']=='PASS_CURRENT_REDIS_INSPECTION_ONLY'else 1
def seal():
 termination=terminate();write('provider-termination.json',termination);rows=[];total=0
 # First-failure diagnostics remain on the provider log independently of artifact upload.
 for name in ['current-redis-cohort-result.json','host-execution.json']:
  if(out/name).exists():
   p=out/name;s=p.lstat();assert p.is_file()and not p.is_symlink()and s.st_nlink==1 and s.st_uid==1001 and s.st_size<=1048576
   r=json.loads(p.read_text());print(json.dumps({'receipt':name,'status':r.get('status'),'firstFailure':r.get('firstFailure')}))
 for p in sorted(out.iterdir()):
  s=p.lstat();assert p.is_file()and not p.is_symlink()and s.st_nlink==1 and s.st_uid==1001 and s.st_size<=2*1048576
  b=p.read_bytes();total+=len(b);assert total<=8*1048576;rows.append({'path':p.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
 write('evidence-index.json',{'schema':'v116-current-redis-evidence-index-v1','runId':run,'launchCommit':os.environ['GITHUB_SHA'],'payloads':rows,'maximumBytes':8*1048576,'retentionDays':7,'wholeRowAccepted':False})
 assert sum(p.stat().st_size for p in out.iterdir())<=8*1048576
if __name__=='__main__':
 if sys.argv[1:] == ['execute']:sys.exit(execute())
 assert sys.argv[1:]==['seal'];seal()
