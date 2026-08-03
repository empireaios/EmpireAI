import type { MarketResearchWorkerConfiguration } from "./configuration.js";
import {
  MARKET_RESEARCH_REPORT_VERSION,
  MARKET_RESEARCH_WORKER_IDENTITY,
  MRW_METADATA_VERSION,
} from "./paths.js";
import type {
  CompetitorProfile,
  EvidenceItem,
  IntegrationHandshake,
  MarketDemandFinding,
  MarketResearchReport,
  MarketResearchWorkerCatalog,
  MarketResearchWorkerInput,
  MarketSizeFinding,
  OpportunitySizeFinding,
  RiskFinding,
} from "./types.js";

/** Pure Market Research Worker helpers for Q2-04 — research only. */
export class ResearchBuilder {
  buildCatalog(
    config: MarketResearchWorkerConfiguration,
    reports: MarketResearchReport[],
    integrations: IntegrationHandshake[],
  ): MarketResearchWorkerCatalog {
    return {
      reportVersion: MARKET_RESEARCH_REPORT_VERSION,
      workerId: config.workerId,
      reports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: MRW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverDecideWhetherToBuild: true,
      neverGenerateBranding: true,
      neverBuildMarketingPlans: true,
      neverLaunchBusiness: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  research(
    input: MarketResearchWorkerInput,
    config: MarketResearchWorkerConfiguration,
  ): MarketResearchReport {
    reportSequence += 1;
    const now = new Date().toISOString();
    const businessType = normalizeType(input.businessType || "unknown");
    const businessIdea =
      input.businessIdea?.trim() ||
      input.originalCommand?.trim() ||
      `Proposed ${businessType.replace(/_/g, " ")} business`;
    const targetMarket =
      input.targetMarket?.trim() || this.defaultTargetMarket(businessType);
    const missionId =
      input.businessBuildMissionId?.trim() ||
      `bbm-${Date.now()}-${reportSequence}`;

    const evidence = this.compileEvidence(input, businessType, targetMarket, businessIdea, now);
    const customerSegments = this.researchCustomerSegments(input, businessType, targetMarket);
    const customerProblems = this.researchCustomerProblems(
      input,
      businessType,
      customerSegments,
      evidence,
    );
    const marketDemand = this.researchMarketDemand(
      input,
      businessType,
      targetMarket,
      evidence,
    );
    const marketSize = this.researchMarketSize(input, businessType, targetMarket, evidence);
    const competitorAnalysis = this.researchCompetitors(input, businessType, evidence);
    const industryTrends = this.researchIndustryTrends(input, businessType, evidence);
    const barriersToEntry = this.researchBarriers(input, businessType, evidence);
    const risks = this.researchRisks(input, businessType, marketDemand, barriersToEntry, evidence);
    const opportunitySize = this.researchOpportunitySize(
      marketDemand,
      marketSize,
      competitorAnalysis,
      barriersToEntry,
      evidence,
    );

    const facts = unique([
      ...evidence.filter((e) => e.kind === "fact").map((e) => e.claim),
      ...marketDemand.facts,
      ...marketSize.facts,
      ...opportunitySize.facts,
    ]);
    const assumptions = unique([
      ...evidence.filter((e) => e.kind === "assumption").map((e) => e.claim),
      ...marketDemand.assumptions,
      ...marketSize.assumptions,
      ...opportunitySize.assumptions,
    ]);
    const missingInformation = this.identifyMissingInformation(
      input,
      evidence,
      competitorAnalysis,
      marketSize,
    );
    const confidenceScore = this.scoreConfidence(
      evidence,
      competitorAnalysis,
      missingInformation,
      marketDemand,
    );
    const recommendations = this.buildRecommendations(
      marketDemand,
      opportunitySize,
      risks,
      missingInformation,
      confidenceScore,
    );

    return {
      reportId: input.reportId?.trim() || `mrw-report-${Date.now()}-${reportSequence}`,
      timestamp: now,
      businessBuildMissionId: missionId,
      businessType,
      targetMarket,
      customerProblems,
      customerSegments,
      marketDemand,
      marketSize,
      competitorAnalysis,
      industryTrends,
      opportunitySize,
      barriersToEntry,
      risks,
      confidenceScore,
      supportingEvidence: evidence,
      recommendations,
      missingInformation,
      facts,
      assumptions,
      metadataVersion: MRW_METADATA_VERSION,
      reportVersion: MARKET_RESEARCH_REPORT_VERSION,
      sourceBusinessModelId: input.sourceBusinessModelId?.trim() || null,
      sourceIntentId: input.sourceIntentId?.trim() || null,
      originalCommand: input.originalCommand?.trim() || null,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || MARKET_RESEARCH_WORKER_IDENTITY.workerId,
      neverDecideWhetherToBuild: true,
      neverGenerateBranding: true,
      neverBuildMarketingPlans: true,
      neverLaunchBusiness: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      evidenceBasedFindings: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  researchMarketDemand(
    input: MarketResearchWorkerInput,
    businessType: string,
    targetMarket: string,
    evidence: EvidenceItem[],
  ): MarketDemandFinding {
    const signals = unique([
      ...(input.marketSignals ?? []).map((s) => s.trim()).filter(Boolean),
      ...evidence
        .filter((e) => e.relatedTopic === "market_demand")
        .map((e) => e.claim),
      `target_market=${targetMarket}`,
      `business_type_demand_profile=${this.demandProfile(businessType)}`,
    ]);
    const positive = signals.filter((s) =>
      /high|growing|strong|repeat|recurring|underserved|pain/i.test(s),
    ).length;
    const negative = signals.filter((s) =>
      /declining|saturated|weak|no.?demand|unclear/i.test(s),
    ).length;
    const demandLevel =
      evidence.length === 0 && !(input.marketSignals?.length)
        ? ("unclear" as const)
        : positive > negative + 1
          ? ("high" as const)
          : positive >= negative
            ? ("moderate" as const)
            : ("low" as const);
    const facts = evidence
      .filter((e) => e.kind === "fact" && e.relatedTopic === "market_demand")
      .map((e) => e.claim);
    const assumptions = [
      ...evidence
        .filter((e) => e.kind === "assumption" && e.relatedTopic === "market_demand")
        .map((e) => e.claim),
      `demand_level_inferred_from_signal_balance=${demandLevel}`,
    ];
    return {
      demandLevel,
      summary: `Market demand for ${businessType.replace(/_/g, " ")} serving ${targetMarket} assessed as ${demandLevel} based on ${signals.length} demand signals.`,
      demandSignals: signals,
      facts: unique(facts),
      assumptions: unique(assumptions),
    };
  }

  researchMarketSize(
    input: MarketResearchWorkerInput,
    businessType: string,
    targetMarket: string,
    evidence: EvidenceItem[],
  ): MarketSizeFinding {
    const sizeFacts = evidence
      .filter((e) => e.kind === "fact" && e.relatedTopic === "market_size")
      .map((e) => e.claim);
    const sizeAssumptions = evidence
      .filter((e) => e.kind === "assumption" && e.relatedTopic === "market_size")
      .map((e) => e.claim);
    const band = this.sizeBand(businessType);
    return {
      tamSummary: `TAM for ${businessType.replace(/_/g, " ")} category estimated ${band.tam} relative opportunity units for ${targetMarket}.`,
      samSummary: `SAM narrowed to addressable ${targetMarket} slice estimated ${band.sam} relative opportunity units.`,
      somSummary: `SOM for near-term capture estimated ${band.som} relative opportunity units pending deeper validation.`,
      sizingBasis:
        sizeFacts.length > 0
          ? "evidence_backed_relative_sizing"
          : "structured_relative_sizing_from_business_type_profile",
      facts: unique(sizeFacts),
      assumptions: unique([
        ...sizeAssumptions,
        "absolute_currency_sizing_requires_external_market_data",
        `relative_size_band=${band.label}`,
      ]),
    };
  }

  researchCustomerProblems(
    input: MarketResearchWorkerInput,
    businessType: string,
    customerSegments: string[],
    evidence: EvidenceItem[],
  ): string[] {
    const fromInput = (input.customerProblems ?? []).map((p) => p.trim()).filter(Boolean);
    const fromEvidence = evidence
      .filter((e) => e.relatedTopic === "customer_problems")
      .map((e) => e.claim);
    const defaults = this.defaultProblems(businessType, customerSegments[0] ?? "customers");
    return unique([...fromInput, ...fromEvidence, ...defaults]);
  }

  researchCustomerSegments(
    input: MarketResearchWorkerInput,
    businessType: string,
    targetMarket: string,
  ): string[] {
    const fromInput = (input.customerSegments ?? []).map((s) => s.trim()).filter(Boolean);
    if (fromInput.length) return unique(fromInput);
    return unique([targetMarket, this.secondarySegment(businessType)]);
  }

  researchCompetitors(
    input: MarketResearchWorkerInput,
    businessType: string,
    evidence: EvidenceItem[],
  ): CompetitorProfile[] {
    const profiles: CompetitorProfile[] = [];
    let index = 0;
    for (const known of input.knownCompetitors ?? []) {
      const name = known.name?.trim();
      if (!name) continue;
      index += 1;
      profiles.push({
        competitorId: `comp-${index}`,
        name,
        strengths: unique(known.strengths?.map((s) => s.trim()).filter(Boolean) ?? [
          "established_brand_presence",
        ]),
        weaknesses: unique(known.weaknesses?.map((s) => s.trim()).filter(Boolean) ?? [
          "limited_specialization_for_target_niche",
        ]),
        notes: known.notes?.trim() || `Observed competitor in ${businessType} category`,
      });
    }
    if (!profiles.length) {
      profiles.push({
        competitorId: "comp-generic-01",
        name: `${businessType.replace(/_/g, " ")} category incumbents`,
        strengths: ["existing_customer_base", "distribution_coverage"],
        weaknesses: ["generic_offers", "slower_niche_responsiveness"],
        notes: "Synthetic category baseline used when named competitors were not supplied",
      });
    }
    for (const item of evidence.filter((e) => e.relatedTopic === "competitors")) {
      const host = profiles[0]!;
      if (item.kind === "fact") host.strengths = unique([...host.strengths, item.claim]);
      else host.weaknesses = unique([...host.weaknesses, `assumed:${item.claim}`]);
    }
    return profiles;
  }

  researchIndustryTrends(
    input: MarketResearchWorkerInput,
    businessType: string,
    evidence: EvidenceItem[],
  ): string[] {
    const fromInput = (input.industryTrends ?? []).map((t) => t.trim()).filter(Boolean);
    const fromEvidence = evidence
      .filter((e) => e.relatedTopic === "industry_trends")
      .map((e) => e.claim);
    return unique([...fromInput, ...fromEvidence, ...this.defaultTrends(businessType)]);
  }

  researchBarriers(
    input: MarketResearchWorkerInput,
    businessType: string,
    evidence: EvidenceItem[],
  ): string[] {
    const fromInput = (input.barriersToEntry ?? []).map((b) => b.trim()).filter(Boolean);
    const fromEvidence = evidence
      .filter((e) => e.relatedTopic === "barriers_to_entry")
      .map((e) => e.claim);
    return unique([...fromInput, ...fromEvidence, ...this.defaultBarriers(businessType)]);
  }

  researchRisks(
    input: MarketResearchWorkerInput,
    businessType: string,
    demand: MarketDemandFinding,
    barriers: string[],
    evidence: EvidenceItem[],
  ): RiskFinding[] {
    const risks: RiskFinding[] = [];
    let seq = 0;
    const push = (
      category: string,
      description: string,
      severity: RiskFinding["severity"],
      mitigationSignal: string,
    ) => {
      seq += 1;
      risks.push({
        riskId: `risk-${seq}`,
        category,
        description,
        severity,
        mitigationSignal,
      });
    };

    for (const raw of input.risks ?? []) {
      const description = raw.trim();
      if (!description) continue;
      push("provided", description, "moderate", "track_and_revalidate_in_follow_on_research");
    }
    for (const item of evidence.filter((e) => e.relatedTopic === "market_risks")) {
      push(
        "evidence",
        item.claim,
        item.kind === "fact" ? "high" : "moderate",
        "monitor_with_additional_evidence",
      );
    }
    if (demand.demandLevel === "low" || demand.demandLevel === "unclear") {
      push(
        "demand",
        `Demand assessed as ${demand.demandLevel} for ${businessType}`,
        demand.demandLevel === "low" ? "high" : "moderate",
        "collect_additional_demand_evidence_before_downstream_planning",
      );
    }
    if (barriers.length >= 3) {
      push(
        "barriers",
        "Multiple barriers to entry may slow early traction",
        "moderate",
        "prioritize_lowest_friction_entry_path_in_later_planning",
      );
    }
    push(
      "competition",
      "Incumbent response and substitution risk remains present",
      "moderate",
      "differentiate_offer_and_monitor_competitor_moves",
    );
    push(
      "information",
      "Market estimates remain partially assumption-backed until external data is attached",
      "moderate",
      "attach_primary_and_secondary_market_sources",
    );
    return risks;
  }

  researchOpportunitySize(
    demand: MarketDemandFinding,
    marketSize: MarketSizeFinding,
    competitors: CompetitorProfile[],
    barriers: string[],
    evidence: EvidenceItem[],
  ): OpportunitySizeFinding {
    const weaknessPressure = competitors.reduce((n, c) => n + c.weaknesses.length, 0);
    const strengthPressure = competitors.reduce((n, c) => n + c.strengths.length, 0);
    let opportunityLevel: OpportunitySizeFinding["opportunityLevel"] = "moderate";
    if (demand.demandLevel === "high" && weaknessPressure >= strengthPressure) {
      opportunityLevel = "high";
    } else if (demand.demandLevel === "low" || barriers.length > 4) {
      opportunityLevel = "low";
    } else if (demand.demandLevel === "unclear") {
      opportunityLevel = "unclear";
    }
    const facts = evidence
      .filter((e) => e.kind === "fact" && e.relatedTopic === "opportunity_size")
      .map((e) => e.claim);
    const assumptions = [
      ...evidence
        .filter((e) => e.kind === "assumption" && e.relatedTopic === "opportunity_size")
        .map((e) => e.claim),
      `opportunity_inferred_from_demand=${demand.demandLevel}`,
      `competitor_weakness_pressure=${weaknessPressure}`,
      marketSize.sizingBasis,
    ];
    return {
      opportunityLevel,
      summary: `Opportunity size assessed as ${opportunityLevel} using demand, relative market sizing, competitor weakness pressure, and barrier density.`,
      estimatedRelativeOpportunity: `${opportunityLevel}_relative_opportunity`,
      facts: unique(facts),
      assumptions: unique(assumptions),
    };
  }

  identifyMissingInformation(
    input: MarketResearchWorkerInput,
    evidence: EvidenceItem[],
    competitors: CompetitorProfile[],
    marketSize: MarketSizeFinding,
  ): string[] {
    const missing: string[] = [];
    if (!input.targetMarket?.trim()) missing.push("explicit_target_market_definition");
    if (!(input.knownCompetitors?.length)) missing.push("named_competitor_roster");
    if (!evidence.some((e) => e.kind === "fact" && e.relatedTopic === "market_size")) {
      missing.push("primary_market_size_data");
    }
    if (!evidence.some((e) => e.kind === "fact" && e.relatedTopic === "market_demand")) {
      missing.push("primary_demand_evidence");
    }
    if (competitors.every((c) => c.competitorId.startsWith("comp-generic"))) {
      missing.push("competitor_specific_intelligence");
    }
    if (marketSize.sizingBasis.includes("business_type_profile")) {
      missing.push("external_tam_sam_som_sources");
    }
    if (!(input.customerProblems?.length)) missing.push("validated_customer_problem_interviews");
    return unique(missing);
  }

  scoreConfidence(
    evidence: EvidenceItem[],
    competitors: CompetitorProfile[],
    missing: string[],
    demand: MarketDemandFinding,
  ): number {
    const factCount = evidence.filter((e) => e.kind === "fact").length;
    const assumptionCount = evidence.filter((e) => e.kind === "assumption").length;
    let score = 0.35;
    score += Math.min(0.35, factCount * 0.07);
    score += competitors.some((c) => !c.competitorId.startsWith("comp-generic")) ? 0.1 : 0;
    score += demand.demandLevel === "unclear" ? -0.1 : 0.1;
    score -= Math.min(0.25, missing.length * 0.04);
    score -= Math.min(0.15, assumptionCount * 0.02);
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }

  buildRecommendations(
    demand: MarketDemandFinding,
    opportunity: OpportunitySizeFinding,
    risks: RiskFinding[],
    missing: string[],
    confidence: number,
  ): string[] {
    const recommendations = [
      "Continue research until primary demand and market-size evidence gaps are reduced.",
      `Treat opportunity level (${opportunity.opportunityLevel}) as a research signal only — do not treat it as a build decision.`,
      `Demand assessment (${demand.demandLevel}) should be revalidated with additional sources before later Q2 planning.`,
    ];
    if (missing.length) {
      recommendations.push(`Prioritize missing information: ${missing.slice(0, 3).join(", ")}.`);
    }
    if (confidence < 0.5) {
      recommendations.push(
        "Confidence is below 0.50 — gather more fact-classified evidence before downstream planning.",
      );
    }
    const highRisks = risks.filter((r) => r.severity === "high");
    if (highRisks.length) {
      recommendations.push(
        `Investigate high-severity risks: ${highRisks.map((r) => r.description).join("; ")}.`,
      );
    }
    recommendations.push(
      "Submit findings through Executive Reporting Runtime; preserve audit history for Pillow review.",
    );
    return unique(recommendations);
  }

  compileEvidence(
    input: MarketResearchWorkerInput,
    businessType: string,
    targetMarket: string,
    businessIdea: string,
    now: string,
  ): EvidenceItem[] {
    const items: EvidenceItem[] = [];
    let seq = 0;
    const add = (
      source: string,
      claim: string,
      kind: EvidenceItem["kind"],
      relatedTopic: string,
    ) => {
      seq += 1;
      items.push({
        evidenceId: `ev-${seq}`,
        source,
        claim,
        kind,
        relatedTopic,
        recordedAt: now,
      });
    };

    for (const raw of input.evidenceSources ?? []) {
      const claim = raw.claim?.trim();
      const source = raw.source?.trim() || "provided_source";
      if (!claim) continue;
      const kind = raw.kind === "fact" ? "fact" : "assumption";
      add(source, claim, kind, raw.relatedTopic?.trim() || "general");
    }
    for (const signal of input.marketSignals ?? []) {
      const trimmed = signal.trim();
      if (!trimmed) continue;
      add("market_signal_input", trimmed, "fact", "market_demand");
    }

    add(
      "business_brief",
      `Proposed business idea under research: ${businessIdea}`,
      "fact",
      "general",
    );
    add(
      "target_market_input",
      `Target market declared as ${targetMarket}`,
      input.targetMarket?.trim() ? "fact" : "assumption",
      "customer_segments",
    );
    add(
      "category_profile",
      `Business type ${businessType} implies ${this.demandProfile(businessType)} demand dynamics`,
      "assumption",
      "market_demand",
    );
    add(
      "category_profile",
      `Relative market size band for ${businessType} uses structured category profile`,
      "assumption",
      "market_size",
    );
    return items;
  }

  defaultTargetMarket(businessType: string): string {
    switch (businessType) {
      case "media":
        return "digital content consumers";
      case "commerce":
        return "online retail buyers";
      case "local_cleaning":
      case "local_services":
        return "local residential and SMB customers";
      case "affiliate":
        return "recommendation-influenced buyers";
      case "digital_product":
        return "self-serv digital product buyers";
      case "saas":
        return "teams buying recurring software";
      case "agency":
        return "clients seeking specialist delivery";
      default:
        return "early target customers";
    }
  }

  secondarySegment(businessType: string): string {
    switch (businessType) {
      case "affiliate":
        return "partner creators and publishers";
      case "local_cleaning":
      case "local_services":
        return "repeat local service subscribers";
      case "saas":
        return "operations and product teams";
      default:
        return "adjacent early adopters";
    }
  }

  defaultProblems(businessType: string, segment: string): string[] {
    switch (businessType) {
      case "commerce":
        return [
          `${segment} struggle with fragmented product discovery`,
          "fulfillment reliability and trust gaps reduce conversion",
        ];
      case "saas":
        return [
          `${segment} face tool sprawl and weak workflow integration`,
          "manual processes create recurring operational drag",
        ];
      case "local_cleaning":
      case "local_services":
        return [
          `${segment} lack reliable on-demand local service booking`,
          "inconsistent quality and scheduling friction",
        ];
      case "media":
        return [
          `${segment} face content overload with low signal quality`,
          "creators struggle to monetize attention consistently",
        ];
      case "affiliate":
        return [
          `${segment} distrust low-quality recommendations`,
          "partners lack transparent conversion tracking",
        ];
      case "digital_product":
        return [
          `${segment} cannot find packaged solutions for specific jobs-to-be-done`,
          "post-purchase support and update clarity is weak",
        ];
      case "agency":
        return [
          `${segment} cannot staff specialist execution quickly`,
          "delivery quality and timeline predictability vary",
        ];
      default:
        return [
          `${segment} experience unresolved category friction`,
          "existing alternatives leave unmet needs",
        ];
    }
  }

  defaultTrends(businessType: string): string[] {
    switch (businessType) {
      case "commerce":
        return ["direct_to_consumer_growth", "checkout_conversion_optimization"];
      case "saas":
        return ["vertical_saas_specialization", "usage_based_pricing_expansion"];
      case "local_cleaning":
      case "local_services":
        return ["on_demand_local_services", "recurring_service_subscriptions"];
      case "media":
        return ["creator_economy_monetization", "short_form_distribution"];
      case "affiliate":
        return ["performance_marketing_transparency", "niche_recommendation_networks"];
      case "digital_product":
        return ["self_serve_digital_commerce", "productized_knowledge_offers"];
      case "agency":
        return ["specialist_outsourcing_demand", "outcome_based_retainers"];
      default:
        return ["digital_distribution_expansion", "lean_operator_models"];
    }
  }

  defaultBarriers(businessType: string): string[] {
    switch (businessType) {
      case "commerce":
        return ["inventory_capital", "fulfillment_complexity", "paid_acquisition_costs"];
      case "saas":
        return ["product_development_cost", "switching_costs", "trust_and_security_requirements"];
      case "local_cleaning":
      case "local_services":
        return ["local_labor_availability", "reputation_building", "scheduling_density"];
      case "media":
        return ["audience_acquisition_cost", "content_production_cadence"];
      case "affiliate":
        return ["partner_recruitment", "attribution_trust"];
      case "digital_product":
        return ["offer_differentiation", "distribution_discoverability"];
      case "agency":
        return ["talent_capacity", "sales_cycle_length"];
      default:
        return ["customer_acquisition", "category_education"];
    }
  }

  demandProfile(businessType: string): string {
    switch (businessType) {
      case "saas":
      case "commerce":
        return "recurring_or_repeat_purchase";
      case "local_cleaning":
      case "local_services":
        return "local_recurring_service";
      case "media":
        return "attention_and_subscription";
      case "affiliate":
        return "performance_referral";
      default:
        return "general_category";
    }
  }

  sizeBand(businessType: string): { label: string; tam: string; sam: string; som: string } {
    switch (businessType) {
      case "saas":
      case "commerce":
        return { label: "broad", tam: "large", sam: "medium-large", som: "focused" };
      case "local_cleaning":
      case "local_services":
        return { label: "local", tam: "medium", sam: "local-medium", som: "local-focused" };
      case "affiliate":
      case "digital_product":
        return { label: "niche", tam: "medium", sam: "niche-medium", som: "niche-focused" };
      default:
        return { label: "general", tam: "medium", sam: "medium", som: "focused" };
    }
  }
}

let reportSequence = 0;

export function resetReportSequenceForTesting() {
  reportSequence = 0;
}

function normalizeType(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneReport(report: MarketResearchReport): MarketResearchReport {
  return {
    ...report,
    customerProblems: [...report.customerProblems],
    customerSegments: [...report.customerSegments],
    industryTrends: [...report.industryTrends],
    barriersToEntry: [...report.barriersToEntry],
    recommendations: [...report.recommendations],
    missingInformation: [...report.missingInformation],
    facts: [...report.facts],
    assumptions: [...report.assumptions],
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    competitorAnalysis: report.competitorAnalysis.map((c) => ({
      ...c,
      strengths: [...c.strengths],
      weaknesses: [...c.weaknesses],
    })),
    risks: report.risks.map((r) => ({ ...r })),
    marketDemand: {
      ...report.marketDemand,
      demandSignals: [...report.marketDemand.demandSignals],
      facts: [...report.marketDemand.facts],
      assumptions: [...report.marketDemand.assumptions],
    },
    marketSize: {
      ...report.marketSize,
      facts: [...report.marketSize.facts],
      assumptions: [...report.marketSize.assumptions],
    },
    opportunitySize: {
      ...report.opportunitySize,
      facts: [...report.opportunitySize.facts],
      assumptions: [...report.opportunitySize.assumptions],
    },
  };
}
