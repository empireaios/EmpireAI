/**
 * G6-04 — Operational readiness validators.
 */

import type {
  OperationalBlocker,
  OperationalDependencyEntry,
  OperationalRiskEntry,
} from "../contracts/operational-readiness-types.js";
import type { OperationalReadinessRule } from "../registry/operational-readiness-registry-resolver.js";
import { resolveOperationalSignals } from "../registry/operational-signal-resolver.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

function toBlocker(
  rule: OperationalReadinessRule,
  message: string,
  severity: OperationalBlocker["severity"],
  suffix: string,
): OperationalBlocker {
  return {
    blockerId: `op-${suffix}-${rule.ruleId}`,
    ruleId: rule.ruleId,
    ruleKind: rule.ruleKind,
    readinessDomain: rule.readinessDomain,
    serviceId: rule.serviceId,
    severity,
    message,
    recommendation: `Resolve operational readiness for ${rule.readinessDomain}`,
  };
}

export function validateOperationalRules(
  rules: OperationalReadinessRule[],
  context: RegistryLoaderContext,
): {
  blockers: OperationalBlocker[];
  warnings: OperationalBlocker[];
  dependencies: OperationalDependencyEntry[];
} {
  const blockers: OperationalBlocker[] = [];
  const warnings: OperationalBlocker[] = [];
  const dependencies: OperationalDependencyEntry[] = [];

  for (const rule of rules) {
    const signals = resolveOperationalSignals(rule.readinessSignals, context);
    for (const signal of signals) {
      dependencies.push({
        dependencyId: `${rule.ruleId}:${signal.signalRef}`,
        readinessDomain: rule.readinessDomain,
        satisfied: signal.satisfied,
        signalRef: signal.signalRef,
      });
    }

    const missing = signals.filter((s) => !s.satisfied);
    if (missing.length > 0) {
      const finding = toBlocker(
        rule,
        `Operational readiness failed for ${rule.serviceId}: missing ${missing.map((s) => s.signalRef).join(", ")}`,
        missing.length === signals.length ? "critical" : "high",
        "missing",
      );
      if (finding.severity === "critical") blockers.push(finding);
      else warnings.push(finding);
    }

    if (rule.registryRef) {
      try {
        const result = getRegistryLoader().resolve(
          context,
          rule.registryRef as Parameters<ReturnType<typeof getRegistryLoader>["resolve"]>[1],
        );
        if (!result.meta.wired) {
          warnings.push(toBlocker(rule, `Registry ${rule.registryRef} not wired`, "medium", "registry"));
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        blockers.push(toBlocker(rule, `Registry failure: ${reason}`, "critical", "registry-fail"));
      }
    }

    for (const condition of rule.blockerConditions) {
      if (condition === "queue_failures" && process.env.QUEUE_FAILURES === "true") {
        blockers.push(toBlocker(rule, "Queue processing failures detected", "critical", condition));
      }
      if (condition === "monitoring_disabled" && process.env.MONITORING_DISABLED === "true") {
        warnings.push(toBlocker(rule, "Monitoring disabled", "high", condition));
      }
      if (condition === "recovery_unavailable" && process.env.RECOVERY_DISABLED === "true") {
        blockers.push(toBlocker(rule, "Recovery unavailable", "critical", condition));
      }
    }
  }

  return { blockers, warnings, dependencies };
}

export const validateAutomationReadiness = (
  rules: OperationalReadinessRule[],
  ctx: RegistryLoaderContext,
) => validateOperationalRules(rules.filter((r) => r.ruleKind === "automation"), ctx);

export const validateCommerceReadiness = (
  rules: OperationalReadinessRule[],
  ctx: RegistryLoaderContext,
) => validateOperationalRules(rules.filter((r) => r.ruleKind === "commerce"), ctx);

export const validateExternalDependencyReadiness = (
  rules: OperationalReadinessRule[],
  ctx: RegistryLoaderContext,
) => validateOperationalRules(rules.filter((r) => r.ruleKind === "external_dependency"), ctx);

export const validateProviderReadiness = (
  rules: OperationalReadinessRule[],
  ctx: RegistryLoaderContext,
) => validateOperationalRules(rules.filter((r) => r.ruleKind === "provider"), ctx);

export const validateMonitoringReadiness = (
  rules: OperationalReadinessRule[],
  ctx: RegistryLoaderContext,
) => validateOperationalRules(
  rules.filter((r) => r.ruleKind === "monitoring" || r.ruleKind === "alerting" || r.ruleKind === "observability"),
  ctx,
);

export const validateIncidentReadiness = (
  rules: OperationalReadinessRule[],
  ctx: RegistryLoaderContext,
) => validateOperationalRules(rules.filter((r) => r.ruleKind === "alerting"), ctx);

export const validateRecoveryReadiness = (
  rules: OperationalReadinessRule[],
  ctx: RegistryLoaderContext,
) => validateOperationalRules(rules.filter((r) => r.ruleKind === "recovery"), ctx);

export function analyseOperationalRisks(input: {
  blockers: OperationalBlocker[];
  warnings: OperationalBlocker[];
}): { riskRegister: OperationalRiskEntry[]; executiveRecommendations: string[] } {
  const all = [...input.blockers, ...input.warnings];
  const riskRegister = all
    .filter((f) => f.severity === "critical" || f.severity === "high" || f.severity === "medium")
    .map((finding) => ({
      riskId: `risk-${finding.blockerId}`,
      ruleId: finding.ruleId,
      readinessDomain: finding.readinessDomain,
      severity: finding.severity,
      summary: finding.message,
      mitigation: finding.recommendation,
    }));

  const recommendations = new Set<string>();
  if (input.blockers.some((b) => b.ruleKind === "automation")) {
    recommendations.add("Restore business automation availability before live operations");
  }
  if (input.blockers.some((b) => b.ruleKind === "commerce")) {
    recommendations.add("Complete commerce provider and authorization setup");
  }
  if (input.blockers.length === 0 && input.warnings.length === 0) {
    recommendations.add("Operational readiness satisfied — proceed with remaining G6 domains");
  } else if (recommendations.size === 0) {
    recommendations.add("Review operational blockers and warnings before production go-live");
  }

  return { riskRegister, executiveRecommendations: [...recommendations] };
}
