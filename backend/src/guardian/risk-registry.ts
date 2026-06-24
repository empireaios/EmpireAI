import { randomUUID } from "node:crypto";
import { getDatabase } from "../brain/database.js";
import type { RiskRecord, RiskSeverity } from "./types.js";

export class RiskRegistry {
  record(input: {
    severity: RiskSeverity;
    subsystem: RiskRecord["subsystem"];
    code: string;
    message: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
  }): RiskRecord {
    const db = getDatabase();
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO guardian_risks
        (id, severity, subsystem, code, message, correlation_id, metadata, created_at)
       VALUES (@id, @severity, @subsystem, @code, @message, @correlationId, @metadata, @createdAt)`,
    ).run({
      id,
      severity: input.severity,
      subsystem: input.subsystem,
      code: input.code,
      message: input.message,
      correlationId: input.correlationId ?? null,
      metadata: JSON.stringify(input.metadata ?? {}),
      createdAt,
    });

    return {
      id,
      severity: input.severity,
      subsystem: input.subsystem,
      code: input.code,
      message: input.message,
      correlationId: input.correlationId,
      metadata: input.metadata ?? {},
      createdAt,
    };
  }

  listOpen(limit = 50): RiskRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM guardian_risks
         WHERE resolved_at IS NULL
         ORDER BY created_at DESC
         LIMIT @limit`,
      )
      .all({ limit }) as DbRiskRow[];

    return rows.map(mapRiskRow);
  }

  countOpen(): number {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT COUNT(*) as count FROM guardian_risks WHERE resolved_at IS NULL`)
      .get() as { count: number };
    return row.count;
  }

  resolve(riskId: string): boolean {
    const db = getDatabase();
    const result = db
      .prepare(
        `UPDATE guardian_risks SET resolved_at = @resolvedAt WHERE id = @id AND resolved_at IS NULL`,
      )
      .run({ id: riskId, resolvedAt: new Date().toISOString() });

    return result.changes > 0;
  }
}

type DbRiskRow = {
  id: string;
  severity: RiskSeverity;
  subsystem: RiskRecord["subsystem"];
  code: string;
  message: string;
  correlation_id: string | null;
  metadata: string;
  created_at: string;
  resolved_at: string | null;
};

function mapRiskRow(row: DbRiskRow): RiskRecord {
  return {
    id: row.id,
    severity: row.severity,
    subsystem: row.subsystem,
    code: row.code,
    message: row.message,
    correlationId: row.correlation_id ?? undefined,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? undefined,
  };
}
