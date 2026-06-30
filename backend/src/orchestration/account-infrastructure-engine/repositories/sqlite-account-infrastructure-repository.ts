import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { ExternalAccount } from "../models/account-provider.js";
import type { AccountHealth } from "../models/account-health.js";
import type { HumanActionItem } from "../models/human-action-queue.js";

export interface AccountInfrastructureRepository {
  saveAccount(account: ExternalAccount): ExternalAccount;
  getAccount(workspaceId: string, providerId: string, accountType?: string): ExternalAccount | null;
  listAccounts(workspaceId: string, accountType?: string): ExternalAccount[];
  saveHealth(health: AccountHealth): AccountHealth;
  getHealth(workspaceId: string, providerId: string): AccountHealth | null;
  saveHumanAction(action: HumanActionItem): HumanActionItem;
  listHumanActions(workspaceId: string, filters?: { status?: string; providerId?: string }): HumanActionItem[];
}

let repositoryInstance: SqliteAccountInfrastructureRepository | null = null;

export function getAccountInfrastructureRepository(): SqliteAccountInfrastructureRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteAccountInfrastructureRepository();
  }
  return repositoryInstance;
}

export function resetAccountInfrastructureRepository(): void {
  repositoryInstance = null;
}

function mapAccountRow(row: Record<string, unknown>): ExternalAccount {
  return JSON.parse(String(row.account_json)) as ExternalAccount;
}

function mapHealthRow(row: Record<string, unknown>): AccountHealth {
  return JSON.parse(String(row.health_json)) as AccountHealth;
}

function mapActionRow(row: Record<string, unknown>): HumanActionItem {
  return JSON.parse(String(row.action_json)) as HumanActionItem;
}

export class SqliteAccountInfrastructureRepository implements AccountInfrastructureRepository {
  saveAccount(account: ExternalAccount): ExternalAccount {
    const db = getDatabase();
    const record = { ...account, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO external_account_registry
        (provider_id, workspace_id, account_type, status, account_json, updated_at)
       VALUES
        (@providerId, @workspaceId, @accountType, @status, @accountJson, @updatedAt)
       ON CONFLICT(provider_id, workspace_id, account_type) DO UPDATE SET
         status = excluded.status,
         account_json = excluded.account_json,
         updated_at = excluded.updated_at`,
    ).run({
      providerId: record.providerId,
      workspaceId: record.workspaceId,
      accountType: record.accountType,
      status: record.connectionStatus,
      accountJson: JSON.stringify(record),
      updatedAt: record.updatedAt,
    });
    return record;
  }

  getAccount(workspaceId: string, providerId: string, accountType = "grand_king"): ExternalAccount | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT account_json FROM external_account_registry
         WHERE workspace_id = @workspaceId AND provider_id = @providerId AND account_type = @accountType`,
      )
      .get({ workspaceId, providerId, accountType });
    return row ? mapAccountRow(row as Record<string, unknown>) : null;
  }

  listAccounts(workspaceId: string, accountType = "grand_king"): ExternalAccount[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT account_json FROM external_account_registry
         WHERE workspace_id = @workspaceId AND account_type = @accountType`,
      )
      .all({ workspaceId, accountType });
    return (rows as Record<string, unknown>[]).map(mapAccountRow);
  }

  saveHealth(health: AccountHealth): AccountHealth {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO external_account_health
        (provider_id, workspace_id, health_json, computed_at)
       VALUES
        (@providerId, @workspaceId, @healthJson, @computedAt)
       ON CONFLICT(provider_id, workspace_id) DO UPDATE SET
         health_json = excluded.health_json,
         computed_at = excluded.computed_at`,
    ).run({
      providerId: health.providerId,
      workspaceId: health.workspaceId,
      healthJson: JSON.stringify(health),
      computedAt: health.computedAt,
    });
    return health;
  }

  getHealth(workspaceId: string, providerId: string): AccountHealth | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT health_json FROM external_account_health
         WHERE workspace_id = @workspaceId AND provider_id = @providerId`,
      )
      .get({ workspaceId, providerId });
    return row ? mapHealthRow(row as Record<string, unknown>) : null;
  }

  saveHumanAction(action: HumanActionItem): HumanActionItem {
    const db = getDatabase();
    const record = { ...action, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO human_action_queue
        (action_id, workspace_id, provider_id, status, action_json, updated_at)
       VALUES
        (@actionId, @workspaceId, @providerId, @status, @actionJson, @updatedAt)
       ON CONFLICT(action_id) DO UPDATE SET
         status = excluded.status,
         action_json = excluded.action_json,
         updated_at = excluded.updated_at`,
    ).run({
      actionId: record.actionId,
      workspaceId: record.workspaceId,
      providerId: record.providerId,
      status: record.status,
      actionJson: JSON.stringify(record),
      updatedAt: record.updatedAt,
    });
    return record;
  }

  listHumanActions(
    workspaceId: string,
    filters?: { status?: string; providerId?: string },
  ): HumanActionItem[] {
    const db = getDatabase();
    let query = `SELECT action_json FROM human_action_queue WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };
    if (filters?.status) {
      query += ` AND status = @status`;
      params.status = filters.status;
    }
    if (filters?.providerId) {
      query += ` AND provider_id = @providerId`;
      params.providerId = filters.providerId;
    }
    query += ` ORDER BY updated_at DESC`;
    const rows = db.prepare(query).all(params);
    return (rows as Record<string, unknown>[]).map(mapActionRow);
  }
}

export function createHumanActionItem(
  input: Omit<HumanActionItem, "actionId" | "createdAt" | "updatedAt"> & { actionId?: string },
): HumanActionItem {
  const timestamp = new Date().toISOString();
  return {
    actionId: input.actionId ?? `action:${randomUUID()}`,
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
