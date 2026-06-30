import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type {
  GovernanceDecisionRecord,
  GovernancePolicyRule,
} from "../models/governance-policy.js";
import type { GovernanceRepository } from "../repositories/governance-repository.js";

function mapPolicyRow(row: Record<string, unknown>): GovernancePolicyRule {
  return JSON.parse(String(row.policy_json)) as GovernancePolicyRule;
}

function mapDecisionRow(row: Record<string, unknown>): GovernanceDecisionRecord {
  return {
    decisionId: String(row.decision_id),
    workspaceId: String(row.workspace_id),
    domain: row.domain as GovernanceDecisionRecord["domain"],
    module: String(row.module),
    action: String(row.action),
    verdict: JSON.parse(String(row.verdict_json)),
    actor: String(row.actor),
    correlationId: String(row.correlation_id),
    createdAt: String(row.created_at),
  };
}

let repositoryInstance: SqliteGovernanceRepository | null = null;

export function getGovernanceRepository(): SqliteGovernanceRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteGovernanceRepository();
  }
  return repositoryInstance;
}

export function resetGovernanceRepository(): void {
  repositoryInstance = null;
}

/** SQLite persistence for governance policies and decision audit trail. */
export class SqliteGovernanceRepository implements GovernanceRepository {
  savePolicy(rule: GovernancePolicyRule): GovernancePolicyRule {
    const db = getDatabase();
    const updated = { ...rule, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO governance_policies
        (policy_id, workspace_id, domain, policy_json, enabled, priority, created_at, updated_at)
       VALUES
        (@policyId, @workspaceId, @domain, @policyJson, @enabled, @priority, @createdAt, @updatedAt)
       ON CONFLICT(policy_id) DO UPDATE SET
         domain = excluded.domain,
         policy_json = excluded.policy_json,
         enabled = excluded.enabled,
         priority = excluded.priority,
         updated_at = excluded.updated_at`,
    ).run({
      policyId: updated.policyId,
      workspaceId: updated.workspaceId,
      domain: updated.domain,
      policyJson: JSON.stringify(updated),
      enabled: updated.enabled ? 1 : 0,
      priority: updated.priority,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
    return updated;
  }

  getPolicyById(policyId: string): GovernancePolicyRule | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT policy_json FROM governance_policies WHERE policy_id = @policyId`)
      .get({ policyId });
    return row ? mapPolicyRow(row as Record<string, unknown>) : null;
  }

  listPolicies(workspaceId: string, domain?: string): GovernancePolicyRule[] {
    const db = getDatabase();
    const rows = domain
      ? db
          .prepare(
            `SELECT policy_json FROM governance_policies
             WHERE workspace_id = @workspaceId AND domain = @domain
             ORDER BY priority DESC`,
          )
          .all({ workspaceId, domain })
      : db
          .prepare(
            `SELECT policy_json FROM governance_policies
             WHERE workspace_id = @workspaceId ORDER BY priority DESC`,
          )
          .all({ workspaceId });
    return (rows as Record<string, unknown>[]).map(mapPolicyRow);
  }

  deletePolicy(policyId: string): boolean {
    const db = getDatabase();
    const result = db
      .prepare(`DELETE FROM governance_policies WHERE policy_id = @policyId`)
      .run({ policyId });
    return result.changes > 0;
  }

  appendDecision(record: GovernanceDecisionRecord): GovernanceDecisionRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO governance_decisions
        (decision_id, workspace_id, domain, module, action, verdict_json, actor, correlation_id, created_at)
       VALUES
        (@decisionId, @workspaceId, @domain, @module, @action, @verdictJson, @actor, @correlationId, @createdAt)`,
    ).run({
      decisionId: record.decisionId,
      workspaceId: record.workspaceId,
      domain: record.domain,
      module: record.module,
      action: record.action,
      verdictJson: JSON.stringify(record.verdict),
      actor: record.actor,
      correlationId: record.correlationId,
      createdAt: record.createdAt,
    });
    return record;
  }

  listDecisions(workspaceId: string, limit = 100): GovernanceDecisionRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM governance_decisions
         WHERE workspace_id = @workspaceId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit });
    return (rows as Record<string, unknown>[]).map(mapDecisionRow);
  }
}

export function createGovernanceDecisionRecord(
  input: Omit<GovernanceDecisionRecord, "decisionId" | "createdAt">,
): GovernanceDecisionRecord {
  return {
    decisionId: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
}
