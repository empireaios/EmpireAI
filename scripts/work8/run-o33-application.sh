#!/usr/bin/env bash
set -euo pipefail

[[ "${GITHUB_EVENT_NAME:-}" == push ]]
[[ "${GITHUB_REF:-}" == refs/heads/work8/writer-integration-20261025v ]]
[[ "${GITHUB_RUN_ATTEMPT:-}" == 1 ]] # No automatic or manual duplicate attempts.
[[ "${WORK8_EXPECTED_SOURCE:-}" =~ ^[a-f0-9]{40}$ ]]
[[ "$(git rev-parse HEAD)" == "$WORK8_EXPECTED_SOURCE" ]]
[[ -z "$(git diff --name-only HEAD)" ]] # Tracked source must be unchanged after compilation.
[[ "${GITHUB_RUN_ID:-}" =~ ^[0-9]+$ ]]

out="$RUNNER_TEMP/work8-o33-evidence"
mkdir -p "$out"
git rev-parse HEAD > "$out/source-commit.txt"
git rev-parse 'HEAD^{tree}' > "$out/source-tree.txt"
git ls-tree -r HEAD -- deployment scripts/work8 backend/src/runtime backend/src/index.ts backend/src/app.ts .github/workflows/work8-writer-integration.yml > "$out/source-paths.txt"

name="work8-o33-$GITHUB_RUN_ID"
network="$name-net"
redis="$name-redis"
target_redis="$name-target-redis"
exam="$name-exam"
network_created=0
cleanup() {
  result=$?
  trap - EXIT
  docker logs "$exam" > "$out/container.log" 2>&1 || true
  docker inspect "$exam" > "$out/container-inspect.json" 2>/dev/null || true
  docker container rm --force "$exam" "$redis" "$target_redis" >/dev/null 2>&1 || true
  if [[ "$network_created" == 1 ]]; then docker network rm "$network" >/dev/null 2>&1 || true; fi
  printf '%s\n' "$result" > "$out/examination-exit-code.txt"
  # Bound retained evidence; excessive output is a failed examination.
  if [[ "$(du -sb "$out" | cut -f1)" -gt 134217728 ]]; then
    printf '%s\n' 'Evidence exceeded 128 MiB; examination refused.' > "$out/size-refusal.txt"
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
for spec in "$redis:journal-redis" "$target_redis:target-redis"; do
  container=${spec%%:*}; alias=${spec#*:}
  docker run --detach --name "$container" --network "$network" --network-alias "$alias" \
    --read-only --cap-drop ALL --security-opt no-new-privileges --user 999:999 \
    --memory 128m --cpus 1 --pids-limit 64 --tmpfs /data:rw,noexec,nosuid,mode=1777,size=32m \
    "$redis_id" redis-server --save '' --appendonly no --protected-mode no --requirepass work8-synthetic-only >/dev/null
  ready=0
  for attempt in $(seq 1 40); do
    if [[ "$(docker exec "$container" redis-cli -a work8-synthetic-only --no-auth-warning ping 2>/dev/null || true)" == PONG ]]; then ready=1; break; fi
    sleep 0.25
  done
  [[ "$ready" == 1 ]]
  docker exec "$container" redis-cli -a work8-synthetic-only --no-auth-warning INFO server > "$out/$alias-identity.txt"
  grep -qx 'redis_version:7.4.2' <(tr -d '\r' < "$out/$alias-identity.txt")
done
context="$RUNNER_TEMP/work8-o33-context"
mkdir "$context"
git archive HEAD | tar -x -C "$context"
for package in backend pillow; do
  for directory in dist node_modules; do
    test -d "$package/$directory"
    cp -R "$package/$directory" "$context/$package/$directory"
  done
done
[[ ! -e "$context/.env" && ! -e "$context/backend/.env" && ! -e "$context/pillow/.env" ]]
timeout 120s docker build --tag "$name-image" --file - "$context" <<DOCKERFILE
FROM $node_image
WORKDIR /app
COPY --chown=0:0 . /app
RUN chmod -R go-w /app
USER 0:0
DOCKERFILE
app_id=$(docker image inspect --format '{{.Id}}' "$name-image")
docker image inspect "$app_id" > "$out/application-image.json"

native="$RUNNER_TEMP/work8-writer-native"
bash scripts/work8/build-writer-isolation.sh "$native"
sha256sum "$native/runtime-writer-isolation.so" > "$out/native-artifact.sha256"
readelf --version-info "$native/runtime-writer-isolation.so" > "$out/native-symbols.txt"
# No host ports, production mounts, Docker socket, inherited token, or real secrets.
# Operator may inspect its distinct-UID children in this private PID namespace.
# SYS_PTRACE is operator-only; admitted runtime children must still have CapEff=0.
proof="$RUNNER_TEMP/work8-o33-network-proof.json"
printf '{}\n' > "$proof"
docker create --name "$exam" \
  --network "$network" --read-only --user 0:0 --cap-drop ALL \
  --cap-add SETUID --cap-add SETGID --cap-add CHOWN --cap-add DAC_OVERRIDE --cap-add KILL --cap-add SYS_PTRACE \
  --security-opt no-new-privileges --memory 5g --cpus 2 --pids-limit 256 \
  --tmpfs /work8-exam:rw,noexec,nosuid,nodev,mode=0755,size=2g \
  --tmpfs /work8-native:rw,exec,nosuid,nodev,mode=0755,size=1m \
  --tmpfs /tmp:rw,noexec,nosuid,nodev,mode=1777,size=16m \
  --mount "type=bind,src=$out,dst=/evidence" \
  --mount "type=bind,src=$proof,dst=/network-proof.json,readonly" \
  --mount "type=bind,src=$native,dst=/native,readonly" --workdir /app \
  --env "WORK8_SOURCE_SHA=$WORK8_EXPECTED_SOURCE" \
  --env WORK8_MEMBERSHIP_REDIS_URL=redis://:work8-synthetic-only@journal-redis:6379/0 \
  --env WORK8_TARGET_REDIS_URL=redis://:work8-synthetic-only@target-redis:6379/0 \
  --env WORK8_EVIDENCE_DIR=/evidence --env PILLOW_BIRTH_STATE=NOT_BORN --env COMMERCE_STATE=LOCKED \
  "$app_id" sh -ec '
    cp /native/runtime-writer-isolation.so /work8-native/writer.so
    chmod 0444 /work8-native/writer.so
    export WORK8_WRITER_ISOLATION_LIBRARY=/work8-native/writer.so
    export WORK8_WRITER_ISOLATION_SHA256=$(sha256sum /work8-native/writer.so | cut -d " " -f1)
    node <<"MOUNT_CHECK"
const fs=require("node:fs"),assert=require("node:assert/strict");
const rows=fs.readFileSync("/proc/self/mountinfo","utf8").trim().split("\n").map(line=>{const [left,right]=line.split(" - ");const fields=left.split(" ");return {mount:fields[4],options:fields[5].split(","),filesystem:right.split(" ")[0]};});
const required=["/work8-native","/work8-exam","/tmp"];
fs.writeFileSync(process.env.WORK8_EVIDENCE_DIR+"/native-mount-readback.json",JSON.stringify({scope:"ISOLATED_EXAMINATION_ONLY",verdict:"UNVERIFIED",mounts:rows.filter(row=>required.includes(row.mount))})+"\n");
const selected=required.map(mount=>{const matches=rows.filter(row=>row.mount===mount);assert.equal(matches.length,1,"EXACT_MOUNT_REQUIRED");return matches[0];});
for(const row of selected){assert.equal(row.filesystem,"tmpfs");assert.ok(row.options.includes("nosuid")&&row.options.includes("nodev"));assert.equal(row.options.includes("noexec"),row.mount!=="/work8-native","NATIVE_EXEC_DATA_NOEXEC_REQUIRED");}
const dir=fs.statSync("/work8-native"),file=fs.lstatSync("/work8-native/writer.so");
assert.equal(dir.uid,0);assert.equal(dir.mode&0o777,0o755);assert.equal(file.uid,0);assert.equal(file.mode&0o777,0o444);assert.ok(file.isFile());assert.equal(file.nlink,1);
fs.writeFileSync(process.env.WORK8_EVIDENCE_DIR+"/native-mount-readback.json",JSON.stringify({scope:"ISOLATED_EXAMINATION_ONLY",mounts:selected,operatorOwnedArtifact:true,runtimeWritable:false})+"\n");
MOUNT_CHECK
    cd /app
    node scripts/work8/o33-permissions-preflight.mjs
    exec node scripts/work8/o33-application-coordinator.mjs
  ' >/dev/null

docker inspect "$exam" > "$out/prestart-container.json"
python3 - "$out/prestart-container.json" "$out/network.json" "$WORK8_EXPECTED_SOURCE" "$proof" <<'NETWORK'
import json,sys
c=json.load(open(sys.argv[1]))[0]; n=json.load(open(sys.argv[2]))[0]
assert n['Internal'] is True
assert list(c['NetworkSettings']['Networks'])==[n['Name']]
assert c['HostConfig']['NetworkMode']==n['Name']
assert not c['HostConfig']['Privileged'] and c['HostConfig']['ReadonlyRootfs']
assert not c['HostConfig']['PortBindings']
assert all(m['Destination']!='/var/run/docker.sock' for m in c['Mounts'])
p={'source':sys.argv[3],'networkId':n['Id'],'internal':True,'containerId':c['Id'],'attachedNetworkIds':[n['Id']],'privileged':False,'readonlyRootfs':True,'noPublishedPorts':True}
with open(sys.argv[4],'w') as f: json.dump(p,f)
NETWORK
timeout --signal=TERM --kill-after=10s 720s docker start --attach "$exam" | tee "$out/coordinator.log"
[[ "$(docker inspect --format '{{.State.ExitCode}}' "$exam")" == 0 ]]

python3 - "$out" "$WORK8_EXPECTED_SOURCE" <<'VERIFY'
import json,pathlib,sys
out=pathlib.Path(sys.argv[1]); receipt=json.loads((out/'o33-application-result.json').read_text())
assert receipt['source']==sys.argv[2]
assert receipt['scope']=='O33_ACTUAL_DECLARED_ISOLATED_TOPOLOGY'
assert receipt['status']=='PASS_AWAITING_INDEPENDENT_WHOLE_ROW_REVIEW'
assert receipt['productionCutover'] is False and receipt['protectedCustody'] is False
required={'actualApplicationEntries','controllerOwnedCensus','priorGenerationExcluded','allWriterCapture','sourceCopySealedUnderHold','freshTargetAdmitted','onceOnlyPendingContinuation','restartNoReplay','sessionContinuity','noAuthorityReplay','failureClosed','guardControlledShutdown'}
assert set(receipt['assertions'])==required and all(receipt['assertions'].values())
(out/'terminal-verification.json').write_text(json.dumps({'status':'PASS_AWAITING_INDEPENDENT_O33_REVIEW','source':sys.argv[2],'assertions':sorted(required),'wholeRequirementAutomaticallyAccepted':False},indent=2)+'\n')
VERIFY
