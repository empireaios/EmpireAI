#!/usr/bin/env python3
"""Independent upload gate: no partial, oversized, altered or unscanned payload."""
import hashlib,json,os,pathlib,stat
root=pathlib.Path(os.environ['GITHUB_WORKSPACE'])/'native-transition-output';allowed=False
try:
 assert root.is_dir() and not root.is_symlink()
 index=json.loads((root/'artifact-index.json').read_text());assert index['schema']=='work8-bounded-upload-v1'
 assert index['exactGeneratedSecretCheck'] is True and index['maxBytes']==2*1024**3
 expected={r['path']:r for r in index['files']};assert len(expected)==len(index['files'])
 actual={p.name:p for p in root.iterdir()};assert set(actual)==set(expected)|{'artifact-index.json'}
 total=0
 for name,p in actual.items():
  s=p.lstat();assert stat.S_ISREG(s.st_mode) and s.st_nlink==1 and not p.is_symlink()
  assert '/' not in name and not name.startswith('.') and not name.endswith(('.partial','.env'))
  total+=s.st_size
  if name in expected:
   assert s.st_size==expected[name]['bytes']
   with p.open('rb') as f:assert hashlib.file_digest(f,'sha256').hexdigest()==expected[name]['sha256']
 assert total<=2*1024**3
 allowed=True
finally:
 with open(os.environ['GITHUB_OUTPUT'],'a') as out:print('allowed='+str(allowed).lower(),file=out)
 if not allowed:raise SystemExit('UPLOAD_REFUSED_BY_BYTE_SECRET_OR_FILE_INTEGRITY_GATE')
