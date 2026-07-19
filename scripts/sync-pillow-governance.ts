#!/usr/bin/env node
/**
 * Mirror Pillow governance artifacts into backend/.pillow-governance-bundle
 * using RECONSTRUCTION_SCAN_PROFILES + bootstrap manifest (not ad-hoc paths).
 */
import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { access, constants } from "node:fs/promises";

import {
  GOVERNANCE_BUNDLE_SCAN_PROFILES,
  PILLOW_HOST_BOOTSTRAP_REQUIRED_FILES,
  PILLOW_HOST_REQUIRED_KNOWLEDGE_FILES,
  PILLOW_HOST_MIN_DOCTRINE_FILES,
} from "../pillow/src/bootstrap/governance-bundle-manifest.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const bundleRoot = path.join(repoRoot, "backend", ".pillow-governance-bundle");

async function exists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function copyFile(source: string, destination: string): Promise<void> {
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
}

async function copyScanProfile(profile: (typeof GOVERNANCE_BUNDLE_SCAN_PROFILES)[number]): Promise<void> {
  const sourceRoot = path.join(repoRoot, profile.relativeRoot);
  if (!(await exists(sourceRoot))) return;

  if (profile.relativeRoot === ".") {
    const entries = await readdir(sourceRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !profile.filePattern.test(entry.name)) continue;
      await copyFile(path.join(sourceRoot, entry.name), path.join(bundleRoot, entry.name));
    }
    return;
  }

  async function walk(relativeDir: string): Promise<void> {
    const absoluteDir = path.join(sourceRoot, relativeDir);
    const entries = await readdir(absoluteDir, { withFileTypes: true });
    for (const entry of entries) {
      const childRelative = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        if (profile.recursive) await walk(childRelative);
        continue;
      }
      if (!entry.isFile() || !profile.filePattern.test(entry.name)) continue;
      const dest = path.join(bundleRoot, profile.relativeRoot, childRelative);
      await copyFile(path.join(sourceRoot, childRelative), dest);
    }
  }

  await walk("");
}

async function countDoctrineFiles(root: string): Promise<number> {
  let count = 0;
  try {
    const entries = await readdir(root);
    for (const name of entries) {
      if (/^EMPIREAI_.*_DOCTRINE.*\.md$/i.test(name)) {
        try {
          await access(path.join(root, name), constants.R_OK);
          count += 1;
        } catch {
          // skip
        }
      }
    }
  } catch {
    return 0;
  }
  return count;
}

async function main(): Promise<void> {
  await rm(bundleRoot, { recursive: true, force: true });
  await mkdir(bundleRoot, { recursive: true });

  for (const profile of GOVERNANCE_BUNDLE_SCAN_PROFILES) {
    await copyScanProfile(profile);
  }

  const missing: string[] = [];
  for (const file of PILLOW_HOST_REQUIRED_KNOWLEDGE_FILES) {
    if (!(await exists(path.join(bundleRoot, file)))) missing.push(file);
  }
  for (const file of PILLOW_HOST_BOOTSTRAP_REQUIRED_FILES) {
    if (!(await exists(path.join(bundleRoot, file)))) missing.push(file);
  }

  const doctrineCount = await countDoctrineFiles(bundleRoot);
  if (doctrineCount < PILLOW_HOST_MIN_DOCTRINE_FILES) {
    missing.push(`doctrine_files>=${PILLOW_HOST_MIN_DOCTRINE_FILES} (found ${doctrineCount})`);
  }

  if (missing.length > 0) {
    console.error(
      `[sync-pillow-governance] Bundle incomplete at ${bundleRoot}: missing ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  console.log(`[sync-pillow-governance] Bundle ready at ${bundleRoot}`);
}

main().catch((error) => {
  console.error(`[sync-pillow-governance] Failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
