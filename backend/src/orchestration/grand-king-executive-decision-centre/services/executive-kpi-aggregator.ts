/**
 * G7-04 — Executive KPI aggregator (registry-driven metric refs).
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { validateProductionEligibilityGate } from "../../grand-king-live-operations/services/production-eligibility-gate.js";
import { listAutomationOperations, getExecutiveAutomationDashboard } from "../../grand-king-business-automation-operations/services/grand-king-business-automation-operations-service.js";
import { validateCommerceReadiness } from "../../grand-king-commerce-operations/services/commerce-readiness-validator.js";
import { listCommerceOperations, getExecutiveCommerceDashboard } from "../../grand-king-commerce-operations/services/grand-king-commerce-operations-service.js";
import { getWorkspaceHealth } from "../../grand-king-production-workspace/services/grand-king-production-workspace-service.js";
import type { ExecutiveKpiSnapshot } from "../contracts/executive-decision-types.js";
import { resolveExecutivePolicies } from "../registry/executive-decision-registry-resolver.js";

function computeRiskLevel(score: number): ExecutiveKpiSnapshot["riskLevel"] {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

export function aggregateExecutiveKpis(context: RegistryLoaderContext = {}): ExecutiveKpiSnapshot {
  const policies = resolveExecutivePolicies(context);
  const gate = validateProductionEligibilityGate(context);
  const commerceReadiness = validateCommerceReadiness(context);

  let commerceOps: ReturnType<typeof listCommerceOperations> = [];
  let automationOps: ReturnType<typeof listAutomationOperations> = [];
  try {
    commerceOps = listCommerceOperations();
  } catch {
    commerceOps = [];
  }
  try {
    automationOps = listAutomationOperations();
  } catch {
    automationOps = [];
  }

  let commerceDashboard = {
    marketplaceStatus: { runningCount: 0, blockedCount: 0 },
    paymentStatus: { runningCount: 0 },
    analyticsStatus: { operationCount: 0 },
  };
  let automationDashboard = {
    workflowQueue: { queueDepth: 0 },
    approvals: { pendingCount: 0 },
    recoveries: { recoveringCount: 0, failedCount: 0 },
    automationHealth: { score: 0 },
  };

  try {
    commerceDashboard = getExecutiveCommerceDashboard(context);
  } catch {
    /* stack not initialized */
  }
  try {
    automationDashboard = getExecutiveAutomationDashboard(context);
  } catch {
    /* stack not initialized */
  }

  let businessHealth = 0;
  try {
    businessHealth = getWorkspaceHealth(context).score;
  } catch {
    businessHealth = gate.eligible ? 70 : 0;
  }

  const runningCommerce = commerceOps.filter((op) => op.status === "running").length;
  const totalCommerce = commerceOps.length || 1;
  const runningAutomation = automationOps.filter((op) => op.executionStatus === "executing").length;
  const totalAutomation = automationOps.length || 1;
  const blockedCount =
    commerceOps.filter((op) => op.status === "blocked").length +
    automationOps.filter((op) => op.executionStatus === "blocked").length;
  const failedCount = automationOps.filter((op) => op.executionStatus === "failed").length;

  const providerHealth =
    totalCommerce > 0 ? Math.round((runningCommerce / totalCommerce) * 100) : commerceReadiness.ready ? 80 : 0;
  const automationSuccessRate = Math.round((runningAutomation / totalAutomation) * 100);
  const productionReadiness = gate.eligible ? 100 : 0;
  const commerceReadyScore = commerceReadiness.ready ? 100 : 0;

  const empireHealthScore = Math.round(
    (providerHealth + automationSuccessRate + productionReadiness + commerceReadyScore + businessHealth) / 5,
  );

  return {
    revenue: runningCommerce,
    orders: runningCommerce,
    automationSuccessRate,
    workflowQueue: automationDashboard.workflowQueue.queueDepth,
    approvalQueue: automationDashboard.approvals.pendingCount,
    recoveryQueue: automationDashboard.recoveries.recoveringCount + automationDashboard.recoveries.failedCount,
    providerHealth,
    productionReadiness,
    commerceReadiness: commerceReadyScore,
    businessHealth,
    riskLevel: computeRiskLevel(empireHealthScore),
    incidentCount: blockedCount + failedCount,
    learningGrowth: policies[0]?.kpiMetricRefs.length ?? 0,
    empireHealthScore,
    computedAt: new Date().toISOString(),
    policyReference: policies[0]?.policyId ?? "executive-policy-grand-king-production",
  };
}
