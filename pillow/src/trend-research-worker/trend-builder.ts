import type { TrendResearchWorkerConfiguration } from "./configuration.js";
import type { MediaEnrichmentContext } from "./integrations.js";
import {
  APPROVED_RESEARCH_SOURCES,
  DEMAND_LEVELS,
  PRIORITY_LEVELS,
  TRW_METADATA_VERSION,
  TREND_CATEGORIES,
  TREND_DIRECTIONS,
  TREND_RESEARCH_REPORT_VERSION,
  TREND_RESEARCH_WORKER_IDENTITY,
} from "./paths.js";
import type {
  DemandLevel,
  DiscoverySource,
  EvidenceItem,
  EvidenceKind,
  IntegrationHandshake,
  PriorityLevel,
  SignalScore,
  TrendCategory,
  TrendDirection,
  TrendResearchReport,
  TrendResearchWorkerCatalog,
  TrendResearchWorkerInput,
  TrendResearchWorkerRunReport,
} from "./types.js";

/** Pure Trend Research Worker helpers for Q4-03 — research only. */
export class TrendBuilder {
  buildCatalog(
    config: TrendResearchWorkerConfiguration,
    reports: TrendResearchReport[],
    integrations: IntegrationHandshake[],
  ): TrendResearchWorkerCatalog {
    return {
      reportVersion: TREND_RESEARCH_REPORT_VERSION,
      workerId: config.workerId,
      trendReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: TRW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverSelectPublishingTopics: true,
      neverWriteScripts: true,
      neverGenerateThumbnails: true,
      neverPublishContent: true,
      neverGenerateContentDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  buildReport(
    input: TrendResearchWorkerInput,
    config: TrendResearchWorkerConfiguration,
    enrichment?: MediaEnrichmentContext | null,
    focusCategory?: TrendCategory,
  ): TrendResearchReport {
    trendSequence += 1;
    const now = new Date().toISOString();
    const trendReportId =
      input.trendReportId?.trim() || `trw-trd-${Date.now()}-${trendSequence}`;
    const channelId =
      input.channelId?.trim() ||
      enrichment?.channelId?.trim() ||
      `chn-trw-${trendSequence}`;
    const mediaBusinessId =
      input.mediaBusinessId?.trim() ||
      enrichment?.mediaBusinessId?.trim() ||
      `mbiz-trw-${trendSequence}`;
    const mediaMissionId =
      input.mediaMissionId?.trim() ||
      enrichment?.mediaMissionId?.trim() ||
      `mfc-trw-${trendSequence}`;
    const trendTopic =
      input.trendTopic?.trim() || `Emerging media opportunity ${trendSequence}`;
    const discoverySource = this.normalizeDiscoverySource(input.discoverySource);
    const trendCategory = this.normalizeCategory(
      focusCategory ?? input.trendCategory ?? "hybrid",
    );
    const searchDemand = this.buildSearchDemand(input);
    const socialSignals = this.buildSocialSignals(input);
    const competitorActivity = this.buildCompetitorActivity(input);
    const currentEventRelevance = this.buildCurrentEventRelevance(input);
    const audienceBehaviour = this.buildAudienceBehaviour(input);
    const supportingEvidence = this.compileEvidence(
      input,
      trendReportId,
      discoverySource,
      now,
    );
    const trendDirection = this.classifyTrendDirection(
      input,
      searchDemand,
      socialSignals,
      competitorActivity,
      currentEventRelevance,
      config,
    );
    const confidenceScore = this.scoreTrendConfidence(
      searchDemand,
      socialSignals,
      competitorActivity,
      currentEventRelevance,
      audienceBehaviour,
      supportingEvidence,
      input,
    );
    const recommendedPriority = this.recommendPriority(confidenceScore, trendDirection, config);
    const opportunityCategory = this.categorizeOpportunity(
      trendCategory,
      trendDirection,
      searchDemand,
      socialSignals,
    );
    const evidenceKinds = uniqueKinds(supportingEvidence.map((e) => e.kind));
    const traceabilityRefs = unique([
      `discovery:${discoverySource}`,
      `channel:${channelId}`,
      `mission:${mediaMissionId}`,
      ...(enrichment?.editorialReportId
        ? [`editorial:${enrichment.editorialReportId}`]
        : []),
    ]);
    const preservedDecisions = [
      {
        decisionId: `trw-dec-${trendSequence}`,
        topic: trendTopic,
        decision: `Trend classified as ${trendDirection} with ${recommendedPriority} priority — research signal only, no publishing decision`,
        recordedAt: now,
      },
    ];
    return {
      trendReportId,
      timestamp: now,
      channelId,
      trendCategory,
      trendTopic,
      discoverySource,
      searchDemand,
      socialSignals,
      competitorActivity,
      currentEventRelevance,
      audienceBehaviour,
      confidenceScore,
      supportingEvidence,
      recommendedPriority,
      metadataVersion: TRW_METADATA_VERSION,
      mediaBusinessId,
      mediaMissionId,
      trendDirection,
      opportunityCategory,
      evidenceKinds,
      workerId: config.workerId || TREND_RESEARCH_WORKER_IDENTITY.workerId,
      reportVersion: TREND_RESEARCH_REPORT_VERSION,
      traceabilityRefs,
      preservedDecisions,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverSelectPublishingTopics: true,
      neverWriteScripts: true,
      neverGenerateThumbnails: true,
      neverPublishContent: true,
      neverGenerateContentDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ404OrLater: true,
      useApprovedResearchSourcesOnly: true,
      preserveCompleteSourceTraceability: true,
      preserveHistoricalTrendRecords: true,
      distinguishFactsFromAssumptions: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  buildSearchDemand(input: TrendResearchWorkerInput): SignalScore {
    const score = clamp(input.searchDemandScore ?? inferScoreFromLevel(input.searchDemandLevel), 0, 100);
    const level = input.searchDemandLevel?.trim() || scoreToDemandLevel(score);
    return {
      score,
      level,
      note: `Search demand monitored at ${level} (${score}/100)`,
    };
  }

  buildSocialSignals(input: TrendResearchWorkerInput): SignalScore {
    const score = clamp(input.socialSignalScore ?? 50, 0, 100);
    return {
      score,
      level: score >= 75 ? "high" : score >= 50 ? "moderate" : "low",
      note: input.socialSignalNotes?.trim() || `Social platform signals scored ${score}/100`,
    };
  }

  buildCompetitorActivity(input: TrendResearchWorkerInput): SignalScore {
    const score = clamp(input.competitorActivityScore ?? 50, 0, 100);
    return {
      score,
      level: score >= 70 ? "active" : score >= 40 ? "moderate" : "quiet",
      note: input.competitorNotes?.trim() || `Competitor channel activity scored ${score}/100`,
    };
  }

  buildCurrentEventRelevance(input: TrendResearchWorkerInput): SignalScore {
    const score = clamp(input.currentEventRelevanceScore ?? 40, 0, 100);
    return {
      score,
      level: score >= 70 ? "high_relevance" : score >= 40 ? "moderate_relevance" : "low_relevance",
      note: input.currentEventNotes?.trim() || `Current event relevance scored ${score}/100`,
    };
  }

  buildAudienceBehaviour(input: TrendResearchWorkerInput): SignalScore {
    const score = clamp(input.audienceBehaviourScore ?? 50, 0, 100);
    return {
      score,
      level: score >= 70 ? "engaged" : score >= 45 ? "stable" : "declining",
      note: input.audienceNotes?.trim() || `Audience behaviour signals scored ${score}/100`,
    };
  }

  scoreTrendConfidence(
    searchDemand: SignalScore,
    socialSignals: SignalScore,
    competitorActivity: SignalScore,
    currentEventRelevance: SignalScore,
    audienceBehaviour: SignalScore | undefined,
    evidence: EvidenceItem[],
    input: TrendResearchWorkerInput,
  ): number {
    if (input.confidenceScore != null && Number.isFinite(input.confidenceScore)) {
      return clamp(input.confidenceScore, 0, 100);
    }
    const audienceScore = audienceBehaviour?.score ?? 50;
    const weighted =
      searchDemand.score * 0.25 +
      socialSignals.score * 0.25 +
      competitorActivity.score * 0.2 +
      currentEventRelevance.score * 0.15 +
      audienceScore * 0.15;
    const factBonus = evidence.filter((e) => e.kind === "fact").length * 2;
    const assumptionPenalty = evidence.filter((e) => e.kind === "assumption").length;
    return clamp(Math.round(weighted + factBonus - assumptionPenalty * 0.5), 0, 100);
  }

  classifyTrendDirection(
    input: TrendResearchWorkerInput,
    searchDemand: SignalScore,
    socialSignals: SignalScore,
    competitorActivity: SignalScore,
    currentEventRelevance: SignalScore,
    config: TrendResearchWorkerConfiguration,
  ): TrendDirection {
    const explicit = normalizeDirection(input.trendDirection);
    if (explicit) return explicit;
    const composite =
      searchDemand.score * 0.35 +
      socialSignals.score * 0.35 +
      competitorActivity.score * 0.15 +
      currentEventRelevance.score * 0.15;
    if (composite >= config.emergingScoreThreshold) return "emerging";
    if (composite <= config.decliningScoreThreshold) return "declining";
    return "stable";
  }

  categorizeOpportunity(
    trendCategory: TrendCategory,
    trendDirection: TrendDirection,
    searchDemand: SignalScore,
    socialSignals: SignalScore,
  ): string {
    if (trendDirection === "emerging" && searchDemand.score >= 70) {
      return `${trendCategory}_search_opportunity`;
    }
    if (trendDirection === "emerging" && socialSignals.score >= 70) {
      return `${trendCategory}_social_opportunity`;
    }
    if (trendDirection === "declining") {
      return `${trendCategory}_declining_signal`;
    }
    return `${trendCategory}_monitoring_signal`;
  }

  recommendPriority(
    confidenceScore: number,
    trendDirection: TrendDirection,
    config: TrendResearchWorkerConfiguration,
  ): PriorityLevel {
    if (trendDirection === "emerging" && confidenceScore >= config.criticalConfidenceThreshold) {
      return "critical";
    }
    if (trendDirection === "emerging" && confidenceScore >= config.highConfidenceThreshold) {
      return "high";
    }
    if (confidenceScore >= config.mediumConfidenceThreshold) return "medium";
    if (trendDirection === "declining") return "watch";
    return "low";
  }

  compileEvidence(
    input: TrendResearchWorkerInput,
    trendReportId: string,
    discoverySource: DiscoverySource,
    now: string,
  ): EvidenceItem[] {
    const items: EvidenceItem[] = [];
    let seq = 0;
    for (const raw of input.supportingEvidence ?? []) {
      seq += 1;
      items.push({
        evidenceId: `trw-ev-${trendReportId}-${seq}`,
        source: raw.source?.trim() || discoverySource,
        claim: raw.claim?.trim() || "Structured trend signal recorded",
        kind: normalizeKind(raw.kind),
        relatedTopic: raw.relatedTopic?.trim() || "trend_research",
        recordedAt: now,
      });
    }
    if (input.searchDemandScore != null) {
      items.push({
        evidenceId: `trw-ev-${trendReportId}-search`,
        source: discoverySource,
        claim: `Search demand score=${input.searchDemandScore} level=${input.searchDemandLevel ?? "inferred"}`,
        kind: "fact",
        relatedTopic: "search_demand",
        recordedAt: now,
      });
    }
    if (input.socialSignalScore != null) {
      items.push({
        evidenceId: `trw-ev-${trendReportId}-social`,
        source: "social_listening",
        claim: input.socialSignalNotes?.trim() || `Social signal score=${input.socialSignalScore}`,
        kind: input.socialSignalNotes ? "fact" : "assumption",
        relatedTopic: "social",
        recordedAt: now,
      });
    }
    if (items.length === 0) {
      items.push({
        evidenceId: `trw-ev-${trendReportId}-default`,
        source: discoverySource,
        claim: `Trend topic '${input.trendTopic ?? "unspecified"}' monitored via approved source ${discoverySource}`,
        kind: "assumption",
        relatedTopic: "trend_research",
        recordedAt: now,
      });
    }
    return items;
  }

  normalizeDiscoverySource(source: string | null | undefined): DiscoverySource {
    const normalized = source?.trim() as DiscoverySource | undefined;
    if (normalized && (APPROVED_RESEARCH_SOURCES as readonly string[]).includes(normalized)) {
      return normalized;
    }
    return "approved_research_feed";
  }

  normalizeCategory(category: string | TrendCategory): TrendCategory {
    const normalized = category?.trim() as TrendCategory;
    return (TREND_CATEGORIES as readonly string[]).includes(normalized) ? normalized : "unknown";
  }
}

let trendSequence = 0;

export function resetTrendSequenceForTesting() {
  trendSequence = 0;
}

function cloneReport(report: TrendResearchReport): TrendResearchReport {
  return {
    ...report,
    searchDemand: { ...report.searchDemand },
    socialSignals: { ...report.socialSignals },
    competitorActivity: { ...report.competitorActivity },
    currentEventRelevance: { ...report.currentEventRelevance },
    audienceBehaviour: report.audienceBehaviour ? { ...report.audienceBehaviour } : undefined,
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    evidenceKinds: [...report.evidenceKinds],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueKinds(values: EvidenceKind[]) {
  return [...new Set(values)] as EvidenceKind[];
}

function normalizeKind(kind: string | EvidenceKind | null | undefined): EvidenceKind {
  return kind === "fact" ? "fact" : "assumption";
}

function normalizeDirection(direction: string | TrendDirection | null | undefined): TrendDirection | null {
  const normalized = direction?.trim() as TrendDirection | undefined;
  return normalized && (TREND_DIRECTIONS as readonly string[]).includes(normalized)
    ? normalized
    : null;
}

function scoreToDemandLevel(score: number): DemandLevel {
  if (score >= 85) return "surging";
  if (score >= 70) return "high";
  if (score >= 50) return "moderate";
  if (score >= 30) return "low";
  return "fading";
}

function inferScoreFromLevel(level: string | DemandLevel | null | undefined): number {
  switch (level?.trim()) {
    case "surging":
      return 90;
    case "high":
      return 75;
    case "moderate":
      return 55;
    case "low":
      return 35;
    case "fading":
      return 20;
    default:
      return 50;
  }
}

export type TrendBuilderAction = TrendResearchWorkerRunReport["action"];

export function focusCategoryForAction(action: TrendBuilderAction): TrendCategory | undefined {
  switch (action) {
    case "monitor_search_trends":
      return "search_demand";
    case "monitor_competitor_channels":
      return "competitor";
    case "monitor_social_platform_trends":
      return "social";
    case "monitor_audience_behaviour_signals":
      return "audience_behaviour";
    case "monitor_current_events":
      return "current_events";
    case "identify_emerging_trends":
    case "identify_declining_trends":
    case "categorize_opportunities":
    case "score_trend_confidence":
    case "produce_report":
      return "hybrid";
    default:
      return undefined;
  }
}
