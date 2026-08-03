import type { EscalationFrameworkConfiguration } from "./configuration.js";
import type {
  EscalationCategory,
  EscalationFrameworkInput,
  EscalationPriority,
  EscalationTriggerSignals,
  RiskAssessment,
} from "./types.js";

export type DetectionBundle = {
  category: EscalationCategory | string;
  triggerReason: string;
  priority: EscalationPriority;
  risk: RiskAssessment;
  evidence: string[];
  actions: string[];
  detectedConditions: string[];
};

/** Pure escalation detection helpers for Q0-22. */
export class EscalationDetector {
  detect(
    input: EscalationFrameworkInput,
    config: EscalationFrameworkConfiguration,
    forcedCategory?: EscalationCategory | string | null,
  ): DetectionBundle {
    const signals = input.signals ?? {};
    const conditions = this.collectConditions(signals, config);
    const category =
      forcedCategory?.toString().trim() ||
      input.escalationCategory?.toString().trim() ||
      this.primaryCategory(conditions) ||
      "executive_decision_required";

    const priority =
      normalizePriority(input.escalationPriority) ??
      this.priorityFor(category, signals, config);

    const risk = this.buildRisk(input, category, priority, conditions);
    const evidence = unique([
      ...(input.currentEvidence ?? []),
      ...conditions.map((c) => `condition:${c}`),
      ...(signals.missingFields ?? []).map((f) => `missing:${f}`),
      ...(signals.conflictingRecommendations ?? []).map((r) => `conflict:${r}`),
      ...(signals.conflictingEvidence ?? []).map((e) => `evidence_conflict:${e}`),
    ]);

    const actions = unique([
      ...(input.recommendedActions ?? []),
      "Route escalation to Pillow for executive authority",
      "Preserve supporting evidence for executive review",
      ...this.actionsFor(category),
    ]);

    const triggerReason =
      input.triggerReason?.trim() ||
      `Escalation required: ${category.replace(/_/g, " ")} (${conditions.join(", ") || "manual"})`;

    return {
      category,
      triggerReason,
      priority,
      risk,
      evidence,
      actions,
      detectedConditions: conditions,
    };
  }

  collectConditions(
    signals: EscalationTriggerSignals,
    config: EscalationFrameworkConfiguration,
  ): string[] {
    const conditions: string[] = [];
    if (
      signals.confidenceScore != null &&
      Number.isFinite(signals.confidenceScore) &&
      signals.confidenceScore < config.lowConfidenceThreshold
    ) {
      conditions.push("low_confidence");
    }
    if ((signals.missingFields ?? []).length > 0) conditions.push("missing_information");
    if ((signals.conflictingRecommendations ?? []).length > 0) {
      conditions.push("conflicting_recommendations");
    }
    if ((signals.conflictingEvidence ?? []).length > 0) conditions.push("conflicting_evidence");
    if (signals.authorityViolation === true) conditions.push("authority_limit");
    if (signals.policyViolation === true) conditions.push("policy_violation");
    if (signals.workerDeadlock === true) conditions.push("worker_deadlock");
    if (
      signals.repeatedFailureCount != null &&
      signals.repeatedFailureCount >= config.repeatedFailureThreshold
    ) {
      conditions.push("repeated_failures");
    }
    if (signals.technicalFailure === true) conditions.push("technical_failure");
    if (signals.businessRisk === true) conditions.push("business_risk");
    if (signals.securityRisk === true) conditions.push("security_risk");
    if (signals.executiveDecisionRequired === true) {
      conditions.push("executive_decision_required");
    }
    if (signals.unresolvedDisagreement === true) {
      conditions.push("unresolved_disagreement");
    }
    return unique(conditions);
  }

  private primaryCategory(conditions: string[]): EscalationCategory | null {
    const order: EscalationCategory[] = [
      "security_risk",
      "policy_violation",
      "authority_limit",
      "worker_deadlock",
      "conflicting_recommendations",
      "missing_information",
      "low_confidence",
      "technical_failure",
      "business_risk",
      "executive_decision_required",
    ];
    for (const category of order) {
      if (
        conditions.includes(category) ||
        (category === "low_confidence" && conditions.includes("low_confidence")) ||
        (category === "conflicting_recommendations" &&
          conditions.includes("conflicting_evidence"))
      ) {
        return category;
      }
    }
    if (conditions.includes("unresolved_disagreement")) return "conflicting_recommendations";
    if (conditions.includes("repeated_failures")) return "technical_failure";
    return null;
  }

  private priorityFor(
    category: string,
    signals: EscalationTriggerSignals,
    config: EscalationFrameworkConfiguration,
  ): EscalationPriority {
    if (category === "security_risk" || signals.securityRisk === true) return "critical";
    if (category === "policy_violation" || category === "authority_limit") return "critical";
    if (category === "worker_deadlock" || category === "executive_decision_required") return "high";
    if (category === "business_risk" || signals.businessRisk === true) return "high";
    if (category === "conflicting_recommendations") return "high";
    if (category === "missing_information") return "medium";
    if (
      category === "low_confidence" &&
      signals.confidenceScore != null &&
      signals.confidenceScore < config.lowConfidenceThreshold / 2
    ) {
      return "high";
    }
    if (category === "low_confidence") return "medium";
    if (category === "technical_failure") return "high";
    return "medium";
  }

  private buildRisk(
    input: EscalationFrameworkInput,
    category: string,
    priority: EscalationPriority,
    conditions: string[],
  ): RiskAssessment {
    const level =
      input.riskLevel ??
      (priority === "critical"
        ? "critical"
        : priority === "high"
          ? "high"
          : priority === "low"
            ? "low"
            : "medium");
    return {
      level,
      summary:
        input.riskSummary?.trim() ||
        `Escalation risk for ${category.replace(/_/g, " ")} awaiting Pillow authority`,
      factors: unique([...(input.riskFactors ?? []), ...conditions, `priority:${priority}`]),
    };
  }

  private actionsFor(category: string): string[] {
    switch (category) {
      case "low_confidence":
        return ["Request additional confidence evidence before proceeding"];
      case "missing_information":
        return ["Identify and supply missing information fields"];
      case "conflicting_recommendations":
        return ["Present conflicting recommendations for Pillow arbitration"];
      case "worker_deadlock":
        return ["Break worker deadlock with executive assignment"];
      case "executive_decision_required":
        return ["Obtain explicit Pillow executive decision"];
      case "policy_violation":
        return ["Halt progression until policy authority is confirmed"];
      case "authority_limit":
        return ["Do not exceed worker authority; await Pillow"];
      case "security_risk":
        return ["Contain security exposure pending Pillow review"];
      default:
        return ["Await Pillow executive intervention"];
    }
  }
}

function normalizePriority(value: string | null | undefined): EscalationPriority | null {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  if (
    normalized === "critical" ||
    normalized === "high" ||
    normalized === "medium" ||
    normalized === "low"
  ) {
    return normalized;
  }
  return null;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}
