import type { WorkerQualityStandardConfiguration } from "./configuration.js";
import type {
  QualityDecision,
  WorkerQualityStandardInput,
} from "./types.js";

export type QualityEvaluation = {
  workerId: string;
  missionId: string;
  reasoningSummary: string;
  confidenceScore: number;
  evidence: string[];
  assumptions: string[];
  limitations: string[];
  validationResult: QualityDecision;
  governanceCompliance: boolean;
  uncertaintyDetected: boolean;
  standardsChecked: string[];
  standardsSatisfied: string[];
  standardsFailed: string[];
  completionReport: string;
};

/** Pure worker quality evaluation helpers for Q0-27. */
export class QualityEvaluator {
  evaluate(
    input: WorkerQualityStandardInput,
    config: WorkerQualityStandardConfiguration,
  ): QualityEvaluation {
    const standards = unique(input.requiredStandards ?? config.qualityStandards);
    const confidenceScore =
      input.confidenceScore != null && Number.isFinite(input.confidenceScore)
        ? Math.max(0, Math.min(100, Number(input.confidenceScore)))
        : 0;
    const evidence = unique(input.evidence ?? []);
    const assumptions = unique(input.assumptions ?? []);
    const limitations = unique(input.limitations ?? []);
    const uncertaintySignals = unique(input.uncertaintySignals ?? []);
    const uncertaintyDetected =
      uncertaintySignals.length > 0 ||
      confidenceScore < config.minConfidenceScore ||
      limitations.some((l) => /uncertain|unknown|unclear/i.test(l));

    const reasoningSummary =
      input.reasoningSummary?.trim() ||
      (input.structuredReasoningPerformed === true
        ? "Structured reasoning performed prior to output."
        : "");

    const governanceCompliance = input.governanceCompliant !== false;
    const structuredReasoning =
      input.structuredReasoningPerformed === true || reasoningSummary.length >= 20;
    const selfValidation = input.selfValidationPerformed !== false;

    const satisfied: string[] = [];
    const failed: string[] = [];

    for (const standard of standards) {
      const ok = this.standardSatisfied(standard, {
        structuredReasoning,
        selfValidation,
        confidenceScore,
        evidence,
        assumptions,
        limitations,
        governanceCompliance,
        config,
        completionReport: input.completionReport,
      });
      if (ok) satisfied.push(standard);
      else failed.push(standard);
    }

    let validationResult: QualityDecision = "compliant";
    if (failed.length === 0) validationResult = "compliant";
    else if (failed.length <= Math.ceil(standards.length / 3)) {
      validationResult = "partially_compliant";
    } else validationResult = "non_compliant";

    const completionReport =
      input.completionReport?.trim() ||
      [
        `Worker ${input.workerId?.trim() || "worker-unspecified"} quality check: ${validationResult}.`,
        `Confidence ${confidenceScore}.`,
        `Standards satisfied ${satisfied.length}/${standards.length}.`,
        failed.length ? `Failed: ${failed.join(", ")}.` : "All checked standards satisfied.",
      ].join(" ");

    return {
      workerId: input.workerId?.trim() || "worker-unspecified",
      missionId: input.missionId?.trim() || "mission-unspecified",
      reasoningSummary:
        reasoningSummary || "No structured reasoning summary provided.",
      confidenceScore,
      evidence,
      assumptions,
      limitations,
      validationResult,
      governanceCompliance,
      uncertaintyDetected,
      standardsChecked: standards,
      standardsSatisfied: satisfied,
      standardsFailed: failed,
      completionReport,
    };
  }

  private standardSatisfied(
    standard: string,
    ctx: {
      structuredReasoning: boolean;
      selfValidation: boolean;
      confidenceScore: number;
      evidence: string[];
      assumptions: string[];
      limitations: string[];
      governanceCompliance: boolean;
      config: WorkerQualityStandardConfiguration;
      completionReport?: string | null;
    },
  ): boolean {
    switch (standard) {
      case "structured_reasoning":
        return !ctx.config.requireStructuredReasoning || ctx.structuredReasoning;
      case "self_validation":
        return !ctx.config.requireSelfValidation || ctx.selfValidation;
      case "confidence_scoring":
        return (
          !ctx.config.confidenceRulesEnabled ||
          ctx.confidenceScore >= ctx.config.minConfidenceScore
        );
      case "evidence_tracking":
        return !ctx.config.requireEvidence || ctx.evidence.length > 0;
      case "assumption_recording":
        return !ctx.config.requireAssumptions || ctx.assumptions.length > 0;
      case "limitation_reporting":
        return !ctx.config.requireLimitations || ctx.limitations.length > 0;
      case "traceability":
        return ctx.evidence.length > 0 || ctx.structuredReasoning;
      case "governance_compliance":
        return !ctx.config.governanceRulesEnabled || ctx.governanceCompliance;
      case "standard_reporting":
        return !!ctx.completionReport?.trim() || ctx.selfValidation;
      default:
        // Future extensible standards pass unless explicitly failed elsewhere
        return true;
    }
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}
