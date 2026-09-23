import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { assertBuildRuntime, assertRepositoryBuildConfiguration } from "./verify-build-runtime.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pins = { expectedNode: "22.23.2", expectedNpm: "10.9.8" };

test("repository and both provider install paths agree with hosted CI pins", () => {
  assert.deepEqual(assertRepositoryBuildConfiguration(root), pins);
});

test("the actual canary Node 24 and Node 20 drift, and untested patches, fail closed", () => {
  for (const nodeVersion of ["24.10.0", "20.20.2", "22.23.1", "22.24.0"]) {
    assert.throws(() => assertBuildRuntime({ ...pins, nodeVersion }), /Install\/build runtime drift/);
  }
  assert.deepEqual(assertBuildRuntime({ ...pins, nodeVersion: "22.23.2", npmUserAgent: "npm/10.9.8 node/v22.23.2 linux x64" }),
    { nodeVersion: "22.23.2", npmVersion: "10.9.8" });
});

test("a different npm or package manager cannot install while claiming the pinned toolchain", () => {
  for (const npmUserAgent of ["npm/11.6.1 node/v22.23.2", "pnpm/10.0.0 node/v22.23.2"]) {
    assert.throws(() => assertBuildRuntime({ ...pins, nodeVersion: "22.23.2", npmUserAgent }));
  }
  assert.equal(assertBuildRuntime({ ...pins, nodeVersion: "22.23.2" }).npmVersion, null);
});

test("configuration regression to automatic npm install is detected", () => {
  const temp = mkdtempSync(join(tmpdir(), "empire-build-contract-"));
  try {
    for (const file of [".node-version", "package.json", "package-lock.json", "railpack.json", "nixpacks.toml", "railway.toml",
      "backend/package.json", "backend/package-lock.json", "pillow/package.json", "pillow/package-lock.json"]) {
      mkdirSync(dirname(join(temp, file)), { recursive: true }); cpSync(join(root, file), join(temp, file));
    }
    cpSync(join(root, ".github/workflows"), join(temp, ".github/workflows"), { recursive: true });
    const railpack = JSON.parse(readFileSync(join(temp, "railpack.json"), "utf8"));
    // A clean provider image has no /opt/corepack until the bootstrap executes.
    railpack.steps.install.commands = ["npm ci --include=dev"];
    writeFileSync(join(temp, "railpack.json"), JSON.stringify(railpack));
    assert.throws(() => assertRepositoryBuildConfiguration(temp));
    railpack.steps.install.commands = ["npm install"];
    writeFileSync(join(temp, "railpack.json"), JSON.stringify(railpack));
    assert.throws(() => assertRepositoryBuildConfiguration(temp));
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test("the real preinstall entrypoint accepts only the running pinned Node/npm", () => {
  const result = spawnSync(process.execPath, [join(root, "scripts/verify-build-runtime.mjs")], {
    cwd: root, encoding: "utf8", env: { ...process.env, npm_config_user_agent: "npm/10.9.8 node/v22.23.2" },
  });
  if (process.versions.node === pins.expectedNode) {
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /build_runtime_verified/);
  } else {
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Install\/build runtime drift/);
  }
});
