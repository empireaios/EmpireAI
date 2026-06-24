#!/usr/bin/env node
/**
 * Verifies backend dev dependencies (tsx, typescript, sql.js).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const quiet = process.argv.includes("--quiet") || process.argv.includes("--postinstall");
const require = createRequire(import.meta.url);

const errors = [];

function log(msg) {
  if (!quiet) console.log(msg);
}

function nodeVersionOk() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 20) {
    errors.push(`Node.js >= 20 required (found ${process.versions.node})`);
  } else {
    log(`Node.js ${process.versions.node} OK`);
  }
}

function checkPath(relativePath, label) {
  const full = path.join(backendRoot, relativePath);
  if (!fs.existsSync(full)) {
    errors.push(`Missing ${label}: ${relativePath} (run npm install in backend/)`);
    return false;
  }
  log(`${label} OK`);
  return true;
}

function checkImport(moduleName, label) {
  try {
    require.resolve(moduleName, { paths: [backendRoot] });
    log(`${label} resolvable`);
    return true;
  } catch {
    errors.push(`Cannot resolve ${label} (${moduleName}). Run: npm install`);
    return false;
  }
}

nodeVersionOk();
checkPath("node_modules", "node_modules");
checkPath(path.join("node_modules", "tsx", "package.json"), "tsx");
checkPath(path.join("node_modules", "typescript", "package.json"), "typescript");
checkPath(path.join("node_modules", "sql.js", "dist", "sql-wasm.wasm"), "sql.js wasm");

if (errors.length === 0) {
  checkImport("tsx", "tsx");
  checkImport("typescript", "typescript");
  checkImport("sql.js", "sql.js");
}

if (errors.length > 0) {
  const message = errors.join("\n  - ");
  if (process.argv.includes("--postinstall")) {
    console.warn("[EmpireAI] postinstall verify warnings:\n  - " + message);
    process.exit(0);
  }
  console.error("Development environment check FAILED:\n  - " + message);
  console.error("\nFix: cd backend && npm run setup");
  process.exit(1);
}

if (!quiet) {
  console.log("Development environment OK (pure-JS SQLite via sql.js — no Python/node-gyp required)");
}
