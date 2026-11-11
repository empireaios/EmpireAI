#!/usr/bin/env bash
set -euo pipefail
[[ "${GITHUB_EVENT_NAME:-}" == create ]]
[[ "${GITHUB_REF:-}" == refs/heads/work8/v116-o42-q4-20261111-a01 ]]
[[ "${GITHUB_RUN_ATTEMPT:-}" == 1 ]]
[[ "${GITHUB_RUN_ID:-}" =~ ^[0-9]+$ ]]
[[ "$(git rev-parse HEAD)" == "$GITHUB_SHA" ]]
[[ -z "$(git status --porcelain --untracked-files=no)" ]]
unset GH_TOKEN GITHUB_TOKEN ACTIONS_RUNTIME_TOKEN DOCKER_HOST DOCKER_CONTEXT DOCKER_CONFIG DOCKER_TLS_VERIFY DOCKER_CERT_PATH DOCKER_API_VERSION
source='6c1e63ba20619ee480742fd87dc810ca93152e22'
input="$RUNNER_TEMP/v116-q4-$GITHUB_RUN_ID"
out="$input/evidence"
name="work8-v116-q4-$GITHUB_RUN_ID"
network="$name-net"; redis="$name-redis"; exam="$name-exam"
cleanup() {
  result=$?
  trap - EXIT
  docker logs "$exam" > "$out/container.log" 2>&1 || true
  docker inspect "$exam" > "$out/container-inspect.json" 2>/dev/null || true
  docker container rm --force "$exam" "$redis" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
  printf '%s\n' "$result" > "$out/examination-exit-code.txt"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 143' TERM INT
[[ "$(stat -c %s "$input/backend.tar.gz")" == 207560277 ]]
[[ "$(sha256sum "$input/backend.tar.gz" | cut -d ' ' -f1)" == b99d11a65d40d6a6a197da6ba805e72a72ac55d4551ad13f31930ec5eeadbcb6 ]]
timeout --signal=TERM --kill-after=10s 180s docker load --input "$input/backend.tar.gz" > "$out/image-load.log"
app='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
[[ "$(docker image inspect --format '{{.Id}}' "$app")" == "$app" ]]
[[ "$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$app")" == "$source" ]]
docker image inspect "$app" > "$out/application-image.json"
redis_image='redis:7.4.2-alpine@sha256:02419de7eddf55aa5bcf49efb74e88fa8d931b4d77c07eff8a6b2144472b6952'
timeout --signal=TERM --kill-after=10s 120s docker pull "$redis_image" > "$out/redis-pull.log"
redis_id=$(docker image inspect --format '{{.Id}}' "$redis_image")
docker image inspect "$redis_id" > "$out/redis-image.json"
docker network create --internal "$network" >/dev/null
docker network inspect "$network" > "$out/network.json"
docker run --detach --name "$redis" --network "$network" --network-alias journal-redis \
  --read-only --cap-drop ALL --security-opt no-new-privileges --user 999:999 \
  --memory 128m --cpus 1 --pids-limit 64 --log-driver json-file --log-opt max-size=1m --log-opt max-file=1 \
  --tmpfs /data:rw,noexec,nosuid,mode=1777,size=32m \
  "$redis_id" redis-server --save '' --appendonly no --protected-mode no >/dev/null
ready=0
for attempt in $(seq 1 40); do
  if [[ "$(docker exec "$redis" redis-cli ping 2>/dev/null || true)" == PONG ]]; then ready=1; break; fi
  sleep 0.25
done
[[ "$ready" == 1 ]]
docker exec "$redis" redis-cli INFO server > "$out/redis-server-identity.txt"
grep -qx 'redis_version:7.4.2' <(tr -d '\r' < "$out/redis-server-identity.txt")
# The unchanged Q4 fixture runs entirely in its original /work8-exam subtree.
# It never imports normal application startup or accesses a production volume.
docker create --name "$exam" --network "$network" --read-only --user 0:0 --cap-drop ALL \
  --cap-add SETUID --cap-add SETGID --cap-add CHOWN --cap-add DAC_OVERRIDE --cap-add KILL --cap-add SYS_PTRACE \
  --security-opt no-new-privileges --memory 512m --cpus 2 --pids-limit 128 \
  --log-driver json-file --log-opt max-size=2m --log-opt max-file=1 \
  --tmpfs /work8-exam:rw,noexec,nosuid,nodev,mode=0755,size=64m \
  --tmpfs /tmp:rw,noexec,nosuid,nodev,mode=1777,size=16m \
  --mount "type=bind,src=$out,dst=/evidence" \
  --mount "type=bind,src=$GITHUB_WORKSPACE/v116/q4_hosted/prepare.mjs,dst=/control/prepare.mjs,readonly" \
  --mount "type=bind,src=$GITHUB_WORKSPACE/v116/q4_hosted/application-inputs.json,dst=/control/application-inputs.json,readonly" \
  --workdir /app --entrypoint sh \
  --env "WORK8_SOURCE_SHA=$source" \
  --env WORK8_MEMBERSHIP_REDIS_URL=redis://journal-redis:6379/0 \
  --env WORK8_EVIDENCE_DIR=/evidence --env PILLOW_BIRTH_STATE=NOT_BORN --env COMMERCE_STATE=LOCKED \
  "$app" -ec 'node /control/prepare.mjs; cd /work8-exam/source; exec node --test --test-reporter=tap deployment/runtime-membership-controller.hosted.test.cjs' >/dev/null
docker inspect "$exam" > "$out/prestart-container.json"
python3 -B "$GITHUB_WORKSPACE/v116/q4_hosted/verify-container.py" "$out/prestart-container.json" "$out/network.json"
timeout --signal=TERM --kill-after=10s 90s docker start --attach "$exam" | tee "$out/tests.tap"
[[ "$(docker inspect --format '{{.State.ExitCode}}' "$exam")" == 0 ]]
python3 -B "$GITHUB_WORKSPACE/v116/q4_hosted/verify-result.py" "$out" "$source"
