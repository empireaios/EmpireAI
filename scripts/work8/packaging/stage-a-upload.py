#!/usr/bin/env python3
"""Bound and scan only new compiler outputs and sanitized packaging diagnostics."""
import hashlib,json,os,pathlib,stat,sys
from compiler_job import expected_outputs
ROOT=pathlib.Path(os.environ['GITHUB_WORKSPACE']);NATIVE=ROOT/'controller/scripts/work8/native-transition'
sys.path.insert(0,str(NATIVE));from candidate_packages import PATTERNS
OUT=ROOT/'stage-a-output';LIMIT=16*1024*1024;allowed=False
try:
 assert OUT.is_dir() and not OUT.is_symlink()
 permitted={'stage-a-result.json','source-identities.json','retained-backend-import.json','compiler-permission-receipt.json','stage-a-control-failure.json'}|{'generated/'+name for name in expected_outputs(NATIVE/'v26-build-plan.json')}
 rows=[];total=0
 for p in sorted(OUT.rglob('*')):
  s=p.lstat();assert not p.is_symlink(),'ARTIFACT_SYMLINK_REFUSED'
  if stat.S_ISDIR(s.st_mode):continue
  name=p.relative_to(OUT).as_posix()
  if name=='artifact-index.json':continue
  assert stat.S_ISREG(s.st_mode) and s.st_nlink==1 and name in permitted,'UNREVIEWED_ARTIFACT_FILE'
  total+=s.st_size;assert total<=LIMIT-1024*1024,'STAGE_A_ARTIFACT_BYTES_BOUND'
  data=p.read_bytes();assert not any(pattern.search(data) for _,pattern in PATTERNS),'NEW_COMPILER_ARTIFACT_SECRET_PATTERN_REFUSED'
  rows.append({'path':name,'bytes':s.st_size,'sha256':hashlib.sha256(data).hexdigest()})
 assert len(rows)<=16 and any(row['path']=='stage-a-result.json' for row in rows)
 index={'schema':'work8-v27-stage-a-artifact-index-v1','maximumBytes':LIMIT,'zipEnvelopeReserveBytes':1024*1024,'retentionDays':7,'secretScanPassed':True,'runtimeOrProviderSecretsSuppliedToCompiler':False,'files':rows}
 (OUT/'artifact-index.json').write_text(json.dumps(index,indent=2)+'\n');allowed=True
finally:
 with open(os.environ['GITHUB_OUTPUT'],'a') as out:print('allowed='+str(allowed).lower(),file=out)
 if not allowed:raise SystemExit('STAGE_A_ARTIFACT_UPLOAD_REFUSED')
