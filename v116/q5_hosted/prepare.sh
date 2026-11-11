#!/usr/bin/env bash
set -euo pipefail
owned_docker(){ env -i PATH=/usr/bin:/bin LANG=C.UTF-8 /usr/bin/docker "$@"; }
[[ "$GITHUB_RUN_ID" =~ ^[0-9]+$ ]]
root="$RUNNER_TEMP/v116-q5-$GITHUB_RUN_ID"
app="$GITHUB_WORKSPACE/application"
image='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
name="v116-q5-package-$GITHUB_RUN_ID"
test "$(git -C "$app" rev-parse HEAD)" = '6c1e63ba20619ee480742fd87dc810ca93152e22'
test "$(git -C "$app" rev-parse 'HEAD^{tree}')" = 'a78aa0e0a91c1e765afb23e70fe05c75cddc836e'
test -z "$(git -C "$app" status --porcelain)"
test -z "$(git -C "$app" config --local --get-regexp '.*extraheader' || true)"
origin=$(git -C "$app" config --local --get remote.origin.url)
[[ "$origin" == 'https://github.com/empireaios/EmpireAI' || "$origin" == 'https://github.com/empireaios/EmpireAI.git' ]]
test -z "$(owned_docker container ls -aq --filter "name=^/$name$")"
env -i PATH=/usr/bin:/bin LANG=C.UTF-8 /usr/bin/docker load --input "$root/backend.tar.gz" > "$root/evidence/docker-load.txt"
test "$(owned_docker image inspect --format '{{.Id}}' "$image")" = "$image"
owned_docker create --name "$name" --label "empireai.v116.q5.package=$GITHUB_RUN_ID" --entrypoint /bin/true "$image" > "$root/evidence/package-container.txt"
mkdir -p "$root/node/bin"
owned_docker cp "$name:/usr/local/bin/node" "$root/node/bin/node"
owned_docker container rm "$name" >/dev/null
test "$(sha256sum "$root/node/bin/node" | cut -d' ' -f1)" = '3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
