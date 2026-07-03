/**
 * G6-07 — Executive operations validators.
 */

import { resolveCockpitScreenContext } from "../../../../domain/services/cockpit-interaction-layer.js";
import type {
  CockpitHealthSummary,
  ExecutiveActionSafetySummary,
  ExecutiveBlocker,
  ExecutiveRiskEntry,
  ExecutiveVisibilityEntry,
} from "../contracts/executive-operations-types.js";
import type { ExecutiveOperationsRule } from "../registry/executive-operations-registry-resolver.js";
import { resolveExecutiveSignals } from "../registry/executive-signal-resolver.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

function toBlocker(
  rule: ExecutiveOperationsRule,
  message: string,
  severity: ExecutiveBlocker["severity"],
  suffix: string,
): ExecutiveBlocker {
  return {
    blockerId: `exec-${suffix}-${rule.ruleId}`,
    ruleId: rule.ruleId,
    ruleKind: rule.ruleKind,
    executiveDomain: rule.executiveDomain,
    serviceId: rule.serviceId,
    severity,
    message,
    recommendation: `Resolve executive operations for ${rule.executiveDomain}`,
  };
}

const FAILURE_HANDLERS: Record<string, (rule: ExecutiveOperationsRule) => ExecutiveBlocker | undefined> = {
  missing_executive_route: (rule) =>
    process.env.EXEC_MISSING_ROUTE === "true"
      ? toBlocker(rule, "Missing executive route", "critical", "route")
      : undefined,
  broken_cockpit_panel: (rule) =>
    process.env.EXEC_BROKEN_PANEL === "true"
      ? toBlocker(rule, "Broken Cockpit panel detected", "critical", "panel")
      : undefined,
  missing_brain_module: (rule) =>
    process.env.EXEC_MISSING_BRAIN_MODULE === "true"
      ? toBlocker(rule, "Missing Brain module", "critical", "brain")
      : undefined,
  missing_approval_visibility: (rule) =>
    process.env.EXEC_MISSING_APPROVAL_VISIBILITY === "true"
      ? toBlocker(rule, "Missing approval visibility", "critical", "approval")
      : undefined,
  missing_automation_visibility: (rule) =>
    process.env.EXEC_MISSING_AUTOMATION_VISIBILITY === "true"
      ? toBlocker(rule, "Missing automation visibility", "critical", "automation")
      : undefined,
  missing_readiness_visibility: (rule) =>
    process.env.EXEC_MISSING_READINESS_VISIBILITY === "true"
      ? toBlocker(rule, "Missing readiness visibility", "critical", "readiness")
      : undefined,
  missing_executive_report: (rule) =>
    process.env.EXEC_MISSING_EXECUTIVE_REPORT === "true"
      ? toBlocker(rule, "Missing executive report", "high", "report")
      : undefined,
  missing_ai_assistant_context: (rule) =>
    process.env.EXEC_MISSING_AI_ASSISTANT_CONTEXT === "true"
      ? toBlocker(rule, "Missing AI assistant context", "critical", "assistant")
      : undefined,
  unsafe_executive_action: (rule) =>
    process.env.EXEC_UNSAFE_EXECUTIVE_ACTION === "true"
      ? toBlocker(rule, "Unsafe executive action detected", "critical", "safety")
      : undefined,
  unclear_ownership: (rule) =>
    process.env.EXEC_UNCLEAR_OWNERSHIP === "true"
      ? toBlocker(rule, "Unclear executive ownership", "high", "ownership")
      : undefined,
  incomplete_evidence: (rule) =>
    process.env.EXEC_INCOMPLETE_EVIDENCE === "true"
      ? toBlocker(rule, "Incomplete executive evidence", "high", "evidence")
      : undefined,
  stale_status: (rule) =>
    process.env.EXEC_STALE_STATUS === "true"
      ? toBlocker(rule, "Stale executive status detected", "medium", "stale")
      : undefined,
};

function validateCockpitRoute(rule: ExecutiveOperationsRule): ExecutiveBlocker | undefined {
  if (!rule.cockpitRouteRef || !rule.expectedScreenId) return undefined;
  if (process.env.EXEC_MISSING_ROUTE === "true") {
    return toBlocker(rule, `Missing executive route: ${rule.cockpitRouteRef}`, "critical", "route-check");
  }
  const screen = resolveCockpitScreenContext(rule.cockpitRouteRef);
  if (screen.screenId !== rule.expectedScreenId) {
    return toBlocker(
      rule,
      `Cockpit route ${rule.cockpitRouteRef} resolved to ${screen.screenId}, expected ${rule.expectedScreenId}`,
      "critical",
      "route-mismatch",
    );
  }
  return undefined;
}

export function validateExecutiveRules(
  rules: ExecutiveOperationsRule[],
  context: RegistryLoaderContext,
): {
  blockers: ExecutiveBlocker[];
  warnings: ExecutiveBlocker[];
  visibility: ExecutiveVisibilityEntry[];
} {
  const blockers: ExecutiveBlocker[] = [];
  const warnings: ExecutiveBlocker[] = [];
  const visibility: ExecutiveVisibilityEntry[] = [];

  for (const rule of rules) {
    const routeFinding = validateCockpitRoute(rule);
    if (routeFinding) {
      if (routeFinding.severity === "critical") blockers.push(routeFinding);
      else warnings.push(routeFinding);
    }

    const signals = resolveExecutiveSignals(rule.executiveSignals, context, rule);
    for (const signal of signals) {
      visibility.push({
        visibilityId: `${rule.ruleId}:${signal.signalRef}`,
        executiveDomain: rule.executiveDomain,
        satisfied: signal.satisfied,
        signalRef: signal.signalRef,
      });
    }

    const missing = signals.filter((s) => !s.satisfied);
    if (missing.length > 0) {
      const finding = toBlocker(
        rule,
        `Executive certification failed for ${rule.serviceId}: missing ${missing.map((s) => s.signalRef).join(", ")}`,
        missing.length === signals.length ? "critical" : "high",
        "signal",
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
          warnings.push(toBlocker(rule, `Registry ${rule.registryRef} not fully wired`, "medium", "registry"));
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        blockers.push(toBlocker(rule, `Registry failure: ${reason}`, "critical", "registry-fail"));
      }
    }

    for (const condition of rule.failureConditions) {
      const finding = FAILURE_HANDLERS[condition]?.(rule);
      if (!finding) continue;
      if (finding.severity === "critical") blockers.push(finding);
      else warnings.push(finding);
    }
  }

  return { blockers, warnings, visibility };
}

export const validateCockpitOperations = (rules: ExecutiveOperationsRule[], ctx: RegistryLoaderContext) =>
  validateExecutiveRules(rules.filter((r) => r.ruleKind === "cockpit_operations"), ctx);

export const validateExecutiveHome = (rules: ExecutiveOperationsRule[], ctx: RegistryLoaderContext) =>
  validateExecutiveRules(rules.filter((r) => r.ruleKind === "executive_home"), ctx);

export const validateCommandCentre = (rules: ExecutiveOperationsRule[], ctx: RegistryLoaderContext) =>
  validateExecutiveRules(rules.filter((r) => r.ruleKind === "command_centre"), ctx);

export const validateAutomationCentre = (rules: ExecutiveOperationsRule[], ctx: RegistryLoaderContext) =>
  validateExecutiveRules(rules.filter((r) => r.ruleKind === "automation_centre" || r.ruleKind === "automation_visibility"), ctx);

export const validateAuthorizationCentre = (rules: ExecutiveOperationsRule[], ctx: RegistryLoaderContext) =>
  validateExecutiveRules(rules.filter((r) => r.ruleKind === "authorization_centre"), ctx);

export const validateRelationshipGraph = (rules: ExecutiveOperationsRule[], ctx: RegistryLoaderContext) =>
  validateExecutiveRules(rules.filter((r) => r.ruleKind === "relationship_graph"), ctx);

export const validateGlobalAiAssistant = (rules: ExecutiveOperationsRule[], ctx: RegistryLoaderContext) =>
  validateExecutiveRules(rules.filter((r) => r.ruleKind === "global_ai_assistant"), ctx);

export const validateApprovalFlow = (rules: ExecutiveOperationsRule[], ctx: RegistryLoaderContext) =>
  validateExecutiveRules(rules.filter((r) => r.ruleKind === "approval_flow"), ctx);

export const validateExecutiveReporting = (rules: ExecutiveOperationsRule[], ctx: RegistryLoaderContext) =>
  validateExecutiveRules(rules.filter((r) => r.ruleKind === "executive_reporting"), ctx);

export const validateDecisionVisibility = (rules: ExecutiveOperationsRule[], ctx: RegistryLoaderContext) =>
  validateExecutiveRules(rules.filter((r) => r.ruleKind === "decision_visibility"), ctx);

export const validateReadinessVisibility = (rules: ExecutiveOperationsRule[], ctx: RegistryLoaderContext) =>
  validateExecutiveRules(rules.filter((r) => r.ruleKind === "readiness_visibility"), ctx);

export const validateExecutiveActionSafety = (rules: ExecutiveOperationsRule[], ctx: RegistryLoaderContext) =>
  validateExecutiveRules(rules.filter((r) => r.ruleKind === "executive_action_safety"), ctx);

export function deriveCockpitHealth(visibility: ExecutiveVisibilityEntry[]): CockpitHealthSummary {
  const satisfied = (ref: string) => visibility.some((entry) => entry.signalRef === ref && entry.satisfied);
  return {
    executiveHomeReady: satisfied("signal:cockpit-route-ready"),
    commandCentreReady: satisfied("signal:cockpit-route-ready") && satisfied("signal:cockpit-panel-ready"),
    automationCentreReady: satisfied("signal:automation-visibility"),
    approvalQueueVisible: satisfied("signal:approval-visibility"),
  };
}

export function deriveActionSafety(visibility: ExecutiveVisibilityEntry[]): ExecutiveActionSafetySummary {
  const satisfied = (ref: string) => visibility.some((entry) => entry.signalRef === ref && entry.satisfied);
  return {
    actionSafe: satisfied("signal:executive-action-safe"),
    approvalAuthorityVerified: satisfied("signal:approval-visibility"),
    visibilityAuthorityVerified:
      satisfied("signal:automation-visibility") &&
      satisfied("signal:readiness-visibility") &&
      satisfied("signal:decision-visibility"),
  };
}

export function analyseExecutiveOperationsRisks(input: {
  blockers: ExecutiveBlocker[];
  warnings: ExecutiveBlocker[];
}): { riskRegister: ExecutiveRiskEntry[]; executiveRecommendations: string[] } {
  const all = [...input.blockers, ...input.warnings];
  const riskRegister = all
    .filter((f) => f.severity === "critical" || f.severity === "high" || f.severity === "medium")
    .map((finding) => ({
      riskId: `risk-${finding.blockerId}`,
      ruleId: finding.ruleId,
      executiveDomain: finding.executiveDomain,
      severity: finding.severity,
      summary: finding.message,
      mitigation: finding.recommendation,
    }));

  const recommendations = new Set<string>();
  if (input.blockers.some((b) => b.ruleKind === "approval_flow" || b.ruleKind === "authorization_centre")) {
    recommendations.add("Restore approval queue visibility before executive actions");
  }
  if (input.blockers.some((b) => b.ruleKind === "automation_centre" || b.ruleKind === "automation_visibility")) {
    recommendations.add("Restore business automation visibility in Cockpit");
  }
  if (input.blockers.some((b) => b.ruleKind === "executive_action_safety")) {
    recommendations.add("Review executive action safety and Pillow authority gates");
  }
  if (input.blockers.some((b) => b.ruleKind === "global_ai_assistant")) {
    recommendations.add("Restore Global AI Assistant context for executive operations");
  }
  if (input.blockers.length === 0 && input.warnings.length === 0) {
    recommendations.add("Executive operations certified — Grand King Cockpit ready for coherent operation");
  } else if (recommendations.size === 0) {
    recommendations.add("Review executive blockers and warnings before live executive operations");
  }

  return { riskRegister, executiveRecommendations: [...recommendations] };
}
