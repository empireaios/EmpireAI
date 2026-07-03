/**
 * G6-03 — Infrastructure & deployment certification service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  InfrastructureDeploymentOverview,
  InfrastructureDeploymentScanResult,
  InfrastructureDeploymentViolation,
} from "../contracts/infrastructure-deployment-types.js";
import { INFRASTRUCTURE_DEPLOYMENT_CERTIFICATION_VERSION } from "../contracts/infrastructure-deployment-types.js";
import { recordInfrastructureDeploymentEklsObservation } from "../ekls/infrastructure-deployment-ekls-integration.js";
import { validateInfrastructureDeploymentPillowGovernance } from "../governance/infrastructure-deployment-pillow-governance.js";
import { runInfrastructureDeploymentPluginValidators } from "../plugins/infrastructure-deployment-plugin-host.js";
import {
  listInfrastructureDomains,
  resolveInfrastructureDeploymentRules,
} from "../registry/infrastructure-deployment-registry-resolver.js";
import {
  deriveInfrastructureDeploymentStatus,
  scoreInfrastructureDeploymentStatus,
} from "./infrastructure-deployment-scoring-service.js";
import {
  analyseDeploymentRisks,
  deriveReadinessSummary,
  validateBackupRules,
  validateBackendRules,
  validateCacheRules,
  validateDatabaseRules,
  validateDeploymentHealthRules,
  validateDeploymentTopologyRules,
  validateDisasterRecoveryRules,
  validateFrontendRules,
  validateHostingRules,
  validateMonitoringRules,
  validateQueueRules,
  validateScalabilityRules,
  validateStorageRules,
} from "../validation/deployment-validators.js";
import { validateInfrastructureRulesByKind } from "../validation/infrastructure-rule-validator.js";

let lastScan: InfrastructureDeploymentScanResult | undefined;

export function getInfrastructureDeploymentOverview(
  context: RegistryLoaderContext = {},
): InfrastructureDeploymentOverview {
  const rules = resolveInfrastructureDeploymentRules(context);
  return {
    frameworkVersion: INFRASTRUCTURE_DEPLOYMENT_CERTIFICATION_VERSION,
    ruleCount: rules.length,
    infrastructureDomainCount: listInfrastructureDomains(context).length,
    lastScanId: lastScan?.scanId,
    lastStatus: lastScan?.status,
    generatedAt: new Date().toISOString(),
  };
}

export function getLastInfrastructureDeploymentScan(): InfrastructureDeploymentScanResult | undefined {
  return lastScan;
}

function mergeResults(
  results: Array<{ violations: InfrastructureDeploymentViolation[]; serviceHealth: import("../contracts/infrastructure-deployment-types.js").ServiceHealthEntry[] }>,
) {
  return {
    violations: results.flatMap((r) => r.violations),
    serviceHealth: results.flatMap((r) => r.serviceHealth),
  };
}

export function runInfrastructureDeploymentScan(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): InfrastructureDeploymentScanResult {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const governance = validateInfrastructureDeploymentPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "deployment_scan",
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const blocked: InfrastructureDeploymentScanResult = {
      scanId: randomUUID(),
      correlationId: randomUUID(),
      status: "blocked",
      score: 0,
      infrastructureFindings: [{
        violationId: "pillow-blocked",
        ruleId: "pillow-governance",
        ruleKind: "governance",
        infrastructureDomain: "deployment",
        serviceId: "platform",
        severity: "critical",
        message: governance.reason,
      }],
      deploymentFindings: [],
      serviceHealth: [],
      riskRegister: [],
      executiveRecommendations: ["Resolve Pillow governance rejection"],
      readinessSummary: {
        rollbackReady: false,
        upgradeReady: false,
        capacityReady: false,
        recoveryAvailable: false,
      },
      scannedAt: new Date().toISOString(),
      discoverySource: "REG-CERTIFICATION-DEPLOYMENT",
    };
    lastScan = blocked;
    return blocked;
  }

  const rules = resolveInfrastructureDeploymentRules(context);

  const infraResults = mergeResults([
    validateHostingRules(rules, context),
    validateBackendRules(rules, context),
    validateFrontendRules(rules, context),
    validateDatabaseRules(rules, context),
    validateQueueRules(rules, context),
    validateCacheRules(rules, context),
    validateStorageRules(rules, context),
    validateMonitoringRules(rules, context),
    validateBackupRules(rules, context),
    validateDisasterRecoveryRules(rules, context),
    validateInfrastructureRulesByKind(rules, ["ssl", "dns", "email", "secrets_management", "plugin_host"], context),
  ]);

  const deployResults = mergeResults([
    validateDeploymentTopologyRules(rules, context),
    validateScalabilityRules(rules, context),
  ]);

  const healthFindings = validateDeploymentHealthRules(rules, context);
  const pluginFindings = runInfrastructureDeploymentPluginValidators({ workspaceId: input.workspaceId });

  const infrastructureFindings = [...infraResults.violations, ...pluginFindings];
  const deploymentFindings = [...deployResults.violations, ...healthFindings];
  const serviceHealth = [...infraResults.serviceHealth, ...deployResults.serviceHealth];

  const allFindings = [...infrastructureFindings, ...deploymentFindings];
  const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
  const highCount = allFindings.filter((f) => f.severity === "high").length;
  const mediumCount = allFindings.filter((f) => f.severity === "medium").length;

  const status = deriveInfrastructureDeploymentStatus({ criticalCount, highCount, mediumCount });
  const score = scoreInfrastructureDeploymentStatus(status);
  const readinessSummary = deriveReadinessSummary({ violations: allFindings, serviceHealth });
  const { riskRegister, executiveRecommendations } = analyseDeploymentRisks({
    infrastructureFindings,
    deploymentFindings,
  });

  const scanId = randomUUID();
  const result: InfrastructureDeploymentScanResult = {
    scanId,
    correlationId: randomUUID(),
    status,
    score,
    infrastructureFindings,
    deploymentFindings,
    serviceHealth,
    riskRegister,
    executiveRecommendations,
    readinessSummary,
    scannedAt: new Date().toISOString(),
    discoverySource: "REG-CERTIFICATION-DEPLOYMENT",
  };

  lastScan = result;

  const eklsBase = {
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    scanId,
    pillowGovernance: true as const,
  };

  recordInfrastructureDeploymentEklsObservation({
    ...eklsBase,
    kind: "deployment_scan_completed",
    summary: `Deployment scan ${status} score=${score}`,
    signalValue: score,
  });

  for (const finding of allFindings) {
    recordInfrastructureDeploymentEklsObservation({
      ...eklsBase,
      kind: finding.severity === "critical" ? "deployment_failure" : "deployment_risk",
      summary: finding.message,
    });
  }

  if (readinessSummary.recoveryAvailable) {
    recordInfrastructureDeploymentEklsObservation({
      ...eklsBase,
      kind: "deployment_recovery",
      summary: "Disaster recovery readiness validated",
    });
  }

  if (status === "pass" || status === "pass_with_conditions") {
    recordInfrastructureDeploymentEklsObservation({
      ...eklsBase,
      kind: "deployment_certified",
      summary: `Infrastructure deployment certified with status ${status}`,
      signalValue: score,
    });
  }

  return result;
}

export function runDeploymentHealthCheck(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): Pick<InfrastructureDeploymentScanResult, "status" | "score" | "serviceHealth" | "deploymentFindings"> {
  const scan = runInfrastructureDeploymentScan(input);
  return {
    status: scan.status,
    score: scan.score,
    serviceHealth: scan.serviceHealth,
    deploymentFindings: scan.deploymentFindings,
  };
}

export function resetInfrastructureDeploymentStateForTests(): void {
  lastScan = undefined;
}
