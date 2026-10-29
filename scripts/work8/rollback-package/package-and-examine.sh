#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
script=$(cd -- "$(dirname -- "$0")" && pwd)
private="${GITHUB_WORKSPACE:?}/release-package-output/private"
mkdir -p "$private"
# Never stream raw diagnostics into the hosted public job log.
exec >> "$private/pipeline.log" 2>&1
source "$script/command-diagnostics.sh"
python3 "$script/complete-diagnostics.py" register-env
finish(){
 status=$?;trap - EXIT TERM INT;set +e
 python3 "$script/complete-diagnostics.py" finalize || status=1
 exit "$status"
}
trap finish EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
[[ "${GITHUB_RUN_ATTEMPT:?}" == 1 && "${GITHUB_RUN_NUMBER:?}" == 1 ]]
[[ "${GITHUB_REF:?}" == refs/heads/work8/rollback-package-20261029e ]]
bash "$script/acquire-retained-images.sh"
unset GH_TOKEN GITHUB_TOKEN
bash "$script/isolated-examine.sh"
