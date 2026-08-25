#!/usr/bin/env node
/**
 * FAST INVARIANT GATE — cheap gate during semantic Pillow development.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

console.log("FAST_INVARIANT_GATE: starting");
const suites = [
  "src/validation/tests/independent-closure-invariants-fast.test.ts",
  "src/validation/tests/resolved-verdict-authority.test.ts",
  "src/validation/tests/deterministic-resolved-verdict-lock.test.ts",
];
const r = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...suites],
  { cwd: backendRoot, stdio: "inherit", env: process.env },
);
if (r.status !== 0) {
  console.error("FAST_INVARIANT_GATE: FAIL");
  process.exit(r.status ?? 1);
}
console.log("FAST_INVARIANT_GATE: PASS");
process.exit(0);
