#!/usr/bin/env node
/**
 * Mirror Pillow governance artifacts into backend/.pillow-governance-bundle.
 * Delegates to the TypeScript manifest-driven sync (single source of truth).
 *
 * Resolves `tsx` from backend/node_modules first so `cd backend && npm run build`
 * works after a clean clone without requiring a root-level npm install.
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const tsEntry = path.join(__dirname, "sync-pillow-governance.ts");

function resolveTsxImportSpecifier() {
  const backendPkg = path.join(repoRoot, "backend", "package.json");
  if (fs.existsSync(backendPkg)) {
    try {
      const requireFromBackend = createRequire(backendPkg);
      const tsxEntry = requireFromBackend.resolve("tsx");
      return pathToFileURL(tsxEntry).href;
    } catch {
      // fall through to bare specifier / root resolution
    }
  }
  return "tsx";
}

const tsxSpecifier = resolveTsxImportSpecifier();
const result = spawnSync(
  process.execPath,
  ["--import", tsxSpecifier, tsEntry],
  { stdio: "inherit", cwd: repoRoot },
);

process.exit(result.status ?? 1);
