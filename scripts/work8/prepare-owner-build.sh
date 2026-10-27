#!/usr/bin/env bash
set -euo pipefail
mkdir owner-build-output
out="$PWD/owner-build-output"
exec > >(tee "$out/build.log") 2>&1
trap 'result=$?; printf "%s\n" "$result" > "$out/exit-code.txt"' EXIT
for checkout in controller backend-source frontend-source; do
 git -C "$checkout" rev-parse HEAD > "$out/$checkout.commit"
 git -C "$checkout" rev-parse 'HEAD^{tree}' > "$out/$checkout.tree"
done
cat > "$out/RELEASE-GATES.json" <<'GATES'
{"classification":"COMPILED_PREPARATION_ONLY","deployable":false,"deploymentAuthorized":false,"protectedCustody":false,"wholeRowAccepted":false,"remainingGates":["Exact Railway OCI/Vercel output packaging and required public build configuration","Independent authenticated durable DEFER persistence/version/replay/history examination","Protected consistent institutional-memory and session copy with independent full readback","Selectable rollback artifacts and corrected backend compatibility floor after any committed DEFER","Separate exact production release approval"],"rollbackRule":"After committed DEFER retain corrected backend; never revert institutional-memory data to fit old projection logic. Old frontend rollback requires decision submission disabled.","retention":"Seven-day Actions artifact retention is not operational protected custody."}
GATES
node --version > "$out/node-version.txt"
npm --version > "$out/npm-version.txt"
[[ "${GITHUB_EVENT_NAME:-}" == push ]]
[[ "${GITHUB_REF:-}" == refs/heads/work8/writer-integration-20261025v ]]
[[ "${GITHUB_RUN_ATTEMPT:-}" == 1 ]]
[[ "$(node --version)" == v22.23.2 ]]
[[ "${WORK8_EXPECTED_CONTROLLER:-}" =~ ^[a-f0-9]{40}$ ]]
[[ "$(git -C controller rev-parse HEAD)" == "$WORK8_EXPECTED_CONTROLLER" ]]
[[ "$(git -C backend-source rev-parse HEAD)" == 98970018d579e5a7c720d25293cdddbe294856c0 ]]
[[ "$(git -C backend-source rev-parse 'HEAD^{tree}')" == 7469666e172da6c7ed63648edb673b599e08079e ]]
[[ "$(git -C frontend-source rev-parse HEAD)" == 42dfd0aa9d69a74d237f17555e6a1aeb343c59b9 ]]
[[ "$(git -C frontend-source rev-parse 'HEAD^{tree}')" == 6d7d834b45964dadf3dab24818467ba6b5187e94 ]]
(
 cd backend-source
 npm ci --prefix pillow
 npm ci --prefix backend
 node scripts/sync-pillow-governance.mjs
 npm run build --prefix pillow
 npm run build --prefix backend
 git diff --exit-code
 tar -czf "$out/backend-compiled.tar.gz" pillow/dist backend/dist
 sha256sum pillow/package-lock.json backend/package-lock.json > "$out/backend-lockfiles.sha256"
)
(
 cd frontend-source
 npm ci --prefix empireai-web
 npm run build --prefix empireai-web
 git diff --exit-code
 tar --exclude='.next/cache' -czf "$out/frontend-compiled.tar.gz" -C empireai-web .next
 sha256sum empireai-web/package-lock.json > "$out/frontend-lockfile.sha256"
)
node --version > "$out/node-version.txt"
npm --version > "$out/npm-version.txt"
printf '%s\n' 'BUILD_PREPARATION_ONLY: compiled outputs are not deployable platform artifacts; no Vercel output bundle or Railway OCI image is claimed. Runtime dependencies, public build configuration, platform packaging, authenticated persistence and protected-copy gates remain.' > "$out/ACCEPTANCE-LIMIT.txt"
(cd "$out"; sha256sum *.tar.gz *lockfile*.sha256 *version.txt *.commit *.tree RELEASE-GATES.json ACCEPTANCE-LIMIT.txt > SHA256SUMS)
