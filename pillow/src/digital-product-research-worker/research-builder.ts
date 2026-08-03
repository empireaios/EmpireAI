import type { DigitalProductResearchWorkerConfiguration } from "./configuration.js";
import type { DpfEnrichmentContext } from "./integrations.js";
import {
  APPROVED_RESEARCH_SOURCES,
  DEMAND_LEVELS,
  DIGITAL_PRODUCT_RESEARCH_REPORT_VERSION,
  DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY,
  DPR_METADATA_VERSION,
  PRIORITY_LEVELS,
  PRODUCT_CATEGORIES,
} from "./paths.js";
import type {
  DemandLevel,
  DigitalProductResearchReport,
  DigitalProductResearchWorkerCatalog,
  DigitalProductResearchWorkerInput,
  DigitalProductResearchWorkerRunReport,
  DiscoverySource,
  EvidenceItem,
  EvidenceKind,
  IntegrationHandshake,
  PriorityLevel,
  ProductCategory,
} from "./types.js";

export type ResearchFocus =
  | "customer_pain_points"
  | "search_demand"
  | "market_gaps"
  | "competitor_products"
  | "emerging_trends"
  | "underserved_niches"
  | "estimate_demand"
  | "commercial_opportunity"
  | "full_report";

/** Pure Digital Product Research Worker helpers for Q5-02 — research only. */
export class ResearchBuilder {
  buildCatalog(
    config: DigitalProductResearchWorkerConfiguration,
    reports: DigitalProductResearchReport[],
    integrations: IntegrationHandshake[],
  ): DigitalProductResearchWorkerCatalog {
    return {
      reportVersion: DIGITAL_PRODUCT_RESEARCH_REPORT_VERSION,
      workerId: config.workerId,
      researchReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: DPR_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverCreateDigitalProducts: true,
      neverCreateSalesPages: true,
      neverProcessPayments: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  buildReport(
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
    enrichment?: DpfEnrichmentContext | null,
    focus: ResearchFocus = "full_report",
    existing?: DigitalProductResearchReport | null,
  ): DigitalProductResearchReport {
    researchSequence += 1;
    const now = new Date().toISOString();
    const researchReportId =
      input.researchReportId?.trim() ||
      existing?.researchReportId ||
      `dpr-rsh-${Date.now()}-${researchSequence}`;
    const opportunityId =
      input.opportunityId?.trim() ||
      existing?.opportunityId ||
      `dpr-opp-${Date.now()}-${researchSequence}`;
    const businessId =
      input.businessId?.trim() ||
      enrichment?.businessId?.trim() ||
      existing?.businessId ||
      `dbiz-dpr-${researchSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      enrichment?.factoryMissionId?.trim() ||
      existing?.factoryMissionId ||
      `dpf-dpr-${researchSequence}`;
    const productCategory = this.normalizeCategory(
      input.productCategory ??
        input.productType ??
        enrichment?.productType ??
        existing?.productCategory ??
        "unknown",
    );
    const researchTopic =
      input.researchTopic?.trim() ||
      existing?.researchTopic ||
      (enrichment?.businessName
        ? `Digital product research for ${enrichment.businessName}`
        : `Digital product opportunity ${researchSequence}`);
    const discoverySource = this.normalizeDiscoverySource(
      input.discoverySource ?? existing?.discoverySource,
    );
    const targetAudience =
      input.targetAudience?.trim() ||
      existing?.targetAudience ||
      "Digital product buyers seeking practical outcomes";

    const base = existing ? cloneReport(existing) : null;
    const customerPainPoints = this.resolvePainPoints(input, focus, base);
    const marketGap = this.resolveMarketGap(input, focus, base, researchTopic);
    const demand = this.resolveDemand(input, focus, base);
    const competitorSummary = this.resolveCompetitorSummary(input, focus, base);
    const revenue = this.resolveRevenue(input, focus, base, demand.demandScore);
    const supportingEvidence = this.compileEvidence(
      input,
      researchReportId,
      discoverySource,
      focus,
      now,
      base,
    );
    const opportunityScore = this.scoreOpportunity(
      input,
      demand.demandScore,
      revenue.revenuePotentialScore,
      supportingEvidence,
      focus,
      base,
    );
    const confidenceScore = this.scoreConfidence(
      input,
      supportingEvidence,
      demand.demandScore,
      opportunityScore,
      base,
    );
    const recommendedPriority = this.recommendPriority(
      opportunityScore,
      confidenceScore,
      config,
      input.recommendedPriority ?? base?.recommendedPriority,
    );
    const evidenceKinds = uniqueKinds(supportingEvidence.map((e) => e.kind));
    const traceabilityRefs = unique([
      ...(base?.traceabilityRefs ?? []),
      `discovery:${discoverySource}`,
      `business:${businessId}`,
      `mission:${factoryMissionId}`,
      `opportunity:${opportunityId}`,
      `focus:${focus}`,
    ]);
    const preservedDecisions = [
      ...(base?.preservedDecisions ?? []),
      {
        decisionId: `dpr-dec-${researchSequence}`,
        topic: researchTopic,
        decision: `Research focus '${focus}' scored opportunity=${opportunityScore} priority=${recommendedPriority} — research signal only, no product creation`,
        recordedAt: now,
      },
    ];

    return {
      researchReportId,
      timestamp: now,
      opportunityId,
      productCategory,
      productType: productCategory,
      targetAudience,
      customerPainPoints,
      marketGap,
      demandAssessment: demand.demandAssessment,
      demandLevel: demand.demandLevel,
      demandScore: demand.demandScore,
      competitorSummary,
      revenuePotential: revenue.revenuePotential,
      revenuePotentialScore: revenue.revenuePotentialScore,
      opportunityScore,
      supportingEvidence,
      confidenceScore,
      metadataVersion: DPR_METADATA_VERSION,
      businessId,
      factoryMissionId,
      researchTopic,
      discoverySource,
      recommendedPriority,
      evidenceKinds,
      workerId: config.workerId || DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.workerId,
      reportVersion: DIGITAL_PRODUCT_RESEARCH_REPORT_VERSION,
      traceabilityRefs,
      preservedDecisions,
      submittedToExecutiveReporting: base?.submittedToExecutiveReporting ?? false,
      executiveReportId: base?.executiveReportId ?? null,
      ranking: base?.ranking ?? null,
      neverCreateDigitalProducts: true,
      neverCreateSalesPages: true,
      neverProcessPayments: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverInventUnsupportedMarketEvidence: true,
      neverImplementQ503OrLater: true,
      useApprovedResearchSourcesOnly: true,
      distinguishFactsFromAssumptions: true,
      preserveCompleteSourceTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  rankReports(
    reports: DigitalProductResearchReport[],
    config: DigitalProductResearchWorkerConfiguration,
  ): DigitalProductResearchReport[] {
    const sorted = [...reports].sort((a, b) => {
      if (b.opportunityScore !== a.opportunityScore) {
        return b.opportunityScore - a.opportunityScore;
      }
      return b.confidenceScore - a.confidenceScore;
    });
    return sorted.map((report, index) => {
      const ranking = index + 1;
      const recommendedPriority = this.recommendPriority(
        report.opportunityScore,
        report.confidenceScore,
        config,
        null,
      );
      return {
        ...cloneReport(report),
        ranking,
        recommendedPriority,
        timestamp: new Date().toISOString(),
      };
    });
  }

  private resolvePainPoints(
    input: DigitalProductResearchWorkerInput,
    focus: ResearchFocus,
    base: DigitalProductResearchReport | null,
  ): string[] {
    if (input.customerPainPoints?.length) {
      return unique(input.customerPainPoints.map((p) => p.trim()).filter(Boolean));
    }
    if (base?.customerPainPoints.length && focus !== "customer_pain_points") {
      return [...base.customerPainPoints];
    }
    if (focus === "customer_pain_points" || focus === "full_report") {
      return [
        "Buyers struggle to find ready-to-use digital assets that match their workflow",
        "Existing offerings are fragmented across formats and skill levels",
        "Time-to-value is unclear for first-time digital product purchasers",
      ];
    }
    return base?.customerPainPoints.length
      ? [...base.customerPainPoints]
      : ["Customer pain signals pending structured research"];
  }

  private resolveMarketGap(
    input: DigitalProductResearchWorkerInput,
    focus: ResearchFocus,
    base: DigitalProductResearchReport | null,
    researchTopic: string,
  ): string {
    if (input.marketGap?.trim()) return input.marketGap.trim();
    if (base?.marketGap && focus !== "market_gaps" && focus !== "underserved_niches") {
      return base.marketGap;
    }
    if (focus === "market_gaps") {
      return `Gap between buyer need and available digital offerings for '${researchTopic}'`;
    }
    if (focus === "underserved_niches") {
      return input.nicheNotes?.trim() ||
        `Underserved niche opportunity identified around '${researchTopic}'`;
    }
    return base?.marketGap || `Market coverage for '${researchTopic}' remains incomplete`;
  }

  private resolveDemand(
    input: DigitalProductResearchWorkerInput,
    focus: ResearchFocus,
    base: DigitalProductResearchReport | null,
  ): { demandAssessment: string; demandLevel: DemandLevel; demandScore: number } {
    const demandScore = clamp(
      input.demandScore ??
        inferScoreFromLevel(input.demandLevel) ??
        (focus === "search_demand" || focus === "estimate_demand" ? 68 : null) ??
        base?.demandScore ??
        55,
      0,
      100,
    );
    const demandLevel = normalizeDemandLevel(
      input.demandLevel ?? base?.demandLevel ?? scoreToDemandLevel(demandScore),
    );
    const demandAssessment =
      input.demandAssessment?.trim() ||
      input.searchDemandNotes?.trim() ||
      (focus === "search_demand"
        ? `Search demand assessed at ${demandLevel} (${demandScore}/100)`
        : focus === "estimate_demand"
          ? `Estimated demand level ${demandLevel} with score ${demandScore}/100`
          : base?.demandAssessment) ||
      `Demand assessed as ${demandLevel} (${demandScore}/100)`;
    return { demandAssessment, demandLevel, demandScore };
  }

  private resolveCompetitorSummary(
    input: DigitalProductResearchWorkerInput,
    focus: ResearchFocus,
    base: DigitalProductResearchReport | null,
  ): string {
    if (input.competitorSummary?.trim()) return input.competitorSummary.trim();
    if (input.competitorNotes?.trim()) return input.competitorNotes.trim();
    if (base?.competitorSummary && focus !== "competitor_products") {
      return base.competitorSummary;
    }
    if (focus === "competitor_products") {
      return "Competitor digital products show feature overlap with uneven packaging and incomplete niche coverage";
    }
    if (focus === "emerging_trends") {
      return (
        input.emergingTrendNotes?.trim() ||
        base?.competitorSummary ||
        "Emerging competitor activity indicates shifting buyer expectations"
      );
    }
    return base?.competitorSummary || "Competitor landscape reviewed at structural signal level";
  }

  private resolveRevenue(
    input: DigitalProductResearchWorkerInput,
    focus: ResearchFocus,
    base: DigitalProductResearchReport | null,
    demandScore: number,
  ): { revenuePotential: string; revenuePotentialScore: number } {
    const revenuePotentialScore = clamp(
      input.revenuePotentialScore ??
        (focus === "commercial_opportunity" ? Math.round((demandScore + 70) / 2) : null) ??
        base?.revenuePotentialScore ??
        Math.round(demandScore * 0.9),
      0,
      100,
    );
    const revenuePotential =
      input.revenuePotential?.trim() ||
      (focus === "commercial_opportunity"
        ? `Commercial opportunity estimated at score ${revenuePotentialScore}/100 based on demand and packaging signals`
        : base?.revenuePotential) ||
      `Revenue potential scored ${revenuePotentialScore}/100 (research estimate only)`;
    return { revenuePotential, revenuePotentialScore };
  }

  scoreOpportunity(
    input: DigitalProductResearchWorkerInput,
    demandScore: number,
    revenuePotentialScore: number,
    evidence: EvidenceItem[],
    focus: ResearchFocus,
    base: DigitalProductResearchReport | null,
  ): number {
    if (input.opportunityScore != null && Number.isFinite(input.opportunityScore)) {
      return clamp(input.opportunityScore, 0, 100);
    }
    const factBonus = evidence.filter((e) => e.kind === "fact").length * 2;
    const assumptionPenalty = evidence.filter((e) => e.kind === "assumption").length * 0.5;
    const focusBoost =
      focus === "commercial_opportunity" || focus === "full_report" || focus === "underserved_niches"
        ? 5
        : 0;
    const weighted = demandScore * 0.45 + revenuePotentialScore * 0.4 + focusBoost;
    const scored = clamp(Math.round(weighted + factBonus - assumptionPenalty), 0, 100);
    if (base && focus !== "commercial_opportunity" && focus !== "full_report") {
      return clamp(Math.round((base.opportunityScore + scored) / 2), 0, 100);
    }
    return scored;
  }

  scoreConfidence(
    input: DigitalProductResearchWorkerInput,
    evidence: EvidenceItem[],
    demandScore: number,
    opportunityScore: number,
    base: DigitalProductResearchReport | null,
  ): number {
    if (input.confidenceScore != null && Number.isFinite(input.confidenceScore)) {
      return clamp(input.confidenceScore, 0, 100);
    }
    const facts = evidence.filter((e) => e.kind === "fact").length;
    const assumptions = evidence.filter((e) => e.kind === "assumption").length;
    const evidenceScore = clamp(40 + facts * 8 - assumptions * 2, 20, 95);
    const blended = demandScore * 0.25 + opportunityScore * 0.25 + evidenceScore * 0.5;
    const scored = clamp(Math.round(blended), 0, 100);
    return base ? clamp(Math.round((base.confidenceScore + scored) / 2), 0, 100) : scored;
  }

  recommendPriority(
    opportunityScore: number,
    confidenceScore: number,
    config: DigitalProductResearchWorkerConfiguration,
    explicit?: PriorityLevel | string | null,
  ): PriorityLevel {
    const normalized = normalizePriority(explicit);
    if (normalized) return normalized;
    if (
      opportunityScore >= config.criticalOpportunityThreshold &&
      confidenceScore >= config.criticalConfidenceThreshold
    ) {
      return "critical";
    }
    if (
      opportunityScore >= config.highOpportunityThreshold &&
      confidenceScore >= config.highConfidenceThreshold
    ) {
      return "high";
    }
    if (opportunityScore >= config.mediumOpportunityThreshold) return "medium";
    if (opportunityScore < 35) return "watch";
    return "low";
  }

  compileEvidence(
    input: DigitalProductResearchWorkerInput,
    researchReportId: string,
    discoverySource: DiscoverySource,
    focus: ResearchFocus,
    now: string,
    base: DigitalProductResearchReport | null,
  ): EvidenceItem[] {
    const items: EvidenceItem[] = [];
    let seq = 0;
    for (const raw of input.supportingEvidence ?? []) {
      seq += 1;
      items.push({
        evidenceId: `dpr-ev-${researchReportId}-${seq}`,
        source: raw.source?.trim() || discoverySource,
        claim: raw.claim?.trim() || "Structured digital product research signal recorded",
        kind: normalizeKind(raw.kind),
        relatedTopic: raw.relatedTopic?.trim() || focus,
        recordedAt: now,
      });
    }
    if (input.demandScore != null) {
      items.push({
        evidenceId: `dpr-ev-${researchReportId}-demand`,
        source: discoverySource,
        claim: `Demand score=${input.demandScore} level=${input.demandLevel ?? "inferred"}`,
        kind: "fact",
        relatedTopic: "estimate_demand",
        recordedAt: now,
      });
    }
    if (input.revenuePotentialScore != null) {
      items.push({
        evidenceId: `dpr-ev-${researchReportId}-revenue`,
        source: "marketplace_signals",
        claim: `Revenue potential score=${input.revenuePotentialScore}`,
        kind: "fact",
        relatedTopic: "commercial_opportunity",
        recordedAt: now,
      });
    }
    if (input.customerPainPoints?.length) {
      items.push({
        evidenceId: `dpr-ev-${researchReportId}-pain`,
        source: "audience_pain_signals",
        claim: `Customer pain points recorded: ${input.customerPainPoints.slice(0, 3).join("; ")}`,
        kind: "fact",
        relatedTopic: "customer_pain_points",
        recordedAt: now,
      });
    }
    if (items.length === 0 && base?.supportingEvidence.length) {
      return base.supportingEvidence.map((e) => ({ ...e }));
    }
    if (items.length === 0) {
      items.push({
        evidenceId: `dpr-ev-${researchReportId}-default`,
        source: discoverySource,
        claim: `Research topic '${input.researchTopic ?? "unspecified"}' monitored via approved source ${discoverySource}`,
        kind: "assumption",
        relatedTopic: focus,
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

  normalizeCategory(category: string | ProductCategory | null | undefined): ProductCategory {
    const normalized = category?.trim() as ProductCategory | undefined;
    return normalized && (PRODUCT_CATEGORIES as readonly string[]).includes(normalized)
      ? normalized
      : "unknown";
  }
}

let researchSequence = 0;

export function resetResearchSequenceForTesting() {
  researchSequence = 0;
}

function cloneReport(report: DigitalProductResearchReport): DigitalProductResearchReport {
  return {
    ...report,
    customerPainPoints: [...report.customerPainPoints],
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

function normalizePriority(
  priority: string | PriorityLevel | null | undefined,
): PriorityLevel | null {
  const normalized = priority?.trim() as PriorityLevel | undefined;
  return normalized && (PRIORITY_LEVELS as readonly string[]).includes(normalized)
    ? normalized
    : null;
}

function normalizeDemandLevel(level: string | DemandLevel | null | undefined): DemandLevel {
  const normalized = level?.trim() as DemandLevel | undefined;
  return normalized && (DEMAND_LEVELS as readonly string[]).includes(normalized)
    ? normalized
    : "unclear";
}

function scoreToDemandLevel(score: number): DemandLevel {
  if (score >= 85) return "surging";
  if (score >= 70) return "high";
  if (score >= 50) return "moderate";
  if (score >= 30) return "low";
  return "unclear";
}

function inferScoreFromLevel(level: string | DemandLevel | null | undefined): number | null {
  switch (level?.trim()) {
    case "surging":
      return 90;
    case "high":
      return 75;
    case "moderate":
      return 55;
    case "low":
      return 35;
    case "unclear":
      return 45;
    default:
      return null;
  }
}

export function focusForAction(
  action: DigitalProductResearchWorkerRunReport["action"],
): ResearchFocus | null {
  switch (action) {
    case "analyse_customer_pain_points":
      return "customer_pain_points";
    case "analyse_search_demand":
      return "search_demand";
    case "analyse_market_gaps":
      return "market_gaps";
    case "analyse_competitor_products":
      return "competitor_products";
    case "analyse_emerging_trends":
      return "emerging_trends";
    case "discover_underserved_niches":
      return "underserved_niches";
    case "estimate_demand":
      return "estimate_demand";
    case "estimate_commercial_opportunity":
      return "commercial_opportunity";
    case "produce_report":
      return "full_report";
    default:
      return null;
  }
}
