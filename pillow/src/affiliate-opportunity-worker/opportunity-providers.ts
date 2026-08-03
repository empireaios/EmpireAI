import type {
  AowInput,
  CompetitionSummary,
  CommissionStructure,
  DemandAssessment,
  DiscoveredProduct,
  DiscoveredProgramme,
  OpportunityRisk,
  RankedOpportunity,
  RecommendationStatus,
  ResearchedNiche,
} from "./types.js";

export function discoverProgrammes(input: AowInput): DiscoveredProgramme[] {
  const raw = input.fixtureProgrammes ?? [];
  return raw
    .filter((p) => p.programmeId?.trim() && p.programmeName?.trim())
    .map((p) => ({
      programmeId: p.programmeId.trim(),
      programmeName: p.programmeName.trim(),
      network: p.network?.trim() || "unknown",
      cookieDays: typeof p.cookieDays === "number" ? p.cookieDays : undefined,
      payoutFrequency: p.payoutFrequency?.trim() || undefined,
      notes: p.notes,
      source: "fixture" as const,
      fabricated: false as const,
    }));
}

export function discoverProducts(input: AowInput): DiscoveredProduct[] {
  const raw = input.fixtureProducts ?? [];
  return raw
    .filter((p) => p.productId?.trim() && p.name?.trim() && p.programmeId?.trim())
    .map((p) => ({
      productId: p.productId.trim(),
      name: p.name.trim(),
      category: p.category?.trim() || "unknown",
      programmeId: p.programmeId.trim(),
      notes: p.notes,
      source: "fixture" as const,
      fabricated: false as const,
    }));
}

export function researchNiches(input: AowInput): ResearchedNiche[] {
  const raw = input.fixtureNiches ?? [];
  return raw
    .filter((n) => n.nicheId?.trim() && n.name?.trim())
    .map((n) => ({
      nicheId: n.nicheId.trim(),
      name: n.name.trim(),
      region: n.region?.trim() || input.region?.trim() || undefined,
      notes: n.notes,
      source: "fixture" as const,
      fabricated: false as const,
    }));
}

export function analyseCommissions(
  input: AowInput,
  programmes: DiscoveredProgramme[],
): CommissionStructure[] {
  const data = input.fixtureCommissionData ?? [];
  if (!data.length) {
    return programmes.map((p) => ({
      programmeId: p.programmeId,
      programmeName: p.programmeName,
      commissionPercent: null,
      cookieDays: p.cookieDays ?? null,
      payoutFrequency: p.payoutFrequency ?? null,
      comparisonNotes: ["No commission fixture evidence provided — values unknown"],
      fabricated: false as const,
      evidencePresent: false,
    }));
  }
  const byId = new Map(programmes.map((p) => [p.programmeId, p]));
  return data.map((c) => {
    const prog = byId.get(c.programmeId);
    return {
      programmeId: c.programmeId,
      programmeName: prog?.programmeName ?? c.programmeId,
      commissionPercent:
        typeof c.commissionPercent === "number" && Number.isFinite(c.commissionPercent)
          ? c.commissionPercent
          : null,
      cookieDays:
        typeof c.cookieDays === "number"
          ? c.cookieDays
          : (prog?.cookieDays ?? null),
      payoutFrequency: c.payoutFrequency ?? prog?.payoutFrequency ?? null,
      comparisonNotes: [
        typeof c.commissionPercent === "number"
          ? `Observed commission ${c.commissionPercent}% from fixture`
          : "Commission percent missing in fixture",
        c.cookieDays != null ? `Cookie duration ${c.cookieDays} days` : "Cookie duration unknown",
        c.payoutFrequency ? `Payout frequency ${c.payoutFrequency}` : "Payout frequency unknown",
      ],
      fabricated: false as const,
      evidencePresent: typeof c.commissionPercent === "number",
    };
  });
}

export function estimateDemand(
  input: AowInput,
  niches: ResearchedNiche[],
): DemandAssessment {
  const signal = (input.fixtureDemandSignals ?? [])[0];
  const nicheId = signal?.nicheId ?? niches[0]?.nicheId ?? input.niche ?? "unknown";
  if (!signal) {
    return {
      nicheId,
      searchVolumeBand: "unknown",
      trend: "unknown",
      seasonality: "unknown",
      estimatedDemand: "unknown",
      fabricated: false,
      evidencePresent: false,
      notes: ["No demand fixture signals — demand not fabricated"],
    };
  }
  const band = signal.searchVolumeBand?.trim() || "unknown";
  const trend = signal.trend?.trim() || "unknown";
  const seasonality = signal.seasonality?.trim() || "unknown";
  return {
    nicheId: signal.nicheId,
    searchVolumeBand: band,
    trend,
    seasonality,
    estimatedDemand:
      band === "unknown" && trend === "unknown"
        ? "unknown"
        : `${band} volume, ${trend} trend`,
    fabricated: false,
    evidencePresent: band !== "unknown" || trend !== "unknown",
    notes: signal.notes ? [signal.notes] : ["Derived from fixtureDemandSignals only"],
  };
}

export function assessCompetition(
  input: AowInput,
  niches: ResearchedNiche[],
): CompetitionSummary {
  const fixture = (input.fixtureCompetition ?? [])[0];
  const nicheId = fixture?.nicheId ?? niches[0]?.nicheId ?? input.niche ?? "unknown";
  if (!fixture) {
    return {
      nicheId,
      competitorCountBand: "unknown",
      summary: "unknown",
      fabricated: false,
      evidencePresent: false,
      notes: ["No competition fixture — competition not fabricated"],
    };
  }
  const band = fixture.competitorCountBand?.trim() || "unknown";
  return {
    nicheId: fixture.nicheId,
    competitorCountBand: band,
    summary: fixture.notes?.trim() || `${band} competition band from fixture`,
    fabricated: false,
    evidencePresent: band !== "unknown",
    notes: fixture.notes ? [fixture.notes] : [],
  };
}

function scoreOpportunity(
  commission: CommissionStructure | undefined,
  demand: DemandAssessment,
  competition: CompetitionSummary,
): { score: number | null; basis: string[] } {
  if (!commission?.evidencePresent && !demand.evidencePresent && !competition.evidencePresent) {
    return { score: null, basis: ["Insufficient observed evidence — score not fabricated"] };
  }
  let score = 0;
  const basis: string[] = [];
  if (commission?.evidencePresent && commission.commissionPercent != null) {
    const c = Math.min(40, Math.max(0, commission.commissionPercent * 3));
    score += c;
    basis.push(`commission_component=${c.toFixed(1)}`);
  }
  if (demand.evidencePresent) {
    const bandScore =
      demand.searchVolumeBand === "high"
        ? 30
        : demand.searchVolumeBand === "medium"
          ? 20
          : demand.searchVolumeBand === "low"
            ? 10
            : 5;
    const trendBonus =
      demand.trend === "rising" ? 10 : demand.trend === "stable" ? 5 : 0;
    score += bandScore + trendBonus;
    basis.push(`demand_component=${bandScore + trendBonus}`);
  }
  if (competition.evidencePresent) {
    const comp =
      competition.competitorCountBand === "low"
        ? 20
        : competition.competitorCountBand === "moderate"
          ? 12
          : competition.competitorCountBand === "high"
            ? 5
            : 0;
    score += comp;
    basis.push(`competition_component=${comp}`);
  }
  if (commission?.cookieDays != null && commission.cookieDays >= 30) {
    score += 5;
    basis.push("cookie_duration_bonus=5");
  }
  return { score: Math.min(100, Math.round(score)), basis };
}

export function rankOpportunities(
  programmes: DiscoveredProgramme[],
  products: DiscoveredProduct[],
  niches: ResearchedNiche[],
  commissions: CommissionStructure[],
  demand: DemandAssessment,
  competition: CompetitionSummary,
): RankedOpportunity[] {
  if (!programmes.length) return [];
  const commissionById = new Map(commissions.map((c) => [c.programmeId, c]));
  const nicheName = niches[0]?.name ?? demand.nicheId ?? "unknown";
  const ranked = programmes.map((p, index) => {
    const product = products.find((pr) => pr.programmeId === p.programmeId);
    const commission = commissionById.get(p.programmeId);
    const { score, basis } = scoreOpportunity(commission, demand, competition);
    let recommendation: RecommendationStatus = "insufficient_evidence";
    if (score == null) recommendation = "insufficient_evidence";
    else if (score >= 60) recommendation = "recommend";
    else if (score >= 40) recommendation = "recommend_with_conditions";
    else recommendation = "do_not_recommend";
    return {
      rank: 0,
      opportunityKey: `opp-${p.programmeId}`,
      programmeId: p.programmeId,
      programmeName: p.programmeName,
      productCategory: product?.category ?? "unknown",
      targetNiche: nicheName,
      opportunityScore: score,
      scoreBasis: basis,
      recommendation,
      fabricated: false as const,
      _index: index,
    };
  });
  ranked.sort((a, b) => {
    if (a.opportunityScore == null && b.opportunityScore == null) return a._index - b._index;
    if (a.opportunityScore == null) return 1;
    if (b.opportunityScore == null) return -1;
    return b.opportunityScore - a.opportunityScore;
  });
  return ranked.map((r, i) => {
    const { _index: _, ...rest } = r;
    return { ...rest, rank: i + 1 };
  });
}

export function identifyRisks(
  programmes: DiscoveredProgramme[],
  commissions: CommissionStructure[],
  demand: DemandAssessment,
  competition: CompetitionSummary,
  ranking: RankedOpportunity[],
): OpportunityRisk[] {
  const risks: OpportunityRisk[] = [];
  let n = 0;
  const push = (
    severity: OpportunityRisk["severity"],
    description: string,
    relatedProgrammeId?: string | null,
    relatedNicheId?: string | null,
  ) => {
    n += 1;
    risks.push({
      riskId: `aow-risk-${String(n).padStart(3, "0")}`,
      severity,
      description,
      relatedProgrammeId: relatedProgrammeId ?? null,
      relatedNicheId: relatedNicheId ?? null,
    });
  };
  if (!programmes.length) push("high", "No affiliate programmes discovered from evidence");
  if (!commissions.some((c) => c.evidencePresent)) {
    push("high", "Commission evidence missing — cannot validate commercial attractiveness");
  }
  for (const c of commissions) {
    if (c.evidencePresent && c.commissionPercent != null && c.commissionPercent < 5) {
      push("medium", `Low observed commission ${c.commissionPercent}%`, c.programmeId);
    }
  }
  if (!demand.evidencePresent) {
    push("high", "Demand evidence missing — market demand unknown", null, demand.nicheId);
  }
  if (competition.competitorCountBand === "high") {
    push("medium", "High competition band observed in fixture", null, competition.nicheId);
  }
  if (ranking.every((r) => r.opportunityScore == null)) {
    push("high", "No scorable opportunities — insufficient evidence for ranking");
  }
  return risks;
}

export function recommendFromRanking(
  ranking: RankedOpportunity[],
  risks: OpportunityRisk[],
): RecommendationStatus {
  if (!ranking.length) return "insufficient_evidence";
  if (ranking.every((r) => r.opportunityScore == null)) return "insufficient_evidence";
  const top = ranking[0];
  if (!top) return "insufficient_evidence";
  if (risks.some((r) => r.severity === "high") && (top.opportunityScore ?? 0) < 60) {
    return "do_not_recommend";
  }
  return top.recommendation;
}

export function computeConfidence(parts: {
  programmes: number;
  products: number;
  niches: number;
  commissionEvidence: boolean;
  demandEvidence: boolean;
  competitionEvidence: boolean;
  hasScore: boolean;
}): number {
  const checks = [
    parts.programmes > 0,
    parts.products > 0,
    parts.niches > 0,
    parts.commissionEvidence,
    parts.demandEvidence,
    parts.competitionEvidence,
    parts.hasScore,
  ];
  const present = checks.filter(Boolean).length;
  return Number((present / checks.length).toFixed(2));
}
