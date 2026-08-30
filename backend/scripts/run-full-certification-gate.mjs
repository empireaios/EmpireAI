#!/usr/bin/env node
/**
 * FULL CERTIFICATION GATE — independent-closure + key existing Pillow regressions.
 * Not a Wave exam. Permanent engineering certification layer.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const suites = [
  "src/validation/tests/independent-closure-invariants-fast.test.ts",
  "src/validation/tests/independent-closure-invariants-deploy.test.ts",
  "src/validation/tests/independent-closure-invariants-full.test.ts",
  "src/validation/tests/resolved-verdict-authority.test.ts",
  "src/validation/tests/deterministic-resolved-verdict-lock.test.ts",
  "src/validation/tests/sterling-multi-failure-lock.test.ts",
  "src/validation/tests/final-visible-contract-lock.test.ts",
  "src/validation/tests/transport-boundary-contract-lock.test.ts",
  "src/validation/tests/causal-predicate-envelope-lock.test.ts",
  "src/validation/tests/case-provenance-causal-graph-lock.test.ts",
  "src/validation/tests/path-parity-scope-isolation.test.ts",
  "src/validation/tests/memory-relevance-contract.test.ts",
  "src/validation/tests/memory-relevance-raw-pipeline.test.ts",
  "src/validation/tests/causal-state-atomic.test.ts",
  "src/validation/tests/reasoning-core-l1-l4.test.ts",
  "src/validation/tests/post-foundation-repair4-levela.test.ts",
  "src/validation/tests/foundation-reset-learning.test.ts",
];

console.log("FULL_CERTIFICATION_GATE: starting");
let failed = 0;
for (const suite of suites) {
  console.log(`\n▶ ${suite}`);
  const r = spawnSync(process.execPath, ["--import", "tsx", "--test", suite], {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`FAIL: ${suite}`);
    failed += 1;
  }
}

for (const script of [
  "scripts/causal-predicate-qualify.mjs",
  "scripts/visible-relevance-qualify.mjs",
  "scripts/causal-relevance-combined-qualify.mjs",
  "scripts/case-provenance-causal-graph-qualify.mjs",
  "scripts/transport-boundary-contract-qualify.mjs",
]) {
  console.log(`\n▶ ${script}`);
  const q = spawnSync(process.execPath, ["--import", "tsx", script], {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (q.status !== 0) {
    console.error(`FAIL: ${script}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`FULL_CERTIFICATION_GATE: FAIL (${failed} suites)`);
  process.exit(1);
}
console.log("FULL_CERTIFICATION_GATE: PASS");
process.exit(0);
