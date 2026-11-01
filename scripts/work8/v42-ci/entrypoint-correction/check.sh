#!/usr/bin/env bash
set -euo pipefail
candidate_root=$(realpath "${1:?candidate root required}")
output_directory=$(realpath -m "${2:?output directory required}")
manifest_file=$(realpath "${3:?manifest required}")
mkdir -p "$output_directory"
python3 - "$candidate_root" "$manifest_file" <<'PY'
import hashlib,json,pathlib,sys
r=pathlib.Path(sys.argv[1]);m=json.loads(pathlib.Path(sys.argv[2]).read_text())
for f in m['files']:
 assert hashlib.sha256((r/f['path']).read_bytes()).hexdigest()==f['candidateSha256'],f['path']
for name,f in m['unchangedSourceFiles'].items():
 assert hashlib.sha256((r/name).read_bytes()).hexdigest()==f['sha256'],name
print('Prepared seven-file variant and unchanged direct source dependencies verified')
PY
node --version > "$output_directory/node-version.txt"
cc --version > "$output_directory/compiler-version.txt"
timeout 30s cc -shared -fPIC -O2 -std=c11 -Wall -Wextra -Werror -Wl,-z,relro,-z,now "$candidate_root/deployment/native/runtime-writer-isolation.c" -o "$output_directory/runtime-writer-isolation.so"
chmod 0444 "$output_directory/runtime-writer-isolation.so"
sha256sum "$output_directory/runtime-writer-isolation.so" > "$output_directory/native-binary.sha256"
set +e
ASSURANCE_ISOLATION_LIBRARY="$output_directory/runtime-writer-isolation.so" ASSURANCE_CORRECTION_RESULT="$output_directory/controlled-fixture-proof.json" timeout 30s node --test --test-concurrency=1 --test-reporter=tap "$candidate_root/backend/src/validation/tests/assurance-supervisor.test.mjs" "$candidate_root/deployment/assurance-discrepancy-readback.test.mjs" "$candidate_root/deployment/assurance-inspector-entrypoint.test.mjs" > "$output_directory/test.tap" 2>&1
test_status=$?
set -e
printf '%s\n' "$test_status" > "$output_directory/test-exit-code.txt"
cat "$output_directory/test.tap"
if [ "$test_status" -ne 0 ]; then exit "$test_status"; fi
python3 - "$output_directory" <<'PY'
import pathlib,re,sys
r=pathlib.Path(sys.argv[1]);s=(r/'test.tap').read_text()
for k,v in [('tests',21),('pass',21),('fail',0),('cancelled',0),('skipped',0),('todo',0)]:
 assert re.search(r'^# '+k+' '+str(v)+r'$',s,re.M),k
print('Separate prepared entrypoint variant:21/21; no original-candidate or production-health claim')
PY
