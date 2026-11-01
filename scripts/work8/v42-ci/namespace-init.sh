#!/usr/bin/env bash
set -euo pipefail
ci_uid="$1"; ci_gid="$2"; shift 2
mount --make-rprivate /
ip link set lo up
test "$(ip -o link show | cut -d ':' -f 2 | tr -d ' ')" = lo
test -z "$(ip route show default)"
test -z "$(ip -6 route show default)"
exec setpriv --reuid="$ci_uid" --regid="$ci_gid" --clear-groups \
  --no-new-privs --bounding-set=-all --inh-caps=-all --ambient-caps=-all "$@"
