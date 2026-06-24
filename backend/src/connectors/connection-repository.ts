import { randomUUID } from "node:crypto";
import { getDatabase } from "../brain/database.js";
import type { ConnectorConnectionRecord, ConnectorStatus, ConnectorCategory } from "./types.js";

export class ConnectorConnectionRepository {
  listByWorkspace(workspaceId: string): ConnectorConnectionRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT * FROM connector_connections WHERE workspace_id = @workspaceId`)
      .all({ workspaceId }) as Array<{
      id: string;
      workspace_id: string;
      connector_id: string;
      category: string;
      status: string;
      credentials_ref: string | null;
      metadata: string;
      connected_at: string | null;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      connectorId: row.connector_id,
      category: row.category as ConnectorCategory,
      status: row.status as ConnectorStatus,
      credentialsRef: row.credentials_ref,
      metadata: JSON.parse(row.metadata) as Record<string, unknown>,
      connectedAt: row.connected_at,
      updatedAt: row.updated_at,
    }));
  }

  upsert(input: {
    workspaceId: string;
    connectorId: string;
    category: ConnectorCategory;
    status: ConnectorStatus;
    credentialsRef?: string | null;
    metadata?: Record<string, unknown>;
  }): ConnectorConnectionRecord {
    const db = getDatabase();
    const now = new Date().toISOString();
    const existing = db
      .prepare(
        `SELECT id FROM connector_connections WHERE workspace_id = @workspaceId AND connector_id = @connectorId`,
      )
      .get({ workspaceId: input.workspaceId, connectorId: input.connectorId }) as
      | { id: string }
      | undefined;

    if (existing) {
      db.prepare(
        `UPDATE connector_connections SET status = @status, credentials_ref = @credentialsRef,
         metadata = @metadata, updated_at = @updatedAt WHERE id = @id`,
      ).run({
        id: existing.id,
        status: input.status,
        credentialsRef: input.credentialsRef ?? null,
        metadata: JSON.stringify(input.metadata ?? {}),
        updatedAt: now,
      });
      return this.listByWorkspace(input.workspaceId).find((c) => c.id === existing.id)!;
    }

    const id = randomUUID();
    db.prepare(
      `INSERT INTO connector_connections
        (id, workspace_id, connector_id, category, status, credentials_ref, metadata, connected_at, updated_at)
       VALUES (@id, @workspaceId, @connectorId, @category, @status, @credentialsRef, @metadata, @connectedAt, @updatedAt)`,
    ).run({
      id,
      workspaceId: input.workspaceId,
      connectorId: input.connectorId,
      category: input.category,
      status: input.status,
      credentialsRef: input.credentialsRef ?? null,
      metadata: JSON.stringify(input.metadata ?? {}),
      connectedAt: input.status === "connected" ? now : null,
      updatedAt: now,
    });

    return {
      id,
      workspaceId: input.workspaceId,
      connectorId: input.connectorId,
      category: input.category,
      status: input.status,
      credentialsRef: input.credentialsRef ?? null,
      metadata: input.metadata ?? {},
      connectedAt: input.status === "connected" ? now : null,
      updatedAt: now,
    };
  }
}
