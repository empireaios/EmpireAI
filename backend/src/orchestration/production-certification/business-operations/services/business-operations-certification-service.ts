/**
 * G6-05 — Business operations certification service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  BusinessOperationsOverview,
  BusinessOperationsScanResult,
} from "../contracts/business-operations-types.js";
import { BUSINESS_OPERATIONS_CERTIFICATION_VERSION } from "../contracts/business-operations-types.js";
import { recordBusinessOperationsEklsObservation } from "../ekls/business-operations-ekls-integration.js";
import { validateBusinessOperationsPillowGovernance } from "../governance/business-operations-pillow-governance.js";
import { runBusinessOperationsPluginValidators } from "../plugins/business-operations-plugin-host.js";
import {
  listBusinessOperationsDomains,
  resolveBusinessOperationsRules,
} from "../registry/business-operations-registry-resolver.js";
import {
  computeExecutiveBusinessScore,
  deriveBusinessOperationsStatus,
} from "./executive-business-score-engine.js";
import {
  analyseBusinessRisks,
  deriveCommerceHealth,
  validateAnalyticsCertification,
  validateAutomationCertification,
  validateCommerceCertification,
  validateLogisticsCertification,
  validateMarketplaceCertification,
  validatePaymentCertification,
  validateStorefrontCertification,
  validateSupplierCertification,
  validateWorkflowCertification,
} from "../validation/business-operations-validator.js";

let lastScan: BusinessOperationsScanResult | undefined;

export function getBusinessOperationsOverview(
  context: RegistryLoaderContext = {},
): BusinessOperationsOverview {
  const rules = resolveBusinessOperationsRules(context);
  return {
    frameworkVersion: BUSINESS_OPERATIONS_CERTIFICATION_VERSION,
    ruleCount: rules.length,
    businessDomainCount: listBusinessOperationsDomains(context).length,
    lastScanId: lastScan?.scanId,
    lastStatus: lastScan?.status,
    generatedAt: new Date().toISOString(),
  };
}

export function getLastBusinessOperationsScan(): BusinessOperationsScanResult | undefined {
  return lastScan;
}

export function runBusinessOperationsScan(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): BusinessOperationsScanResult {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const governance = validateBusinessOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "business_scan",
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const blocked: BusinessOperationsScanResult = {
      scanId: randomUUID(),
      correlationId: randomUUID(),
      status: "blocked",
      executiveScore: 0,
      failures: [{
        findingId: "pillow-blocked",
        ruleId: "pillow-governance",
        ruleKind: "governance",
        businessDomain: "business_operations",
        serviceId: "platform",
        severity: "critical",
        message: governance.reason,
      }],
      warnings: [],
      dependencies: [],
      riskRegister: [],
      executiveRecommendations: ["Resolve Pillow governance rejection"],
      commerceHealth: {
        marketplaceReady: false,
        supplierReady: false,
        storefrontReady: false,
        paymentReady: false,
        logisticsReady: false,
      },
      scannedAt: new Date().toISOString(),
      discoverySource: "REG-CERTIFICATION-BUSINESS",
    };
    lastScan = blocked;
    return blocked;
  }

  const rules = resolveBusinessOperationsRules(context);

  const marketplace = validateMarketplaceCertification(rules, context);
  const supplier = validateSupplierCertification(rules, context);
  const storefront = validateStorefrontCertification(rules, context);
  const payment = validatePaymentCertification(rules, context);
  const logistics = validateLogisticsCertification(rules, context);
  const analytics = validateAnalyticsCertification(rules, context);
  const workflow = validateWorkflowCertification(rules, context);
  const automation = validateAutomationCertification(rules, context);
  const commerce = validateCommerceCertification(rules, context);
  const pluginFindings = runBusinessOperationsPluginValidators({ workspaceId: input.workspaceId });

  const failures = [
    ...marketplace.failures,
    ...supplier.failures,
    ...storefront.failures,
    ...payment.failures,
    ...logistics.failures,
    ...analytics.failures,
    ...workflow.failures,
    ...automation.failures,
    ...commerce.failures,
    ...pluginFindings.filter((f) => f.severity === "critical" || f.severity === "high"),
  ];
  const warnings = [
    ...marketplace.warnings,
    ...supplier.warnings,
    ...storefront.warnings,
    ...payment.warnings,
    ...logistics.warnings,
    ...analytics.warnings,
    ...workflow.warnings,
    ...automation.warnings,
    ...commerce.warnings,
    ...pluginFindings.filter((f) => f.severity !== "critical" && f.severity !== "high"),
  ];
  const dependencies = [
    ...marketplace.dependencies,
    ...supplier.dependencies,
    ...storefront.dependencies,
    ...payment.dependencies,
    ...logistics.dependencies,
    ...analytics.dependencies,
    ...workflow.dependencies,
    ...automation.dependencies,
    ...commerce.dependencies,
  ];

  const status = deriveBusinessOperationsStatus({
    failures,
    warnings,
    pillowBlocked: false,
  });
  const dependenciesSatisfied = dependencies.filter((entry) => entry.satisfied).length;
  const executiveScore = computeExecutiveBusinessScore({
    failures,
    warnings,
    dependenciesSatisfied,
    dependenciesTotal: dependencies.length,
  });
  const commerceHealth = deriveCommerceHealth(dependencies);
  const { riskRegister, executiveRecommendations } = analyseBusinessRisks({ failures, warnings });

  const scanId = randomUUID();
  const result: BusinessOperationsScanResult = {
    scanId,
    correlationId: randomUUID(),
    status,
    executiveScore,
    failures,
    warnings,
    dependencies,
    riskRegister,
    executiveRecommendations,
    commerceHealth,
    scannedAt: new Date().toISOString(),
    discoverySource: "REG-CERTIFICATION-BUSINESS",
  };

  lastScan = result;

  const eklsBase = {
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    scanId,
    pillowGovernance: true as const,
  };

  recordBusinessOperationsEklsObservation({
    ...eklsBase,
    kind: "business_scan_completed",
    summary: `Business scan ${status} executiveScore=${executiveScore}`,
    signalValue: executiveScore,
  });

  for (const failure of failures) {
    recordBusinessOperationsEklsObservation({
      ...eklsBase,
      kind: "business_failure",
      summary: failure.message,
    });
  }

  for (const warning of warnings) {
    recordBusinessOperationsEklsObservation({
      ...eklsBase,
      kind: "business_warning",
      summary: warning.message,
    });
  }

  if (failures.length === 0) {
    recordBusinessOperationsEklsObservation({
      ...eklsBase,
      kind: "business_recovered",
      summary: "Business operations recovery validated",
    });
  }

  if (status === "ready" || status === "ready_with_conditions") {
    recordBusinessOperationsEklsObservation({
      ...eklsBase,
      kind: "business_certified",
      summary: `Business operations certified with status ${status}`,
      signalValue: executiveScore,
    });
  }

  return result;
}

export function resetBusinessOperationsStateForTests(): void {
  lastScan = undefined;
}
