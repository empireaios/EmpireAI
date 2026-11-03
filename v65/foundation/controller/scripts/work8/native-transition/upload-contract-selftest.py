#!/usr/bin/env python3
"""Run the actual diagnostic scanner and inherited uploader on isolated fixtures.

No upload or network request occurs: the real publication gate must emit the
same `allowed=true` output consumed by the pinned Actions uploader. Fixtures
contain synthetic bytes only and are removed after each check.
"""
import argparse,hashlib,json,os,pathlib,subprocess,sys,tempfile
from candidate_packages import MAX_BYTES,MAX_PAYLOAD_BYTES,ZIP_ENVELOPE_RESERVE

HERE=pathlib.Path(__file__).resolve().parent
STAGE_MAX=128*1024**2


def digest(path):
 with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()


def write_json(path,value):path.write_text(json.dumps(value,sort_keys=True)+'\n')


def make_index(root,max_bytes=MAX_BYTES):
 files=[]
 for path in sorted(root.iterdir()):
  if path.name=='artifact-index.json':continue
  files.append({'path':path.name,'bytes':path.stat().st_size,'sha256':digest(path)})
 write_json(root/'artifact-index.json',{'schema':'work8-bounded-upload-v1','maxBytes':max_bytes,'exactGeneratedSecretCheck':True,'files':files})


def run_case(name,expected,mutate=None,stage='preflight',index_max=MAX_BYTES,receipt_status='PASS',expected_code=None,expected_fallback=False):
 with tempfile.TemporaryDirectory(prefix='work8-v31-upload-contract-') as temp:
  work=pathlib.Path(temp);root=work/'native-transition-output';root.mkdir(mode=0o700)
  budget={'reservationId':'work8-v31-native-brain-20261101','stage':stage,'stageMaximumArtifactBytes':STAGE_MAX if stage=='preflight' else 1920*1024**2,'priorStageRetainedArtifactBytes':0 if stage=='preflight' else 1024}
  write_json(root/'workflow-budget.json',budget)
  write_json(root/'runner-result.json',{'schema':'work8-v31-synthetic-diagnostic-fixture-v1','status':receipt_status,'syntheticPrivateTestOnly':True,'rawRecords':False,'credentials':False})
  make_index(root,index_max)
  if mutate:mutate(root)
  env=dict(os.environ,GITHUB_WORKSPACE=str(work),GITHUB_OUTPUT=str(work/'github-output'))
  result=subprocess.run([sys.executable,str(HERE/'retained-upload-preflight.py')],env=env,capture_output=True,text=True,timeout=20)
  output=(work/'github-output').read_text() if (work/'github-output').exists() else ''
  actual=result.returncode==0 and output.strip().splitlines()[-1:] == ['allowed=true']
  safe_codes=[]
  for line in result.stdout.splitlines():
   if line.startswith('WORK8_UPLOAD_DIAGNOSTIC '):
    row=json.loads(line.removeprefix('WORK8_UPLOAD_DIAGNOSTIC '));safe_codes.append(row['category'])
  assert actual is expected,(name,'UNEXPECTED_GATE_OUTCOME')
  if expected_code:assert expected_code in safe_codes,(name,'EXPECTED_GATE_CATEGORY_MISSING')
  fallback_lines=[line for line in result.stdout.splitlines() if line.startswith('WORK8_NATIVE_FIRST_FAILURE ')]
  if expected_fallback:
   assert len(fallback_lines)==1,(name,'FIRST_CAUSAL_FALLBACK_MISSING')
   fallback=json.loads(fallback_lines[0].removeprefix('WORK8_NATIVE_FIRST_FAILURE '))
   assert fallback['firstFailure'] is True and fallback['errno']=='EACCES',(name,'FIRST_CAUSAL_FALLBACK_CHANGED')
   assert fallback['identity']['effectiveUid']==65534,(name,'FALLBACK_IDENTITY_CHANGED')
   assert fallback['sourceFrames']==['live-brain-hook.mjs:12:3'],(name,'FALLBACK_FRAME_CHANGED')
  assert 'synthetic-owner-private' not in result.stdout,(name,'UNALLOWLISTED_PRIVATE_FIELD_ECHOED')
  if not expected:assert 'allowed=false' in output,(name,'FAIL_OPEN_ACTION_OUTPUT')
  # This synthetic detector input must never be echoed by either actual gate.
  secret=b'AK'+b'IA'+b'A'*16
  assert secret not in (result.stdout+result.stderr).encode(),(name,'SYNTHETIC_SECRET_ECHOED')
  return {'name':name,'expected':'PERMIT' if expected else 'REFUSE','observed':'PERMIT' if actual else 'REFUSE','passed':True,'processExit':result.returncode,'safeGateCategories':safe_codes,'actualWrapperExecuted':True,'canonicalUploaderExecuted':expected or 'CANONICAL_UPLOAD_GATE_REFUSED' in safe_codes,'stdoutSha256':hashlib.sha256(result.stdout.encode()).hexdigest(),'stderrSha256':hashlib.sha256(result.stderr.encode()).hexdigest(),'firstCausalFallbackVerified':expected_fallback,'rawOutputRetained':False}


def mutate_index(root,key,value):
 p=root/'artifact-index.json';d=json.loads(p.read_text());d[key]=value;write_json(p,d)


def add_indexed(root,name,data):
 (root/name).write_bytes(data);make_index(root)


def sparse(root,size):
 with (root/'bounded-diagnostic.log').open('wb') as f:f.truncate(size)
 # Stage/aggregate byte gate must refuse before any expensive read/hash.
 d=json.loads((root/'artifact-index.json').read_text());d['files'].append({'path':'bounded-diagnostic.log','bytes':size,'sha256':'0'*64});write_json(root/'artifact-index.json',d)


def budget_change(root,key,value):
 p=root/'workflow-budget.json';d=json.loads(p.read_text());d[key]=value;write_json(p,d);make_index(root)


def native_failure(root,refusal_kind=None):
 row={'schema':'work8-v31-native-first-failure-v1','firstFailure':True,'stage':'LIVE_BRAIN_CAPTURE','assertion':'LIVE_BRAIN_CAPTURE_FAILED','operation':'REQUEST_CRITICAL_PERSIST','errno':'EACCES','sourceFrames':['live-brain-hook.mjs:12:3'],'identityScope':'NATIVE_BRAIN_WORKER','identity':{'pid':42,'effectiveUid':65534,'effectiveGid':65534,'capabilities':{'CapEff':'0'*16},'noNewPrivileges':True,'seccomp':2},'state':{'moduleInitialized':True,'applicationInitialized':True,'captureRequestReached':True,'privateReceiptWritten':True,'captureFenceAcquired':True,'captureFenceReleased':True,'persistenceCompleted':False},'containerLifecycle':{'role':'backend','status':'running','exitCode':0,'oomKilled':False},'privateTestField':'synthetic-owner-private'}
 from native_diagnostics import save_first
 save_first(root,row);row=json.loads((root/'first-native-failure.json').read_text());make_index(root)
 if refusal_kind=='index':mutate_index(root,'maxBytes',STAGE_MAX)
 if refusal_kind=='scanner':add_indexed(root,'synthetic-detector-control.txt',b'AK'+b'IA'+b'A'*16)
 if refusal_kind=='malicious':
  row['privateTestField']='synthetic-owner-private';row['assertion']=(b'AK'+b'IA'+b'A'*16).decode();write_json(root/'first-native-failure.json',row);make_index(root)


def main():
 parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);args=parser.parse_args()
 cases=[]
 cases.append(run_case('valid-success-receipt',True))
 cases.append(run_case('valid-sanitized-failure-receipt',True,receipt_status='FAIL'))
 cases.append(run_case('valid-full-stage-receipt',True,stage='full'))
 cases.append(run_case('v30-stage-limit-in-canonical-index-reproduced',False,index_max=STAGE_MAX,expected_code='CANONICAL_UPLOAD_GATE_REFUSED'))
 cases.append(run_case('invalid-index-limit-refused',False,index_max=MAX_BYTES+1,expected_code='CANONICAL_UPLOAD_GATE_REFUSED'))
 cases.append(run_case('over-aggregate-byte-budget-refused',False,lambda r:sparse(r,MAX_BYTES+1),expected_code='STAGE_ARTIFACT_ALLOCATION_EXCEEDED'))
 cases.append(run_case('stage-allocation-independent-of-canonical-index',False,lambda r:sparse(r,STAGE_MAX-ZIP_ENVELOPE_RESERVE+1),expected_code='STAGE_ARTIFACT_ALLOCATION_EXCEEDED'))
 cases.append(run_case('secret-pattern-refused',False,lambda r:add_indexed(r,'synthetic-detector-control.txt',b'AK'+b'IA'+b'A'*16),expected_code='NEW_DIAGNOSTIC_SECRET_PATTERN_REFUSED'))
 cases.append(run_case('unindexed-file-refused',False,lambda r:(r/'unindexed.txt').write_text('synthetic\n'),expected_code='CANONICAL_UPLOAD_GATE_REFUSED'))
 cases.append(run_case('unexpected-database-file-refused',False,lambda r:add_indexed(r,'unexpected.sqlite',b'synthetic database control only'),expected_code='DIAGNOSTIC_FILE_TYPE_REFUSED'))
 cases.append(run_case('database-disguised-as-text-refused',False,lambda r:add_indexed(r,'unexpected.log',b'SQLite format 3\x00synthetic'),expected_code='DATABASE_CONTENT_REFUSED'))
 cases.append(run_case('file-digest-mismatch-refused',False,lambda r:(r/'runner-result.json').write_text('{"synthetic":"altered-after-index"}\n'),expected_code='CANONICAL_UPLOAD_GATE_REFUSED'))
 cases.append(run_case('symlink-refused',False,lambda r:(r/'linked.txt').symlink_to(r/'runner-result.json'),expected_code='NONREGULAR_ARTIFACT_REFUSED'))
 cases.append(run_case('hardlink-refused',False,lambda r:os.link(r/'runner-result.json',r/'hardlinked.txt'),expected_code='NONREGULAR_ARTIFACT_REFUSED'))
 cases.append(run_case('unauthorized-file-type-refused',False,lambda r:add_indexed(r,'unexpected.bin',b'controlled bytes'),expected_code='DIAGNOSTIC_FILE_TYPE_REFUSED'))
 cases.append(run_case('preflight-image-type-refused',False,lambda r:add_indexed(r,'unexpected.png',b'\x89PNG\r\n\x1a\n'),expected_code='DIAGNOSTIC_FILE_TYPE_REFUSED'))
 cases.append(run_case('nonregular-directory-refused',False,lambda r:(r/'nested').mkdir(),expected_code='NONREGULAR_ARTIFACT_REFUSED'))
 cases.append(run_case('stage-limit-inflation-refused',False,lambda r:budget_change(r,'stageMaximumArtifactBytes',MAX_BYTES),expected_code='STAGE_ARTIFACT_ALLOCATION_CHANGED'))
 cases.append(run_case('unverified-full-prior-allocation-refused',False,lambda r:budget_change(r,'priorStageRetainedArtifactBytes',0),stage='full',expected_code='PRIOR_STAGE_ALLOCATION_REFUSED'))
 cases.append(run_case('candidate-reupload-type-refused',False,lambda r:add_indexed(r,'backend-image.tar.gz',b'controlled bytes'),expected_code='DIAGNOSTIC_FILE_TYPE_REFUSED'))
 cases.append(run_case('canonical-secret-assertion-required',False,lambda r:mutate_index(r,'exactGeneratedSecretCheck',False),expected_code='CANONICAL_UPLOAD_GATE_REFUSED'))
 cases.append(run_case('duplicate-index-member-refused',False,lambda r:mutate_index(r,'files',json.loads((r/'artifact-index.json').read_text())['files']*2),expected_code='CANONICAL_UPLOAD_GATE_REFUSED'))
 cases.append(run_case('unsafe-diagnostic-name-refused',False,lambda r:add_indexed(r,'.hidden.json',b'{}'),expected_code='DIAGNOSTIC_FILENAME_REFUSED'))
 cases.append(run_case('oversized-budget-metadata-refused',False,lambda r:(r/'workflow-budget.json').write_text('x'*16385),expected_code='WORKFLOW_BUDGET_METADATA_REFUSED'))
 cases.append(run_case('oversized-index-metadata-refused',False,lambda r:mutate_index(r,'padding','x'*(256*1024)),expected_code='ARTIFACT_INDEX_SIZE_REFUSED'))
 cases.append(run_case('valid-native-causal-receipt-permitted',True,lambda r:native_failure(r)))
 cases.append(run_case('canonical-refusal-retains-safe-native-first-failure',False,lambda r:native_failure(r,'index'),expected_code='CANONICAL_UPLOAD_GATE_REFUSED',expected_fallback=True))
 cases.append(run_case('scanner-refusal-retains-safe-native-first-failure',False,lambda r:native_failure(r,'scanner'),expected_code='NEW_DIAGNOSTIC_SECRET_PATTERN_REFUSED',expected_fallback=True))
 cases.append(run_case('fallback-refuses-secret-shaped-causal-token',False,lambda r:native_failure(r,'malicious'),expected_code='NEW_DIAGNOSTIC_SECRET_PATTERN_REFUSED',expected_fallback=True))
 bindings=[]
 for name in ['retained-upload-preflight.py','upload-preflight.py','candidate_packages.py','native_diagnostics.py','native-diagnostic-codes.json','upload-contract-selftest.py']:
  path=HERE/name;assert path.is_file(), 'SOURCE_BINDING_MISSING:'+name
  bindings.append({'path':'scripts/work8/native-transition/'+name,'bytes':path.stat().st_size,'sha256':digest(path)})
 receipt={'schema':'work8-v31-upload-contract-selftest-v1','status':'PASS_ACTUAL_SCAN_AND_CANONICAL_UPLOAD_GATES','allPassed':True,'passed':len(cases),'total':len(cases),'cases':cases,'sourceBindings':bindings,'canonicalMaxBytes':MAX_BYTES,'canonicalMaxPayloadBytes':MAX_PAYLOAD_BYTES,'zipEnvelopeReserveBytes':ZIP_ENVELOPE_RESERVE,'stageAllocations':{'preflight':STAGE_MAX,'full':1920*1024**2},'combinedStageAllocationBytes':STAGE_MAX+1920*1024**2,'stageAllocationIndependent':True,'realUploadPerformed':False,'networkUsed':False,'actualUploaderUnmodified':True,'fixturesSyntheticOnly':True,'fixtureContentsRetained':False}
 out=pathlib.Path(args.output);out.parent.mkdir(parents=True,exist_ok=True);write_json(out,receipt)
 print(json.dumps({'status':receipt['status'],'passed':len(cases),'total':len(cases),'receipt':str(out)}))

if __name__=='__main__':main()
