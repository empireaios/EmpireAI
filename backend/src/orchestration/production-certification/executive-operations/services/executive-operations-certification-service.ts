/**
 * G6-07 — Executive operations certification service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  ExecutiveOperationsOverview,
  ExecutiveOperationsScanResult,
} from "../contracts/executive-operations-types.js";
import { EXECUTIVE_OPERATIONS_CERTIFICATION_VERSION } from "../contracts/executive-operations-types.js";
import { recordExecutiveOperationsEklsObservation } from "../ekls/executive-operations-ekls-integration.js";
import { validateExecutiveOperationsPillowGovernance } from "../governance/executive-operations-pillow-governance.js";
import { runExecutiveOperationsPluginValidators } from "../plugins/executive-operations-plugin-host.js";
import {
  listExecutiveOperationsDomains,
  resolveExecutiveOperationsRules,
} from "../registry/executive-operations-registry-resolver.js";
import {
  computeExecutiveOperationsScore,
  deriveExecutiveOperationsStatus,
} from "./executive-operations-score-engine.js";
import {
  analyseExecutiveOperationsRisks,
  deriveActionSafety,
  deriveCockpitHealth,
  validateApprovalFlow,
  validateAuthorizationCentre,
  validateAutomationCentre,
  validateCockpitOperations,
  validateCommandCentre,
  validateDecisionVisibility,
  validateExecutiveActionSafety,
  validateExecutiveHome,
  validateExecutiveReporting,
  validateGlobalAiAssistant,
  validateReadinessVisibility,
  validateRelationshipGraph,
} from "../validation/executive-operations-certification-validator.js";

let lastScan: ExecutiveOperationsScanResult | undefined;

export function getExecutiveOperationsOverview(
  context: RegistryLoaderContext = {},
): ExecutiveOperationsOverview {
  const rules = resolveExecutiveOperationsRules(context);
  return {
    frameworkVersion: EXECUTIVE_OPERATIONS_CERTIFICATION_VERSION,
    ruleCount: rules.length,
    executiveDomainCount: listExecutiveOperationsDomains(context).length,
    lastScanId: lastScan?.scanId,
    lastStatus: lastScan?.status,
    generatedAt: new Date().toISOString(),
  };
}

export function getLastExecutiveOperationsScan(): ExecutiveOperationsScanResult | undefined {
  return lastScan;
}

export function runExecutiveOperationsScan(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): ExecutiveOperationsScanResult {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const governance = validateExecutiveOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "executive_scan",
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const blocked: ExecutiveOperationsScanResult = {
      scanId: randomUUID(),
      correlationId: randomUUID(),
      status: "blocked",
      executiveScore: 0,
      blockers: [{
        blockerId: "pillow-blocked",
        ruleId: "pillow-governance",
        ruleKind: "governance",
        executiveDomain: "executive_operations",
        serviceId: "platform",
        severity: "critical",
        message: governance.reason,
      }],
      warnings: [],
      visibility: [],
      riskRegister: [],
      executiveRecommendations: ["Resolve Pillow governance rejection"],
      cockpitHealth: {
        executiveHomeReady: false,
        commandCentreReady: false,
        automationCentreReady: false,
        approvalQueueVisible: false,
      },
      actionSafety: {
        actionSafe: false,
        approvalAuthorityVerified: false,
        visibilityAuthorityVerified: false,
      },
      scannedAt: new Date().toISOString(),
      discoverySource: "REG-CERTIFICATION-EXECUTIVE",
    };
    lastScan = blocked;
    return blocked;
  }

  const rules = resolveExecutiveOperationsRules(context);

  const cockpit = validateCockpitOperations(rules, context);
  const home = validateExecutiveHome(rules, context);
  const command = validateCommandCentre(rules, context);
  const automation = validateAutomationCentre(rules, context);
  const authorization = validateAuthorizationCentre(rules, context);
  const relationship = validateRelationshipGraph(rules, context);
  const assistant = validateGlobalAiAssistant(rules, context);
  const approval = validateApprovalFlow(rules, context);
  const reporting = validateExecutiveReporting(rules, context);
  const decision = validateDecisionVisibility(rules, context);
  const readiness = validateReadinessVisibility(rules, context);
  const actionSafety = validateExecutiveActionSafety(rules, context);
  const pluginFindings = runExecutiveOperationsPluginValidators({ workspaceId: input.workspaceId });

  const blockers = [
    ...cockpit.blockers, ...home.blockers, ...command.blockers, ...automation.blockers,
    ...authorization.blockers, ...relationship.blockers, ...assistant.blockers, ...approval.blockers,
    ...reporting.blockers, ...decision.blockers, ...readiness.blockers, ...actionSafety.blockers,
    ...pluginFindings.filter((f) => f.severity === "critical" || f.severity === "high"),
  ];
  const warnings = [
    ...cockpit.warnings, ...home.warnings, ...command.warnings, ...automation.warnings,
    ...authorization.warnings, ...relationship.warnings, ...assistant.warnings, ...approval.warnings,
    ...reporting.warnings, ...decision.warnings, ...readiness.warnings, ...actionSafety.warnings,
    ...pluginFindings.filter((f) => f.severity !== "critical" && f.severity !== "high"),
  ];
  const visibility = [
    ...cockpit.visibility, ...home.visibility, ...command.visibility, ...automation.visibility,
    ...authorization.visibility, ...relationship.visibility, ...assistant.visibility, ...approval.visibility,
    ...reporting.visibility, ...decision.visibility, ...readiness.visibility, ...actionSafety.visibility,
  ];

  const status = deriveExecutiveOperationsStatus({ blockers, warnings, pillowBlocked: false });
  const visibilitySatisfied = visibility.filter((entry) => entry.satisfied).length;
  const executiveScore = computeExecutiveOperationsScore({
    blockers,
    warnings,
    visibilitySatisfied,
    visibilityTotal: visibility.length,
  });
  const cockpitHealth = deriveCockpitHealth(visibility);
  const actionSafetySummary = deriveActionSafety(visibility);
  const { riskRegister, executiveRecommendations } = analyseExecutiveOperationsRisks({ blockers, warnings });

  const scanId = randomUUID();
  const result: ExecutiveOperationsScanResult = {
    scanId,
    correlationId: randomUUID(),
    status,
    executiveScore,
    blockers,
    warnings,
    visibility,
    riskRegister,
    executiveRecommendations,
    cockpitHealth,
    actionSafety: actionSafetySummary,
    scannedAt: new Date().toISOString(),
    discoverySource: "REG-CERTIFICATION-EXECUTIVE",
  };

  lastScan = result;

  const eklsBase = {
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    scanId,
    pillowGovernance: true as const,
  };

  recordExecutiveOperationsEklsObservation({
    ...eklsBase,
    kind: "executive_operations_scan_completed",
    summary: `Executive operations scan ${status} score=${executiveScore}`,
    signalValue: executiveScore,
  });

  for (const blocker of blockers) {
    recordExecutiveOperationsEklsObservation({
      ...eklsBase,
      kind: blocker.ruleKind === "executive_action_safety"
        ? "executive_action_safety_issue"
        : "executive_operations_failure",
      summary: blocker.message,
    });
  }

  for (const warning of warnings) {
    recordExecutiveOperationsEklsObservation({
      ...eklsBase,
      kind: "executive_operations_warning",
      summary: warning.message,
    });
  }

  if (status === "pass" || status === "pass_with_conditions") {
    recordExecutiveOperationsEklsObservation({
      ...eklsBase,
      kind: "executive_operations_certified",
      summary: `Executive operations certified with status ${status}`,
      signalValue: executiveScore,
    });
  }

  return result;
}

export function resetExecutiveOperationsStateForTests(): void {
  lastScan = undefined;
}
