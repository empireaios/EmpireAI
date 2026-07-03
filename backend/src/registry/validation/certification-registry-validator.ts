/**
 * G6-00 — Certification registry validation.
 */

import type { CertificationRegistryId } from "../types/registry-ids.js";
import {
  certificationCheckConfigurationSchema,
  certificationDomainConfigurationSchema,
  certificationGateConfigurationSchema,
  platformIntegrityRuleConfigurationSchema,
  securityGovernanceRuleConfigurationSchema,
  infrastructureDeploymentRuleConfigurationSchema,
  operationalReadinessRuleConfigurationSchema,
  businessOperationsRuleConfigurationSchema,
  performanceCertificationRuleConfigurationSchema,
  executiveOperationsRuleConfigurationSchema,
  failureRecoveryRuleConfigurationSchema,
  productionSimulationScenarioConfigurationSchema,
  finalReadinessRuleConfigurationSchema,
  certificationRegistryRowBaseSchema,
  type CertificationRegistryRowBase,
} from "../types/certification-registry-types.js";

export class CertificationRegistryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CertificationRegistryValidationError";
  }
}

export function validateCertificationRegistryRows(
  registryId: CertificationRegistryId,
  rows: CertificationRegistryRowBase[],
): void {
  const seen = new Set<string>();
  for (const row of rows) {
    try {
      certificationRegistryRowBaseSchema.parse(row);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new CertificationRegistryValidationError(
        `${registryId}: invalid row ${row.id}: ${detail}`,
      );
    }
    if (seen.has(row.id)) {
      throw new CertificationRegistryValidationError(`${registryId}: duplicate row id ${row.id}`);
    }
    seen.add(row.id);
    validateCertificationRowConfiguration(registryId, row);
  }
}

function validateCertificationRowConfiguration(
  registryId: CertificationRegistryId,
  row: CertificationRegistryRowBase,
): void {
  const config = row.configuration;
  switch (registryId) {
    case "REG-CERTIFICATION-DOMAIN":
      certificationDomainConfigurationSchema.parse(config.certificationDomain);
      break;
    case "REG-CERTIFICATION-CHECK":
      certificationCheckConfigurationSchema.parse(config.certificationCheck);
      break;
    case "REG-CERTIFICATION-GATE":
      certificationGateConfigurationSchema.parse(config.certificationGate);
      break;
    case "REG-CERTIFICATION-INTEGRITY":
      platformIntegrityRuleConfigurationSchema.parse(config.platformIntegrityRule);
      break;
    case "REG-CERTIFICATION-SECURITY":
      securityGovernanceRuleConfigurationSchema.parse(config.securityGovernanceRule);
      break;
    case "REG-CERTIFICATION-DEPLOYMENT":
      infrastructureDeploymentRuleConfigurationSchema.parse(config.infrastructureDeploymentRule);
      break;
    case "REG-CERTIFICATION-OPERATIONAL":
      operationalReadinessRuleConfigurationSchema.parse(config.operationalReadinessRule);
      break;
    case "REG-CERTIFICATION-BUSINESS":
      businessOperationsRuleConfigurationSchema.parse(config.businessOperationsRule);
      break;
    case "REG-CERTIFICATION-PERFORMANCE":
      performanceCertificationRuleConfigurationSchema.parse(config.performanceCertificationRule);
      break;
    case "REG-CERTIFICATION-EXECUTIVE":
      executiveOperationsRuleConfigurationSchema.parse(config.executiveOperationsRule);
      break;
    case "REG-CERTIFICATION-FAILURE-RECOVERY":
      failureRecoveryRuleConfigurationSchema.parse(config.failureRecoveryRule);
      break;
    case "REG-CERTIFICATION-SIMULATION":
      productionSimulationScenarioConfigurationSchema.parse(config.productionSimulationScenario);
      break;
    case "REG-CERTIFICATION-FINAL-READINESS":
      finalReadinessRuleConfigurationSchema.parse(config.finalReadinessRule);
      break;
    default:
      throw new CertificationRegistryValidationError(`Unknown certification registry: ${registryId}`);
  }
}

export function validateCertificationRegistryBatch(
  batch: Record<CertificationRegistryId, CertificationRegistryRowBase[]>,
): void {
  for (const [registryId, rows] of Object.entries(batch) as Array<
    [CertificationRegistryId, CertificationRegistryRowBase[]]
  >) {
    validateCertificationRegistryRows(registryId, rows);
  }
}
