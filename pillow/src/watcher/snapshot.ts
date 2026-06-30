import { createHash } from "node:crypto";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  OBSERVATION_DIRECTORIES,
  OBSERVATION_PATHS,
} from "./observation-scope.js";
import type { FileSnapshotEntry, RepositorySnapshot } from "./types.js";

export async function captureSnapshot(
  reader: RepositoryReader,
): Promise<RepositorySnapshot> {
  const entries: FileSnapshotEntry[] = [];
  const seen = new Set<string>();

  for (const rel of OBSERVATION_PATHS) {
    if (seen.has(rel)) continue;
    seen.add(rel);
    entries.push(await snapshotFile(reader, rel));
  }

  for (const dir of OBSERVATION_DIRECTORIES) {
    const files = await listDirFilesRecursive(reader, dir, 2);
    for (const rel of files) {
      if (seen.has(rel)) continue;
      seen.add(rel);
      entries.push(await snapshotFile(reader, rel));
    }
  }

  entries.sort((a, b) => a.path.localeCompare(b.path));
  const fingerprint = createHash("sha256")
    .update(entries.map((e) => `${e.path}:${e.sizeBytes}:${e.modifiedAt}:${e.present}`).join("|"))
    .digest("hex")
    .slice(0, 16);

  return {
    capturedAt: new Date().toISOString(),
    fingerprint,
    entries,
  };
}

async function snapshotFile(
  reader: RepositoryReader,
  relativePath: string,
): Promise<FileSnapshotEntry> {
  try {
    const absolute = reader.resolve(relativePath);
    const fileStat = await stat(absolute);
    if (!fileStat.isFile()) {
      return { path: relativePath, sizeBytes: 0, modifiedAt: "", present: false };
    }
    return {
      path: relativePath,
      sizeBytes: fileStat.size,
      modifiedAt: fileStat.mtime.toISOString(),
      present: true,
    };
  } catch {
    return { path: relativePath, sizeBytes: 0, modifiedAt: "", present: false };
  }
}

async function listDirFilesRecursive(
  reader: RepositoryReader,
  relativeDir: string,
  maxDepth: number,
  depth = 0,
): Promise<string[]> {
  if (depth > maxDepth) return [];
  const { readdir } = await import("node:fs/promises");
  const results: string[] = [];
  try {
    const entries = await readdir(reader.resolve(relativeDir), {
      withFileTypes: true,
    });
    for (const entry of entries) {
      const rel = path.posix.join(relativeDir.replace(/\\/g, "/"), entry.name);
      if (entry.isFile()) {
        results.push(rel);
      } else if (entry.isDirectory() && !entry.name.startsWith(".")) {
        results.push(...(await listDirFilesRecursive(reader, rel, maxDepth, depth + 1)));
      }
    }
  } catch {
    /* directory may not exist */
  }
  return results;
}

export function diffSnapshots(
  previous: RepositorySnapshot | null,
  current: RepositorySnapshot,
): Array<{ path: string; kind: "new_file" | "modified_file" | "deleted_file" }> {
  if (!previous) return [];

  const prevMap = new Map(previous.entries.map((e) => [e.path, e]));
  const currMap = new Map(current.entries.map((e) => [e.path, e]));
  const changes: Array<{ path: string; kind: "new_file" | "modified_file" | "deleted_file" }> = [];

  for (const [path, curr] of currMap) {
    const prev = prevMap.get(path);
    if (!prev) {
      if (curr.present) changes.push({ path, kind: "new_file" });
      continue;
    }
    if (prev.present && !curr.present) {
      changes.push({ path, kind: "deleted_file" });
    } else if (
      curr.present &&
      prev.present &&
      (curr.modifiedAt !== prev.modifiedAt || curr.sizeBytes !== prev.sizeBytes)
    ) {
      changes.push({ path, kind: "modified_file" });
    }
  }

  for (const [path, prev] of prevMap) {
    if (!currMap.has(path) && prev.present) {
      changes.push({ path, kind: "deleted_file" });
    }
  }

  return changes;
}

export function snapshotChanged(
  previous: RepositorySnapshot | null,
  current: RepositorySnapshot,
): boolean {
  return !previous || previous.fingerprint !== current.fingerprint;
}
