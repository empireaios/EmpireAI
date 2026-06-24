import { randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import type { IntegrationRecord, WorkspaceRecord } from "../types.js";

export class WorkspaceRepository {
  getById(id: string): WorkspaceRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM workspaces WHERE id = @id`)
      .get({ id }) as
      | { id: string; name: string; plan: string; created_at: string }
      | undefined;

    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      plan: row.plan,
      createdAt: row.created_at,
    };
  }

  ensure(input: { id: string; name: string; plan?: string }): WorkspaceRecord {
    const existing = this.getById(input.id);
    if (existing) return existing;

    const db = getDatabase();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO workspaces (id, name, plan, created_at) VALUES (@id, @name, @plan, @createdAt)`,
    ).run({
      id: input.id,
      name: input.name,
      plan: input.plan ?? "Sovereign",
      createdAt,
    });

    return { id: input.id, name: input.name, plan: input.plan ?? "Sovereign", createdAt };
  }

  listIntegrations(workspaceId: string): IntegrationRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT * FROM workspace_integrations WHERE workspace_id = @workspaceId ORDER BY name ASC`)
      .all({ workspaceId }) as Array<{
      id: string;
      workspace_id: string;
      name: string;
      status: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      status: row.status,
    }));
  }

  addIntegration(input: Omit<IntegrationRecord, "id"> & { id?: string }): IntegrationRecord {
    const db = getDatabase();
    const id = input.id ?? randomUUID();

    if (input.id) {
      const existing = db
        .prepare(`SELECT id FROM workspace_integrations WHERE id = @id`)
        .get({ id: input.id }) as { id: string } | undefined;
      if (existing) {
        return { ...input, id: input.id };
      }
    }

    db.prepare(
      `INSERT INTO workspace_integrations (id, workspace_id, name, status)
       VALUES (@id, @workspaceId, @name, @status)
       ON CONFLICT(id) DO NOTHING`,
    ).run({
      id,
      workspaceId: input.workspaceId,
      name: input.name,
      status: input.status,
    });
    return { ...input, id };
  }
}
