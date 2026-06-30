import { getDatabase } from "../../../brain/database.js";
import type {
  ApprovalHistoryEntry,
  BusinessOpportunityRecord,
} from "../models/business-opportunity.js";

let repositoryInstance: SqliteBusinessOpportunityRepository | null = null;

export function getBusinessOpportunityRepository(): SqliteBusinessOpportunityRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteBusinessOpportunityRepository();
  }
  return repositoryInstance;
}

export function resetBusinessOpportunityRepository(): void {
  repositoryInstance = null;
}

function mapOpportunityRow(row: Record<string, unknown>): BusinessOpportunityRecord {
  return JSON.parse(String(row.record_json)) as BusinessOpportunityRecord;
}

function mapHistoryRow(row: Record<string, unknown>): ApprovalHistoryEntry {
  return JSON.parse(String(row.history_json)) as ApprovalHistoryEntry;
}

export class SqliteBusinessOpportunityRepository {
  saveOpportunity(record: BusinessOpportunityRecord): BusinessOpportunityRecord {
    const db = getDatabase();
    const updated = { ...record, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO business_opportunity_workspace
        (business_opportunity_id, workspace_id, company_id, status, record_json, updated_at)
       VALUES
        (@businessOpportunityId, @workspaceId, @companyId, @status, @recordJson, @updatedAt)
       ON CONFLICT(business_opportunity_id) DO UPDATE SET
         status = excluded.status,
         record_json = excluded.record_json,
         updated_at = excluded.updated_at`,
    ).run({
      businessOpportunityId: updated.businessOpportunityId,
      workspaceId: updated.workspaceId,
      companyId: updated.companyId,
      status: updated.status,
      recordJson: JSON.stringify(updated),
      updatedAt: updated.updatedAt,
    });
    return updated;
  }

  getOpportunity(businessOpportunityId: string): BusinessOpportunityRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM business_opportunity_workspace WHERE business_opportunity_id = @businessOpportunityId`,
      )
      .get({ businessOpportunityId });
    return row ? mapOpportunityRow(row as Record<string, unknown>) : null;
  }

  listOpportunities(workspaceId: string, companyId?: string): BusinessOpportunityRecord[] {
    const db = getDatabase();
    let query = `SELECT record_json FROM business_opportunity_workspace WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };
    if (companyId) {
      query += ` AND company_id = @companyId`;
      params.companyId = companyId;
    }
    query += ` ORDER BY json_extract(record_json, '$.rank') ASC, updated_at DESC`;
    const rows = db.prepare(query).all(params);
    return (rows as Record<string, unknown>[]).map(mapOpportunityRow);
  }

  saveHistory(entry: ApprovalHistoryEntry): ApprovalHistoryEntry {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO business_opportunity_history
        (history_id, workspace_id, company_id, business_opportunity_id, history_json, created_at)
       VALUES
        (@historyId, @workspaceId, @companyId, @businessOpportunityId, @historyJson, @createdAt)`,
    ).run({
      historyId: entry.historyId,
      workspaceId: entry.workspaceId,
      companyId: entry.companyId,
      businessOpportunityId: entry.businessOpportunityId,
      historyJson: JSON.stringify(entry),
      createdAt: entry.recordedAt,
    });
    return entry;
  }

  listHistory(workspaceId: string, companyId?: string, businessOpportunityId?: string): ApprovalHistoryEntry[] {
    const db = getDatabase();
    let query = `SELECT history_json FROM business_opportunity_history WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };
    if (companyId) {
      query += ` AND company_id = @companyId`;
      params.companyId = companyId;
    }
    if (businessOpportunityId) {
      query += ` AND business_opportunity_id = @businessOpportunityId`;
      params.businessOpportunityId = businessOpportunityId;
    }
    query += ` ORDER BY created_at DESC`;
    const rows = db.prepare(query).all(params);
    return (rows as Record<string, unknown>[]).map(mapHistoryRow);
  }
}
