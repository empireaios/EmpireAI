#!/usr/bin/env bash
set -euo pipefail
umask 077
# This file runs only after exact source/authority admission and a single exact input download.
[[ "${GITHUB_EVENT_NAME:-}" == create ]]
[[ "${GITHUB_REF:-}" == refs/heads/work8/v116-a2-test2-20261111-a01 ]]
[[ "${GITHUB_RUN_ATTEMPT:-}" == 1 ]]
[[ "${GITHUB_RUN_ID:-}" =~ ^[0-9]+$ ]]
[[ "$(git rev-parse HEAD)" == "$GITHUB_SHA" ]]
[[ -z "$(git status --porcelain --untracked-files=no)" ]]
export WORK8_EXPECTED_SOURCE='6c1e63ba20619ee480742fd87dc810ca93152e22'
unset GH_TOKEN GITHUB_TOKEN ACTIONS_RUNTIME_TOKEN
unset DOCKER_HOST DOCKER_CONTEXT DOCKER_CONFIG DOCKER_TLS_VERIFY DOCKER_CERT_PATH DOCKER_API_VERSION
input="$RUNNER_TEMP/v116-test2-$GITHUB_RUN_ID"
out="$input/evidence"
mkdir -p "$out"
# Preserve private uploader evidence; grant only traversal to the public image metadata.
for file in launch-admission.json retained-input-metadata.json retained-input-integrity.json; do
  [[ -f "$out/$file" && ! -L "$out/$file" ]]
  chmod 0600 "$out/$file"
done
chmod 0711 "$out"
mkdir -m 0700 "$out/uid-private-control"
(set -o noclobber; printf 'V116_NONSECRET_PRIVATE_ACCESS_NEGATIVE\n' > "$out/uid-private-control/private.txt")
(set -o noclobber; printf 'V116_NONSECRET_PRIVATE_ACCESS_NEGATIVE\n' > "$out/uid-private-file.txt")
chmod 0600 "$out/uid-private-control/private.txt" "$out/uid-private-file.txt"
cp "$GITHUB_WORKSPACE/v116/recovery_test2_hosted/conditional-execution-contract.json" "$out/conditional-execution-contract.json"
chmod 0600 "$out/conditional-execution-contract.json"
git rev-parse HEAD > "$out/controller-source-commit.txt"
printf '%s\n' "$WORK8_EXPECTED_SOURCE" > "$out/application-source-commit.txt"
git rev-parse 'HEAD^{tree}' > "$out/controller-source-tree.txt"
git ls-tree -r HEAD -- v116 .github/workflows/work8-v116-a2-test2.yml > "$out/controller-source-paths.txt"

name="work8-v116-test2-$GITHUB_RUN_ID"
network="$name-net"
redis="$name-redis"
exam="$name-exam"
network_created=0
cleanup() {
  result=$?
  trap - EXIT
  docker logs "$exam" > "$out/container.log" 2>&1 || true
  docker inspect "$exam" > "$out/container-inspect.json" 2>/dev/null || true
  docker container rm --force "$exam" "$redis" "$name-normal" "$name-prepared" "$name-selected" >/dev/null 2>&1 || true
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
trap 'exit 143' TERM INT

# Import the unchanged accepted image. No build, package installation or A5 run.
[[ "$(stat -c %s "$input/backend.tar.gz")" == 207560277 ]]
[[ "$(sha256sum "$input/backend.tar.gz" | cut -d ' ' -f1)" == b99d11a65d40d6a6a197da6ba805e72a72ac55d4551ad13f31930ec5eeadbcb6 ]]
timeout --signal=TERM --kill-after=10s 180s docker load --input "$input/backend.tar.gz" > "$out/image-load.log"
app_id='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
[[ "$(docker image inspect --format '{{.Id}}' "$app_id")" == "$app_id" ]]
[[ "$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$app_id")" == "$WORK8_EXPECTED_SOURCE" ]]
docker image inspect "$app_id" > "$out/application-image.json"
chmod 0444 "$out/application-image.json"
redis_image='redis:7.4.2-alpine@sha256:02419de7eddf55aa5bcf49efb74e88fa8d931b4d77c07eff8a6b2144472b6952'
timeout --signal=TERM --kill-after=10s 120s docker pull "$redis_image" > "$out/redis-pull.log"
redis_id=$(docker image inspect --format '{{.Id}}' "$redis_image")
docker image inspect "$redis_id" > "$out/redis-image.json"

docker network create --internal "$network" >/dev/null
network_created=1
docker network inspect "$network" > "$out/network.json"
for spec in "$redis:journal-redis"; do
  container=${spec%%:*}; alias=${spec#*:}
  docker run --detach --name "$container" --network "$network" --network-alias "$alias" \
    --read-only --cap-drop ALL --security-opt no-new-privileges --user 999:999 \
    --memory 128m --cpus 1 --pids-limit 64 --log-driver json-file --log-opt max-size=1m --log-opt max-file=1 --tmpfs /data:rw,noexec,nosuid,mode=1777,size=32m \
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
# The accepted image already contains the original exact native interposer.
# It is verified before loading and never rebuilt.
# No host ports, production mounts, Docker socket, inherited token, or real secrets.
# Operator may inspect its distinct-UID children in this private PID namespace.
# SYS_PTRACE is operator-only; admitted runtime children must still have CapEff=0.
proof="$input/network-proof.json"
printf '{}\n' > "$proof"
docker create --name "$exam" \
  --network "$network" --network-alias native-backend --read-only --user 0:0 --cap-drop ALL \
  --cap-add SETUID --cap-add SETGID --cap-add CHOWN --cap-add DAC_OVERRIDE --cap-add KILL --cap-add SYS_PTRACE \
  --security-opt no-new-privileges --memory 5g --cpus 2 --pids-limit 256 --log-driver json-file --log-opt max-size=8m --log-opt max-file=1 \
  --tmpfs /data/work8-exam:rw,noexec,nosuid,nodev,mode=0755,size=2g \
  --tmpfs /work8-native:rw,exec,nosuid,nodev,mode=0755,size=1m \
  --tmpfs /tmp:rw,noexec,nosuid,nodev,mode=1777,size=16m \
  --mount "type=bind,src=$out,dst=/evidence" \
  --mount "type=bind,src=$proof,dst=/network-proof.json,readonly" \
  --mount "type=bind,src=$GITHUB_WORKSPACE/v116/test2/v116-test2-coordinator.mjs,dst=/app/scripts/work8/v116-test2-coordinator.mjs,readonly" \
  --mount "type=bind,src=$GITHUB_WORKSPACE/v116/test2/v116-test2-business.mjs,dst=/app/scripts/work8/v116-test2-business.mjs,readonly" \
  --mount "type=bind,src=$GITHUB_WORKSPACE/v116/test2/v116-test2-domain-state.mjs,dst=/app/scripts/work8/hh4-domain-state.mjs,readonly" \
  --mount "type=bind,src=$GITHUB_WORKSPACE/v116/test2/native-commerce-baseline.mjs,dst=/app/scripts/work8/native-commerce-baseline.mjs,readonly" \
  --mount "type=bind,src=$GITHUB_WORKSPACE/v116/recovery_test2_hosted/technical-authority.json,dst=/technical-authority.json,readonly" \
  --mount "type=bind,src=$GITHUB_WORKSPACE/v116/recovery_test2_hosted/verify-evidence-boundary.mjs,dst=/app/scripts/work8/v116-verify-evidence-boundary.mjs,readonly" \
  --workdir /app --entrypoint sh \
  --env "WORK8_SOURCE_SHA=$WORK8_EXPECTED_SOURCE" \
  --env WORK8_MEMBERSHIP_REDIS_URL=redis://:work8-synthetic-only@journal-redis:6379/0 \
  --env WORK8_EVIDENCE_DIR=/evidence --env PILLOW_BIRTH_STATE=NOT_BORN --env COMMERCE_STATE=LOCKED \
  "$app_id" -ec '
    # Preserve original application/preflight mode semantics; private files set explicit modes.
    umask 022
    test "$(node --version)" = v22.23.2
    test "$(sha256sum /native/runtime-writer-isolation.so | cut -d " " -f1)" = 5048f19ec38c708dd1b139f7a3f60cb8eb5e9146cd4fdb6e978caffbcac87a1b
    cp /native/runtime-writer-isolation.so /work8-native/writer.so
    chmod 0444 /work8-native/writer.so
    export WORK8_WRITER_ISOLATION_LIBRARY=/work8-native/writer.so
    export WORK8_WRITER_ISOLATION_SHA256=$(sha256sum /work8-native/writer.so | cut -d " " -f1)
    node <<"MOUNT_CHECK"
const fs=require("node:fs"),assert=require("node:assert/strict");
const rows=fs.readFileSync("/proc/self/mountinfo","utf8").trim().split("\n").map(line=>{const [left,right]=line.split(" - ");const fields=left.split(" ");return {mount:fields[4],options:fields[5].split(","),filesystem:right.split(" ")[0]};});
const required=["/work8-native","/data/work8-exam","/tmp"];
const dataAncestor=fs.lstatSync("/data");assert.ok(dataAncestor.isDirectory()&&!dataAncestor.isSymbolicLink());assert.equal(dataAncestor.uid,0);assert.equal(dataAncestor.gid,0);assert.equal(dataAncestor.mode&0o777,0o755);
fs.writeFileSync(process.env.WORK8_EVIDENCE_DIR+"/native-mount-readback.json",JSON.stringify({scope:"ISOLATED_EXAMINATION_ONLY",verdict:"UNVERIFIED",mounts:rows.filter(row=>required.includes(row.mount))})+"\n");
const selected=required.map(mount=>{const matches=rows.filter(row=>row.mount===mount);assert.equal(matches.length,1,"EXACT_MOUNT_REQUIRED");return matches[0];});
for(const row of selected){assert.equal(row.filesystem,"tmpfs");assert.ok(row.options.includes("nosuid")&&row.options.includes("nodev"));assert.equal(row.options.includes("noexec"),row.mount!=="/work8-native","NATIVE_EXEC_DATA_NOEXEC_REQUIRED");}
const dir=fs.statSync("/work8-native"),file=fs.lstatSync("/work8-native/writer.so");
assert.equal(dir.uid,0);assert.equal(dir.mode&0o777,0o755);assert.equal(file.uid,0);assert.equal(file.mode&0o777,0o444);assert.ok(file.isFile());assert.equal(file.nlink,1);
fs.writeFileSync(process.env.WORK8_EVIDENCE_DIR+"/native-mount-readback.json",JSON.stringify({scope:"ISOLATED_EXAMINATION_ONLY",mounts:selected,operatorOwnedArtifact:true,runtimeWritable:false})+"\n");
MOUNT_CHECK
    cd /app
    node scripts/work8/v116-verify-evidence-boundary.mjs
    node scripts/work8/o33-permissions-preflight.mjs
    exec node scripts/work8/v116-test2-coordinator.mjs
  ' >/dev/null

docker inspect "$exam" > "$out/prestart-container.json"
python3 - "$out/prestart-container.json" "$out/network.json" "$WORK8_EXPECTED_SOURCE" "$proof" <<'NETWORK'
import json,sys
c=json.load(open(sys.argv[1]))[0]; n=json.load(open(sys.argv[2]))[0]
assert n['Internal'] is True
assert list(c['NetworkSettings']['Networks'])==[n['Name']]
assert c['HostConfig']['NetworkMode']==n['Name']
assert 'native-backend' in c['NetworkSettings']['Networks'][n['Name']]['Aliases']
assert not c['HostConfig']['Privileged'] and c['HostConfig']['ReadonlyRootfs']
assert not c['HostConfig']['PortBindings']
assert c['Config']['Image']=='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
assert c['Config']['Entrypoint']==['sh'] and c['Config']['User']=='0:0'
assert c['HostConfig']['Memory']==5*1024**3 and c['HostConfig']['NanoCpus']==2*10**9 and c['HostConfig']['PidsLimit']==256
assert c['HostConfig']['CapDrop']==['ALL']
assert set(c['HostConfig']['CapAdd'])=={'CAP_SETUID','CAP_SETGID','CAP_CHOWN','CAP_DAC_OVERRIDE','CAP_KILL','CAP_SYS_PTRACE'}
assert 'no-new-privileges' in c['HostConfig']['SecurityOpt']
assert not any(x.split('=',1)[0] in {'GH_TOKEN','GITHUB_TOKEN','ACTIONS_RUNTIME_TOKEN','OPENAI_API_KEY','ANTHROPIC_API_KEY'} for x in c['Config']['Env'])
assert {m['Destination'] for m in c['Mounts'] if m['Type']=='bind'}=={'/evidence','/network-proof.json','/app/scripts/work8/v116-test2-coordinator.mjs','/app/scripts/work8/v116-test2-business.mjs','/app/scripts/work8/hh4-domain-state.mjs','/app/scripts/work8/native-commerce-baseline.mjs','/technical-authority.json','/app/scripts/work8/v116-verify-evidence-boundary.mjs'}
assert all(not m['RW'] for m in c['Mounts'] if m['Type']=='bind' and m['Destination']!='/evidence')
assert all(m['Destination']!='/var/run/docker.sock' for m in c['Mounts'])
p={'source':sys.argv[3],'networkId':n['Id'],'internal':True,'containerId':c['Id'],'attachedNetworkIds':[n['Id']],'privileged':False,'readonlyRootfs':True,'noPublishedPorts':True}
with open(sys.argv[4],'w') as f: json.dump(p,f)
NETWORK
chmod 0444 "$proof"
python3 -B "$GITHUB_WORKSPACE/v116/recovery_test2_hosted/supervise-test2.py" "$input" "$exam" "$name"
[[ "$(docker inspect --format '{{.State.ExitCode}}' "$exam")" == 0 ]]

python3 - "$out" "$WORK8_EXPECTED_SOURCE" <<'VERIFY'
import json,pathlib,sys
out=pathlib.Path(sys.argv[1]);receipt=json.loads((out/'v116-test2-result.json').read_text());frontend=json.loads((out/'test2-frontend-controller.json').read_text());supervisor=json.loads((out/'test2-concurrent-supervisor.json').read_text())
assert receipt['source']==sys.argv[2] and frontend['source']==sys.argv[2]
assert receipt['status']=='PASS_AWAITING_INDEPENDENT_A2_21_REVIEW'
assert frontend['status']=='PASS_PREPARATION_AND_SINGLE_SELECTION_SWITCH' and not frontend.get('cleanupErrors')
assert supervisor['status']=='PASS_BOTH_CONTROLLERS_EXITED_ZERO' and all(x['exitCode']==0 for x in supervisor['children'])
assert receipt['wholeRowAccepted'] is False and receipt['policyRemoved'] is True
assert not receipt.get('cleanupFailure')
required={'newCandidatePreparedWhileNativeOrdersCommitted','exactRetainedCompatibleFrontendDeployed','everyCommittedOrderVisible','committedHistoryAndFinancePreserved','sameSevenNativeProcessesAcrossUpgrade','independentFinalSQLiteReadback','noA5LifecycleRerun','noGenuineOwnerOrProductionClaim'}
assert set(receipt['assertions'])==required and all(receipt['assertions'].values())
(out/'terminal-verification.json').write_text(json.dumps({'status':'PASS_AWAITING_INDEPENDENT_A2_21_REVIEW','source':sys.argv[2],'assertions':sorted(required),'wholeRequirementAutomaticallyAccepted':False},indent=2)+'\n')
VERIFY
