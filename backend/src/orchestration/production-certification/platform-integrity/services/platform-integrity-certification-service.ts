/**
 * G6-01 — Platform integrity certification service (orchestrator).
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  PlatformIntegrityOverview,
  PlatformIntegrityScanResult,
  PlatformIntegrityViolation,
} from "../contracts/platform-integrity-types.js";
import { PLATFORM_INTEGRITY_CERTIFICATION_VERSION } from "../contracts/platform-integrity-types.js";
import { recordPlatformIntegrityEklsObservation } from "../ekls/platform-integrity-ekls-integration.js";
import { validatePlatformIntegrityPillowGovernance } from "../governance/platform-integrity-pillow-governance.js";
import { runPlatformIntegrityPluginValidators } from "../plugins/platform-integrity-plugin-host.js";
import {
  listPlatformIntegritySubsystems,
  resolvePlatformIntegrityRules,
} from "../registry/platform-integrity-registry-resolver.js";
import { derivePlatformIntegrityStatus, scorePlatformIntegrityStatus } from "./platform-integrity-scoring-service.js";
import { detectArchitecturalDrift, detectMissingCertificationRecords } from "../validation/architecture-drift-detector.js";
import { detectCircularDependencies, detectBrokenIntegrationPaths, validateDependencyRules } from "../validation/dependency-validator.js";
import {
  detectDuplicateOwnership,
  detectInvalidOwnership,
  detectMissingOwnership,
  validateOwnershipRules,
} from "../validation/ownership-validator.js";
import {
  validateModuleIntegrity,
  validateProgrammeIntegrity,
  validateSubsystemIntegrity,
} from "../validation/programme-integrity-validator.js";

let lastScan: PlatformIntegrityScanResult | undefined;

export function getPlatformIntegrityOverview(
  context: RegistryLoaderContext = {},
): PlatformIntegrityOverview {
  const rules = resolvePlatformIntegrityRules(context);
  return {
    frameworkVersion: PLATFORM_INTEGRITY_CERTIFICATION_VERSION,
    ruleCount: rules.length,
    subsystemCount: listPlatformIntegritySubsystems(context).length,
    lastScanId: lastScan?.scanId,
    lastStatus: lastScan?.status,
    generatedAt: new Date().toISOString(),
  };
}

export function getLastPlatformIntegrityScan(): PlatformIntegrityScanResult | undefined {
  return lastScan;
}

export function runPlatformIntegrityScan(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): PlatformIntegrityScanResult {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const governance = validatePlatformIntegrityPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "scan",
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const blocked: PlatformIntegrityScanResult = {
      scanId: randomUUID(),
      correlationId: randomUUID(),
      status: "blocked",
      score: 0,
      ownershipMatrix: [],
      dependencyMatrix: [],
      violations: [
        {
          violationId: "pillow-blocked",
          ruleId: "pillow-governance",
          ruleKind: "governance",
          subsystemId: "platform",
          severity: "critical",
          message: governance.reason,
        },
      ],
      driftFindings: [],
      duplicateOwnershipFindings: [],
      circularDependencyFindings: [],
      programmeResults: [],
      scannedAt: new Date().toISOString(),
      discoverySource: "REG-CERTIFICATION-INTEGRITY",
    };
    lastScan = blocked;
    return blocked;
  }

  const rules = resolvePlatformIntegrityRules(context);
  const { matrix: ownershipMatrix } = validateOwnershipRules(rules);
  const ownershipViolations: PlatformIntegrityViolation[] = [
    ...detectMissingOwnership(rules),
    ...detectInvalidOwnership(rules),
  ];
  const duplicateOwnershipFindings = detectDuplicateOwnership(rules);

  const { matrix: dependencyMatrix, violations: dependencyViolations } = validateDependencyRules(rules);
  const circularDependencyFindings = detectCircularDependencies(dependencyMatrix);
  const brokenPathFindings = detectBrokenIntegrationPaths(rules);

  const driftFindings = detectArchitecturalDrift(rules);
  const programmeResults = validateProgrammeIntegrity(rules);
  const missingCertFindings = detectMissingCertificationRecords(programmeResults);

  const moduleStatus = validateModuleIntegrity(rules);
  const subsystemStatus = validateSubsystemIntegrity(rules, { workspaceId: input.workspaceId });

  const pluginViolations = runPlatformIntegrityPluginValidators({ workspaceId: input.workspaceId });

  const violations = [
    ...ownershipViolations,
    ...dependencyViolations,
    ...brokenPathFindings,
    ...missingCertFindings,
    ...pluginViolations,
  ];

  const criticalCount = [...violations, ...driftFindings, ...duplicateOwnershipFindings, ...circularDependencyFindings]
    .filter((v) => v.severity === "critical").length;
  const highCount = [...violations, ...driftFindings, ...duplicateOwnershipFindings, ...circularDependencyFindings]
    .filter((v) => v.severity === "high").length;
  const mediumCount = [...violations, ...driftFindings, ...duplicateOwnershipFindings, ...circularDependencyFindings]
    .filter((v) => v.severity === "medium").length;
  const programmeFailures = programmeResults.filter((p) => p.status === "fail").length;

  const status = derivePlatformIntegrityStatus({
    criticalCount,
    highCount,
    mediumCount,
    moduleStatus,
    subsystemStatus,
    programmeFailures,
  });
  const score = scorePlatformIntegrityStatus(status);

  const scanId = randomUUID();
  const correlationId = randomUUID();
  const result: PlatformIntegrityScanResult = {
    scanId,
    correlationId,
    status,
    score,
    ownershipMatrix,
    dependencyMatrix,
    violations,
    driftFindings,
    duplicateOwnershipFindings,
    circularDependencyFindings,
    programmeResults,
    scannedAt: new Date().toISOString(),
    discoverySource: "REG-CERTIFICATION-INTEGRITY",
  };

  lastScan = result;

  recordPlatformIntegrityEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    scanId,
    kind: "platform_integrity_scan",
    summary: `Platform integrity scan ${status} score=${score} rules=${rules.length}`,
    signalValue: score,
    pillowGovernance: true,
  });

  for (const finding of ownershipViolations) {
    recordPlatformIntegrityEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      scanId,
      kind: "ownership_violation",
      summary: finding.message,
      pillowGovernance: true,
    });
  }

  for (const finding of driftFindings) {
    recordPlatformIntegrityEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      scanId,
      kind: "architecture_drift",
      summary: finding.message,
      pillowGovernance: true,
    });
  }

  for (const finding of dependencyViolations) {
    recordPlatformIntegrityEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      scanId,
      kind: "dependency_violation",
      summary: finding.message,
      pillowGovernance: true,
    });
  }

  if (status === "pass" || status === "pass_with_conditions") {
    recordPlatformIntegrityEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      scanId,
      kind: "integrity_certified",
      summary: `Platform integrity certified with status ${status}`,
      signalValue: score,
      pillowGovernance: true,
    });
  }

  return result;
}

export function resetPlatformIntegrityStateForTests(): void {
  lastScan = undefined;
}
