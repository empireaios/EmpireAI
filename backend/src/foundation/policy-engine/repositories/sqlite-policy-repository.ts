import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { BusinessPolicy, PolicyLifecycleRecord } from "../models/business-policy.js";
import type { PolicyRepository } from "../repositories/policy-repository.js";

function mapPolicyRow(row: Record<string, unknown>): BusinessPolicy {
  return JSON.parse(String(row.policy_json)) as BusinessPolicy;
}

function mapLifecycleRow(row: Record<string, unknown>): PolicyLifecycleRecord {
  return {
    lifecycleId: String(row.lifecycle_id),
    policyId: String(row.policy_id),
    workspaceId: String(row.workspace_id),
    event: row.event as PolicyLifecycleRecord["event"],
    summary: String(row.summary),
    actor: String(row.actor),
    correlationId: row.correlation_id ? String(row.correlation_id) : undefined,
    metadata: JSON.parse(String(row.metadata_json)),
    createdAt: String(row.created_at),
  };
}

let repositoryInstance: SqlitePolicyRepository | null = null;

export function getPolicyRepository(): SqlitePolicyRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqlitePolicyRepository();
  }
  return repositoryInstance;
}

export function resetPolicyRepository(): void {
  repositoryInstance = null;
}

/** SQLite persistence for business policies and lifecycle tracking. */
export class SqlitePolicyRepository implements PolicyRepository {
  savePolicy(policy: BusinessPolicy): BusinessPolicy {
    const db = getDatabase();
    const record = { ...policy, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO business_policies
        (policy_id, workspace_id, category, status, version, policy_json, created_at, updated_at)
       VALUES
        (@policyId, @workspaceId, @category, @status, @version, @policyJson, @createdAt, @updatedAt)
       ON CONFLICT(policy_id) DO UPDATE SET
         category = excluded.category,
         status = excluded.status,
         version = excluded.version,
         policy_json = excluded.policy_json,
         updated_at = excluded.updated_at`,
    ).run({
      policyId: record.policyId,
      workspaceId: record.workspaceId,
      category: record.category,
      status: record.status,
      version: record.version,
      policyJson: JSON.stringify(record),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    return record;
  }

  getPolicyById(policyId: string): BusinessPolicy | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT policy_json FROM business_policies WHERE policy_id = @policyId`)
      .get({ policyId });
    return row ? mapPolicyRow(row as Record<string, unknown>) : null;
  }

  getPolicyByCategory(workspaceId: string, category: string): BusinessPolicy | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT policy_json FROM business_policies
         WHERE workspace_id = @workspaceId AND category = @category AND status = 'ACTIVE'
         ORDER BY policy_id ASC LIMIT 1`,
      )
      .get({ workspaceId, category });
    return row ? mapPolicyRow(row as Record<string, unknown>) : null;
  }

  listPolicies(workspaceId: string, status?: string): BusinessPolicy[] {
    const db = getDatabase();
    const rows = status
      ? db
          .prepare(
            `SELECT policy_json FROM business_policies
             WHERE workspace_id = @workspaceId AND status = @status
             ORDER BY policy_id ASC`,
          )
          .all({ workspaceId, status })
      : db
          .prepare(
            `SELECT policy_json FROM business_policies
             WHERE workspace_id = @workspaceId ORDER BY policy_id ASC`,
          )
          .all({ workspaceId });
    return (rows as Record<string, unknown>[]).map(mapPolicyRow);
  }

  appendLifecycle(record: PolicyLifecycleRecord): PolicyLifecycleRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO policy_lifecycle
        (lifecycle_id, policy_id, workspace_id, event, summary, actor, correlation_id, metadata_json, created_at)
       VALUES
        (@lifecycleId, @policyId, @workspaceId, @event, @summary, @actor, @correlationId, @metadataJson, @createdAt)`,
    ).run({
      lifecycleId: record.lifecycleId,
      policyId: record.policyId,
      workspaceId: record.workspaceId,
      event: record.event,
      summary: record.summary,
      actor: record.actor,
      correlationId: record.correlationId ?? null,
      metadataJson: JSON.stringify(record.metadata),
      createdAt: record.createdAt,
    });
    return record;
  }

  listLifecycle(policyId: string, limit = 100): PolicyLifecycleRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM policy_lifecycle
         WHERE policy_id = @policyId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ policyId, limit });
    return (rows as Record<string, unknown>[]).map(mapLifecycleRow);
  }

  listWorkspaceLifecycle(workspaceId: string, limit = 100): PolicyLifecycleRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM policy_lifecycle
         WHERE workspace_id = @workspaceId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit });
    return (rows as Record<string, unknown>[]).map(mapLifecycleRow);
  }
}

export function createPolicyLifecycleRecord(
  input: Omit<PolicyLifecycleRecord, "lifecycleId" | "createdAt">,
): PolicyLifecycleRecord {
  return {
    lifecycleId: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
}
