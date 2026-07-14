/** E5-13 — Enterprise Constitutional Guardian service orchestrator. */

import { getGuardianAuditHistory } from "./audit-logging.js";
import { buildGuardianConfiguration, type ConstitutionalGuardianConfiguration } from "./configuration.js";
import {
  buildConstitutionHealthEntries,
  buildProtectedAssets,
  buildConstitutionViolations,
  buildRepositoryIntegrity,
  buildArchitectureIntegrity,
  buildProtectionEvents,
} from "./protection.js";
import { buildGuardianMonitoringStatus } from "./monitoring.js";
import { buildGuardianExecutiveReport, buildGuardianMetrics } from "./reporting.js";
import { resetGuardianAuditForTesting } from "./audit-logging.js";
import type { GuardianProtectionEvent, GuardianHealthStatus } from "./types.js";

let configuration = buildGuardianConfiguration();

export function getGuardianConfiguration(): ConstitutionalGuardianConfiguration {
  return { ...configuration };
}

export function updateGuardianConfiguration(
  overrides: Partial<ConstitutionalGuardianConfiguration>,
): ConstitutionalGuardianConfiguration {
  configuration = buildGuardianConfiguration({ ...configuration, ...overrides });
  return { ...configuration };
}

export function getGuardianHealthStatus(input: {
  healthScore: number;
  records: GuardianProtectionEvent[];
  unresolvedCritical: number;
}): GuardianHealthStatus {
  const history = getGuardianAuditHistory(1);
  return {
    status: input.healthScore >= 85 ? "healthy" : input.healthScore >= 70 ? "stable" : "attention",
    healthScore: input.healthScore,
    protectionEventCount: input.records.length,
    unresolvedCriticalCount: input.unresolvedCritical,
    auditEventCount: getGuardianAuditHistory(1000).length,
    lastEventAt: history[0]?.timestamp ?? null,
  };
}

export function buildGuardianSubsystems(input: {
  records: GuardianProtectionEvent[];
  constitutionHealth: string;
  healthScore: number;
  constitutionHealthScore: number;
  activeViolations: number;
  resolvedCount: number;
  unresolvedCritical: number;
  e5Gov: boolean;
  e5Trust: boolean;
  buildClean: boolean;
  computedAt: string;
}) {
  const auditHistory = getGuardianAuditHistory(100);
  const protectedAssets = buildProtectedAssets(input.records);
  const repositoryIntegrity = buildRepositoryIntegrity({
    buildClean: input.buildClean,
    healthScore: input.healthScore,
  });
  const architectureIntegrity = buildArchitectureIntegrity({
    e5Gov: input.e5Gov,
    healthScore: input.healthScore,
  });
  const constitutionHealthEntries = buildConstitutionHealthEntries({
    healthScore: input.constitutionHealthScore,
    e5Gov: input.e5Gov,
    e5Trust: input.e5Trust,
    unresolvedCritical: input.unresolvedCritical,
  });

  return {
    constitutionHealthEntries,
    protectedAssets,
    constitutionViolations: buildConstitutionViolations(input.records),
    repositoryIntegrity,
    architectureIntegrity,
    protectionEvents: buildProtectionEvents(input.records),
    guardianAuditHistory: auditHistory,
    monitoringStatus: buildGuardianMonitoringStatus({
      config: configuration,
      totalEvents: input.records.length,
      activeViolations: input.activeViolations,
      resolvedEvents: input.resolvedCount,
      constitutionHealthScore: input.constitutionHealthScore,
      lastScanAt: input.computedAt,
    }),
    executiveReport: buildGuardianExecutiveReport({
      constitutionHealth: input.constitutionHealth,
      constitutionHealthScore: input.constitutionHealthScore,
      protectedAssetCount: protectedAssets.length,
      activeViolations: input.activeViolations,
    }),
    metrics: buildGuardianMetrics({
      records: input.records,
      protectedAssetCount: protectedAssets.length,
      constitutionHealthScore: input.constitutionHealthScore,
      repositoryIntegrityScore: repositoryIntegrity[0]?.score ?? input.healthScore,
      architectureIntegrityScore: architectureIntegrity[0]?.score ?? input.healthScore,
    }),
    healthStatus: getGuardianHealthStatus({
      healthScore: input.healthScore,
      records: input.records,
      unresolvedCritical: input.unresolvedCritical,
    }),
  };
}

export function resetGuardianServiceForTesting(): void {
  configuration = buildGuardianConfiguration();
  resetGuardianAuditForTesting();
}

export { getGuardianAuditHistory };
