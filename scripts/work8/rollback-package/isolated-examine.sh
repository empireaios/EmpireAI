#!/usr/bin/env bash
set -euo pipefail
umask 077
root=$(realpath "${GITHUB_WORKSPACE:?}")
script="$root/controller/scripts/work8/rollback-package"
out="$root/release-package-output/publishable/examination"
mkdir -p "$out"
source "$script/command-diagnostics.sh"
log_private="$root/release-package-output/private/container-logs"
mkdir -p "$log_private"
source "$root/release-package-output/private/build.env"
[[ "$BACKEND_IMAGE" =~ ^sha256:[a-f0-9]{64}$ && "$FRONTEND_IMAGE" =~ ^sha256:[a-f0-9]{64}$ ]]
private_parent=$(realpath -e "${RUNNER_TEMP:?}")
private=$(mktemp -d "$private_parent/work8-release.XXXXXXXX")
label="work8-release-${GITHUB_RUN_ID:?}-${GITHUB_RUN_ATTEMPT:?}"
network=$label; backend=$label-backend; web=$label-web; redis=$label-redis; browser=$label-browser
redis_image=redis:7.4.2-alpine@sha256:02419de7eddf55aa5bcf49efb74e88fa8d931b4d77c07eff8a6b2144472b6952
browser_image=mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e
cleanup(){
 status=$?;trap - EXIT TERM INT ERR;set +e
 # Final listening-address evidence is read before cleanup; no runtime mutation.
 if docker container inspect "$web" >/dev/null 2>&1;then
  if docker exec "$web" node -e '
const fs=require("fs"),port=43117,rows=[];
for(const [file,family] of [["/proc/net/tcp",4],["/proc/net/tcp6",6]]){
 for(const line of fs.readFileSync(file,"utf8").trim().split("\n").slice(1)){
  const fields=line.trim().split(/\s+/),[address,hexPort]=fields[1].split(":");
  if(fields[3]==="0A"&&parseInt(hexPort,16)===port)rows.push({family,addressHex:address,port});
 }
}
console.log(JSON.stringify({status:"OBSERVED_FINAL_LISTENERS",port,bindings:rows}));
' > "$private/frontend-listeners.json" 2> "$log_private/frontend-listeners.log";then
   cp "$private/frontend-listeners.json" "$out/frontend-listeners.json"
  else
   code=$?;printf '{"status":"UNAVAILABLE","exitCode":%s}\n' "$code" > "$out/frontend-listeners.json"
  fi
 fi
 # Capture and sanitize logs before removing containers or generated secrets.
 python3 "$script/complete-diagnostics.py" register-generated --directory "$private" || status=1
 for role in backend frontend redis browser;do
  case "$role" in backend) name=$backend;;frontend) name=$web;;redis) name=$redis;;browser) name=$browser;;esac
  if docker container inspect "$name" >/dev/null 2> "$log_private/$role-inspect.log";then
   docker logs "$name" > "$log_private/$role-final.log" 2>&1
   code=$?;printf '\n[container-log-capture-exit:%s]\n' "$code" >> "$log_private/$role-final.log"
   [[ "$code" == 0 ]] || status=1
   printf '%s\tLOGS_CAPTURED\t%s\n' "$role" "$code" >> "$log_private/acquisition.tsv"
  else
   code=$?
   printf '%s\tNOT_CREATED_OR_UNAVAILABLE\t%s\n' "$role" "$code" >> "$log_private/acquisition.tsv"
  fi
 done
 python3 "$script/complete-diagnostics.py" finalize || status=1
 docker inspect "$backend" "$web" "$redis" > "$private/final-containers.json" 2>/dev/null
 python3 - "$private/final-containers.json" "$out/container-state.json" <<'PY'
import json,sys
try: containers=json.load(open(sys.argv[1]))
except (ValueError,OSError): containers=[]
json.dump([{'role':c.get('Name','').rsplit('-',1)[-1],'status':c.get('State',{}).get('Status'),'running':c.get('State',{}).get('Running'),'exitCode':c.get('State',{}).get('ExitCode'),'oomKilled':c.get('State',{}).get('OOMKilled')} for c in containers],open(sys.argv[2],'w'),indent=2)
PY
 docker rm -fv "$browser" "$backend" "$web" "$redis" >/dev/null 2>&1
 remaining=$(docker ps -aq --filter "label=work8.release=$label");query=$?
 containers=false;network_removed=false;private_removed=false
 if [[ "$query" == 0 && -z "$remaining" ]];then
  containers=true
  docker network rm "$network" >/dev/null 2>&1
  remaining=$(docker network ls -q --filter "label=work8.release=$label");query=$?
  [[ "$query" == 0 && -z "$remaining" ]] && network_removed=true
  if [[ "$private" == "$private_parent"/work8-release.* && -d "$private" && ! -L "$private" && $(realpath -e "$private") == "$private" ]];then
   timeout 20s sudo -n rm -rf --one-file-system -- "$private"
   [[ ! -e "$private" ]] && private_removed=true
  fi
 fi
 [[ "$containers" == true && "$network_removed" == true && "$private_removed" == true ]] || status=1
 printf '{"exitCode":%s,"containersRemoved":%s,"networkRemoved":%s,"privateDataRemoved":%s,"newOwnerDecisions":0,"wholeRowsAccepted":[]}\n' "$status" "$containers" "$network_removed" "$private_removed" > "$out/runner-result.json"
 exit "$status"
}
trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
[[ "${GITHUB_RUN_ATTEMPT}" == 1 && "${GITHUB_RUN_NUMBER}" == 1 ]]
unset GH_TOKEN GITHUB_TOKEN
for image in "$redis_image" "$browser_image";do docker pull "$image" >/dev/null;done
npm ci --prefix "$script/tools" --ignore-scripts --no-audit --no-fund >/dev/null
python3 - "$private" "$script/exact-manifest.json" <<'PY'
import json,pathlib,secrets,sys
p=pathlib.Path(sys.argv[1]);m=json.load(open(sys.argv[2]))
founder,admin,session,redis=[secrets.token_hex(32) for _ in range(4)]
(p/'redis-password').write_text(redis+'\n')
(p/'redis.conf').write_text('bind 0.0.0.0\nprotected-mode yes\nsave ""\nappendonly no\nrequirepass '+redis+'\n');(p/'redis.conf').chmod(0o644)
env={'EMPIRE_RUNTIME_PROFILE':'LOCKED_COMMISSIONING_V1','RAILWAY_VOLUME_MOUNT_PATH':'/data','DATABASE_PATH':'/data/commissioning/empireai-brain.db','PORT':'43118','REDIS_URL':'redis://:'+redis+'@owner-redis:6379/0','EMPIRE_LOCKED_REDIS_HOST':'owner-redis','FOUNDER_EMAIL':'owner@work8.invalid','FOUNDER_PASSWORD':founder,'ADMIN_EMAIL':'admin@work8.invalid','ADMIN_PASSWORD':admin,'SESSION_SECRET':session,'CORS_ORIGIN':'http://localhost:43117','INTELLIGENCE_ENABLED':'false','INTELLIGENCE_DISABLED':'true','RAILWAY_GIT_COMMIT_SHA':m['backend']['commit'],'EMPIRE_OWNER_WRITE_POLICY':'/run/empire-policy/control.json'}
(p/'backend.env').write_text(''.join(k+'='+v+'\n' for k,v in env.items()))
(p/'browser.env').write_text('OWNER_EMAIL=owner@work8.invalid\nOWNER_PASSWORD='+founder+'\nEXPECTED_SOURCE_COMMIT='+m['backend']['commit']+'\n')
(p/'data').mkdir(mode=0o700);(p/'policy').mkdir(mode=0o755)
# mkdir's requested0755 is masked by umask077; explicitly establish traversal.
(p/'policy').chmod(0o755)
PY
[[ -d "$private/policy" && ! -L "$private/policy" ]]
[[ $(stat -c '%u:%g:%a' -- "$private/policy") == "$(id -u):$(id -g):755" ]]
python3 "$script/complete-diagnostics.py" register-generated --directory "$private"
# Capability-dropped container UID 0 must own its mode-0700 data bind.
# A host-runner-owned 0700 directory is inaccessible without DAC override.
[[ -d "$private/data" && ! -L "$private/data" ]]
sudo -n chown 0:0 -- "$private/data"
[[ $(stat -c '%u:%g:%a' -- "$private/data") == 0:0:700 ]]
docker run --rm --pull never --network none --cap-drop ALL --security-opt no-new-privileges \
 --mount "type=bind,src=$private/data,dst=/data" --mount "type=bind,src=$script,dst=/examination,readonly" \
 --entrypoint node "$BACKEND_IMAGE" /examination/seed-history.mjs
fingerprint(){
 docker run --rm --pull never --network none --cap-drop ALL --security-opt no-new-privileges \
  --mount "type=bind,src=$private/data,dst=/data,readonly" --mount "type=bind,src=$script,dst=/examination,readonly" \
  --entrypoint node "$BACKEND_IMAGE" /examination/history-fingerprint.mjs
}
before=$(fingerprint)
docker network create --internal --label "work8.release=$label" "$network" >/dev/null
[[ $(docker network inspect "$network" --format '{{.Internal}}') == true ]]
docker run -d --pull never --name "$redis" --label "work8.release=$label" --network "$network" --network-alias owner-redis \
 --memory 256m --cpus 1 --tmpfs /data:rw,noexec,nosuid,size=128m \
 --mount "type=bind,src=$private/redis.conf,dst=/usr/local/etc/redis/redis.conf,readonly" \
 "$redis_image" redis-server /usr/local/etc/redis/redis.conf >/dev/null
for attempt in {1..30};do
 if docker exec -i "$redis" sh -c 'read -r REDISCLI_AUTH; export REDISCLI_AUTH; redis-cli ping' < "$private/redis-password" | grep -qx PONG;then break;fi
 [[ "$attempt" != 30 ]];sleep 1
done
docker run -d --pull never --name "$backend" --label "work8.release=$label" --network "$network" --network-alias owner-backend \
 --memory 3g --cpus 2 --cap-drop ALL --security-opt no-new-privileges \
 --env-file "$private/backend.env" --mount "type=bind,src=$private/data,dst=/data" \
 --mount "type=bind,src=$private/policy,dst=/run/empire-policy,readonly" "$BACKEND_IMAGE" >/dev/null
docker run -d --pull never --name "$web" --label "work8.release=$label" --network "$network" \
 --memory 1g --cpus 1 --read-only --cap-drop ALL --security-opt no-new-privileges \
 --env NODE_ENV=production --env HOSTNAME=localhost --env PORT=43117 --env NODE_OPTIONS=--dns-result-order=ipv4first --env BRAIN_API_URL=http://owner-backend:43118 \
 --env NEXT_TELEMETRY_DISABLED=1 --tmpfs /tmp:rw,noexec,nosuid,size=64m \
 --tmpfs /frontend/.next/cache:rw,noexec,nosuid,size=128m "$FRONTEND_IMAGE" >/dev/null
docker inspect "$backend" "$web" "$redis" > "$private/containers.json"
python3 - "$private/containers.json" "$out/isolation.json" <<'PY'
import json,sys
c=json.load(open(sys.argv[1]));assert all(not x['HostConfig']['PortBindings'] for x in c)
mount=next(m for m in c[0]['Mounts'] if m['Destination']=='/run/empire-policy');assert mount['RW'] is False
assert 'ALL' in c[0]['HostConfig']['CapDrop'] and c[1]['HostConfig']['ReadonlyRootfs']
json.dump({'internalNetwork':True,'publishedPorts':False,'externalCredentials':False,'policyReadonlyMount':True,'backendCapabilitiesDropped':True,'frontendReadonly':True,'freshDisposableData':True},open(sys.argv[2],'w'),indent=2)
PY
docker exec "$backend" node -e '
const fs=require("fs"),directory="/run/empire-policy",target=directory+"/forbidden";
const st=fs.statSync(directory);
const context={probe:"readonly-policy-mount",directory,uid:st.uid,gid:st.gid,mode:(st.mode&0o777).toString(8)};
try{fs.writeFileSync(target,"x");console.error(JSON.stringify({...context,result:"UNEXPECTED_WRITE_SUCCESS"}));process.exit(1)}
catch(error){console.error(JSON.stringify({...context,result:"WRITE_REFUSED",code:error.code,errno:error.errno,syscall:error.syscall,path:error.path}));if(error.code!=="EROFS")process.exit(2)}
'
run_checks(){
 docker run --pull never --name "$browser" --label "work8.release=$label" --network "container:$web" \
  --memory 2g --cpus 2 --shm-size 512m --user "$(id -u):$(id -g)" --env HOME=/tmp --env NODE_OPTIONS=--dns-result-order=ipv4first --env-file "$private/browser.env" \
  --mount "type=bind,src=$script,dst=/examination,readonly" --mount "type=bind,src=$script/tools,dst=/tools,readonly" \
  --mount "type=bind,src=$out,dst=/evidence" --workdir /examination --entrypoint node "$browser_image" checks.mjs "$1"
 local log_code=0
 docker logs "$browser" > "$log_private/browser-$1.log" 2>&1 || log_code=$?
 printf '\n[container-log-capture-exit:%s]\n' "$log_code" >> "$log_private/browser-$1.log"
 printf 'browser-%s\tLOGS_CAPTURED\t%s\n' "$1" "$log_code" >> "$log_private/acquisition.tsv"
 [[ "$log_code" == 0 ]]
 python3 "$script/complete-diagnostics.py" finalize
 [[ "$1" == restart ]] || docker rm "$browser" >/dev/null
}
run_checks missing
set_policy(){
 python3 - "$private/policy" "$1" <<'PY'
import datetime,hashlib,json,os,pathlib,sys
p=pathlib.Path(sys.argv[1]);mode=sys.argv[2]
v='invalid' if mode=='malformed' else json.dumps({'schema':1,'mode':'RELEASED','approvalSha256':hashlib.sha256(b'Authorised isolated nonproduction gate examination only').hexdigest(),'expiresAt':(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(seconds=120 if mode=='released' else -60)).isoformat()})
t=p/'next.json';t.write_text(v);t.chmod(0o444);os.replace(t,p/'control.json')
PY
 sudo -n chown 0:0 "$private/policy/control.json"
}
set_policy malformed;run_checks malformed
set_policy expired;run_checks expired
set_policy released;run_checks released
rm "$private/policy/control.json";run_checks revoked
docker restart --time 25 "$backend" >/dev/null
run_checks restart
after=$(fingerprint)
[[ "$before" == "$after" ]]
printf '{"committedRowsSha256":"%s","committedRowsAndStoredHashesUnchangedAcrossPolicyAndRestart":true,"source":"accepted run 40500699886 readback","snapshotReconstructionOnly":true,"originalDatabaseIdempotencyHashes":false,"noDecisionReplay":true}\n' "$after" > "$out/history-preservation.json"
