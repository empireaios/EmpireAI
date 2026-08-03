import type { ChannelRecommendationWorkerConfiguration } from "./configuration.js";
import {
  CRW_METADATA_VERSION,
  CRW_REPORT_VERSION,
  RECOMMENDATION_DECISIONS,
} from "./paths.js";
import type {
  ChannelRecommendationReport,
  ChannelRecommendationWorkerCatalog,
  ChannelRecommendationWorkerInput,
  EvidenceItem,
  IntegrationHandshake,
  RankedOpportunity,
  RecommendationContext,
  RecommendationDecision,
  RiskAssessment,
  ScoredDimension,
} from "./types.js";

/** Pure Channel Recommendation Worker helpers for Q4-17 — structural signals only. */
export class RecommendationBuilder {
  buildCatalog(
    config: ChannelRecommendationWorkerConfiguration,
    reports: ChannelRecommendationReport[],
    integrations: IntegrationHandshake[],
  ): ChannelRecommendationWorkerCatalog {
    return {
      reportVersion: CRW_REPORT_VERSION,
      workerId: config.workerId,
      recommendationReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      recommendationDecisions: [...RECOMMENDATION_DECISIONS],
      metadataVersion: CRW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverCreateChannels: true,
      neverConfigurePlatformAccounts: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ418OrLater: true,
      neverCreateChannelsAutomatically: true,
      baseRecommendationsOnEvidence: true,
    };
  }

  mergeContext(
    input: ChannelRecommendationWorkerInput,
    context: RecommendationContext,
  ): RecommendationContext {
    // Empty-array traps for signals / segments / report ids
    const trendSignals =
      input.trendSignals && input.trendSignals.length > 0
        ? input.trendSignals.map((s) => ({ ...s }))
        : context.trendSignals && context.trendSignals.length > 0
          ? context.trendSignals.map((s) => ({ ...s }))
          : [];
    const analyticsSignals =
      input.analyticsSignals && input.analyticsSignals.length > 0
        ? input.analyticsSignals.map((s) => ({ ...s }))
        : context.analyticsSignals && context.analyticsSignals.length > 0
          ? context.analyticsSignals.map((s) => ({ ...s }))
          : [];
    const learningSignals =
      input.learningSignals && input.learningSignals.length > 0
        ? input.learningSignals.map((s) => ({ ...s }))
        : context.learningSignals && context.learningSignals.length > 0
          ? context.learningSignals.map((s) => ({ ...s }))
          : [];
    const audienceSegments =
      input.audienceSegments && input.audienceSegments.length > 0
        ? [...input.audienceSegments]
        : context.audienceSegments && context.audienceSegments.length > 0
          ? [...context.audienceSegments]
          : [];
    const geographyHints =
      input.geographyHints && input.geographyHints.length > 0
        ? [...input.geographyHints]
        : context.geographyHints && context.geographyHints.length > 0
          ? [...context.geographyHints]
          : [];
    const trendReportIds =
      input.trendReportIds && input.trendReportIds.length > 0
        ? [...input.trendReportIds]
        : context.trendReportIds && context.trendReportIds.length > 0
          ? [...context.trendReportIds]
          : [];
    const analyticsReportIds =
      input.analyticsReportIds && input.analyticsReportIds.length > 0
        ? [...input.analyticsReportIds]
        : context.analyticsReportIds && context.analyticsReportIds.length > 0
          ? [...context.analyticsReportIds]
          : [];
    const learningReportIds =
      input.learningReportIds && input.learningReportIds.length > 0
        ? [...input.learningReportIds]
        : context.learningReportIds && context.learningReportIds.length > 0
          ? [...context.learningReportIds]
          : [];

    const receivedTrend =
      context.receivedTrend ||
      trendSignals.length > 0 ||
      trendReportIds.length > 0;
    const receivedAnalytics =
      context.receivedAnalytics ||
      analyticsSignals.length > 0 ||
      analyticsReportIds.length > 0;
    const receivedLearning =
      context.receivedLearning ||
      learningSignals.length > 0 ||
      learningReportIds.length > 0;

    return {
      proposedChannelName:
        input.proposedChannelName ?? context.proposedChannelName ?? null,
      platform: input.platform ?? context.platform ?? null,
      niche: input.niche ?? context.niche ?? null,
      contentFormat: input.contentFormat ?? context.contentFormat ?? null,
      targetAudience: input.targetAudience ?? context.targetAudience ?? null,
      audienceSegments,
      geographyHints,
      channelIdHint: input.channelIdHint ?? context.channelIdHint ?? null,
      mediaBusinessId: input.mediaBusinessId ?? context.mediaBusinessId ?? null,
      trendReportIds,
      analyticsReportIds,
      learningReportIds,
      trendSignals,
      analyticsSignals,
      learningSignals,
      audiencePotentialHint:
        input.audiencePotentialHint ?? context.audiencePotentialHint ?? null,
      revenuePotentialHint:
        input.revenuePotentialHint ?? context.revenuePotentialHint ?? null,
      productionFeasibilityHint:
        input.productionFeasibilityHint ?? context.productionFeasibilityHint ?? null,
      competitionHint: input.competitionHint ?? context.competitionHint ?? null,
      strategicFitHint: input.strategicFitHint ?? context.strategicFitHint ?? null,
      sustainabilityHint:
        input.sustainabilityHint ?? context.sustainabilityHint ?? null,
      existingChannelCount:
        input.existingChannelCount ?? context.existingChannelCount ?? null,
      productionCapacityScore:
        input.productionCapacityScore ?? context.productionCapacityScore ?? null,
      strategicPriorityScore:
        input.strategicPriorityScore ?? context.strategicPriorityScore ?? null,
      receivedTrend,
      receivedAnalytics,
      receivedLearning,
      audiencePotential: context.audiencePotential,
      revenuePotential: context.revenuePotential,
      productionFeasibility: context.productionFeasibility,
      competitionAssessment: context.competitionAssessment,
      strategicFit: context.strategicFit,
      contentSustainability: context.contentSustainability,
      recommendation: context.recommendation,
      rankingPosition: context.rankingPosition ?? null,
      rankedOpportunities: context.rankedOpportunities ?? [],
      seedOpportunities: context.seedOpportunities ?? [],
    };
  }

  canRecommend(context: RecommendationContext): { ready: boolean; reason?: string } {
    const channelName = context.proposedChannelName?.trim();
    if (!channelName) {
      return {
        ready: false,
        reason: "Proposed channel name required before recommendation",
      };
    }
    const hasEvidenceSource =
      context.receivedTrend ||
      context.receivedAnalytics ||
      context.receivedLearning ||
      this.hasDirectInputEvidence(context);
    if (!hasEvidenceSource) {
      return {
        ready: false,
        reason:
          "At least one evidence source required (trend, analytics, learning, or direct hints)",
      };
    }
    return { ready: true };
  }

  hasDirectInputEvidence(context: RecommendationContext): boolean {
    return (
      context.audiencePotentialHint != null ||
      context.revenuePotentialHint != null ||
      context.productionFeasibilityHint != null ||
      context.competitionHint != null ||
      context.strategicFitHint != null ||
      context.sustainabilityHint != null ||
      (context.trendSignals?.length ?? 0) > 0 ||
      (context.analyticsSignals?.length ?? 0) > 0 ||
      (context.learningSignals?.length ?? 0) > 0
    );
  }

  analyseAudiencePotential(context: RecommendationContext, seq: number): ScoredDimension {
    const evidence: string[] = [];
    const scores: number[] = [];
    let factCount = 0;
    let assumptionCount = 0;

    const trends = context.trendSignals ?? [];
    // Empty-array trap
    if (trends.length > 0) {
      const demandScores = trends
        .map((t) => t.demandScore)
        .filter((v): v is number => v != null && Number.isFinite(v));
      if (demandScores.length > 0) {
        const avg = average(demandScores)!;
        scores.push(clamp(avg, 0, 100));
        evidence.push(`trend:demandAvg:${avg}`);
        factCount += 1;
      }
    }

    const analytics = context.analyticsSignals ?? [];
    if (analytics.length > 0) {
      const views = analytics.map((a) => a.views).filter(isFiniteNumber);
      const ctrs = analytics.map((a) => a.ctr).filter(isFiniteNumber);
      if (views.length > 0) {
        const viewScore = clamp(Math.round(Math.log10(Math.max(1, average(views)!)) * 20), 0, 100);
        scores.push(viewScore);
        evidence.push(`analytics:viewsScore:${viewScore}`);
        factCount += 1;
      }
      if (ctrs.length > 0) {
        const ctrScore = clamp(Math.round(average(ctrs)! * 10), 0, 100);
        scores.push(ctrScore);
        evidence.push(`analytics:ctrScore:${ctrScore}`);
        factCount += 1;
      }
    }

    const learning = context.learningSignals ?? [];
    if (learning.length > 0) {
      const success = learning.reduce((n, l) => n + (l.successfulPatternCount ?? 0), 0);
      const successScore = clamp(40 + success * 8, 0, 100);
      scores.push(successScore);
      evidence.push(`learning:successfulPatterns:${success}`);
      factCount += 1;
    }

    if (context.audiencePotentialHint != null) {
      scores.push(clamp(context.audiencePotentialHint, 0, 100));
      evidence.push(`hint:audiencePotential:${context.audiencePotentialHint}`);
      assumptionCount += 1;
    }

    if (scores.length === 0) {
      scores.push(50);
      evidence.push(`derived:audienceDefault:50`);
      assumptionCount += 1;
    }

    const score = clamp(Math.round(average(scores)!), 0, 100);
    return {
      score,
      summary: `Audience potential score ${score} from ${evidence.length} signal(s)`,
      evidenceRefs: unique([`dim:audience-${seq}`, ...evidence]),
      kind: dimensionKind(factCount, assumptionCount),
    };
  }

  analyseRevenuePotential(context: RecommendationContext, seq: number): ScoredDimension {
    const evidence: string[] = [];
    const scores: number[] = [];
    let factCount = 0;
    let assumptionCount = 0;
    let hasRevenueData = false;

    const analytics = context.analyticsSignals ?? [];
    // Empty-array trap
    if (analytics.length > 0) {
      const revenues = analytics
        .map((a) => a.revenueUsd)
        .filter((v): v is number => v != null && Number.isFinite(v) && v > 0);
      if (revenues.length > 0) {
        hasRevenueData = true;
        const revScore = clamp(Math.round(Math.log10(Math.max(1, average(revenues)!)) * 25), 0, 100);
        scores.push(revScore);
        evidence.push(`analytics:revenueScore:${revScore}`);
        factCount += 1;
      }
      const views = analytics.map((a) => a.views).filter(isFiniteNumber);
      const ctrs = analytics.map((a) => a.ctr).filter(isFiniteNumber);
      if (views.length > 0 || ctrs.length > 0) {
        const engagementProxy = clamp(
          Math.round(
            ((views.length ? Math.min(100, Math.log10(Math.max(1, average(views)!)) * 18) : 40) +
              (ctrs.length ? Math.min(100, average(ctrs)! * 8) : 40)) /
              2,
          ),
          0,
          100,
        );
        scores.push(engagementProxy);
        evidence.push(`analytics:engagementProxy:${engagementProxy}`);
        factCount += 1;
      }
    }

    if (context.revenuePotentialHint != null) {
      scores.push(clamp(context.revenuePotentialHint, 0, 100));
      evidence.push(`hint:revenuePotential:${context.revenuePotentialHint}`);
      assumptionCount += 1;
    }

    if (!hasRevenueData) {
      assumptionCount += 1;
      evidence.push("assumption:noRevenueData");
      if (scores.length === 0) {
        scores.push(35);
        evidence.push("derived:lowRevenueWithoutData:35");
      } else {
        // Soften when no direct revenue
        scores.push(40);
      }
    }

    if (scores.length === 0) {
      scores.push(35);
      evidence.push("derived:revenueDefault:35");
      assumptionCount += 1;
    }

    const score = clamp(Math.round(average(scores)!), 0, 100);
    return {
      score,
      summary: hasRevenueData
        ? `Revenue potential score ${score} with measured revenue signals`
        : `Revenue potential score ${score} — low/assumed due to missing revenue data`,
      evidenceRefs: unique([`dim:revenue-${seq}`, ...evidence]),
      kind: dimensionKind(factCount, assumptionCount),
    };
  }

  analyseProductionFeasibility(context: RecommendationContext, seq: number): ScoredDimension {
    const evidence: string[] = [];
    let score: number;
    let factCount = 0;
    let assumptionCount = 0;

    if (context.productionCapacityScore != null) {
      score = clamp(context.productionCapacityScore, 0, 100);
      evidence.push(`input:productionCapacity:${score}`);
      factCount += 1;
    } else if (context.productionFeasibilityHint != null) {
      score = clamp(context.productionFeasibilityHint, 0, 100);
      evidence.push(`hint:productionFeasibility:${score}`);
      assumptionCount += 1;
    } else if (context.contentFormat?.trim()) {
      score = 70;
      evidence.push(`assumption:formatKnownDefault:70:${context.contentFormat}`);
      assumptionCount += 1;
    } else {
      score = 55;
      evidence.push("assumption:productionDefault:55");
      assumptionCount += 1;
    }

    const existing = context.existingChannelCount ?? 0;
    if (existing > 0) {
      const penalty = Math.min(30, existing * 8);
      score = clamp(score - penalty, 0, 100);
      evidence.push(`derived:existingChannelPenalty:${penalty}:count:${existing}`);
      factCount += 1;
    }

    return {
      score,
      summary: `Production feasibility score ${score}${existing > 0 ? ` (reduced for ${existing} existing channels)` : ""}`,
      evidenceRefs: unique([`dim:feasibility-${seq}`, ...evidence]),
      kind: dimensionKind(factCount, assumptionCount),
    };
  }

  analyseCompetition(context: RecommendationContext, seq: number): ScoredDimension {
    const evidence: string[] = [];
    const scores: number[] = [];
    let factCount = 0;
    let assumptionCount = 0;

    const trends = context.trendSignals ?? [];
    // Empty-array trap
    if (trends.length > 0) {
      for (const trend of trends) {
        if (trend.competitionLevel) {
          const inverted = competitionLevelToScore(trend.competitionLevel);
          scores.push(inverted);
          evidence.push(
            `trend:competition:${trend.competitionLevel}:score:${inverted}`,
          );
          factCount += 1;
        }
      }
    }

    if (context.competitionHint != null) {
      scores.push(clamp(context.competitionHint, 0, 100));
      evidence.push(`hint:competition:${context.competitionHint}`);
      assumptionCount += 1;
    }

    if (scores.length === 0) {
      scores.push(50);
      evidence.push("assumption:competitionDefault:50");
      assumptionCount += 1;
    }

    const score = clamp(Math.round(average(scores)!), 0, 100);
    return {
      score,
      summary: `Competition assessment score ${score} (higher = more favourable / less crowded)`,
      evidenceRefs: unique([`dim:competition-${seq}`, ...evidence]),
      kind: dimensionKind(factCount, assumptionCount),
    };
  }

  analyseStrategicFit(context: RecommendationContext, seq: number): ScoredDimension {
    const evidence: string[] = [];
    const scores: number[] = [];
    let factCount = 0;
    let assumptionCount = 0;

    if (context.strategicPriorityScore != null) {
      scores.push(clamp(context.strategicPriorityScore, 0, 100));
      evidence.push(`input:strategicPriority:${context.strategicPriorityScore}`);
      factCount += 1;
    }

    if (context.strategicFitHint != null) {
      scores.push(clamp(context.strategicFitHint, 0, 100));
      evidence.push(`hint:strategicFit:${context.strategicFitHint}`);
      assumptionCount += 1;
    }

    const niche = context.niche?.trim()?.toLowerCase() ?? "";
    const learning = context.learningSignals ?? [];
    // Empty-array trap
    if (learning.length > 0 && niche) {
      const overlap = learning.some(
        (l) => l.topInsight?.toLowerCase().includes(niche) ?? false,
      );
      const overlapScore = overlap ? 80 : 55;
      scores.push(overlapScore);
      evidence.push(`learning:nicheOverlap:${overlap}:${overlapScore}`);
      factCount += 1;
    }

    if (scores.length === 0) {
      scores.push(60);
      evidence.push("assumption:strategicDefault:60");
      assumptionCount += 1;
    }

    const score = clamp(Math.round(average(scores)!), 0, 100);
    return {
      score,
      summary: `Strategic fit score ${score}`,
      evidenceRefs: unique([`dim:strategic-${seq}`, ...evidence]),
      kind: dimensionKind(factCount, assumptionCount),
    };
  }

  analyseExpectedContentSustainability(
    context: RecommendationContext,
    seq: number,
  ): ScoredDimension {
    const evidence: string[] = [];
    const scores: number[] = [];
    let factCount = 0;
    let assumptionCount = 0;

    const learning = context.learningSignals ?? [];
    // Empty-array trap
    if (learning.length > 0) {
      let success = 0;
      let failed = 0;
      for (const l of learning) {
        success += l.successfulPatternCount ?? 0;
        failed += l.failedPatternCount ?? 0;
      }
      const total = success + failed;
      const ratioScore =
        total > 0 ? clamp(Math.round((success / total) * 100), 0, 100) : 50;
      scores.push(ratioScore);
      evidence.push(`learning:successFailRatio:${success}:${failed}:${ratioScore}`);
      factCount += 1;
    }

    const analytics = context.analyticsSignals ?? [];
    if (analytics.length > 0) {
      const retentions = analytics.map((a) => a.retention).filter(isFiniteNumber);
      if (retentions.length > 0) {
        const retScore = clamp(Math.round(average(retentions)!), 0, 100);
        scores.push(retScore);
        evidence.push(`analytics:retention:${retScore}`);
        factCount += 1;
      }
    }

    if (context.sustainabilityHint != null) {
      scores.push(clamp(context.sustainabilityHint, 0, 100));
      evidence.push(`hint:sustainability:${context.sustainabilityHint}`);
      assumptionCount += 1;
    }

    if (scores.length === 0) {
      scores.push(50);
      evidence.push("assumption:sustainabilityDefault:50");
      assumptionCount += 1;
    }

    const score = clamp(Math.round(average(scores)!), 0, 100);
    return {
      score,
      summary: `Content sustainability score ${score}`,
      evidenceRefs: unique([`dim:sustainability-${seq}`, ...evidence]),
      kind: dimensionKind(factCount, assumptionCount),
    };
  }

  buildRiskAssessment(
    audience: ScoredDimension,
    revenue: ScoredDimension,
    feasibility: ScoredDimension,
    competition: ScoredDimension,
    strategic: ScoredDimension,
    sustainability: ScoredDimension,
  ): RiskAssessment {
    const factors: string[] = [];
    let riskScore = 0;

    if (competition.score < 40) {
      riskScore += 25;
      factors.push("High competition pressure (low competition favourability score)");
    }
    if (feasibility.score < 40) {
      riskScore += 25;
      factors.push("Low production feasibility");
    }
    if (revenue.score < 40) {
      riskScore += 15;
      factors.push("Weak revenue potential");
    }
    if (audience.score < 40) {
      riskScore += 15;
      factors.push("Weak audience potential");
    }
    if (sustainability.score < 40) {
      riskScore += 10;
      factors.push("Weak content sustainability");
    }
    if (strategic.score < 40) {
      riskScore += 10;
      factors.push("Weak strategic fit");
    }

    // Empty-array trap
    if (factors.length === 0) {
      factors.push("No elevated risk factors detected from scored dimensions");
      riskScore = Math.max(10, 100 - Math.round((audience.score + feasibility.score) / 2));
    }

    riskScore = clamp(riskScore, 0, 100);
    const overallRisk =
      riskScore >= 60 ? "high" : riskScore >= 35 ? "medium" : "low";

    return {
      overallRisk,
      riskScore,
      factors,
      notes: `Risk ${overallRisk} (score ${riskScore}) from dimension pressures`,
    };
  }

  computeOverallScore(dims: {
    audience: ScoredDimension;
    revenue: ScoredDimension;
    feasibility: ScoredDimension;
    competition: ScoredDimension;
    strategic: ScoredDimension;
    sustainability: ScoredDimension;
  }): number {
    return clamp(
      Math.round(
        dims.audience.score * 0.2 +
          dims.revenue.score * 0.2 +
          dims.feasibility.score * 0.15 +
          dims.competition.score * 0.15 +
          dims.strategic.score * 0.15 +
          dims.sustainability.score * 0.15,
      ),
      0,
      100,
    );
  }

  recommendProceedMonitorOrReject(
    overallScore: number,
    risk: RiskAssessment,
    config: ChannelRecommendationWorkerConfiguration,
  ): RecommendationDecision {
    const proceed = config.proceedThreshold ?? 75;
    const monitor = config.monitorThreshold ?? 50;
    if (overallScore >= proceed && risk.overallRisk !== "high") return "Proceed";
    if (overallScore >= monitor) return "Monitor";
    return "Reject";
  }

  buildRecommendationRationale(
    decision: RecommendationDecision,
    overallScore: number,
    risk: RiskAssessment,
    dims: {
      audience: ScoredDimension;
      revenue: ScoredDimension;
      feasibility: ScoredDimension;
      competition: ScoredDimension;
      strategic: ScoredDimension;
      sustainability: ScoredDimension;
    },
    evidence: EvidenceItem[],
  ): string {
    const refs = evidence.slice(0, 6).map((e) => e.evidenceId);
    // Empty-array trap
    const refText = refs.length > 0 ? refs.join(", ") : "derived-signals";
    return (
      `Recommendation ${decision} at overallScore=${overallScore} with risk=${risk.overallRisk} ` +
      `(riskScore=${risk.riskScore}). Weighted dimensions: audience=${dims.audience.score}, ` +
      `revenue=${dims.revenue.score}, feasibility=${dims.feasibility.score}, ` +
      `competition=${dims.competition.score}, strategic=${dims.strategic.score}, ` +
      `sustainability=${dims.sustainability.score}. Evidence refs: ${refText}. ` +
      `Structural recommendation only — never create channels automatically.`
    );
  }

  buildSupportingEvidence(
    context: RecommendationContext,
    seq: number,
  ): EvidenceItem[] {
    const items: EvidenceItem[] = [];
    let index = 0;
    const push = (
      sourceType: EvidenceItem["sourceType"],
      sourceRef: string,
      statement: string,
      kind: EvidenceItem["kind"],
    ) => {
      index += 1;
      items.push({
        evidenceId: `crw-ev-${seq}-${index}`,
        sourceType,
        sourceRef,
        statement,
        kind,
      });
    };

    const trends = context.trendSignals ?? [];
    // Empty-array traps
    if (trends.length > 0) {
      for (const t of trends) {
        push(
          "trend_research",
          t.trendId ?? "trend:unknown",
          t.summary ??
            `Trend topic=${t.topic ?? "n/a"} demand=${t.demandScore ?? "n/a"} competition=${t.competitionLevel ?? "n/a"}`,
          t.demandScore != null ? "fact" : "assumption",
        );
      }
    }
    const analytics = context.analyticsSignals ?? [];
    if (analytics.length > 0) {
      for (const a of analytics) {
        push(
          "media_analytics",
          a.analyticsReportId ?? "analytics:unknown",
          `Analytics views=${a.views ?? "n/a"} ctr=${a.ctr ?? "n/a"} retention=${a.retention ?? "n/a"} revenue=${a.revenueUsd ?? "n/a"}`,
          a.views != null || a.ctr != null || a.revenueUsd != null ? "fact" : "assumption",
        );
      }
    }
    const learning = context.learningSignals ?? [];
    if (learning.length > 0) {
      for (const l of learning) {
        push(
          "media_learning",
          l.learningReportId ?? "learning:unknown",
          l.topInsight ??
            `Learning success=${l.successfulPatternCount ?? 0} fail=${l.failedPatternCount ?? 0}`,
          l.successfulPatternCount != null || l.failedPatternCount != null
            ? "fact"
            : "assumption",
        );
      }
    }
    if (context.audiencePotentialHint != null) {
      push(
        "input",
        "hint:audiencePotential",
        `Audience potential hint ${context.audiencePotentialHint}`,
        "assumption",
      );
    }
    if (context.revenuePotentialHint != null) {
      push(
        "input",
        "hint:revenuePotential",
        `Revenue potential hint ${context.revenuePotentialHint}`,
        "assumption",
      );
    }
    if (context.productionCapacityScore != null) {
      push(
        "input",
        "input:productionCapacity",
        `Production capacity score ${context.productionCapacityScore}`,
        "fact",
      );
    }
    if (context.strategicPriorityScore != null) {
      push(
        "input",
        "input:strategicPriority",
        `Strategic priority score ${context.strategicPriorityScore}`,
        "fact",
      );
    }
    if (context.proposedChannelName?.trim()) {
      push(
        "input",
        "input:proposedChannel",
        `Proposed channel ${context.proposedChannelName}`,
        "fact",
      );
    }
    // Ensure at least one evidence item
    if (items.length === 0) {
      push(
        "derived",
        "derived:baseline",
        "Baseline structural recommendation without rich upstream signals",
        "assumption",
      );
    }
    return items;
  }

  rankChannelOpportunities(
    primary: {
      recommendationId: string;
      proposedChannelName: string;
      overallScore: number;
      recommendation: RecommendationDecision;
    },
    context: RecommendationContext,
    config: ChannelRecommendationWorkerConfiguration,
  ): { rankingPosition: number; rankedOpportunities: RankedOpportunity[] } {
    const opportunities: RankedOpportunity[] = [
      {
        recommendationId: primary.recommendationId,
        proposedChannelName: primary.proposedChannelName,
        overallScore: primary.overallScore,
        recommendation: primary.recommendation,
      },
    ];

    const seeds = context.seedOpportunities ?? [];
    // Empty-array trap
    if (seeds.length > 0) {
      let seedIndex = 0;
      for (const seed of seeds) {
        seedIndex += 1;
        if (!seed.proposedChannelName?.trim()) continue;
        if (
          seed.proposedChannelName.trim().toLowerCase() ===
          primary.proposedChannelName.trim().toLowerCase()
        ) {
          continue;
        }
        const seedContext: RecommendationContext = {
          ...context,
          proposedChannelName: seed.proposedChannelName,
          platform: seed.platform ?? context.platform,
          niche: seed.niche ?? context.niche,
          contentFormat: seed.contentFormat ?? context.contentFormat,
        };
        const dims = this.scoreAllDimensions(seedContext, seedIndex);
        const risk = this.buildRiskAssessment(
          dims.audience,
          dims.revenue,
          dims.feasibility,
          dims.competition,
          dims.strategic,
          dims.sustainability,
        );
        const overall = this.computeOverallScore(dims);
        const decision = this.recommendProceedMonitorOrReject(overall, risk, config);
        opportunities.push({
          recommendationId: `crw-rank-${seedIndex}-${Date.now()}`,
          proposedChannelName: seed.proposedChannelName,
          overallScore: overall,
          recommendation: decision,
        });
      }
    }

    // Also include any prior ranked opportunities from context
    const prior = context.rankedOpportunities ?? [];
    if (prior.length > 0) {
      for (const item of prior) {
        if (
          !opportunities.some(
            (o) =>
              o.recommendationId === item.recommendationId ||
              o.proposedChannelName === item.proposedChannelName,
          )
        ) {
          opportunities.push({ ...item });
        }
      }
    }

    opportunities.sort((a, b) => b.overallScore - a.overallScore);
    const rankingPosition =
      opportunities.findIndex((o) => o.recommendationId === primary.recommendationId) + 1;

    return {
      rankingPosition: rankingPosition > 0 ? rankingPosition : 1,
      rankedOpportunities: opportunities,
    };
  }

  scoreAllDimensions(context: RecommendationContext, seq: number) {
    return {
      audience: this.analyseAudiencePotential(context, seq),
      revenue: this.analyseRevenuePotential(context, seq),
      feasibility: this.analyseProductionFeasibility(context, seq),
      competition: this.analyseCompetition(context, seq),
      strategic: this.analyseStrategicFit(context, seq),
      sustainability: this.analyseExpectedContentSustainability(context, seq),
    };
  }

  computeConfidenceScore(
    evidence: EvidenceItem[],
    dims: ReturnType<RecommendationBuilder["scoreAllDimensions"]>,
  ): number {
    let score = 55;
    // Empty-array trap
    const evidenceCount = evidence?.length ?? 0;
    score += Math.min(20, evidenceCount * 3);
    const factCount = evidence.filter((e) => e.kind === "fact").length;
    const assumptionCount = evidence.filter((e) => e.kind === "assumption").length;
    score += Math.min(15, factCount * 3);
    score -= Math.min(20, assumptionCount * 3);
    const mixedDims = Object.values(dims).filter((d) => d.kind === "mixed").length;
    score -= mixedDims * 2;
    return clamp(Math.round(score), 0, 100);
  }

  buildRecommendationReport(
    input: ChannelRecommendationWorkerInput,
    config: ChannelRecommendationWorkerConfiguration,
    context: RecommendationContext,
    options: {
      audiencePotential?: ScoredDimension;
      revenuePotential?: ScoredDimension;
      productionFeasibility?: ScoredDimension;
      competitionAssessment?: ScoredDimension;
      strategicFit?: ScoredDimension;
      contentSustainability?: ScoredDimension;
      recommendation?: RecommendationDecision;
      rankingPosition?: number | null;
      rankedOpportunities?: RankedOpportunity[];
    } = {},
  ): ChannelRecommendationReport {
    recommendationSequence += 1;
    const seq = recommendationSequence;
    const now = new Date().toISOString();

    const channelName =
      context.proposedChannelName?.trim() ||
      input.proposedChannelName?.trim() ||
      `channel-opportunity-${seq}`;
    const recommendationId =
      input.recommendationId?.trim() || `crw-rpt-${Date.now()}-${seq}`;
    const platform = context.platform?.trim() || input.platform?.trim() || "unspecified";
    const niche = context.niche?.trim() || input.niche?.trim() || "general";
    const contentFormat =
      context.contentFormat ?? input.contentFormat ?? null;
    const mediaBusinessId =
      context.mediaBusinessId?.trim() ||
      input.mediaBusinessId?.trim() ||
      `biz-media-${channelName}`;

    const dims = this.scoreAllDimensions(context, seq);
    const audiencePotential = options.audiencePotential ?? context.audiencePotential ?? dims.audience;
    const revenuePotential = options.revenuePotential ?? context.revenuePotential ?? dims.revenue;
    const productionFeasibility =
      options.productionFeasibility ?? context.productionFeasibility ?? dims.feasibility;
    const competitionAssessment =
      options.competitionAssessment ?? context.competitionAssessment ?? dims.competition;
    const strategicFit = options.strategicFit ?? context.strategicFit ?? dims.strategic;
    const contentSustainability =
      options.contentSustainability ?? context.contentSustainability ?? dims.sustainability;

    const scored = {
      audience: audiencePotential,
      revenue: revenuePotential,
      feasibility: productionFeasibility,
      competition: competitionAssessment,
      strategic: strategicFit,
      sustainability: contentSustainability,
    };

    const riskAssessment = this.buildRiskAssessment(
      audiencePotential,
      revenuePotential,
      productionFeasibility,
      competitionAssessment,
      strategicFit,
      contentSustainability,
    );
    const overallScore = this.computeOverallScore(scored);
    const recommendation =
      options.recommendation ??
      context.recommendation ??
      this.recommendProceedMonitorOrReject(overallScore, riskAssessment, config);

    const supportingEvidence = this.buildSupportingEvidence(context, seq);
    const recommendationRationale = this.buildRecommendationRationale(
      recommendation,
      overallScore,
      riskAssessment,
      scored,
      supportingEvidence,
    );

    const ranking = this.rankChannelOpportunities(
      {
        recommendationId,
        proposedChannelName: channelName,
        overallScore,
        recommendation,
      },
      context,
      config,
    );
    const rankingPosition =
      options.rankingPosition ?? context.rankingPosition ?? ranking.rankingPosition;
    const rankedOpportunities =
      options.rankedOpportunities && options.rankedOpportunities.length > 0
        ? options.rankedOpportunities
        : ranking.rankedOpportunities;

    const confidenceScore = this.computeConfidenceScore(supportingEvidence, scored);

    const audienceSegments =
      context.audienceSegments && context.audienceSegments.length > 0
        ? [...context.audienceSegments]
        : niche
          ? [`${niche}-core`]
          : ["general-audience"];
    const geographyHints =
      context.geographyHints && context.geographyHints.length > 0
        ? [...context.geographyHints]
        : [];
    const primaryAudience =
      context.targetAudience?.trim() ||
      input.targetAudience?.trim() ||
      (audienceSegments.length > 0 ? audienceSegments[0]! : "general audience");

    const sourceTraceabilityRefs = unique([
      `recommendation:${recommendationId}`,
      `channel:${channelName}`,
      `platform:${platform}`,
      `niche:${niche}`,
      `business:${mediaBusinessId}`,
      ...(context.trendReportIds ?? []).map((id) => `trend:${id}`),
      ...(context.analyticsReportIds ?? []).map((id) => `analytics:${id}`),
      ...(context.learningReportIds ?? []).map((id) => `learning:${id}`),
      ...supportingEvidence.map((e) => e.evidenceId),
      `decision:${recommendation}`,
      `overallScore:${overallScore}`,
    ]);

    return {
      recommendationId,
      timestamp: now,
      proposedChannel: {
        channelName,
        platform,
        niche,
        contentFormat,
      },
      targetAudience: {
        primaryAudience,
        audienceSegments,
        geographyHints,
      },
      audiencePotential: cloneDimension(audiencePotential),
      revenuePotential: cloneDimension(revenuePotential),
      productionFeasibility: cloneDimension(productionFeasibility),
      competitionAssessment: cloneDimension(competitionAssessment),
      strategicFit: cloneDimension(strategicFit),
      contentSustainability: cloneDimension(contentSustainability),
      riskAssessment: {
        ...riskAssessment,
        factors: [...riskAssessment.factors],
      },
      overallScore,
      recommendation,
      recommendationRationale,
      supportingEvidence: supportingEvidence.map((e) => ({ ...e })),
      confidenceScore,
      metadataVersion: CRW_METADATA_VERSION,
      workerId: config.workerId,
      reportVersion: CRW_REPORT_VERSION,
      channelIdHint: context.channelIdHint ?? input.channelIdHint ?? null,
      mediaBusinessId,
      rankingPosition,
      rankedOpportunities: rankedOpportunities.map((o) => ({ ...o })),
      sourceTraceabilityRefs,
      preservedDecisions: [
        {
          decisionId: `crw-dec-${seq}-no-channel-creation`,
          topic: channelName,
          decision:
            "Produced channel recommendation only — never create channels automatically",
          recordedAt: now,
        },
        {
          decisionId: `crw-dec-${seq}-facts-vs-assumptions`,
          topic: channelName,
          decision:
            "Distinguished facts from assumptions across EvidenceItem.kind and ScoredDimension.kind",
          recordedAt: now,
        },
        {
          decisionId: `crw-dec-${seq}-explained`,
          topic: channelName,
          decision: `Explained recommendation ${recommendation} with rationale and evidence refs`,
          recordedAt: now,
        },
      ],
      neverCreateChannelsAutomatically: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverCreateChannels: true,
      neverConfigurePlatformAccounts: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ418OrLater: true,
      baseRecommendationsOnEvidence: true,
      preserveCompleteSourceTraceability: true,
      distinguishFactsFromAssumptions: true,
      explainEveryRecommendation: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}

let recommendationSequence = 0;

export function resetRecommendationSequenceForTesting() {
  recommendationSequence = 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])];
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(4));
}

function dimensionKind(
  factCount: number,
  assumptionCount: number,
): ScoredDimension["kind"] {
  if (factCount > 0 && assumptionCount > 0) return "mixed";
  if (factCount > 0) return "fact";
  return "assumption";
}

function competitionLevelToScore(level: string): number {
  const normalized = level.trim().toLowerCase();
  if (normalized === "low" || normalized === "none") return 85;
  if (normalized === "medium" || normalized === "moderate") return 55;
  if (normalized === "high" || normalized === "intense") return 25;
  if (normalized === "very_high" || normalized === "extreme") return 10;
  const asNumber = Number.parseFloat(normalized);
  if (Number.isFinite(asNumber)) {
    // Treat numeric competition as 0-100 intensity; invert
    return clamp(100 - asNumber, 0, 100);
  }
  return 50;
}

function cloneDimension(dim: ScoredDimension): ScoredDimension {
  return {
    ...dim,
    evidenceRefs: [...dim.evidenceRefs],
  };
}

function cloneReport(report: ChannelRecommendationReport): ChannelRecommendationReport {
  return {
    ...report,
    proposedChannel: { ...report.proposedChannel },
    targetAudience: {
      ...report.targetAudience,
      audienceSegments: [...report.targetAudience.audienceSegments],
      geographyHints: [...report.targetAudience.geographyHints],
    },
    audiencePotential: cloneDimension(report.audiencePotential),
    revenuePotential: cloneDimension(report.revenuePotential),
    productionFeasibility: cloneDimension(report.productionFeasibility),
    competitionAssessment: cloneDimension(report.competitionAssessment),
    strategicFit: cloneDimension(report.strategicFit),
    contentSustainability: cloneDimension(report.contentSustainability),
    riskAssessment: {
      ...report.riskAssessment,
      factors: [...report.riskAssessment.factors],
    },
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    rankedOpportunities: (report.rankedOpportunities ?? []).map((o) => ({ ...o })),
    sourceTraceabilityRefs: [...report.sourceTraceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
