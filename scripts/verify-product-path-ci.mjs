#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

const targets = [
  {
    label: "Pillow runtime",
    directory: "pillow",
    requiredScripts: ["typecheck", "build", "test"],
  },
  {
    label: "Backend runtime",
    directory: "backend",
    requiredScripts: ["typecheck", "build", "test"],
  },
  {
    label: "Legacy Vite frontend",
    directory: "frontend",
    requiredScripts: ["typecheck", "build"],
  },
  {
    label: "Next.js EmpireAI web",
    directory: "empireai-web",
    requiredScripts: ["typecheck", "lint", "build", "test"],
  },
];

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repositoryRoot, relativePath), "utf8"));
}

function findTestFiles(directory) {
  const matches = [];

  function visit(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === "build" ||
        entry.name === "coverage" ||
        entry.name.startsWith(".")
      ) continue;
      const absolute = join(current, entry.name);
      if (entry.isDirectory()) {
        visit(absolute);
      } else if (
        entry.isFile() &&
        [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"].includes(extname(entry.name)) &&
        /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name)
      ) {
        matches.push(absolute);
      }
    }
  }

  visit(join(repositoryRoot, directory));
  return matches;
}

for (const target of targets) {
  const manifestPath = `${target.directory}/package.json`;
  const lockPath = `${target.directory}/package-lock.json`;
  assert.ok(existsSync(join(repositoryRoot, manifestPath)), `${target.label}: missing ${manifestPath}`);
  assert.ok(existsSync(join(repositoryRoot, lockPath)), `${target.label}: missing ${lockPath}`);

  const manifest = readJson(manifestPath);
  const lock = readJson(lockPath);
  assert.equal(lock.lockfileVersion, 3, `${target.label}: package-lock.json must use lockfileVersion 3`);

  for (const script of target.requiredScripts) {
    assert.equal(
      typeof manifest.scripts?.[script],
      "string",
      `${target.label}: missing required npm script ${script}`,
    );
  }

  const tests = findTestFiles(target.directory);
  if (tests.length > 0) {
    assert.equal(
      typeof manifest.scripts?.test,
      "string",
      `${target.label}: ${tests.length} test files exist but no npm test script exposes them to CI`,
    );
  }

  console.log(
    `${target.label}: lockfile present; scripts ${target.requiredScripts.join(", ")}; ${tests.length} test files`,
  );
}

const rootVercel = readJson("vercel.json");
assert.equal(rootVercel.installCommand, "npm install --prefix frontend");
assert.equal(rootVercel.buildCommand, "npm run build --prefix frontend");
assert.equal(rootVercel.outputDirectory, "frontend/dist");

const nextVercel = readJson("empireai-web/vercel.json");
assert.equal(nextVercel.framework, "nextjs");
assert.equal(nextVercel.buildCommand, "npm run build");

const vercelIgnore = readFileSync(join(repositoryRoot, ".vercelignore"), "utf8");
assert.match(
  vercelIgnore,
  /^# Monorepo upload ignores for Vercel project Root Directory = empireai-web\.$/m,
  ".vercelignore must retain the canonical Vercel Root Directory contract",
);

const cockpitArchitecture = readFileSync(
  join(repositoryRoot, "docs/architecture/EMPIREAI_COCKPIT_ARCHITECTURE.md"),
  "utf8",
);
assert.match(
  cockpitArchitecture,
  /\| \*\*Primary deploy\*\* \| Vercel `empireai-web\/` \|/,
  "Cockpit architecture must retain empireai-web as the primary deploy",
);

console.log("Production deployment contract: Vercel Root Directory and primary deploy are empireai-web.");
console.log("Stale compatibility config remains: root vercel.json still targets the legacy Vite frontend.");
console.log("CI validates both targets but treats the Next.js empireai-web build as release-critical.");
