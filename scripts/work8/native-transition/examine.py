#!/usr/bin/env python3
"""One fresh, bounded full-native distinct-version examination. No provider keys."""
import hashlib, io, json, os, pathlib, re, secrets, shutil, subprocess, sys, tarfile, tempfile, time
import candidate_packages
import packaging_corrections
from origin_contract import verify_origin_observations

ROOT=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve()
SCRIPT=ROOT/'controller/scripts/work8/native-transition'
PHASE=sys.argv[1] if len(sys.argv)==2 else '';assert PHASE in {'--prepare-candidates','--examine-retained'},'EXPLICIT_EXAMINATION_PHASE_REQUIRED'
OUT=ROOT/'native-transition-output';OUT.mkdir(exist_ok=PHASE=='--examine-retained')
PRIVATE=pathlib.Path(tempfile.mkdtemp(prefix='work8-native-transition-',dir=os.environ['RUNNER_TEMP']))
MANIFEST=json.loads((SCRIPT/'components.json').read_text())
LABEL='work8-native-'+os.environ['GITHUB_RUN_ID']
NAMES={x:LABEL+'-'+x for x in ['backend','frontend','redis','anchor','browser']}
NETWORK=LABEL+'-network';network_created=False;created=[];images={};generated=[];front_phase=None
NODE='node:22.23.2-bookworm-slim@sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9'
REDIS='redis:7.4.2-alpine@sha256:02419de7eddf55aa5bcf49efb74e88fa8d931b4d77c07eff8a6b2144472b6952'
BROWSER='mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e'
START=time.monotonic();stage='preflight';result={'status':'FAIL','wholeRowsAccepted':[],'productionAccess':False,'genuineOwnerObservation':False}
MAX_OUTPUT=candidate_packages.MAX_BYTES
container_lifecycle=[]

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

def run(args,*,cwd=None,timeout=120,log=None,input=None):
 assert time.monotonic()-START<1700,'CAMPAIGN_JOB_BOUND'
 r=subprocess.run(args,cwd=cwd,encoding=None if isinstance(input,bytes) else 'utf8',input=input,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=timeout,check=False)
 output=r.stdout.decode(errors='replace') if isinstance(r.stdout,bytes) else r.stdout
 if log:(OUT/log).write_text(redact(output)[-1048576:])
 if r.returncode:raise RuntimeError('COMMAND_FAILED:'+args[0]+':'+stage+':'+str(r.returncode))
 return output

def inspect(name):return json.loads(run(['docker','inspect',name]))[0]
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
  (OUT/'container-lifecycle.json').write_text(json.dumps({'schema':'work8-container-lifecycle-v1','snapshots':container_lifecycle,'rawInspectOrEnvironmentRetained':False},indent=2)+'\n')
 except Exception:result.setdefault('optionalDiagnosticUnavailable',[]).append('container-state:'+role)
def sanitized_browser_stderr(text):
 prefix='WORK8_BROWSER_DIAGNOSTIC '
 keys={'stage','firstFailure','name','code','operator','firstSafeMessage','sourceFrames','browserConnected','ownerPageClosed','arbitraryErrorValuesRetained'}
 messages={'FETCH_TYPE_ERROR':r'page\.evaluate: TypeError: Failed to fetch','EXECUTION_CONTEXT_DESTROYED':r'Execution context was destroyed','BROWSER_TARGET_CLOSED':r'Target page, context or browser has been closed','NAVIGATION_NETWORK_ERROR':r'page\.goto: net::ERR_[A-Z_]+','BROWSER_TIMEOUT':r'Timeout [0-9]+ms exceeded','ERR_ASSERTION':r'Sensitive message and assertion values withheld','UNCLASSIFIED_ERROR':r'Sensitive message and assertion values withheld'}
 rows=[];omitted=0
 for line in text.splitlines():
  try:
   assert line.startswith(prefix)
   row=json.loads(line[len(prefix):]);assert set(row)==keys
   assert re.fullmatch('[a-z_-]{1,80}',row['stage']) and row['firstFailure'] is True
   assert row['name'] in ['Error','AssertionError','TypeError','TimeoutError','OTHER_ERROR']
   assert row['code'] in messages and re.fullmatch(messages[row['code']],row['firstSafeMessage'])
   assert row['operator'] in [None,'strictEqual','deepStrictEqual','==','!=','===','!==','match']
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
     raise AssertionError('CONTAINER_EXITED:'+role)
  time.sleep(.2)
def signal(name,value={'ok':True}):(PRIVATE/'control'/name).write_text(json.dumps(value))
def set_policy(released):
 p=PRIVATE/'policy/control.json'
 if not released:p.unlink();return
 import datetime
 v={'schema':1,'mode':'RELEASED','approvalSha256':hashlib.sha256(b'Final owner directive: isolated noncommercial technical version transition only').hexdigest(),'expiresAt':(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(minutes=12)).isoformat()}
 q=p.with_suffix('.tmp');q.write_text(json.dumps(v));q.chmod(0o444);run(['sudo','-n','chown','0:0',str(q)]);q.replace(p)
def capture_frontend_origin(require_contract=False):
 if NAMES['frontend'] not in created:return
 logged=run(['docker','logs',NAMES['frontend']],timeout=10)
 state=inspect(NAMES['frontend'])['State']
 allowed_codes=['MODULE_NOT_FOUND','ORIGIN_OBSERVER_CONTRACT_UNAVAILABLE','ORIGIN_OBSERVER_PHASE_REFUSED','ORIGIN_OBSERVER_PACKAGE_IDENTITY_REFUSED','ORIGIN_OBSERVER_PACKAGE_BYTES_REFUSED','ORIGIN_OBSERVER_MODULE_IDENTITY_REFUSED','EADDRINUSE','ENOTFOUND','EACCES','EROFS','EPERM','ENOENT','ECONNREFUSED']
 codes=[code for code in allowed_codes if re.search(r'(?<![A-Z_])'+code+r'(?![A-Z_])',logged)]
 known_module='/frontend/.next/server/chunks/4741.js'
 diagnostics={'phase':front_phase,'status':state['Status'] if state['Status'] in ['created','running','paused','restarting','removing','exited','dead'] else 'UNRECOGNIZED','running':bool(state['Running']),'exitCode':int(state['ExitCode']),'oomKilled':bool(state['OOMKilled']),'reportedAllowlistedCodes':codes,'knownObserverModulePath':known_module if known_module in logged else None,'arbitraryLogMessagesRetained':False,'requestHeadersRetained':False}
 (PRIVATE/'evidence'/('frontend-startup-diagnostics-'+front_phase+'.json')).write_text(json.dumps(diagnostics,indent=2))
 prefix='WORK8_ORIGIN_OBSERVER '
 observations=[json.loads(line[len(prefix):]) for line in logged.splitlines() if line.startswith(prefix)]
 role='recovery' if front_phase=='RECOVERY' else 'normal'
 package=json.loads((SCRIPT/'observer-packages.json').read_text())['packages'][role]
 verify_origin_observations(observations,front_phase,package,images[role],False)
 (PRIVATE/'evidence'/('frontend-origin-'+front_phase+'.json')).write_text(json.dumps({'historicalFailureOperandsCaptured':False,'currentExaminationOnly':True,'observations':observations},indent=2))
 verify_origin_observations(observations,front_phase,package,images[role],require_contract)

def start_front(role,phase):
 global front_phase
 if NAMES['frontend'] in created:
  capture_frontend_origin(require_contract=True)
  capture_container_state('frontend','before-version-switch')
  run(['docker','rm','-f',NAMES['frontend']]);created.remove(NAMES['frontend'])
 front_phase=phase
 run(['docker','run','-d','--name',NAMES['frontend'],'--label','work8.native='+LABEL,'--network','container:'+NAMES['anchor'],'--pull','never','--read-only','--user','65534:65534','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','1g','--cpus','1','--pids-limit','128','--env','PORT=43117','--env','HOSTNAME=localhost','--env','NODE_OPTIONS=--dns-result-order=ipv4first --require=/examination/origin-observer.cjs','--env','WORK8_OBSERVER_PHASE='+phase,'--env','WORK8_OBSERVER_ROLE='+role,'--env','WORK8_OBSERVER_IMAGE='+images[role],'--mount','type=bind,src='+str(SCRIPT)+',dst=/examination,readonly','--env','NODE_ENV=production','--env','BRAIN_API_URL=http://native-backend:43100','--env','VERCEL_GIT_COMMIT_SHA='+MANIFEST[role]['commit'],'--env','NEXT_TELEMETRY_DISABLED=1','--tmpfs','/tmp:rw,noexec,nosuid,size=32m','--tmpfs','/frontend/.next/cache:rw,noexec,nosuid,size=64m',images[role]])
 created.append(NAMES['frontend'])
 actual=inspect(NAMES['frontend']);assert actual['Image']==images[role] and not actual['HostConfig']['PortBindings']
 deadline=time.monotonic()+90
 while True:
  assert time.monotonic()<deadline,'FRONTEND_STARTUP_DEADLINE'
  r=subprocess.run(['docker','exec',NAMES['anchor'],'node','--dns-result-order=ipv4first','-e',"fetch('http://localhost:43117/login').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=5)
  if r.returncode==0:break
  time.sleep(.5)
 listener_code="""const fs=require('fs'),dns=require('dns');const bindings=[];for(const [file,family]of [['/proc/net/tcp',4],['/proc/net/tcp6',6]])for(const line of fs.readFileSync(file,'utf8').trim().split('\\n').slice(1)){const fields=line.trim().split(/\\s+/),[address,port]=fields[1].split(':');if(fields[3]==='0A'&&parseInt(port,16)===43117)bindings.push({family,addressHex:address,port:43117});}dns.lookup('localhost',{all:true},(error,addresses)=>{if(error)process.exit(1);console.log(JSON.stringify({nodeVersion:process.version,hostname:process.env.HOSTNAME,dnsResultOrder:dns.getDefaultResultOrder(),addresses,bindings}));});"""
 listener=json.loads(run(['docker','exec','--env','NODE_OPTIONS=--dns-result-order=ipv4first',NAMES['frontend'],'node','-e',listener_code]))
 assert listener['nodeVersion']=='v22.23.2' and listener['hostname']=='localhost' and listener['dnsResultOrder']=='ipv4first'
 assert listener['addresses'][0]['address']=='127.0.0.1' and any(x['family']==4 and x['addressHex']=='0100007F' for x in listener['bindings']),'LOCALHOST_IPV4_LISTENER_NOT_ESTABLISHED'
 (PRIVATE/'evidence'/('frontend-listener-'+phase+'.json')).write_text(json.dumps(listener,indent=2))

try:
 assert os.environ['GITHUB_EVENT_NAME']=='create' and os.environ['GITHUB_REF']=='refs/heads/work8/v25-20261031-return'
 event=json.load(open(os.environ['GITHUB_EVENT_PATH']));assert event['ref_type']=='branch' and event['ref']=='work8/v25-20261031-return'
 assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and os.environ['GITHUB_RUN_NUMBER']=='1'
 assert run(['node','--version']).strip()=='v22.23.2'
 assert PHASE=='--examine-retained','V25_BUILD_PATH_NOT_AUTHORISED'
 assert json.loads((OUT/'retained-import-result.json').read_text())['status']=='PASS_RETAINED_BYTES_LOADED_DRIVER_READY'
 for role in ['backend','normal','recovery']:
  entry=MANIFEST[role];source=ROOT/(role+'-source')
  assert run(['git','rev-parse','HEAD'],cwd=source).strip()==entry['commit'];assert run(['git','rev-parse','HEAD^{tree}'],cwd=source).strip()==entry['tree']
  if PHASE=='--prepare-candidates':assert not run(['git','status','--porcelain'],cwd=source).strip()
  native='backend/src/runtime/commerce-runtime/governed/work8-twin-media.ts' if role=='backend' else 'empireai-web/components/owner/work8/TwinMedia.tsx'
  expected='05e726fc9a562e591384e94a54c80f76f0294c08' if role=='backend' else '1d9a398ad3d3951207c90f0b8125034bef361e27'
  assert run(['git','rev-parse','HEAD:'+native],cwd=source).strip()==expected
 assert MANIFEST['normal']['commit']!=MANIFEST['recovery']['commit']
 (OUT/'exact-components.json').write_text(json.dumps(MANIFEST,indent=2))
 if PHASE=='--prepare-candidates':
  stage='backend-compile';src=ROOT/'backend-source'
  for command in [['npm','ci','--prefix','pillow','--no-audit','--no-fund'],['npm','ci','--prefix','backend','--no-audit','--no-fund'],['node','scripts/sync-pillow-governance.mjs'],['npm','run','build','--prefix','pillow'],['npm','run','build','--prefix','backend']]:
   run(command,cwd=src,timeout=240,log='build-'+str(len(list(OUT.glob('build-*'))))+'.log')
  context=PRIVATE/'backend-context';context.mkdir()
  archive=subprocess.check_output(['git','archive','HEAD'],cwd=src)
  with tarfile.open(fileobj=io.BytesIO(archive)) as t:t.extractall(context,filter='data')
  for package in ['backend','pillow']:
   for directory in ['dist','node_modules']:shutil.copytree(src/package/directory,context/package/directory)
  assert not (context/'.env').exists() and not (context/'backend/.env').exists()
  docker=f'''FROM {NODE} AS compiler
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev && rm -rf /var/lib/apt/lists/*
COPY deployment/native/runtime-writer-isolation.c /source.c
RUN cc -shared -fPIC -O2 -std=c11 -Wall -Wextra -Werror -Wl,-z,relro,-z,now /source.c -o /writer.so
FROM {NODE}
WORKDIR /app
COPY --chown=0:0 . /app
COPY --from=compiler /writer.so /native/runtime-writer-isolation.so
RUN chmod -R go-w /app && chmod 0444 /native/runtime-writer-isolation.so && sha256sum /native/runtime-writer-isolation.so | cut -d ' ' -f 1 > /native/native.sha256 && chmod 0444 /native/native.sha256 && mkdir -p /data/work8-exam && chmod 0755 /data /data/work8-exam
LABEL org.opencontainers.image.revision="{MANIFEST['backend']['commit']}" io.empireai.source-tree="{MANIFEST['backend']['tree']}"
USER 0:0
ENTRYPOINT ["node","/app/deployment/locked-runtime.cjs"]
'''
  (context/'Dockerfile').write_text(docker)
  # A root .dockerignore from the full application may exclude compiled inputs.
  (context/'.dockerignore').write_text('.git\n.env\n**/.env\n')
  stage='backend-exact-packaging-and-prebuild-scan'
  packaging_corrections.apply_exact_omission(context,OUT)
  (OUT/'backend-prebuild-secret-scan.json').write_text(json.dumps(candidate_packages.scan_context(context),indent=2)+'\n')
  run(['docker','build','--iidfile',str(PRIVATE/'backend.id'),str(context)],timeout=240,log='backend-image-build.log');images['backend']=(PRIVATE/'backend.id').read_text().strip()
  stage='backend-built-image-wasm-smoke'
  smoke=json.loads(run(['docker','run','--rm','--label','work8.native='+LABEL,'--network','none','--read-only','--user','65534:65534','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','512m','--cpus','0.5','--pids-limit','32','--mount','type=bind,src='+str(SCRIPT)+',dst=/examination,readonly','--entrypoint','timeout',images['backend'],'--signal=KILL','25s','node','/examination/packaging-smoke.mjs','/app/backend/node_modules/sql.js','-'],timeout=30))
  assert smoke['status']=='PASS' and smoke['nodeVersion']=='v22.23.2' and smoke['exactRetainedFileHashesVerified'] is True and smoke['removedVariantsAbsent'] is True
  smoke.update(imageId=images['backend'],networkDisabled=True,readOnlyRoot=True,runtimeUser='65534:65534',packagingPolicySha256=packaging_corrections.sha(SCRIPT/'package-exclusions.json'))
  (OUT/'backend-packaging-image-smoke.json').write_text(json.dumps(smoke,indent=2)+'\n')
  for role in ['normal','recovery']:
   stage=role+'-frontend-build';web=ROOT/(role+'-source')/'empireai-web'
   run(['npm','ci','--ignore-scripts','--no-audit','--no-fund'],cwd=web,timeout=180,log=role+'-dependencies.log')
   buildenv=os.environ.copy();buildenv['NEXT_TELEMETRY_DISABLED']='1'
   r=subprocess.run(['npm','run','build'],cwd=web,env=buildenv,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=240);(OUT/(role+'-build.log')).write_text(r.stdout[-1048576:]);assert r.returncode==0
   standalone=web/'.next/standalone';assert (standalone/'server.js').is_file()
   context=PRIVATE/(role+'-context');context.mkdir();shutil.copytree(standalone,context/'app');shutil.copytree(web/'.next/static',context/'app/.next/static')
   if (web/'public').exists():shutil.copytree(web/'public',context/'app/public',dirs_exist_ok=True)
   (context/'app/.next/cache').mkdir(exist_ok=True)
   (context/'Dockerfile').write_text(f'FROM {NODE}\nWORKDIR /frontend\nCOPY --chown=0:0 app/ /frontend/\nLABEL org.opencontainers.image.revision="{MANIFEST[role]["commit"]}" io.empireai.source-tree="{MANIFEST[role]["tree"]}"\nENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1\nENTRYPOINT ["node","server.js"]\n')
   (OUT/(role+'-prebuild-secret-scan.json')).write_text(json.dumps(candidate_packages.scan_context(context),indent=2)+'\n')
   run(['docker','build','--network','none','--pull=false','--iidfile',str(PRIVATE/(role+'.id')),str(context)],timeout=90,log=role+'-image-build.log');images[role]=(PRIVATE/(role+'.id')).read_text().strip()
  stage='isolation-setup';components={}
  for role,image in images.items():
   inspected=json.loads(run(['docker','image','inspect',image]))[0];assert inspected['Config']['Labels']['org.opencontainers.image.revision']==MANIFEST[role]['commit'];assert run(['docker','run','--rm','--network','none','--entrypoint','node',image,'--version']).strip()=='v22.23.2'
   components[role]={'commit':MANIFEST[role]['commit'],'tree':MANIFEST[role]['tree'],'image':image,'createdAt':inspected['Created']}
   if role!='backend':components[role]['buildId']=(ROOT/(role+'-source')/'empireai-web/.next/BUILD_ID').read_text().strip()
   else:components[role]['packaging']={'controllerCommit':os.environ['GITHUB_SHA'],'policySha256':packaging_corrections.sha(SCRIPT/'package-exclusions.json'),'helperSha256':packaging_corrections.sha(SCRIPT/'packaging_corrections.py'),'smokeScriptSha256':packaging_corrections.sha(SCRIPT/'packaging-smoke.mjs'),'removalReceiptSha256':packaging_corrections.sha(OUT/'backend-packaging-removal.json'),'actualImageSmokeReceiptSha256':packaging_corrections.sha(OUT/'backend-packaging-image-smoke.json'),'sourcePinsUnchanged':True,'scannerExceptions':[]}
  stage='archive-and-scan-candidates-before-runtime'
  candidate_packages.prepare(ROOT,PRIVATE,OUT,images,components,generated)
  result.update(status='CANDIDATES_PREPARED_AWAITING_REMOTE_UPLOAD',candidateBytes=candidate_packages.directory_bytes(ROOT/'native-transition-candidates'),runtimeStarted=False,wholeRowsAccepted=[])
 else:
  stage='verify-retained-candidate-bytes-and-upload-receipt'
  images,components=candidate_packages.reuse(ROOT,OUT,MANIFEST)
  for d in ['control','evidence','policy']:(PRIVATE/d).mkdir(mode=0o700)
  (PRIVATE/'policy').chmod(0o755);(PRIVATE/'evidence').chmod(0o755)
  (PRIVATE/'control/component-identities.json').write_text(json.dumps(components))
  values={key:secrets.token_hex(32) for key in ['founder','admin','session','redis']};generated=list(values.values())
  (PRIVATE/'backend.env').write_text('EXPECTED_BACKEND='+MANIFEST['backend']['commit']+'\nFOUNDER_PASSWORD='+values['founder']+'\nADMIN_PASSWORD='+values['admin']+'\nSESSION_SECRET='+values['session']+'\nREDIS_URL=redis://:'+values['redis']+'@transition-redis:6379/0\n')
  (PRIVATE/'browser.env').write_text('OWNER_PASSWORD='+values['founder']+'\nEXPECTED_BACKEND='+MANIFEST['backend']['commit']+'\nEXAM_ID='+os.environ['GITHUB_RUN_ID']+'\n')
  (PRIVATE/'redis.conf').write_text('bind 0.0.0.0\nprotected-mode yes\nsave ""\nappendonly no\nrequirepass '+values['redis']+'\n');(PRIVATE/'redis.conf').chmod(0o444)
  set_policy(True);run(['docker','network','create','--internal','--label','work8.native='+LABEL,NETWORK]);network_created=True
  for image in [NODE,REDIS,BROWSER]:run(['docker','pull',image],timeout=120)
  run(['docker','run','-d','--name',NAMES['redis'],'--label','work8.native='+LABEL,'--network',NETWORK,'--network-alias','transition-redis','--memory','128m','--cpus','0.5','--pids-limit','64','--read-only','--user','999:999','--cap-drop','ALL','--security-opt','no-new-privileges','--tmpfs','/data:rw,noexec,nosuid,size=32m','--mount','type=bind,src='+str(PRIVATE/'redis.conf')+',dst=/redis.conf,readonly',REDIS,'redis-server','/redis.conf']);created.append(NAMES['redis'])
  run(['docker','run','-d','--name',NAMES['anchor'],'--label','work8.native='+LABEL,'--network',NETWORK,'--memory','64m','--cpus','0.1','--pids-limit','32','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges',NODE,'node','-e','setTimeout(()=>process.exit(0),650000)']);created.append(NAMES['anchor'])
  cmd=['docker','run','-d','--name',NAMES['backend'],'--label','work8.native='+LABEL,'--network',NETWORK,'--network-alias','native-backend','--memory','5g','--cpus','2','--pids-limit','256','--read-only','--user','0:0','--cap-drop','ALL']
  for cap in ['SETUID','SETGID','CHOWN','DAC_OVERRIDE','KILL','SYS_PTRACE']:cmd+=['--cap-add',cap]
  cmd+=['--security-opt','no-new-privileges','--env-file',str(PRIVATE/'backend.env'),'--tmpfs','/data/work8-exam:rw,noexec,nosuid,nodev,mode=0755,size=2g','--tmpfs','/tmp:rw,noexec,nosuid,size=16m']
  for source,dest,ro in [(PRIVATE/'policy','/run/empire-policy',True),(PRIVATE/'control','/control',False),(PRIVATE/'evidence','/evidence',False),(SCRIPT,'/examination',True)]:cmd+=['--mount','type=bind,src='+str(source)+',dst='+dest+(',readonly' if ro else '')]
  cmd+=['--entrypoint','timeout',images['backend'],'--signal=KILL','650s','node','/examination/coordinator.mjs'];run(cmd);created.append(NAMES['backend'])
  stage='actual-runtime-start';marker('runtime-ready.json',timeout=245)
  meta=inspect(NAMES['backend']);assert not meta['HostConfig']['PortBindings'];assert next(m for m in meta['Mounts'] if m['Destination']=='/run/empire-policy')['RW'] is False
  run(['docker','exec','--user','65534:65534',NAMES['backend'],'node','-e',"const fs=require('fs');let denied=false;try{fs.writeFileSync('/run/empire-policy/control.json','forbidden')}catch(e){denied=['EROFS','EACCES','EPERM'].includes(e.code)}if(!denied)process.exit(1)"])
  (PRIVATE/'evidence/isolation.json').write_text(json.dumps({'internalNetwork':True,'publishedPorts':False,'externalCredentials':False,'policyReadonlyMount':True,'runtimePolicyWriteRefused':True,'actualNativeApplication':True,'syntheticOwnerOnly':True,'components':components},indent=2))
  start_front('normal','NORMAL');stage='normal-view'
  run(['docker','run','-d','--name',NAMES['browser'],'--label','work8.native='+LABEL,'--network','container:'+NAMES['anchor'],'--memory','2g','--cpus','1','--pids-limit','128','--shm-size','256m','--user',str(os.getuid())+':'+str(os.getgid()),'--env','HOME=/tmp','--env','NODE_OPTIONS=--dns-result-order=ipv4first','--env-file',str(PRIVATE/'browser.env'),'--mount','type=bind,src='+str(SCRIPT)+',dst=/examination,readonly','--mount','type=bind,src='+str(ROOT/'native-transition-driver')+',dst=/frontend-package,readonly','--mount','type=bind,src='+str(PRIVATE/'control')+',dst=/control','--mount','type=bind,src='+str(PRIVATE/'evidence')+',dst=/evidence','--entrypoint','timeout',BROWSER,'--signal=KILL','500s','node','/examination/browser.mjs']);created.append(NAMES['browser'])
  marker('origin-preflight-complete.json');capture_frontend_origin(require_contract=True);signal('origin-preflight-verified.json')
  marker('normal-complete.json');run(['docker','exec',NAMES['backend'],'node','/examination/offline-readback.mjs','normal']);stage='recovery-version';set_policy(False);start_front('recovery','RECOVERY');signal('recovery-ready.json');marker('recovery-complete.json')
  stage='normal-return-version';start_front('normal','NORMAL_RETURN');set_policy(True);signal('return-ready.json');marker('browser-complete.json')
  deadline=time.monotonic()+20
  while inspect(NAMES['browser'])['State']['Running']:assert time.monotonic()<deadline;time.sleep(.2)
  assert inspect(NAMES['browser'])['State']['ExitCode']==0
  capture_frontend_origin(require_contract=True)
  stage='drain-and-independent-readback';signal('stop-runtime.json');marker('runtime-drained.json')
  run(['docker','exec',NAMES['backend'],'node','/examination/offline-readback.mjs','final']);signal('readback-complete.json')
  deadline=time.monotonic()+20
  while inspect(NAMES['backend'])['State']['Running']:assert time.monotonic()<deadline;time.sleep(.2)
  assert inspect(NAMES['backend'])['State']['ExitCode']==0
  result.update(status='PASS_AWAITING_INDEPENDENT_TECHNICAL_REVIEW',distinctFrontendTransition=True,newerCommittedRecordsPreserved=True,wholeRowsAccepted=[],candidateBytes=candidate_packages.directory_bytes(ROOT/'native-transition-candidates'))
except Exception as error:
 result['failedStage']=stage;result['error']=redact(str(error))[:500]
finally:
 for role in ['backend','frontend','redis','anchor','browser']:capture_container_state(role,'before-cleanup')
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
    else:(OUT/(role+'-container.log')).write_text(redact(log.stdout)[-1048576:])
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
 for p in (PRIVATE/'evidence').glob('*') if (PRIVATE/'evidence').exists() else []:
  if p.is_file() and p.stat().st_size<2*1024*1024:
   if p.suffix in ['.json','.log']: (OUT/p.name).write_text(redact(p.read_text()))
   elif p.suffix=='.png':shutil.copyfile(p,OUT/p.name)
 result['temporaryContainersAndNetworkRemoved']=cleanup_ok
 if not cleanup_ok:result['status']='FAIL'
 # Exact newly-generated secrets must never enter the upload set.
 for p in OUT.iterdir():
  if p.suffix in ['.json','.log','.txt']:
   text=p.read_text();assert not any(secret in text for secret in generated),'SECRET_OUTPUT_REFUSED'
 subprocess.run(['sudo','-n','rm','-rf','--one-file-system','--',str(PRIVATE)],check=True)
 result['privateTemporaryDataRemoved']=not PRIVATE.exists();result['elapsedSeconds']=round(time.monotonic()-START,3)
 result_name='candidate-preparation-result.json' if PHASE=='--prepare-candidates' else 'runner-result.json'
 (OUT/result_name).write_text(json.dumps(result,indent=2)+'\n')
 index=[]
 for p in sorted(OUT.iterdir()):
  if p.name=='artifact-index.json':continue
  assert p.is_file() and not p.is_symlink(),'NONREGULAR_ARTIFACT_REFUSED'
  index.append({'path':p.name,'bytes':p.stat().st_size,'sha256':hashlib.file_digest(p.open('rb'),'sha256').hexdigest()})
 (OUT/'artifact-index.json').write_text(json.dumps({'schema':'work8-bounded-upload-v1','exactGeneratedSecretCheck':True,'maxBytes':MAX_OUTPUT,'files':index},indent=2)+'\n')
 assert output_bytes()+candidate_packages.directory_bytes(ROOT/'native-transition-candidates')<=candidate_packages.MAX_PAYLOAD_BYTES,'TOTAL_PAYLOAD_BYTES_BOUND'
 if result['status'].startswith('FAIL'):raise SystemExit(1)
