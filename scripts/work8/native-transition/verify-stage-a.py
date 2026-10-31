#!/usr/bin/env python3
"""Require independently accepted, source-bound Stage A bytes before any Stage B work."""
import hashlib,json,os,pathlib,re,stat,tempfile,time,urllib.error,urllib.parse,urllib.request,zipfile

ROOT=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve()
SCRIPT=ROOT/'controller/scripts/work8/native-transition'
OUT=ROOT/'native-transition-output';OUT.mkdir(exist_ok=True)
APPROVAL=json.loads((SCRIPT/'stage-a-approval.json').read_text())
REPOSITORY='empireaios/EmpireAI'
BRANCH='work8/v27-20261101-a5-acceptance'
STAGE_A_BRANCH='work8/v27-20261101-compiler-preflight'
MAX_STAGE_A=16*1024**2
result={'schema':'WORK8_V27_STAGE_A_GATE_V1','status':'FAIL','applicationRuntimeStarted':False,'compilerRepeated':False,'automaticSuccessor':False}
sensitive_values=[]
(OUT/'workflow-budget.json').write_text(json.dumps({'startedAtEpoch':time.time(),'maximumSeconds':1650,'cleanupAndUploadReserveSeconds':120})+'\n')

def sha(path):
 with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,request,fp,code,message,headers,newurl):return None

def api(path,token,redirect=False):
 assert re.fullmatch(r'/repos/empireaios/EmpireAI/actions/(?:runs/[0-9]+|artifacts/[0-9]+(?:/zip)?)',path)
 request=urllib.request.Request('https://api.github.com'+path,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
 try:
  with urllib.request.build_opener(NoRedirect).open(request,timeout=30) as response:
   assert not redirect,'STAGE_A_REDIRECT_REQUIRED';return json.loads(response.read(1048576))
 except urllib.error.HTTPError as error:
  assert redirect and error.code in (302,307),'STAGE_A_API_READ_FAILED'
  url=error.headers.get('Location','');parsed=urllib.parse.urlparse(url)
  assert parsed.scheme=='https' and not parsed.username and not parsed.password
  assert parsed.hostname and (parsed.hostname.endswith('.blob.core.windows.net') or parsed.hostname.endswith('.githubusercontent.com') or parsed.hostname.endswith('.s3.amazonaws.com') or parsed.hostname.endswith('.actions.githubusercontent.com')),'STAGE_A_REDIRECT_HOST_REFUSED'
  return url

try:
 assert os.environ['GITHUB_EVENT_NAME']=='create' and os.environ['GITHUB_REF']=='refs/heads/'+BRANCH
 event=json.loads(pathlib.Path(os.environ['GITHUB_EVENT_PATH']).read_text());assert event['ref_type']=='branch' and event['ref']==BRANCH
 assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and os.environ['GITHUB_RUN_NUMBER']=='1'
 assert APPROVAL['schema']=='WORK8_V27_STAGE_A_APPROVAL_V1' and APPROVAL['approved'] is True,'INDEPENDENT_STAGE_A_APPROVAL_REQUIRED'
 assert APPROVAL['independentReview']['decision']=='PASS' and re.fullmatch('[a-f0-9]{64}',APPROVAL['independentReview']['sha256']),'INDEPENDENT_REVIEW_IDENTITY_REQUIRED'
 approved_run=APPROVAL['stageA'];artifact=APPROVAL['artifact']
 assert approved_run['branch']==STAGE_A_BRANCH and type(approved_run['runId']) is int and re.fullmatch('[a-f0-9]{40}',approved_run['controllerCommit'])
 assert type(artifact['id']) is int and type(artifact['bytes']) is int and 0<artifact['bytes']<=MAX_STAGE_A and re.fullmatch('[a-f0-9]{64}',artifact['sha256'])
 assert APPROVAL['componentPinsSha256']==sha(SCRIPT/'components.json') and APPROVAL['sourcePlanSha256']==sha(SCRIPT/'v26-build-plan.json'),'STAGE_A_SOURCE_CONTRACT_MISMATCH'
 expected_shared={'scripts/work8/packaging/compiler_job.py','scripts/work8/packaging/isolated-compiler.cjs'}
 assert set(APPROVAL['sharedFiles'])==expected_shared,'SHARED_COMPILER_FILE_SET_MISMATCH'
 for name,digest in APPROVAL['sharedFiles'].items():assert re.fullmatch('[a-f0-9]{64}',digest) and sha(ROOT/'controller'/name)==digest,'STAGE_A_STAGE_B_SHARED_FILE_MISMATCH'
 token=os.environ.pop('GH_STAGE_A_READ_TOKEN');sensitive_values.append(token.encode())
 run=api('/repos/'+REPOSITORY+'/actions/runs/'+str(approved_run['runId']),token)
 assert run['id']==approved_run['runId'] and run['head_sha']==approved_run['controllerCommit'] and run['head_branch']==STAGE_A_BRANCH and run['event']=='create' and run['status']=='completed' and run['conclusion']=='success' and run['run_attempt']==1,'STAGE_A_RUN_IDENTITY_OR_RESULT_MISMATCH'
 meta=api('/repos/'+REPOSITORY+'/actions/artifacts/'+str(artifact['id']),token)
 assert meta['id']==artifact['id'] and meta['size_in_bytes']==artifact['bytes'] and meta['digest']=='sha256:'+artifact['sha256'] and meta['expired'] is False,'STAGE_A_ARTIFACT_IDENTITY_MISMATCH'
 assert meta['workflow_run']['id']==approved_run['runId'] and meta['workflow_run']['head_sha']==approved_run['controllerCommit'],'STAGE_A_ARTIFACT_RUN_MISMATCH'
 signed=api('/repos/'+REPOSITORY+'/actions/artifacts/'+str(artifact['id'])+'/zip',token,True);del token
 destination=ROOT/'stage-a-approved-inputs';assert not destination.exists(),'STAGE_A_INPUT_REPLACEMENT_REFUSED'
 with tempfile.TemporaryDirectory(prefix='work8-approved-stage-a-',dir=os.environ['RUNNER_TEMP']) as temporary:
  archive=pathlib.Path(temporary)/'stage-a.zip'
  # The signed provider request never receives the GitHub Authorization header.
  with urllib.request.urlopen(urllib.request.Request(signed,headers={'Accept':'application/octet-stream'}),timeout=90) as response,archive.open('xb') as out:
   count=0
   while chunk:=response.read(1048576):count+=len(chunk);assert count<=artifact['bytes'],'STAGE_A_DOWNLOAD_BOUND';out.write(chunk)
  del signed
  assert archive.stat().st_size==artifact['bytes'] and sha(archive)==artifact['sha256'],'STAGE_A_ZIP_CHECKSUM_MISMATCH'
  members={entry['path']:entry for entry in artifact['members']};assert len(members)==len(artifact['members']) and 0<len(members)<=128
  assert sum(entry['bytes'] for entry in members.values())<=MAX_STAGE_A,'STAGE_A_EXPANSION_BOUND'
  destination.mkdir()
  with zipfile.ZipFile(archive) as zipped:
   assert set(zipped.namelist())==set(members) and len(zipped.namelist())==len(members),'STAGE_A_MEMBER_SET_MISMATCH'
   for item in zipped.infolist():
    relative=pathlib.PurePosixPath(item.filename)
    assert not relative.is_absolute() and '..' not in relative.parts and '\\' not in item.filename and not item.is_dir(),'STAGE_A_MEMBER_PATH_REFUSED'
    assert stat.S_IFMT(item.external_attr>>16) in (0,stat.S_IFREG),'STAGE_A_NONREGULAR_MEMBER_REFUSED'
    expected=members[item.filename];assert item.file_size==expected['bytes'] and re.fullmatch('[a-f0-9]{64}',expected['sha256'])
    target=destination/relative;target.parent.mkdir(parents=True,exist_ok=True)
    with zipped.open(item) as source,target.open('xb') as out:
     while chunk:=source.read(1048576):out.write(chunk)
    assert sha(target)==expected['sha256'],'STAGE_A_MEMBER_CHECKSUM_MISMATCH'
 stage_result=json.loads((destination/'stage-a-result.json').read_text())
 assert stage_result['status']==APPROVAL['expectedStageAStatus'],'STAGE_A_RECEIPT_STATUS_MISMATCH'
 assert APPROVAL['expectedStageAStatus']=='PASS_COMPILER_PERMISSION_PREFLIGHT','STAGE_A_APPROVED_STATUS_REFUSED'
 import sys
 sys.path.insert(0,str(SCRIPT.parent/'packaging'))
 from compiler_job import verify_compiled_outputs,BACKEND_IMAGE
 outputs=verify_compiled_outputs(destination/'generated',SCRIPT/'v26-build-plan.json')
 permission=json.loads((destination/'compiler-permission-receipt.json').read_text())
 assert permission['status']=='PASS_PACKAGING_PERMISSION_AND_EXACT_OUTPUTS' and permission['planSha256']==APPROVAL['sourcePlanSha256'],'STAGE_A_PERMISSION_RECEIPT_MISMATCH'
 assert permission['sharedImplementationHashes']=={pathlib.PurePosixPath(name).name:digest for name,digest in APPROVAL['sharedFiles'].items()},'STAGE_A_RECEIPT_SHARED_HASH_MISMATCH'
 assert permission['backendImage']==BACKEND_IMAGE and permission['applicationStarted'] is False and permission['newImagesBuilt'] is False and permission['frontendBuilt'] is False,'STAGE_A_SCOPE_MISMATCH'
 assert permission['compilerContainerAbsenceVerified'] is True and permission['generatedOutputs']==outputs,'STAGE_A_OUTPUT_OR_CLEANUP_MISMATCH'
 result.update(status='PASS_APPROVED_STAGE_A_AND_IDENTICAL_COMPILER',stageARunId=approved_run['runId'],stageAController=approved_run['controllerCommit'],stageAArtifactId=artifact['id'],stageAArchiveBytes=artifact['bytes'],stageAArchiveSha256=artifact['sha256'],independentReviewSha256=APPROVAL['independentReview']['sha256'],sourcePlanSha256=APPROVAL['sourcePlanSha256'],componentPinsSha256=APPROVAL['componentPinsSha256'],sharedFiles=APPROVAL['sharedFiles'],verifiedCompiledOutputs=outputs)
except Exception as error:
 result['failure']=str(error)[:160] if isinstance(error,AssertionError) and re.fullmatch('[A-Z0-9_:-]{1,160}',str(error)) else type(error).__name__
finally:
 (OUT/'stage-a-gate.json').write_text(json.dumps(result,indent=2)+'\n')
 # Run exact known credential and retained pattern checks before claiming scan success.
 from candidate_packages import PATTERNS,write_index
 for path in OUT.iterdir():
  assert path.is_file() and not path.is_symlink(),'GATE_EVIDENCE_FILE_REFUSED'
  data=path.read_bytes();assert not any(value and value in data for value in sensitive_values),'GATE_EXACT_SECRET_REFUSED'
  assert not any(pattern.search(data) for _,pattern in PATTERNS),'GATE_SECRET_PATTERN_REFUSED'
 write_index(OUT,'work8-bounded-upload-v1',exactGeneratedSecretCheck=True,exactKnownCredentialCheck=True,runtimeSecretsGenerated=False,retainedPatternScanPassed=True)
if result['status']!='PASS_APPROVED_STAGE_A_AND_IDENTICAL_COMPILER':raise SystemExit(1)
