/**
 * G7-01 — Production workspace registry source adapter.
 */

import { PRODUCTION_WORKSPACE_SEED_ROWS } from "../../orchestration/grand-king-production-workspace/data/grand-king-workspace-seed.js";
import { READINESS_POLICY_SEED_ROWS } from "../../orchestration/grand-king-production-workspace/data/readiness-policy-seed.js";
import { CONNECTION_PROVIDER_SEED_ROWS } from "../../orchestration/identity-authorization-platform/connection-registry/data/connection-provider-seed.js";
import { IDENTITY_PROVIDER_SEED_ROWS } from "../../orchestration/grand-king-production-workspace/data/identity-provider-seed.js";
import { EXECUTIVE_POLICY_SEED_ROWS } from "../../orchestration/grand-king-executive-decision-centre/data/executive-policy-seed.js";
import { FINANCIAL_POLICY_SEED_ROWS } from "../../orchestration/grand-king-revenue-financial-operations/data/financial-policy-seed.js";
import { OPTIMIZATION_POLICY_SEED_ROWS } from "../../orchestration/grand-king-continuous-intelligence-optimization/data/optimization-policy-seed.js";
import { IDENTITY_MONITOR_SEED_ROWS } from "../../orchestration/grand-king-self-healing-operations/data/identity-monitor-seed.js";
import {
  REG_WORKSPACE,
  REG_READINESS_POLICY,
  REG_CONNECTION_PROVIDER,
  REG_IDENTITY_PROVIDER,
  REG_EXECUTIVE_POLICY,
  REG_FINANCIAL_POLICY,
  REG_OPTIMIZATION_POLICY,
  REG_IDENTITY_MONITOR,
  PRODUCTION_WORKSPACE_REGISTRY_IDS,
  type ProductionWorkspaceRegistryId,
} from "../types/registry-ids.js";
import {
  PRODUCTION_WORKSPACE_REGISTRY_VERSION,
  type ProductionWorkspaceRegistryRowBase,
} from "../types/production-workspace-registry-types.js";
import type { RegistryQuery } from "../types/registry-types.js";
import {
  validateProductionWorkspaceRegistryBatch,
  validateProductionWorkspaceRegistryRows,
} from "../validation/production-workspace-registry-validator.js";
import { validateConnectionProviderRows } from "../validation/connection-registry-validator.js";

export { PRODUCTION_WORKSPACE_REGISTRY_VERSION };

type ProductionWorkspaceRegistryBatch = Record<ProductionWorkspaceRegistryId, ProductionWorkspaceRegistryRowBase[]>;

let validatedBatch: ProductionWorkspaceRegistryBatch | undefined;

function buildSeedBatch(): ProductionWorkspaceRegistryBatch {
  return {
    [REG_WORKSPACE]: PRODUCTION_WORKSPACE_SEED_ROWS,
    [REG_READINESS_POLICY]: READINESS_POLICY_SEED_ROWS,
    [REG_CONNECTION_PROVIDER]: CONNECTION_PROVIDER_SEED_ROWS,
    [REG_IDENTITY_PROVIDER]: IDENTITY_PROVIDER_SEED_ROWS,
    [REG_EXECUTIVE_POLICY]: EXECUTIVE_POLICY_SEED_ROWS,
    [REG_FINANCIAL_POLICY]: FINANCIAL_POLICY_SEED_ROWS,
    [REG_OPTIMIZATION_POLICY]: OPTIMIZATION_POLICY_SEED_ROWS,
    [REG_IDENTITY_MONITOR]: IDENTITY_MONITOR_SEED_ROWS,
  };
}

export function getValidatedProductionWorkspaceRegistryBatch(): ProductionWorkspaceRegistryBatch {
  if (!validatedBatch) {
    const batch = buildSeedBatch();
    validateProductionWorkspaceRegistryBatch(batch);
    validateConnectionProviderRows(batch[REG_CONNECTION_PROVIDER]);
    validatedBatch = batch;
  }
  return validatedBatch;
}

export function resetProductionWorkspaceRegistryBatchForTests(): void {
  validatedBatch = undefined;
}

export function loadProductionWorkspaceRegistryRows(
  registryId: ProductionWorkspaceRegistryId,
  query?: RegistryQuery,
): ProductionWorkspaceRegistryRowBase[] {
  const batch = getValidatedProductionWorkspaceRegistryBatch();
  let rows = batch[registryId] ?? [];
  if (query?.registryRowId) {
    rows = rows.filter((row) => row.id === query.registryRowId);
  }
  validateProductionWorkspaceRegistryRows(registryId, rows);
  return rows;
}

export function listProductionWorkspaceRegistryFoundationStatus(): Array<{
  registryId: ProductionWorkspaceRegistryId;
  wired: boolean;
  rowCount: number;
}> {
  const batch = getValidatedProductionWorkspaceRegistryBatch();
  return PRODUCTION_WORKSPACE_REGISTRY_IDS.map((registryId) => ({
    registryId,
    wired: true,
    rowCount: batch[registryId]?.length ?? 0,
  }));
}
