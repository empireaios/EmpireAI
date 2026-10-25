#!/usr/bin/env bash
set -euo pipefail

[[ "${GITHUB_EVENT_NAME:-}" == push ]]
[[ "${GITHUB_REF:-}" == refs/heads/work8/writer-integration-20261025v ]]
[[ "${GITHUB_RUN_ATTEMPT:-}" == 1 ]] # No automatic or manual duplicate attempts.
[[ "${WORK8_EXPECTED_SOURCE:-}" =~ ^[a-f0-9]{40}$ ]]
[[ "$(git rev-parse HEAD)" == "$WORK8_EXPECTED_SOURCE" ]]
[[ -z "$(git diff --name-only HEAD)" ]] # Tracked source must be unchanged after compilation.
[[ "${GITHUB_RUN_ID:-}" =~ ^[0-9]+$ ]]

out="$RUNNER_TEMP/work8-writer-evidence"
mkdir -p "$out"
git rev-parse HEAD > "$out/source-commit.txt"
git rev-parse 'HEAD^{tree}' > "$out/source-tree.txt"
git ls-tree -r HEAD -- deployment scripts/work8/run-writer-integration.sh .github/workflows/work8-writer-integration.yml > "$out/source-paths.txt"

name="work8-writer-$GITHUB_RUN_ID"
network="$name-net"
redis="$name-redis"
exam="$name-exam"
network_created=0
cleanup() {
  result=$?
  trap - EXIT
  docker logs "$exam" > "$out/container.log" 2>&1 || true
  docker inspect "$exam" > "$out/container-inspect.json" 2>/dev/null || true
  docker container rm --force "$exam" "$redis" >/dev/null 2>&1 || true
  if [[ "$network_created" == 1 ]]; then docker network rm "$network" >/dev/null 2>&1 || true; fi
  printf '%s\n' "$result" > "$out/examination-exit-code.txt"
  # Bound retained evidence; excessive output is a failed examination.
  if [[ "$(du -sb "$out" | cut -f1)" -gt 5242880 ]]; then
    printf '%s\n' 'Evidence exceeded 5 MiB; examination refused.' > "$out/size-refusal.txt"
    result=1
  fi
  exit "$result"
}
trap cleanup EXIT

# Reuse the exact Node image identity retained by the accepted Runtime run.
node_image='node:22.23.2-bookworm-slim@sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9'
redis_image='redis:7.4.2-alpine@sha256:02419de7eddf55aa5bcf49efb74e88fa8d931b4d77c07eff8a6b2144472b6952'
timeout 120s docker pull "$node_image"
timeout 120s docker pull "$redis_image"
node_id=$(docker image inspect --format '{{.Id}}' "$node_image")
redis_id=$(docker image inspect --format '{{.Id}}' "$redis_image")
docker image inspect "$node_id" "$redis_id" > "$out/images.json"

docker network create --internal "$network" >/dev/null
network_created=1
docker network inspect "$network" > "$out/network.json"
docker run --detach --name "$redis" --network "$network" --network-alias journal-redis \
  --read-only --cap-drop ALL --security-opt no-new-privileges --user 999:999 \
  --memory 128m --cpus 1 --pids-limit 64 --tmpfs /data:rw,noexec,nosuid,mode=1777,size=32m \
  "$redis_id" redis-server --save '' --appendonly no --protected-mode no --requirepass work8-synthetic-only >/dev/null
redis_ready=0
for attempt in $(seq 1 40); do
  if [[ "$(docker exec "$redis" redis-cli -a work8-synthetic-only --no-auth-warning ping 2>/dev/null || true)" == PONG ]]; then redis_ready=1; break; fi
  sleep 0.25
done
[[ "$redis_ready" == 1 ]]
docker exec "$redis" redis-cli -a work8-synthetic-only --no-auth-warning INFO server > "$out/redis-server-identity.txt"
grep -qx 'redis_version:7.4.2' <(tr -d '\r' < "$out/redis-server-identity.txt")

native="$RUNNER_TEMP/work8-writer-native"
bash scripts/work8/build-writer-isolation.sh "$native"
sha256sum "$native/runtime-writer-isolation.so" > "$out/native-artifact.sha256"
readelf --version-info "$native/runtime-writer-isolation.so" > "$out/native-symbols.txt"
# No host ports, production mounts, Docker socket, inherited token, or real secrets.
# Operator may inspect its distinct-UID children in this private PID namespace.
# SYS_PTRACE is operator-only; admitted runtime children must still have CapEff=0.
timeout --signal=TERM --kill-after=10s 360s docker run --name "$exam" \
  --network "$network" --read-only --user 0:0 --cap-drop ALL \
  --cap-add SETUID --cap-add SETGID --cap-add CHOWN --cap-add DAC_OVERRIDE --cap-add KILL --cap-add SYS_PTRACE \
  --security-opt no-new-privileges --memory 512m --cpus 2 --pids-limit 128 \
  --tmpfs /work8-exam:rw,nosuid,nodev,mode=0755,size=128m \
  --tmpfs /tmp:rw,noexec,nosuid,nodev,mode=1777,size=16m \
  --mount "type=bind,src=$GITHUB_WORKSPACE,dst=/src,readonly" \
  --mount "type=bind,src=$out,dst=/evidence" \
  --mount "type=bind,src=$native,dst=/native,readonly" --workdir /src \
  --env "WORK8_SOURCE_SHA=$WORK8_EXPECTED_SOURCE" \
  --env WORK8_MEMBERSHIP_REDIS_URL=redis://:work8-synthetic-only@journal-redis:6379/0 \
  --env WORK8_EVIDENCE_DIR=/evidence --env PILLOW_BIRTH_STATE=NOT_BORN --env COMMERCE_STATE=LOCKED \
  "$node_id" sh -ec '
    mkdir /work8-exam/source
    cp -R /src/deployment /work8-exam/source/deployment
    chmod -R a-w /work8-exam/source/deployment
    mkdir /work8-exam/native
    cp /native/runtime-writer-isolation.so /work8-exam/native/writer.so
    chmod 0444 /work8-exam/native/writer.so
    export WORK8_WRITER_ISOLATION_LIBRARY=/work8-exam/native/writer.so
    export WORK8_WRITER_ISOLATION_SHA256=$(sha256sum /work8-exam/native/writer.so | cut -d " " -f1)
    cd /work8-exam/source
    exec node --test --test-reporter=tap deployment/runtime-writer-graph.hosted.test.cjs
  ' | tee "$out/tests.tap"

python3 - "$out" "$WORK8_EXPECTED_SOURCE" <<'PY'
import json, pathlib, re, sys
out=pathlib.Path(sys.argv[1]); text=(out/'tests.tap').read_text()
expected={'tests':1,'pass':1,'fail':0,'cancelled':0,'skipped':0,'todo':0}
for label,value in expected.items():
    found=re.findall(r'^# '+label+r' (\d+)\s*$',text,re.M)
    assert found==[str(value)], (label,found)
assert not re.search(r'\b(?:SKIP|TODO)\b',text), 'Skipped/todo assertion refused'
receipt=json.loads((out/'writer-graph-examination.json').read_text())
assert receipt['source']==sys.argv[2]
assert receipt['scope']=='ACTUAL_CONTROL_MODULES_SYNTHETIC_APPLICATION_ENTRIES'
assert receipt['productionGraphIntegrated'] is False
assert receipt['operatingRecoveryCertified'] is False
assert receipt['acceptedRows']==[]
assert [r['scenario'] for r in receipt['receipts']]==['clean','primary-death']
required={'actualControlModules','syntheticApplicationOnly','demotedRuntime','descendantSpawnRefused',
 'journalMutationRefused','guardGenerationLease','captureCensusBound','cleanDrainOrIndependentContainment'}
for result in receipt['receipts']:
    assert result['source']==sys.argv[2]
    assert set(result['assertions'])==required
    assert all(result['assertions'][k] is True for k in required)
    assert len(result['members'])==5
(out/'terminal-verification.json').write_text(json.dumps({'status':'PASS_SCOPED_CONTROL_MODULES',
 'source':sys.argv[2],'tap':expected,'assertionsPerScenario':sorted(required),
 'wholeRequirementAcceptance':False,'fullApplicationRestoration':False},indent=2)+'\n')
PY
