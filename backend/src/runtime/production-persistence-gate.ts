/**
 * Production persistence verifier — fail closed when Railway volume path is wrong.
 * Prevents silent ephemeral DB at /app after redeploy (data loss + config drift).
 */
import fs from "node:fs";
import path from "node:path";
import { logger } from "../config/logger.js";

export type PersistenceVerification = {
  ok: boolean;
  databasePath: string;
  onPersistentVolume: boolean;
  writable: boolean;
  blockers: string[];
};

export function verifyProductionPersistence(options?: {
  databasePath?: string;
  requireVolume?: boolean;
  railwayDetected?: boolean;
}): PersistenceVerification {
  const rawPath =
    options?.databasePath ?? process.env.DATABASE_PATH ?? "./data/empireai-brain.db";
  const databasePath = path.resolve(rawPath);
  const railwayDetected =
    options?.railwayDetected ??
    Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_NAME);
  const requireVolume =
    options?.requireVolume ??
    (railwayDetected && process.env.EMPIRE_REQUIRE_DATA_VOLUME !== "false");

  const blockers: string[] = [];
  const normalizedRaw = rawPath.replace(/\\/g, "/");
  const onPersistentVolume =
    normalizedRaw === "/data/empireai-brain.db" ||
    normalizedRaw.startsWith("/data/") ||
    databasePath.replace(/\\/g, "/").includes("/data/empireai-brain.db");

  if (requireVolume && !onPersistentVolume) {
    blockers.push(
      `DATABASE_PATH must be on persistent volume (/data/...) in production; got ${databasePath}`,
    );
  }

  let writable = false;
  try {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    const probe = `${databasePath}.write-probe-${process.pid}`;
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
    writable = true;
  } catch (error) {
    blockers.push(
      `DATABASE_PATH not writable: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const result: PersistenceVerification = {
    ok: blockers.length === 0,
    databasePath,
    onPersistentVolume,
    writable,
    blockers,
  };

  if (!result.ok) {
    logger.error(result, "Production persistence verification failed");
  } else if (railwayDetected) {
    logger.info(
      { databasePath, onPersistentVolume, writable },
      "Production persistence verification passed",
    );
  }

  return result;
}

/** Soft gate: log + optional hard exit when EMPIRE_PERSISTENCE_GATE=strict */
export function enforceProductionPersistenceGate(): PersistenceVerification {
  const verification = verifyProductionPersistence();
  const strict =
    (process.env.EMPIRE_PERSISTENCE_GATE ?? "strict").toLowerCase() === "strict";
  const railway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_NAME);
  if (!verification.ok && strict && railway) {
    throw new Error(
      `Persistence gate failed: ${verification.blockers.join("; ")}`,
    );
  }
  return verification;
}
