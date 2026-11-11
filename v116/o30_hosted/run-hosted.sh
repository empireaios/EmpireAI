#!/usr/bin/env bash
set -euo pipefail
[[ "$GITHUB_RUN_ID" =~ ^[0-9]+$ ]]
root="$RUNNER_TEMP/v116-o30-$GITHUB_RUN_ID"
out="$root/evidence"
controller="$GITHUB_WORKSPACE/v116/o30_hosted"
image='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
name="v116-o30-package-$GITHUB_RUN_ID"
unit="v116-o30-$GITHUB_RUN_ID.service"
test "$(systemctl show "$unit" --property=LoadState --value)" = 'not-found'
test -z "$(docker container ls -aq --filter "name=^/$name$")"
docker load --input "$root/backend.tar.gz" > "$out/docker-load.txt"
test "$(docker image inspect --format '{{.Id}}' "$image")" = "$image"
docker create --name "$name" --entrypoint /bin/true "$image" > "$out/package-container.txt"
mkdir -p "$root/package-app" "$root/node/bin"
docker cp "$name:/app/." "$root/package-app/"
docker cp "$name:/usr/local/bin/node" "$root/node/bin/node"
docker container rm "$name" >/dev/null
test "$(sha256sum "$root/node/bin/node" | cut -d' ' -f1)" = '3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
stage="$(readlink -f /var/tmp)/v116-o30-$GITHUB_RUN_ID"
sudo python3 -B "$controller/stage-inputs.py" "$root/package-app" "$root/node" "$controller/control" "$GITHUB_RUN_ID" "$out"
host_net=$(readlink /proc/self/ns/net)
printf '%s\n' "$host_net" > "$out/host-net-namespace.txt"
set +e
sudo systemd-run --wait --pipe --collect --unit="$unit" \
  --property=Type=exec --property=MemoryMax=2147483648 --property=MemorySwapMax=0 \
  --property=TasksMax=128 --property=CPUQuota=200% --property=RuntimeMaxSec=900 \
  --property=KillMode=control-group --property=TimeoutStopSec=10 \
  --property=SendSIGKILL=yes --property=Restart=no \
  /usr/bin/python3 -B "$controller/host-entry.py" "$GITHUB_RUN_ID" "$GITHUB_SHA" "$host_net" "$stage" \
  > "$out/native-launch.log" 2>&1
code=$?
set -e
printf '%s\n' "$code" > "$out/native-launch-exit.txt"
exit "$code"
