/**
 * G6-00 — Certification registry resolver.
 */

import type { CertificationRegistryRowBase } from "../../../registry/types/certification-registry-types.js";
import {
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
} from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext, RegistryQuery } from "../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";
import type { CertificationGateModel } from "../contracts/production-certification-types.js";
import {
  certificationCheckConfigurationSchema,
  certificationDomainConfigurationSchema,
  certificationGateConfigurationSchema,
} from "../../../registry/types/certification-registry-types.js";

export type CertificationRegistrySnapshot = {
  domains: CertificationRegistryRowBase[];
  checks: CertificationRegistryRowBase[];
  gates: CertificationRegistryRowBase[];
  resolvedAt: string;
  registrySource: "REG-CERTIFICATION-DOMAIN|REG-CERTIFICATION-CHECK|REG-CERTIFICATION-GATE";
};

export function resolveCertificationRegistrySnapshot(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): CertificationRegistrySnapshot {
  const loader = getRegistryLoader();
  return {
    domains: loader.resolve(context, REG_CERTIFICATION_DOMAIN, query).rows as CertificationRegistryRowBase[],
    checks: loader.resolve(context, REG_CERTIFICATION_CHECK, query).rows as CertificationRegistryRowBase[],
    gates: loader.resolve(context, REG_CERTIFICATION_GATE, query).rows as CertificationRegistryRowBase[],
    resolvedAt: new Date().toISOString(),
    registrySource: "REG-CERTIFICATION-DOMAIN|REG-CERTIFICATION-CHECK|REG-CERTIFICATION-GATE",
  };
}

export function listCertificationRegistryIds(): string[] {
  return [REG_CERTIFICATION_DOMAIN, REG_CERTIFICATION_CHECK, REG_CERTIFICATION_GATE, REG_CERTIFICATION_INTEGRITY, REG_CERTIFICATION_SECURITY, REG_CERTIFICATION_DEPLOYMENT, REG_CERTIFICATION_OPERATIONAL, REG_CERTIFICATION_BUSINESS, REG_CERTIFICATION_PERFORMANCE, REG_CERTIFICATION_EXECUTIVE, REG_CERTIFICATION_FAILURE_RECOVERY, REG_CERTIFICATION_SIMULATION, REG_CERTIFICATION_FINAL_READINESS];
}

export function listCertificationGates(
  context: RegistryLoaderContext = {},
): CertificationGateModel[] {
  const snapshot = resolveCertificationRegistrySnapshot(context);
  return snapshot.gates.map((gate) => {
    const config = certificationGateConfigurationSchema.parse(gate.configuration.certificationGate);
    return {
      gateId: gate.id,
      domainId: config.domainId,
      checkIds: config.checkIds,
      requiredForProduction: config.requiredForProduction,
      gateOrder: config.gateOrder,
    };
  });
}

export function getCertificationCheckRow(
  context: RegistryLoaderContext,
  checkId: string,
): CertificationRegistryRowBase | undefined {
  const snapshot = resolveCertificationRegistrySnapshot(context, { registryRowId: checkId });
  return snapshot.checks[0];
}

export function getCertificationDomainRow(
  context: RegistryLoaderContext,
  domainRowId: string,
): CertificationRegistryRowBase | undefined {
  const snapshot = resolveCertificationRegistrySnapshot(context, { registryRowId: domainRowId });
  return snapshot.domains[0];
}

export function listChecksForDomain(
  context: RegistryLoaderContext,
  domainId: string,
): CertificationRegistryRowBase[] {
  const snapshot = resolveCertificationRegistrySnapshot(context);
  return snapshot.checks.filter((row) => {
    const config = certificationCheckConfigurationSchema.parse(row.configuration.certificationCheck);
    return config.domainId === domainId;
  });
}

export function listCertificationDomains(context: RegistryLoaderContext = {}) {
  const snapshot = resolveCertificationRegistrySnapshot(context);
  return snapshot.domains.map((row) => ({
    rowId: row.id,
    ...certificationDomainConfigurationSchema.parse(row.configuration.certificationDomain),
  }));
}
