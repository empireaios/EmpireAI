#!/usr/bin/python3
"""One original HH4 producer, then two original read-only inspection consumers."""
import datetime,hashlib,json,os,pathlib,re,selectors,signal,subprocess,sys,time
from process_boundary import ProcessBoundary
from source_binding import verify_git,verify_image
SOURCE='6c1e63ba20619ee480742fd87dc810ca93152e22'
IMAGE='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
NODE_SHA='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def stamp():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def regular(p,maximum=1048576):
 s=p.lstat();assert p.is_file()and not p.is_symlink()and s.st_nlink==1 and s.st_size<=maximum,str(p)
 return p.read_bytes()
def write(p,value):
 data=(json.dumps(value,indent=2)+'\n').encode();assert len(data)<=1048576
 with p.open('xb')as f:f.write(data);f.flush();os.fsync(f.fileno())
def process_identity(pid):
 text=pathlib.Path('/proc/'+str(pid)+'/stat').read_text();f=text[text.rfind(')')+2:].split()
 return {'pid':pid,'startTicks':int(f[19]),'processGroup':int(f[2]),'session':int(f[3]),'bootId':pathlib.Path('/proc/sys/kernel/random/boot_id').read_text().strip()}
def main():
 assert len(sys.argv)==4,'exactNode inputRoot runId'
 node,root=map(lambda x:pathlib.Path(x).resolve(strict=True),sys.argv[1:3]);run=sys.argv[3];assert run.isdigit()
 control=pathlib.Path(__file__).resolve().parent;repo=control.parent.parent
 assert control.parts[-2:]==('v116','hh4_hosted'),'EXACT_TWO_LEVEL_CONTROL_LOCATION'
 evidence=root/'evidence';evidence.mkdir(exist_ok=True);assert sha(node)==NODE_SHA
 env={'PATH':str(control)+':/usr/bin:/bin','LANG':'C.UTF-8','TZ':'UTC','V116_HH4_RUN_ID':run,'V116_HH4_ROOT':str(root),'V116_HH4_CONTROL':str(control)}
 original=json.loads(regular(control/'original-inputs.json'))
 verify_git(repo,control);verify_image(root,control)
 for name,digest in original['controlSHA256'].items():assert sha(control/name)==digest,name
 assert sha(control/'technical-authority.json')=='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'
 assert subprocess.check_output([str(node),'--version'],env=env,text=True,timeout=5).strip()=='v22.23.2'
 boundary=ProcessBoundary();boundary.install();summary={'schema':'v116-original-hh4-bounded-execution-v1','source':SOURCE,'image':IMAGE,'startedUTC':stamp(),'status':'FAIL_CLOSED','stages':[],'productionAccess':False,'genuineOwnerEvidence':False,'wholeQ5Accepted':False}
 def execute(phase,argv,maximum):
  boundary.check();receipt={'phase':phase,'argv':argv,'maximumSeconds':maximum,'startedUTC':stamp(),'status':'FAIL_CLOSED'};proc=None;selector=None
  try:
   prior=signal.pthread_sigmask(signal.SIG_BLOCK,{signal.SIGTERM,signal.SIGINT})
   try:
    boundary.check();start=time.monotonic();proc=subprocess.Popen(argv,cwd=repo,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True);boundary.own(proc)
    receipt['identity']=process_identity(proc.pid);assert receipt['identity']['processGroup']==proc.pid and receipt['identity']['session']==proc.pid
    receipt['cwd']=str(repo);write(evidence/(phase+'-launch.json'),receipt)
   finally:signal.pthread_sigmask(signal.SIG_SETMASK,prior)
   selector=selectors.DefaultSelector();selector.register(proc.stdout,selectors.EVENT_READ);size=0;timeout=False;overflow=False
   with(evidence/(phase+'-console.log')).open('xb')as f:
    while selector.get_map():
     if time.monotonic()-start>=maximum:timeout=True;break
     for key,_ in selector.select(.2):
      data=os.read(key.fd,65536)
      if not data:selector.unregister(key.fd);continue
      remaining=1048576-size;f.write(data[:remaining]);size+=min(len(data),remaining)
      if len(data)>remaining:overflow=True;break
     if overflow:break
    f.flush();os.fsync(f.fileno())
   if timeout or overflow:boundary.stop(proc)
   try:code=proc.wait(timeout=5)
   except subprocess.TimeoutExpired:timeout=True;boundary.stop(proc);code=proc.returncode
   receipt.update(exitCode=code,timeout=timeout,outputCapExceeded=overflow,consoleBytes=size,elapsedSeconds=round(time.monotonic()-start,3))
   assert code==0 and not timeout and not overflow,'PHASE_EXECUTION_FAILED'
   receipt['status']='PASS_PROCESS_EXECUTION_ONLY'
  except BaseException as e:receipt['firstFailure']={'type':type(e).__name__,'message':str(e)}
  finally:
   if proc:boundary.stop(proc)
   if selector:selector.close()
   if proc and proc.stdout:proc.stdout.close()
   receipt['finishedUTC']=stamp();receipt['externalStopRequested']=boundary.stop_requested;write(evidence/(phase+'-execution.json'),receipt);summary['stages'].append(receipt)
  return receipt['status']=='PASS_PROCESS_EXECUTION_ONLY'
 stage='redis-default-loader-preflight'
 try:
  # Outer strict transport supplies only the six reviewed read-only dependency mounts.
  versionName='work8-hh4-abi-'+run
  version=['docker','run','--name',versionName,'--label','empireai.v116.hh4='+run,'--network','none','--cap-drop','ALL','--security-opt','no-new-privileges','--read-only','--pids-limit','32','--memory','128m','--memory-swap','128m','--cpus','1','--restart','no','--entrypoint','/usr/bin/redis-server',IMAGE,'--version']
  assert execute('redis-preflight',version,30)
  text=regular(evidence/'redis-preflight-console.log').decode();assert re.search(r'Redis server v=7\.0\.15\b',text)and'error while loading'not in text
  write(evidence/'redis-mounted-preflight.json',{'status':'PASS_EXACT_IMAGE_DEFAULT_LOADER','image':IMAGE,'source':SOURCE,'redisVersion':'7.0.15','outputSHA256':sha(evidence/'redis-preflight-console.log'),'dependencyManifestSHA256':sha(control/'dependencies/pinned-dependencies.json'),'applicationStarted':False})
  stage='original-held-capture-producer';producer=root/'producer-raw';producer.mkdir(mode=0o700)
  assert execute('producer',[str(node),str(control/'hh4-held-capture-controller.mjs'),IMAGE,SOURCE,str(producer)],260)
  result=json.loads(regular(producer/'held-capture-result.json'));assert result['status']=='PASS_HELD_CAPTURE_AND_CONTAINMENT_ONLY'and result['source']==SOURCE and result['contained']
  mounted=producer/'container-evidence';held=json.loads(regular(mounted/'hh4-held.json'));digest=held['digest'];assert re.fullmatch('[a-f0-9]{64}',digest)
  stage='two-original-readonly-consumers';consumer=root/'consumer-raw';consumer.mkdir(mode=0o700)
  reader=['docker','run','--name','work8-hh4-reader-'+run,'--label','empireai.v116.hh4='+run,'--user',str(os.getuid())+':'+str(os.getgid()),'--network','none','--cap-drop','ALL','--security-opt','no-new-privileges','--read-only','--tmpfs','/tmp:rw,nosuid,nodev,size=1073741824,mode=1777','--pids-limit','128','--memory','3g','--memory-swap','3g','--cpus','2','--restart','no']
  mounts=[(mounted/'held-capture','/capture',True),(mounted/'hh4-worker-ready.json','/input/hh4-worker-ready.json',True),(mounted/'hh4-held.json','/input/hh4-held.json',True),(producer/'held-capture-result.json','/input/held-capture-result.json',True),(consumer,'/result',False),(control/'hh4-original-consumers.mjs','/control/hh4-original-consumers.mjs',True),(control/'hh4-consumer-source-inputs.json','/control/hh4-consumer-source-inputs.json',True)]
  for src,dst,ro in mounts:reader.extend(['--mount','type=bind,src='+str(src)+',dst='+dst+(',readonly'if ro else'')])
  reader.extend(['--entrypoint','node',IMAGE,'/control/hh4-original-consumers.mjs',SOURCE,digest])
  consumersExecuted=execute('consumers',reader,300)
  consumers=json.loads(regular(consumer/'consumer-summary.json'))if(consumer/'consumer-summary.json').exists()else{}
  consumersPassed=consumersExecuted and consumers.get('status')=='PASS_TWO_ORIGINAL_INSPECTION_CONSUMERS'and consumers.get('source')==SOURCE and consumers.get('digest')==digest
  # This independent original default graph mode consumes the same private copy.
  # Never repeat its producer merely to recover input deleted after this job.
  stage='original-default-application-graph';graph=root/'graph-raw';graph.mkdir(mode=0o700)
  graphCommand=['docker','run','--name','work8-hh4-graph-'+run,'--label','empireai.v116.hh4='+run,'--user',str(os.getuid())+':'+str(os.getgid()),'--network','none','--cap-drop','ALL','--security-opt','no-new-privileges','--read-only','--tmpfs','/tmp:rw,nosuid,nodev,size=1073741824,mode=1777','--pids-limit','256','--memory','3g','--memory-swap','3g','--cpus','2','--restart','no']
  for src,dst,ro in [(producer,'/evidence',True),(mounted/'held-capture','/capture',True),(graph,'/results',False)]:graphCommand.extend(['--mount','type=bind,src='+str(src)+',dst='+dst+(',readonly'if ro else'')])
  graphCommand.extend(['-e','NODE_ENV=test','-e','EMPIRE_ENGINEERING_TEST_MODE=true','-e','WORK8_KERNEL_EGRESS=DENIED','--entrypoint','node',IMAGE,'scripts/work8/application-graph-restoration.mjs',SOURCE,'graph'])
  graphExecuted=execute('application-graph',graphCommand,240)
  graphResult=json.loads(regular(graph/'application-graph-result.json'))if(graph/'application-graph-result.json').exists()else{}
  graphCompleted=graphExecuted and graphResult.get('status')in ['PASS_SCOPED_APPLICATION_GRAPH_ONLY','AWAITING_INDEPENDENT_MUTATION_CLASSIFICATION']and graphResult.get('source')==SOURCE and graphResult.get('digest')==digest
  if graphCompleted:
   assert graphResult['mode']=='graph'and graphResult['originalSessionAuthenticated']and graphResult['missionAndFinancialHistoryPreserved']and graphResult['queueAdmissionRemainsFenced']
   assert graphResult['authorityImported']is False and graphResult['sourceManifestBootAllowed']is False and graphResult['externalEffects']==0 and graphResult['paidInference']==0
  summary['scopes']={'twoOriginalInspectionConsumersPassed':consumersPassed,'defaultGraphExaminationCompleted':graphCompleted,'defaultGraphStatus':graphResult.get('status','NOT_PRODUCED'),'graphMutationIndependentAdjudicationRequired':bool(graphResult.get('targetTableChanges')),'indexOrPendingModesExecuted':False}
  verify_git(repo,control);verify_image(root,control)
  for name,d in original['controlSHA256'].items():assert sha(control/name)==d,name
  assert consumersPassed and graphCompleted,'ONE_OR_MORE_ORIGINAL_SCOPES_FAILED'
  summary.update(status='PASS_ORIGINAL_HH4_AND_DEFAULT_GRAPH_EXECUTION_PENDING_INDEPENDENT_ADJUDICATION',digest=digest,originalApplicationChanged=False,rawCanonicalRecordsPublished=False)
 except BaseException as e:summary['firstFailure']={'stage':stage,'type':type(e).__name__,'message':str(e)}
 finally:
  for proc in boundary.owned:boundary.stop(proc)
  summary['externalStopRequested']=boundary.stop_requested;summary['finishedUTC']=stamp();write(evidence/'hh4-execution-summary.json',summary)
 return 0 if summary['status'].startswith('PASS_')and not boundary.stop_requested else 1
if __name__=='__main__':sys.exit(main())
