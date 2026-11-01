#!/usr/bin/env bash
set -euo pipefail
correction_root=$(cd "$(dirname "$0")" && pwd)
candidate_root=$(realpath "${1:?candidate root required}")
output_root=$(realpath -m "${2:?output directory required}")
test "$(node --version)" = v22.23.2
python3 - "$correction_root" "$candidate_root" <<'PYVERIFY'
import hashlib,json,pathlib,shutil,subprocess,sys
patch=pathlib.Path(sys.argv[1]);root=pathlib.Path(sys.argv[2])
manifest=patch/'manifest.json'
assert hashlib.sha256(manifest.read_bytes()).hexdigest()=='d307f9c9d0e151fcb4e2bbd2c2848e81baf504a304a5335ba98bc5822012746d'
assert hashlib.sha256((patch/'check.sh').read_bytes()).hexdigest()=='9db56ace35993f2e632dc10ee3512b97fab055106d06b9fd4ddb8b8f52bb54c3'
m=json.loads(manifest.read_text())
assert m['baseCommit']=='94aa919c7c39c4c9bf2c14b636232da028dba72d' and len(m['files'])==7 and m['expectedTests']==21
assert subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()==m['baseCommit']
assert subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD^{tree}'],text=True).strip()=='ad538f63dc1e2dfe392fea1cacb565d361e9a9e2'
assert subprocess.check_output(['git','-C',str(root),'diff','--name-only','HEAD'],text=True)==''
for f in m['files']:
 rel=pathlib.PurePosixPath(f['path']);assert not rel.is_absolute() and '..' not in rel.parts
 target=root/rel;source=patch/'files'/rel
 assert not source.is_symlink() and source.is_file(),f['path']
 b=source.read_bytes();assert hashlib.sha256(b).hexdigest()==f['candidateSha256'],f['path']
 assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==f['candidateGitBlob'],f['path']
 assert not target.is_symlink(),f['path']
 if f['base'] is None:assert not target.exists(),f['path']
 else:
  original=target.read_bytes()
  assert hashlib.sha256(original).hexdigest()==f['base']['sha256'],f['path']
  assert hashlib.sha1(b'blob '+str(len(original)).encode()+b'\0'+original).hexdigest()==f['base']['blob'],f['path']
for name,f in m['unchangedSourceFiles'].items():
 target=root/name;assert not target.is_symlink() and target.is_file(),name
 assert hashlib.sha256(target.read_bytes()).hexdigest()==f['sha256'],name
for f in m['files']:
 target=root/f['path'];target.parent.mkdir(parents=True,exist_ok=True)
 assert target.resolve().is_relative_to(root),f['path']
 shutil.copyfile(patch/'files'/f['path'],target)
print('Verified seven-file prepared entrypoint variant applied only to ephemeral original94aa checkout')
PYVERIFY
bash "$correction_root/check.sh" "$candidate_root" "$output_root" "$correction_root/manifest.json"
python3 - "$output_root" <<'PYRESULT'
import json,pathlib,re,sys
out=pathlib.Path(sys.argv[1]);tap=(out/'test.tap').read_text()
for k,v in [('tests',21),('pass',21),('fail',0),('cancelled',0),('skipped',0),('todo',0)]:
 assert re.search(r'^# '+k+' '+str(v)+r'$',tap,re.M),k
assert (out/'test-exit-code.txt').read_text().strip()=='0'
assert (out/'node-version.txt').read_text().strip()=='v22.23.2'
proof=json.loads((out/'controlled-fixture-proof.json').read_text())
assert proof['node']=='v22.23.2' and proof['scope']=='controlled-fixture-module-proof'
assert proof['nativeNoDescendantsBoth'] is True and proof['isolatedHealthyDomains']==13
assert proof['originalCandidateCI'] is False and proof['productionHealth'] is False
assert proof['liveProviderCoverage'] is False and proof['freshProcessRestart'] is False
assert proof['wholeRowsAccepted']==[]
probe=proof['probe'];assert probe['isolatedSyntheticSource'] is True
assert probe['productionRecordsMutated']==0 and probe['inferenceCalls']==0 and probe['commerceWrites']==0
assert probe['pillowSelfReportUsed'] is False
assert probe['checks']['reopenedInIndependentProcess'] is True and probe['checks']['freshProcessRestart'] is False
assert probe['readback']['scope']=='existing-independent-process-committed-readback'
assert probe['readback']['freshProcessRestart'] is False
assert proof['inspectorPid']!=proof['writerPid']
print('Native binary/compiler identity:')
print((out/'native-binary.sha256').read_text().strip())
print((out/'compiler-version.txt').read_text().splitlines()[0])
print('Prepared entrypoint variant: exact Node22 and21/21 tests; separate from original94aa CI, operatinghealth and finalcertification')
PYRESULT
