#!/usr/bin/env bash
set -euo pipefail
[[ "$GITHUB_RUN_ID" =~ ^[0-9]+$ ]]
root="$RUNNER_TEMP/v116-o30-$GITHUB_RUN_ID"
name="v116-o30-package-$GITHUB_RUN_ID"
unit="v116-o30-$GITHUB_RUN_ID.service"
stage="$(readlink -f /var/tmp)/v116-o30-$GITHUB_RUN_ID"
load=$(systemctl show "$unit" --property=LoadState --value || true)
[[ "$load" == 'not-found' || "$load" == 'loaded' ]]
if [[ "$load" != 'not-found' ]]; then sudo systemctl stop "$unit"; fi
active=$(systemctl show "$unit" --property=ActiveState --value || true)
[[ "$active" == 'inactive' || "$active" == 'failed' ]]
docker container rm --force "$name" >/dev/null 2>&1 || true
test -z "$(docker container ls -aq --filter "name=^/$name$")"
mkdir -p "$root/evidence"
sudo python3 -B - "$GITHUB_RUN_ID" "$root/evidence" "$active" <<'PY'
import json,pathlib,sys
run_id,out,active=sys.argv[1:];out=pathlib.Path(out)
stage=pathlib.Path('/var/tmp').resolve(strict=True)/('v116-o30-'+run_id)
cgroup=pathlib.Path('/sys/fs/cgroup/system.slice/v116-o30-'+run_id+'.service')
exists=cgroup.exists();events=(cgroup/'cgroup.events').read_text() if exists else None
assert events is None or 'populated 0' in events.splitlines()
scoped=[]
for p in pathlib.Path('/proc').iterdir():
 if not p.name.isdigit():continue
 try:
  cmd=(p/'cmdline').read_bytes()
  if b'bwrap' in cmd and str(stage/'evidence').encode() in cmd:scoped.append(p.name)
 except (FileNotFoundError,PermissionError):pass
assert not scoped
(out/'termination.json').write_text(json.dumps({'runId':run_id,'unitActiveState':active,'serviceCgroupExists':exists,'cgroupEvents':events,'remainingScopedNamespaceLaunchers':scoped,'packageContainerRemoved':True,'productionMutation':False},indent=2)+'\n')
PY
if sudo test -d "$stage"; then
  if sudo test -d "$stage/evidence"; then sudo python3 -B "$GITHUB_WORKSPACE/v116/o30_hosted/make-readable.py" "$stage" "$GITHUB_RUN_ID" "$(id -u)"; fi
  sudo python3 -B "$GITHUB_WORKSPACE/v116/o30_hosted/collect-stage.py" "$GITHUB_RUN_ID" "$root/evidence"
fi
sudo python3 -B "$GITHUB_WORKSPACE/v116/o30_hosted/make-readable.py" "$root" "$GITHUB_RUN_ID" "$(id -u)"
