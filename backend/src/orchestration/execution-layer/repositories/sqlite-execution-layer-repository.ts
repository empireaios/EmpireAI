import { getDatabase } from "../../../brain/database.js";
import type {
  BusinessHealthRecord,
  CustomerLifetimeRecord,
  ExecutionPackageType,
  FulfillmentPackage,
  GrowthOptimizationRecord,
  MarketingCampaignPackage,
  PipelineValidationResult,
  PublicationPackage,
  RevenueActivationPackage,
} from "../models/execution-packages.js";

let repositoryInstance: SqliteExecutionLayerRepository | null = null;

export function getExecutionLayerRepository(): SqliteExecutionLayerRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteExecutionLayerRepository();
  }
  return repositoryInstance;
}

export function resetExecutionLayerRepository(): void {
  repositoryInstance = null;
}

type StoredRecord =
  | PublicationPackage
  | MarketingCampaignPackage
  | FulfillmentPackage
  | RevenueActivationPackage
  | BusinessHealthRecord
  | GrowthOptimizationRecord
  | CustomerLifetimeRecord
  | PipelineValidationResult;

function mapRow<T extends StoredRecord>(row: Record<string, unknown>): T {
  return JSON.parse(String(row.record_json)) as T;
}

export class SqliteExecutionLayerRepository {
  savePackage(
    packageType: ExecutionPackageType,
    record: StoredRecord,
    ids: {
      packageId: string;
      workspaceId: string;
      companyId: string;
      buildId?: string;
      businessOpportunityId?: string;
    },
  ): StoredRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO execution_layer_packages
        (package_id, package_type, workspace_id, company_id, build_id, business_opportunity_id, record_json, created_at)
       VALUES
        (@packageId, @packageType, @workspaceId, @companyId, @buildId, @businessOpportunityId, @recordJson, @createdAt)
       ON CONFLICT(package_id) DO UPDATE SET
         record_json = excluded.record_json,
         created_at = excluded.created_at`,
    ).run({
      packageId: ids.packageId,
      packageType,
      workspaceId: ids.workspaceId,
      companyId: ids.companyId,
      buildId: ids.buildId ?? null,
      businessOpportunityId: ids.businessOpportunityId ?? null,
      recordJson: JSON.stringify(record),
      createdAt: (record as { createdAt?: string; evaluatedAt?: string; validatedAt?: string }).createdAt
        ?? (record as BusinessHealthRecord).evaluatedAt
        ?? (record as PipelineValidationResult).validatedAt
        ?? new Date().toISOString(),
    });
    return record;
  }

  getPackage<T extends StoredRecord>(packageId: string): T | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM execution_layer_packages WHERE package_id = @packageId`)
      .get({ packageId });
    return row ? mapRow<T>(row as Record<string, unknown>) : null;
  }

  getLatestByBuildAndType<T extends StoredRecord>(
    buildId: string,
    packageType: ExecutionPackageType,
  ): T | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM execution_layer_packages
         WHERE build_id = @buildId AND package_type = @packageType
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get({ buildId, packageType });
    return row ? mapRow<T>(row as Record<string, unknown>) : null;
  }

  getLatestByOpportunityAndType<T extends StoredRecord>(
    businessOpportunityId: string,
    packageType: ExecutionPackageType,
  ): T | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM execution_layer_packages
         WHERE business_opportunity_id = @businessOpportunityId AND package_type = @packageType
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get({ businessOpportunityId, packageType });
    return row ? mapRow<T>(row as Record<string, unknown>) : null;
  }

  countByType(workspaceId: string, companyId: string, packageType: ExecutionPackageType): number {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT COUNT(*) as count FROM execution_layer_packages
         WHERE workspace_id = @workspaceId AND company_id = @companyId AND package_type = @packageType`,
      )
      .get({ workspaceId, companyId, packageType }) as { count: number };
    return row.count;
  }

  listByWorkspace(workspaceId: string, companyId?: string): StoredRecord[] {
    const db = getDatabase();
    let query = `SELECT record_json FROM execution_layer_packages WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };
    if (companyId) {
      query += ` AND company_id = @companyId`;
      params.companyId = companyId;
    }
    query += ` ORDER BY created_at DESC`;
    const rows = db.prepare(query).all(params);
    return (rows as Record<string, unknown>[]).map((row) => mapRow(row));
  }
}
