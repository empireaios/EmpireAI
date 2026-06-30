import path from "node:path";

import type { RepositoryReader } from "./repository-reader.js";
import {
  RECONSTRUCTION_SCAN_PROFILES,
  type ReconstructionScanProfile,
} from "./reconstruction-rules.js";

/** Discover all canonical source paths via convention-based scanning. */
export async function discoverCanonicalSources(
  reader: RepositoryReader,
): Promise<string[]> {
  const discovered = new Set<string>();

  for (const profile of RECONSTRUCTION_SCAN_PROFILES) {
    const paths = await scanProfile(reader, profile);
    for (const relativePath of paths) {
      discovered.add(normalizeRelativePath(relativePath));
    }
  }

  return [...discovered].sort();
}

async function scanProfile(
  reader: RepositoryReader,
  profile: ReconstructionScanProfile,
): Promise<string[]> {
  const results: string[] = [];

  if (!(await reader.exists(profile.relativeRoot === "." ? "JOURNEY.md" : profile.relativeRoot))) {
    if (profile.relativeRoot !== ".") return results;
  }

  if (profile.recursive) {
    await walkTree(reader, profile.relativeRoot, profile.filePattern, results);
    return results;
  }

  const files = await reader.listFiles(profile.relativeRoot);
  for (const file of files) {
    if (profile.filePattern.test(file)) {
      results.push(
        profile.relativeRoot === "."
          ? file
          : path.posix.join(profile.relativeRoot, file),
      );
    }
  }

  return results;
}

async function walkTree(
  reader: RepositoryReader,
  relativeDir: string,
  filePattern: RegExp,
  results: string[],
): Promise<void> {
  const files = await reader.listFiles(relativeDir);
  for (const file of files) {
    if (filePattern.test(file)) {
      results.push(path.posix.join(relativeDir, file));
    }
  }

  const subdirs = await reader.listSubdirs(relativeDir);
  for (const subdir of subdirs) {
    await walkTree(reader, path.posix.join(relativeDir, subdir), filePattern, results);
  }
}

function normalizeRelativePath(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}
