/**
 * Write-ahead durability mirror for one-product commissioning.
 *
 * Authoritative SoT remains the SQLite row in pillow_one_product_commissioning.
 * sql.js only flushes to disk on a deferred schedule (default first flush = 10 min),
 * so a Railway restart / watchdog exit before flush used to return oneProduct=null.
 *
 * This mirror writes a small JSON file beside DATABASE_PATH on every persist
 * (async fs — not a full db.export). On read miss, the mirror restores into SQLite.
 */

import fs from "node:fs";
import path from "node:path";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { isInMemoryDatabasePath } from "../../brain/sqlite-database.js";
import type { OneProductCommissioningRecord } from "./one-product-commissioning.js";

function resolveMirrorDir(): string | null {
  const raw = process.env.DATABASE_PATH ?? env.DATABASE_PATH;
  if (!raw || isInMemoryDatabasePath(raw)) {
    return null;
  }
  let resolved = path.resolve(raw);
  try {
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      resolved = path.join(resolved, "empireai-brain.db");
    }
  } catch {
    // best-effort
  }
  return path.join(path.dirname(resolved), "commissioning-mirror");
}

function mirrorPath(workspaceId: string): string | null {
  const dir = resolveMirrorDir();
  if (!dir) return null;
  const safe = workspaceId.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(dir, `${safe}.json`);
}

export function writeCommissioningDurabilityMirror(
  record: OneProductCommissioningRecord,
): void {
  const file = mirrorPath(record.workspaceId);
  if (!file) return;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp-${process.pid}`;
    fs.writeFileSync(
      tmp,
      JSON.stringify(
        {
          schema: "CQ12-COMMISSIONING-MIRROR-001",
          writtenAt: new Date().toISOString(),
          record,
        },
        null,
        0,
      ),
      "utf8",
    );
    fs.renameSync(tmp, file);
  } catch (error) {
    logger.warn(
      {
        workspaceId: record.workspaceId,
        error: error instanceof Error ? error.message : String(error),
      },
      "Commissioning durability mirror write failed",
    );
  }
}

export function readCommissioningDurabilityMirror(
  workspaceId: string,
): OneProductCommissioningRecord | null {
  const file = mirrorPath(workspaceId);
  if (!file || !fs.existsSync(file)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as {
      record?: OneProductCommissioningRecord;
    };
    const record = parsed.record;
    if (!record || record.workspaceId !== workspaceId) return null;
    if (record.selectionAuthority !== "pillow" || record.cursorSelected !== false) {
      return null;
    }
    return record;
  } catch (error) {
    logger.warn(
      {
        workspaceId,
        error: error instanceof Error ? error.message : String(error),
      },
      "Commissioning durability mirror read failed",
    );
    return null;
  }
}
