#!/usr/bin/env python3
"""Scan bounded diagnostic evidence, then use the unchanged canonical upload gate.

The stage allocation is a separate limit, never artifact-index.maxBytes. On any
refusal only fixed gate codes and the independently allowlisted first-causal
summary may reach the job log. No raw file contents are printed.
"""
import json,os,pathlib,re,runpy,stat,sys
from candidate_packages import PATTERNS,MAX_PAYLOAD_BYTES,ZIP_ENVELOPE_RESERVE,directory_bytes

root=pathlib.Path(os.environ['GITHUB_WORKSPACE'])/'native-transition-output'
STAGE_LIMITS={'preflight':128*1024**2,'full':1920*1024**2}
TEXT_TYPES={'.json','.log','.txt'}
SAFE_NAME=re.compile(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,239}\Z')


def refusal(category):
 with open(os.environ['GITHUB_OUTPUT'],'a') as out:print('allowed=false',file=out)
 print('WORK8_UPLOAD_DIAGNOSTIC '+json.dumps({'schema':'work8-v31-safe-upload-diagnostic-v1','status':'REFUSED','category':category,'rawContentsRetained':False},sort_keys=True))
 try:
  from native_diagnostics import emit_fallback
  emit_fallback(root)
 except Exception:
  print('WORK8_UPLOAD_DIAGNOSTIC '+json.dumps({'schema':'work8-v31-safe-upload-diagnostic-v1','status':'REFUSED','category':'SAFE_CAUSAL_FALLBACK_UNAVAILABLE','rawContentsRetained':False},sort_keys=True))
 raise SystemExit('NEW_DIAGNOSTIC_UPLOAD_REFUSED')


try:
 assert root.is_dir() and not root.is_symlink(),'OUTPUT_DIRECTORY_REFUSED'
 budget_path=root/'workflow-budget.json';budget_stat=budget_path.lstat()
 assert stat.S_ISREG(budget_stat.st_mode) and budget_stat.st_nlink==1 and not budget_path.is_symlink() and budget_stat.st_size<=16384,'WORKFLOW_BUDGET_METADATA_REFUSED'
 budget=json.loads(budget_path.read_text())
 assert budget['reservationId']=='work8-v32-native-brain-20261101','RESERVATION_ID_REFUSED'
 prior=budget['priorStageRetainedArtifactBytes']
 assert type(prior) is int and 0<=prior<MAX_PAYLOAD_BYTES,'PRIOR_STAGE_ARTIFACT_BYTES_UNVERIFIED'
 stage_limit=budget['stageMaximumArtifactBytes']
 assert type(stage_limit) is int and stage_limit==STAGE_LIMITS[budget['stage']],'STAGE_ARTIFACT_ALLOCATION_CHANGED'
 assert (prior==0 if budget['stage']=='preflight' else 0<prior<=STAGE_LIMITS['preflight']),'PRIOR_STAGE_ALLOCATION_REFUSED'
 payload=directory_bytes(root)
 assert payload<=stage_limit-ZIP_ENVELOPE_RESERVE,'STAGE_ARTIFACT_ALLOCATION_EXCEEDED'
 assert payload+prior<=MAX_PAYLOAD_BYTES,'TWO_STAGE_AGGREGATE_ARTIFACT_BOUND'
 allowed_types=TEXT_TYPES|({'.png'} if budget['stage']=='full' else set())
 for path in root.iterdir():
  assert path.is_file() and not path.is_symlink(),'NONREGULAR_ARTIFACT_REFUSED'
  assert SAFE_NAME.fullmatch(path.name),'DIAGNOSTIC_FILENAME_REFUSED'
  assert path.suffix in allowed_types,'DIAGNOSTIC_FILE_TYPE_REFUSED'
  if path.name=='artifact-index.json':assert path.stat().st_size<=256*1024,'ARTIFACT_INDEX_SIZE_REFUSED'
  # The source-defined payload cap is checked before reading. Scan every
  # permitted type, including PNG bytes, rather than exempting binary content.
  tail=b''
  with path.open('rb') as stream:
   signature=stream.read(16);stream.seek(0)
   assert not signature.startswith(b'SQLite format 3\x00'),'DATABASE_CONTENT_REFUSED'
   if path.suffix=='.png':assert signature.startswith(b'\x89PNG\r\n\x1a\n'),'INVALID_PNG_REFUSED'
   while chunk:=stream.read(1024*1024):
    sample=tail+chunk
    assert not any(pattern.search(sample) for _,pattern in PATTERNS),'NEW_DIAGNOSTIC_SECRET_PATTERN_REFUSED'
    tail=sample[-8192:]
  if path.suffix in TEXT_TYPES:
   # Fail closed for binary material disguised under an allowed text suffix.
   with path.open('r',encoding='utf-8') as stream:
    while chunk:=stream.read(1024*1024):assert '\x00' not in chunk,'BINARY_DIAGNOSTIC_TEXT_REFUSED'
except Exception as error:
 safe_codes={'WORKFLOW_BUDGET_METADATA_REFUSED','ARTIFACT_INDEX_SIZE_REFUSED','OUTPUT_DIRECTORY_REFUSED','RESERVATION_ID_REFUSED','PRIOR_STAGE_ARTIFACT_BYTES_UNVERIFIED','STAGE_ARTIFACT_ALLOCATION_CHANGED','PRIOR_STAGE_ALLOCATION_REFUSED','STAGE_ARTIFACT_ALLOCATION_EXCEEDED','TWO_STAGE_AGGREGATE_ARTIFACT_BOUND','NONREGULAR_ARTIFACT_REFUSED','DIAGNOSTIC_FILENAME_REFUSED','DIAGNOSTIC_FILE_TYPE_REFUSED','DATABASE_CONTENT_REFUSED','INVALID_PNG_REFUSED','NEW_DIAGNOSTIC_SECRET_PATTERN_REFUSED','BINARY_DIAGNOSTIC_TEXT_REFUSED'}
 code=str(error) if isinstance(error,AssertionError) and str(error) in safe_codes else 'DIAGNOSTIC_SCAN_CONTRACT_REFUSED'
 refusal(code)

sys.argv=[str(pathlib.Path(__file__).with_name('upload-preflight.py')),'evidence']
try:
 runpy.run_path(sys.argv[0],run_name='__main__')
except (Exception,SystemExit):
 refusal('CANONICAL_UPLOAD_GATE_REFUSED')
