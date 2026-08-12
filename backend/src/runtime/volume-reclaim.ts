/**
 * Safe /data reclaim for Railway volume ENOSPC.
 *
 * Never deletes the live DATABASE_PATH.
 * Only removes:
 *   - stale sql.js export temps (*.tmp-*)
 *   - older SQLite quarantine copies (*.corrupt-*), keeping the newest one
 *   - stale commissioning-mirror temps
 */

import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { isInMemoryDatabasePath } from "../brain/sqlite-database.js";

export type VolumeReclaimReport = {
  dataDir: string | null;
  beforeBytes: number | null;
  afterBytes: number | null;
  freedBytes: number;
  deleted: string[];
  keptCorrupt: string | null;
  errors: string[];
};

function resolveDataDir(): string | null {
  const raw = process.env.DATABASE_PATH ?? env.DATABASE_PATH;
  if (!raw || isInMemoryDatabasePath(raw)) return null;
  let resolved = path.resolve(raw);
  try {
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      return resolved;
    }
  } catch {
    // continue
  }
  return path.dirname(resolved);
}

function dirUsageBytes(dir: string): number {
  let total = 0;
  const walk = (p: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(p, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(p, ent.name);
      try {
        if (ent.isDirectory()) walk(full);
        else total += fs.statSync(full).size;
      } catch {
        // skip
      }
    }
  };
  walk(dir);
  return total;
}

export function reclaimEphemeralVolumeFiles(): VolumeReclaimReport {
  const dataDir = resolveDataDir();
  const report: VolumeReclaimReport = {
    dataDir,
    beforeBytes: null,
    afterBytes: null,
    freedBytes: 0,
    deleted: [],
    keptCorrupt: null,
    errors: [],
  };
  if (!dataDir || !fs.existsSync(dataDir)) {
    return report;
  }

  report.beforeBytes = dirUsageBytes(dataDir);
  const liveDb = path.resolve(process.env.DATABASE_PATH ?? env.DATABASE_PATH);
  const liveBase = path.basename(liveDb);

  let entries: string[] = [];
  try {
    entries = fs.readdirSync(dataDir);
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : String(error));
    return report;
  }

  // 1) Delete export / mirror temps
  for (const name of entries) {
    if (!name.includes(".tmp-")) continue;
    if (name === liveBase) continue;
    const full = path.join(dataDir, name);
    try {
      const st = fs.statSync(full);
      if (!st.isFile()) continue;
      fs.unlinkSync(full);
      report.deleted.push(name);
      report.freedBytes += st.size;
    } catch (error) {
      report.errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 2) Keep newest corrupt quarantine; delete older ones
  const corrupt = entries
    .filter((n) => n.includes(".corrupt-"))
    .map((n) => {
      const full = path.join(dataDir, n);
      try {
        return { name: n, full, mtime: fs.statSync(full).mtimeMs, size: fs.statSync(full).size };
      } catch {
        return null;
      }
    })
    .filter((x): x is { name: string; full: string; mtime: number; size: number } => Boolean(x))
    .sort((a, b) => b.mtime - a.mtime);

  if (corrupt.length > 0) {
    report.keptCorrupt = corrupt[0]!.name;
    for (const old of corrupt.slice(1)) {
      try {
        fs.unlinkSync(old.full);
        report.deleted.push(old.name);
        report.freedBytes += old.size;
      } catch (error) {
        report.errors.push(`${old.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  // 3) commissioning-mirror temps
  const mirrorDir = path.join(dataDir, "commissioning-mirror");
  if (fs.existsSync(mirrorDir)) {
    try {
      for (const name of fs.readdirSync(mirrorDir)) {
        if (!name.includes(".tmp-")) continue;
        const full = path.join(mirrorDir, name);
        try {
          const st = fs.statSync(full);
          fs.unlinkSync(full);
          report.deleted.push(`commissioning-mirror/${name}`);
          report.freedBytes += st.size;
        } catch (error) {
          report.errors.push(
            `commissioning-mirror/${name}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } catch (error) {
      report.errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  report.afterBytes = dirUsageBytes(dataDir);
  logger.warn(
    {
      freedBytes: report.freedBytes,
      deletedCount: report.deleted.length,
      keptCorrupt: report.keptCorrupt,
      beforeBytes: report.beforeBytes,
      afterBytes: report.afterBytes,
    },
    "Volume reclaim completed (temps/old quarantines only)",
  );
  return report;
}

export function getVolumeUsageSnapshot(): {
  dataDir: string | null;
  usedBytes: number | null;
  liveDbBytes: number | null;
} {
  const dataDir = resolveDataDir();
  if (!dataDir || !fs.existsSync(dataDir)) {
    return { dataDir, usedBytes: null, liveDbBytes: null };
  }
  const liveDb = path.resolve(process.env.DATABASE_PATH ?? env.DATABASE_PATH);
  let liveDbBytes: number | null = null;
  try {
    if (fs.existsSync(liveDb) && fs.statSync(liveDb).isFile()) {
      liveDbBytes = fs.statSync(liveDb).size;
    }
  } catch {
    liveDbBytes = null;
  }
  return { dataDir, usedBytes: dirUsageBytes(dataDir), liveDbBytes };
}
