import { getDatabase } from "../../../brain/database.js";
import type { MarketplaceId } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import type { MarketplaceAccountType, MarketplaceConnectionRecord } from "../models/marketplace-connection-record.js";

export interface MarketplaceConnectionRepository {
  saveRecord(record: MarketplaceConnectionRecord): MarketplaceConnectionRecord;
  getRecord(
    workspaceId: string,
    marketplaceId: MarketplaceId,
    accountType: MarketplaceAccountType,
  ): MarketplaceConnectionRecord | null;
  listRecords(workspaceId: string, accountType?: MarketplaceAccountType): MarketplaceConnectionRecord[];
}

let repositoryInstance: SqliteMarketplaceConnectionRepository | null = null;

export function getMarketplaceConnectionEngineRepository(): SqliteMarketplaceConnectionRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteMarketplaceConnectionRepository();
  }
  return repositoryInstance;
}

export function resetMarketplaceConnectionEngineRepository(): void {
  repositoryInstance = null;
}

function mapRow(row: Record<string, unknown>): MarketplaceConnectionRecord {
  return JSON.parse(String(row.record_json)) as MarketplaceConnectionRecord;
}

export class SqliteMarketplaceConnectionRepository implements MarketplaceConnectionRepository {
  saveRecord(record: MarketplaceConnectionRecord): MarketplaceConnectionRecord {
    const db = getDatabase();
    const saved = { ...record, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO marketplace_connection_registry
        (marketplace_id, workspace_id, account_type, status, record_json, updated_at)
       VALUES
        (@marketplaceId, @workspaceId, @accountType, @status, @recordJson, @updatedAt)
       ON CONFLICT(marketplace_id, workspace_id, account_type) DO UPDATE SET
         status = excluded.status,
         record_json = excluded.record_json,
         updated_at = excluded.updated_at`,
    ).run({
      marketplaceId: saved.marketplaceId,
      workspaceId: saved.workspaceId,
      accountType: saved.accountType,
      status: saved.connectionStatus,
      recordJson: JSON.stringify(saved),
      updatedAt: saved.updatedAt,
    });
    return saved;
  }

  getRecord(
    workspaceId: string,
    marketplaceId: MarketplaceId,
    accountType: MarketplaceAccountType = "GRAND_KING",
  ): MarketplaceConnectionRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM marketplace_connection_registry
         WHERE workspace_id = @workspaceId AND marketplace_id = @marketplaceId AND account_type = @accountType`,
      )
      .get({ workspaceId, marketplaceId, accountType });
    return row ? mapRow(row as Record<string, unknown>) : null;
  }

  listRecords(workspaceId: string, accountType?: MarketplaceAccountType): MarketplaceConnectionRecord[] {
    const db = getDatabase();
    let query = `SELECT record_json FROM marketplace_connection_registry WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };
    if (accountType) {
      query += ` AND account_type = @accountType`;
      params.accountType = accountType;
    }
    const rows = db.prepare(query).all(params);
    return (rows as Record<string, unknown>[]).map(mapRow);
  }
}
