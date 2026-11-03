#!/usr/bin/env python3
"""Causal boundary for V62 setup and finalization; never reruns an attempt."""
import hashlib,json,os,pathlib,runpy,sys,time
sys.dont_write_bytecode=True
from native_diagnostics import save_first,from_error,emit_fallback

flags={'--preflight-v62-native-brain':'preflight','--examine-v62-native-brain':'full'}
phase=flags.get(sys.argv[1] if len(sys.argv)==2 else '')
root=pathlib.Path(os.environ.get('WORK8_EXECUTION_ROOT','.'))
if phase is None or not root.is_absolute() or root.resolve()!=root:
 print('WORK8_NATIVE_DISPATCH_REFUSED {"code":"EXPLICIT_CANONICAL_INVOCATION_REQUIRED","rawOutputRetained":false}',flush=True)
 raise SystemExit(1)
output=root/'evidence'/phase
output_existed=output.exists()
try:
 runpy.run_path(str(pathlib.Path(__file__).with_name('examine-v26.py')),run_name='__main__')
except BaseException as error:
 if isinstance(error,SystemExit) and (error.code is None or error.code==0):raise
 # Never alter earlier examination evidence on an accidental duplicate dispatch.
 if output_existed:
  print('WORK8_NATIVE_DISPATCH_REFUSED {"code":"EXISTING_STAGE_EVIDENCE_PRESERVED","rawOutputRetained":false}',flush=True)
  raise SystemExit(1) from None
 output.mkdir(parents=True,exist_ok=True)
 if not (output/'first-native-failure.json').exists():
  save_first(output,from_error(error,'EXAMINATION_OUTER_BOUNDARY','INITIALIZE_OR_FINALIZE_EXAMINATION'))
 emit_fallback(output)
 try:
  from candidate_packages import MAX_BYTES
  rows=[]
  for p in sorted(output.iterdir()):
   if p.name=='artifact-index.json':continue
   assert p.is_file() and not p.is_symlink(),'NONREGULAR_ARTIFACT_REFUSED'
   rows.append({'path':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
  prior=json.loads((output/'artifact-index.json').read_text()) if (output/'artifact-index.json').exists() else {}
  current={item['path']:item for item in rows};old={item['path']:item for item in prior.get('files',[])}
  assert all(current.get(n)==item for n,item in old.items()),'PREVIOUSLY_SCANNED_FILE_CHANGED'
  additions=set(current)-set(old)
  assert additions<={'first-native-failure.json'},'UNSCANNED_NEW_OUTPUT_REFUSED'
  if 'first-native-failure.json' in additions:
   from native_diagnostics import sanitize
   receipt=json.loads((output/'first-native-failure.json').read_text());assert receipt==sanitize(receipt),'CAUSAL_RECEIPT_NOT_CANONICALLY_SANITIZED'
  index={'schema':'work8-bounded-upload-v1','exactGeneratedSecretCheck':prior.get('exactGeneratedSecretCheck') is True,'maxBytes':MAX_BYTES,'stageMaximumArtifactBytes':128*1024**2 if phase=='preflight' else 1920*1024**2,'files':rows,'setupOnlySanitizedFailure':not old and set(current)=={'first-native-failure.json'}}
  # A sanitized gate/setup failure can be preserved as such, but is never a
  # generated-secret-scan attestation or acceptance upload PASS.
  assert index['exactGeneratedSecretCheck'] or index['setupOnlySanitizedFailure'],'GENERATED_SECRET_CHECK_UNATTESTED'
  (output/'artifact-index.json').write_text(json.dumps(index,indent=2)+'\n')
 except Exception:
  print('WORK8_NATIVE_EVIDENCE_FINALIZATION_REFUSED {"rawOutputRetained":false}',flush=True)
 raise SystemExit(1) from None
