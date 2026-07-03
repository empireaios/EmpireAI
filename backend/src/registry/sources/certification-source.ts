/**
 * G6-00 — Certification registry source adapter (EA-004 sole seed importer).
 */

import {
  CERTIFICATION_CHECK_SEED_ROWS,
  CERTIFICATION_DOMAIN_SEED_ROWS,
  CERTIFICATION_GATE_SEED_ROWS,
  PLATFORM_INTEGRITY_RULE_SEED_ROWS,
  SECURITY_GOVERNANCE_RULE_SEED_ROWS,
  INFRASTRUCTURE_DEPLOYMENT_RULE_SEED_ROWS,
  OPERATIONAL_READINESS_RULE_SEED_ROWS,
  BUSINESS_OPERATIONS_RULE_SEED_ROWS,
  PERFORMANCE_CERTIFICATION_RULE_SEED_ROWS,
  EXECUTIVE_OPERATIONS_RULE_SEED_ROWS,
  FAILURE_RECOVERY_RULE_SEED_ROWS,
  PRODUCTION_SIMULATION_SCENARIO_SEED_ROWS,
  FINAL_READINESS_DOMAIN_SEED_ROWS,
} from "../../orchestration/production-certification/data/certification-registry-seed.js";
import {
  CERTIFICATION_REGISTRY_IDS,
  REG_CERTIFICATION_CHECK,
  REG_CERTIFICATION_DOMAIN,
  REG_CERTIFICATION_GATE,
  REG_CERTIFICATION_INTEGRITY,
  REG_CERTIFICATION_SECURITY,
  REG_CERTIFICATION_DEPLOYMENT,
  REG_CERTIFICATION_OPERATIONAL,
  REG_CERTIFICATION_BUSINESS,
  REG_CERTIFICATION_PERFORMANCE,
  REG_CERTIFICATION_EXECUTIVE,
  REG_CERTIFICATION_FAILURE_RECOVERY,
  REG_CERTIFICATION_SIMULATION,
  REG_CERTIFICATION_FINAL_READINESS,
  type CertificationRegistryId,
} from "../types/registry-ids.js";
import {
  CERTIFICATION_REGISTRY_VERSION,
  type CertificationRegistryRowBase,
} from "../types/certification-registry-types.js";
import type { RegistryQuery } from "../types/registry-types.js";
import {
  validateCertificationRegistryBatch,
  validateCertificationRegistryRows,
} from "../validation/certification-registry-validator.js";

export { CERTIFICATION_REGISTRY_VERSION };

type CertificationRegistryBatch = Record<CertificationRegistryId, CertificationRegistryRowBase[]>;

let validatedBatch: CertificationRegistryBatch | undefined;

function buildSeedBatch(): CertificationRegistryBatch {
  return {
    [REG_CERTIFICATION_DOMAIN]: CERTIFICATION_DOMAIN_SEED_ROWS,
    [REG_CERTIFICATION_CHECK]: CERTIFICATION_CHECK_SEED_ROWS,
    [REG_CERTIFICATION_GATE]: CERTIFICATION_GATE_SEED_ROWS,
    [REG_CERTIFICATION_INTEGRITY]: PLATFORM_INTEGRITY_RULE_SEED_ROWS,
    [REG_CERTIFICATION_SECURITY]: SECURITY_GOVERNANCE_RULE_SEED_ROWS,
    [REG_CERTIFICATION_DEPLOYMENT]: INFRASTRUCTURE_DEPLOYMENT_RULE_SEED_ROWS,
    [REG_CERTIFICATION_OPERATIONAL]: OPERATIONAL_READINESS_RULE_SEED_ROWS,
    [REG_CERTIFICATION_BUSINESS]: BUSINESS_OPERATIONS_RULE_SEED_ROWS,
    [REG_CERTIFICATION_PERFORMANCE]: PERFORMANCE_CERTIFICATION_RULE_SEED_ROWS,
    [REG_CERTIFICATION_EXECUTIVE]: EXECUTIVE_OPERATIONS_RULE_SEED_ROWS,
    [REG_CERTIFICATION_FAILURE_RECOVERY]: FAILURE_RECOVERY_RULE_SEED_ROWS,
    [REG_CERTIFICATION_SIMULATION]: PRODUCTION_SIMULATION_SCENARIO_SEED_ROWS,
    [REG_CERTIFICATION_FINAL_READINESS]: FINAL_READINESS_DOMAIN_SEED_ROWS,
  };
}

export function getValidatedCertificationRegistryBatch(): CertificationRegistryBatch {
  if (!validatedBatch) {
    const batch = buildSeedBatch();
    validateCertificationRegistryBatch(batch);
    validatedBatch = batch;
  }
  return validatedBatch;
}

export function resetCertificationRegistryBatchForTests(): void {
  validatedBatch = undefined;
}

function filterRows(
  rows: CertificationRegistryRowBase[],
  query?: RegistryQuery,
): CertificationRegistryRowBase[] {
  if (!query?.registryRowId) {
    return rows;
  }
  return rows.filter((row) => row.id === query.registryRowId);
}

export function loadCertificationRegistryRows(
  registryId: CertificationRegistryId,
  query?: RegistryQuery,
): CertificationRegistryRowBase[] {
  if (!(CERTIFICATION_REGISTRY_IDS as readonly string[]).includes(registryId)) {
    throw new Error(`Not a certification registry: ${registryId}`);
  }
  const batch = getValidatedCertificationRegistryBatch();
  const rows = batch[registryId];
  validateCertificationRegistryRows(registryId, rows);
  return filterRows(rows, query);
}
