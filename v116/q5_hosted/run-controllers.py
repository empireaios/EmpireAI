#!/usr/bin/python3
"""Original F27/F29 external controllers, credential-free and independently bounded."""
import datetime,hashlib,json,os,pathlib,re,selectors,signal,subprocess,sys,time
from process_boundary import ProcessBoundary
boundary=ProcessBoundary();boundary.install()
assert len(sys.argv)==5,'actual6ccheckout exactNode inputroot runid'
APP,NODE,ROOT=map(lambda x:pathlib.Path(x).resolve(strict=True),sys.argv[1:4]);RUN=sys.argv[4];assert RUN.isdigit()
CONTROL=pathlib.Path(__file__).resolve().parent;EVIDENCE=ROOT/'evidence';EVIDENCE.mkdir(exist_ok=True)
SOURCE='6c1e63ba20619ee480742fd87dc810ca93152e22';IMAGE='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
assert sha(NODE)=='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','TZ':'UTC'}
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=APP,env=env,text=True).strip()==SOURCE
assert subprocess.check_output(['git','status','--porcelain'],cwd=APP,env=env,text=True).strip()==''
imageInspection=json.loads(subprocess.check_output(['/usr/bin/docker','image','inspect',IMAGE],env=env,timeout=15))[0]
assert imageInspection['Id']==IMAGE and imageInspection['Config']['WorkingDir']=='/app'
assert imageInspection['Config']['Labels']['org.opencontainers.image.revision']==SOURCE
assert imageInspection['Config']['Labels']['io.empireai.source-tree']=='a78aa0e0a91c1e765afb23e70fe05c75cddc836e'
assert sorted(v.split('=',1)[0]for v in imageInspection['Config']['Env'])==['NODE_VERSION','PATH','YARN_VERSION']
(EVIDENCE/'original-image-preflight.json').write_text(json.dumps(imageInspection,indent=2)+'\n')
manifest=json.loads((CONTROL/'application-inputs.json').read_text())
for rel,digest in manifest['files'].items():assert sha(APP/rel)==digest,rel
assert sha(CONTROL/'technical-authority.json')=='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'
assert subprocess.check_output([str(NODE),'--version'],env=env,text=True).strip()=='v22.23.2'
results=[]
for phase,maximum in [('f27',330),('f29',1830)]:
 if boundary.stop_requested:break
 phaseRoot=ROOT/(phase+'-raw');phaseRoot.mkdir(mode=0o700)
 controlOut=EVIDENCE/phase;controlOut.mkdir(mode=0o700)
 home=ROOT/(phase+'-home');home.mkdir(mode=0o700)
 childEnv={**env,'PATH':str(CONTROL)+':/usr/bin:/bin','HOME':str(home),'V116_Q5_PHASE':phase,'V116_Q5_APPLICATION':str(APP),'V116_Q5_PHASE_EVIDENCE':str(phaseRoot),'V116_Q5_CONTROL_EVIDENCE':str(controlOut),'V116_Q5_RUN_ID':RUN}
 receipt={'schema':'v116-q5-original-outer-controller-v1','phase':phase,'startedUTC':now(),'status':'FAIL_CLOSED','applicationSource':SOURCE,'applicationImage':IMAGE,'originalControllerSHA256':manifest['files']['scripts/work8/'+phase+'-outer-controller.cjs'],'originalTestsChanged':False,'productionAccess':False,'financialAdmission':'root unique saved ledger only','maximumSeconds':maximum,'wholeQ5Accepted':False}
 proc=None;names=[];stage='start-original-controller'
 try:
  priorMask=signal.pthread_sigmask(signal.SIG_BLOCK,{signal.SIGTERM,signal.SIGINT})
  try:
   boundary.check()
   entryCommand=['/usr/bin/python3',str(CONTROL/'controller-entry.py'),str(NODE),phase,str(APP),str(phaseRoot)]
   start=time.monotonic();proc=subprocess.Popen(entryCommand,cwd=APP,env=childEnv,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True)
   boundary.own(proc)
   receipt['controllerPid']=proc.pid;names=['work8-f27-'+str(proc.pid)]if phase=='f27'else['work8-f29-'+str(proc.pid)+'-'+m for m in ['both-observers-killed','launcher-and-guard-killed']]
   stat=pathlib.Path('/proc/'+str(proc.pid)+'/stat').read_text();fields=stat[stat.rfind(')')+2:].split()
   receipt['controllerIdentity']={'bootId':pathlib.Path('/proc/sys/kernel/random/boot_id').read_text().strip(),'startTicks':int(fields[19]),'processGroup':int(fields[2]),'session':int(fields[3]),'cwd':str(APP),'allowedCommands':[entryCommand,[str(NODE),'scripts/work8/'+phase+'-outer-controller.cjs',IMAGE,str(phaseRoot)]]}
   assert receipt['controllerIdentity']['processGroup']==proc.pid and receipt['controllerIdentity']['session']==proc.pid
   receipt['ownedContainerNames']=names
   (controlOut/'launch.json').write_text(json.dumps(receipt,indent=2)+'\n')
  finally:signal.pthread_sigmask(signal.SIG_SETMASK,priorMask)
  stage='observe-original-execution';selector=selectors.DefaultSelector();selector.register(proc.stdout,selectors.EVENT_READ);size=0;timed=False;overflow=False
  with(controlOut/'controller-console.log').open('xb')as log:
   while selector.get_map():
    if time.monotonic()-start>=maximum:timed=True;break
    for key,_ in selector.select(0.2):
     chunk=os.read(key.fd,65536)
     if not chunk:selector.unregister(key.fd);continue
     amount=min(len(chunk),1048576-size);log.write(chunk[:amount]);size+=amount
     if amount<len(chunk):overflow=True;break
    if overflow:break
   if timed or overflow:os.killpg(proc.pid,signal.SIGTERM)
   try:code=proc.wait(timeout=15)
   except subprocess.TimeoutExpired:timed=True;os.killpg(proc.pid,signal.SIGKILL);code=proc.wait()
  selector.close();proc.stdout.close()
  receipt['execution']={'exitCode':code,'timeout':timed,'outputCapExceeded':overflow,'consoleBytes':size,'elapsedSeconds':round(time.monotonic()-start,3)}
  assert code==0 and not timed and not overflow
  stage='adjudicate-original-required-receipts'
  if phase=='f27':
   r=json.loads((phaseRoot/'external-receipt.json').read_text());assert r['status']=='PASS_F27_EXTERNAL_SIMULTANEOUS_VECTOR'and r['source']==SOURCE
   assert r['simultaneousObserved']and r['observerExitVerified']and r['containedByExternalController']and r['containerStopped']and r['survivors']==[]
   assert r['externalDetectionMs']<60000 and r['elapsedMs']<120000 and r['birth']=='NOT_BORN'and r['commerce']=='LOCKED'
   c=json.loads((phaseRoot/'child-complete.json').read_text());assert c['status']=='PASS'and c['source']==SOURCE and c['inferenceCalls']==0 and c['externalEffects']==0
  else:
   for mode in ['both-observers-killed','launcher-and-guard-killed']:
    r=json.loads((phaseRoot/mode/'receipt.json').read_text());assert r['status']=='PASS_F29_PAIR_CONTAINMENT'and r['source']==SOURCE and r['mode']==mode
    assert r['containedByExternalController']and r['containerStopped']and r['financialRecordsPreserved']and r['financialBefore']==r['financialAfter']
    assert r['detectionMs']<=660000 and r['elapsedMs']<=720000 and r['productionChanges']==0 and r['providerEffects']==0 and r['inferenceCalls']==0
    assert r['birth']=='NOT_BORN'and r['commerce']=='LOCKED'
  for rel,digest in manifest['files'].items():assert sha(APP/rel)==digest,'SOURCE_CHANGED:'+rel
  receipt['sourceBytesUnchanged']=True;receipt['status']='PASS_ORIGINAL_'+phase.upper()+'_SCOPE'
 except BaseException as error:receipt['firstFailure']={'stage':stage,'type':type(error).__name__,'message':str(error)}
 finally:
  if proc:
   boundary.stop(proc)
   for name in names:
    inspected=subprocess.run(['/usr/bin/docker','inspect',name],stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=15,env=env)
    if inspected.returncode==0:
     assert len(inspected.stdout)<=1048576
     item=json.loads(inspected.stdout)[0];assert item['Image']==IMAGE and item['Config']['Labels'].get('empireai.v116.q5')==RUN
     (controlOut/(name+'-forced-termination-inspect.json')).write_bytes(inspected.stdout)
     subprocess.run(['/usr/bin/docker','rm','--force',name],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,timeout=15,env=env,check=True)
    check=subprocess.run(['/usr/bin/docker','inspect',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,env=env,timeout=15);assert check.returncode!=0,'OWNED_CONTAINER_SURVIVED'
  receipt['ownedContainersAbsent']=True;receipt['externalStopRequested']=boundary.stop_requested;receipt['externalStopSignal']=boundary.signal_received;receipt['finishedUTC']=now();(controlOut/'controller-result.json').write_text(json.dumps(receipt,indent=2)+'\n');results.append(receipt)
 # A failed independent scope does not prevent the other admitted scope from running.
(EVIDENCE/'outer-controller-summary.json').write_text(json.dumps({'schema':'v116-q5-outer-scoped-summary-v1','results':results,'wholeQ5Accepted':False,'originalApplicationSource':SOURCE},indent=2)+'\n')
raise SystemExit(0 if not boundary.stop_requested and len(results)==2 and all(x['status'].startswith('PASS_ORIGINAL_')for x in results)else 1)
