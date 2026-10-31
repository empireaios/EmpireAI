#!/usr/bin/env python3
"""Scan only new bounded diagnostic text, then apply the preserved upload gate."""
import os,pathlib,runpy,sys
from candidate_packages import PATTERNS
root=pathlib.Path(os.environ['GITHUB_WORKSPACE'])/'native-transition-output'
try:
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
