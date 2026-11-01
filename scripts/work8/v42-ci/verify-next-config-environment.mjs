// Examine the exact installed lockfile-bound Next config writer; never modify candidate source.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(process.argv[2]);
const require = createRequire(join(root, 'package.json'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const original = readFileSync(join(root, 'tsconfig.json'));
assert.equal(sha256(original), 'fa6a5e75ba9714b752a2071f84ff80393f636b53473bdb0ab59c74427df020b5');
const lockBytes = readFileSync(join(root, 'package-lock.json'));
assert.equal(sha256(lockBytes), '84f99595b7564d9196b0eeb25c054b290801bfe2e3a148f61ab2c9c2871d37b4');
const lock = JSON.parse(lockBytes);
assert.equal(require('next/package.json').version, lock.packages['node_modules/next'].version);
assert.equal(require('next/package.json').version, '16.2.9');
const tsVersion = require('typescript/package.json').version;
assert.equal(tsVersion, lock.packages['node_modules/typescript'].version);
const { writeConfigurationDefaults } = require('next/dist/lib/typescript/writeConfigurationDefaults.js');
const { getTypeDefinitionGlobPatterns } = require('next/dist/lib/typescript/type-paths.js');
const directory = mkdtempSync(join(process.env.RUNNER_TEMP || tmpdir(), 'next-config-boundary-'));
const previousNodeEnv = process.env.NODE_ENV;
try {
  const config = join(directory, 'tsconfig.json');
  writeFileSync(config, original);
  process.env.NODE_ENV = 'test';
  assert.deepEqual(getTypeDefinitionGlobPatterns('.next/dev'), ['.next/dev/types/**/*.ts', '.next/dev/dev/types/**/*.ts']);
  await writeConfigurationDefaults(tsVersion, config, false, true, '.next/dev', false, false);
  const observed = readFileSync(config);
  assert.equal(sha256(observed), '0c539326793ecdc1b8302a6848590054a34b32c7da0dec64f6f202b1ce59f9fa');
  const expected = JSON.parse(original);
  expected.include.push('.next/dev/dev/types/**/*.ts');
  assert.equal(observed.toString(), JSON.stringify(expected, null, 2) + '\n');
  writeFileSync(config, original);
  process.env.NODE_ENV = 'development';
  assert.deepEqual(getTypeDefinitionGlobPatterns('.next/dev'), ['.next/types/**/*.ts', '.next/dev/types/**/*.ts']);
  await writeConfigurationDefaults(tsVersion, config, false, true, '.next/dev', false, false);
  assert.deepEqual(readFileSync(config), original);
  assert.deepEqual(readFileSync(join(root, 'tsconfig.json')), original);
  assert.deepEqual(readFileSync(join(root, 'package-lock.json')), lockBytes);
  console.log(JSON.stringify({ status: 'PASS', next: '16.2.9', typescript: tsVersion, originalConfigSHA256: sha256(original), reproducedWrongEnvironmentConfigSHA256: sha256(observed), correctDevelopmentEnvironmentPreservesBytes: true, candidateSourceWritten: false, lockSHA256: sha256(lockBytes) }));
} finally {
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;
  rmSync(directory, { recursive: true, force: true });
}
