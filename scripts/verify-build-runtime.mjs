#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const json = (root, name) => JSON.parse(readFileSync(resolve(root, name), "utf8"));

export function assertBuildRuntime({ nodeVersion, npmUserAgent, expectedNode, expectedNpm }) {
  assert.equal(nodeVersion.replace(/^v/, ""), expectedNode,
    `Install/build runtime drift: require Node ${expectedNode}; observed ${nodeVersion}. This check does not prove the production startup runtime.`);
  const npmVersion = npmUserAgent?.match(/^npm\/([^ ]+)/)?.[1];
  // npm supplies this for real preinstall hooks. A direct node invocation proves
  // only Node; it must not pretend to have verified npm.
  if (npmUserAgent) {
    assert.ok(npmVersion, "Installation must use the repository's pinned npm package manager");
    assert.equal(npmVersion, expectedNpm, `Package-manager drift: require npm ${expectedNpm}; observed ${npmVersion}`);
  }
  return { nodeVersion: expectedNode, npmVersion: npmVersion ?? null };
}

export function assertRepositoryBuildConfiguration(root = repositoryRoot) {
  const expectedNode = readFileSync(resolve(root, ".node-version"), "utf8").trim();
  assert.match(expectedNode, /^22\.\d+\.\d+$/, "Use an exact Node 22 patch version, matching hosted CI");
  const expectedNpm = json(root, "package.json").engines.npm;
  assert.match(expectedNpm, /^\d+\.\d+\.\d+$/, "Pin an exact npm version");
  for (const prefix of ["", "backend/", "pillow/"]) {
    const manifest = json(root, `${prefix}package.json`);
    const lockRoot = json(root, `${prefix}package-lock.json`).packages[""];
    assert.equal(manifest.engines.node, expectedNode, `${prefix}Node version differs from CI`);
    assert.equal(manifest.engines.npm, expectedNpm, `${prefix}npm version differs from root`);
    assert.equal(manifest.packageManager, `npm@${expectedNpm}`);
    assert.deepEqual(lockRoot.engines, manifest.engines, `${prefix}lockfile engine metadata differs`);
    assert.equal(manifest.scripts.preinstall,
      `node ${prefix ? "../" : ""}scripts/verify-build-runtime.mjs`, `${prefix}must reject runtime drift before install`);
  }
  const linkedPillow = json(root, "backend/package-lock.json").packages["../pillow"];
  assert.deepEqual(linkedPillow.engines, json(root, "pillow/package.json").engines);
  const railpack = json(root, "railpack.json");
  assert.equal(railpack.packages.node, expectedNode);
  // packageManager pins npm via the Node provider's documented Corepack path.
  // Do not assume an additional Mise npm package override is supported.
  assert.equal(railpack.packages.npm, undefined);
  // Overriding install commands replaces Railpack's Corepack bootstrap too.
  // Materialize its pinned package-manager cache before the runtime image copies it.
  assert.deepEqual(railpack.steps.install.commands,
    [`corepack prepare npm@${expectedNpm} --activate`, "npm ci --include=dev"]);
  assert.equal(railpack.deploy, undefined, "Build configuration must not override deployment authority or startup");
  const nixpacks = readFileSync(resolve(root, "nixpacks.toml"), "utf8");
  assert.match(nixpacks, /^NIXPACKS_NODE_VERSION = "22"$/m);
  assert.match(nixpacks, /\[phases\.install\]\s*cmds = \["NPM_CONFIG_PRODUCTION=false npm ci"\]/);
  const railway = readFileSync(resolve(root, "railway.toml"), "utf8");
  assert.match(railway, /npm ci --prefix pillow/);
  assert.match(railway, /npm ci --prefix backend/);
  assert.doesNotMatch(railway, /npm install/);
  if (/startCommand = "node deployment\/canary-launcher\.cjs"/.test(railway)) {
    assert.equal(railway, readFileSync(resolve(root, "deployment/railway.canary.toml"), "utf8"),
      "A temporary canary root must be exactly the reviewed canary reference");
    assert.match(railway, /^restartPolicyType = "NEVER"$/m);
  } else {
    assert.match(railway, /^startCommand = "node backend\/dist\/index\.js"$/m);
    assert.match(railway, /^restartPolicyType = "ON_FAILURE"$/m);
  }
  assert.match(railway, /^healthcheckPath = "\/health\/ready"$/m);
  for (const file of readdirSync(resolve(root, ".github/workflows")).filter(name => /\.ya?ml$/.test(name))) {
    const workflow = readFileSync(resolve(root, ".github/workflows", file), "utf8");
    const setups = [...workflow.matchAll(/uses: actions\/setup-node@[^\n]+([\s\S]*?)(?=\n\s*- name:|$)/g)];
    assert.ok(setups.length > 0, `${file}must establish a Node runtime`);
    for (const [, configuration] of setups) {
      assert.match(configuration, /node-version-file: '\.node-version'/, `${file}must consume the exact repository pin`);
      assert.doesNotMatch(configuration, /node-version:/, `${file}must not override the repository pin`);
    }
  }
  return { expectedNode, expectedNpm };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Install-time verification needs only the pins, not CI or deployment files.
  // Builders may intentionally omit those files from dependency-install layers.
  const pins = { expectedNode: readFileSync(resolve(repositoryRoot, ".node-version"), "utf8").trim(),
    expectedNpm: json(repositoryRoot, "package.json").engines.npm };
  const observed = assertBuildRuntime({
    ...pins, nodeVersion: process.versions.node, npmUserAgent: process.env.npm_config_user_agent,
  });
  console.log(JSON.stringify({ event: "build_runtime_verified", ...observed,
    npmVersionVerified: observed.npmVersion !== null }));
}
