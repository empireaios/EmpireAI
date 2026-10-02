#!/usr/bin/env node
/**
 * OFFLINE ENGINEERING GATE — supplied-evidence Pillow regression checks.
 * This does not certify V53, Wave mastery, Birth, production or live commerce.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const suites = [
  "src/validation/tests/pillow-birth-authority.test.ts",
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
  "src/validation/tests/decision-state-authority-lock.test.ts",
  "src/validation/tests/bounded-commercial-routing-lock.test.ts",
  "src/validation/tests/unblock-epistemic-open-bounded-lock.test.ts",
  "src/validation/tests/path-parity-scope-isolation.test.ts",
  "src/validation/tests/memory-relevance-contract.test.ts",
  "src/validation/tests/memory-relevance-raw-pipeline.test.ts",
  "src/validation/tests/causal-state-atomic.test.ts",
  "src/validation/tests/chronology-evidence-contract.test.ts",
  "src/validation/tests/executive-truth-grounding.test.ts",
  "src/validation/tests/reasoning-core-l1-l4.test.ts",
  "src/validation/tests/post-foundation-repair4-levela.test.ts",
  "src/validation/tests/foundation-reset-learning.test.ts",
];

console.log("OFFLINE_ENGINEERING_GATE: starting");
console.log("Scope: offline engineering regressions only; not V53, Wave, Birth, production or commerce certification.");
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
  "scripts/decision-state-authority-qualify.mjs",
  "scripts/bounded-commercial-routing-qualify.mjs",
  "scripts/unblock-epistemic-open-bounded-qualify.mjs",
  "scripts/build-ec01-ec02-arith-qualify.mjs",
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
  console.error(`OFFLINE_ENGINEERING_GATE: FAIL (${failed} suites)`);
  process.exit(1);
}
console.log("OFFLINE_ENGINEERING_GATE: PASS");
process.exit(0);
