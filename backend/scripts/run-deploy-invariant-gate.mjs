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
  console.error("DEPLOY_INVARIANT_GATE: FAIL");
  process.exit(r.status ?? 1);
}
console.log("DEPLOY_INVARIANT_GATE: PASS");
process.exit(0);
