import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { CanvaOAuthConnection, CanvaOAuthPending } from "../models/canva-records.js";
import type { CanvaRepository } from "./canva-repository.js";

function nowIso(): string {
  return new Date().toISOString();
}

function mapPending(row: Record<string, unknown>): CanvaOAuthPending {
  return {
    pendingId: String(row.pending_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    state: String(row.state),
    codeVerifierEncrypted: String(row.code_verifier_encrypted),
    createdAt: String(row.created_at),
    expiresAt: String(row.expires_at),
  };
}

function mapConnection(row: Record<string, unknown>): CanvaOAuthConnection {
  return {
    connectionId: String(row.connection_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    credentialsRef: String(row.credentials_ref),
    scopes: JSON.parse(String(row.scopes_json)) as string[],
    mock: Boolean(row.mock),
    revoked: Boolean(row.revoked),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

let repositoryInstance: SqliteCanvaRepository | null = null;

export function getCanvaRepository(): SqliteCanvaRepository {
  if (!repositoryInstance) repositoryInstance = new SqliteCanvaRepository();
  return repositoryInstance;
}

export function resetCanvaRepository(): void {
  repositoryInstance = null;
}

export class SqliteCanvaRepository implements CanvaRepository {
  savePending(pending: CanvaOAuthPending): CanvaOAuthPending {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO canva_oauth_pending
        (pending_id, workspace_id, company_id, state, code_verifier_encrypted, created_at, expires_at)
       VALUES
        (@pendingId, @workspaceId, @companyId, @state, @codeVerifierEncrypted, @createdAt, @expiresAt)`,
    ).run({
      pendingId: pending.pendingId,
      workspaceId: pending.workspaceId,
      companyId: pending.companyId,
      state: pending.state,
      codeVerifierEncrypted: pending.codeVerifierEncrypted,
      createdAt: pending.createdAt,
      expiresAt: pending.expiresAt,
    });
    return pending;
  }

  getPendingByState(state: string): CanvaOAuthPending | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM canva_oauth_pending WHERE state = @state`)
      .get({ state }) as Record<string, unknown> | undefined;
    return row ? mapPending(row) : null;
  }

  deletePending(pendingId: string): void {
    const db = getDatabase();
    db.prepare(`DELETE FROM canva_oauth_pending WHERE pending_id = @pendingId`).run({ pendingId });
  }

  purgeExpiredPending(): void {
    const db = getDatabase();
    db.prepare(`DELETE FROM canva_oauth_pending WHERE expires_at < @now`).run({ now: nowIso() });
  }

  saveConnection(connection: CanvaOAuthConnection): CanvaOAuthConnection {
    const db = getDatabase();
    const existing = this.getConnection(connection.workspaceId, connection.companyId);
    if (existing) {
      db.prepare(
        `UPDATE canva_oauth_connections SET
          credentials_ref = @credentialsRef,
          scopes_json = @scopesJson,
          mock = @mock,
          revoked = @revoked,
          updated_at = @updatedAt
         WHERE connection_id = @connectionId`,
      ).run({
        connectionId: existing.connectionId,
        credentialsRef: connection.credentialsRef,
        scopesJson: JSON.stringify(connection.scopes),
        mock: connection.mock ? 1 : 0,
        revoked: connection.revoked ? 1 : 0,
        updatedAt: connection.updatedAt,
      });
      return { ...connection, connectionId: existing.connectionId };
    }

    db.prepare(
      `INSERT INTO canva_oauth_connections
        (connection_id, workspace_id, company_id, credentials_ref, scopes_json, mock, revoked, created_at, updated_at)
       VALUES
        (@connectionId, @workspaceId, @companyId, @credentialsRef, @scopesJson, @mock, @revoked, @createdAt, @updatedAt)`,
    ).run({
      connectionId: connection.connectionId,
      workspaceId: connection.workspaceId,
      companyId: connection.companyId,
      credentialsRef: connection.credentialsRef,
      scopesJson: JSON.stringify(connection.scopes),
      mock: connection.mock ? 1 : 0,
      revoked: connection.revoked ? 1 : 0,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    });
    return connection;
  }

  getConnection(workspaceId: string, companyId: string): CanvaOAuthConnection | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM canva_oauth_connections
         WHERE workspace_id = @workspaceId AND company_id = @companyId AND revoked = 0`,
      )
      .get({ workspaceId, companyId }) as Record<string, unknown> | undefined;
    return row ? mapConnection(row) : null;
  }

  revokeConnection(workspaceId: string, companyId: string): void {
    const db = getDatabase();
    db.prepare(
      `UPDATE canva_oauth_connections SET revoked = 1, updated_at = @updatedAt
       WHERE workspace_id = @workspaceId AND company_id = @companyId`,
    ).run({ workspaceId, companyId, updatedAt: nowIso() });
  }
}

export function createCanvaOAuthConnection(
  input: Omit<CanvaOAuthConnection, "connectionId" | "createdAt" | "updatedAt" | "revoked"> & {
    connectionId?: string;
  },
): CanvaOAuthConnection {
  const timestamp = nowIso();
  return {
    connectionId: input.connectionId ?? randomUUID(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    credentialsRef: input.credentialsRef,
    scopes: input.scopes,
    mock: input.mock,
    revoked: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createCanvaOAuthPending(
  input: Omit<CanvaOAuthPending, "pendingId" | "createdAt" | "expiresAt"> & {
    pendingId?: string;
    ttlMinutes?: number;
  },
): CanvaOAuthPending {
  const createdAt = nowIso();
  const ttl = input.ttlMinutes ?? 10;
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();
  return {
    pendingId: input.pendingId ?? randomUUID(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    state: input.state,
    codeVerifierEncrypted: input.codeVerifierEncrypted,
    createdAt,
    expiresAt,
  };
}
