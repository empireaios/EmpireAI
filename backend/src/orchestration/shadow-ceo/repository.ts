/**
 * Deterministic file-backed SQLite repository for Shadow CEO control plane.
 * Uses EmpireDatabase (sql.js) — same durability surface as other orchestration stores.
 */

import fs from "node:fs";
import path from "node:path";

import { EmpireDatabase } from "../../brain/sqlite-database.js";
import type { ShadowCeoRecord, ShadowCeoRecordKind } from "./types.js";

const TABLE = "shadow_ceo_records";

export type ShadowCeoRepositoryOptions = {
  /** File path or :memory:… — when omitted, uses a default under cwd/.data */
  dbPath?: string;
};

function defaultDbPath(): string {
  const dataRoot =
    process.env.SHADOW_CEO_DATA_DIR ||
    process.env.EMPIRE_DATA_DIR ||
    path.resolve(process.cwd(), ".data");
  return path.join(dataRoot, "shadow-ceo.db");
}

export function ensureShadowCeoTables(db: EmpireDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      objective_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_shadow_ceo_idempotency
      ON ${TABLE}(kind, idempotency_key);
    CREATE INDEX IF NOT EXISTS idx_shadow_ceo_objective
      ON ${TABLE}(objective_id, kind, created_at);
  `);
}

export class SqliteShadowCeoRepository {
  readonly dbPath: string;
  private readonly db: EmpireDatabase;
  private closed = false;

  constructor(options: ShadowCeoRepositoryOptions = {}) {
    this.dbPath = options.dbPath ?? defaultDbPath();
    if (!this.dbPath.startsWith(":memory:")) {
      fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    }
    this.db = new EmpireDatabase(this.dbPath);
    ensureShadowCeoTables(this.db);
  }

  /** Flush durable state to disk (no-op for in-memory). */
  persist(): void {
    this.assertOpen();
    this.db.requestCriticalPersist();
  }

  close(): void {
    if (this.closed) return;
    this.db.close();
    this.closed = true;
  }

  /**
   * Upsert by (kind, idempotencyKey). Same key returns the existing durable row
   * without creating a duplicate — restart-safe when replaying with same keys.
   */
  upsert<T extends ShadowCeoRecord>(record: T): T {
    this.assertOpen();
    const existing = this.getByIdempotencyKey(record.kind, record.idempotencyKey);
    if (existing) {
      return existing as T;
    }

    this.db
      .prepare(
        `INSERT INTO ${TABLE}
          (id, kind, objective_id, idempotency_key, record_json, created_at, updated_at)
         VALUES
          (@id, @kind, @objectiveId, @idempotencyKey, @recordJson, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           record_json = excluded.record_json,
           updated_at = excluded.updated_at`,
      )
      .run({
        id: record.id,
        kind: record.kind,
        objectiveId: record.objectiveId,
        idempotencyKey: record.idempotencyKey,
        recordJson: JSON.stringify(record),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      });

    this.persist();
    return record;
  }

  /**
   * Replace an existing record by id (for status transitions).
   * Does not create new rows under a different idempotency key.
   */
  save<T extends ShadowCeoRecord>(record: T): T {
    this.assertOpen();
    this.db
      .prepare(
        `INSERT INTO ${TABLE}
          (id, kind, objective_id, idempotency_key, record_json, created_at, updated_at)
         VALUES
          (@id, @kind, @objectiveId, @idempotencyKey, @recordJson, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           kind = excluded.kind,
           objective_id = excluded.objective_id,
           idempotency_key = excluded.idempotency_key,
           record_json = excluded.record_json,
           updated_at = excluded.updated_at`,
      )
      .run({
        id: record.id,
        kind: record.kind,
        objectiveId: record.objectiveId,
        idempotencyKey: record.idempotencyKey,
        recordJson: JSON.stringify(record),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      });
    this.persist();
    return record;
  }

  getById(id: string): ShadowCeoRecord | null {
    this.assertOpen();
    const row = this.db
      .prepare(`SELECT record_json FROM ${TABLE} WHERE id = @id`)
      .get({ id }) as { record_json: string } | undefined;
    return row ? (JSON.parse(row.record_json) as ShadowCeoRecord) : null;
  }

  getByIdempotencyKey(
    kind: ShadowCeoRecordKind,
    idempotencyKey: string,
  ): ShadowCeoRecord | null {
    this.assertOpen();
    const row = this.db
      .prepare(
        `SELECT record_json FROM ${TABLE}
         WHERE kind = @kind AND idempotency_key = @idempotencyKey
         LIMIT 1`,
      )
      .get({ kind, idempotencyKey }) as { record_json: string } | undefined;
    return row ? (JSON.parse(row.record_json) as ShadowCeoRecord) : null;
  }

  listByObjective(objectiveId: string): ShadowCeoRecord[] {
    this.assertOpen();
    const rows = this.db
      .prepare(
        `SELECT record_json FROM ${TABLE}
         WHERE objective_id = @objectiveId
         ORDER BY created_at ASC, id ASC`,
      )
      .all({ objectiveId }) as Array<{ record_json: string }>;
    return rows.map((r) => JSON.parse(r.record_json) as ShadowCeoRecord);
  }

  listByObjectiveAndKind<K extends ShadowCeoRecordKind>(
    objectiveId: string,
    kind: K,
  ): Extract<ShadowCeoRecord, { kind: K }>[] {
    this.assertOpen();
    const rows = this.db
      .prepare(
        `SELECT record_json FROM ${TABLE}
         WHERE objective_id = @objectiveId AND kind = @kind
         ORDER BY created_at ASC, id ASC`,
      )
      .all({ objectiveId, kind }) as Array<{ record_json: string }>;
    return rows.map(
      (r) => JSON.parse(r.record_json) as Extract<ShadowCeoRecord, { kind: K }>,
    );
  }

  countByObjective(objectiveId: string): number {
    this.assertOpen();
    const row = this.db
      .prepare(
        `SELECT COUNT(*) AS n FROM ${TABLE} WHERE objective_id = @objectiveId`,
      )
      .get({ objectiveId }) as { n: number } | undefined;
    return Number(row?.n ?? 0);
  }

  /** Most recent objective records for cockpit parity / episode listing. */
  listRecentObjectives(limit = 20): Extract<ShadowCeoRecord, { kind: "objective" }>[] {
    this.assertOpen();
    const rows = this.db
      .prepare(
        `SELECT record_json FROM ${TABLE}
         WHERE kind = 'objective'
         ORDER BY created_at DESC, id DESC
         LIMIT @limit`,
      )
      .all({ limit }) as Array<{ record_json: string }>;
    return rows.map(
      (r) =>
        JSON.parse(r.record_json) as Extract<ShadowCeoRecord, { kind: "objective" }>,
    );
  }

  private assertOpen(): void {
    if (this.closed) {
      throw new Error("SqliteShadowCeoRepository is closed");
    }
  }
}

/** Re-open a repository at the same path after close — for restart-safety tests. */
export function openShadowCeoRepository(
  options: ShadowCeoRepositoryOptions = {},
): SqliteShadowCeoRepository {
  return new SqliteShadowCeoRepository(options);
}
