/**
 * Safe reclaim of ephemeral /data junk so sql.js flush can write a temp DB copy.
 * Never deletes the live empireai-brain.db or commissioning-mirror JSON.
 */

import fs from "node:fs";
import path from "node:path";
import { logger } from "../config/logger.js";

export type VolumeDiskStats = {
  dataDir: string | null;
  exists: boolean;
  freeBytes: number | null;
  totalBytes: number | null;
  usedBytes: number | null;
  dbBytes: number | null;
  headroomBytes: number | null;
  canFlushFullDb: boolean | null;
};

export type ReclaimResult = {
  scanned: number;
  deleted: number;
  freedBytes: number;
  kept: string[];
  deletedPaths: string[];
  errors: string[];
};

function resolveDataDir(databasePath: string | undefined): string | null {
  if (!databasePath || databasePath.startsWith(":memory:")) return null;
  let resolved = path.resolve(databasePath);
  try {
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      return resolved;
    }
  } catch {
    // fall through
  }
  return path.dirname(resolved);
}

export function getVolumeDiskStats(databasePath: string | undefined): VolumeDiskStats {
  const dataDir = resolveDataDir(databasePath);
  if (!dataDir) {
    return {
      dataDir: null,
      exists: false,
      freeBytes: null,
      totalBytes: null,
      usedBytes: null,
      dbBytes: null,
      headroomBytes: null,
      canFlushFullDb: null,
    };
  }

  let freeBytes: number | null = null;
  let totalBytes: number | null = null;
  try {
    const st = fs.statfsSync(dataDir);
    freeBytes = Number(st.bfree) * Number(st.bsize);
    totalBytes = Number(st.blocks) * Number(st.bsize);
  } catch {
    // Node < 18.15 or unsupported platform
  }

  const dbPath = path.join(dataDir, "empireai-brain.db");
  let dbBytes: number | null = null;
  try {
    if (fs.existsSync(dbPath)) dbBytes = fs.statSync(dbPath).size;
  } catch {
    dbBytes = null;
  }

  const usedBytes =
    freeBytes !== null && totalBytes !== null ? Math.max(0, totalBytes - freeBytes) : null;
  const headroomBytes =
    freeBytes !== null && dbBytes !== null ? freeBytes - dbBytes : freeBytes;
  const canFlushFullDb =
    freeBytes !== null && dbBytes !== null ? freeBytes > dbBytes + 8 * 1024 * 1024 : null;

  return {
    dataDir,
    exists: fs.existsSync(dataDir),
    freeBytes,
    totalBytes,
    usedBytes,
    dbBytes,
    headroomBytes,
    canFlushFullDb,
  };
}

/**
 * Delete only known-safe ephemeral artifacts:
 * - empireai-brain.db.tmp-*
 * - empireai-brain.db.tmp-shutdown
 * - empireai-brain.db.corrupt-* except the newest (keep 1)
 */
export function reclaimEphemeralSqliteArtifacts(databasePath: string | undefined): ReclaimResult {
  const dataDir = resolveDataDir(databasePath);
  const result: ReclaimResult = {
    scanned: 0,
    deleted: 0,
    freedBytes: 0,
    kept: [],
    deletedPaths: [],
    errors: [],
  };
  if (!dataDir || !fs.existsSync(dataDir)) return result;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dataDir, { withFileTypes: true });
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  }

  const corrupt: { name: string; mtimeMs: number; size: number }[] = [];
  const deleteCandidates: { name: string; size: number }[] = [];

  for (const ent of entries) {
    if (!ent.isFile()) continue;
    result.scanned += 1;
    const name = ent.name;
    let size = 0;
    let mtimeMs = 0;
    try {
      const st = fs.statSync(path.join(dataDir, name));
      size = st.size;
      mtimeMs = st.mtimeMs;
    } catch {
      continue;
    }

    if (name.startsWith("empireai-brain.db.tmp-") || name === "empireai-brain.db.tmp-shutdown") {
      deleteCandidates.push({ name, size });
      continue;
    }
    if (name.startsWith("empireai-brain.db.corrupt-")) {
      corrupt.push({ name, mtimeMs, size });
    }
  }

  corrupt.sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (corrupt.length > 0) {
    result.kept.push(corrupt[0]!.name);
    for (const c of corrupt.slice(1)) {
      deleteCandidates.push({ name: c.name, size: c.size });
    }
  }

  for (const cand of deleteCandidates) {
    const full = path.join(dataDir, cand.name);
    try {
      fs.unlinkSync(full);
      result.deleted += 1;
      result.freedBytes += cand.size;
      result.deletedPaths.push(cand.name);
    } catch (error) {
      result.errors.push(
        `${cand.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (result.deleted > 0) {
    logger.warn(
      {
        dataDir,
        deleted: result.deleted,
        freedBytes: result.freedBytes,
        deletedPaths: result.deletedPaths,
      },
      "Reclaimed ephemeral SQLite artifacts from /data volume",
    );
  }

  return result;
}
