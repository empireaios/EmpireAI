import type { AutomationPlan } from "../models/automation-plan.js";
import { getDatabase } from "../../../brain/database.js";

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row["record_json"])) as T;
}

export class FounderAutomationRepository {
  savePlan(plan: AutomationPlan): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO founder_automation_plans
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

  getLatestPlan(workspaceId: string, companyId: string): AutomationPlan | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM founder_automation_plans
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get({ workspaceId, companyId }) as Record<string, unknown> | undefined;
    return row ? mapJson<AutomationPlan>(row) : null;
  }
}

let repository: FounderAutomationRepository | null = null;

export function getFounderAutomationRepository(): FounderAutomationRepository {
  repository ??= new FounderAutomationRepository();
  return repository;
}

export function resetFounderAutomationRepository(): void {
  repository = null;
}
