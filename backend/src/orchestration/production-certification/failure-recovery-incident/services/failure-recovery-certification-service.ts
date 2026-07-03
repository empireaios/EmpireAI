/**
 * G6-08 — Failure recovery certification service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  FailureRecoveryOverview,
  FailureRecoveryScanResult,
} from "../contracts/failure-recovery-incident-types.js";
import { FAILURE_RECOVERY_INCIDENT_CERTIFICATION_VERSION } from "../contracts/failure-recovery-incident-types.js";
import { recordFailureRecoveryEklsObservation } from "../ekls/failure-recovery-ekls-integration.js";
import { validateFailureRecoveryPillowGovernance } from "../governance/failure-recovery-pillow-governance.js";
import { runFailureRecoveryPluginValidators } from "../plugins/failure-recovery-plugin-host.js";
import {
  listFailureRecoveryDomains,
  resolveFailureRecoveryRules,
} from "../registry/failure-recovery-registry-resolver.js";
import {
  computeExecutiveIncidentScore,
  deriveFailureRecoveryStatus,
} from "./executive-incident-score-engine.js";
import {
  analyseFailureRecoveryRisks,
  deriveEscalationStatus,
  deriveRecoveryReadiness,
  deriveRollbackReadiness,
  validateEklsEvidence,
  validateEscalation,
  validateFailureDetection,
  validateGuardianIntegration,
  validateIncidentClassification,
  validateRecoveryPath,
  validateRollbackPath,
} from "../validation/failure-recovery-certification-validator.js";

let lastScan: FailureRecoveryScanResult | undefined;

export function getFailureRecoveryOverview(context: RegistryLoaderContext = {}): FailureRecoveryOverview {
  const rules = resolveFailureRecoveryRules(context);
  return {
    frameworkVersion: FAILURE_RECOVERY_INCIDENT_CERTIFICATION_VERSION,
    ruleCount: rules.length,
    certificationDomainCount: listFailureRecoveryDomains(context).length,
    lastScanId: lastScan?.scanId,
    lastStatus: lastScan?.status,
    generatedAt: new Date().toISOString(),
  };
}

export function getLastFailureRecoveryScan(): FailureRecoveryScanResult | undefined {
  return lastScan;
}

export function runFailureRecoveryScan(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): FailureRecoveryScanResult {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const governance = validateFailureRecoveryPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "failure_recovery_scan",
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const blocked: FailureRecoveryScanResult = {
      scanId: randomUUID(),
      correlationId: randomUUID(),
      status: "blocked",
      incidentScore: 0,
      blockers: [{
        findingId: "pillow-blocked",
        ruleId: "pillow-governance",
        ruleKind: "governance",
        certificationDomain: "failure_recovery_incident",
        serviceId: "platform",
        severity: "critical",
        message: governance.reason,
      }],
      warnings: [],
      incidents: [],
      recoveryPaths: [],
      rollbackPaths: [],
      riskRegister: [],
      executiveRecommendations: ["Resolve Pillow governance rejection"],
      recoveryReadiness: { recoveryPathsReady: false, rollbackPathsReady: false, escalationRoutesReady: false },
      rollbackReadiness: { rollbackSafe: false, rollbackPathsValidated: false },
      escalationStatus: { escalationRoutesReady: false, manualInterventionRequired: true },
      scannedAt: new Date().toISOString(),
      discoverySource: "REG-CERTIFICATION-FAILURE-RECOVERY",
    };
    lastScan = blocked;
    return blocked;
  }

  const rules = resolveFailureRecoveryRules(context);

  const detection = validateFailureDetection(rules, context);
  const incident = validateIncidentClassification(rules, context);
  const recovery = validateRecoveryPath(rules, context);
  const rollback = validateRollbackPath(rules, context);
  const escalation = validateEscalation(rules, context);
  const guardian = validateGuardianIntegration(rules, context);
  const ekls = validateEklsEvidence(rules, context);
  const pluginFindings = runFailureRecoveryPluginValidators({ workspaceId: input.workspaceId });

  const blockers = [
    ...detection.blockers, ...incident.blockers, ...recovery.blockers, ...rollback.blockers,
    ...escalation.blockers, ...guardian.blockers, ...ekls.blockers,
    ...pluginFindings.filter((f) => f.severity === "critical" || f.severity === "high"),
  ];
  const warnings = [
    ...detection.warnings, ...incident.warnings, ...recovery.warnings, ...rollback.warnings,
    ...escalation.warnings, ...guardian.warnings, ...ekls.warnings,
    ...pluginFindings.filter((f) => f.severity !== "critical" && f.severity !== "high"),
  ];
  const incidents = [
    ...detection.incidents, ...incident.incidents, ...recovery.incidents, ...rollback.incidents,
    ...escalation.incidents, ...guardian.incidents, ...ekls.incidents,
  ];
  const recoveryPaths = [
    ...detection.recoveryPaths, ...incident.recoveryPaths, ...recovery.recoveryPaths,
    ...rollback.recoveryPaths, ...escalation.recoveryPaths, ...guardian.recoveryPaths, ...ekls.recoveryPaths,
  ];
  const rollbackPaths = [
    ...detection.rollbackPaths, ...incident.rollbackPaths, ...recovery.rollbackPaths,
    ...rollback.rollbackPaths, ...escalation.rollbackPaths, ...guardian.rollbackPaths, ...ekls.rollbackPaths,
  ];

  const status = deriveFailureRecoveryStatus({ blockers, warnings, pillowBlocked: false });
  const pathsReady = [...recoveryPaths, ...rollbackPaths].filter((p) => p.pathReady).length;
  const pathsTotal = recoveryPaths.length + rollbackPaths.length;
  const incidentScore = computeExecutiveIncidentScore({ blockers, warnings, pathsReady, pathsTotal });
  const recoveryReadiness = deriveRecoveryReadiness(recoveryPaths, rollbackPaths, incidents);
  const rollbackReadiness = deriveRollbackReadiness(rollbackPaths);
  const escalationStatus = deriveEscalationStatus(blockers);
  const { riskRegister, executiveRecommendations } = analyseFailureRecoveryRisks({ blockers, warnings });

  const scanId = randomUUID();
  const result: FailureRecoveryScanResult = {
    scanId,
    correlationId: randomUUID(),
    status,
    incidentScore,
    blockers,
    warnings,
    incidents,
    recoveryPaths,
    rollbackPaths,
    riskRegister,
    executiveRecommendations,
    recoveryReadiness,
    rollbackReadiness,
    escalationStatus,
    scannedAt: new Date().toISOString(),
    discoverySource: "REG-CERTIFICATION-FAILURE-RECOVERY",
  };

  lastScan = result;

  const eklsBase = {
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    scanId,
    pillowGovernance: true as const,
  };

  recordFailureRecoveryEklsObservation({
    ...eklsBase,
    kind: "failure_recovery_scan_completed",
    summary: `Failure recovery scan ${status} score=${incidentScore}`,
    signalValue: incidentScore,
  });

  if (blockers.some((b) => b.ruleKind === "incident_classification" || b.ruleKind === "failure_detection")) {
    recordFailureRecoveryEklsObservation({
      ...eklsBase,
      kind: "incident_detected",
      summary: "Incident detected during certification scan",
    });
  }

  if (incidents.some((i) => i.classified)) {
    recordFailureRecoveryEklsObservation({
      ...eklsBase,
      kind: "incident_classified",
      summary: "Incident classification validated",
    });
  }

  if (recoveryPaths.some((p) => p.pathReady)) {
    recordFailureRecoveryEklsObservation({
      ...eklsBase,
      kind: "recovery_path_validated",
      summary: "Recovery path validated",
    });
  }

  if (rollbackPaths.some((p) => p.pathReady)) {
    recordFailureRecoveryEklsObservation({
      ...eklsBase,
      kind: "rollback_path_validated",
      summary: "Rollback path validated",
    });
  }

  if (process.env.FRI_MANUAL_INTERVENTION === "true" || process.env.FRI_UNRECOVERABLE_NO_ESCALATION === "true") {
    recordFailureRecoveryEklsObservation({
      ...eklsBase,
      kind: "escalation_required",
      summary: "Escalation required for incident handling",
    });
  }

  for (const blocker of blockers) {
    recordFailureRecoveryEklsObservation({
      ...eklsBase,
      kind: blocker.ruleKind === "incident_classification" ? "incident_detected" : "failure_recovery_scan_completed",
      summary: blocker.message,
    });
  }

  if (status === "pass" || status === "pass_with_conditions") {
    recordFailureRecoveryEklsObservation({
      ...eklsBase,
      kind: "failure_recovery_certified",
      summary: `Failure recovery certified with status ${status}`,
      signalValue: incidentScore,
    });
  }

  return result;
}

export function resetFailureRecoveryStateForTests(): void {
  lastScan = undefined;
}
