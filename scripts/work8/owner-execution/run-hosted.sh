#!/usr/bin/env bash
# Exact retained application images only. Acquisition must finish before this script.
set -euo pipefail
umask 077
archive=$(realpath "$1")
frontend=$(realpath "$2")
tooling=$(realpath "$3")
out=$(realpath -m "$4")
script=$(cd -- "$(dirname -- "$0")" && pwd)
[[ ! -L "$4" ]]
mkdir -p "$out"
python3 - "$out" <<'PY'
from pathlib import Path
import sys
out = Path(sys.argv[1])
allowed = {'controller.commit', 'controller.tree', 'frontend-assembly.json'}
for path in out.iterdir():
    if path.name not in allowed or path.is_symlink() or not path.is_file():
        raise SystemExit('Refusing unexpected or stale examination output')
PY
private_parent=$(realpath -e "${RUNNER_TEMP:-${TMPDIR:-/tmp}}")
private=$(mktemp -d "$private_parent/work8-owner.XXXXXXXX")
label="work8-owner-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"
network="$label"
backend="$label-backend"
web="$label-frontend"
redis="$label-redis"
browser="$label-browser"
image=sha256:4b1a7f3be41a509b606f609650edddb1abfd458db48d085bd34b8ee4dcc50673
redis_image=redis:7.4.2-alpine@sha256:02419de7eddf55aa5bcf49efb74e88fa8d931b4d77c07eff8a6b2144472b6952
browser_image=mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e
# BEGIN PRIVATE CLEANUP CONTRACT
cleanup_private_directory() {
  local directory=$1 parent=$2
  [[ "$directory" == "$parent"/work8-owner.* && -d "$directory" && ! -L "$directory" ]] || return 1
  [[ $(realpath -e "$directory") == "$directory" ]] || return 1
  if [[ -e "$directory/data" || -L "$directory/data" ]]; then
    [[ -d "$directory/data" && ! -L "$directory/data" ]] || return 1
    if [[ $(id -u) == 0 ]]; then
      timeout 20s rm -rf --one-file-system -- "$directory/data" || return 1
    else
      # Only the disposable bind can contain root-owned application files.
      timeout 20s sudo -n -- rm -rf --one-file-system -- "$directory/data" || return 1
    fi
  fi
  timeout 10s rm -rf --one-file-system -- "$directory" || return 1
  [[ ! -e "$directory" && ! -L "$directory" ]]
}
# END PRIVATE CLEANUP CONTRACT
cleanup() {
  status=$?
  trap - EXIT TERM INT
  set +e
  # Keep a conservative receipt even if the outer deadline kills cleanup.
  printf '{"exitCode":1,"examinationExitCode":%s,"cleanup":{"state":"IN_PROGRESS"},"classification":"SYNTHETIC_EXACT_PACKAGE_TECHNICAL_EXAMINATION","wholeRowsAccepted":[]}\n' "$status" > "$out/runner-result.json"
  for name in "$backend" "$web" "$redis"; do
    docker logs "$name" > "$private/$name.log" 2>&1
  done
  python3 - "$private" "$out" <<'PY'
import json, pathlib, re, sys
private, out = map(pathlib.Path, sys.argv[1:])
secrets = []
for name in ['backend.env', 'browser.env']:
    path = private / name
    if path.exists():
        for line in path.read_text().splitlines():
            key, _, value = line.partition('=')
            if re.search(r'PASSWORD|SECRET|REDIS_URL', key) and value:
                secrets.append(value)
if (private / 'redis-password').exists():
    secrets.append((private / 'redis-password').read_text())
for path in private.glob('*.log'):
    text = path.read_text(errors='replace')[-200000:]
    for secret in sorted(secrets, key=len, reverse=True):
        text = text.replace(secret, '[REDACTED]')
    text = re.sub(r'(?i)(bearer\s+|session[=:]\s*|session_token[=:]\s*)[^\s;,"\x27]+', r'\1[REDACTED]', text)
    # Never preserve raw authentication/cookie header lines.
    text = '\n'.join(line for line in text.splitlines() if not re.search(r'(?i)authorization|set-cookie|cookie:|(?:password|session[_-]?secret|redis[_-]?url)["\x27]?\s*[=:]', line))
    role = path.stem.rsplit('-', 1)[-1]
    (out / (role + '.log')).write_text(text + '\n')
PY
  log_status=$?
  docker rm -fv "$browser" "$backend" "$web" "$redis" >/dev/null 2>&1
  containers_removed=true
  remaining=$(docker ps -aq --filter "label=work8.owner-run=$label") || containers_removed=false
  [[ -z "$remaining" ]] || containers_removed=false
  docker network rm "$network" >/dev/null 2>&1
  network_removed=true
  remaining=$(docker network ls -q --filter "label=work8.owner-run=$label") || network_removed=false
  [[ -z "$remaining" ]] || network_removed=false
  private_removed=false
  # Never delete a bind while a known examination container remains attached.
  if [[ "$containers_removed" == true ]] && cleanup_private_directory "$private" "$private_parent"; then private_removed=true; fi
  final_status=$status
  if [[ "$log_status" != 0 || "$containers_removed" != true || "$network_removed" != true || "$private_removed" != true ]]; then
    [[ "$final_status" != 0 ]] || final_status=1
  fi
  printf '{"exitCode":%s,"examinationExitCode":%s,"cleanup":{"logsSanitized":%s,"containersRemoved":%s,"networkRemoved":%s,"privateDataRemoved":%s},"classification":"SYNTHETIC_EXACT_PACKAGE_TECHNICAL_EXAMINATION","wholeRowsAccepted":[]}\n' \
    "$final_status" "$status" "$([[ "$log_status" == 0 ]] && echo true || echo false)" "$containers_removed" "$network_removed" "$private_removed" > "$out/runner-result.json"
  exit "$final_status"
}
trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
printf '%s  %s\n' 4015d4ca1eacbd308e37892ad5c32ce9945e62bd8aa0f96b96a03b0878ed8b29 "$archive" | sha256sum -c -
docker load -i "$archive" >/dev/null
[[ $(docker run --rm --pull never --network none --entrypoint node "$image" --version) == v22.23.2 ]]
docker image inspect "$image" --format '{{json .}}' > "$private/image.json"
python3 - "$private/image.json" "$out/image-identity.json" <<'PY'
import json, sys
i = json.load(open(sys.argv[1]))
assert i['Id'] == 'sha256:4b1a7f3be41a509b606f609650edddb1abfd458db48d085bd34b8ee4dcc50673'
assert i['Architecture'] == 'amd64' and i['Os'] == 'linux'
assert i['Config']['Cmd'] == ['node', 'deployment/locked-runtime.cjs']
assert i['Config']['WorkingDir'] == '/app'
assert i['Config'].get('User', '') in ['', 'root', '0', '0:0']
assert not i['Config'].get('Entrypoint') or i['Config']['Entrypoint'] == ['docker-entrypoint.sh']
json.dump({'id': i['Id'], 'os': i['Os'], 'architecture': i['Architecture'],
           'cmd': i['Config']['Cmd'], 'workingDir': i['Config']['WorkingDir']}, open(sys.argv[2], 'w'), indent=2)
PY
for pinned in "$redis_image" "$browser_image"; do
  docker image inspect "$pinned" --format '{{json .RepoDigests}}' | python3 -c 'import json,sys; expected=sys.argv[1].split("@",1)[1]; assert any(x.endswith("@"+expected) for x in json.load(sys.stdin))' "$pinned"
done
[[ -s "$frontend/server.js" && -d "$tooling/node_modules/playwright" && -s "$script/checks.mjs" ]]
[[ -d "$frontend/.next/cache" && ! -L "$frontend/.next/cache" ]]
[[ -z $(find "$frontend/.next/cache" -mindepth 1 -maxdepth 1 -print -quit) ]]
python3 - "$private" <<'PY'
import pathlib, secrets, sys
p = pathlib.Path(sys.argv[1])
founder, admin, session, redis = [secrets.token_hex(32) for _ in range(4)]
(p / 'redis-password').write_text(redis)
(p / 'redis.conf').write_text('bind 0.0.0.0\nprotected-mode yes\nsave ""\nappendonly no\nrequirepass ' + redis + '\n')
(p / 'redis.conf').chmod(0o644)
env = {'EMPIRE_RUNTIME_PROFILE':'LOCKED_COMMISSIONING_V1', 'RAILWAY_VOLUME_MOUNT_PATH':'/data',
       'DATABASE_PATH':'/data/commissioning/empireai-brain.db', 'PORT':'43118',
       'REDIS_URL':'redis://:'+redis+'@owner-redis:6379/0', 'EMPIRE_LOCKED_REDIS_HOST':'owner-redis',
       'FOUNDER_EMAIL':'owner@work8.invalid', 'FOUNDER_PASSWORD':founder,
       'ADMIN_EMAIL':'admin@work8.invalid', 'ADMIN_PASSWORD':admin, 'SESSION_SECRET':session,
       'CORS_ORIGIN':'http://localhost:43117', 'INTELLIGENCE_ENABLED':'false', 'INTELLIGENCE_DISABLED':'true',
       'RAILWAY_GIT_COMMIT_SHA':'98970018d579e5a7c720d25293cdddbe294856c0'}
(p / 'backend.env').write_text(''.join(k+'='+v+'\n' for k,v in env.items()))
(p / 'browser.env').write_text('OWNER_EMAIL=owner@work8.invalid\nOWNER_PASSWORD='+founder+'\nWRONG_OWNER_EMAIL=admin@work8.invalid\nWRONG_OWNER_PASSWORD='+admin+'\nEXPECTED_SOURCE_COMMIT=98970018d579e5a7c720d25293cdddbe294856c0\nOUTPUT_DIR=/evidence\nBACKEND_URL=http://owner-backend:43118\nFRONTEND_URL=http://localhost:43117\n')
(p / 'data').mkdir(mode=0o700)
PY
docker network create --internal --label "work8.owner-examination=true" --label "work8.owner-run=$label" "$network" >/dev/null
[[ $(docker network inspect "$network" --format '{{.Internal}}') == true ]]
printf '{"internal":true,"publishedPorts":false,"externalCredentials":false,"freshDisposableData":true}\n' > "$out/isolation.json"
docker run -d --pull never --name "$redis" --label "work8.owner-examination=true" --label "work8.owner-run=$label" \
  --network "$network" --network-alias owner-redis --memory 256m --cpus 1 \
  --tmpfs /data:rw,noexec,nosuid,size=128m \
  --mount "type=bind,src=$private/redis.conf,dst=/usr/local/etc/redis/redis.conf,readonly" \
  "$redis_image" redis-server /usr/local/etc/redis/redis.conf >/dev/null
# Password is provided on stdin, never a logged process argument or inherited CI environment.
for attempt in {1..30}; do
  if docker exec -i "$redis" sh -c 'read -r REDISCLI_AUTH; export REDISCLI_AUTH; redis-cli ping' < "$private/redis-password" | grep -qx PONG; then break; fi
  [[ "$attempt" != 30 ]]
  sleep 1
done
docker run -d --pull never --name "$backend" --label "work8.owner-examination=true" --label "work8.owner-run=$label" \
  --network "$network" --network-alias owner-backend --memory 3g --cpus 2 \
  --env-file "$private/backend.env" --mount "type=bind,src=$private/data,dst=/data" "$image" >/dev/null
docker run -d --pull never --name "$web" --label "work8.owner-examination=true" --label "work8.owner-run=$label" \
  --network "$network" --network-alias owner-frontend --memory 1g --cpus 1 \
  --env NODE_ENV=production --env PORT=43117 --env HOSTNAME=0.0.0.0 \
  --env BRAIN_API_URL=http://owner-backend:43118 --env NEXT_TELEMETRY_DISABLED=1 \
  --mount "type=bind,src=$frontend,dst=/frontend,readonly" \
  --tmpfs /frontend/.next/cache:rw,noexec,nosuid,size=128m \
  --workdir /frontend --entrypoint node "$image" server.js >/dev/null
run_checks() {
  docker run --rm --pull never --name "$browser" --label "work8.owner-examination=true" --label "work8.owner-run=$label" \
    --network "container:$web" --memory 2g --cpus 2 --shm-size 512m \
    --user "$(id -u):$(id -g)" --env HOME=/tmp \
    --env-file "$private/browser.env" --env PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    --mount "type=bind,src=$script,dst=/examination,readonly" \
    --mount "type=bind,src=$tooling,dst=/tools,readonly" \
    --mount "type=bind,src=$out,dst=/evidence" \
    --workdir /examination --entrypoint node "$browser_image" checks.mjs "$1"
}
run_checks initial
docker restart --time 25 "$backend" >/dev/null
run_checks after-restart
printf '{"sameContainer":true,"sameDataVolume":true,"redisRetained":true,"distinctArtifactRollbackProven":false}\n' > "$out/restart.json"
