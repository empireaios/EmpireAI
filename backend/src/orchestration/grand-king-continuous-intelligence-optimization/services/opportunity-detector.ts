/**
 * G7-06 — Opportunity detector (registry-driven rules).
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { listCommerceOperations } from "../../grand-king-commerce-operations/services/grand-king-commerce-operations-service.js";
import { listAutomationOperations } from "../../grand-king-business-automation-operations/services/grand-king-business-automation-operations-service.js";
import { aggregateFinancialKpis } from "../../grand-king-revenue-financial-operations/services/financial-kpi-engine.js";
import type { OptimizationOpportunity } from "../contracts/continuous-intelligence-types.js";
import {
  deriveSignalFromRuleRef,
  parseDomainFromRef,
  resolveOptimizationDependencies,
} from "../registry/continuous-intelligence-registry-resolver.js";
import { mapDomainToOptimizationType } from "../registry/continuous-intelligence-registry-resolver.js";

export function detectOptimizationOpportunities(context: RegistryLoaderContext = {}): OptimizationOpportunity[] {
  const deps = resolveOptimizationDependencies(context);
  const opportunities: OptimizationOpportunity[] = [];

  for (const ruleRef of deps.opportunityRuleRefs) {
    const domainId = parseDomainFromRef(ruleRef) ?? inferDomainFromRule(ruleRef);
    if (!domainId) continue;

    const signalStrength = deriveSignalFromRuleRef(ruleRef) + stackSignalBoost(context, domainId);
    if (signalStrength < 0.3) continue;

    opportunities.push({
      opportunityId: randomUUID(),
      domainId,
      optimizationType: mapDomainToOptimizationType(domainId),
      summary: `Opportunity detected via ${ruleRef}`,
      ruleReference: ruleRef,
      detectedAt: new Date().toISOString(),
      signalStrength: Math.round(signalStrength * 100) / 100,
    });
  }

  return opportunities;
}

function inferDomainFromRule(ruleRef: string): OptimizationOpportunity["domainId"] | undefined {
  if (ruleRef.includes("commerce")) return "commerce";
  if (ruleRef.includes("automation")) return "automation";
  if (ruleRef.includes("financial")) return "financial_operations";
  if (ruleRef.includes("provider")) return "providers";
  if (ruleRef.includes("workflow")) return "workflows";
  return undefined;
}

function stackSignalBoost(context: RegistryLoaderContext, domainId: string): number {
  try {
    if (domainId === "commerce") {
      const ops = listCommerceOperations();
      return ops.filter((o) => o.status === "running").length * 0.05;
    }
    if (domainId === "automation") {
      const ops = listAutomationOperations();
      return ops.filter((o) => o.executionStatus === "executing").length * 0.05;
    }
    if (domainId === "financial_operations") {
      const kpis = aggregateFinancialKpis(context);
      return kpis.profitMargin > 0 ? 0.1 : 0.2;
    }
  } catch {
    return 0;
  }
  return 0;
}
