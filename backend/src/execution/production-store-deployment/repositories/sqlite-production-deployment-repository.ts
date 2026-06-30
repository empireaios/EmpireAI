import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { DeploymentLogEntry } from "../models/deployment-log-entry.js";
import type { ProductionDeploymentRecord } from "../models/production-deployment-record.js";
import type { ProductionDeploymentRepository } from "./production-deployment-repository.js";

function nowIso(): string {
  return new Date().toISOString();
}

function mapDeploymentRow(row: Record<string, unknown>): ProductionDeploymentRecord {
  return {
    deploymentId: String(row.deployment_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    storeId: String(row.store_id),
    brandId: String(row.brand_id),
    projectName: String(row.project_name),
    sourcePath: String(row.source_path),
    hostingTarget: "VERCEL",
    status: row.status as ProductionDeploymentRecord["status"],
    executionMode: row.execution_mode as ProductionDeploymentRecord["executionMode"],
    approval: row.approval_json ? JSON.parse(String(row.approval_json)) : null,
    environmentVariables: JSON.parse(String(row.environment_variables_json)),
    customDomain: row.custom_domain ? String(row.custom_domain) : null,
    sslEnabled: Boolean(row.ssl_enabled),
    vercelProjectId: row.vercel_project_id ? String(row.vercel_project_id) : null,
    vercelDeploymentId: row.vercel_deployment_id ? String(row.vercel_deployment_id) : null,
    vercelDeploymentUrl: row.vercel_deployment_url ? String(row.vercel_deployment_url) : null,
    previousDeploymentId: row.previous_deployment_id ? String(row.previous_deployment_id) : null,
    productionUrl: row.production_url ? String(row.production_url) : null,
    buildCommand: String(row.build_command),
    outputDirectory: String(row.output_directory),
    errorMessage: row.error_message ? String(row.error_message) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapLogRow(row: Record<string, unknown>): DeploymentLogEntry {
  return {
    logId: String(row.id),
    deploymentId: String(row.deployment_id),
    level: row.level as DeploymentLogEntry["level"],
    phase: String(row.phase),
    message: String(row.message),
    metadata: JSON.parse(String(row.metadata_json)),
    createdAt: String(row.created_at),
  };
}

/** SQLite persistence for production Vercel deployments. */
export class SqliteProductionDeploymentRepository implements ProductionDeploymentRepository {
  saveDeployment(input: ProductionDeploymentRecord): ProductionDeploymentRecord {
    const db = getDatabase();
    const timestamp = nowIso();
    const record = {
      ...input,
      updatedAt: timestamp,
    };

    db.prepare(
      `INSERT INTO production_deployments
        (deployment_id, workspace_id, company_id, store_id, brand_id, project_name, source_path,
         status, execution_mode, approval_json, environment_variables_json, custom_domain, ssl_enabled,
         vercel_project_id, vercel_deployment_id, vercel_deployment_url, previous_deployment_id,
         production_url, build_command, output_directory, error_message, created_at, updated_at)
       VALUES
        (@deploymentId, @workspaceId, @companyId, @storeId, @brandId, @projectName, @sourcePath,
         @status, @executionMode, @approvalJson, @environmentVariablesJson, @customDomain, @sslEnabled,
         @vercelProjectId, @vercelDeploymentId, @vercelDeploymentUrl, @previousDeploymentId,
         @productionUrl, @buildCommand, @outputDirectory, @errorMessage, @createdAt, @updatedAt)
       ON CONFLICT(deployment_id) DO UPDATE SET
         status = excluded.status,
         execution_mode = excluded.execution_mode,
         approval_json = excluded.approval_json,
         environment_variables_json = excluded.environment_variables_json,
         custom_domain = excluded.custom_domain,
         ssl_enabled = excluded.ssl_enabled,
         vercel_project_id = excluded.vercel_project_id,
         vercel_deployment_id = excluded.vercel_deployment_id,
         vercel_deployment_url = excluded.vercel_deployment_url,
         previous_deployment_id = excluded.previous_deployment_id,
         production_url = excluded.production_url,
         error_message = excluded.error_message,
         updated_at = excluded.updated_at`,
    ).run({
      deploymentId: record.deploymentId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      storeId: record.storeId,
      brandId: record.brandId,
      projectName: record.projectName,
      sourcePath: record.sourcePath,
      status: record.status,
      executionMode: record.executionMode,
      approvalJson: record.approval ? JSON.stringify(record.approval) : null,
      environmentVariablesJson: JSON.stringify(record.environmentVariables),
      customDomain: record.customDomain,
      sslEnabled: record.sslEnabled ? 1 : 0,
      vercelProjectId: record.vercelProjectId,
      vercelDeploymentId: record.vercelDeploymentId,
      vercelDeploymentUrl: record.vercelDeploymentUrl,
      previousDeploymentId: record.previousDeploymentId,
      productionUrl: record.productionUrl,
      buildCommand: record.buildCommand,
      outputDirectory: record.outputDirectory,
      errorMessage: record.errorMessage,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    return record;
  }

  getDeploymentById(deploymentId: string): ProductionDeploymentRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM production_deployments WHERE deployment_id = @deploymentId`)
      .get({ deploymentId }) as Record<string, unknown> | undefined;
    return row ? mapDeploymentRow(row) : null;
  }

  listDeployments(workspaceId: string, storeId?: string): ProductionDeploymentRecord[] {
    const db = getDatabase();
    const rows = storeId
      ? (db
          .prepare(
            `SELECT * FROM production_deployments WHERE workspace_id = @workspaceId AND store_id = @storeId ORDER BY updated_at DESC`,
          )
          .all({ workspaceId, storeId }) as Record<string, unknown>[])
      : (db
          .prepare(
            `SELECT * FROM production_deployments WHERE workspace_id = @workspaceId ORDER BY updated_at DESC`,
          )
          .all({ workspaceId }) as Record<string, unknown>[]);
    return rows.map(mapDeploymentRow);
  }

  getLatestDeployed(workspaceId: string, projectName: string): ProductionDeploymentRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM production_deployments
         WHERE workspace_id = @workspaceId AND project_name = @projectName AND status = 'DEPLOYED'
         ORDER BY updated_at DESC LIMIT 1`,
      )
      .get({ workspaceId, projectName }) as Record<string, unknown> | undefined;
    return row ? mapDeploymentRow(row) : null;
  }

  appendLog(entry: DeploymentLogEntry): DeploymentLogEntry {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO production_deployment_logs
        (id, deployment_id, level, phase, message, metadata_json, created_at)
       VALUES (@id, @deploymentId, @level, @phase, @message, @metadataJson, @createdAt)`,
    ).run({
      id: entry.logId,
      deploymentId: entry.deploymentId,
      level: entry.level,
      phase: entry.phase,
      message: entry.message,
      metadataJson: JSON.stringify(entry.metadata),
      createdAt: entry.createdAt,
    });
    return entry;
  }

  listLogs(deploymentId: string): DeploymentLogEntry[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM production_deployment_logs WHERE deployment_id = @deploymentId ORDER BY created_at ASC`,
      )
      .all({ deploymentId }) as Record<string, unknown>[];
    return rows.map(mapLogRow);
  }
}

let defaultRepository: SqliteProductionDeploymentRepository | null = null;

export function getProductionDeploymentRepository(): ProductionDeploymentRepository {
  if (!defaultRepository) {
    defaultRepository = new SqliteProductionDeploymentRepository();
  }
  return defaultRepository;
}

export function createDeploymentLog(
  deploymentId: string,
  level: DeploymentLogEntry["level"],
  phase: string,
  message: string,
  metadata: Record<string, unknown> = {},
): DeploymentLogEntry {
  return {
    logId: randomUUID(),
    deploymentId,
    level,
    phase,
    message,
    metadata,
    createdAt: nowIso(),
  };
}
