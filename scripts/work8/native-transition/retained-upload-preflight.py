#!/usr/bin/env python3
"""Scan only new bounded diagnostic text, then apply the preserved upload gate."""
import json,os,pathlib,runpy,sys
from candidate_packages import PATTERNS,MAX_PAYLOAD_BYTES,ZIP_ENVELOPE_RESERVE,directory_bytes
root=pathlib.Path(os.environ['GITHUB_WORKSPACE'])/'native-transition-output'
try:
 budget=json.loads((root/'workflow-budget.json').read_text())
 assert budget['reservationId']=='work8-v30-live-brain-20261101'
 prior=budget['priorStageRetainedArtifactBytes']
 assert isinstance(prior,int) and 0<=prior<MAX_PAYLOAD_BYTES,'PRIOR_STAGE_ARTIFACT_BYTES_UNVERIFIED'
 stage_limit=budget['stageMaximumArtifactBytes']
 assert stage_limit==({'preflight':128*1024**2,'full':1920*1024**2}[budget['stage']]),'STAGE_ARTIFACT_ALLOCATION_CHANGED'
 assert (prior==0 if budget['stage']=='preflight' else 0<prior<=128*1024**2),'PRIOR_STAGE_ALLOCATION_REFUSED'
 payload=directory_bytes(root)
 assert payload<=stage_limit-ZIP_ENVELOPE_RESERVE,'STAGE_ARTIFACT_ALLOCATION_EXCEEDED'
 assert payload+prior<=MAX_PAYLOAD_BYTES,'TWO_STAGE_AGGREGATE_ARTIFACT_BOUND'
 for path in root.iterdir():
  assert path.is_file() and not path.is_symlink()
  if path.suffix in {'.json','.log','.txt'}:
   data=path.read_bytes()
   assert not any(pattern.search(data) for _,pattern in PATTERNS),'NEW_DIAGNOSTIC_SECRET_PATTERN_REFUSED'
except Exception:
 with open(os.environ['GITHUB_OUTPUT'],'a') as out:print('allowed=false',file=out)
 raise SystemExit('NEW_DIAGNOSTIC_UPLOAD_REFUSED')
sys.argv=[str(pathlib.Path(__file__).with_name('upload-preflight.py')),'evidence']
runpy.run_path(sys.argv[0],run_name='__main__')
