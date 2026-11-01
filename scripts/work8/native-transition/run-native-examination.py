#!/usr/bin/env python3
"""Outer causal boundary, including imports/setup; scanner/uploader remain authoritative."""
import hashlib,json,os,pathlib,runpy,sys
from native_diagnostics import save_first,from_error,emit_fallback
root=pathlib.Path(os.environ.get('GITHUB_WORKSPACE','.'))/'native-transition-output'
root.mkdir(exist_ok=True)
try:
 runpy.run_path(str(pathlib.Path(__file__).with_name('examine-v26.py')),run_name='__main__')
except BaseException as error:
 if isinstance(error,SystemExit) and (error.code is None or error.code==0):raise
 if not (root/'first-native-failure.json').exists():
  save_first(root,from_error(error,'EXAMINATION_OUTER_BOUNDARY','INITIALIZE_OR_FINALIZE_EXAMINATION'))
 emit_fallback(root)
 # A safe causal record remains uploadable on setup/finalizer failure. This only
 # builds the existing index; it does not waive any gate or select/drop files.
 try:
  from candidate_packages import MAX_BYTES,ZIP_ENVELOPE_RESERVE
  budget=json.loads((root/'workflow-budget.json').read_text());stage_limit=budget['stageMaximumArtifactBytes']
  rows=[]
  for p in sorted(root.iterdir()):
   if p.name=='artifact-index.json':continue
   assert p.is_file() and not p.is_symlink(),'NONREGULAR_ARTIFACT_REFUSED'
   rows.append({'path':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
  index={'schema':'work8-bounded-upload-v1','exactGeneratedSecretCheck':False,'maxBytes':MAX_BYTES,'stageMaximumArtifactBytes':stage_limit,'files':rows}
  # Preserve genuine prior secret-check attestation only. A setup failure before
  # secrets exist is independently scanner-checked by the preceding upload gate.
  old=json.loads((root/'artifact-index.json').read_text()) if (root/'artifact-index.json').exists() else {}
  old_rows={item['path']:item for item in old.get('files',[])}
  current={item['path']:item for item in rows}
  assert all(current.get(name)==item for name,item in old_rows.items()),'PREVIOUSLY_SCANNED_FILE_CHANGED'
  additions=set(current)-set(old_rows)
  assert additions<= {'first-native-failure.json'},'UNSCANNED_NEW_OUTPUT_REFUSED'
  if 'first-native-failure.json' in additions:
   from native_diagnostics import sanitize
   raw=json.loads((root/'first-native-failure.json').read_text());assert raw==sanitize(raw),'CAUSAL_RECEIPT_NOT_CANONICALLY_SANITIZED'
  index['exactGeneratedSecretCheck']=old.get('exactGeneratedSecretCheck') is True
  if not index['exactGeneratedSecretCheck']:
   # The wrapper cannot attest a runtime secret scan it never performed. Keep
   # the failure in safe job output; uploader must refuse this index.
   raise ValueError('GENERATED_SECRET_CHECK_UNATTESTED')
  (root/'artifact-index.json').write_text(json.dumps(index,indent=2)+'\n')
 except Exception:
  print('WORK8_NATIVE_EVIDENCE_FINALIZATION_REFUSED {"rawOutputRetained":false}',flush=True)
 raise SystemExit(1) from None
