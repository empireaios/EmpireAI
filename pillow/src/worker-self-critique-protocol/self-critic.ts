import type { WorkerSelfCritiqueProtocolConfiguration } from "./configuration.js";
import type {
  SubmissionDecision,
  WorkerSelfCritiqueProtocolInput,
} from "./types.js";

export type CritiqueEvaluation = {
  workerId: string;
  missionId: string;
  outputReviewed: string;
  completenessScore: number;
  logicalConsistency: number;
  factualConsistency: number;
  evidenceReview: string[];
  weaknessesFound: string[];
  suggestedImprovements: string[];
  revisedConfidenceScore: number;
  submissionDecision: SubmissionDecision;
  checksPerformed: string[];
  checksFailed: string[];
  assumptionsIdentified: string[];
  missingEvidence: string[];
  initialConfidenceScore: number;
  revisionRequired: boolean;
};

/** Pure self-critique evaluation helpers for Q0-28. */
export class SelfCritic {
  critique(
    input: WorkerSelfCritiqueProtocolInput,
    config: WorkerSelfCritiqueProtocolConfiguration,
  ): CritiqueEvaluation {
    const checks = unique(input.checks ?? config.critiqueChecks);
    const completenessScore = score(input.completenessScore, 75);
    const logicalConsistency = score(input.logicalConsistency, 75);
    const factualConsistency = score(input.factualConsistency, 75);
    const initialConfidenceScore = score(input.initialConfidenceScore, 70);
    const evidenceReview = unique(input.evidenceReview ?? []);
    const assumptionsIdentified = unique(input.assumptionsIdentified ?? []);
    const missingEvidence = unique(input.missingEvidence ?? []);
    const weaknessesFound = unique([
      ...(input.weaknessesFound ?? []),
      ...this.detectWeaknesses({
        completenessScore,
        logicalConsistency,
        factualConsistency,
        evidenceReview,
        missingEvidence,
        config,
      }),
    ]);
    const suggestedImprovements = unique([
      ...(input.suggestedImprovements ?? []),
      ...weaknessesFound.map((w) => `Improve: ${w.replace(/_/g, " ")}`),
    ]);

    const checksFailed = this.failedChecks(checks, {
      completenessScore,
      logicalConsistency,
      factualConsistency,
      evidenceReview,
      assumptionsIdentified,
      missingEvidence,
      weaknessesFound,
      config,
    });

    const revisedConfidenceScore = this.recalculateConfidence({
      initialConfidenceScore,
      completenessScore,
      logicalConsistency,
      factualConsistency,
      checksFailedCount: checksFailed.length,
      weaknessesCount: weaknessesFound.length,
      missingEvidenceCount: missingEvidence.length,
    });

    const submissionDecision = this.decideSubmission({
      input,
      config,
      revisedConfidenceScore,
      checksFailed,
      weaknessesFound,
      missingEvidence,
    });

    return {
      workerId: input.workerId?.trim() || "worker-unspecified",
      missionId: input.missionId?.trim() || "mission-unspecified",
      outputReviewed:
        input.outputReviewed?.trim() || "Completed worker output awaiting self-critique",
      completenessScore,
      logicalConsistency,
      factualConsistency,
      evidenceReview,
      weaknessesFound,
      suggestedImprovements,
      revisedConfidenceScore,
      submissionDecision,
      checksPerformed: checks,
      checksFailed,
      assumptionsIdentified,
      missingEvidence,
      initialConfidenceScore,
      revisionRequired:
        submissionDecision === "revise_before_submit" ||
        submissionDecision === "reject_output",
    };
  }

  private detectWeaknesses(params: {
    completenessScore: number;
    logicalConsistency: number;
    factualConsistency: number;
    evidenceReview: string[];
    missingEvidence: string[];
    config: WorkerSelfCritiqueProtocolConfiguration;
  }): string[] {
    const weaknesses: string[] = [];
    if (
      params.config.completenessRulesEnabled &&
      params.completenessScore < params.config.minCompletenessScore
    ) {
      weaknesses.push("incomplete_output");
    }
    if (
      params.config.consistencyRulesEnabled &&
      params.logicalConsistency < params.config.minLogicalConsistency
    ) {
      weaknesses.push("logical_inconsistency");
    }
    if (
      params.config.consistencyRulesEnabled &&
      params.factualConsistency < params.config.minFactualConsistency
    ) {
      weaknesses.push("factual_inconsistency");
    }
    if (params.config.evidenceRulesEnabled && params.evidenceReview.length === 0) {
      weaknesses.push("missing_evidence_review");
    }
    if (params.missingEvidence.length > 0) {
      weaknesses.push("missing_supporting_evidence");
    }
    return weaknesses;
  }

  private failedChecks(
    checks: string[],
    ctx: {
      completenessScore: number;
      logicalConsistency: number;
      factualConsistency: number;
      evidenceReview: string[];
      assumptionsIdentified: string[];
      missingEvidence: string[];
      weaknessesFound: string[];
      config: WorkerSelfCritiqueProtocolConfiguration;
    },
  ): string[] {
    const failed: string[] = [];
    for (const check of checks) {
      switch (check) {
        case "completeness":
          if (ctx.completenessScore < ctx.config.minCompletenessScore) failed.push(check);
          break;
        case "correctness":
        case "internal_consistency":
          if (ctx.logicalConsistency < ctx.config.minLogicalConsistency) failed.push(check);
          break;
        case "evidence":
          if (ctx.evidenceReview.length === 0 || ctx.missingEvidence.length > 0) {
            failed.push(check);
          }
          break;
        case "assumptions":
          if (ctx.assumptionsIdentified.length === 0) failed.push(check);
          break;
        case "risks":
          if (ctx.factualConsistency < ctx.config.minFactualConsistency) {
            failed.push(check);
          }
          break;
        case "missing_information":
          if (ctx.missingEvidence.length > 0) failed.push(check);
          break;
        case "quality":
          if (
            ctx.completenessScore < ctx.config.minCompletenessScore ||
            ctx.logicalConsistency < ctx.config.minLogicalConsistency
          ) {
            failed.push(check);
          }
          break;
        case "executive_readiness":
          if (
            ctx.completenessScore < ctx.config.minCompletenessScore ||
            ctx.evidenceReview.length === 0
          ) {
            failed.push(check);
          }
          break;
        default:
          break;
      }
    }
    return unique(failed);
  }

  private recalculateConfidence(params: {
    initialConfidenceScore: number;
    completenessScore: number;
    logicalConsistency: number;
    factualConsistency: number;
    checksFailedCount: number;
    weaknessesCount: number;
    missingEvidenceCount: number;
  }): number {
    const qualityAverage =
      (params.completenessScore + params.logicalConsistency + params.factualConsistency) / 3;
    let revised = (params.initialConfidenceScore * 0.4) + (qualityAverage * 0.6);
    revised -= params.checksFailedCount * 4;
    revised -= params.weaknessesCount * 3;
    revised -= params.missingEvidenceCount * 5;
    return Math.round(Math.max(0, Math.min(100, revised)) * 100) / 100;
  }

  private decideSubmission(params: {
    input: WorkerSelfCritiqueProtocolInput;
    config: WorkerSelfCritiqueProtocolConfiguration;
    revisedConfidenceScore: number;
    checksFailed: string[];
    weaknessesFound: string[];
    missingEvidence: string[];
  }): SubmissionDecision {
    const forced = normalizeDecision(params.input.forceDecision);
    if (forced) return forced;
    if (params.input.forceRevision === true) return "revise_before_submit";

    if (!params.config.decisionRulesEnabled) return "submit";

    if (
      params.checksFailed.includes("correctness") ||
      params.weaknessesFound.includes("factual_inconsistency")
    ) {
      return "reject_output";
    }
    if (params.missingEvidence.length >= 3 || params.checksFailed.length >= 5) {
      return "escalate";
    }
    if (
      params.revisedConfidenceScore < params.config.minConfidenceToSubmit ||
      params.revisedConfidenceScore <= params.config.reviseConfidenceCeiling ||
      params.weaknessesFound.length > 0 ||
      params.checksFailed.length > 0
    ) {
      return "revise_before_submit";
    }
    return "submit";
  }
}

function score(value: number | null | undefined, fallback: number) {
  if (value != null && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Number(value)));
  }
  return fallback;
}

function normalizeDecision(value: string | null | undefined): SubmissionDecision | null {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  if (
    normalized === "submit" ||
    normalized === "revise_before_submit" ||
    normalized === "escalate" ||
    normalized === "reject_output"
  ) {
    return normalized;
  }
  return null;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}
