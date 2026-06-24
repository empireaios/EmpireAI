import { randomUUID } from "node:crypto";
import { getDatabase } from "../database.js";
import type { MemoryRecord, MemoryScope } from "../types.js";

export type MemoryQuery = {
  scope: MemoryScope;
  workspaceId: string;
  companyId?: string;
  agentId?: string;
  key?: string;
  prefix?: string;
};

export class MemoryStore {
  upsert(input: {
    scope: MemoryScope;
    workspaceId: string;
    companyId?: string;
    agentId?: string;
    key: string;
    value: unknown;
    ttlSeconds?: number;
  }): MemoryRecord {
    const now = new Date().toISOString();
    const expiresAt = input.ttlSeconds
      ? new Date(Date.now() + input.ttlSeconds * 1000).toISOString()
      : undefined;

    const existing = this.get({
      scope: input.scope,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      agentId: input.agentId,
      key: input.key,
    });

    const record: MemoryRecord = {
      id: existing?.id ?? randomUUID(),
      scope: input.scope,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      agentId: input.agentId,
      key: input.key,
      value: input.value,
      expiresAt,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const db = getDatabase();
    db.prepare(
      `INSERT INTO memory_records
        (id, scope, workspace_id, company_id, agent_id, memory_key, value, expires_at, created_at, updated_at)
       VALUES
        (@id, @scope, @workspaceId, @companyId, @agentId, @key, @value, @expiresAt, @createdAt, @updatedAt)
       ON CONFLICT(scope, workspace_id, company_id, agent_id, memory_key)
       DO UPDATE SET
        value = excluded.value,
        expires_at = excluded.expires_at,
        updated_at = excluded.updated_at`,
    ).run({
      id: record.id,
      scope: record.scope,
      workspaceId: record.workspaceId,
      companyId: record.companyId ?? null,
      agentId: record.agentId ?? null,
      key: record.key,
      value: JSON.stringify(record.value),
      expiresAt: record.expiresAt ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    return record;
  }

  get(query: MemoryQuery): MemoryRecord | null {
    this.purgeExpired();

    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM memory_records
         WHERE scope = @scope
           AND workspace_id = @workspaceId
           AND (company_id IS @companyId OR (@companyId IS NULL AND company_id IS NULL))
           AND (agent_id IS @agentId OR (@agentId IS NULL AND agent_id IS NULL))
           AND memory_key = @key
         LIMIT 1`,
      )
      .get({
        scope: query.scope,
        workspaceId: query.workspaceId,
        companyId: query.companyId ?? null,
        agentId: query.agentId ?? null,
        key: query.key ?? "",
      }) as DbRow | undefined;

    return row ? mapRow(row) : null;
  }

  list(query: Omit<MemoryQuery, "key">): MemoryRecord[] {
    this.purgeExpired();

    const db = getDatabase();
    let sql = `SELECT * FROM memory_records
      WHERE scope = @scope AND workspace_id = @workspaceId`;
    const params: Record<string, unknown> = {
      scope: query.scope,
      workspaceId: query.workspaceId,
    };

    if (query.companyId) {
      sql += ` AND company_id = @companyId`;
      params.companyId = query.companyId;
    }
    if (query.agentId) {
      sql += ` AND agent_id = @agentId`;
      params.agentId = query.agentId;
    }
    if (query.prefix) {
      sql += ` AND memory_key LIKE @prefix`;
      params.prefix = `${query.prefix}%`;
    }

    sql += ` ORDER BY updated_at DESC`;

    const rows = db.prepare(sql).all(params) as DbRow[];
    return rows.map(mapRow);
  }

  delete(query: MemoryQuery): boolean {
    const db = getDatabase();
    const result = db
      .prepare(
        `DELETE FROM memory_records
         WHERE scope = @scope
           AND workspace_id = @workspaceId
           AND (company_id IS @companyId OR (@companyId IS NULL AND company_id IS NULL))
           AND (agent_id IS @agentId OR (@agentId IS NULL AND agent_id IS NULL))
           AND memory_key = @key`,
      )
      .run({
        scope: query.scope,
        workspaceId: query.workspaceId,
        companyId: query.companyId ?? null,
        agentId: query.agentId ?? null,
        key: query.key ?? "",
      });

    return result.changes > 0;
  }

  private purgeExpired(): void {
    const db = getDatabase();
    db.prepare(
      `DELETE FROM memory_records WHERE expires_at IS NOT NULL AND expires_at < @now`,
    ).run({ now: new Date().toISOString() });
  }
}

type DbRow = {
  id: string;
  scope: MemoryScope;
  workspace_id: string;
  company_id: string | null;
  agent_id: string | null;
  memory_key: string;
  value: string;
  embedding: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: DbRow): MemoryRecord {
  return {
    id: row.id,
    scope: row.scope,
    workspaceId: row.workspace_id,
    companyId: row.company_id ?? undefined,
    agentId: row.agent_id ?? undefined,
    key: row.memory_key,
    value: JSON.parse(row.value) as unknown,
    embedding: row.embedding ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
