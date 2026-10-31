#!/usr/bin/env python3
"""Build only reviewed V26 source deltas on verified immutable V23 packages."""
import gzip, hashlib, json, os, pathlib, re, shutil, subprocess, tempfile, time
import candidate_packages as cp

ROOT=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve()
SCRIPT=ROOT/'controller/scripts/work8/native-transition'
OUT=ROOT/'native-transition-output'
PLAN=json.loads((SCRIPT/'v26-build-plan.json').read_text())
PINS=json.loads((SCRIPT/'components.json').read_text())
BASE=json.loads((ROOT/'native-transition-candidates/immutable-images.json').read_text())
NODE='node:22.23.2-bookworm-slim@sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9'
BUDGET=json.loads((OUT/'workflow-budget.json').read_text())
START=time.monotonic();stage='source-preflight';result={'status':'FAIL','newRuntimeStarted':False,'providerCredentialsSupplied':False,'wholeRowsAccepted':[]}

def run(args,*,cwd=None,timeout=120):
 assert time.monotonic()-START<900,'BUILD_CAPACITY_BOUND'
 assert time.time()-BUDGET['startedAtEpoch']<BUDGET['maximumSeconds']-700,'NO_CAPACITY_FOR_ACCEPTANCE_AND_CLEANUP'
 remaining=BUDGET['maximumSeconds']-(time.time()-BUDGET['startedAtEpoch'])-BUDGET['cleanupAndUploadReserveSeconds']
 p=subprocess.run(args,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=min(timeout,max(1,int(remaining))))
 if p.returncode:
  diagnostic=p.stdout[-65536:]
  for _,pattern in cp.PATTERNS:diagnostic=pattern.sub(b'[REDACTED]',diagnostic)
  text=diagnostic.decode(errors='replace')
  text=re.sub(r'(?i)(authorization|cookie|password|token|secret)([ \t]*[:=][ \t]*)[^\s,;]+',r'\1\2[REDACTED]',text)
  (OUT/'build-first-failure.json').write_text(json.dumps({'stage':stage,'exitCode':p.returncode,'sanitizedBuildOutput':text,'rawOutputSha256':hashlib.sha256(p.stdout).hexdigest(),'runtimeStarted':False},indent=2)+'\n')
  raise AssertionError('BUILD_COMMAND_FAILED:'+stage+':'+str(p.returncode))
 return p.stdout.decode()

def scan_delta(context,baseline):
 scanned=0;byte_count=0;inherited=0;rows=[]
 for p in sorted(context.rglob('*')):
  relative=p.relative_to(context)
  if p.is_symlink():
   assert p.resolve().is_relative_to(context.resolve()),'BUILD_SYMLINK_ESCAPE_REFUSED'
   continue
  if not p.is_file():continue
  assert p.name!='.env' and '.git' not in relative.parts,'PRIVATE_BUILD_INPUT_REFUSED'
  h=cp.sha(p);old=baseline/relative
  if old.is_file() and not old.is_symlink() and cp.sha(old)==h:inherited+=1;continue
  assert p.suffix.lower() not in {'.db','.sqlite','.sqlite3','.db-wal','.db-shm'},'NEW_DATABASE_REFUSED'
  tail=b''
  with p.open('rb') as f:
   while chunk:=f.read(1024*1024):
    assert not any(pattern.search(tail+chunk) for _,pattern in cp.PATTERNS),'NEW_BUILD_SECRET_PATTERN_REFUSED'
    tail=(tail+chunk)[-8192:]
  scanned+=1;byte_count+=p.stat().st_size
  rows.append({'path':str(relative),'sha256':h,'bytes':p.stat().st_size})
 return {'changedFilesScanned':scanned,'changedBytesScanned':byte_count,'unchangedFilesHashVerified':inherited,'matches':0,'retainedPriorScanReused':True,'changedFiles':rows}

def old_files(image,destination,path):
 name=run(['docker','create',image]).strip()
 try:run(['docker','cp',name+':'+path,str(destination)],timeout=90)
 finally:subprocess.run(['docker','rm','-f',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=20,check=False)

def main():
 global stage
 assert os.environ['GITHUB_EVENT_NAME']=='create' and os.environ['GITHUB_REF']=='refs/heads/work8/v26-20261031-business-recovery'
 assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and os.environ['GITHUB_RUN_NUMBER']=='1'
 assert json.loads((OUT/'retained-import-result.json').read_text())['status']=='PASS_RETAINED_BYTES_LOADED_DRIVER_READY'
 assert PLAN['independentPreflightApproved'] is True and PLAN['additionalReservationUSD']<=0.50
 assert PLAN['priorReservationUSD']==2.35 and PLAN['retentionDays']==7 and PLAN['maximumMinutes']==30
 assert run(['node','--version']).strip()=='v22.23.2'
 provenance={}
 for role in cp.ROLES:
  source=ROOT/(role+'-source');pin=PINS[role];base=BASE[role]
  assert run(['git','rev-parse','HEAD'],cwd=source).strip()==pin['commit']
  assert run(['git','rev-parse','HEAD^{tree}'],cwd=source).strip()==pin['tree']
  assert run(['git','rev-parse','HEAD^'],cwd=source).strip()==base['commit'],'NONMINIMAL_SOURCE_PARENT'
  changed=run(['git','diff','--name-only','HEAD^','HEAD'],cwd=source).splitlines()
  expected=PLAN['sourceChanges'][role]
  assert sorted(changed)==sorted(x['path'] for x in expected),'UNREVIEWED_SOURCE_CHANGE'
  for item in expected:assert cp.sha(source/item['path'])==item['sha256'],'SOURCE_DELTA_IDENTITY_MISMATCH'
  provenance[role]={'baseCommit':base['commit'],'baseTree':base['tree'],'baseImage':base['image'],'commit':pin['commit'],'tree':pin['tree'],'changedSources':expected}
 assert len(PLAN['sourceChanges']['normal'])==1 and PLAN['sourceChanges']['normal'][0]['path']=='empireai-web/lib/owner/runtime-identity.mjs'
 for role in ['normal','recovery']:
  source=ROOT/(role+'-source')
  assert cp.sha(source/'empireai-web/package-lock.json')==PLAN['frontendLockSha256']
  assert PINS['backend']['commit'] in (source/'empireai-web/lib/owner/runtime-identity.mjs').read_text()
 retained=ROOT/'native-retained-candidates';(ROOT/'native-transition-candidates').rename(retained)
 candidates=ROOT/'native-transition-candidates';candidates.mkdir()
 with tempfile.TemporaryDirectory(prefix='work8-v26-build-',dir=os.environ['RUNNER_TEMP']) as tmp:
  private=pathlib.Path(tmp);images={};scans={};components={}
  stage='backend-reviewed-overlay'
  base_tag='work8-v26-retained-backend:'+os.environ['GITHUB_RUN_ID']
  run(['docker','tag',BASE['backend']['image'],base_tag])
  assert json.loads(run(['docker','image','inspect',base_tag]))[0]['Id']==BASE['backend']['image']
  run(['docker','pull',NODE],timeout=120)
  context=private/'backend-context';(context/'app').mkdir(parents=True)
  for item in PLAN['sourceChanges']['backend']:
   dest=context/'app'/item['path'];dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/'backend-source'/item['path'],dest)
  compile_result=json.loads(run(['docker','run','--rm','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--mount','type=bind,src='+str(context)+',dst=/overlay','--mount','type=bind,src='+str(SCRIPT)+',dst=/examination,readonly','--entrypoint','node',BASE['backend']['image'],'/examination/compile-overlay.cjs','/app','/overlay','/examination/v26-build-plan.json']))
  revision=context/'app/backend/dist/runtime-revision.json';revision.parent.mkdir(parents=True,exist_ok=True);revision.write_text(json.dumps({'revision':PINS['backend']['commit']})+'\n')
  (context/'Dockerfile').write_text('FROM '+base_tag+'\nCOPY --chown=0:0 app/ /app/\nLABEL org.opencontainers.image.revision="'+PINS['backend']['commit']+'" io.empireai.source-tree="'+PINS['backend']['tree']+'"\n')
  scans['backend']=scan_delta(context,private/'no-baseline')
  run(['docker','build','--network','none','--pull=false','--iidfile',str(private/'backend.id'),str(context)],timeout=90)
  images['backend']=(private/'backend.id').read_text().strip()
  (OUT/'changed-typescript-compilation.json').write_text(json.dumps(compile_result,indent=2)+'\n')
  for role in ['normal','recovery']:
   stage=role+'-necessary-frontend-build';web=ROOT/(role+'-source')/'empireai-web'
   if role=='normal':run(['npm','ci','--ignore-scripts','--no-audit','--no-fund'],cwd=web,timeout=180)
   else:
    normal_web=ROOT/'normal-source/empireai-web'
    assert cp.sha(web/'package.json')==cp.sha(normal_web/'package.json') and cp.sha(web/'package-lock.json')==cp.sha(normal_web/'package-lock.json'),'DEPENDENCY_REUSE_IDENTITY_MISMATCH'
    shutil.copytree(normal_web/'node_modules',web/'node_modules',symlinks=True)
   run(['npm','run','build'],cwd=web,timeout=240)
   standalone=web/'.next/standalone';assert (standalone/'server.js').is_file()
   context=private/(role+'-context');context.mkdir();shutil.copytree(standalone,context/'app');shutil.copytree(web/'.next/static',context/'app/.next/static')
   if (web/'public').exists():shutil.copytree(web/'public',context/'app/public',dirs_exist_ok=True)
   (context/'app/.next/cache').mkdir(exist_ok=True)
   baseline=private/(role+'-baseline');baseline.mkdir();old_files(BASE[role]['image'],baseline/'app','/frontend')
   (context/'Dockerfile').write_text('FROM '+NODE+'\nWORKDIR /frontend\nCOPY --chown=0:0 app/ /frontend/\nLABEL org.opencontainers.image.revision="'+PINS[role]['commit']+'" io.empireai.source-tree="'+PINS[role]['tree']+'"\nENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1\nENTRYPOINT ["node","server.js"]\n')
   scans[role]=scan_delta(context,baseline)
   run(['docker','build','--network','none','--pull=false','--iidfile',str(private/(role+'.id')),str(context)],timeout=90)
   images[role]=(private/(role+'.id')).read_text().strip()
  stage='archive-verified-new-candidates'
  for role in cp.ROLES:
   actual=json.loads(run(['docker','image','inspect',images[role]]))[0]
   assert actual['Config']['Labels']['org.opencontainers.image.revision']==PINS[role]['commit']
   assert actual['Config']['Labels']['io.empireai.source-tree']==PINS[role]['tree']
   assert run(['docker','run','--rm','--network','none','--read-only','--entrypoint','node',images[role],'--version']).strip()=='v22.23.2'
   assert all(x.split('=',1)[0] in {'PATH','NODE_VERSION','YARN_VERSION','NODE_ENV','NEXT_TELEMETRY_DISABLED'} for x in actual['Config'].get('Env',[]))
   if role=='backend':
    old=json.loads(run(['docker','image','inspect',BASE[role]['image']]))[0]
    assert actual['RootFS']['Layers'][:len(old['RootFS']['Layers'])]==old['RootFS']['Layers'],'RETAINED_BACKEND_LAYERS_NOT_REUSED'
   target=candidates/(role+'-image.tar.gz');partial=private/(role+'.partial')
   limit=cp.MAX_PAYLOAD_BYTES-cp.directory_bytes(candidates)-cp.directory_bytes(OUT)-cp.EVIDENCE_RESERVE
   proc=subprocess.Popen(['docker','save',images[role]],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
   try:
    with partial.open('wb') as raw:
     with gzip.GzipFile(filename='',fileobj=cp.BoundedCompressedWriter(raw,limit),mode='wb',compresslevel=3,mtime=0) as dst:
      while chunk:=proc.stdout.read(1024*1024):
       assert time.time()-BUDGET['startedAtEpoch']<BUDGET['maximumSeconds']-700,'ARCHIVE_CAPACITY_BOUND'
       dst.write(chunk)
    assert proc.wait(timeout=120)==0;partial.replace(target)
   finally:
    if proc.poll() is None:proc.kill()
    proc.stdout.close();proc.wait(timeout=10)
   components[role]={**PINS[role],'image':images[role],'createdAt':actual['Created'],'archiveFile':target.name,'archiveBytes':target.stat().st_size,'archiveSha256':cp.sha(target),'acceptance':'CANDIDATE_NOT_ACCEPTED','provenance':provenance[role]}
   if role!='backend':components[role]['buildId']=(ROOT/(role+'-source')/'empireai-web/.next/BUILD_ID').read_text().strip()
  (candidates/'immutable-images.json').write_text(json.dumps(components,indent=2)+'\n')
  (candidates/'source-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
  (candidates/'candidate-secret-scan.json').write_text(json.dumps({'schema':'work8-v26-delta-scan-v1','generatedRuntimeSecretsExist':False,'scans':scans},indent=2)+'\n')
  shutil.copyfile(SCRIPT/'v26-build-plan.json',candidates/'v26-build-plan.json')
  cp.write_index(candidates,'work8-candidate-upload-v1',secretScanPassed=True,beforeRuntimeSecrets=True,candidateStatus='CANDIDATE_NOT_ACCEPTED')
  assert cp.directory_bytes(candidates)+cp.directory_bytes(OUT)<=cp.MAX_PAYLOAD_BYTES-cp.EVIDENCE_RESERVE
  result.update(status='CANDIDATES_PREPARED_AWAITING_REMOTE_UPLOAD',candidateBytes=cp.directory_bytes(candidates),images=images,retainedBackendLayersReused=True,normalChange='exact compatible backend identity pin only',recoveryChange='reviewed authenticated historical projection and compatible backend pin')

try:main()
except Exception as error:result.update(failedStage=stage,error=str(error)[:200] if isinstance(error,AssertionError) else type(error).__name__)
finally:
 result['elapsedSeconds']=round(time.monotonic()-START,3)
 (OUT/'candidate-preparation-result.json').write_text(json.dumps(result,indent=2)+'\n')
 cp.write_index(OUT,'work8-bounded-upload-v1',exactGeneratedSecretCheck=True)
if result['status']=='FAIL':raise SystemExit(1)
