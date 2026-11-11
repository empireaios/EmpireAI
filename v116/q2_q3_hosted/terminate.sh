#!/usr/bin/env bash
set -euo pipefail
[[ "$GITHUB_RUN_ID" =~ ^[0-9]+$ ]]
root="$RUNNER_TEMP/v116-q2-q3-$GITHUB_RUN_ID"
name="v116-q23-package-$GITHUB_RUN_ID"
stage="$(readlink -f /var/tmp)/v116-q2-q3-$GITHUB_RUN_ID"
if [[ -f "$root/current-launch.pid" ]]; then
  pid=$(cat "$root/current-launch.pid")
  [[ "$pid" =~ ^[0-9]+$ ]]
  if kill -0 "$pid" 2>/dev/null; then
    # Only the exact admitted PID whose cmdline still contains this run's mount.
    tr '\0' ' ' < "/proc/$pid/cmdline" | grep -F -- "$stage/evidence" >/dev/null
    sudo kill -TERM "$pid" || true
    for attempt in {1..20}; do kill -0 "$pid" 2>/dev/null || break; sleep 0.1; done
    if kill -0 "$pid" 2>/dev/null; then sudo kill -KILL "$pid"; fi
  fi
fi
docker container rm --force "$name" >/dev/null 2>&1 || true
test -z "$(docker container ls -aq --filter "name=^/$name$")"
mkdir -p "$root/evidence"
python3 -B - <<'PY'
import json,os,pathlib
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-q2-q3-'+os.environ['GITHUB_RUN_ID'])
stage=pathlib.Path('/var/tmp').resolve(strict=True)/('v116-q2-q3-'+os.environ['GITHUB_RUN_ID'])
scoped=[]
for p in pathlib.Path('/proc').iterdir():
 if not p.name.isdigit():continue
 try:
  cmd=(p/'cmdline').read_bytes()
  if b'bwrap' in cmd and str(stage/'evidence').encode() in cmd:scoped.append(p.name)
 except (FileNotFoundError,PermissionError):pass
receipt={'runId':os.environ['GITHUB_RUN_ID'],'remainingScopedNamespaceLaunchers':scoped,'packageContainerRemoved':True,'productionMutation':False}
(root/'evidence/termination.json').write_text(json.dumps(receipt,indent=2)+'\n')
assert not scoped
PY
if sudo test -d "$stage"; then
  if sudo test -d "$stage/evidence"; then
    sudo python3 -B "$GITHUB_WORKSPACE/v116/q2_q3_hosted/make-readable.py" "$stage" "$GITHUB_RUN_ID" "$(id -u)"
  fi
  sudo python3 -B "$GITHUB_WORKSPACE/v116/q2_q3_hosted/collect-stage.py" "$GITHUB_RUN_ID" "$root/evidence"
fi
# The namespace runs as root; its 0700 phase directories must be made readable
# only after termination, without traversing links or touching application data.
sudo python3 -B "$GITHUB_WORKSPACE/v116/q2_q3_hosted/make-readable.py" "$root" "$GITHUB_RUN_ID" "$(id -u)"
