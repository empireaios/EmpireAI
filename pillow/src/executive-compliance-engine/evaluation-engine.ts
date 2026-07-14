/** E5-04 — Compliance Evaluation Engine. */

import { resolveEnforcement } from "./enforcement.js";
import { appendComplianceLog, createLogEntry } from "./logging.js";
import { getEnabledPolicies } from "./policy-registry.js";
import type { ComplianceEngineConfiguration } from "./configuration.js";
import type {
  ComplianceActionType,
  ComplianceEvaluationRequest,
  ComplianceEvaluationResponse,
  ComplianceEvaluationResult,
  CompliancePolicyRecord,
} from "./types.js";

function deriveResult(
  policies: CompliancePolicyRecord[],
  violations: string[],
): ComplianceEvaluationResult {
  if (violations.length === 0) return "PASS";
  const severities = policies
    .filter((p) => violations.includes(p.policyId))
    .map((p) => p.severity);
  if (severities.includes("critical")) return "CRITICAL";
  if (severities.includes("high")) return "VIOLATION";
  return "WARNING";
}

function checkPolicyCompliance(
  policy: CompliancePolicyRecord,
  request: ComplianceEvaluationRequest,
): { compliant: boolean; reason: string } {
  const action = request.action.toLowerCase();
  const context = JSON.stringify(request.context ?? {}).toLowerCase();

  if (policy.policyId === "cpol-constitution-hierarchy") {
    if (context.includes("bypass_constitution") || action.includes("unconstitutional")) {
      return { compliant: false, reason: "Constitutional bypass detected" };
    }
  }
  if (policy.policyId === "cpol-infrastructure-canonical") {
    if (action.includes("competing system") || context.includes("duplicate_engine")) {
      return { compliant: false, reason: "Competing system creation violates canonical architecture" };
    }
  }
  if (policy.policyId === "cpol-ai-safety") {
    if (request.actionType === "ai_decision" && context.includes("no_human_oversight")) {
      return { compliant: false, reason: "AI decision without human oversight" };
    }
  }
  if (policy.policyId === "cpol-security-access") {
    if (context.includes("unauthorized") || context.includes("missing_auth")) {
      return { compliant: false, reason: "Unauthorized access attempt" };
    }
  }
  return { compliant: true, reason: "Policy requirements satisfied" };
}

export function evaluateCompliance(
  request: ComplianceEvaluationRequest,
  policies: CompliancePolicyRecord[],
  config: ComplianceEngineConfiguration,
): ComplianceEvaluationResponse {
  const enabled = getEnabledPolicies(policies);
  const applicable = request.policyIds?.length
    ? enabled.filter((p) => request.policyIds!.includes(p.policyId))
    : enabled;

  const violations: Array<{ policyId: string; explanation: string; severity: string }> = [];
  const explanations: string[] = [];

  for (const policy of applicable) {
    const check = checkPolicyCompliance(policy, request);
    if (!check.compliant) {
      violations.push({
        policyId: policy.policyId,
        explanation: check.reason,
        severity: policy.severity,
      });
      explanations.push(`${policy.title}: ${check.reason}`);
    }
  }

  const violatedPolicyIds = violations.map((v) => v.policyId);
  const result = deriveResult(applicable, violatedPolicyIds);
  const enforcement = resolveEnforcement(result, config.defaultEnforcementMode);

  const evaluationId = `eval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const remediation =
    violations.length === 0
      ? "No remediation required"
      : violations.map((v) => `Resolve ${v.policyId}: ${v.explanation}`).join("; ");

  const logEntry = createLogEntry({
    evaluationId,
    actor: request.actor,
    action: request.action,
    actionType: request.actionType,
    policiesChecked: applicable.map((p) => p.policyId),
    result,
    violations: violatedPolicyIds,
    enforcementAction: enforcement.effectiveMode,
    explanation: explanations.join("; ") || "All policies satisfied",
    executionContext: request.context ?? {},
  });
  appendComplianceLog(logEntry);

  return {
    evaluationId,
    result,
    violatedPolicyIds,
    explanation: explanations.join("; ") || "All applicable policies satisfied",
    severity: violations.length > 0 ? (violations[0]?.severity ?? "unknown") : "none",
    recommendedRemediation: remediation,
    timestamp: logEntry.timestamp,
    executionContext: request.context ?? {},
    enforcement,
    policiesChecked: applicable.map((p) => p.policyId),
  };
}

export function evaluateExecutiveAction(
  actor: string,
  action: string,
  actionType: ComplianceActionType = "executive_action",
  context: Record<string, unknown> = {},
  config: ComplianceEngineConfiguration,
  policies: CompliancePolicyRecord[],
): ComplianceEvaluationResponse {
  return evaluateCompliance({ actor, action, actionType, context }, policies, config);
}
