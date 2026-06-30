import type { GlobalCommerceIdentity } from "../models/global-identity.js";
import type { GlobalExpansionPlan } from "../models/expansion-plan.js";
import { getDatabase } from "../../../brain/database.js";

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row["record_json"])) as T;
}

export class GlobalCommerceRepository {
  saveIdentity(identity: GlobalCommerceIdentity): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO global_commerce_identity
        (identity_id, workspace_id, company_id, record_json, updated_at)
       VALUES (@identityId, @workspaceId, @companyId, @recordJson, @updatedAt)
       ON CONFLICT(workspace_id, company_id) DO UPDATE SET
         record_json = excluded.record_json,
         updated_at = excluded.updated_at`,
    ).run({
      identityId: identity.identityId,
      workspaceId: identity.workspaceId,
      companyId: identity.companyId,
      recordJson: JSON.stringify(identity),
      updatedAt: identity.updatedAt,
    });
  }

  getIdentity(workspaceId: string, companyId: string): GlobalCommerceIdentity | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM global_commerce_identity WHERE workspace_id = @workspaceId AND company_id = @companyId`)
      .get({ workspaceId, companyId }) as Record<string, unknown> | undefined;
    return row ? mapJson<GlobalCommerceIdentity>(row) : null;
  }

  saveExpansionPlan(plan: GlobalExpansionPlan): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO global_commerce_expansion_plans
        (plan_id, workspace_id, company_id, record_json, created_at)
       VALUES (@planId, @workspaceId, @companyId, @recordJson, @createdAt)
       ON CONFLICT(plan_id) DO UPDATE SET record_json = excluded.record_json`,
    ).run({
      planId: plan.planId,
      workspaceId: plan.workspaceId,
      companyId: plan.companyId,
      recordJson: JSON.stringify(plan),
      createdAt: plan.computedAt,
    });
  }

  getLatestExpansionPlan(workspaceId: string, companyId: string): GlobalExpansionPlan | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM global_commerce_expansion_plans
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get({ workspaceId, companyId }) as Record<string, unknown> | undefined;
    return row ? mapJson<GlobalExpansionPlan>(row) : null;
  }
}

let repository: GlobalCommerceRepository | null = null;

export function getGlobalCommerceRepository(): GlobalCommerceRepository {
  repository ??= new GlobalCommerceRepository();
  return repository;
}

export function resetGlobalCommerceRepository(): void {
  repository = null;
}
