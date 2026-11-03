#!/usr/bin/env python3
"""Single build-context diagnostic: safe metadata only, no application/image run."""
import hashlib, io, json, os, pathlib, shutil, signal, subprocess, tarfile, tempfile, time

ROOT=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve()
SCRIPT=ROOT/'controller/scripts/work8/native-transition'
OUT=ROOT/'scan-diagnostic-output'; OUT.mkdir()
PRIVATE=pathlib.Path(tempfile.mkdtemp(prefix='work8-v23-private-scan-',dir=os.environ['RUNNER_TEMP']))
MANIFEST=json.loads((SCRIPT/'components.json').read_text())
NODE='node:22.23.2-bookworm-slim@sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9'
BRANCH='work8/v23-20261031-scan'; START=time.monotonic(); DEADLINE=START+450
MAX_OUTPUT=4*1024**2; MAX_PAYLOAD=MAX_OUTPUT-64*1024
stage='preflight'; observations=[]; contexts={}; sources={}; lockfiles={}
result={'schema':'work8-v23-bounded-scan-diagnostic-v1','status':'FAIL','wholeRowsAccepted':[], 'applicationRuntimeStarted':False,'dockerImagesBuilt':False,'providerSecretsSupplied':False,'productionDataSupplied':False,'rawContextOrBuildLogsRetained':False,'maxJobMinutes':10,'maxArtifactBytes':MAX_OUTPUT,'automaticRetries':0}
class Refused(Exception):pass
def alarm_expired(signum,frame):raise Refused('DIAGNOSTIC_DURATION_BOUND')
signal.signal(signal.SIGALRM,alarm_expired);signal.alarm(450)

def sha(path):
 with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def remaining(cap):
 duration=min(cap,DEADLINE-time.monotonic())
 if duration<=0:raise Refused('DIAGNOSTIC_DURATION_BOUND')
 return duration
def terminate_command(proc):
 try:os.killpg(proc.pid,signal.SIGKILL)
 except ProcessLookupError:pass
 try:proc.communicate(timeout=5)
 except subprocess.TimeoutExpired:
  if proc.stdout:proc.stdout.close()
  try:proc.wait(timeout=2)
  except subprocess.TimeoutExpired:pass

def run(args,*,cwd=None,cap=180,label):
 # Command output can contain arbitrary dependency content: never print or save it
 # to an uploadable path, including error cases. Metadata carries only fixed labels.
 started=time.monotonic()
 proc=subprocess.Popen(args,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,start_new_session=True)
 try:
  stdout,_=proc.communicate(timeout=remaining(cap))
 except subprocess.TimeoutExpired:
  terminate_command(proc)
  observations.append({'operation':label,'status':'TIMEOUT','elapsedSeconds':round(time.monotonic()-started,3)})
  raise Refused('BOUNDED_BUILD_COMMAND_TIMEOUT') from None
 except BaseException:
  terminate_command(proc)
  raise
 observations.append({'operation':label,'status':'PASS' if proc.returncode==0 else 'FAIL','exitCode':proc.returncode,'elapsedSeconds':round(time.monotonic()-started,3)})
 if proc.returncode!=0:raise Refused('BOUNDED_BUILD_COMMAND_FAILED')
 return stdout

def check_equal(value,expected,code):
 if value!=expected:raise Refused(code)

def lock_identity(role,source,relative):
 p=source/relative
 if not p.is_file():raise Refused('LOCKFILE_UNAVAILABLE')
 lockfiles[(role,relative)]={'sha256':sha(p),'bytes':p.stat().st_size}

try:
 check_equal(os.environ.get('GITHUB_EVENT_NAME'),'create','EVENT_REFUSED')
 check_equal(os.environ.get('GITHUB_REF'),'refs/heads/'+BRANCH,'BRANCH_REFUSED')
 event=json.loads(pathlib.Path(os.environ['GITHUB_EVENT_PATH']).read_text())
 check_equal(event.get('ref_type'),'branch','REF_TYPE_REFUSED');check_equal(event.get('ref'),BRANCH,'EVENT_BRANCH_REFUSED')
 check_equal(os.environ.get('GITHUB_RUN_ATTEMPT'),'1','RETRY_REFUSED');check_equal(os.environ.get('GITHUB_RUN_NUMBER'),'1','REPEATED_RUN_REFUSED')
 check_equal(run(['node','--version'],label='node-version').decode().strip(),'v22.23.2','NODE_VERSION_REFUSED')
 original_scanner=SCRIPT/'candidate_packages.py'
 check_equal(sha(original_scanner),'5d297cb6e28ca84a9294e9cd7cc80218a0f17d77b736a5fa208e57edc3003560','ORIGINAL_SCANNER_IDENTITY_REFUSED')
 for role in ['backend','normal','recovery']:
  source=ROOT/(role+'-source');sources[role]=source;entry=MANIFEST[role]
  check_equal(run(['git','rev-parse','HEAD'],cwd=source,label=role+'-commit').decode().strip(),entry['commit'],'SOURCE_COMMIT_REFUSED')
  check_equal(run(['git','rev-parse','HEAD^{tree}'],cwd=source,label=role+'-tree').decode().strip(),entry['tree'],'SOURCE_TREE_REFUSED')
  check_equal(run(['git','status','--porcelain'],cwd=source,label=role+'-clean-checkout').decode().strip(),'','SOURCE_CHECKOUT_DIRTY')
  paths=['backend/package-lock.json','pillow/package-lock.json'] if role=='backend' else ['empireai-web/package-lock.json']
  for relative in paths:lock_identity(role,source,relative)
 stage='backend-build-context';src=sources['backend']
 commands=[(['npm','ci','--prefix','pillow','--no-audit','--no-fund'],'pillow-dependencies'),(['npm','ci','--prefix','backend','--no-audit','--no-fund'],'backend-dependencies'),(['node','scripts/sync-pillow-governance.mjs'],'governance-sync'),(['npm','run','build','--prefix','pillow'],'pillow-compile'),(['npm','run','build','--prefix','backend'],'backend-compile')]
 for command,label in commands:run(command,cwd=src,cap=180,label=label)
 context=PRIVATE/'backend-context';context.mkdir();contexts['backend']=context
 archive=run(['git','archive','HEAD'],cwd=src,label='backend-exact-git-archive')
 with tarfile.open(fileobj=io.BytesIO(archive)) as t:t.extractall(context,filter='data')
 del archive
 for package in ['backend','pillow']:
  for directory in ['dist','node_modules']:shutil.copytree(src/package/directory,context/package/directory)
 if (context/'.env').exists() or (context/'backend/.env').exists():raise Refused('RUNTIME_ENV_INPUT_REFUSED')
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
 (context/'Dockerfile').write_text(docker);(context/'.dockerignore').write_text('.git\n.env\n**/.env\n')
 for role in ['normal','recovery']:
  stage=role+'-build-context';web=sources[role]/'empireai-web'
  run(['npm','ci','--ignore-scripts','--no-audit','--no-fund'],cwd=web,cap=180,label=role+'-dependencies')
  run(['npm','run','build'],cwd=web,cap=200,label=role+'-compile')
  standalone=web/'.next/standalone'
  if not (standalone/'server.js').is_file():raise Refused('STANDALONE_OUTPUT_UNAVAILABLE')
  context=PRIVATE/(role+'-context');context.mkdir();contexts[role]=context
  shutil.copytree(standalone,context/'app');shutil.copytree(web/'.next/static',context/'app/.next/static')
  if (web/'public').exists():shutil.copytree(web/'public',context/'app/public',dirs_exist_ok=True)
  (context/'app/.next/cache').mkdir(exist_ok=True)
  (context/'Dockerfile').write_text(f'FROM {NODE}\nWORKDIR /frontend\nCOPY --chown=0:0 app/ /frontend/\nLABEL org.opencontainers.image.revision="{MANIFEST[role]["commit"]}" io.empireai.source-tree="{MANIFEST[role]["tree"]}"\nENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1\nENTRYPOINT ["node","server.js"]\n')
 stage='verify-unchanged-lockfiles'
 for (role,relative),identity in lockfiles.items():
  check_equal(sha(sources[role]/relative),identity['sha256'],'DEPENDENCY_LOCKFILE_CHANGED')
 stage='all-rule-bounded-candidate-scan'
 remaining(1)
 import diagnostic_scan
 report=diagnostic_scan.scan_all(contexts,sources,MANIFEST,OUT/'scan-findings.json')
 result.update(status='DIAGNOSTIC_COMPLETE_CLASSIFICATION_REQUIRED' if report.get('complete') is True else 'DIAGNOSTIC_INCOMPLETE_BLOCKED',allCandidateContextsScanned=report.get('complete') is True,diagnosticComplete=report.get('complete') is True,classificationStatus=report.get('status'),findingCount=len(report.get('findings',[])),structuralFindingCount=len(report.get('structuralFindings',[])),canProceedToNativeAcceptance=False,sourcePins=MANIFEST,dependencyLockfiles=[{'role':role,'path':relative,**identity} for (role,relative),identity in lockfiles.items()],originalScannerSHA256=sha(original_scanner),diagnosticScannerSHA256=sha(SCRIPT/'diagnostic_scan.py'),buildRecipeSourceCommit='56009e665de3ba38da0db83e4db5c2c5ab10584b',originalFailedRun=41173959989,exactOriginalGeneratedBytesClaim=False,generatedByteScope='Reconstructed candidate contexts from identical source/lockfiles/Node/build recipe; original discarded generated bytes cannot be proven byte-identical.')
except BaseException as error:
 result['failedStage']=stage
 # Never serialize arbitrary exceptions, paths or subprocess content.
 result['failureCode']=str(error) if isinstance(error,Refused) else 'INTERNAL_DIAGNOSTIC_FAILURE'
 result['failureType']=type(error).__name__ if type(error).__name__ in {'AssertionError','OSError','ValueError','KeyError','TimeoutError','Refused','SystemExit','KeyboardInterrupt'} else 'OTHER'
finally:
 signal.alarm(0)
 cleanup=True
 try:shutil.rmtree(PRIVATE)
 except BaseException:cleanup=False
 result['privateContextRemoved']=cleanup
 if not cleanup:result['status']='FAIL';result['failureCode']='PRIVATE_CONTEXT_CLEANUP_FAILED'
 result['operations']=observations;result['elapsedSeconds']=round(time.monotonic()-START,3)
 (OUT/'scan-diagnostic-result.json').write_text(json.dumps(result,indent=2)+'\n')
 files=[]
 for p in sorted(OUT.iterdir()):
  if not p.is_file() or p.is_symlink() or p.suffix!='.json':raise SystemExit('SAFE_OUTPUT_SHAPE_REFUSED')
  files.append({'path':p.name,'bytes':p.stat().st_size,'sha256':sha(p)})
 (OUT/'artifact-index.json').write_text(json.dumps({'schema':'work8-v23-safe-scan-artifact-v1','maxBytes':MAX_OUTPUT,'maxFiles':3,'files':files,'rawValuesOrSnippetsRetained':False,'candidateBytesRetained':False},indent=2)+'\n')
 if sum(p.stat().st_size for p in OUT.iterdir())>MAX_PAYLOAD:raise SystemExit('SAFE_OUTPUT_BYTES_BOUND')
 if result['status']=='FAIL':raise SystemExit(1)
