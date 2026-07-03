/**
 * G6-04 — Operational readiness certification service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  OperationalReadinessOverview,
  OperationalReadinessScanResult,
} from "../contracts/operational-readiness-types.js";
import { OPERATIONAL_READINESS_CERTIFICATION_VERSION } from "../contracts/operational-readiness-types.js";
import { recordOperationalReadinessEklsObservation } from "../ekls/operational-readiness-ekls-integration.js";
import { validateOperationalReadinessPillowGovernance } from "../governance/operational-readiness-pillow-governance.js";
import { runOperationalReadinessPluginValidators } from "../plugins/operational-readiness-plugin-host.js";
import {
  listOperationalReadinessDomains,
  resolveOperationalReadinessRules,
} from "../registry/operational-readiness-registry-resolver.js";
import {
  computeOperationalScore,
  deriveOperationalReadinessStatus,
} from "./operational-score-engine.js";
import {
  analyseOperationalRisks,
  validateAutomationReadiness,
  validateCommerceReadiness,
  validateExternalDependencyReadiness,
  validateIncidentReadiness,
  validateMonitoringReadiness,
  validateOperationalRules,
  validateProviderReadiness,
  validateRecoveryReadiness,
} from "../validation/operational-readiness-validator.js";

let lastScan: OperationalReadinessScanResult | undefined;

export function getOperationalReadinessOverview(
  context: RegistryLoaderContext = {},
): OperationalReadinessOverview {
  const rules = resolveOperationalReadinessRules(context);
  return {
    frameworkVersion: OPERATIONAL_READINESS_CERTIFICATION_VERSION,
    ruleCount: rules.length,
    readinessDomainCount: listOperationalReadinessDomains(context).length,
    lastScanId: lastScan?.scanId,
    lastStatus: lastScan?.status,
    generatedAt: new Date().toISOString(),
  };
}

export function getLastOperationalReadinessScan(): OperationalReadinessScanResult | undefined {
  return lastScan;
}

export function runOperationalScan(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): OperationalReadinessScanResult {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const governance = validateOperationalReadinessPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "operational_scan",
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const blocked: OperationalReadinessScanResult = {
      scanId: randomUUID(),
      correlationId: randomUUID(),
      status: "blocked",
      score: 0,
      blockers: [{
        blockerId: "pillow-blocked",
        ruleId: "pillow-governance",
        ruleKind: "governance",
        readinessDomain: "operational_readiness",
        serviceId: "platform",
        severity: "critical",
        message: governance.reason,
      }],
      warnings: [],
      dependencies: [],
      riskRegister: [],
      executiveRecommendations: ["Resolve Pillow governance rejection"],
      scannedAt: new Date().toISOString(),
      discoverySource: "REG-CERTIFICATION-OPERATIONAL",
    };
    lastScan = blocked;
    return blocked;
  }

  const rules = resolveOperationalReadinessRules(context);

  const automation = validateAutomationReadiness(rules, context);
  const commerce = validateCommerceReadiness(rules, context);
  const external = validateExternalDependencyReadiness(rules, context);
  const provider = validateProviderReadiness(rules, context);
  const monitoring = validateMonitoringReadiness(rules, context);
  const incident = validateIncidentReadiness(rules, context);
  const recovery = validateRecoveryReadiness(rules, context);
  const core = validateOperationalRules(
    rules.filter((rule) =>
      !["automation", "commerce", "external_dependency", "provider", "monitoring", "alerting", "observability", "recovery"].includes(rule.ruleKind),
    ),
    context,
  );

  const pluginFindings = runOperationalReadinessPluginValidators({ workspaceId: input.workspaceId });

  const blockers = [
    ...automation.blockers,
    ...commerce.blockers,
    ...external.blockers,
    ...provider.blockers,
    ...monitoring.blockers,
    ...incident.blockers,
    ...recovery.blockers,
    ...core.blockers,
    ...pluginFindings.filter((f) => f.severity === "critical" || f.severity === "high"),
  ];
  const warnings = [
    ...automation.warnings,
    ...commerce.warnings,
    ...external.warnings,
    ...provider.warnings,
    ...monitoring.warnings,
    ...incident.warnings,
    ...recovery.warnings,
    ...core.warnings,
    ...pluginFindings.filter((f) => f.severity !== "critical" && f.severity !== "high"),
  ];
  const dependencies = [
    ...automation.dependencies,
    ...commerce.dependencies,
    ...external.dependencies,
    ...provider.dependencies,
    ...monitoring.dependencies,
    ...incident.dependencies,
    ...recovery.dependencies,
    ...core.dependencies,
  ];

  const status = deriveOperationalReadinessStatus({
    blockers,
    warnings,
    pillowBlocked: false,
  });
  const dependenciesSatisfied = dependencies.filter((entry) => entry.satisfied).length;
  const score = computeOperationalScore({
    blockers,
    warnings,
    dependenciesSatisfied,
    dependenciesTotal: dependencies.length,
  });
  const { riskRegister, executiveRecommendations } = analyseOperationalRisks({ blockers, warnings });

  const scanId = randomUUID();
  const result: OperationalReadinessScanResult = {
    scanId,
    correlationId: randomUUID(),
    status,
    score,
    blockers,
    warnings,
    dependencies,
    riskRegister,
    executiveRecommendations,
    scannedAt: new Date().toISOString(),
    discoverySource: "REG-CERTIFICATION-OPERATIONAL",
  };

  lastScan = result;

  const eklsBase = {
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    scanId,
    pillowGovernance: true as const,
  };

  recordOperationalReadinessEklsObservation({
    ...eklsBase,
    kind: "operational_scan_completed",
    summary: `Operational scan ${status} score=${score}`,
    signalValue: score,
  });

  for (const blocker of blockers) {
    recordOperationalReadinessEklsObservation({
      ...eklsBase,
      kind: "operational_blocker_detected",
      summary: blocker.message,
    });
  }

  for (const warning of warnings) {
    recordOperationalReadinessEklsObservation({
      ...eklsBase,
      kind: "operational_warning",
      summary: warning.message,
    });
  }

  if (process.env.RECOVERY_DISABLED !== "true" && blockers.length === 0) {
    recordOperationalReadinessEklsObservation({
      ...eklsBase,
      kind: "operational_recovered",
      summary: "Operational readiness recovery validated",
    });
  }

  if (status === "ready" || status === "ready_with_conditions") {
    recordOperationalReadinessEklsObservation({
      ...eklsBase,
      kind: "operational_certified",
      summary: `Operational readiness certified with status ${status}`,
      signalValue: score,
    });
  }

  return result;
}

export function resetOperationalReadinessStateForTests(): void {
  lastScan = undefined;
}
