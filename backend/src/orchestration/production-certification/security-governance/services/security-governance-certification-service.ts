/**
 * G6-02 — Security & governance certification service (orchestrator).
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  SecurityGovernanceOverview,
  SecurityGovernanceScanResult,
  SecurityGovernanceViolation,
} from "../contracts/security-governance-types.js";
import { SECURITY_GOVERNANCE_CERTIFICATION_VERSION } from "../contracts/security-governance-types.js";
import { recordSecurityGovernanceEklsObservation } from "../ekls/security-governance-ekls-integration.js";
import { validateSecurityGovernancePillowGovernance } from "../governance/security-governance-pillow-governance.js";
import { runSecurityGovernancePluginValidators } from "../plugins/security-governance-plugin-host.js";
import {
  listSecurityGovernanceDomains,
  resolveSecurityGovernanceRules,
} from "../registry/security-governance-registry-resolver.js";
import { deriveSecurityGovernanceStatus, scoreSecurityGovernanceStatus } from "./security-governance-scoring-service.js";
import { validateBoundaryRules } from "../validation/boundary-validators.js";
import { validateBrainBoundaryRules } from "../validation/brain-boundary-validator.js";
import {
  detectCredentialExposure,
  detectHardcodedCredentials,
  detectTokenExposure,
} from "../validation/credential-exposure-validator.js";
import { validateEklsBoundaryRules } from "../validation/ekls-boundary-validator.js";
import { analyseExecutiveRisks } from "../validation/executive-risk-analyser.js";
import { validatePillowGovernanceRules } from "../validation/pillow-governance-validator.js";
import {
  detectUnauthorizedExecution,
  validatePluginSecurityRules,
} from "../validation/plugin-security-validator.js";
import { validateRegistryComplianceRules } from "../validation/registry-compliance-validator.js";
import { validateSecretHandlingRules } from "../validation/secret-handling-validator.js";
import { validateWorkspaceIsolationRules } from "../validation/workspace-isolation-validator.js";

let lastScan: SecurityGovernanceScanResult | undefined;

const GOVERNANCE_RULE_KINDS = new Set([
  "pillow_governance",
  "ekls_boundary",
  "registry_integrity",
  "governance",
  "brain_boundary",
]);

export function getSecurityGovernanceOverview(
  context: RegistryLoaderContext = {},
): SecurityGovernanceOverview {
  const rules = resolveSecurityGovernanceRules(context);
  return {
    frameworkVersion: SECURITY_GOVERNANCE_CERTIFICATION_VERSION,
    ruleCount: rules.length,
    securityDomainCount: listSecurityGovernanceDomains(context).length,
    lastScanId: lastScan?.scanId,
    lastStatus: lastScan?.status,
    generatedAt: new Date().toISOString(),
  };
}

export function getLastSecurityGovernanceScan(): SecurityGovernanceScanResult | undefined {
  return lastScan;
}

function countSeverity(findings: SecurityGovernanceViolation[], severity: SecurityGovernanceViolation["severity"]): number {
  return findings.filter((f) => f.severity === severity).length;
}

function runScanInternal(input: {
  context: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  scanType: SecurityGovernanceScanResult["scanType"];
}): SecurityGovernanceScanResult {
  const rules = resolveSecurityGovernanceRules(input.context);
  const ctx = { actorId: input.actorId, workspaceId: input.workspaceId };

  const secretFindings = input.scanType !== "governance" ? validateSecretHandlingRules(rules) : [];
  const credentialExposures = input.scanType !== "governance"
    ? [
        ...detectCredentialExposure(rules),
        ...detectHardcodedCredentials(rules),
        ...detectTokenExposure(rules),
      ]
    : [];
  const workspaceViolations = input.scanType !== "governance"
    ? validateWorkspaceIsolationRules(rules, ctx)
    : [];
  const pluginViolations = input.scanType !== "governance"
    ? [...validatePluginSecurityRules(rules), ...detectUnauthorizedExecution(rules)]
    : [];

  const governanceFindings = input.scanType !== "security"
    ? [
        ...validatePillowGovernanceRules(rules, ctx),
        ...validateRegistryComplianceRules(rules, ctx),
        ...validateEklsBoundaryRules(rules, ctx),
        ...validateBrainBoundaryRules(rules),
      ]
    : [];

  const securityFindings = input.scanType !== "governance"
    ? [
        ...secretFindings,
        ...validateBoundaryRules(rules),
        ...runSecurityGovernancePluginValidators({ workspaceId: input.workspaceId, validatorKind: "security" }),
      ]
    : [];

  if (input.scanType !== "security") {
    governanceFindings.push(
      ...runSecurityGovernancePluginValidators({ workspaceId: input.workspaceId, validatorKind: "governance" }),
    );
  }

  const governanceOnlyFromRules = rules
    .filter((r) => GOVERNANCE_RULE_KINDS.has(r.ruleKind))
    .flatMap((rule) =>
      rule.requiredGovernance.length === 0
        ? [{
            violationId: `gov-rule-${rule.ruleId}`,
            ruleId: rule.ruleId,
            ruleKind: rule.ruleKind,
            securityDomain: rule.securityDomain,
            boundaryId: rule.boundaryId,
            severity: "medium" as const,
            message: `Governance rule ${rule.ruleId} missing required governance chain`,
          }]
        : [],
    );
  governanceFindings.push(...governanceOnlyFromRules.filter(() => false));

  const allFindings = [
    ...securityFindings,
    ...governanceFindings,
    ...credentialExposures,
    ...workspaceViolations,
    ...pluginViolations,
  ];

  const criticalCount = countSeverity(allFindings, "critical");
  const highCount = countSeverity(allFindings, "high");
  const mediumCount = countSeverity(allFindings, "medium");
  const status = deriveSecurityGovernanceStatus({ criticalCount, highCount, mediumCount });
  const score = scoreSecurityGovernanceStatus(status);

  const { riskRegister, executiveRecommendations } = analyseExecutiveRisks({
    securityFindings,
    governanceFindings,
    credentialExposures,
    workspaceViolations,
    pluginViolations,
  });

  const scanId = randomUUID();
  const result: SecurityGovernanceScanResult = {
    scanId,
    correlationId: randomUUID(),
    scanType: input.scanType,
    status,
    score,
    securityFindings,
    governanceFindings,
    credentialExposures,
    workspaceViolations,
    pluginViolations,
    riskRegister,
    executiveRecommendations,
    scannedAt: new Date().toISOString(),
    discoverySource: "REG-CERTIFICATION-SECURITY",
  };

  lastScan = result;
  return result;
}

function recordScanEkls(
  input: { actorId: string; workspaceId: string },
  scan: SecurityGovernanceScanResult,
): void {
  const base = { ...input, scanId: scan.scanId, pillowGovernance: true as const };

  if (scan.scanType === "security" || scan.scanType === "combined") {
    recordSecurityGovernanceEklsObservation({
      ...base,
      kind: "security_scan_completed",
      summary: `Security scan ${scan.status} score=${scan.score}`,
      signalValue: scan.score,
    });
  }
  if (scan.scanType === "governance" || scan.scanType === "combined") {
    recordSecurityGovernanceEklsObservation({
      ...base,
      kind: "governance_scan_completed",
      summary: `Governance scan ${scan.status} score=${scan.score}`,
      signalValue: scan.score,
    });
  }

  for (const finding of scan.securityFindings) {
    recordSecurityGovernanceEklsObservation({
      ...base,
      kind: "security_violation",
      summary: finding.message,
    });
  }
  for (const finding of scan.credentialExposures) {
    recordSecurityGovernanceEklsObservation({
      ...base,
      kind: "credential_exposure_detected",
      summary: finding.message,
    });
  }
  for (const finding of scan.workspaceViolations) {
    recordSecurityGovernanceEklsObservation({
      ...base,
      kind: "workspace_violation",
      summary: finding.message,
    });
  }
  for (const finding of scan.pluginViolations) {
    recordSecurityGovernanceEklsObservation({
      ...base,
      kind: "plugin_violation",
      summary: finding.message,
    });
  }
  if (scan.status === "pass" || scan.status === "pass_with_conditions") {
    recordSecurityGovernanceEklsObservation({
      ...base,
      kind: "security_certified",
      summary: `Security governance certified with status ${scan.status}`,
      signalValue: scan.score,
    });
  }
}

function executeScan(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
  scanType: SecurityGovernanceScanResult["scanType"];
  operation: "security_scan" | "governance_scan";
}): SecurityGovernanceScanResult {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const governance = validateSecurityGovernancePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: input.operation,
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const blocked: SecurityGovernanceScanResult = {
      scanId: randomUUID(),
      correlationId: randomUUID(),
      scanType: input.scanType,
      status: "blocked",
      score: 0,
      securityFindings: [{
        violationId: "pillow-blocked",
        ruleId: "pillow-governance",
        ruleKind: "governance",
        securityDomain: "pillow_governance",
        boundaryId: "platform",
        severity: "critical",
        message: governance.reason,
      }],
      governanceFindings: [],
      credentialExposures: [],
      workspaceViolations: [],
      pluginViolations: [],
      riskRegister: [],
      executiveRecommendations: ["Resolve Pillow governance rejection"],
      scannedAt: new Date().toISOString(),
      discoverySource: "REG-CERTIFICATION-SECURITY",
    };
    lastScan = blocked;
    return blocked;
  }

  const scan = runScanInternal({
    context,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    scanType: input.scanType,
  });
  recordScanEkls({ actorId: input.actorId, workspaceId: input.workspaceId }, scan);
  return scan;
}

export function runSecurityScan(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): SecurityGovernanceScanResult {
  return executeScan({ ...input, scanType: "security", operation: "security_scan" });
}

export function runGovernanceScan(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): SecurityGovernanceScanResult {
  return executeScan({ ...input, scanType: "governance", operation: "governance_scan" });
}

export function runSecurityGovernanceScan(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): SecurityGovernanceScanResult {
  return executeScan({ ...input, scanType: "combined", operation: "security_scan" });
}

export function resetSecurityGovernanceStateForTests(): void {
  lastScan = undefined;
}
