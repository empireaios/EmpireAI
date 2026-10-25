#!/usr/bin/env bash
set -euo pipefail
# Build in the same Linux libc/architecture image as the target runtime.
# Output is an immutable release artifact; no generated binary is committed.
[[ $# == 1 ]]
out=$1
[[ "$out" = /* ]]
source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
mkdir -p -- "$out"
cc -shared -fPIC -O2 -std=c11 -Wall -Wextra -Werror \
  -Wl,-z,relro,-z,now \
  "$source_dir/deployment/native/runtime-writer-isolation.c" \
  -o "$out/runtime-writer-isolation.so"
chmod 0444 "$out/runtime-writer-isolation.so"
sha256sum "$out/runtime-writer-isolation.so" > "$out/runtime-writer-isolation.sha256"
