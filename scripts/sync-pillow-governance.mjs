#!/usr/bin/env node
/**
 * Mirror Pillow governance artifacts into backend/.pillow-governance-bundle
 * so Railway runtime can bootstrap when /app checkout is incomplete.
 * Mirrors pillow reconstruction scan profiles (read-only copies).
 */
import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const bundleRoot = path.join(repoRoot, "backend", ".pillow-governance-bundle");

const REQUIRED = [
  "EMPIREAI_SOUL.md",
  "EMPIREAI_CONSTITUTION.md",
  "PILLOW_ARCHITECTURE_CONTRACT.md",
  "JOURNEY.md",
];

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function copyRootMarkdown() {
  const entries = await readdir(repoRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !/\.md$/i.test(entry.name)) continue;
    await cp(path.join(repoRoot, entry.name), path.join(bundleRoot, entry.name));
  }
}

async function copyTree(relativeSource, relativeDest = relativeSource) {
  const source = path.join(repoRoot, relativeSource);
  if (!(await exists(source))) return;
  const destination = path.join(bundleRoot, relativeDest);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
}

async function countDoctrineFiles(root) {
  const entries = await readdir(root);
  return entries.filter((name) => /^EMPIREAI_.*_DOCTRINE.*\.md$/i.test(name)).length;
}

async function main() {
  await rm(bundleRoot, { recursive: true, force: true });
  await mkdir(bundleRoot, { recursive: true });

  await copyRootMarkdown();
  await copyTree("docs/governance");
  await copyTree("frontend/src/components/system");

  const missing = [];
  for (const file of REQUIRED) {
    if (!(await exists(path.join(bundleRoot, file)))) {
      missing.push(file);
    }
  }

  const doctrineCount = await countDoctrineFiles(bundleRoot);
  if (doctrineCount < 2) {
    missing.push(`doctrine_files>=2 (found ${doctrineCount})`);
  }

  if (missing.length > 0) {
    console.error(
      `[sync-pillow-governance] Bundle incomplete at ${bundleRoot}: missing ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  console.log(`[sync-pillow-governance] Bundle ready at ${bundleRoot}`);
}

await main();
