import type { DecisionEngineConfiguration } from "./configuration.js";
import {
  CRITERION_LABELS,
  DE_METADATA_VERSION,
  EVALUATION_CRITERIA,
  INVERTED_CRITERIA,
} from "./paths.js";
import type {
  CandidateOption,
  CriterionScore,
  DecisionEngineInput,
  DecisionPackage,
  EvaluationMatrixRow,
  RecommendedOption,
  TradeOffAnalysis,
  ValidationStatus,
} from "./types.js";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

type RawProfile = Record<string, number>;

/** Structural scoring profiles by approach — inverted criteria use raw burden (higher = worse). */
const APPROACH_PROFILES: Record<string, RawProfile> = {
  aggressive_commit: {
    business_value: 88,
    strategic_alignment: 84,
    cost: 78,
    complexity: 72,
    risk: 75,
    time: 35,
    resource_requirement: 82,
    probability_of_success: 62,
  },
  phased_rollout: {
    business_value: 78,
    strategic_alignment: 86,
    cost: 55,
    complexity: 58,
    risk: 45,
    time: 58,
    resource_requirement: 60,
    probability_of_success: 78,
  },
  pilot_first: {
    business_value: 68,
    strategic_alignment: 80,
    cost: 38,
    complexity: 42,
    risk: 32,
    time: 70,
    resource_requirement: 40,
    probability_of_success: 72,
  },
  defer_monitor: {
    business_value: 42,
    strategic_alignment: 55,
    cost: 18,
    complexity: 22,
    risk: 28,
    time: 85,
    resource_requirement: 20,
    probability_of_success: 58,
  },
  cost_optimize: {
    business_value: 70,
    strategic_alignment: 72,
    cost: 28,
    complexity: 40,
    risk: 40,
    time: 55,
    resource_requirement: 35,
    probability_of_success: 74,
  },
  partner_outsource: {
    business_value: 76,
    strategic_alignment: 70,
    cost: 60,
    complexity: 50,
    risk: 58,
    time: 42,
    resource_requirement: 45,
    probability_of_success: 66,
  },
};

const DEFAULT_PROFILE: RawProfile = {
  business_value: 65,
  strategic_alignment: 65,
  cost: 50,
  complexity: 50,
  risk: 50,
  time: 50,
  resource_requirement: 50,
  probability_of_success: 60,
};

export class OptionEvaluator {
  evaluate(
    input: DecisionEngineInput,
    options: CandidateOption[],
    configuration: DecisionEngineConfiguration,
    validationStatus: ValidationStatus,
  ): DecisionPackage {
    const criteria = this.resolveCriteria(input, configuration);
    const matrix = options.map((option) => this.scoreOption(option, criteria, configuration, input));
    const recommended = this.recommend(options, matrix);
    const tradeOffAnalysis = this.buildTradeOffs(options, matrix, recommended.optionId);
    const confidenceScore = this.confidence(matrix, recommended.optionId, input);
    const timestamp = new Date().toISOString();
    const decisionId = `de-dec-${Date.now()}`;

    return {
      decisionId,
      timestamp,
      executiveObjective: input.executiveObjective.trim(),
      candidateOptions: options.map((o) => ({ ...o, tags: [...o.tags] })),
      evaluationMatrix: matrix,
      tradeOffAnalysis,
      recommendedOption: recommended,
      confidenceScore,
      riskAssessment: this.risks(input, options, recommended),
      assumptions: this.assumptions(input),
      missingInformation: this.missingInformation(input, options),
      supportingEvidence: this.evidence(input, matrix, recommended),
      metadataVersion: DE_METADATA_VERSION,
      decisionTraceId: `de-trace-${Date.now()}`,
      validationStatus,
      neverExecuteWork: true,
      neverAssignWorkers: true,
      neverApproveActions: true,
      neverOverridePillow: true,
      neverReplaceGrandKingApproval: true,
      workExecuted: false,
      workersAssigned: false,
      actionsApproved: false,
      pillowOverridden: false,
      grandKingApprovalReplaced: false,
      preserveDecisionTraceability: true,
      preserveAuditability: true,
      preserveDecisionIntegrity: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  private resolveCriteria(input: DecisionEngineInput, configuration: DecisionEngineConfiguration): string[] {
    return Array.from(
      new Set([
        ...configuration.evaluationCriteria,
        ...(input.criteriaHints ?? []).map((c) => c.trim().toLowerCase().replace(/\s+/g, "_")).filter(Boolean),
      ]),
    );
  }

  private scoreOption(
    option: CandidateOption,
    criteria: string[],
    configuration: DecisionEngineConfiguration,
    input: DecisionEngineInput,
  ): EvaluationMatrixRow {
    const raw = this.rawProfile(option, input);
    const scores: CriterionScore[] = criteria.map((criterionId) => {
      const weight = configuration.criterionWeights[criterionId] ?? 1;
      const rawValue = raw[criterionId] ?? 50;
      const inverted = (INVERTED_CRITERIA as readonly string[]).includes(criterionId);
      const score = clamp(inverted ? 100 - rawValue : rawValue);
      return {
        criterionId,
        criterionLabel: this.label(criterionId),
        score,
        weight,
        notes: inverted
          ? `Benefit-normalized from burden (${rawValue}); higher score means lower ${criterionId}`
          : `Direct benefit score for ${criterionId}`,
      };
    });
    const weightSum = scores.reduce((sum, s) => sum + s.weight, 0) || 1;
    const weightedTotal = Math.round((scores.reduce((sum, s) => sum + s.score * s.weight, 0) / weightSum) * 10) / 10;
    return { optionId: option.optionId, scores, weightedTotal };
  }

  private rawProfile(option: CandidateOption, input: DecisionEngineInput): RawProfile {
    const base = { ...(APPROACH_PROFILES[option.approach] ?? DEFAULT_PROFILE) };
    const objective = input.executiveObjective.toLowerCase();
    const hints = [...(input.contextHints ?? []), ...(input.constraintHints ?? []), ...(input.riskHints ?? [])]
      .join(" ")
      .toLowerCase();

    if (/compliance|regulat|governance|security/.test(objective + hints)) {
      base.strategic_alignment = clamp((base.strategic_alignment ?? 65) + 8);
      base.risk = clamp((base.risk ?? 50) + 6);
      base.probability_of_success = clamp((base.probability_of_success ?? 60) - 4);
    }
    if (/urgent|asap|immediate|deadline/.test(objective + hints)) {
      base.time = clamp((base.time ?? 50) - 12);
      base.resource_requirement = clamp((base.resource_requirement ?? 50) + 8);
    }
    if (/budget|cost.?sensitive|low.?cost/.test(objective + hints)) {
      base.cost = clamp((base.cost ?? 50) + (option.tags.includes("low_cost") ? -8 : 6));
    }
    if (option.tags.includes("custom")) {
      base.business_value = clamp((base.business_value ?? 65) + 4);
      base.strategic_alignment = clamp((base.strategic_alignment ?? 65) + 4);
    }
    return base;
  }

  private recommend(options: CandidateOption[], matrix: EvaluationMatrixRow[]): RecommendedOption {
    const ranked = [...matrix].sort((a, b) => b.weightedTotal - a.weightedTotal);
    const best = ranked[0]!;
    const option = options.find((o) => o.optionId === best.optionId)!;
    const second = ranked[1];
    const margin = second ? Math.round((best.weightedTotal - second.weightedTotal) * 10) / 10 : best.weightedTotal;
    const topCriteria = [...best.scores]
      .sort((a, b) => b.score * b.weight - a.score * a.weight)
      .slice(0, 3)
      .map((s) => `${s.criterionLabel} (${s.score})`)
      .join(", ");

    return {
      optionId: option.optionId,
      title: option.title,
      rationale:
        `Recommended because it leads the weighted evaluation at ${best.weightedTotal}` +
        (second ? ` (margin ${margin} over next option)` : "") +
        `. Strongest drivers: ${topCriteria}. Approach: ${option.approach}.`,
    };
  }

  private buildTradeOffs(
    options: CandidateOption[],
    matrix: EvaluationMatrixRow[],
    recommendedId: string,
  ): TradeOffAnalysis {
    const comparisons: TradeOffAnalysis["comparisons"] = [];
    const criteria = matrix[0]?.scores.map((s) => s.criterionId) ?? [...EVALUATION_CRITERIA];

    for (const criterionId of criteria) {
      const ranked = [...matrix]
        .map((row) => ({
          optionId: row.optionId,
          score: row.scores.find((s) => s.criterionId === criterionId)?.score ?? 0,
        }))
        .sort((a, b) => b.score - a.score);
      const lead = ranked[0]!;
      const trail = ranked[ranked.length - 1]!;
      if (lead.optionId === trail.optionId) continue;
      comparisons.push({
        criterionId,
        leadingOptionId: lead.optionId,
        trailingOptionId: trail.optionId,
        delta: lead.score - trail.score,
        insight: `${this.label(criterionId)} favors ${titleOf(options, lead.optionId)} over ${titleOf(options, trail.optionId)} by ${lead.score - trail.score} points`,
      });
    }

    const recommended = matrix.find((m) => m.optionId === recommendedId)!;
    const rivals = matrix.filter((m) => m.optionId !== recommendedId);
    const dominantTradeOffs = rivals.flatMap((rival) => {
      const losses = recommended.scores
        .map((score) => {
          const other = rival.scores.find((s) => s.criterionId === score.criterionId)?.score ?? 0;
          return { criterionId: score.criterionId, delta: other - score.score };
        })
        .filter((x) => x.delta > 8)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 2);
      return losses.map(
        (loss) =>
          `${titleOf(options, recommendedId)} trades ${this.label(loss.criterionId)} (−${loss.delta}) vs ${titleOf(options, rival.optionId)}`,
      );
    });

    return {
      summary: `Compared ${options.length} options across ${criteria.length} criteria; recommended ${titleOf(options, recommendedId)}.`,
      comparisons,
      dominantTradeOffs: Array.from(new Set(dominantTradeOffs)).slice(0, 6),
    };
  }

  private confidence(
    matrix: EvaluationMatrixRow[],
    recommendedId: string,
    input: DecisionEngineInput,
  ): number {
    const ranked = [...matrix].sort((a, b) => b.weightedTotal - a.weightedTotal);
    const best = ranked[0]!;
    const second = ranked[1];
    const margin = second ? best.weightedTotal - second.weightedTotal : 12;
    let score = 58 + Math.min(28, margin * 2.2);
    if ((input.evidenceHints?.length ?? 0) > 0) score += 6;
    if ((input.missingInfoHints?.length ?? 0) > 2) score -= 8;
    if (input.executiveObjective.trim().length < 24) score -= 6;
    if (best.optionId !== recommendedId) score -= 10;
    return clamp(score);
  }

  private risks(
    input: DecisionEngineInput,
    options: CandidateOption[],
    recommended: RecommendedOption,
  ): string[] {
    const option = options.find((o) => o.optionId === recommended.optionId)!;
    const risks = [
      ...(input.riskHints ?? []),
      `Recommended approach (${option.approach}) may underperform if assumptions fail`,
      "Recommendation does not constitute approval or execution authority",
    ];
    if (option.tags.includes("high_risk")) risks.push("Aggressive commitment elevates downside exposure");
    if (option.tags.includes("dependency")) risks.push("External dependency can introduce delivery and control risk");
    if (option.tags.includes("optionality")) risks.push("Deferral risks missing time-sensitive opportunity windows");
    return Array.from(new Set(risks.map((r) => r.trim()).filter(Boolean)));
  }

  private assumptions(input: DecisionEngineInput): string[] {
    return Array.from(
      new Set([
        ...(input.assumptionHints ?? []),
        "Objective statement accurately reflects executive intent",
        "Criterion weights reflect current strategic priorities",
        "No silent hard constraints were omitted from the problem statement",
        "Grand King / Pillow approval remains required before execution",
      ]),
    );
  }

  private missingInformation(input: DecisionEngineInput, options: CandidateOption[]): string[] {
    const missing = [
      ...(input.missingInfoHints ?? []),
      "Exact budget ceiling and timeline hard limits",
      "Confirmed dependency owners and readiness signals",
    ];
    if (!input.evidenceHints?.length) missing.push("Empirical evidence for expected business value");
    if (options.some((o) => o.approach === "partner_outsource")) {
      missing.push("Qualified partner shortlist and contracting constraints");
    }
    return Array.from(new Set(missing));
  }

  private evidence(
    input: DecisionEngineInput,
    matrix: EvaluationMatrixRow[],
    recommended: RecommendedOption,
  ): string[] {
    const row = matrix.find((m) => m.optionId === recommended.optionId)!;
    return [
      ...(input.evidenceHints ?? []).map((e) => e.trim()).filter(Boolean),
      `structural://decision-matrix/${recommended.optionId}`,
      `weighted_total=${row.weightedTotal}`,
      `criteria_count=${row.scores.length}`,
      `rationale=${recommended.rationale.slice(0, 120)}`,
    ];
  }

  private label(criterionId: string): string {
    if (criterionId in CRITERION_LABELS) {
      return CRITERION_LABELS[criterionId as keyof typeof CRITERION_LABELS];
    }
    return criterionId
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
}

function titleOf(options: CandidateOption[], optionId: string): string {
  return options.find((o) => o.optionId === optionId)?.title ?? optionId;
}
