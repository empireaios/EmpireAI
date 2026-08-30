#!/usr/bin/env node
/**
 * DEPLOY INVARIANT GATE — mandatory before semantic Pillow deploy.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const suites = [
  "src/validation/tests/independent-closure-invariants-fast.test.ts",
  "src/validation/tests/independent-closure-invariants-deploy.test.ts",
  "src/validation/tests/path-parity-scope-isolation.test.ts",
];

console.log("DEPLOY_INVARIANT_GATE: starting");
const r = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...suites],
  { cwd: backendRoot, stdio: "inherit", env: process.env },
);
if (r.status !== 0) {
  console.error("DEPLOY_INVARIANT_GATE: FAIL (test suites)");
  process.exit(r.status ?? 1);
}

const qual = spawnSync(
  process.execPath,
  ["--import", "tsx", "scripts/resolved-verdict-adversarial-qualify.mjs"],
  { cwd: backendRoot, stdio: "inherit", env: process.env },
);
if (qual.status !== 0) {
  console.error("DEPLOY_INVARIANT_GATE: FAIL (resolved-verdict-adversarial-qualify)");
  process.exit(qual.status ?? 1);
}

const sterling = spawnSync(
  process.execPath,
  ["--import", "tsx", "scripts/sterling-multi-failure-qualify.mjs"],
  { cwd: backendRoot, stdio: "inherit", env: process.env },
);
if (sterling.status !== 0) {
  console.error("DEPLOY_INVARIANT_GATE: FAIL (sterling-multi-failure-qualify)");
  process.exit(sterling.status ?? 1);
}

const finalVisible = spawnSync(
  process.execPath,
  ["--import", "tsx", "scripts/final-visible-contract-qualify.mjs"],
  { cwd: backendRoot, stdio: "inherit", env: process.env },
);
if (finalVisible.status !== 0) {
  console.error("DEPLOY_INVARIANT_GATE: FAIL (final-visible-contract-qualify)");
  process.exit(finalVisible.status ?? 1);
}

const transport = spawnSync(
  process.execPath,
  ["--import", "tsx", "scripts/transport-boundary-contract-qualify.mjs"],
  { cwd: backendRoot, stdio: "inherit", env: process.env },
);
if (transport.status !== 0) {
  console.error("DEPLOY_INVARIANT_GATE: FAIL (transport-boundary-contract-qualify)");
  process.exit(transport.status ?? 1);
}

for (const script of [
  "scripts/causal-predicate-qualify.mjs",
  "scripts/visible-relevance-qualify.mjs",
  "scripts/causal-relevance-combined-qualify.mjs",
  "scripts/case-provenance-causal-graph-qualify.mjs",
]) {
  const q = spawnSync(process.execPath, ["--import", "tsx", script], {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (q.status !== 0) {
    console.error(`DEPLOY_INVARIANT_GATE: FAIL (${script})`);
    process.exit(q.status ?? 1);
  }
}
console.log("DEPLOY_INVARIANT_GATE: PASS");
process.exit(0);
