import {
  evidenced,
  nextEvidenceId,
  normalizeEvidenceClass,
  unknownEvidenced,
} from "./evidence-adapters.js";
import type {
  AttractivenessDimension,
  CompetitorProfile,
  DemandFindings,
  EvidenceRecord,
  EvidencedValue,
  MarketAttractivenessAssessment,
  PainPoint,
  PricingFindings,
  ResearchContext,
  ServiceGap,
  ServiceOpportunity,
} from "./types.js";

function emptyDemand(): DemandFindings {
  const unknown = unknownEvidenced();
  return {
    demandIndicators: [unknown],
    searchPatterns: [unknown],
    frequencySignals: [unknown],
    urgencySignals: [unknown],
    seasonalPatterns: [unknown],
    residentialVsCommercial: [unknown],
    segmentDifferences: [unknown],
    geographicConcentration: [unknown],
    repeatPotential: [unknown],
    emergencyPotential: [unknown],
  };
}

function asEvidencedList(
  values: EvidencedValue[] | undefined,
  fallback: EvidencedValue[],
): EvidencedValue[] {
  if (!values?.length) return fallback.map((v) => ({ ...v }));
  return values.map((v) => evidenced(String(v.value), v.evidenceClass, v.explanation));
}

export function provideDemandFindings(ctx: ResearchContext): DemandFindings {
  const fromFixture = ctx.fixture?.demand;
  if (!fromFixture) return emptyDemand();
  const unknown = [unknownEvidenced()];
  return {
    demandIndicators: asEvidencedList(fromFixture.demandIndicators, unknown),
    searchPatterns: asEvidencedList(fromFixture.searchPatterns, unknown),
    frequencySignals: asEvidencedList(fromFixture.frequencySignals, unknown),
    urgencySignals: asEvidencedList(fromFixture.urgencySignals, unknown),
    seasonalPatterns: asEvidencedList(fromFixture.seasonalPatterns, unknown),
    residentialVsCommercial: asEvidencedList(fromFixture.residentialVsCommercial, unknown),
    segmentDifferences: asEvidencedList(fromFixture.segmentDifferences, unknown),
    geographicConcentration: asEvidencedList(fromFixture.geographicConcentration, unknown),
    repeatPotential: asEvidencedList(fromFixture.repeatPotential, unknown),
    emergencyPotential: asEvidencedList(fromFixture.emergencyPotential, unknown),
  };
}

export function provideCustomerSegments(ctx: ResearchContext): string[] {
  if (ctx.fixture?.customerSegments?.length) {
    return [...new Set(ctx.fixture.customerSegments.map((s) => s.trim()).filter(Boolean))];
  }
  if (ctx.customerSegments.length) {
    return [...new Set(ctx.customerSegments.map((s) => s.trim()).filter(Boolean))];
  }
  return [];
}

function normalizeCompetitorKey(name: string, area: string): string {
  return `${name.trim().toLowerCase().replace(/\s+/g, " ")}|${area
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")}`;
}

export function provideCompetitors(ctx: ResearchContext): CompetitorProfile[] {
  const raw = ctx.fixture?.competitors ?? [];
  if (!raw.length) return [];
  const seen = new Set<string>();
  const out: CompetitorProfile[] = [];
  for (const item of raw) {
    const name = String(item.name ?? "").trim();
    const serviceArea = String(item.serviceArea ?? ctx.targetServiceArea).trim();
    if (!name) continue;
    const key = normalizeCompetitorKey(name, serviceArea);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      competitorId: item.competitorId?.trim() || `lmrw-cmp-${String(out.length + 1).padStart(3, "0")}`,
      name,
      serviceArea,
      services: Array.isArray(item.services) ? item.services.map(String) : [],
      pricingModel: String(item.pricingModel ?? "unknown"),
      positioning: String(item.positioning ?? "unknown"),
      availability: String(item.availability ?? "unknown"),
      bookingMethod: String(item.bookingMethod ?? "unknown"),
      channels: Array.isArray(item.channels) ? item.channels.map(String) : [],
      ratings: String(item.ratings ?? "unknown"),
      strengths: Array.isArray(item.strengths) ? item.strengths.map(String) : [],
      weaknesses: Array.isArray(item.weaknesses) ? item.weaknesses.map(String) : [],
      gaps: Array.isArray(item.gaps) ? item.gaps.map(String) : [],
      evidenceSource: String(item.evidenceSource ?? "fixture"),
      researchTimestamp: item.researchTimestamp ?? ctx.now,
      evidenceClass: normalizeEvidenceClass(item.evidenceClass),
    });
  }
  return out;
}

export function provideCompetitorServices(ctx: ResearchContext): string[] {
  const services = new Set<string>();
  for (const competitor of provideCompetitors(ctx)) {
    for (const service of competitor.services) {
      if (service.trim()) services.add(service.trim());
    }
  }
  return [...services];
}

function emptyPricing(currency: string): PricingFindings {
  return {
    typicalPriceRange: unknownEvidenced(),
    minObservedPrice: unknownEvidenced(),
    maxObservedPrice: unknownEvidenced(),
    callOutFees: [unknownEvidenced()],
    hourlyRates: [unknownEvidenced()],
    fixedPackages: [unknownEvidenced()],
    emergencySurcharges: [unknownEvidenced()],
    materialFees: [unknownEvidenced()],
    transportFees: [unknownEvidenced()],
    inspectionFees: [unknownEvidenced()],
    recurringPricing: [unknownEvidenced()],
    promotions: [unknownEvidenced()],
    refundGuaranteePractices: [unknownEvidenced()],
    currency,
    taxInclusionStatus: unknownEvidenced(),
  };
}

export function providePricingFindings(ctx: ResearchContext): PricingFindings {
  const fromFixture = ctx.fixture?.pricing;
  if (!fromFixture) return emptyPricing(ctx.currency);
  const unknown = [unknownEvidenced()];
  return {
    typicalPriceRange: fromFixture.typicalPriceRange
      ? evidenced(String(fromFixture.typicalPriceRange.value), fromFixture.typicalPriceRange.evidenceClass)
      : unknownEvidenced(),
    minObservedPrice: fromFixture.minObservedPrice
      ? evidenced(String(fromFixture.minObservedPrice.value), fromFixture.minObservedPrice.evidenceClass)
      : unknownEvidenced(),
    maxObservedPrice: fromFixture.maxObservedPrice
      ? evidenced(String(fromFixture.maxObservedPrice.value), fromFixture.maxObservedPrice.evidenceClass)
      : unknownEvidenced(),
    callOutFees: asEvidencedList(fromFixture.callOutFees, unknown),
    hourlyRates: asEvidencedList(fromFixture.hourlyRates, unknown),
    fixedPackages: asEvidencedList(fromFixture.fixedPackages, unknown),
    emergencySurcharges: asEvidencedList(fromFixture.emergencySurcharges, unknown),
    materialFees: asEvidencedList(fromFixture.materialFees, unknown),
    transportFees: asEvidencedList(fromFixture.transportFees, unknown),
    inspectionFees: asEvidencedList(fromFixture.inspectionFees, unknown),
    recurringPricing: asEvidencedList(fromFixture.recurringPricing, unknown),
    promotions: asEvidencedList(fromFixture.promotions, unknown),
    refundGuaranteePractices: asEvidencedList(fromFixture.refundGuaranteePractices, unknown),
    currency: String(fromFixture.currency ?? ctx.currency),
    taxInclusionStatus: fromFixture.taxInclusionStatus
      ? evidenced(
          String(fromFixture.taxInclusionStatus.value),
          fromFixture.taxInclusionStatus.evidenceClass,
        )
      : unknownEvidenced(),
  };
}

export function providePainPoints(ctx: ResearchContext): PainPoint[] {
  const raw = ctx.fixture?.painPoints ?? [];
  return raw.map((item, index) => ({
    painPointId: item.painPointId?.trim() || `lmrw-res-pain-${String(index + 1).padStart(3, "0")}`,
    description: String(item.description ?? "").trim() || "unspecified pain point",
    affectedSegment: String(item.affectedSegment ?? "unspecified"),
    severity:
      item.severity === "low" || item.severity === "moderate" || item.severity === "high"
        ? item.severity
        : "unknown",
    evidenceClass: normalizeEvidenceClass(item.evidenceClass),
    supportingEvidence: Array.isArray(item.supportingEvidence)
      ? item.supportingEvidence.map(String)
      : [],
  }));
}

export function provideServiceGaps(ctx: ResearchContext): ServiceGap[] {
  const raw = ctx.fixture?.gaps ?? [];
  return raw.map((item, index) => ({
    gapId: item.gapId?.trim() || `lmrw-res-gap-${String(index + 1).padStart(3, "0")}`,
    description: String(item.description ?? "").trim() || "unspecified service gap",
    geographicArea: String(item.geographicArea ?? ctx.targetServiceArea),
    unmetNeed: String(item.unmetNeed ?? "unspecified"),
    evidenceClass: normalizeEvidenceClass(item.evidenceClass),
    supportingEvidence: Array.isArray(item.supportingEvidence)
      ? item.supportingEvidence.map(String)
      : [],
  }));
}

export function provideOpportunities(ctx: ResearchContext): ServiceOpportunity[] {
  const raw = ctx.fixture?.opportunities ?? [];
  if (raw.length) {
    return raw.map((item, index) => ({
      opportunityId:
        item.opportunityId?.trim() || `lmrw-opp-${String(index + 1).padStart(3, "0")}`,
      description: String(item.description ?? "").trim() || "unspecified opportunity",
      supportingEvidence: Array.isArray(item.supportingEvidence)
        ? item.supportingEvidence.map(String)
        : [],
      targetCustomer: String(item.targetCustomer ?? "unspecified"),
      geographicArea: String(item.geographicArea ?? ctx.targetServiceArea),
      demandIndication: String(item.demandIndication ?? "unknown"),
      competitionLevel: String(item.competitionLevel ?? "unknown"),
      pricingIndication: String(item.pricingIndication ?? "unknown"),
      operationalConsiderations: Array.isArray(item.operationalConsiderations)
        ? item.operationalConsiderations.map(String)
        : [],
      risks: Array.isArray(item.risks) ? item.risks.map(String) : [],
      confidenceLevel:
        typeof item.confidenceLevel === "number" && Number.isFinite(item.confidenceLevel)
          ? Math.max(0, Math.min(1, item.confidenceLevel))
          : 0,
      evidenceClass: normalizeEvidenceClass(item.evidenceClass),
    }));
  }

  // Derive structural opportunity signals only from observed pain/gap evidence — never invent demand.
  const painPoints = providePainPoints(ctx);
  const gaps = provideServiceGaps(ctx);
  const derived: ServiceOpportunity[] = [];
  for (const gap of gaps) {
    if (gap.evidenceClass === "unknown") continue;
    derived.push({
      opportunityId: `lmrw-opp-${String(derived.length + 1).padStart(3, "0")}`,
      description: `Address observed service gap: ${gap.description}`,
      supportingEvidence: [...gap.supportingEvidence, gap.gapId],
      targetCustomer: ctx.customerSegments[0] ?? "local customers",
      geographicArea: gap.geographicArea,
      demandIndication: "inferred_from_gap_evidence",
      competitionLevel: "unknown",
      pricingIndication: "unknown",
      operationalConsiderations: ["requires_downstream_service_offer_design"],
      risks: ["opportunity_derived_from_gap_only"],
      confidenceLevel: gap.evidenceClass === "verified" ? 0.55 : 0.35,
      evidenceClass: "inference",
    });
  }
  for (const pain of painPoints) {
    if (pain.evidenceClass === "unknown") continue;
    derived.push({
      opportunityId: `lmrw-opp-${String(derived.length + 1).padStart(3, "0")}`,
      description: `Respond to observed pain point: ${pain.description}`,
      supportingEvidence: [...pain.supportingEvidence, pain.painPointId],
      targetCustomer: pain.affectedSegment,
      geographicArea: ctx.targetServiceArea,
      demandIndication: "inferred_from_pain_evidence",
      competitionLevel: "unknown",
      pricingIndication: "unknown",
      operationalConsiderations: ["requires_downstream_service_offer_design"],
      risks: ["opportunity_derived_from_pain_only"],
      confidenceLevel: pain.evidenceClass === "verified" ? 0.5 : 0.3,
      evidenceClass: "inference",
    });
  }
  return derived;
}

function unknownDimension(explanation: string): AttractivenessDimension {
  return {
    score: null,
    evidenceClass: "unknown",
    explanation,
    evidenceRefs: [],
  };
}

function dimensionFromFixture(
  value: AttractivenessDimension | undefined,
  fallback: string,
): AttractivenessDimension {
  if (!value) return unknownDimension(fallback);
  const hasEvidence = (value.evidenceRefs?.length ?? 0) > 0 || value.evidenceClass !== "unknown";
  return {
    score:
      hasEvidence && typeof value.score === "number" && Number.isFinite(value.score)
        ? Math.max(0, Math.min(1, value.score))
        : null,
    evidenceClass: normalizeEvidenceClass(value.evidenceClass),
    explanation: String(value.explanation ?? fallback),
    evidenceRefs: Array.isArray(value.evidenceRefs) ? value.evidenceRefs.map(String) : [],
  };
}

export function provideAttractiveness(ctx: ResearchContext): MarketAttractivenessAssessment {
  const fromFixture = ctx.fixture?.attractiveness;
  if (!fromFixture) {
    return {
      demandStrength: unknownDimension("No demand attractiveness evidence provided"),
      competitionIntensity: unknownDimension("No competition intensity evidence provided"),
      pricingPotential: unknownDimension("No pricing potential evidence provided"),
      repeatPurchasePotential: unknownDimension("No repeat purchase evidence provided"),
      customerUrgency: unknownDimension("No customer urgency evidence provided"),
      easeOfAcquisition: unknownDimension("No acquisition ease evidence provided"),
      operationalComplexity: unknownDimension("No operational complexity evidence provided"),
      entryBarriers: unknownDimension("No entry barrier evidence provided"),
      regulatoryUncertainty: unknownDimension("No regulatory uncertainty evidence provided"),
      overallOpportunityConfidence: unknownDimension(
        "Overall confidence withheld without observed evidence",
      ),
    };
  }
  return {
    demandStrength: dimensionFromFixture(fromFixture.demandStrength, "demand strength"),
    competitionIntensity: dimensionFromFixture(
      fromFixture.competitionIntensity,
      "competition intensity",
    ),
    pricingPotential: dimensionFromFixture(fromFixture.pricingPotential, "pricing potential"),
    repeatPurchasePotential: dimensionFromFixture(
      fromFixture.repeatPurchasePotential,
      "repeat purchase potential",
    ),
    customerUrgency: dimensionFromFixture(fromFixture.customerUrgency, "customer urgency"),
    easeOfAcquisition: dimensionFromFixture(fromFixture.easeOfAcquisition, "ease of acquisition"),
    operationalComplexity: dimensionFromFixture(
      fromFixture.operationalComplexity,
      "operational complexity",
    ),
    entryBarriers: dimensionFromFixture(fromFixture.entryBarriers, "entry barriers"),
    regulatoryUncertainty: dimensionFromFixture(
      fromFixture.regulatoryUncertainty,
      "regulatory uncertainty",
    ),
    overallOpportunityConfidence: dimensionFromFixture(
      fromFixture.overallOpportunityConfidence,
      "overall opportunity confidence",
    ),
  };
}

export function provideEvidenceRecords(ctx: ResearchContext): EvidenceRecord[] {
  if (ctx.fixture?.evidence?.length) {
    return ctx.fixture.evidence.map((e) => ({ ...e }));
  }
  if (ctx.providedEvidence.length) {
    return ctx.providedEvidence.map((e) => ({ ...e }));
  }
  return [
    {
      evidenceId: nextEvidenceId(),
      sourceReference: "no_evidence_provided",
      sourceType: "absence",
      sourceDate: null,
      retrievalTimestamp: ctx.now,
      geographicRelevance: `${ctx.targetCity}/${ctx.targetServiceArea}`,
      serviceRelevance: ctx.serviceCategory,
      evidenceStrength: "unknown",
      confidenceLevel: 0,
      inferenceMade: false,
      evidenceClass: "unknown",
      evidenceMode: ctx.evidenceMode,
      claim: "No fixture, sandbox, cached, or live evidence was supplied for this research run",
    },
  ];
}

export function provideRisks(ctx: ResearchContext): string[] {
  return ctx.fixture?.risks?.length
    ? ctx.fixture.risks.map(String)
    : ["Insufficient observed evidence for local market conclusions"];
}

export function provideAssumptions(ctx: ResearchContext): string[] {
  return ctx.fixture?.assumptions?.length
    ? ctx.fixture.assumptions.map(String)
    : ["Research limited to provided fixture/sandbox evidence only"];
}

export function provideUnknowns(ctx: ResearchContext): string[] {
  const unknowns = ctx.fixture?.unknowns?.length ? ctx.fixture.unknowns.map(String) : [];
  if (!ctx.fixture) {
    unknowns.push(
      "demand",
      "competitors",
      "pricing",
      "pain_points",
      "service_gaps",
      "opportunities",
      "attractiveness",
    );
  }
  return [...new Set(unknowns)];
}
