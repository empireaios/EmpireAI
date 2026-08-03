import type { OpportunityEvaluationWorkerConfiguration } from "./configuration.js";
import {
  OEW_METADATA_VERSION,
  OPPORTUNITY_EVALUATION_REPORT_VERSION,
  OPPORTUNITY_EVALUATION_WORKER_IDENTITY,
} from "./paths.js";
import type {
  BusinessModelInput,
  EvidenceItem,
  IntegrationHandshake,
  MarketResearchInput,
  OpportunityEvaluationReport,
  OpportunityEvaluationWorkerCatalog,
  OpportunityEvaluationWorkerInput,
  Recommendation,
  ScoreBreakdown,
} from "./types.js";

/** Pure Opportunity Evaluation Worker helpers for Q2-05 — evaluation only. */
export class EvaluationBuilder {
  buildCatalog(
    config: OpportunityEvaluationWorkerConfiguration,
    evaluations: OpportunityEvaluationReport[],
    integrations: IntegrationHandshake[],
  ): OpportunityEvaluationWorkerCatalog {
    return {
      reportVersion: OPPORTUNITY_EVALUATION_REPORT_VERSION,
      workerId: config.workerId,
      evaluations: evaluations.map(cloneEvaluation),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: OEW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverApproveBusiness: true,
      neverModifyBusinessModel: true,
      neverLaunchBusiness: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  evaluate(
    input: OpportunityEvaluationWorkerInput,
    config: OpportunityEvaluationWorkerConfiguration,
  ): OpportunityEvaluationReport {
    evaluationSequence += 1;
    const now = new Date().toISOString();
    const model = input.businessModel ?? {};
    const research = input.marketResearch ?? {};
    const businessType = normalizeType(
      input.businessType || model.businessType || research.businessType || "unknown",
    );
    const missionId =
      input.businessBuildMissionId?.trim() ||
      research.businessBuildMissionId?.trim() ||
      `bbm-${Date.now()}-${evaluationSequence}`;

    const evidence = this.compileEvidence(model, research, businessType, now);
    const demand = this.scoreDemand(research, evidence);
    const feasibility = this.scoreFeasibility(model, research, evidence);
    const revenue = this.scoreRevenuePotential(model, research, evidence);
    const profit = this.scoreProfitPotential(model, research, revenue, evidence);
    const complexity = this.scoreOperationalComplexity(model, research, evidence);
    const risk = this.scoreExecutionRisk(research, complexity, evidence);
    const strategicFit = this.scoreStrategicFit(model, research, businessType, evidence);

    const weights = { ...config.scoreWeights };
    const overallScore = clamp(
      weights.demand * demand.score +
        weights.feasibility * feasibility.score +
        weights.profitPotential * profit.score +
        weights.risk * (100 - risk.score) +
        weights.strategicFit * strategicFit.score,
    );
    const overall = this.explainOverall(
      overallScore,
      weights,
      demand,
      feasibility,
      profit,
      risk,
      strategicFit,
    );
    const recommendation = this.recommend(
      overallScore,
      risk.score,
      config.proceedThreshold,
      config.improveThreshold,
    );
    const missingInformation = this.identifyMissing(model, research);
    const confidenceScore = this.scoreConfidence(research, evidence, missingInformation);

    const facts = unique([
      ...evidence.filter((e) => e.kind === "fact").map((e) => e.claim),
      ...demand.facts,
      ...feasibility.facts,
      ...profit.facts,
      ...risk.facts,
      ...strategicFit.facts,
    ]);
    const assumptions = unique([
      ...evidence.filter((e) => e.kind === "assumption").map((e) => e.claim),
      ...demand.assumptions,
      ...feasibility.assumptions,
      ...profit.assumptions,
      ...risk.assumptions,
      ...strategicFit.assumptions,
    ]);

    return {
      evaluationId:
        input.evaluationId?.trim() || `oew-eval-${Date.now()}-${evaluationSequence}`,
      timestamp: now,
      businessBuildMissionId: missionId,
      businessType,
      demandScore: demand.score,
      feasibilityScore: feasibility.score,
      profitPotentialScore: profit.score,
      riskScore: risk.score,
      strategicFitScore: strategicFit.score,
      overallOpportunityScore: overallScore,
      recommendation,
      supportingEvidence: evidence,
      confidenceScore,
      metadataVersion: OEW_METADATA_VERSION,
      reportVersion: OPPORTUNITY_EVALUATION_REPORT_VERSION,
      scoreExplanations: {
        demand,
        feasibility,
        revenuePotential: revenue,
        profitPotential: profit,
        operationalComplexity: complexity,
        executionRisk: risk,
        strategicFit,
        overall,
      },
      facts,
      assumptions,
      missingInformation,
      sourceBusinessModelId:
        input.businessModelId?.trim() || model.businessModelId?.trim() || null,
      sourceMarketResearchReportId:
        input.marketResearchReportId?.trim() || research.reportId?.trim() || null,
      sourceIntentId:
        input.sourceIntentId?.trim() || model.sourceIntentId?.trim() || null,
      originalCommand:
        input.originalCommand?.trim() || model.originalCommand?.trim() || null,
      scoreWeights: weights,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || OPPORTUNITY_EVALUATION_WORKER_IDENTITY.workerId,
      neverApproveBusiness: true,
      neverModifyBusinessModel: true,
      neverLaunchBusiness: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      evidenceBasedScoring: true,
      preserveAuditHistory: true,
      preserveCompleteTraceability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  scoreDemand(research: MarketResearchInput, evidence: EvidenceItem[]): ScoreBreakdown {
    const level = String(research.marketDemand?.demandLevel ?? "unclear").toLowerCase();
    const levelScore =
      level === "high" ? 85 : level === "moderate" ? 65 : level === "low" ? 35 : 40;
    const signalBonus = Math.min(
      10,
      (research.marketDemand?.demandSignals?.length ?? 0) * 2,
    );
    const researchConfidence = clamp((research.confidenceScore ?? 0.5) * 100);
    const score = clamp(levelScore * 0.7 + researchConfidence * 0.2 + signalBonus);
    const refs = evidence
      .filter((e) => e.relatedTopic === "market_demand")
      .map((e) => e.evidenceId);
    return {
      score,
      explanation: `Demand scored ${score}/100 from market-research demandLevel=${level}, ${research.marketDemand?.demandSignals?.length ?? 0} demand signals, and research confidence ${research.confidenceScore ?? "n/a"}.`,
      facts: unique([
        ...(research.marketDemand?.facts ?? []),
        ...(research.facts ?? []).filter((f) => /demand/i.test(f)),
      ]),
      assumptions: unique([
        ...(research.marketDemand?.assumptions ?? []),
        `demand_level_weight=${level}`,
      ]),
      evidenceRefs: refs,
    };
  }

  scoreFeasibility(
    model: BusinessModelInput,
    research: MarketResearchInput,
    evidence: EvidenceItem[],
  ): ScoreBreakdown {
    const capabilities = model.requiredCapabilities?.length ?? 0;
    const integrations = model.requiredIntegrations?.length ?? 0;
    const barriers = research.barriersToEntry?.length ?? 0;
    const hasOperating = !!model.operatingModel?.trim();
    const hasRevenue = !!model.revenueModel?.trim();
    let score = 55;
    if (hasOperating) score += 10;
    if (hasRevenue) score += 8;
    score -= Math.min(20, capabilities * 2);
    score -= Math.min(15, integrations * 2);
    score -= Math.min(20, barriers * 4);
    if ((research.opportunitySize?.opportunityLevel ?? "").toLowerCase() === "high") {
      score += 5;
    }
    score = clamp(score);
    return {
      score,
      explanation: `Feasibility scored ${score}/100 from operating/revenue model completeness, ${capabilities} required capabilities, ${integrations} integrations, and ${barriers} barriers to entry.`,
      facts: unique([
        hasOperating ? `operating_model_present=${model.operatingModel}` : "",
        hasRevenue ? `revenue_model_present=${model.revenueModel}` : "",
      ].filter(Boolean)),
      assumptions: [
        "implementation_effort_inferred_from_capability_and_barrier_density",
        `capability_count=${capabilities}`,
        `barrier_count=${barriers}`,
      ],
      evidenceRefs: evidence
        .filter((e) => e.relatedTopic === "feasibility" || e.relatedTopic === "barriers_to_entry")
        .map((e) => e.evidenceId),
    };
  }

  scoreRevenuePotential(
    model: BusinessModelInput,
    research: MarketResearchInput,
    evidence: EvidenceItem[],
  ): ScoreBreakdown {
    const opportunity = String(research.opportunitySize?.opportunityLevel ?? "unclear").toLowerCase();
    const base =
      opportunity === "high" ? 82 : opportunity === "moderate" ? 64 : opportunity === "low" ? 38 : 45;
    const recurringBonus = /subscription|recurring|retainer|commission/i.test(
      model.revenueModel ?? "",
    )
      ? 8
      : 0;
    const sizeBonus = research.marketSize?.tamSummary ? 5 : 0;
    const score = clamp(base + recurringBonus + sizeBonus);
    return {
      score,
      explanation: `Revenue potential scored ${score}/100 from opportunityLevel=${opportunity}, revenue model=${model.revenueModel ?? "unspecified"}, and market-size presence.`,
      facts: unique([
        ...(research.opportunitySize?.facts ?? []),
        ...(research.marketSize?.facts ?? []),
      ]),
      assumptions: unique([
        ...(research.opportunitySize?.assumptions ?? []),
        `revenue_model_assumed=${model.revenueModel ?? "unspecified"}`,
      ]),
      evidenceRefs: evidence
        .filter((e) => e.relatedTopic === "opportunity_size" || e.relatedTopic === "market_size")
        .map((e) => e.evidenceId),
    };
  }

  scoreProfitPotential(
    model: BusinessModelInput,
    research: MarketResearchInput,
    revenue: ScoreBreakdown,
    evidence: EvidenceItem[],
  ): ScoreBreakdown {
    const leanCost = /lean_/i.test(model.costModel ?? "");
    const heavyCost = /inventory|labor|hosting|development/i.test(model.costModel ?? "");
    let score = revenue.score * 0.75;
    if (leanCost) score += 12;
    else if (heavyCost) score -= 8;
    if ((research.marketDemand?.demandLevel ?? "").toLowerCase() === "high") score += 6;
    score = clamp(score);
    return {
      score,
      explanation: `Profit potential scored ${score}/100 by adjusting revenue potential ${revenue.score} for cost model=${model.costModel ?? "unspecified"} and demand level.`,
      facts: unique(model.costModel ? [`cost_model=${model.costModel}`] : []),
      assumptions: [
        "profitability_inferred_from_revenue_potential_and_cost_profile",
        `lean_cost=${leanCost}`,
      ],
      evidenceRefs: evidence
        .filter((e) => e.relatedTopic === "profit" || e.relatedTopic === "opportunity_size")
        .map((e) => e.evidenceId),
    };
  }

  scoreOperationalComplexity(
    model: BusinessModelInput,
    research: MarketResearchInput,
    evidence: EvidenceItem[],
  ): ScoreBreakdown {
    const capabilities = model.requiredCapabilities?.length ?? 0;
    const integrations = model.requiredIntegrations?.length ?? 0;
    const segments = (model.customerSegments ?? research.customerSegments ?? []).length;
    const complexity = clamp(20 + capabilities * 8 + integrations * 7 + segments * 3);
    return {
      score: complexity,
      explanation: `Operational complexity scored ${complexity}/100 (higher = more complex) from ${capabilities} capabilities, ${integrations} integrations, and ${segments} customer segments.`,
      facts: [
        `required_capabilities=${capabilities}`,
        `required_integrations=${integrations}`,
      ],
      assumptions: ["complexity_proxy_from_capability_and_integration_density"],
      evidenceRefs: evidence
        .filter((e) => e.relatedTopic === "operational_complexity")
        .map((e) => e.evidenceId),
    };
  }

  scoreExecutionRisk(
    research: MarketResearchInput,
    complexity: ScoreBreakdown,
    evidence: EvidenceItem[],
  ): ScoreBreakdown {
    const risks = research.risks ?? [];
    const severityPoints = risks.reduce((sum, risk) => {
      const severity = String(risk.severity ?? "moderate").toLowerCase();
      return sum + (severity === "high" ? 18 : severity === "low" ? 6 : 12);
    }, 0);
    const missingPenalty = Math.min(20, (research.missingInformation?.length ?? 0) * 4);
    const demandPenalty =
      String(research.marketDemand?.demandLevel ?? "").toLowerCase() === "unclear" ||
      String(research.marketDemand?.demandLevel ?? "").toLowerCase() === "low"
        ? 12
        : 0;
    const score = clamp(20 + severityPoints * 0.6 + complexity.score * 0.25 + missingPenalty + demandPenalty);
    return {
      score,
      explanation: `Execution risk scored ${score}/100 (higher = riskier) from ${risks.length} research risks, operational complexity ${complexity.score}, and ${research.missingInformation?.length ?? 0} missing-information items.`,
      facts: risks
        .filter((r) => r.description)
        .map((r) => `${r.severity ?? "moderate"}:${r.description}`),
      assumptions: [
        "risk_score_aggregates_research_risks_and_complexity",
        `missing_information_count=${research.missingInformation?.length ?? 0}`,
      ],
      evidenceRefs: evidence
        .filter((e) => e.relatedTopic === "market_risks" || e.relatedTopic === "execution_risk")
        .map((e) => e.evidenceId),
    };
  }

  scoreStrategicFit(
    model: BusinessModelInput,
    research: MarketResearchInput,
    businessType: string,
    evidence: EvidenceItem[],
  ): ScoreBreakdown {
    const empireAligned = [
      "commerce",
      "saas",
      "digital_product",
      "media",
      "affiliate",
      "agency",
      "local_services",
      "local_cleaning",
    ];
    let score = empireAligned.includes(businessType) ? 72 : 48;
    if (model.valueProposition?.trim()) score += 6;
    if ((model.requiredCapabilities ?? []).length > 0) score += 4;
    if ((research.industryTrends?.length ?? 0) > 0) score += 5;
    if ((research.customerProblems?.length ?? 0) >= 2) score += 5;
    if (businessType === "unknown") score -= 15;
    score = clamp(score);
    return {
      score,
      explanation: `Strategic fit scored ${score}/100 for EmpireAI factory alignment with businessType=${businessType}, value proposition presence, capability readiness, trends, and customer-problem clarity.`,
      facts: unique([
        `business_type=${businessType}`,
        model.valueProposition ? `value_proposition=${model.valueProposition}` : "",
      ].filter(Boolean)),
      assumptions: [
        "empireai_prefers_repeatable_digital_and_operable_local_business_types",
        `aligned_type=${empireAligned.includes(businessType)}`,
      ],
      evidenceRefs: evidence
        .filter((e) => e.relatedTopic === "strategic_fit" || e.relatedTopic === "general")
        .map((e) => e.evidenceId),
    };
  }

  explainOverall(
    overallScore: number,
    weights: OpportunityEvaluationWorkerConfiguration["scoreWeights"],
    demand: ScoreBreakdown,
    feasibility: ScoreBreakdown,
    profit: ScoreBreakdown,
    risk: ScoreBreakdown,
    strategicFit: ScoreBreakdown,
  ): ScoreBreakdown {
    return {
      score: overallScore,
      explanation: `Overall opportunity scored ${overallScore}/100 using weights demand=${weights.demand}, feasibility=${weights.feasibility}, profit=${weights.profitPotential}, risk(inverted)=${weights.risk}, strategicFit=${weights.strategicFit}. Component scores: demand=${demand.score}, feasibility=${feasibility.score}, profit=${profit.score}, risk=${risk.score}, strategicFit=${strategicFit.score}.`,
      facts: [
        `weighted_overall=${overallScore}`,
        `demand=${demand.score}`,
        `feasibility=${feasibility.score}`,
        `profit=${profit.score}`,
        `risk=${risk.score}`,
        `strategic_fit=${strategicFit.score}`,
      ],
      assumptions: ["risk_contributes_as_one_hundred_minus_risk_score"],
      evidenceRefs: unique([
        ...demand.evidenceRefs,
        ...feasibility.evidenceRefs,
        ...profit.evidenceRefs,
        ...risk.evidenceRefs,
        ...strategicFit.evidenceRefs,
      ]),
    };
  }

  recommend(
    overall: number,
    riskScore: number,
    proceedThreshold: number,
    improveThreshold: number,
  ): Recommendation {
    if (overall >= proceedThreshold && riskScore <= 70) return "Proceed";
    if (overall >= improveThreshold) return "Improve";
    return "Reject";
  }

  identifyMissing(model: BusinessModelInput, research: MarketResearchInput): string[] {
    const missing: string[] = [];
    if (!model.businessModelId && !model.valueProposition) {
      missing.push("business_model_payload");
    }
    if (!research.reportId && !research.marketDemand) {
      missing.push("market_research_payload");
    }
    if (!model.revenueModel?.trim()) missing.push("revenue_model");
    if (!model.costModel?.trim()) missing.push("cost_model");
    if (!research.marketDemand?.demandLevel) missing.push("demand_level");
    if (!(research.risks?.length)) missing.push("explicit_risk_register");
    for (const item of research.missingInformation ?? []) {
      missing.push(`research_gap:${item}`);
    }
    return unique(missing);
  }

  scoreConfidence(
    research: MarketResearchInput,
    evidence: EvidenceItem[],
    missing: string[],
  ): number {
    const factCount = evidence.filter((e) => e.kind === "fact").length;
    const researchConfidence = research.confidenceScore ?? 0.5;
    let score = 0.3 + researchConfidence * 0.4 + Math.min(0.25, factCount * 0.03);
    score -= Math.min(0.25, missing.length * 0.03);
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }

  compileEvidence(
    model: BusinessModelInput,
    research: MarketResearchInput,
    businessType: string,
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

    if (model.businessModelId) {
      add("business_model", `Received business model ${model.businessModelId}`, "fact", "general");
    } else {
      add("business_model", "Business model fields supplied without stable ID", "assumption", "general");
    }
    if (model.valueProposition) {
      add("business_model", `Value proposition: ${model.valueProposition}`, "fact", "strategic_fit");
    }
    if (model.revenueModel) {
      add("business_model", `Revenue model: ${model.revenueModel}`, "fact", "profit");
    }
    if (model.costModel) {
      add("business_model", `Cost model: ${model.costModel}`, "fact", "profit");
    }
    if (model.operatingModel) {
      add("business_model", `Operating model: ${model.operatingModel}`, "fact", "feasibility");
    }

    if (research.reportId) {
      add(
        "market_research",
        `Received market research report ${research.reportId}`,
        "fact",
        "general",
      );
    }
    if (research.marketDemand?.demandLevel) {
      add(
        "market_research",
        `Demand level=${research.marketDemand.demandLevel}`,
        "fact",
        "market_demand",
      );
    }
    if (research.opportunitySize?.opportunityLevel) {
      add(
        "market_research",
        `Opportunity level=${research.opportunitySize.opportunityLevel}`,
        "fact",
        "opportunity_size",
      );
    }
    for (const barrier of research.barriersToEntry ?? []) {
      add("market_research", `Barrier: ${barrier}`, "fact", "barriers_to_entry");
    }
    for (const risk of research.risks ?? []) {
      if (!risk.description) continue;
      add(
        "market_research",
        `Risk(${risk.severity ?? "moderate"}): ${risk.description}`,
        "fact",
        "market_risks",
      );
    }
    for (const raw of research.supportingEvidence ?? []) {
      const claim = raw.claim?.trim();
      if (!claim) continue;
      add(
        raw.source?.trim() || "market_research_evidence",
        claim,
        raw.kind === "fact" ? "fact" : "assumption",
        raw.relatedTopic?.trim() || "general",
      );
    }
    add(
      "evaluation_context",
      `Evaluating businessType=${businessType} for EmpireAI strategic fit`,
      "assumption",
      "strategic_fit",
    );
    return items;
  }
}

let evaluationSequence = 0;

export function resetEvaluationSequenceForTesting() {
  evaluationSequence = 0;
}

function normalizeType(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(100, value)).toFixed(2));
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneEvaluation(report: OpportunityEvaluationReport): OpportunityEvaluationReport {
  const cloneScore = (s: ScoreBreakdown) => ({
    ...s,
    facts: [...s.facts],
    assumptions: [...s.assumptions],
    evidenceRefs: [...s.evidenceRefs],
  });
  return {
    ...report,
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    facts: [...report.facts],
    assumptions: [...report.assumptions],
    missingInformation: [...report.missingInformation],
    scoreWeights: { ...report.scoreWeights },
    scoreExplanations: {
      demand: cloneScore(report.scoreExplanations.demand),
      feasibility: cloneScore(report.scoreExplanations.feasibility),
      revenuePotential: cloneScore(report.scoreExplanations.revenuePotential),
      profitPotential: cloneScore(report.scoreExplanations.profitPotential),
      operationalComplexity: cloneScore(report.scoreExplanations.operationalComplexity),
      executionRisk: cloneScore(report.scoreExplanations.executionRisk),
      strategicFit: cloneScore(report.scoreExplanations.strategicFit),
      overall: cloneScore(report.scoreExplanations.overall),
    },
  };
}
