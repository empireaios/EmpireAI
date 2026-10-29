#!/usr/bin/env bash
set -euo pipefail
[[ "${GITHUB_RUN_ATTEMPT:?}" == 1 && "${GITHUB_RUN_NUMBER:?}" == 1 ]]
[[ "${GITHUB_REF:?}" == refs/heads/work8/rollback-package-20261029b ]]
script=$(cd -- "$(dirname -- "$0")" && pwd)
bash "$script/build-images.sh"
unset GH_TOKEN GITHUB_TOKEN
bash "$script/isolated-examine.sh"
