#!/usr/bin/env python3
"""One fresh, bounded full-native distinct-version examination. No provider keys."""
import hashlib, io, json, os, pathlib, re, secrets, shutil, subprocess, sys, tarfile, tempfile, time
sys.dont_write_bytecode=True
import candidate_packages
import current_packages
import execution_contract
from native_diagnostics import save_first,from_error,parse_stream,emit_fallback,sanitize,token
from private_contract import backend_options,browser_options,private_write,safe_docker_contract
from entrypoint_contract import execute as verify_mounted_entrypoints
from command_diagnostics import invoke as invoke_reviewed_command
from controller_failure import preserve as preserve_controller_failure
from docker_diagnostics import capture_first as capture_first_docker_error
from evidence_handoff import transfer as transfer_private_evidence

ROOT=pathlib.Path(os.environ['WORK8_EXECUTION_ROOT'])
assert ROOT.is_absolute() and ROOT.resolve()==ROOT,'CANONICAL_EXECUTION_ROOT_REQUIRED'
SCRIPT=pathlib.Path(__file__).resolve().parent
PHASE=sys.argv[1] if len(sys.argv)==2 else ''
assert PHASE in {'--preflight-v62-native-brain','--examine-v62-native-brain'},'EXPLICIT_EXAMINATION_PHASE_REQUIRED'
PREFLIGHT=PHASE=='--preflight-v62-native-brain'
STAGE_NAME='preflight' if PREFLIGHT else 'full'
# No subprocess or native application is allowed before this immutable gate.
CONTRACT=execution_contract.gate(ROOT,SCRIPT,STAGE_NAME)
ATTEMPTS=ROOT/'attempts';ATTEMPTS.mkdir(mode=0o700,exist_ok=True)
ATTEMPT=ATTEMPTS/(STAGE_NAME+'.json')
ATTEMPT_RECEIPT={'schema':'work8-v62-one-attempt-v1','stage':STAGE_NAME,'sessionId':CONTRACT['executor']['sessionId'],'campaignId':CONTRACT['campaignId'],'startedAtEpoch':time.time(),'runContractSHA256':os.environ['WORK8_RUN_CONTRACT_SHA256'],'sourceReviewSHA256':os.environ['WORK8_SOURCE_REVIEW_SHA256'],'launchContractSHA256':CONTRACT['launchContractSHA256'],'controllerManifestSHA256':CONTRACT['controllerManifestSHA256']}
fd=os.open(ATTEMPT,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
try:
 data=(json.dumps(ATTEMPT_RECEIPT,sort_keys=True)+'\n').encode();os.write(fd,data);os.fsync(fd)
finally:os.close(fd)
OUT=ROOT/'evidence'/STAGE_NAME;OUT.mkdir(parents=True,exist_ok=False)
(OUT/'stage-start.json').write_text(json.dumps(ATTEMPT_RECEIPT,indent=2)+'\n')
PRIVATE_ROOT=ROOT/'private';PRIVATE_ROOT.mkdir(mode=0o700,exist_ok=True)
assert PRIVATE_ROOT.resolve()==PRIVATE_ROOT and PRIVATE_ROOT.stat().st_uid==1001 and (PRIVATE_ROOT.stat().st_mode&0o777)==0o700,'PRIVATE_TEMPORARY_ROOT_REQUIRED'
PRIVATE=pathlib.Path(tempfile.mkdtemp(prefix='work8-native-transition-',dir=PRIVATE_ROOT))
MANIFEST=json.loads((SCRIPT/'components.json').read_text())
LABEL=CONTRACT['campaignId']+'-'+STAGE_NAME
NAMES={x:LABEL+'-'+x for x in ['backend','frontend','redis','anchor','browser','module']}
NETWORK=LABEL+'-network';network_created=False;created=[];images={};generated=[];front_phase=None
NODE=execution_contract.DEPENDENCY_IMAGES['node']
REDIS=execution_contract.DEPENDENCY_IMAGES['redis']
BROWSER=execution_contract.DEPENDENCY_IMAGES['browser']
PLAN=CONTRACT['durationPlan']
BUDGET={'startedAtEpoch':time.time(),'maximumSeconds':PLAN['preflightSeconds' if PREFLIGHT else 'examinationSeconds']+PLAN['cleanupSeconds']+PLAN['evidenceExportSeconds'],'cleanupAndUploadReserveSeconds':PLAN['cleanupSeconds']+PLAN['evidenceExportSeconds'],'stageMaximumArtifactBytes':(128 if PREFLIGHT else 1920)*1024**2}
(OUT/'workflow-budget.json').write_text(json.dumps(BUDGET,indent=2)+'\n')
START=time.monotonic();stage='preflight';result={'status':'FAIL','wholeRowsAccepted':[],'productionAccess':False,'genuineOwnerObservation':False,'phaseAStatus':'NOT_STARTED','phaseBStarted':False,'sessionId':CONTRACT['executor']['sessionId'],'runContractSHA256':os.environ['WORK8_RUN_CONTRACT_SHA256'],'sourceReviewSHA256':os.environ['WORK8_SOURCE_REVIEW_SHA256'],'launchContractSHA256':CONTRACT['launchContractSHA256'],'controllerManifestSHA256':CONTRACT['controllerManifestSHA256'],'automaticRerun':False}
STAGE_SECONDS=PLAN['preflightSeconds' if PREFLIGHT else 'examinationSeconds']
TIME_BUDGET={'schema':'work8-v95-native-time-budget-v1','stage':STAGE_NAME,'stageSeconds':STAGE_SECONDS,'startedAtEpochMs':int(BUDGET['startedAtEpoch']*1000),'browserReserveSeconds':390,'coordinatorReserveSeconds':60,'externalKillGraceSeconds':30}
TIME_BUDGET['stageDeadlineEpochMs']=TIME_BUDGET['startedAtEpochMs']+STAGE_SECONDS*1000
TIME_BUDGET['finalTailSeconds']={'browserExit':20,'nativeDrain':25,'independentFinalReadbacks':240,'coordinatorExit':20,'margin':25}
assert sum(TIME_BUDGET['finalTailSeconds'].values())==TIME_BUDGET['browserReserveSeconds']-TIME_BUDGET['coordinatorReserveSeconds']
(OUT/'native-time-budget.json').write_text(json.dumps(TIME_BUDGET,indent=2)+'\n')
MAX_OUTPUT=BUDGET['stageMaximumArtifactBytes']
container_lifecycle=[]
policy_lifecycle=[]

def child_timeout(role):
 reserve={'anchor':0,'coordinator':30,'browser':360}[role]
 seconds=int((TIME_BUDGET['stageDeadlineEpochMs']-time.time()*1000)/1000)-reserve
 assert 0<seconds<=STAGE_SECONDS,'NATIVE_CHILD_DEADLINE_EXPIRED'
 return seconds

def output_bytes():
 total=0
 for p in OUT.iterdir():
  assert p.is_file() and not p.is_symlink(),'NONREGULAR_ARTIFACT_REFUSED'
  total+=p.stat().st_size
 return total

def redact(s):
 for value in generated:s=s.replace(value,'[REDACTED]')
 s=re.sub(r'(?i)Bearer\s+[^\s"<>]+','Bearer [REDACTED]',s)
 s=re.sub(r'empireai_session=[^;\s"<>]+','empireai_session=[REDACTED]',s)
 return re.sub(r'(?i)("(?:token|password|secret|nonce|authorization)"\s*:\s*")[^"]*(")',r'\1[REDACTED]\2',s)

def run(args,*,cwd=None,timeout=120,log=None,input=None,expected_exit_codes=(0,)):
 assert time.monotonic()-START<PLAN['preflightSeconds' if PREFLIGHT else 'examinationSeconds'],'CAMPAIGN_EXAMINATION_BOUND'
 assert time.time()-BUDGET['startedAtEpoch']<BUDGET['maximumSeconds']-BUDGET['cleanupAndUploadReserveSeconds'],'CAMPAIGN_TOTAL_BOUND'
 remaining=BUDGET['maximumSeconds']-(time.time()-BUDGET['startedAtEpoch'])-BUDGET['cleanupAndUploadReserveSeconds']
 try:
  return invoke_reviewed_command(args,out=OUT,stage=stage,cwd=cwd,timeout=min(timeout,max(1,int(remaining))),log=log,input=input,expected_exit_codes=expected_exit_codes)
 except RuntimeError:
  emit_fallback(OUT)
  raise

def inspect(name):return json.loads(run(['docker','inspect',name]))[0]
def inspect_image(name):return json.loads(run(['docker','image','inspect',name]))[0]
def safe_container_state(role,payload,checkpoint):
 state=payload['State']
 known_status={'created','running','paused','restarting','removing','exited','dead'}
 codes=['EACCES','EROFS','EPERM','ENOENT','ECONNREFUSED','EADDRINUSE','ENOMEM']
 error=str(state.get('Error',''))
 row={'role':role,'checkpoint':checkpoint,'status':state.get('Status') if state.get('Status') in known_status else 'UNRECOGNIZED','running':state.get('Running') is True,'paused':state.get('Paused') is True,'restarting':state.get('Restarting') is True,'oomKilled':state.get('OOMKilled') is True,'dead':state.get('Dead') is True,'pid':int(state.get('Pid',0)),'exitCode':int(state.get('ExitCode',0)),'stateErrorPresent':bool(error),'stateErrorSha256':hashlib.sha256(error.encode()).hexdigest() if error else None,'stateErrorAllowlistedCodes':[code for code in codes if re.search(r'(?<![A-Z_])'+code+r'(?![A-Z_])',error)],'rawStateErrorRetained':False,'environmentOrCredentialsRetained':False}
 for key in ['StartedAt','FinishedAt']:
  value=state.get(key,'')
  row[key]=value if re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z',value) else None
 image=payload.get('Image','');row['image']=image if re.fullmatch(r'sha256:[a-f0-9]{64}',image) else None
 return row

def capture_container_state(role,checkpoint,payload=None):
 # This read-only diagnostic must never replace the first examination failure.
 try:
  if payload is None:
   response=subprocess.run(['docker','inspect',NAMES[role]],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,timeout=10,check=False)
   if response.returncode:return
   payload=json.loads(response.stdout)[0]
  row=safe_container_state(role,payload,checkpoint);row.update(stage=stage,frontendPhase=front_phase)
  container_lifecycle.append(row)
  # The first failure is immutable. Later lifecycle observations are separate.
  # State.Error is classified in memory before any container is removed.
  if payload.get('State',{}).get('Error'):
   capture_first_docker_error(OUT,payload['State']['Error'],
                             source='CONTAINER_STATE_ERROR',args=['docker','inspect',NAMES[role]])
  (OUT/'container-lifecycle.json').write_text(json.dumps({'schema':'work8-container-lifecycle-v1','snapshots':container_lifecycle,'rawInspectOrEnvironmentRetained':False},indent=2)+'\n')
 except Exception:result.setdefault('optionalDiagnosticUnavailable',[]).append('container-state:'+role)
def sanitized_browser_stderr(text):
 prefix='WORK8_BROWSER_DIAGNOSTIC '
 keys={'stage','firstFailure','name','code','sourceFrames','browserConnected','ownerPageClosed','arbitraryErrorValuesRetained'}

 rows=[];omitted=0
 for line in text.splitlines():
  try:
   assert line.startswith(prefix)
   row=json.loads(line[len(prefix):]);assert set(row)==keys
   assert re.fullmatch('[A-Z_]{1,80}',row['stage']) and row['firstFailure'] is True
   assert row['name'] in ['Error','AssertionError','TypeError','TimeoutError','OTHER_ERROR']
   assert re.fullmatch('[A-Z][A-Z0-9_]{3,90}',row['code'])
   assert isinstance(row['sourceFrames'],list) and len(row['sourceFrames'])<=8 and all(re.fullmatch(r'browser\.mjs:[0-9]+:[0-9]+',frame) for frame in row['sourceFrames'])
   assert type(row['browserConnected']) is bool and (row['ownerPageClosed'] is None or type(row['ownerPageClosed']) is bool) and row['arbitraryErrorValuesRetained'] is False
   rows.append(row)
  except Exception:omitted+=1
 return {'schema':'work8-browser-sanitized-stderr-v1','stream':'stderr','diagnostics':rows[:1],'unclassifiedLinesOmitted':omitted,'arbitraryStderrRetained':False}

def marker(name,timeout=210):
 deadline=time.monotonic()+timeout
 while not (PRIVATE/'control'/name).exists():
  assert time.monotonic()<deadline,'PHASE_DEADLINE:'+name
  for role in ['backend','browser']:
   if role=='browser' and (PRIVATE/'control/browser-complete.json').exists():continue
   if NAMES[role] in created:
    payload=inspect(NAMES[role])
    if not payload['State']['Running']:
     capture_container_state(role,'first-observed-exit',payload)
     failure=PRIVATE/'control/browser-first-failure.json'
     if role=='browser' and failure.exists():
      first=json.loads(failure.read_text())
      if isinstance(first.get('code'),str) and re.fullmatch('[A-Z0-9_:-]{1,160}',first['code']):raise AssertionError('BROWSER_FIRST_FAILURE:'+first['code'])
     raise AssertionError('CONTAINER_EXITED:'+role)
  time.sleep(.2)
def signal(name,value={'ok':True}):return private_write(PRIVATE/'control'/name,value)
def independent_readbacks(phase,capture=False):
 # Always attempt both independent scopes before releasing a comparison gate.
 # A failed commerce assertion cannot suppress control/generation diagnostics.
 outcomes={}
 scripts=(['capture-canonical-persistence.mjs'] if capture else [])+['offline-commerce-readback.mjs','whole-app-readback.mjs']
 for script in scripts:
  try:run(['docker','exec',NAMES['backend'],'node','/examination/'+script,phase,*([STAGE_NAME] if script=='whole-app-readback.mjs' else [])]);outcomes[script]='PASS'
  except Exception:outcomes[script]='FAIL'
 (PRIVATE/'evidence'/(phase+'-independent-gate.json')).write_text(json.dumps({'phase':phase,'outcomes':outcomes,'allPassed':all(v=='PASS' for v in outcomes.values()),'attempts':1},indent=2)+'\n')
 return all(v=='PASS' for v in outcomes.values())
def set_policy(released):
 p=PRIVATE/'policy/control.json'
 import datetime
 expiry_ms=TIME_BUDGET['stageDeadlineEpochMs']-(60 if PREFLIGHT else 390)*1000
 if not released:p.unlink()
 else:
  assert expiry_ms>time.time()*1000,'CAMPAIGN_EXAMINATION_BOUND'
  expires=datetime.datetime.fromtimestamp(expiry_ms/1000,datetime.timezone.utc).isoformat()
  v={'schema':1,'mode':'RELEASED','approvalSha256':CONTRACT['authority']['ownerApprovalReceiptSHA256'],'expiresAt':expires}
  q=p.with_suffix('.tmp');q.write_text(json.dumps(v));q.chmod(0o444);run(['sudo','-n','chown','0:0',str(q)]);q.replace(p)
 policy_lifecycle.append({'mode':'RELEASED' if released else 'RESTRICTED','observedAtEpochMs':int(time.time()*1000),'absoluteReleaseExpiryEpochMs':expiry_ms,'releaseExpiryExtended':False,'privatePolicyPresent':p.exists()})
 (OUT/'owner-policy-lifecycle.json').write_text(json.dumps({'schema':'work8-v95-bounded-owner-policy-lifecycle-v1','stage':STAGE_NAME,'maximumReleaseWindowSeconds':STAGE_SECONDS-(60 if PREFLIGHT else 390),'transitions':policy_lifecycle},indent=2)+'\n')
def capture_frontend_origin(require_contract=False):
 if NAMES['frontend'] not in created:return
 state=inspect(NAMES['frontend'])['State']
 (PRIVATE/'evidence'/('frontend-startup-'+str(front_phase)+'.json')).write_text(json.dumps({'phase':front_phase,'running':bool(state['Running']),'exitCode':int(state['ExitCode']),'oomKilled':bool(state['OOMKilled']),'originGuardEvidenceReusedFromAcceptedRun':41205128907,'observerReinstalled':False,'reuseAdjudicationSHA256':next(x['sha256'] for x in SOURCE_BINDING['evidenceReferences'] if x['reference']=='source-evidence/a5-reuse-adjudication.json'),'historicalObserverActive':False,'historicalBrowserReceiptSHA256':'46750f529abcc7641c9ea1c5e1d44e4f246230d9516a05e96e6a572049cdb3da','historicalHttpReceiptSHA256':'d769a180c294e49db6869aaf80b192c60c02593efa0f76a18afcc3b771f7ca0b'},indent=2))

def start_front(role,phase):
 global front_phase
 if NAMES['frontend'] in created:
  capture_frontend_origin(require_contract=True)
  capture_container_state('frontend','before-version-switch')
  run(['docker','rm','-f',NAMES['frontend']]);created.remove(NAMES['frontend'])
 front_phase=phase
 package_dir=ROOT/'verified-standalone'/role
 run(current_packages.frontend_argv(role,package_dir,name=NAMES['frontend'],anchor=NAMES['anchor'],label=LABEL,script_dir=SCRIPT))
 created.append(NAMES['frontend'])
 actual=inspect(NAMES['frontend']);assert actual['Image']==images['backend'] and not actual['HostConfig']['PortBindings']
 assert actual['Config']['Entrypoint']==['/frontend/runtime/bin/node'],'EXACT_FRONTEND_BUNDLED_NODE_ENTRYPOINT'
 assert actual['HostConfig']['ReadonlyRootfs'] and actual['Config']['User']=='65534:65534','FRONTEND_ORIGINAL_ISOLATION_REQUIRED'
 deadline=time.monotonic()+90
 while True:
  assert time.monotonic()<deadline,'FRONTEND_STARTUP_DEADLINE'
  r=subprocess.run(['docker','exec',NAMES['anchor'],'node','--dns-result-order=ipv4first','-e',"fetch('http://localhost:43117/login').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=5)
  if r.returncode==0:break
  time.sleep(.5)
 listener_code="""const fs=require('fs'),dns=require('dns');const bindings=[];for(const [file,family]of [['/proc/net/tcp',4],['/proc/net/tcp6',6]])for(const line of fs.readFileSync(file,'utf8').trim().split('\\n').slice(1)){const fields=line.trim().split(/\\s+/),[address,port]=fields[1].split(':');if(fields[3]==='0A'&&parseInt(port,16)===43117)bindings.push({family,addressHex:address,port:43117});}dns.lookup('localhost',{all:true},(error,addresses)=>{if(error)process.exit(1);console.log(JSON.stringify({nodeVersion:process.version,hostname:process.env.HOSTNAME,dnsResultOrder:dns.getDefaultResultOrder(),addresses,bindings}));});"""
 listener=json.loads(run(['docker','exec','--env','NODE_OPTIONS=--dns-result-order=ipv4first',NAMES['frontend'],'/frontend/runtime/bin/node','-e',listener_code]))
 assert listener['nodeVersion']=='v22.23.2' and listener['hostname']=='localhost' and listener['dnsResultOrder']=='ipv4first'
 assert listener['addresses'][0]['address']=='127.0.0.1' and any(x['family']==4 and x['addressHex']=='0100007F' for x in listener['bindings']),'LOCALHOST_IPV4_LISTENER_NOT_ESTABLISHED'
 (PRIVATE/'evidence'/('frontend-listener-'+phase+'.json')).write_text(json.dumps(listener,indent=2))

try:
 QUALIFICATION=execution_contract.pinned_json(ROOT/'native-qualification.json',CONTRACT['nativeQualificationSHA256'])
 assert run(['docker','info','--format','{{.ID}}']).strip()==QUALIFICATION['dockerEngineId'],'QUALIFIED_DOCKER_ENGINE_CHANGED'
 assert run(['node','--version']).strip()=='v22.23.2','EXACT_HOST_NODE_VERSION_REQUIRED'
 assert MANIFEST==execution_contract.SOURCES,'CONTROLLER_COMPONENT_SOURCE_PINS_CHANGED'
 assert MANIFEST['normal']['commit']!=MANIFEST['recovery']['commit']
 SOURCE_BINDING=execution_contract.verify_source_identity(ROOT,CONTRACT)
 (OUT/'exact-components.json').write_text(json.dumps(MANIFEST,indent=2))
 if True:
  stage='verify-complete-current-package-delivery'
  backend=current_packages.load_backend(ROOT/'artifacts'/current_packages.BACKEND['file'],run)
  images={'backend':backend['image']}
  components={'backend':{**MANIFEST['backend'],**backend}}
  target=ROOT/'verified-standalone'
  if PREFLIGHT:
   target.mkdir(mode=0o755,exist_ok=False)
   for role in ['normal','recovery']:
    components[role]={**MANIFEST[role],**current_packages.verify_frontend(ROOT/'artifacts'/current_packages.FRONTENDS[role]['file'],role,destination=target/role)}
  else:
   # Verify extracted immutable bytes again; do not overwrite a prior extraction.
   for role in ['normal','recovery']:
    components[role]={**MANIFEST[role],**current_packages.verify_frontend(ROOT/'artifacts'/current_packages.FRONTENDS[role]['file'],role)}
    current_packages.verify_extracted_frontend(ROOT/'artifacts'/current_packages.FRONTENDS[role]['file'],role,target/role)
  for role in ['normal','recovery']:
   components[role]['packagedAndIndependentlyReadBackBeforeUTC']=SOURCE_BINDING['packagedAndIndependentlyReadBackBeforeUTC']
   components[role]['packageReadbackEvidenceSHA256']=SOURCE_BINDING['packageReadbackEvidenceSHA256']
  for name,reference in execution_contract.DEPENDENCY_IMAGES.items():
   actual=inspect_image(reference)
   assert actual['Os']=='linux' and actual['Architecture']=='amd64' and any(value.endswith('@'+reference.split('@',1)[1]) for value in actual.get('RepoDigests',[])),'EXACT_LOADED_DEPENDENCY_IMAGE_REQUIRED'
  (OUT/'current-package-import.json').write_text(json.dumps({'schema':'work8-v62-current-package-import-v1','status':'PASS_EXACT_CURRENT_PACKAGES_AND_DEPENDENCIES','components':components,'dependencyImages':execution_contract.DEPENDENCY_IMAGES,'sourceDeliverySHA256':CONTRACT['packageDeliverySHA256'],'packagesRebuilt':False},indent=2)+'\n')
  for d in ['control','evidence','policy']:(PRIVATE/d).mkdir(mode=0o700)
  (PRIVATE/'policy').chmod(0o755);(PRIVATE/'evidence').chmod(0o755)
  reused_handoff={'schema':'work8-v30-reused-private-handoff-v1','runId':41256737269,'controller':'deb35b6b70e4c6aa95fe7a587483fa654a26cdbe','acceptedChecks':25,'repeatedChecks':0,'receiptSha256':'1ea6434ced3b1977ef01e2a210e2e7eff473776499c2ffcf0794cb70ff6c1fe5','independentReviewSha256':'c46d645a3dcec606946ce5a478d16207bda9dc3ad2a8c471dd1c189700db32e9','newExchangeNames':['capture-live-brain.json','live-brain-baseline.json','live-brain-captured.json'],'coreHandoffUnchanged':True}
  (OUT/'reused-private-handoff.json').write_text(json.dumps(reused_handoff,indent=2)+'\n')
  result['phaseAStatus']='NATIVE_LIVE_BRAIN_PREFLIGHT_PENDING' if PREFLIGHT else 'INDEPENDENT_HOSTED_LIVE_BRAIN_PREFLIGHT_ACCEPTED'
  stage='original-mounted-entrypoint-contract-before-startup'
  operator_mounts=verify_mounted_entrypoints(PRIVATE,SCRIPT,images['backend'],LABEL,run,inspect,created,OUT)
  if PREFLIGHT:
   reused_module=json.loads((SCRIPT/'v32-reused-module-preflight.json').read_text())
   assert reused_module['status']=='PASS_ACTUAL_SQLJS_MODULE_LIFECYCLE' and len(reused_module['checks'])==10
   (OUT/'accepted-module-preflight-reused.json').write_text(json.dumps({'schema':'work8-v32-reused-module-proof-v1','runId':41269718274,'checks':10,'repeated':False,'receiptSha256':hashlib.sha256((SCRIPT/'v32-reused-module-preflight.json').read_bytes()).hexdigest(),'nativeApplicationProofRequiredSeparately':True},indent=2)+'\n')
   assert TIME_BUDGET['stageDeadlineEpochMs']-time.time()*1000>600000,'INSUFFICIENT_NATIVE_PREFLIGHT_CAPACITY'
  else:
   assert TIME_BUDGET['stageDeadlineEpochMs']-time.time()*1000>1300000,'INSUFFICIENT_REMAINING_ACCEPTANCE_CAPACITY'
  private_write(PRIVATE/'control/native-time-budget.json',TIME_BUDGET)
  private_write(PRIVATE/'control/component-identities.json',components)
  values={key:secrets.token_hex(32) for key in ['founder','admin','session','redis']};generated=list(values.values())
  (PRIVATE/'backend.env').write_text('EXPECTED_BACKEND='+MANIFEST['backend']['commit']+'\nFOUNDER_PASSWORD='+values['founder']+'\nADMIN_PASSWORD='+values['admin']+'\nSESSION_SECRET='+values['session']+'\nREDIS_URL=redis://:'+values['redis']+'@transition-redis:6379/0\n')
  (PRIVATE/'browser.env').write_text('OWNER_PASSWORD='+values['founder']+'\nEXPECTED_BACKEND='+MANIFEST['backend']['commit']+'\nEXAM_ID='+CONTRACT['campaignId']+'\n')
  (PRIVATE/'redis.conf').write_text('bind 0.0.0.0\nprotected-mode yes\nsave ""\nappendonly no\nrequirepass '+values['redis']+'\n');(PRIVATE/'redis.conf').chmod(0o444)
  (PRIVATE/'backend.env').chmod(0o600);(PRIVATE/'browser.env').chmod(0o600)
  stage='native-preflight-application-start' if PREFLIGHT else 'phase-b-authorised-application-start';result['phaseBStarted']=not PREFLIGHT
  set_policy(True);run(['docker','network','create','--internal','--label','work8.native='+LABEL,NETWORK]);network_created=True
  run(['docker','run','-d','--name',NAMES['redis'],'--label','work8.native='+LABEL,'--pull','never','--network',NETWORK,'--network-alias','transition-redis','--memory','128m','--cpus','0.5','--pids-limit','64','--read-only','--user','999:999','--cap-drop','ALL','--security-opt','no-new-privileges','--tmpfs','/data:rw,noexec,nosuid,size=32m','--mount','type=bind,src='+str(PRIVATE/'redis.conf')+',dst=/redis.conf,readonly',REDIS,'redis-server','/redis.conf']);created.append(NAMES['redis'])
  run(['docker','run','-d','--name',NAMES['anchor'],'--label','work8.native='+LABEL,'--pull','never','--network',NETWORK,'--memory','64m','--cpus','0.1','--pids-limit','32','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges',NODE,'node','-e','setTimeout(()=>process.exit(0),Math.max(0,'+str(TIME_BUDGET['stageDeadlineEpochMs'])+'-Date.now()))'],timeout=30);created.append(NAMES['anchor'])
  cmd=['docker','run','-d','--name',NAMES['backend'],'--label','work8.native='+LABEL,'--pull','never','--network',NETWORK,'--network-alias','native-backend','--memory','5g','--cpus','2','--pids-limit','256',*backend_options(PRIVATE,SCRIPT),'--env-file',str(PRIVATE/'backend.env')]
  for overlay_source,overlay_target in operator_mounts:cmd+=['--mount','type=bind,src='+str(overlay_source)+',dst='+overlay_target+',readonly']
  cmd+=['--entrypoint','timeout',images['backend'],'--signal=KILL',str(child_timeout('coordinator'))+'s','node','/examination/coordinator.mjs'];run(cmd,timeout=30);created.append(NAMES['backend'])
  live_contract={'schema':'work8-v30-private-contract-v1','acceptedHandoffReused':True,'onlyAddedApplicationMounts':[dest for _,dest in operator_mounts],'backend':safe_docker_contract(inspect(NAMES['backend']))}
  assert live_contract['backend']['user']=='0:0' and live_contract['backend']['readOnlyRootfs'] is True and live_contract['backend']['privileged'] is False
  accepted_private_contract=json.loads((SCRIPT/'accepted-v29-private-contract.json').read_text())
  underlying_contract={**live_contract['backend'],'mounts':[m for m in live_contract['backend']['mounts'] if m['destination'] not in {dest for _,dest in operator_mounts}]}
  assert underlying_contract==accepted_private_contract['backend'],'ACCEPTED_PRIVATE_BACKEND_CONTRACT_CHANGED'
  assert all(next(m for m in live_contract['backend']['mounts'] if m['destination']==dest)['rw'] is False for _,dest in operator_mounts)
  (OUT/'phase-b-private-contract.json').write_text(json.dumps(live_contract,indent=2)+'\n')
  stage='actual-runtime-start';marker('runtime-ready.json',timeout=245)
  meta=inspect(NAMES['backend']);assert not meta['HostConfig']['PortBindings'];assert next(m for m in meta['Mounts'] if m['Destination']=='/run/empire-policy')['RW'] is False
  if PREFLIGHT:
   stage='retained-v98-frontend-startup-evidence'
   reused_frontend=execution_contract.frontend_reuse_receipt(CONTRACT['retainedEvidence'],current_packages.BACKEND,current_packages.FRONTENDS)
   reused_frontend['retainedEvidenceSHA256']=CONTRACT['retainedEvidenceSHA256']
   (OUT/'frontend-native-qualification.json').write_text(json.dumps(reused_frontend,indent=2)+'\n')
   stage='actual-initialized-native-live-brain-capture';signal('capture-live-brain.json',{'mode':'PREFLIGHT'});marker('live-brain-captured.json',timeout=75)
   assert json.loads((PRIVATE/'evidence/live-brain-capture.json').read_text())['status']=='PASS_ACTUAL_NATIVE_LIVE_BRAIN_PREFLIGHT'
   stage='new-private-capture-exchanges-refusal-controls'
   wrong_reader_code="const fs=require('fs'),assert=require('assert/strict');assert.equal(process.getuid(),65533);assert.match(fs.readFileSync('/proc/self/status','utf8'),/^CapEff:\\s*0000000000000000$/m);let denied=0;for(const p of ['/data/work8-exam/native-transition/live-brain/requests/request.json','/data/work8-exam/native-transition/live-brain/receipts/ready.json','/data/work8-exam/native-transition/live-brain/receipts/capture.json','/control/live-brain-baseline.json']){try{fs.readFileSync(p)}catch(e){assert.equal(e.code,'EACCES');denied++}}assert.equal(denied,4);console.log(JSON.stringify({status:'PASS_WRONG_PRINCIPAL_REFUSED',uid:process.getuid(),gid:process.getgid(),refusals:denied,rawContents:false}))"
   wrong_reader=json.loads(run(['docker','exec','--user','65533:65533',NAMES['backend'],'node','-e',wrong_reader_code]))
   writer_refusal_code="const fs=require('fs'),assert=require('assert/strict');assert.equal(process.getuid(),65534);assert.match(fs.readFileSync('/proc/self/status','utf8'),/^CapEff:\\s*0000000000000000$/m);let denied=0;for(const p of ['/data/work8-exam/native-transition/live-brain/requests/request.json','/app/backend/dist/index.js','/run/empire-policy/control.json']){try{const fd=fs.openSync(p,fs.constants.O_WRONLY);fs.closeSync(fd)}catch(e){assert.ok(['EACCES','EROFS','EPERM'].includes(e.code));denied++}}assert.equal(denied,3);console.log(JSON.stringify({status:'PASS_CAPTURE_REQUEST_SOURCE_POLICY_WRITES_REFUSED',uid:process.getuid(),gid:process.getgid(),refusals:denied,rawContents:false}))"
   writer_refusal=json.loads(run(['docker','exec','--user','65534:65534',NAMES['backend'],'node','-e',writer_refusal_code]))
   (OUT/'new-private-capture-channel-controls.json').write_text(json.dumps({'status':'PASS_NEW_CAPTURE_EXCHANGES_ONLY','wrongReader':wrong_reader,'writerRefusals':writer_refusal,'previous25CheckSuiteRepeated':False},indent=2)+'\n')
   run(['docker','exec',NAMES['backend'],'node','/examination/whole-app-readback.mjs','normal',STAGE_NAME])
   stage='native-preflight-orderly-drain';signal('stop-runtime.json');marker('runtime-drained.json')
   run(['docker','exec',NAMES['backend'],'node','/examination/whole-app-readback.mjs','final',STAGE_NAME])
   signal('readback-complete.json')
   deadline=time.monotonic()+20
   while inspect(NAMES['backend'])['State']['Running']:assert time.monotonic()<deadline;time.sleep(.2)
   assert inspect(NAMES['backend'])['State']['ExitCode']==0
   result.update(status='PASS_ACTUAL_NATIVE_LIVE_BRAIN_PREFLIGHT_AWAITING_INDEPENDENT_REVIEW',phaseAStatus='PASS_ACTUAL_NATIVE_LIVE_BRAIN_PREFLIGHT',phaseBStarted=False,businessTransitionStarted=False,frontendStarted=False,frontendQualificationReused=True,preflightStateIsFullLifecycleBaseline=False,applicationImagesRebuilt=False,wholeRowsAccepted=[])
  else:
   run(['docker','exec','--user','65534:65534',NAMES['backend'],'node','-e',"const fs=require('fs');let denied=false;try{fs.writeFileSync('/run/empire-policy/control.json','forbidden')}catch(e){denied=['EROFS','EACCES','EPERM'].includes(e.code)}if(!denied)process.exit(1)"])
   (PRIVATE/'evidence/isolation.json').write_text(json.dumps({'internalNetwork':True,'publishedPorts':False,'externalCredentials':False,'policyReadonlyMount':True,'runtimePolicyWriteRefused':True,'actualNativeApplication':True,'syntheticOwnerOnly':True,'components':components},indent=2))
   start_front('normal','NORMAL');stage='normal-view'
   run(['docker','run','-d','--name',NAMES['browser'],'--label','work8.native='+LABEL,'--pull','never','--network','container:'+NAMES['anchor'],'--memory','2g','--cpus','1','--pids-limit','128','--shm-size','256m',*browser_options(PRIVATE,SCRIPT,ROOT/'native-transition-driver'),'--env-file',str(PRIVATE/'browser.env'),'--entrypoint','timeout',BROWSER,'--signal=KILL',str(child_timeout('browser'))+'s','node','/examination/browser.mjs'],timeout=30);created.append(NAMES['browser'])
   live_contract['browser']=safe_docker_contract(inspect(NAMES['browser']))
   assert live_contract['browser']==accepted_private_contract['browser'],'ACCEPTED_PRIVATE_BROWSER_CONTRACT_CHANGED'
   live_contract['status']='PASS_ACCEPTED_PRIVATE_CONTRACT_WITH_REVIEWED_READONLY_STARTUP_OBSERVERS';(OUT/'phase-b-private-contract.json').write_text(json.dumps(live_contract,indent=2)+'\n')
   # Container Date.now observations use the same kernel realtime clock; no clock changes.
   clock_ids={}
   for role in ['backend','browser']:
    clock_ids[role]=run(['docker','exec',NAMES[role],'node','-e',"console.log(require('fs').readlinkSync('/proc/self/ns/time'))"]).strip()
   clock_ids['host']=os.readlink('/proc/self/ns/time')
   assert len(set(clock_ids.values()))==1,'TIME_NAMESPACE_NOT_SHARED'
   (PRIVATE/'evidence/observation-clock-contract.json').write_text(json.dumps({'schema':'work8-v28-observation-clock-v1','timeNamespaces':clock_ids,'sameKernelRealtime':True,'clockModification':False,'browserClockSource':'Node Date.now around frontend response','backendClockSource':'source-pinned Date.now; financial.cutoffAt lower bound; status second read'},indent=2)+'\n')
   marker('normal-observed.json',timeout=150)
   stage='actual-live-brain-baseline';signal('capture-live-brain.json',{'mode':'BASELINE'});marker('live-brain-captured.json',timeout=75)
   normal_ok=independent_readbacks('normal',capture=True);signal('normal-readback-ready.json',{'allPassed':normal_ok})
   marker('normal-complete.json');assert normal_ok,'NORMAL_INDEPENDENT_READBACK_FAILED'
   stage='recovery-version';set_policy(False);start_front('recovery','RECOVERY');signal('recovery-ready.json');marker('recovery-complete.json')
   assert independent_readbacks('recovery'),'RECOVERY_INDEPENDENT_READBACK_FAILED'
   stage='normal-return-version';start_front('normal','NORMAL_RETURN');set_policy(True);signal('return-ready.json');marker('returned-observed.json')
   returned_ok=independent_readbacks('returned',capture=True);signal('returned-readback-ready.json',{'allPassed':returned_ok})
   marker('replayed-observed.json');assert returned_ok,'RETURNED_INDEPENDENT_READBACK_FAILED'
   replayed_ok=independent_readbacks('replayed',capture=True);signal('replayed-readback-ready.json',{'allPassed':replayed_ok})
   marker('browser-complete.json');assert replayed_ok,'REPLAYED_INDEPENDENT_READBACK_FAILED'
   deadline=time.monotonic()+20
   while inspect(NAMES['browser'])['State']['Running']:assert time.monotonic()<deadline;time.sleep(.2)
   assert inspect(NAMES['browser'])['State']['ExitCode']==0
   capture_frontend_origin(require_contract=True)
   stage='drain-and-independent-readback';signal('stop-runtime.json');marker('runtime-drained.json')
   assert independent_readbacks('final'),'FINAL_INDEPENDENT_READBACK_FAILED'
   signal('readback-complete.json')
   deadline=time.monotonic()+20
   while inspect(NAMES['backend'])['State']['Running']:assert time.monotonic()<deadline;time.sleep(.2)
   assert inspect(NAMES['backend'])['State']['ExitCode']==0
   result.update(status='PASS_AWAITING_INDEPENDENT_TECHNICAL_REVIEW',distinctFrontendTransition=True,newerCommittedRecordsPreserved=True,canonicalBusinessData=True,wholeRowsAccepted=[],independentAuditLogLifecycleReviewRequired=True,candidateBytes=candidate_packages.directory_bytes(ROOT/'artifacts'))
except Exception as error:
 # Retain the host exception separately from earlier child observations and
 # before cleanup. Diagnostic write failure cannot replace the original error.
 result['controllerFailurePreserved']=preserve_controller_failure(OUT,error,stage,STAGE_NAME,
     make_failure=from_error,parse_browser=sanitized_browser_stderr,
     browser_file=PRIVATE/'control/browser-first-failure.json')
 causal=PRIVATE/'evidence/first-native-failure.json'
 if causal.is_file() and not causal.is_symlink() and causal.stat().st_size<=16384:
  try:save_first(OUT,sanitize(json.loads(causal.read_text())))
  except Exception:pass
 save_first(OUT,from_error(error,stage,'EXAMINATION_ASSERTION'));emit_fallback(OUT)
 result['failedStage']=stage;result['error']='SAFE_FIRST_CAUSAL_RECEIPT_RETAINED'
 if result['phaseAStatus']=='RUNNING':result['phaseAStatus']='FAIL'
 if getattr(error,'safe_handoff',None):(OUT/'host-private-handoff-first-failure.json').write_text(json.dumps(error.safe_handoff,indent=2)+'\n')
finally:
 for role in ['backend','frontend','redis','anchor','browser','module']:capture_container_state(role,'before-cleanup')
 stage='cleanup';cleanup_ok=True
 try:capture_frontend_origin()
 except Exception:result.setdefault('optionalDiagnosticUnavailable',[]).append('frontend-origin')
 # Capture bounded sanitized failure evidence even if `docker run` created the
 # named container but failed before returning a successful start receipt.
 for role in ['backend','browser']:
  try:
   log=subprocess.run(['docker','logs',NAMES[role]],stdout=subprocess.PIPE,stderr=subprocess.PIPE if role=='browser' else subprocess.STDOUT,text=True,timeout=10)
   if log.returncode==0:
    if role=='browser':
     stderr=sanitized_browser_stderr(log.stderr)
     (OUT/'browser-stderr-sanitized.json').write_text(json.dumps(stderr,indent=2)+'\n')
     (OUT/'browser-container.log').write_text(''.join('WORK8_BROWSER_DIAGNOSTIC '+json.dumps(row)+'\n' for row in stderr['diagnostics']))
    else:
     native=parse_stream(log.stdout)
     if native:save_first(OUT,native)
     (OUT/(role+'-container.log')).write_text(json.dumps({'schema':'work8-v31-container-output-metadata-v1','safeNativeFailure':native,'rawOutputSha256':hashlib.sha256(log.stdout.encode()).hexdigest(),'rawOutputRetained':False},indent=2)+'\n')
  except (subprocess.TimeoutExpired,OSError):result.setdefault('optionalDiagnosticUnavailable',[]).append(role)
 try:
  own=subprocess.run(['docker','ps','-aq','--filter','label=work8.native='+LABEL],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=10,check=True).stdout.split()
  assert all(re.fullmatch('[a-f0-9]{12,64}',x) for x in own)
  if own:subprocess.run(['docker','rm','-fv',*own],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=30,check=True)
  remaining=subprocess.run(['docker','ps','-aq','--filter','label=work8.native='+LABEL],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=10,check=True).stdout.strip()
  assert not remaining,'CAMPAIGN_CONTAINERS_REMAIN'
 except:cleanup_ok=False
 if network_created:
  try:subprocess.run(['docker','network','rm',NETWORK],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=20,check=True)
  except:cleanup_ok=False
 try:
  assert not subprocess.run(['docker','network','ls','-q','--filter','label=work8.native='+LABEL],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=10,check=True).stdout.strip()
 except:cleanup_ok=False
 handoff=transfer_private_evidence(PRIVATE/'evidence',OUT,stage=STAGE_NAME,
                                  redact=redact,generated=generated,
                                  save_first=save_first,sanitize=sanitize)
 result['evidenceHandoff']=handoff
 if handoff['status']!='PASS_SANITIZED_PRIVATE_EVIDENCE_HANDOFF':result['status']='FAIL'
 result['temporaryContainersAndNetworkRemoved']=cleanup_ok
 if not cleanup_ok:result['status']='FAIL'
 # Exact newly-generated secrets must never enter the upload set.
 for p in OUT.iterdir():
  if p.suffix in ['.json','.log','.txt']:
   text=p.read_text();assert not any(secret in text for secret in generated),'SECRET_OUTPUT_REFUSED'
 subprocess.run(['sudo','-n','rm','-rf','--one-file-system','--',str(PRIVATE)],check=True)
 result['privateTemporaryDataRemoved']=not PRIVATE.exists();result['elapsedSeconds']=round(time.monotonic()-START,3)
 result_name='runner-result.json'
 (OUT/result_name).write_text(json.dumps(result,indent=2)+'\n')
 index=[]
 for p in sorted(OUT.iterdir()):
  if p.name=='artifact-index.json':continue
  assert p.is_file() and not p.is_symlink(),'NONREGULAR_ARTIFACT_REFUSED'
  index.append({'path':p.name,'bytes':p.stat().st_size,'sha256':hashlib.file_digest(p.open('rb'),'sha256').hexdigest()})
 (OUT/'artifact-index.json').write_text(json.dumps({'schema':'work8-bounded-upload-v1','exactGeneratedSecretCheck':True,'maxBytes':candidate_packages.MAX_BYTES,'stageMaximumArtifactBytes':MAX_OUTPUT,'files':index},indent=2)+'\n')
 assert output_bytes()<=MAX_OUTPUT-candidate_packages.ZIP_ENVELOPE_RESERVE,'TOTAL_PAYLOAD_BYTES_BOUND'
 if result['status'].startswith('FAIL'):emit_fallback(OUT);raise SystemExit(1)
