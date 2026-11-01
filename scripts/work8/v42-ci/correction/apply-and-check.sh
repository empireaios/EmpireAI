#!/usr/bin/env bash
set -euo pipefail
correction_root=$(cd "$(dirname "$0")" && pwd)
candidate_root=$(realpath "${1:?candidate required}")
output_root=$(realpath -m "${2:?output required}")
python3 - "$correction_root" "$candidate_root" <<'PY'
import hashlib,json,pathlib,shutil,sys
patch=pathlib.Path(sys.argv[1]);root=pathlib.Path(sys.argv[2])
manifest=patch/'corrective-module-manifest.json'
assert hashlib.sha256(manifest.read_bytes()).hexdigest()=='e55fb99e4c71b31c98e4634a7f20e3286b7b0e020115ac491939de2092a73e8b'
assert hashlib.sha256((patch/'assurance-correction-check.sh').read_bytes()).hexdigest()=='e63ecd2360657b042cb2c8dd6c16c0f1b9e676eeccc14fb290b1ab04c9b76918'
m=json.loads(manifest.read_text())
for f in m['files']:
 target=root/f['path'];source=patch/'files'/f['path']
 assert hashlib.sha256(source.read_bytes()).hexdigest()==f['candidateSha256']
 if f['base'] is None:assert not target.exists(),f['path']
 else:assert hashlib.sha256(target.read_bytes()).hexdigest()==f['base']['sha256'],f['path']
for f in m['files']:
 target=root/f['path'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(patch/'files'/f['path'],target)
print('Verified five-file prepared correction applied only to ephemeral base94aa checkout')
PY
bash "$correction_root/assurance-correction-check.sh" "$candidate_root" "$output_root" "$correction_root/corrective-module-manifest.json"
python3 - "$output_root" <<'PY'
import json,pathlib,re,sys
out=pathlib.Path(sys.argv[1]);tap=(out/'test.tap').read_text()
for k,v in [('tests',15),('pass',15),('fail',0),('cancelled',0),('skipped',0),('todo',0)]:assert re.search(r'^# '+k+' '+str(v)+r'$',tap,re.M),k
assert (out/'test-exit-code.txt').read_text().strip()=='0'
assert (out/'node-version.txt').read_text().strip()=='v22.23.2'
assert (out/'controlled-fixture-proof.json').is_file()
proof=json.loads((out/'controlled-fixture-proof.json').read_text())
assert proof['nativeNoDescendantsBoth'] is True and proof['isolatedHealthyDomains']==13
assert proof['originalCandidateCI'] is False and proof['productionHealth'] is False and proof['wholeRowsAccepted']==[]
print('Native binary/compiler identity:')
print((out/'native-binary.sha256').read_text().strip())
print((out/'compiler-version.txt').read_text().splitlines()[0])
print('Prepared corrective variant: exact Node22 fixture proof and 15/15 tests; not original94aa CI or live application health')
PY
