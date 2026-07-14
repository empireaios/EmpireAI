import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { ActivationDecision } from "../models/reality-activation.js";

let repositoryInstance: SqliteRealityActivationRepository | null = null;

export function getRealityActivationRepository(): SqliteRealityActivationRepository {
  if (!repositoryInstance) repositoryInstance = new SqliteRealityActivationRepository();
  return repositoryInstance;
}

export function resetRealityActivationRepository(): void {
  repositoryInstance = null;
}

export class SqliteRealityActivationRepository {
  saveDecision(decision: ActivationDecision): ActivationDecision {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO reality_activation_decisions
        (decision_id, workspace_id, company_id, record_json, evaluated_at)
       VALUES (@decisionId, @workspaceId, @companyId, @recordJson, @evaluatedAt)`,
    ).run({
      decisionId: decision.decisionId,
      workspaceId: decision.workspaceId,
      companyId: decision.companyId,
      recordJson: JSON.stringify(decision),
      evaluatedAt: decision.evaluatedAt,
    });
    return decision;
  }

  getLatest(workspaceId: string, companyId: string): ActivationDecision | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM reality_activation_decisions
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY evaluated_at DESC LIMIT 1`,
      )
      .get({ workspaceId, companyId }) as { record_json: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.record_json) as ActivationDecision;
  }

  setEmergencyStop(workspaceId: string, companyId: string, active: boolean): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO reality_activation_emergency (workspace_id, company_id, active, updated_at)
       VALUES (@workspaceId, @companyId, @active, @updatedAt)
       ON CONFLICT(workspace_id, company_id) DO UPDATE SET active = @active, updated_at = @updatedAt`,
    ).run({
      workspaceId,
      companyId,
      active: active ? 1 : 0,
      updatedAt: new Date().toISOString(),
    });
  }

  isEmergencyStop(workspaceId: string, companyId: string): boolean {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT active FROM reality_activation_emergency
         WHERE workspace_id = @workspaceId AND company_id = @companyId`,
      )
      .get({ workspaceId, companyId }) as { active: number } | undefined;
    return Boolean(row?.active);
  }

  createDecisionId(): string {
    return randomUUID();
  }
}
