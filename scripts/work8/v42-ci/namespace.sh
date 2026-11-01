#!/usr/bin/env bash
set -euo pipefail
# CI-only test-owned Linux namespace. No production mounts, provider network or credentials.
test "$#" -ge 4
ci_uid="$1"; ci_gid="$2"; ci_seconds="$3"; shift 3
test "$ci_uid" -gt 0
test "$ci_gid" -gt 0
test "$ci_seconds" -ge 1
test "$ci_seconds" -le 2580
exec sudo -n timeout --signal=TERM --kill-after=10s "$ci_seconds" \
  unshare --mount --net --pid --fork --kill-child=SIGKILL --mount-proc \
  bash "$(dirname "$0")/namespace-init.sh" "$ci_uid" "$ci_gid" "$@"
