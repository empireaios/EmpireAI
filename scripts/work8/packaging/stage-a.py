#!/usr/bin/env python3
"""One packaging-only hosted preflight. No new image or application execution."""
import hashlib, importlib.util, json, os, pathlib, re, signal, subprocess, sys, tempfile, time
from compiler_job import BACKEND_IMAGE, run_compiler, sha, shared_hashes

ROOT=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve()
SCRIPT=ROOT/'controller/scripts/work8/packaging'
NATIVE=ROOT/'controller/scripts/work8/native-transition'
OUT=ROOT/'stage-a-output';OUT.mkdir(exist_ok=True)
BRANCH='work8/v27-20261101-compiler-preflight'
BACKEND_COMMIT='94aa919c7c39c4c9bf2c14b636232da028dba72d'
BACKEND_TREE='ad538f63dc1e2dfe392fea1cacb565d361e9a9e2'
BASE_BACKEND_COMMIT='8cd7ac029b9f23b36b02c84df62492d47275311d'
PLAN_SHA='101fd7b60be5dcbbafe3ec33b4106de1d8e335cd5b1fb67d078ab6f4b4b5617f'
PINS_SHA='1511f21cb02fe26e2b7a6322dc3f0a90ab8d56ff4de5e9d04aebe945e07b52c7'
IMPORTER_SHA='efef519df5557ffacb71a7b4c58cf668e5a316bfdfceae92f83d44130c405377'
PACKAGE_HELPER_SHA='16a6521a094138c4bc06994787604224cef73d6784578b0f4131bc7e41894157'
started=time.time();deadline=started+480
result={'schema':'work8-v27-stage-a-result-v1','status':'FAIL','stage':'EVENT_AUTHORITY','runId':os.environ.get('GITHUB_RUN_ID'),'controllerCommit':os.environ.get('GITHUB_SHA'),'applicationStarted':False,'newImagesBuilt':False,'frontendBuilt':False,'browserDriverPrepared':False,'wholeRowsAccepted':[]}
token=os.environ.pop('GH_RETAINED_READ_TOKEN',None)

def checkpoint(stage):
 result['stage']=stage;(OUT/'stage-a-result.json').write_text(json.dumps(result,indent=2)+'\n')
 assert time.time()<deadline-30,'STAGE_A_TIME_BOUND'

def command(args,cwd=None,seconds=60):
 response=subprocess.run(args,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=min(seconds,max(1,deadline-time.time()-30)),check=False)
 if response.returncode:
  sample=response.stderr[-65536:]
  (OUT/'stage-a-control-failure.json').write_text(json.dumps({'operation':args[0]+(':'+args[1] if len(args)>1 else ''),'exitCode':response.returncode,'stderrBytes':len(response.stderr),'stderrSha256':hashlib.sha256(response.stderr).hexdigest(),'recognizedErrorCodes':[code for code,pattern in [('PERMISSION_DENIED',rb'(?i)permission denied'),('DOCKER_DAEMON_UNAVAILABLE',rb'(?i)cannot connect to the docker daemon'),('IMAGE_UNAVAILABLE',rb'(?i)no such image')] if re.search(pattern,sample)],'arbitraryOutputRetained':False},indent=2)+'\n')
 assert response.returncode==0,'STAGE_A_CONTROL_COMMAND_FAILED'
 return response.stdout.decode()

def timeout_handler(*_):raise TimeoutError('STAGE_A_TIME_BOUND')
signal.signal(signal.SIGALRM,timeout_handler);signal.alarm(480)
try:
 checkpoint('EVENT_AUTHORITY')
 assert os.environ['GITHUB_EVENT_NAME']=='create' and os.environ['GITHUB_REF']=='refs/heads/'+BRANCH
 event=json.loads(pathlib.Path(os.environ['GITHUB_EVENT_PATH']).read_text());assert event['ref_type']=='branch' and event['ref']==BRANCH
 assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and os.environ['GITHUB_RUN_NUMBER']=='1'
 assert re.fullmatch('[0-9]+',os.environ['GITHUB_RUN_ID']) and re.fullmatch('[a-f0-9]{40}',os.environ['GITHUB_SHA'])
 assert command(['node','--version']).strip()=='v22.23.2'
 assert os.getuid()==os.geteuid()>0 and os.getgid()==os.getegid()>0,'HOST_UNPRIVILEGED_IDENTITY_REQUIRED'
 checkpoint('EXACT_REVIEWED_SOURCE')
 assert sha(NATIVE/'v26-build-plan.json')==PLAN_SHA and sha(NATIVE/'components.json')==PINS_SHA
 assert sha(NATIVE/'prepare-base-candidates.py')==IMPORTER_SHA and sha(NATIVE/'candidate_packages.py')==PACKAGE_HELPER_SHA
 source=ROOT/'backend-source';plan=json.loads((NATIVE/'v26-build-plan.json').read_text())
 assert command(['git','rev-parse','HEAD'],cwd=source).strip()==BACKEND_COMMIT
 assert command(['git','rev-parse','HEAD^{tree}'],cwd=source).strip()==BACKEND_TREE
 assert command(['git','rev-parse','HEAD^'],cwd=source).strip()==BASE_BACKEND_COMMIT
 changed=command(['git','diff','--name-only','HEAD^','HEAD'],cwd=source).splitlines()
 assert sorted(changed)==sorted(row['path'] for row in plan['sourceChanges']['backend'])
 for row in plan['sourceChanges']['backend']:assert sha(source/row['path'])==row['sha256']
 identities={'schema':'work8-v27-stage-a-source-identities-v1','backendCommit':BACKEND_COMMIT,'backendTree':BACKEND_TREE,'baseBackendCommit':BASE_BACKEND_COMMIT,'baseBackendImage':BACKEND_IMAGE,'planSha256':PLAN_SHA,'componentPinsSha256':PINS_SHA,'sharedImplementationHashes':shared_hashes(SCRIPT),'sourceChanges':plan['sourceChanges']['backend'],'retainedImporterSha256':IMPORTER_SHA,'retainedPackageHelperSha256':PACKAGE_HELPER_SHA}
 (OUT/'source-identities.json').write_text(json.dumps(identities,indent=2)+'\n')
 sys.path.insert(0,str(NATIVE));spec=importlib.util.spec_from_file_location('retained_importer',NATIVE/'prepare-base-candidates.py');importer=importlib.util.module_from_spec(spec);spec.loader.exec_module(importer)
 checkpoint('RETAINED_ARCHIVE_METADATA')
 assert token,'RETAINED_ARTIFACT_READ_CAPABILITY_REQUIRED'
 meta=importer.api('/repos/'+importer.REPOSITORY+'/actions/artifacts/'+str(importer.ARTIFACT_ID),token)
 assert meta['id']==importer.ARTIFACT_ID and meta['size_in_bytes']==importer.ARCHIVE_BYTES and meta['digest']=='sha256:'+importer.ARCHIVE_SHA and meta['expired'] is False
 assert meta['workflow_run']['id']==importer.PRIOR_RUN and meta['workflow_run']['head_sha']==importer.PRIOR_CONTROLLER
 signed=importer.api('/repos/'+importer.REPOSITORY+'/actions/artifacts/'+str(importer.ARTIFACT_ID)+'/zip',token,redirect=True);token=None
 with tempfile.TemporaryDirectory(prefix='work8-v27-retained-',dir=os.environ['RUNNER_TEMP']) as temporary:
  private=pathlib.Path(temporary);archive=private/'retained.zip'
  checkpoint('RETAINED_ARCHIVE_BYTES');importer.download(signed,archive,importer.ARCHIVE_BYTES,importer.ARCHIVE_BYTES);signed=None
  components=importer.verify_archive(archive,private/'retained');backend=components['backend'];assert backend['image']==BACKEND_IMAGE and backend['commit']==BASE_BACKEND_COMMIT
  checkpoint('ONLY_RETAINED_BACKEND_LAYERS');layers=importer.verify_image_archive(private/'retained'/backend['archiveFile'],backend);assert layers==9
  checkpoint('LOAD_ONLY_RETAINED_BACKEND');command(['docker','load','--input',str(private/'retained'/backend['archiveFile'])],seconds=120)
  inspected=json.loads(command(['docker','image','inspect',BACKEND_IMAGE]))[0];assert inspected['Id']==BACKEND_IMAGE
  assert inspected['Config']['User']=='0:0' and inspected['Config']['Labels']['org.opencontainers.image.revision']==BASE_BACKEND_COMMIT
  imported={'schema':'work8-v27-retained-backend-import-v1','status':'PASS_RETAINED_BACKEND_READY','originalRunId':importer.PRIOR_RUN,'artifactId':importer.ARTIFACT_ID,'outerArchiveBytes':importer.ARCHIVE_BYTES,'outerArchiveSha256':importer.ARCHIVE_SHA,'originalIndexSha256':importer.INDEX_SHA,'backend':backend,'backendLayersVerified':layers,'baseConfiguredUser':inspected['Config']['User'],'frontendImagesLoaded':False,'browserDriverPrepared':False,'applicationStarted':False,'newImagesBuilt':False,'providerCredentialPassedToCompiler':False}
  (OUT/'retained-backend-import.json').write_text(json.dumps(imported,indent=2)+'\n')
 checkpoint('ACTUAL_ISOLATED_COMPILER_PERMISSION_PREFLIGHT')
 permission=run_compiler(script_directory=SCRIPT,source_root=source,plan_path=NATIVE/'v26-build-plan.json',output_root=OUT/'generated',evidence_directory=OUT,deadline_epoch=deadline)
 assert permission['status']=='PASS_PACKAGING_PERMISSION_AND_EXACT_OUTPUTS'
 result.update(status='PASS_COMPILER_PERMISSION_PREFLIGHT',stage='COMPLETE',planSha256=PLAN_SHA,componentPinsSha256=PINS_SHA,backendCommit=BACKEND_COMMIT,backendImage=BACKEND_IMAGE,sharedImplementationHashes=shared_hashes(SCRIPT),permissionReceiptSha256=sha(OUT/'compiler-permission-receipt.json'),generatedOutputs=permission['generatedOutputs'],compilerContainerAbsenceVerified=permission['compilerContainerAbsenceVerified'],stageBPermittedByThisReceiptAlone=False)
except Exception as error:
 safe=str(error) if isinstance(error,AssertionError) and re.fullmatch('[A-Z0-9_]{1,120}',str(error)) else ('STAGE_A_TIME_BOUND' if isinstance(error,TimeoutError) else type(error).__name__)
 result['firstFailure']={'stage':result['stage'],'code':safe,'arbitraryErrorValuesRetained':False}
finally:
 signal.alarm(0);token=None;result['elapsedSeconds']=round(time.time()-started,3)
 (OUT/'stage-a-result.json').write_text(json.dumps(result,indent=2)+'\n')
if result['status']!='PASS_COMPILER_PERMISSION_PREFLIGHT':raise SystemExit(1)
