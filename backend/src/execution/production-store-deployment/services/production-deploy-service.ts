import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { loadProductionDeploymentEnv, isVercelLiveConfigured } from "../config/production-deployment-env.js";
import type { DeploymentApproval, ProductionDeploymentRecord } from "../models/production-deployment-record.js";
import {
  createDeploymentLog,
  getProductionDeploymentRepository,
} from "../repositories/sqlite-production-deployment-repository.js";
import {
  addVercelCustomDomain,
  createVercelDeployment,
  prepareVercelProject,
  rollbackVercelDeployment,
} from "./vercel-api-client.js";

export class ProductionDeploymentBlockedError extends Error {
  constructor(reason: string) {
    super(`Production deployment blocked: ${reason}`);
    this.name = "ProductionDeploymentBlockedError";
  }
}

export type PrepareProductionDeploymentInput = {
  workspaceId: string;
  companyId: string;
  storeId: string;
  brandId: string;
  projectName: string;
  sourcePath?: string;
  customDomain?: string | null;
  environmentVariables?: Record<string, string>;
  buildCommand?: string;
  outputDirectory?: string;
  sourceFiles?: Array<{ relativePath: string; content: string }>;
};

function log(deploymentId: string, level: "INFO" | "WARN" | "ERROR" | "SUCCESS", phase: string, message: string, metadata: Record<string, unknown> = {}) {
  getProductionDeploymentRepository().appendLog(
    createDeploymentLog(deploymentId, level, phase, message, metadata),
  );
}

function defaultEnvVars(input: PrepareProductionDeploymentInput): Record<string, string> {
  return {
    NODE_ENV: "production",
    VERCEL_ENV: "production",
    EMPIRE_STORE_ID: input.storeId,
    EMPIRE_COMPANY_ID: input.companyId,
    EMPIRE_BRAND_ID: input.brandId,
    ...input.environmentVariables,
  };
}

/** Prepares a Vercel production deployment — PENDING_APPROVAL until Grand King approves. */
export function prepareProductionDeployment(
  input: PrepareProductionDeploymentInput,
): ProductionDeploymentRecord {
  const config = loadProductionDeploymentEnv();
  const deploymentId = randomUUID();
  const deployRoot = path.resolve(config.PRODUCTION_DEPLOY_ROOT);
  const projectPath = input.sourcePath
    ? path.resolve(input.sourcePath)
    : path.join(deployRoot, input.projectName);

  const envVars = defaultEnvVars(input);
  const buildCommand = input.buildCommand ?? "npm run build";
  const outputDirectory = input.outputDirectory ?? ".";

  prepareVercelProject({
    targetPath: projectPath,
    projectName: input.projectName,
    buildCommand,
    outputDirectory,
    environmentVariables: envVars,
    sourceFiles: input.sourceFiles,
  });

  const previous = getProductionDeploymentRepository().getLatestDeployed(
    input.workspaceId,
    input.projectName,
  );

  const record: ProductionDeploymentRecord = {
    deploymentId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    storeId: input.storeId,
    brandId: input.brandId,
    projectName: input.projectName,
    sourcePath: projectPath,
    hostingTarget: "VERCEL",
    status: "PENDING_APPROVAL",
    executionMode: isVercelLiveConfigured(config) ? "VERCEL_LIVE" : "VERCEL_MOCK",
    approval: null,
    environmentVariables: envVars,
    customDomain: input.customDomain ?? null,
    sslEnabled: Boolean(input.customDomain),
    vercelProjectId: null,
    vercelDeploymentId: null,
    vercelDeploymentUrl: null,
    previousDeploymentId: previous?.vercelDeploymentId ?? null,
    productionUrl: null,
    buildCommand,
    outputDirectory,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  getProductionDeploymentRepository().saveDeployment(record);
  log(deploymentId, "INFO", "prepare", "Production deployment prepared — awaiting Grand King approval.", {
    projectName: input.projectName,
    executionMode: record.executionMode,
    sourcePath: projectPath,
  });

  return record;
}

/** Applies Grand King approval gate — Protect The Empire. */
export function applyDeploymentApproval(input: {
  deploymentId: string;
  approvalToken: string;
  approvedBy: string;
  approvedAt: string;
}): ProductionDeploymentRecord {
  const repository = getProductionDeploymentRepository();
  const record = repository.getDeploymentById(input.deploymentId);
  if (!record) {
    throw new Error(`Deployment ${input.deploymentId} not found`);
  }
  if (record.status !== "PENDING_APPROVAL") {
    throw new ProductionDeploymentBlockedError(
      `Deployment status must be PENDING_APPROVAL, got ${record.status}`,
    );
  }

  const approval: DeploymentApproval = {
    approvalToken: input.approvalToken,
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
    approved: true,
  };

  const updated: ProductionDeploymentRecord = {
    ...record,
    status: "APPROVED",
    approval,
    updatedAt: new Date().toISOString(),
  };

  repository.saveDeployment(updated);
  log(input.deploymentId, "SUCCESS", "approval", "Grand King approval applied.", {
    approvedBy: input.approvedBy,
  });

  return updated;
}

/** Executes approved Vercel production deployment with build, env vars, domain, and SSL. */
export async function executeProductionDeployment(
  deploymentId: string,
): Promise<ProductionDeploymentRecord> {
  const config = loadProductionDeploymentEnv();
  const repository = getProductionDeploymentRepository();
  const record = repository.getDeploymentById(deploymentId);

  if (!record) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }
  if (record.status !== "APPROVED" || record.approval?.approved !== true) {
    throw new ProductionDeploymentBlockedError(
      "Grand King approval required before production deployment.",
    );
  }
  if (!config.PRODUCTION_DEPLOYMENT_ENABLED && !config.PRODUCTION_DEPLOY_MOCK) {
    throw new ProductionDeploymentBlockedError(
      "PRODUCTION_DEPLOYMENT_ENABLED is false — Protect The Empire gate active.",
    );
  }

  let current: ProductionDeploymentRecord = {
    ...record,
    status: "BUILDING",
    updatedAt: new Date().toISOString(),
  };
  repository.saveDeployment(current);
  log(deploymentId, "INFO", "build", `Running production build: ${record.buildCommand}`);

  try {
    current = { ...current, status: "DEPLOYING", updatedAt: new Date().toISOString() };
    repository.saveDeployment(current);
    log(deploymentId, "INFO", "deploy", "Uploading to Vercel...", {
      executionMode: record.executionMode,
    });

    const result = await createVercelDeployment({
      projectName: record.projectName,
      sourcePath: record.sourcePath,
      environmentVariables: record.environmentVariables,
      target: "production",
    });

    log(deploymentId, "SUCCESS", "deploy", "Vercel deployment created.", {
      vercelDeploymentId: result.id,
      url: result.url,
      mock: result.mock,
    });

    let productionUrl = result.url;
    let sslEnabled = record.sslEnabled;
    let customDomain = record.customDomain;

    if (record.customDomain && result.projectId) {
      log(deploymentId, "INFO", "domain", `Assigning custom domain ${record.customDomain}...`);
      const domainResult = await addVercelCustomDomain({
        projectId: result.projectId,
        domain: record.customDomain,
      });
      productionUrl = `https://${domainResult.name}`;
      sslEnabled = domainResult.sslEnabled;
      customDomain = domainResult.name;
      log(deploymentId, "SUCCESS", "domain", "Custom domain assigned — SSL enabled by Vercel.", {
        domain: domainResult.name,
        verified: domainResult.verified,
        mock: domainResult.mock,
      });
    }

    const deployed: ProductionDeploymentRecord = {
      ...current,
      status: "DEPLOYED",
      vercelProjectId: result.projectId,
      vercelDeploymentId: result.id,
      vercelDeploymentUrl: result.url,
      productionUrl,
      customDomain,
      sslEnabled,
      errorMessage: null,
      updatedAt: new Date().toISOString(),
    };

    repository.saveDeployment(deployed);
    log(deploymentId, "SUCCESS", "complete", "Production deployment live.", {
      productionUrl,
    });

    return deployed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed: ProductionDeploymentRecord = {
      ...current,
      status: "FAILED",
      errorMessage: message,
      updatedAt: new Date().toISOString(),
    };
    repository.saveDeployment(failed);
    log(deploymentId, "ERROR", "failed", message);
    throw error;
  }
}

/** Rolls back to the previous successful Vercel deployment. */
export async function rollbackProductionDeployment(
  deploymentId: string,
): Promise<ProductionDeploymentRecord> {
  const repository = getProductionDeploymentRepository();
  const record = repository.getDeploymentById(deploymentId);

  if (!record) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }
  if (!record.previousDeploymentId || !record.vercelProjectId) {
    throw new ProductionDeploymentBlockedError(
      "No previous deployment available for rollback.",
    );
  }

  log(deploymentId, "WARN", "rollback", "Initiating rollback to previous deployment...", {
    previousDeploymentId: record.previousDeploymentId,
  });

  const result = await rollbackVercelDeployment({
    projectId: record.vercelProjectId,
    deploymentId: record.previousDeploymentId,
  });

  const rolledBack: ProductionDeploymentRecord = {
    ...record,
    status: "ROLLED_BACK",
    vercelDeploymentId: result.id,
    vercelDeploymentUrl: result.url,
    productionUrl: result.url || record.productionUrl,
    updatedAt: new Date().toISOString(),
  };

  repository.saveDeployment(rolledBack);
  log(deploymentId, "SUCCESS", "rollback", "Rollback complete.", {
    deploymentId: result.id,
    url: result.url,
  });

  return rolledBack;
}

export function getDeploymentLogs(deploymentId: string) {
  return getProductionDeploymentRepository().listLogs(deploymentId);
}
