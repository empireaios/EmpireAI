#!/usr/bin/env node
/**
 * Mirror Pillow governance artifacts into backend/.pillow-governance-bundle.
 * Delegates to the TypeScript manifest-driven sync (single source of truth).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tsEntry = path.join(__dirname, "sync-pillow-governance.ts");
const result = spawnSync(
  process.execPath,
  ["--import", "tsx", tsEntry],
  { stdio: "inherit", cwd: path.join(__dirname, "..") },
);

process.exit(result.status ?? 1);
