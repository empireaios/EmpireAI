import { getDatabase } from "../../../brain/database.js";
import type { BusinessBuildPackage } from "../models/business-build-package.js";

let repositoryInstance: SqliteBusinessBuildRepository | null = null;

export function getBusinessBuildRepository(): SqliteBusinessBuildRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteBusinessBuildRepository();
  }
  return repositoryInstance;
}

export function resetBusinessBuildRepository(): void {
  repositoryInstance = null;
}

function mapRow(row: Record<string, unknown>): BusinessBuildPackage {
  return JSON.parse(String(row.record_json)) as BusinessBuildPackage;
}

export class SqliteBusinessBuildRepository {
  saveBuild(record: BusinessBuildPackage): BusinessBuildPackage {
    const db = getDatabase();
    const updated = { ...record, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO business_build_packages
        (build_id, workspace_id, company_id, business_opportunity_id, status, record_json, updated_at)
       VALUES
        (@buildId, @workspaceId, @companyId, @businessOpportunityId, @status, @recordJson, @updatedAt)
       ON CONFLICT(build_id) DO UPDATE SET
         status = excluded.status,
         record_json = excluded.record_json,
         updated_at = excluded.updated_at`,
    ).run({
      buildId: updated.buildId,
      workspaceId: updated.workspaceId,
      companyId: updated.companyId,
      businessOpportunityId: updated.businessOpportunityId,
      status: updated.status,
      recordJson: JSON.stringify(updated),
      updatedAt: updated.updatedAt,
    });
    return updated;
  }

  getBuild(buildId: string): BusinessBuildPackage | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM business_build_packages WHERE build_id = @buildId`)
      .get({ buildId });
    return row ? mapRow(row as Record<string, unknown>) : null;
  }

  getLatestByOpportunity(businessOpportunityId: string): BusinessBuildPackage | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM business_build_packages
         WHERE business_opportunity_id = @businessOpportunityId
         ORDER BY updated_at DESC LIMIT 1`,
      )
      .get({ businessOpportunityId });
    return row ? mapRow(row as Record<string, unknown>) : null;
  }

  listBuilds(workspaceId: string, companyId?: string): BusinessBuildPackage[] {
    const db = getDatabase();
    let query = `SELECT record_json FROM business_build_packages WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };
    if (companyId) {
      query += ` AND company_id = @companyId`;
      params.companyId = companyId;
    }
    query += ` ORDER BY updated_at DESC`;
    const rows = db.prepare(query).all(params);
    return (rows as Record<string, unknown>[]).map(mapRow);
  }
}
