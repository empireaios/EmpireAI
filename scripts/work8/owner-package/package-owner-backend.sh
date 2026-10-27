#!/usr/bin/env bash
# Inputs: exact clean source checkout, downloaded accepted artifact directory, output directory.
# Never compiles, starts the application, pushes an image, or deploys.
set -euo pipefail
src=$(realpath "$1"); artifact=$(realpath "$2"); out=$(realpath -m "$3")
: "${OWNER_NODE_IMAGE:?Supply independently reviewed node:22.23.2-bookworm-slim@sha256 digest}"
[[ "$OWNER_NODE_IMAGE" =~ ^node:22\.23\.2-bookworm-slim@sha256:[a-f0-9]{64}$ ]]
[[ $(git -C "$src" rev-parse HEAD) == 98970018d579e5a7c720d25293cdddbe294856c0 ]]
[[ $(git -C "$src" rev-parse 'HEAD^{tree}') == 7469666e172da6c7ed63648edb673b599e08079e ]]
[[ -z $(git -C "$src" status --porcelain) ]]
[[ ! -e "$out" ]]; mkdir -p "$out/context"
exec > >(tee "$out/packaging.log") 2>&1
trap 'printf "%s\n" "$?" > "$out/exit-code.txt"' EXIT
printf '%s  %s\n' 9b0249c91e60c2ea6e92af6fbb2aa72e464bb0f74dcf43ba7ec214ea59e10a41 "$artifact/backend-compiled.tar.gz" | sha256sum -c -
(cd "$src"; printf '%s\n' '53f3c989531a4a86b99eb544b1e90c6df367c091acb4c23115ca787079b2dde2  pillow/package-lock.json' 'ac637e1e0329d484c8eac12ccd47a0cd6a82a51df592e94495d325c79062b13f  backend/package-lock.json' | sha256sum -c -)
git -C "$src" archive HEAD | tar -xf - -C "$out/context"
tar -xzf "$artifact/backend-compiled.tar.gz" -C "$out/context"
cp "$(dirname "$0")/OwnerBackend.Dockerfile" "$out/context/OwnerBackend.Dockerfile"
docker build --platform linux/amd64 --build-arg NODE_IMAGE="$OWNER_NODE_IMAGE" --iidfile "$out/image-id.txt" -f "$out/context/OwnerBackend.Dockerfile" "$out/context"
image=$(cat "$out/image-id.txt")
docker image inspect "$image" > "$out/image-inspect.json"
docker save "$image" | gzip -n > "$out/owner-backend-image.tar.gz"
printf '%s\n' '98970018d579e5a7c720d25293cdddbe294856c0' > "$out/source.txt"
printf '%s\n' "$OWNER_NODE_IMAGE" > "$out/base-image.txt"
printf '%s\n' 'Artifact 12698388923 / run40424964819 attempt1 reused; no compilation. IMAGE_PACKAGING_ONLY. Runtime startup, isolated authenticated DEFER, selectable platform identity, protected copy and release approval remain gates.' > "$out/ACCEPTANCE-LIMIT.txt"
(cd "$out"; sha256sum owner-backend-image.tar.gz image-id.txt image-inspect.json source.txt base-image.txt ACCEPTANCE-LIMIT.txt > SHA256SUMS)
