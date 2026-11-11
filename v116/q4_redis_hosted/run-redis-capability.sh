#!/usr/bin/env bash
set -euo pipefail
[[ "${GITHUB_EVENT_NAME:-}" == create ]]
[[ "${GITHUB_REF:-}" == refs/heads/work8/v116-o42-q4-redis-20261111-a01 ]]
[[ "${GITHUB_RUN_ATTEMPT:-}" == 1 ]]
[[ "${GITHUB_RUN_ID:-}" =~ ^[0-9]+$ ]]
[[ "$(git rev-parse HEAD)" == "$GITHUB_SHA" ]]
[[ -z "$(git status --porcelain --untracked-files=no)" ]]
unset GH_TOKEN GITHUB_TOKEN ACTIONS_RUNTIME_TOKEN DOCKER_HOST DOCKER_CONTEXT DOCKER_CONFIG DOCKER_TLS_VERIFY DOCKER_CERT_PATH DOCKER_API_VERSION
source='6c1e63ba20619ee480742fd87dc810ca93152e22'
input="$RUNNER_TEMP/v116-q4-redis-$GITHUB_RUN_ID"
out="$input/evidence"
name="work8-v116-q4-redis-$GITHUB_RUN_ID"
cleanup() {
 result=$?
 trap - EXIT
 docker kill "$name" >/dev/null 2>&1 || true
 docker logs "$name" > "$out/container.log" 2>&1 || true
 docker inspect "$name" > "$out/container-inspect.json" 2>/dev/null || true
 if ! python3 -B "$GITHUB_WORKSPACE/v116/q4_redis_hosted/collect-stdout.py" "$out/attached-output.log" "$out" > "$out/stdout-collection.log" 2>&1; then
  [[ "$result" != 0 ]] || result=1
 fi
 docker container rm --force "$name" >/dev/null 2>&1 || true
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
docker create --name "$name" --network none --read-only --user 0:0 --cap-drop ALL --cap-add CHOWN \
 --security-opt no-new-privileges --memory 256m --cpus 1 --pids-limit 32 \
 --log-driver json-file --log-opt max-size=2m --log-opt max-file=1 \
 --tmpfs /root:rw,noexec,nosuid,nodev,mode=0700,size=16m \
 --tmpfs /data:rw,noexec,nosuid,nodev,mode=0755,size=16m \
 --tmpfs /tmp:rw,noexec,nosuid,nodev,mode=1777,size=16m \
 --mount "type=bind,src=$GITHUB_WORKSPACE/v116/q4_redis_hosted/prepare.mjs,dst=/control/prepare.mjs,readonly" \
 --mount "type=bind,src=$GITHUB_WORKSPACE/v116/q4_redis_hosted/application-inputs.json,dst=/control/application-inputs.json,readonly" \
 --workdir /app --entrypoint node \
 --env "WORK8_SOURCE_SHA=$source" --env PILLOW_BIRTH_STATE=NOT_BORN --env COMMERCE_STATE=LOCKED \
 "$app" /control/prepare.mjs >/dev/null
docker inspect "$name" > "$out/prestart-container.json"
python3 -B "$GITHUB_WORKSPACE/v116/q4_redis_hosted/verify-container.py" "$out/prestart-container.json" "$GITHUB_WORKSPACE"
timeout --signal=TERM --kill-after=10s 75s docker start --attach "$name" | tee "$out/attached-output.log"
[[ "$(docker inspect --format '{{.State.ExitCode}}' "$name")" == 0 ]]
[[ "$(docker inspect --format '{{.State.Running}}' "$name")" == false ]]
python3 -B "$GITHUB_WORKSPACE/v116/q4_redis_hosted/collect-stdout.py" "$out/attached-output.log" "$out"
python3 -B "$GITHUB_WORKSPACE/v116/q4_redis_hosted/verify-result.py" "$out"
