#!/usr/bin/env bash
set -euo pipefail
candidate_root=$(realpath "${1:?absolute candidate source root required}")
output_directory=$(realpath -m "${2:?absolute isolated output directory required}")
manifest_file=$(realpath "${3:?corrective module manifest required}")
mkdir -p "$output_directory"
python3 - "$candidate_root" "$manifest_file" <<'PY'
import hashlib,json,pathlib,sys
root=pathlib.Path(sys.argv[1]);m=json.loads(pathlib.Path(sys.argv[2]).read_text())
for f in m['files']:
 assert hashlib.sha256((root/f['path']).read_bytes()).hexdigest()==f['candidateSha256'],f['path']
assert hashlib.sha256((root/'deployment/native/runtime-writer-isolation.c').read_bytes()).hexdigest()==m['unchangedNativeSource']['sha256']
print('Exact prepared correction and unchanged isolation source hashes verified')
PY
node --version > "$output_directory/node-version.txt"
cc --version > "$output_directory/compiler-version.txt"
uname -a > "$output_directory/kernel.txt"
timeout 30s cc -shared -fPIC -O2 -std=c11 -Wall -Wextra -Werror -Wl,-z,relro,-z,now "$candidate_root/deployment/native/runtime-writer-isolation.c" -o "$output_directory/runtime-writer-isolation.so"
chmod 0444 "$output_directory/runtime-writer-isolation.so"
sha256sum "$output_directory/runtime-writer-isolation.so" > "$output_directory/native-binary.sha256"
set +e
ASSURANCE_ISOLATION_LIBRARY="$output_directory/runtime-writer-isolation.so" ASSURANCE_CORRECTION_RESULT="$output_directory/controlled-fixture-proof.json" timeout 60s node --test --test-reporter=tap "$candidate_root/deployment/assurance-discrepancy-readback.test.mjs" > "$output_directory/test.tap" 2>&1
test_status=$?
set -e
printf '%s\n' "$test_status" > "$output_directory/test-exit-code.txt"
cat "$output_directory/test.tap"
exit "$test_status"
