#!/usr/bin/env python3
"""One fresh, bounded full-native distinct-version examination. No provider keys."""
import gzip, hashlib, io, json, os, pathlib, re, secrets, shutil, subprocess, tarfile, tempfile, time

ROOT=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve()
SCRIPT=ROOT/'controller/scripts/work8/native-transition'
OUT=ROOT/'native-transition-output';OUT.mkdir()
PRIVATE=pathlib.Path(tempfile.mkdtemp(prefix='work8-native-transition-',dir=os.environ['RUNNER_TEMP']))
MANIFEST=json.loads((SCRIPT/'components.json').read_text())
LABEL='work8-native-'+os.environ['GITHUB_RUN_ID']
NAMES={x:LABEL+'-'+x for x in ['backend','frontend','redis','anchor','browser']}
NETWORK=LABEL+'-network';network_created=False;created=[];images={};generated=[]
NODE='node:22.23.2-bookworm-slim@sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9'
REDIS='redis:7.4.2-alpine@sha256:02419de7eddf55aa5bcf49efb74e88fa8d931b4d77c07eff8a6b2144472b6952'
BROWSER='mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e'
START=time.monotonic();stage='preflight';result={'status':'FAIL','wholeRowsAccepted':[],'productionAccess':False,'genuineOwnerObservation':False}
MAX_OUTPUT=2*1024**3

def output_bytes():
 total=0
 for p in OUT.iterdir():
  assert p.is_file() and not p.is_symlink(),'NONREGULAR_ARTIFACT_REFUSED'
  total+=p.stat().st_size
 return total

class BoundedCompressedWriter:
 def __init__(self,file,limit):self.file,self.limit=file,limit
 def write(self,data):
  assert self.file.tell()+len(data)<=self.limit,'COMPRESSED_ARTIFACT_BYTES_BOUND'
  return self.file.write(data)
 def flush(self):return self.file.flush()
 def tell(self):return self.file.tell()

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
def marker(name):
 deadline=time.monotonic()+210
 while not (PRIVATE/'control'/name).exists():
  assert time.monotonic()<deadline,'PHASE_DEADLINE:'+name
  for role in ['backend','browser']:
   if role=='browser' and (PRIVATE/'control/browser-complete.json').exists():continue
   if NAMES[role] in created:assert inspect(NAMES[role])['State']['Running'],'CONTAINER_EXITED:'+role
  time.sleep(.2)
def signal(name,value={'ok':True}):(PRIVATE/'control'/name).write_text(json.dumps(value))
def set_policy(released):
 p=PRIVATE/'policy/control.json'
 if not released:p.unlink();return
 import datetime
 v={'schema':1,'mode':'RELEASED','approvalSha256':hashlib.sha256(b'Final owner directive: isolated noncommercial technical version transition only').hexdigest(),'expiresAt':(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(minutes=12)).isoformat()}
 q=p.with_suffix('.tmp');q.write_text(json.dumps(v));q.chmod(0o444);run(['sudo','-n','chown','0:0',str(q)]);q.replace(p)
def start_front(role):
 if NAMES['frontend'] in created:
  run(['docker','rm','-f',NAMES['frontend']]);created.remove(NAMES['frontend'])
 run(['docker','run','-d','--name',NAMES['frontend'],'--label','work8.native='+LABEL,'--network','container:'+NAMES['anchor'],'--pull','never','--read-only','--user','65534:65534','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','1g','--cpus','1','--pids-limit','128','--env','PORT=43117','--env','HOSTNAME=0.0.0.0','--env','NODE_ENV=production','--env','BRAIN_API_URL=http://native-backend:43100','--env','VERCEL_GIT_COMMIT_SHA='+MANIFEST[role]['commit'],'--env','NEXT_TELEMETRY_DISABLED=1','--tmpfs','/tmp:rw,noexec,nosuid,size=32m','--tmpfs','/frontend/.next/cache:rw,noexec,nosuid,size=64m',images[role]])
 created.append(NAMES['frontend'])
 actual=inspect(NAMES['frontend']);assert actual['Image']==images[role] and not actual['HostConfig']['PortBindings']
 deadline=time.monotonic()+90
 while True:
  assert time.monotonic()<deadline,'FRONTEND_STARTUP_DEADLINE'
  r=subprocess.run(['docker','exec',NAMES['anchor'],'node','-e',"fetch('http://127.0.0.1:43117/login').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=5)
  if r.returncode==0:break
  time.sleep(.5)

try:
 assert os.environ['GITHUB_EVENT_NAME']=='create' and os.environ['GITHUB_REF']=='refs/heads/work8/closure-20261031-native-transition'
 event=json.load(open(os.environ['GITHUB_EVENT_PATH']));assert event['ref_type']=='branch' and event['ref']=='work8/closure-20261031-native-transition'
 assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and os.environ['GITHUB_RUN_NUMBER']=='1'
 assert run(['node','--version']).strip()=='v22.23.2'
 for role in ['backend','normal','recovery']:
  entry=MANIFEST[role];source=ROOT/(role+'-source')
  assert run(['git','rev-parse','HEAD'],cwd=source).strip()==entry['commit'];assert run(['git','rev-parse','HEAD^{tree}'],cwd=source).strip()==entry['tree'];assert not run(['git','status','--porcelain'],cwd=source).strip()
  native='backend/src/runtime/commerce-runtime/governed/work8-twin-media.ts' if role=='backend' else 'empireai-web/components/owner/work8/TwinMedia.tsx'
  expected='05e726fc9a562e591384e94a54c80f76f0294c08' if role=='backend' else '1d9a398ad3d3951207c90f0b8125034bef361e27'
  assert run(['git','rev-parse','HEAD:'+native],cwd=source).strip()==expected
 assert MANIFEST['normal']['commit']!=MANIFEST['recovery']['commit']
 (OUT/'exact-components.json').write_text(json.dumps(MANIFEST,indent=2))
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
 run(['docker','build','--iidfile',str(PRIVATE/'backend.id'),str(context)],timeout=240,log='backend-image-build.log');images['backend']=(PRIVATE/'backend.id').read_text().strip()
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
  run(['docker','build','--network','none','--pull=false','--iidfile',str(PRIVATE/(role+'.id')),str(context)],timeout=90,log=role+'-image-build.log');images[role]=(PRIVATE/(role+'.id')).read_text().strip()
 stage='isolation-setup';components={}
 for role,image in images.items():
  inspected=json.loads(run(['docker','image','inspect',image]))[0];assert inspected['Config']['Labels']['org.opencontainers.image.revision']==MANIFEST[role]['commit'];assert run(['docker','run','--rm','--network','none','--entrypoint','node',image,'--version']).strip()=='v22.23.2'
  components[role]={'commit':MANIFEST[role]['commit'],'tree':MANIFEST[role]['tree'],'image':image,'createdAt':inspected['Created']}
  if role!='backend':components[role]['buildId']=(ROOT/(role+'-source')/'empireai-web/.next/BUILD_ID').read_text().strip()
 for d in ['control','evidence','policy']:(PRIVATE/d).mkdir(mode=0o700)
 (PRIVATE/'policy').chmod(0o755);(PRIVATE/'evidence').chmod(0o755)
 (PRIVATE/'control/component-identities.json').write_text(json.dumps(components))
 values={key:secrets.token_hex(32) for key in ['founder','admin','session','redis']};generated=list(values.values())
 (PRIVATE/'backend.env').write_text('EXPECTED_BACKEND='+MANIFEST['backend']['commit']+'\nFOUNDER_PASSWORD='+values['founder']+'\nADMIN_PASSWORD='+values['admin']+'\nSESSION_SECRET='+values['session']+'\nREDIS_URL=redis://:'+values['redis']+'@transition-redis:6379/0\n')
 (PRIVATE/'browser.env').write_text('OWNER_PASSWORD='+values['founder']+'\nEXPECTED_BACKEND='+MANIFEST['backend']['commit']+'\nEXAM_ID='+os.environ['GITHUB_RUN_ID']+'\n')
 (PRIVATE/'redis.conf').write_text('bind 0.0.0.0\nprotected-mode yes\nsave ""\nappendonly no\nrequirepass '+values['redis']+'\n');(PRIVATE/'redis.conf').chmod(0o444)
 set_policy(True);run(['docker','network','create','--internal','--label','work8.native='+LABEL,NETWORK]);network_created=True
 for image in [REDIS,BROWSER]:run(['docker','pull',image],timeout=120)
 run(['docker','run','-d','--name',NAMES['redis'],'--label','work8.native='+LABEL,'--network',NETWORK,'--network-alias','transition-redis','--memory','128m','--cpus','0.5','--pids-limit','64','--read-only','--user','999:999','--cap-drop','ALL','--security-opt','no-new-privileges','--tmpfs','/data:rw,noexec,nosuid,size=32m','--mount','type=bind,src='+str(PRIVATE/'redis.conf')+',dst=/redis.conf,readonly',REDIS,'redis-server','/redis.conf']);created.append(NAMES['redis'])
 run(['docker','run','-d','--name',NAMES['anchor'],'--label','work8.native='+LABEL,'--network',NETWORK,'--memory','64m','--cpus','0.1','--pids-limit','32','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges',NODE,'node','-e','setTimeout(()=>process.exit(0),650000)']);created.append(NAMES['anchor'])
 cmd=['docker','run','-d','--name',NAMES['backend'],'--label','work8.native='+LABEL,'--network',NETWORK,'--network-alias','native-backend','--memory','5g','--cpus','2','--pids-limit','256','--read-only','--user','0:0','--cap-drop','ALL']
 for cap in ['SETUID','SETGID','CHOWN','DAC_OVERRIDE','KILL','SYS_PTRACE']:cmd+=['--cap-add',cap]
 cmd+=['--security-opt','no-new-privileges','--env-file',str(PRIVATE/'backend.env'),'--tmpfs','/data/work8-exam:rw,noexec,nosuid,nodev,mode=0755,size=2g','--tmpfs','/tmp:rw,noexec,nosuid,size=16m']
 for source,dest,ro in [(PRIVATE/'policy','/run/empire-policy',True),(PRIVATE/'control','/control',False),(PRIVATE/'evidence','/evidence',False),(SCRIPT,'/examination',True)]:cmd+=['--mount','type=bind,src='+str(source)+',dst='+dest+(',readonly' if ro else '')]
 cmd+=['--entrypoint','timeout',images['backend'],'--signal=KILL','650s','node','/examination/coordinator.mjs'];run(cmd);created.append(NAMES['backend'])
 stage='actual-runtime-start';marker('runtime-ready.json')
 meta=inspect(NAMES['backend']);assert not meta['HostConfig']['PortBindings'];assert next(m for m in meta['Mounts'] if m['Destination']=='/run/empire-policy')['RW'] is False
 run(['docker','exec','--user','65534:65534',NAMES['backend'],'node','-e',"const fs=require('fs');let denied=false;try{fs.writeFileSync('/run/empire-policy/control.json','forbidden')}catch(e){denied=['EROFS','EACCES','EPERM'].includes(e.code)}if(!denied)process.exit(1)"])
 (PRIVATE/'evidence/isolation.json').write_text(json.dumps({'internalNetwork':True,'publishedPorts':False,'externalCredentials':False,'policyReadonlyMount':True,'runtimePolicyWriteRefused':True,'actualNativeApplication':True,'syntheticOwnerOnly':True,'components':components},indent=2))
 start_front('normal');stage='normal-view'
 run(['docker','run','-d','--name',NAMES['browser'],'--label','work8.native='+LABEL,'--network','container:'+NAMES['anchor'],'--memory','2g','--cpus','1','--pids-limit','128','--shm-size','256m','--user',str(os.getuid())+':'+str(os.getgid()),'--env','HOME=/tmp','--env-file',str(PRIVATE/'browser.env'),'--mount','type=bind,src='+str(SCRIPT)+',dst=/examination,readonly','--mount','type=bind,src='+str(ROOT/'normal-source/empireai-web')+',dst=/frontend-package,readonly','--mount','type=bind,src='+str(PRIVATE/'control')+',dst=/control','--mount','type=bind,src='+str(PRIVATE/'evidence')+',dst=/evidence','--entrypoint','timeout',BROWSER,'--signal=KILL','500s','node','/examination/browser.mjs']);created.append(NAMES['browser'])
 marker('normal-complete.json');run(['docker','exec',NAMES['backend'],'node','/examination/offline-readback.mjs','normal']);stage='recovery-version';set_policy(False);start_front('recovery');signal('recovery-ready.json');marker('recovery-complete.json')
 stage='normal-return-version';start_front('normal');set_policy(True);signal('return-ready.json');marker('browser-complete.json')
 deadline=time.monotonic()+20
 while inspect(NAMES['browser'])['State']['Running']:assert time.monotonic()<deadline;time.sleep(.2)
 assert inspect(NAMES['browser'])['State']['ExitCode']==0
 stage='drain-and-independent-readback';signal('stop-runtime.json');marker('runtime-drained.json')
 run(['docker','exec',NAMES['backend'],'node','/examination/offline-readback.mjs','final']);signal('readback-complete.json')
 deadline=time.monotonic()+20
 while inspect(NAMES['backend'])['State']['Running']:assert time.monotonic()<deadline;time.sleep(.2)
 assert inspect(NAMES['backend'])['State']['ExitCode']==0
 stage='archive-exact-images';total=0
 for role,image in images.items():
  target=OUT/(role+'-image.tar.gz');partial=PRIVATE/(role+'-image.partial');proc=subprocess.Popen(['docker','save',image],stdout=subprocess.PIPE)
  try:
   # Reserve 16 MiB for final bounded diagnostics/readback/receipts. No partial
   # image ever enters the upload directory, including on a failed examination.
   limit=MAX_OUTPUT-output_bytes()-16*1024**2;assert limit>0
   with partial.open('wb') as raw:
    with gzip.GzipFile(filename='',fileobj=BoundedCompressedWriter(raw,limit),mode='wb',mtime=0) as dst:
     while chunk:=proc.stdout.read(1024*1024):dst.write(chunk)
   assert proc.wait(timeout=120)==0
   assert partial.stat().st_size+output_bytes()<=MAX_OUTPUT-16*1024**2
   partial.replace(target);total+=target.stat().st_size
  finally:
   if proc.poll() is None:proc.kill()
   proc.stdout.close();proc.wait(timeout=10)
   if partial.exists():partial.unlink()
  components[role]['archiveSha256']=hashlib.file_digest(target.open('rb'),'sha256').hexdigest()
 (OUT/'immutable-images.json').write_text(json.dumps(components,indent=2));result.update(status='PASS_AWAITING_INDEPENDENT_TECHNICAL_REVIEW',distinctFrontendTransition=True,newerCommittedRecordsPreserved=True,wholeRowsAccepted=[],artifactBytes=total)
except Exception as error:
 result['failedStage']=stage;result['error']=redact(str(error))[:500]
finally:
 stage='cleanup';cleanup_ok=True
 # Capture bounded sanitized failure evidence even if `docker run` created the
 # named container but failed before returning a successful start receipt.
 for role in ['backend','browser']:
  try:
   log=subprocess.run(['docker','logs',NAMES[role]],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=10)
   if log.returncode==0:(OUT/(role+'-container.log')).write_text(redact(log.stdout)[-1048576:])
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
 (OUT/'runner-result.json').write_text(json.dumps(result,indent=2)+'\n')
 index=[]
 for p in sorted(OUT.iterdir()):
  assert p.is_file() and not p.is_symlink(),'NONREGULAR_ARTIFACT_REFUSED'
  index.append({'path':p.name,'bytes':p.stat().st_size,'sha256':hashlib.file_digest(p.open('rb'),'sha256').hexdigest()})
 (OUT/'artifact-index.json').write_text(json.dumps({'schema':'work8-bounded-upload-v1','exactGeneratedSecretCheck':True,'maxBytes':MAX_OUTPUT,'files':index},indent=2)+'\n')
 assert output_bytes()<=MAX_OUTPUT,'TOTAL_OUTPUT_BYTES_BOUND'
 if result['status'].startswith('FAIL'):raise SystemExit(1)
