#!/usr/bin/env python3
"""Independent gates for separate candidate/evidence uploads and shared 2GiB cap."""
import hashlib,json,os,pathlib,stat,sys
from candidate_packages import MAX_BYTES,MAX_PAYLOAD_BYTES,ZIP_ENVELOPE_RESERVE,directory_bytes
workspace=pathlib.Path(os.environ['GITHUB_WORKSPACE']);mode=sys.argv[1] if len(sys.argv)>1 else 'evidence';allowed=False
try:
 assert mode in {'candidates','evidence'}
 root=workspace/('native-transition-candidates' if mode=='candidates' else 'native-transition-output')
 assert root.is_dir() and not root.is_symlink()
 index=json.loads((root/'artifact-index.json').read_text())
 assert index['maxBytes']==MAX_BYTES
 if mode=='candidates':
  assert index['schema']=='work8-candidate-upload-v1'
  assert index['secretScanPassed'] is True and index['beforeRuntimeSecrets'] is True
  assert index['candidateStatus']=='CANDIDATE_NOT_ACCEPTED'
  assert index['maxPayloadBytes']==MAX_PAYLOAD_BYTES and index['zipEnvelopeReserveBytes']==ZIP_ENVELOPE_RESERVE
 else:
  assert index['schema']=='work8-bounded-upload-v1' and index['exactGeneratedSecretCheck'] is True
 expected={r['path']:r for r in index['files']};assert len(expected)==len(index['files'])
 actual={p.name:p for p in root.iterdir()};assert set(actual)==set(expected)|{'artifact-index.json'}
 assert len(actual)<=128, 'ZIP_MEMBER_COUNT_BOUND'
 for name,p in actual.items():
  s=p.lstat();assert stat.S_ISREG(s.st_mode) and s.st_nlink==1 and not p.is_symlink()
  assert len(name.encode('utf-8'))<=240 and '/' not in name and not name.startswith('.') and not name.endswith(('.partial','.env'))
  if mode=='evidence':assert not name.endswith(('.tar.gz','.db','.sqlite','.sqlite3')), 'CANDIDATE_DUPLICATION_OR_RUNTIME_DATABASE_REFUSED'
  if name in expected:
   assert s.st_size==expected[name]['bytes']
   with p.open('rb') as f:assert hashlib.file_digest(f,'sha256').hexdigest()==expected[name]['sha256']
 total=directory_bytes(workspace/'native-transition-candidates')+directory_bytes(workspace/'native-transition-output')
 assert total<=MAX_PAYLOAD_BYTES, 'AGGREGATE_PAYLOAD_BYTES_BOUND'
 # Both Actions uploads use compression-level:0 and <=128 short flat members;
 # 2MiB is held back for the two ZIP envelopes and uncompressed-deflate framing.
 allowed=True
finally:
 with open(os.environ['GITHUB_OUTPUT'],'a') as out:print('allowed='+str(allowed).lower(),file=out)
 if not allowed:raise SystemExit('UPLOAD_REFUSED_BY_BYTE_SECRET_OR_FILE_INTEGRITY_GATE')
