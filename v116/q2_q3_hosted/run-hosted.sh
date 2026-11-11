#!/usr/bin/env bash
set -euo pipefail
[[ "$GITHUB_RUN_ID" =~ ^[0-9]+$ ]]
root="$RUNNER_TEMP/v116-q2-q3-$GITHUB_RUN_ID"
out="$root/evidence"
controller="$GITHUB_WORKSPACE/v116/q2_q3_hosted"
image='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
name="v116-q23-package-$GITHUB_RUN_ID"
docker load --input "$root/backend.tar.gz" > "$out/docker-load.txt"
test "$(docker image inspect --format '{{.Id}}' "$image")" = "$image"
docker create --name "$name" --entrypoint /bin/true "$image" > "$out/package-container.txt"
mkdir -p "$root/package-app" "$root/node/bin"
docker cp "$name:/app/." "$root/package-app/"
docker cp "$name:/usr/local/bin/node" "$root/node/bin/node"
docker container rm "$name" >/dev/null
test "$(sha256sum "$root/node/bin/node" | cut -d' ' -f1)" = '3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
for relative in node_modules backend/node_modules pillow/node_modules backend/dist pillow/dist; do
  if [[ -e "$root/package-app/$relative" ]]; then
    test ! -e "$GITHUB_WORKSPACE/$relative"
    mkdir -p "$(dirname "$GITHUB_WORKSPACE/$relative")"
    cp -a "$root/package-app/$relative" "$GITHUB_WORKSPACE/$relative"
  fi
done
git -C "$GITHUB_WORKSPACE" diff --exit-code
test -z "$(git -C "$GITHUB_WORKSPACE" status --porcelain --untracked-files=no)"
test -z "$(git -C "$GITHUB_WORKSPACE" config --local --get-regexp '.*extraheader' || true)"
host_net=$(readlink /proc/self/ns/net)
printf '%s\n' "$host_net" > "$out/host-net-namespace.txt"
status=0
for phase in capture reasoning-admission response-delivery; do
  set +e
  # Source/dependencies and authority are read-only. This mounts no host home,
  # production paths, credentials, sockets, sysfs, network interface or device.
  sudo bwrap --unshare-all --die-with-parent --new-session --cap-drop ALL \
    --clearenv --setenv PATH /node/bin:/usr/bin:/bin --setenv LANG C.UTF-8 \
    --setenv PYTHONDONTWRITEBYTECODE 1 \
    --ro-bind /usr /usr --ro-bind /bin /bin --ro-bind /lib /lib \
    --ro-bind /lib64 /lib64 --dir /etc --ro-bind /etc/ld.so.cache /etc/ld.so.cache \
    --proc /proc --dev /dev --tmpfs /tmp \
    --ro-bind "$GITHUB_WORKSPACE" /app --ro-bind "$controller" /control \
    --ro-bind "$root/node" /node --bind "$out" /evidence --chdir /app \
    /usr/bin/python3 -B /control/hosted-loopback-controller.py "$phase" "$host_net" "$GITHUB_SHA" \
    > "$out/$phase-launch.log" 2>&1 &
  pid=$!
  printf '%s\n' "$pid" > "$root/current-launch.pid"
  wait "$pid"
  code=$?
  rm -f "$root/current-launch.pid"
  set -e
  printf '%s\n' "$code" > "$out/$phase-launch-exit.txt"
  if [[ "$code" != 0 ]]; then status=1; fi
done
git -C "$GITHUB_WORKSPACE" diff --exit-code
test -z "$(git -C "$GITHUB_WORKSPACE" status --porcelain --untracked-files=no)"
exit "$status"
