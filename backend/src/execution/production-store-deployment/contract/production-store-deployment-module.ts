/**
 * Production Store Deployment module — Vercel live deploy with Grand King approval gate.
 */

import type { ProductionDeploymentRecord } from "../models/production-deployment-record.js";
import {
  applyDeploymentApproval,
  executeProductionDeployment,
  getDeploymentLogs,
  prepareProductionDeployment,
  rollbackProductionDeployment,
  type PrepareProductionDeploymentInput,
} from "../services/production-deploy-service.js";
import { getProductionDeploymentRepository } from "../repositories/sqlite-production-deployment-repository.js";

export const PRODUCTION_STORE_DEPLOYMENT_MODULE_ID = "production-store-deployment" as const;
export type ProductionStoreDeploymentModuleId = typeof PRODUCTION_STORE_DEPLOYMENT_MODULE_ID;
export const PRODUCTION_STORE_DEPLOYMENT_VERSION = "0.1.0" as const;

export type ProductionStoreDeploymentCapability =
  | "production-store-deployment.prepare"
  | "production-store-deployment.approve"
  | "production-store-deployment.deploy"
  | "production-store-deployment.rollback"
  | "production-store-deployment.logs";

export const PRODUCTION_STORE_DEPLOYMENT_CAPABILITIES: readonly ProductionStoreDeploymentCapability[] =
  [
    "production-store-deployment.prepare",
    "production-store-deployment.approve",
    "production-store-deployment.deploy",
    "production-store-deployment.rollback",
    "production-store-deployment.logs",
  ] as const;

/** Orchestrates Vercel production store deployments. */
export class ProductionStoreDeploymentModule {
  readonly moduleId = PRODUCTION_STORE_DEPLOYMENT_MODULE_ID;
  readonly version = PRODUCTION_STORE_DEPLOYMENT_VERSION;
  readonly capabilities = PRODUCTION_STORE_DEPLOYMENT_CAPABILITIES;

  prepare = prepareProductionDeployment;
  approve = applyDeploymentApproval;
  deploy = executeProductionDeployment;
  rollback = rollbackProductionDeployment;
  getLogs = getDeploymentLogs;

  listDeployments(workspaceId: string, storeId?: string): ProductionDeploymentRecord[] {
    return getProductionDeploymentRepository().listDeployments(workspaceId, storeId);
  }

  getDeployment(deploymentId: string): ProductionDeploymentRecord | null {
    return getProductionDeploymentRepository().getDeploymentById(deploymentId);
  }
}

export function createProductionStoreDeploymentModule(): ProductionStoreDeploymentModule {
  return new ProductionStoreDeploymentModule();
}

export const productionStoreDeploymentModule = createProductionStoreDeploymentModule();

export type { PrepareProductionDeploymentInput };
