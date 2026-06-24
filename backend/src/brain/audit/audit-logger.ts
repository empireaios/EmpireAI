import { randomUUID } from "node:crypto";
import { getDatabase } from "../database.js";
import type { AuditAction, AuditLogEntry } from "../types.js";

export class AuditLogger {
  write(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
    const record: AuditLogEntry = {
      ...entry,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const db = getDatabase();
    db.prepare(
      `INSERT INTO audit_logs
        (id, action, actor, workspace_id, company_id, agent_id, correlation_id, metadata, created_at)
       VALUES (@id, @action, @actor, @workspaceId, @companyId, @agentId, @correlationId, @metadata, @timestamp)`,
    ).run({
      id: record.id,
      action: record.action,
      actor: record.actor,
      workspaceId: record.workspaceId,
      companyId: record.companyId ?? null,
      agentId: record.agentId ?? null,
      correlationId: record.correlationId,
      metadata: JSON.stringify(record.metadata),
      timestamp: record.timestamp,
    });

    return record;
  }

  query(filters: {
    workspaceId: string;
    correlationId?: string;
    action?: AuditAction;
    limit?: number;
  }): AuditLogEntry[] {
    const db = getDatabase();
    const limit = filters.limit ?? 100;

    let sql = `SELECT * FROM audit_logs WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId: filters.workspaceId, limit };

    if (filters.correlationId) {
      sql += ` AND correlation_id = @correlationId`;
      params.correlationId = filters.correlationId;
    }
    if (filters.action) {
      sql += ` AND action = @action`;
      params.action = filters.action;
    }

    sql += ` ORDER BY created_at DESC LIMIT @limit`;

    const rows = db.prepare(sql).all(params) as Array<{
      id: string;
      action: AuditAction;
      actor: string;
      workspace_id: string;
      company_id: string | null;
      agent_id: string | null;
      correlation_id: string;
      metadata: string;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      actor: row.actor,
      workspaceId: row.workspace_id,
      companyId: row.company_id ?? undefined,
      agentId: row.agent_id ?? undefined,
      correlationId: row.correlation_id,
      metadata: JSON.parse(row.metadata) as Record<string, unknown>,
      timestamp: row.created_at,
    }));
  }
}
