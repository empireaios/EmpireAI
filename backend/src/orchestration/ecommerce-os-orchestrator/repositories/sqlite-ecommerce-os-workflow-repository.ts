import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { LaunchWorkflowRecord } from "../models/ecommerce-os-workflow.js";

export interface EcommerceOsWorkflowRepository {
  saveWorkflow(workflow: LaunchWorkflowRecord): LaunchWorkflowRecord;
  getWorkflowById(workflowId: string): LaunchWorkflowRecord | null;
  listWorkflows(workspaceId: string, companyId?: string): LaunchWorkflowRecord[];
}

let repositoryInstance: SqliteEcommerceOsWorkflowRepository | null = null;

export function getEcommerceOsWorkflowRepository(): SqliteEcommerceOsWorkflowRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteEcommerceOsWorkflowRepository();
  }
  return repositoryInstance;
}

export function resetEcommerceOsWorkflowRepository(): void {
  repositoryInstance = null;
}

function mapRow(row: Record<string, unknown>): LaunchWorkflowRecord {
  return JSON.parse(String(row.workflow_json)) as LaunchWorkflowRecord;
}

export class SqliteEcommerceOsWorkflowRepository implements EcommerceOsWorkflowRepository {
  saveWorkflow(workflow: LaunchWorkflowRecord): LaunchWorkflowRecord {
    const db = getDatabase();
    const record = { ...workflow, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO ecommerce_os_workflows
        (workflow_id, workspace_id, company_id, stage, workflow_json, created_at, updated_at)
       VALUES
        (@workflowId, @workspaceId, @companyId, @stage, @workflowJson, @createdAt, @updatedAt)
       ON CONFLICT(workflow_id) DO UPDATE SET
         stage = excluded.stage,
         workflow_json = excluded.workflow_json,
         updated_at = excluded.updated_at`,
    ).run({
      workflowId: record.workflowId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      stage: record.stage,
      workflowJson: JSON.stringify(record),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    return record;
  }

  getWorkflowById(workflowId: string): LaunchWorkflowRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT workflow_json FROM ecommerce_os_workflows WHERE workflow_id = @workflowId`)
      .get({ workflowId });
    return row ? mapRow(row as Record<string, unknown>) : null;
  }

  listWorkflows(workspaceId: string, companyId?: string): LaunchWorkflowRecord[] {
    const db = getDatabase();
    let query = `SELECT workflow_json FROM ecommerce_os_workflows WHERE workspace_id = @workspaceId`;
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

export function createLaunchWorkflowRecord(
  input: Omit<LaunchWorkflowRecord, "workflowId" | "createdAt" | "updatedAt"> & {
    workflowId?: string;
  },
): LaunchWorkflowRecord {
  const timestamp = new Date().toISOString();
  return {
    workflowId: input.workflowId ?? `workflow:${randomUUID()}`,
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
