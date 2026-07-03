/**
 * G6-05 — Business operations validators.
 */

import type {
  BusinessDependencyEntry,
  BusinessFinding,
  BusinessRiskEntry,
  CommerceHealthSummary,
} from "../contracts/business-operations-types.js";
import type { BusinessOperationsRule } from "../registry/business-operations-registry-resolver.js";
import { resolveBusinessSignals } from "../registry/business-signal-resolver.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

function toFinding(
  rule: BusinessOperationsRule,
  message: string,
  severity: BusinessFinding["severity"],
  suffix: string,
): BusinessFinding {
  return {
    findingId: `biz-${suffix}-${rule.ruleId}`,
    ruleId: rule.ruleId,
    ruleKind: rule.ruleKind,
    businessDomain: rule.businessDomain,
    serviceId: rule.serviceId,
    severity,
    message,
    recommendation: `Resolve business operations for ${rule.businessDomain}`,
  };
}

const BLOCKER_CONDITION_HANDLERS: Record<string, (rule: BusinessOperationsRule) => BusinessFinding | undefined> = {
  marketplace_unavailable: (rule) =>
    process.env.MARKETPLACE_UNAVAILABLE === "true"
      ? toFinding(rule, "Marketplace unavailable", "critical", "marketplace")
      : undefined,
  supplier_unavailable: (rule) =>
    process.env.SUPPLIER_UNAVAILABLE === "true"
      ? toFinding(rule, "Supplier unavailable", "critical", "supplier")
      : undefined,
  storefront_unavailable: (rule) =>
    process.env.STOREFRONT_UNAVAILABLE === "true"
      ? toFinding(rule, "Storefront unavailable", "critical", "storefront")
      : undefined,
  payment_unavailable: (rule) =>
    process.env.PAYMENT_UNAVAILABLE === "true"
      ? toFinding(rule, "Payment unavailable", "critical", "payment")
      : undefined,
  order_lifecycle_incomplete: (rule) =>
    process.env.ORDER_LIFECYCLE_INCOMPLETE === "true"
      ? toFinding(rule, "Order lifecycle incomplete", "critical", "order")
      : undefined,
  analytics_unavailable: (rule) =>
    process.env.ANALYTICS_DISABLED === "true"
      ? toFinding(rule, "Analytics unavailable", "high", "analytics")
      : undefined,
  automation_unavailable: (rule) =>
    process.env.AUTOMATION_UNAVAILABLE === "true"
      ? toFinding(rule, "Automation unavailable", "critical", "automation")
      : undefined,
  workflow_failure: (rule) =>
    process.env.WORKFLOW_FAILURES === "true"
      ? toFinding(rule, "Business workflow failure", "critical", "workflow")
      : undefined,
  business_workflow_failure: (rule) =>
    process.env.WORKFLOW_FAILURES === "true"
      ? toFinding(rule, "Business workflow failure", "critical", "workflow")
      : undefined,
  plugin_incompatibility: (rule) =>
    process.env.BUSINESS_PLUGIN_INCOMPATIBLE === "true"
      ? toFinding(rule, "Plugin incompatibility detected", "high", "plugin")
      : undefined,
  commerce_inconsistency: (rule) =>
    process.env.COMMERCE_INCONSISTENCY === "true"
      ? toFinding(rule, "Commerce inconsistency detected", "high", "commerce")
      : undefined,
};

export function validateBusinessRules(
  rules: BusinessOperationsRule[],
  context: RegistryLoaderContext,
): {
  failures: BusinessFinding[];
  warnings: BusinessFinding[];
  dependencies: BusinessDependencyEntry[];
} {
  const failures: BusinessFinding[] = [];
  const warnings: BusinessFinding[] = [];
  const dependencies: BusinessDependencyEntry[] = [];

  for (const rule of rules) {
    const signals = resolveBusinessSignals(rule.businessSignals, context);
    for (const signal of signals) {
      dependencies.push({
        dependencyId: `${rule.ruleId}:${signal.signalRef}`,
        businessDomain: rule.businessDomain,
        satisfied: signal.satisfied,
        signalRef: signal.signalRef,
      });
    }

    const missing = signals.filter((s) => !s.satisfied);
    if (missing.length > 0) {
      const finding = toFinding(
        rule,
        `Business certification failed for ${rule.serviceId}: missing ${missing.map((s) => s.signalRef).join(", ")}`,
        missing.length === signals.length ? "critical" : "high",
        "missing",
      );
      if (finding.severity === "critical") failures.push(finding);
      else warnings.push(finding);
    }

    if (rule.registryRef) {
      try {
        const result = getRegistryLoader().resolve(
          context,
          rule.registryRef as Parameters<ReturnType<typeof getRegistryLoader>["resolve"]>[1],
        );
        if (!result.meta.wired) {
          warnings.push(toFinding(rule, `Registry ${rule.registryRef} not fully wired`, "medium", "registry"));
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        failures.push(toFinding(rule, `Registry failure: ${reason}`, "critical", "registry-fail"));
      }
    }

    for (const condition of rule.blockerConditions) {
      const finding = BLOCKER_CONDITION_HANDLERS[condition]?.(rule);
      if (!finding) continue;
      if (finding.severity === "critical") failures.push(finding);
      else warnings.push(finding);
    }
  }

  return { failures, warnings, dependencies };
}

export const validateMarketplaceCertification = (
  rules: BusinessOperationsRule[],
  ctx: RegistryLoaderContext,
) => validateBusinessRules(rules.filter((r) => r.ruleKind === "marketplace"), ctx);

export const validateSupplierCertification = (
  rules: BusinessOperationsRule[],
  ctx: RegistryLoaderContext,
) => validateBusinessRules(rules.filter((r) => r.ruleKind === "supplier"), ctx);

export const validateStorefrontCertification = (
  rules: BusinessOperationsRule[],
  ctx: RegistryLoaderContext,
) => validateBusinessRules(rules.filter((r) => r.ruleKind === "storefront"), ctx);

export const validatePaymentCertification = (
  rules: BusinessOperationsRule[],
  ctx: RegistryLoaderContext,
) => validateBusinessRules(rules.filter((r) => r.ruleKind === "payment"), ctx);

export const validateLogisticsCertification = (
  rules: BusinessOperationsRule[],
  ctx: RegistryLoaderContext,
) => validateBusinessRules(rules.filter((r) => r.ruleKind === "logistics"), ctx);

export const validateAnalyticsCertification = (
  rules: BusinessOperationsRule[],
  ctx: RegistryLoaderContext,
) => validateBusinessRules(rules.filter((r) => r.ruleKind === "analytics" || r.ruleKind === "executive_reporting"), ctx);

export const validateWorkflowCertification = (
  rules: BusinessOperationsRule[],
  ctx: RegistryLoaderContext,
) => validateBusinessRules(rules.filter((r) => r.ruleKind === "workflow"), ctx);

export const validateAutomationCertification = (
  rules: BusinessOperationsRule[],
  ctx: RegistryLoaderContext,
) => validateBusinessRules(rules.filter((r) => r.ruleKind === "automation"), ctx);

export const validateCommerceCertification = (
  rules: BusinessOperationsRule[],
  ctx: RegistryLoaderContext,
) => validateBusinessRules(
  rules.filter((r) =>
    r.ruleKind === "commerce" ||
    r.ruleKind === "customer_journey" ||
    r.ruleKind === "order_flow" ||
    r.ruleKind === "refund_flow" ||
    r.ruleKind === "inventory_flow" ||
    r.ruleKind === "business_engine_coordination",
  ),
  ctx,
);

export function deriveCommerceHealth(dependencies: BusinessDependencyEntry[]): CommerceHealthSummary {
  const satisfied = (ref: string) =>
    dependencies.some((entry) => entry.signalRef === ref && entry.satisfied);
  return {
    marketplaceReady: satisfied("signal:marketplace-registry"),
    supplierReady: satisfied("signal:supplier-registry"),
    storefrontReady: satisfied("signal:storefront-registry"),
    paymentReady: satisfied("signal:payment-registry") && satisfied("signal:payment-flow-ready"),
    logisticsReady: satisfied("signal:logistics-registry"),
  };
}

export function analyseBusinessRisks(input: {
  failures: BusinessFinding[];
  warnings: BusinessFinding[];
}): { riskRegister: BusinessRiskEntry[]; executiveRecommendations: string[] } {
  const all = [...input.failures, ...input.warnings];
  const riskRegister = all
    .filter((f) => f.severity === "critical" || f.severity === "high" || f.severity === "medium")
    .map((finding) => ({
      riskId: `risk-${finding.findingId}`,
      ruleId: finding.ruleId,
      businessDomain: finding.businessDomain,
      severity: finding.severity,
      summary: finding.message,
      mitigation: finding.recommendation,
    }));

  const recommendations = new Set<string>();
  if (input.failures.some((f) => f.ruleKind === "marketplace")) {
    recommendations.add("Restore marketplace operations before commercial go-live");
  }
  if (input.failures.some((f) => f.ruleKind === "payment")) {
    recommendations.add("Complete payment flow certification and authorization");
  }
  if (input.failures.some((f) => f.ruleKind === "automation" || f.ruleKind === "workflow")) {
    recommendations.add("Resolve business automation and workflow failures");
  }
  if (input.failures.length === 0 && input.warnings.length === 0) {
    recommendations.add("Business operations certified — proceed with Grand King readiness");
  } else if (recommendations.size === 0) {
    recommendations.add("Review business failures and warnings before commercial operations");
  }

  return { riskRegister, executiveRecommendations: [...recommendations] };
}
