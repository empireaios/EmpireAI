import type { BusinessApprovalPackWorkerConfiguration } from "./configuration.js";
import {
  BAP_METADATA_VERSION,
  BUSINESS_APPROVAL_PACK_VERSION,
  BUSINESS_APPROVAL_PACK_WORKER_IDENTITY,
} from "./paths.js";
import type {
  ApprovalRecommendation,
  BusinessApprovalPack,
  BusinessApprovalPackWorkerCatalog,
  BusinessApprovalPackWorkerInput,
  BusinessBlueprintInput,
  BusinessModelInput,
  BusinessRiskReportInput,
  IntegrationHandshake,
  LaunchPlanInput,
  MarketResearchInput,
  OpportunityEvaluationInput,
  SupportingEvidenceItem,
} from "./types.js";

/** Pure Business Approval Pack helpers for Q2-09 — consolidation only; never mutates inputs. */
export class PackBuilder {
  buildCatalog(
    config: BusinessApprovalPackWorkerConfiguration,
    packs: BusinessApprovalPack[],
    integrations: IntegrationHandshake[],
  ): BusinessApprovalPackWorkerCatalog {
    return {
      packVersion: BUSINESS_APPROVAL_PACK_VERSION,
      workerId: config.workerId,
      packs: packs.map(clonePack),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: BAP_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverApproveBusiness: true,
      neverLaunchBusiness: true,
      neverModifyPreviousReports: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  consolidate(
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
  ): BusinessApprovalPack {
    packSequence += 1;
    const now = new Date().toISOString();
    const model = freeze(input.businessModel ?? {});
    const market = freeze(input.marketResearch ?? {});
    const opportunity = freeze(input.opportunityEvaluation ?? {});
    const blueprint = freeze(input.businessBlueprint ?? {});
    const launchPlan = freeze(input.launchPlan ?? {});
    const risk = freeze(input.businessRiskReport ?? {});

    const businessType = normalizeType(
      input.businessType ||
        blueprint.businessType ||
        launchPlan.businessType ||
        opportunity.businessType ||
        market.businessType ||
        model.businessType ||
        "unknown",
    );
    const missionId =
      input.businessBuildMissionId?.trim() ||
      blueprint.businessBuildMissionId?.trim() ||
      launchPlan.businessBuildMissionId?.trim() ||
      opportunity.businessBuildMissionId?.trim() ||
      market.businessBuildMissionId?.trim() ||
      risk.businessBuildMissionId?.trim() ||
      `bbm-${Date.now()}-${packSequence}`;

    const sourceRefs = {
      businessModelId: model.businessModelId?.trim() || null,
      marketResearchReportId: market.reportId?.trim() || null,
      opportunityEvaluationId: opportunity.evaluationId?.trim() || null,
      businessBlueprintId:
        blueprint.blueprintId?.trim() ||
        launchPlan.businessBlueprintId?.trim() ||
        risk.businessBlueprintId?.trim() ||
        null,
      launchPlanId: launchPlan.launchPlanId?.trim() || risk.launchPlanId?.trim() || null,
      businessRiskReportId: risk.riskReportId?.trim() || null,
    };

    const majorOpportunities = this.majorOpportunities(opportunity, market, blueprint);
    const majorRisks = this.majorRisks(risk, launchPlan);
    const outstandingIssues = this.outstandingIssues(market, opportunity, launchPlan, risk);
    const unresolvedRisks = this.unresolvedRisks(risk);
    const requiredApprovals = this.requiredApprovals(launchPlan);
    const { recommendation, rationale } = this.recommend(
      opportunity,
      risk,
      outstandingIssues,
      unresolvedRisks,
    );
    const requiredGrandKingDecisions = this.grandKingDecisions(
      recommendation,
      majorRisks,
      outstandingIssues,
      requiredApprovals,
    );

    const businessOverview = this.businessOverview(businessType, blueprint, model);
    const opportunitySummary = this.opportunitySummary(opportunity);
    const marketSummary = this.marketSummary(market);
    const businessModelSummary = this.businessModelSummary(model);
    const blueprintSummary = this.blueprintSummary(blueprint);
    const launchSummary = this.launchSummary(launchPlan);
    const riskSummary = this.riskSummary(risk);
    const executiveSummary = this.executiveSummary(
      businessType,
      recommendation,
      opportunity,
      risk,
      majorOpportunities,
      majorRisks,
      outstandingIssues,
    );

    const facts = unique([
      ...(market.facts ?? []),
      ...(opportunity.facts ?? []),
      ...(risk.facts ?? []),
      sourceRefs.businessModelId ? `business_model_id=${sourceRefs.businessModelId}` : "",
      sourceRefs.marketResearchReportId
        ? `market_research_id=${sourceRefs.marketResearchReportId}`
        : "",
      sourceRefs.opportunityEvaluationId
        ? `opportunity_evaluation_id=${sourceRefs.opportunityEvaluationId}`
        : "",
      sourceRefs.businessBlueprintId
        ? `business_blueprint_id=${sourceRefs.businessBlueprintId}`
        : "",
      sourceRefs.launchPlanId ? `launch_plan_id=${sourceRefs.launchPlanId}` : "",
      sourceRefs.businessRiskReportId
        ? `business_risk_report_id=${sourceRefs.businessRiskReportId}`
        : "",
    ]);
    const assumptions = unique([
      ...(market.assumptions ?? []),
      ...(opportunity.assumptions ?? []),
      ...(risk.assumptions ?? []),
      ...(model.businessAssumptions ?? []),
    ]);
    const recommendationsOnly = unique([
      `pack_recommendation=${recommendation}`,
      rationale,
      ...(market.recommendations ?? []).map((r) => `market_recommendation:${r}`),
      opportunity.recommendation
        ? `opportunity_recommendation=${opportunity.recommendation}`
        : "",
    ]);

    const supportingEvidence = this.supportingEvidence(
      now,
      facts,
      recommendationsOnly,
      assumptions,
      sourceRefs,
    );

    const preservedDecisions = unique([
      ...(blueprint.preservedDecisions ?? []),
      ...(launchPlan.preservedDecisions ?? []),
      ...(risk.preservedDecisions ?? []),
    ]);
    const traceabilityRefs = unique([
      sourceRefs.businessModelId
        ? `q2-03:business_model:${sourceRefs.businessModelId}`
        : "q2-03:business_model:missing",
      sourceRefs.marketResearchReportId
        ? `q2-04:market_research:${sourceRefs.marketResearchReportId}`
        : "q2-04:market_research:missing",
      sourceRefs.opportunityEvaluationId
        ? `q2-05:opportunity_evaluation:${sourceRefs.opportunityEvaluationId}`
        : "q2-05:opportunity_evaluation:missing",
      sourceRefs.businessBlueprintId
        ? `q2-06:business_blueprint:${sourceRefs.businessBlueprintId}`
        : "q2-06:business_blueprint:missing",
      sourceRefs.launchPlanId
        ? `q2-07:launch_plan:${sourceRefs.launchPlanId}`
        : "q2-07:launch_plan:missing",
      sourceRefs.businessRiskReportId
        ? `q2-08:business_risk:${sourceRefs.businessRiskReportId}`
        : "q2-08:business_risk:missing",
      ...(blueprint.traceabilityRefs ?? []),
      ...(launchPlan.traceabilityRefs ?? []),
      ...(risk.traceabilityRefs ?? []),
    ]);

    return {
      approvalPackId:
        input.approvalPackId?.trim() || `bap-pack-${Date.now()}-${packSequence}`,
      timestamp: now,
      businessBuildMissionId: missionId,
      businessType,
      executiveSummary,
      businessOverview,
      opportunitySummary,
      marketSummary,
      businessModelSummary,
      blueprintSummary,
      launchSummary,
      riskSummary,
      majorOpportunities,
      majorRisks,
      requiredApprovals,
      outstandingIssues,
      unresolvedRisks,
      recommendation,
      recommendationRationale: rationale,
      requiredGrandKingDecisions,
      supportingEvidence,
      facts,
      recommendationsOnly,
      assumptions,
      sourceRefs,
      preservedDecisions,
      traceabilityRefs,
      metadataVersion: BAP_METADATA_VERSION,
      packVersion: BUSINESS_APPROVAL_PACK_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.workerId,
      neverApproveBusiness: true,
      neverLaunchBusiness: true,
      neverModifyPreviousReports: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      distinguishFactsFromRecommendations: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  private businessOverview(
    businessType: string,
    blueprint: BusinessBlueprintInput,
    model: BusinessModelInput,
  ): string {
    const objective =
      blueprint.businessObjective?.trim() ||
      model.valueProposition?.trim() ||
      "Business objective pending from upstream planning artifacts";
    return `${businessType.replace(/_/g, " ")} business oriented around: ${objective}`;
  }

  private opportunitySummary(opportunity: OpportunityEvaluationInput): string {
    const score = opportunity.overallOpportunityScore;
    const rec = opportunity.recommendation ?? "unavailable";
    if (score == null) {
      return `Opportunity evaluation recommendation=${rec}; overall score unavailable`;
    }
    return `Opportunity score=${score.toFixed(1)}; recommendation=${rec}; demand=${opportunity.demandScore ?? "n/a"} feasibility=${opportunity.feasibilityScore ?? "n/a"} profit=${opportunity.profitPotentialScore ?? "n/a"} risk=${opportunity.riskScore ?? "n/a"} fit=${opportunity.strategicFitScore ?? "n/a"}`;
  }

  private marketSummary(market: MarketResearchInput): string {
    const demand = market.marketDemand?.demandLevel ?? "unclear";
    const size = market.marketSize?.estimate ?? "unestimated";
    const competitors = market.competitorAnalysis?.length ?? 0;
    return `Target market=${market.targetMarket ?? "unspecified"}; demand=${demand}; size=${size}; competitors_profiled=${competitors}; confidence=${market.confidenceScore ?? "n/a"}`;
  }

  private businessModelSummary(model: BusinessModelInput): string {
    return `Model=${model.businessModelType ?? "unspecified"}; value=${model.valueProposition ?? "n/a"}; revenue=${model.revenueModel ?? "n/a"}; cost=${model.costModel ?? "n/a"}; operating=${model.operatingModel ?? "n/a"}`;
  }

  private blueprintSummary(blueprint: BusinessBlueprintInput): string {
    return `Blueprint=${blueprint.blueprintId ?? "missing"}; objective=${blueprint.businessObjective ?? "n/a"}; workers=${blueprint.requiredWorkers?.length ?? 0}; integrations=${blueprint.requiredIntegrations?.length ?? 0}; assets=${blueprint.requiredAssets?.length ?? 0}`;
  }

  private launchSummary(launchPlan: LaunchPlanInput): string {
    return `Launch plan=${launchPlan.launchPlanId ?? "missing"}; stages=${launchPlan.launchStages?.length ?? 0}; milestones=${launchPlan.milestones?.length ?? 0}; tasks=${launchPlan.tasks?.length ?? 0}; blockers=${launchPlan.blockers?.length ?? 0}`;
  }

  private riskSummary(risk: BusinessRiskReportInput): string {
    return `Risk report=${risk.riskReportId ?? "missing"}; portfolio=${risk.overallPortfolioRiskRating ?? "unknown"}; high_or_critical=${risk.highOrCriticalCount ?? 0}; risk_entries=${risk.risks?.length ?? 0}`;
  }

  private executiveSummary(
    businessType: string,
    recommendation: ApprovalRecommendation,
    opportunity: OpportunityEvaluationInput,
    risk: BusinessRiskReportInput,
    majorOpportunities: string[],
    majorRisks: string[],
    outstandingIssues: string[],
  ): string {
    return [
      `Executive approval package for ${businessType.replace(/_/g, " ")} recommends ${recommendation}.`,
      `Opportunity score ${opportunity.overallOpportunityScore ?? "n/a"} with upstream recommendation ${opportunity.recommendation ?? "n/a"}.`,
      `Portfolio risk ${risk.overallPortfolioRiskRating ?? "unknown"} with ${majorRisks.length} major risk highlight(s).`,
      `${majorOpportunities.length} major opportunity highlight(s); ${outstandingIssues.length} outstanding issue(s) require attention before implementation or launch.`,
      "This pack consolidates upstream factory outputs and does not approve, reject, or launch the business.",
    ].join(" ");
  }

  private majorOpportunities(
    opportunity: OpportunityEvaluationInput,
    market: MarketResearchInput,
    blueprint: BusinessBlueprintInput,
  ): string[] {
    const items: string[] = [];
    if ((opportunity.overallOpportunityScore ?? 0) >= 70) {
      items.push(
        `Strong overall opportunity score ${opportunity.overallOpportunityScore!.toFixed(1)}`,
      );
    }
    if ((opportunity.demandScore ?? 0) >= 70) {
      items.push(`High demand score ${opportunity.demandScore!.toFixed(1)}`);
    }
    if ((opportunity.profitPotentialScore ?? 0) >= 70) {
      items.push(`Attractive profit potential score ${opportunity.profitPotentialScore!.toFixed(1)}`);
    }
    if (market.opportunitySize?.level) {
      items.push(`Market opportunity size indicated as ${market.opportunitySize.level}`);
    }
    if (blueprint.valueProposition?.trim()) {
      items.push(`Blueprint value proposition: ${blueprint.valueProposition.trim()}`);
    }
    if (!items.length) {
      items.push("Opportunity highlights limited; review opportunity and market summaries");
    }
    return unique(items).slice(0, 8);
  }

  private majorRisks(
    risk: BusinessRiskReportInput,
    launchPlan: LaunchPlanInput,
  ): string[] {
    const fromRisk = (risk.risks ?? [])
      .filter((r) => {
        const rating = (r.overallRiskRating ?? "").toLowerCase();
        return rating === "high" || rating === "critical";
      })
      .map(
        (r) =>
          `${r.riskCategory ?? "risk"}:${r.overallRiskRating}:${r.riskDescription ?? "unspecified"}`,
      );
    const fromBlockers = (launchPlan.blockers ?? [])
      .filter((b) => (b.severity ?? "").toLowerCase() === "high")
      .map((b) => `launch_blocker:${b.description ?? "unspecified"}`);
    const combined = unique([...fromRisk, ...fromBlockers]);
    if (!combined.length && (risk.highOrCriticalCount ?? 0) > 0) {
      combined.push(`Portfolio reports ${risk.highOrCriticalCount} high/critical risks`);
    }
    if (!combined.length) {
      combined.push("No high/critical risks explicitly listed in consolidated inputs");
    }
    return combined.slice(0, 10);
  }

  private outstandingIssues(
    market: MarketResearchInput,
    opportunity: OpportunityEvaluationInput,
    launchPlan: LaunchPlanInput,
    risk: BusinessRiskReportInput,
  ): string[] {
    return unique([
      ...(market.missingInformation ?? []).map((m) => `market_gap:${m}`),
      ...(opportunity.missingInformation ?? []).map((m) => `opportunity_gap:${m}`),
      ...(launchPlan.missingPrerequisites ?? []).map((m) => `launch_gap:${m}`),
      ...(risk.missingInformation ?? []).map((m) => `risk_gap:${m}`),
      ...(launchPlan.blockers ?? []).map(
        (b) => `blocker:${b.severity ?? "unknown"}:${b.description ?? "unspecified"}`,
      ),
    ]);
  }

  private unresolvedRisks(risk: BusinessRiskReportInput): string[] {
    return unique(
      (risk.risks ?? [])
        .filter((r) => {
          const rating = (r.overallRiskRating ?? "").toLowerCase();
          return rating === "high" || rating === "critical" || r.confirmed === true;
        })
        .map(
          (r) =>
            `${r.riskId ?? "risk"}:${r.riskCategory ?? "unknown"}:${r.overallRiskRating ?? "n/a"}:${r.riskDescription ?? "unspecified"}`,
        ),
    );
  }

  private requiredApprovals(launchPlan: LaunchPlanInput): string[] {
    const checkpoints = (launchPlan.approvalCheckpoints ?? []).map(
      (c) => `checkpoint:${c.checkpointId ?? "id"}:${c.name ?? "approval"}`,
    );
    return unique([
      "grand_king:final_business_go_no_go",
      "pillow:executive_readiness_review",
      ...checkpoints,
    ]);
  }

  private recommend(
    opportunity: OpportunityEvaluationInput,
    risk: BusinessRiskReportInput,
    outstandingIssues: string[],
    unresolvedRisks: string[],
  ): { recommendation: ApprovalRecommendation; rationale: string } {
    const score = opportunity.overallOpportunityScore ?? 0;
    const upstream = String(opportunity.recommendation ?? "").toLowerCase();
    const portfolio = String(risk.overallPortfolioRiskRating ?? "").toLowerCase();
    const highCritical = risk.highOrCriticalCount ?? unresolvedRisks.length;

    if (upstream === "reject" || score < 40 || (portfolio === "critical" && highCritical >= 3)) {
      return {
        recommendation: "Reject",
        rationale:
          "Upstream opportunity and/or risk posture indicates the business should not proceed to build or launch without a fundamentally different plan.",
      };
    }

    if (
      upstream === "proceed" &&
      score >= 70 &&
      highCritical <= 2 &&
      outstandingIssues.length <= 3 &&
      portfolio !== "critical"
    ) {
      return {
        recommendation: "Proceed",
        rationale:
          "Opportunity strength and residual risk posture support executive Proceed consideration, subject to Grand King decisions on listed approvals and unresolved items.",
      };
    }

    return {
      recommendation: "Revise",
      rationale:
        "Material gaps, elevated risks, or mixed opportunity signals require revision before a clean Proceed package for Grand King approval.",
    };
  }

  private grandKingDecisions(
    recommendation: ApprovalRecommendation,
    majorRisks: string[],
    outstandingIssues: string[],
    requiredApprovals: string[],
  ): string[] {
    return unique([
      `Accept or reject pack recommendation=${recommendation}`,
      "Authorize progression to implementation only after Pillow readiness confirmation",
      majorRisks.length
        ? `Decide residual acceptance of ${Math.min(majorRisks.length, 5)} major risk highlight(s)`
        : "Confirm residual risk posture is acceptable",
      outstandingIssues.length
        ? `Decide whether outstanding issues (${outstandingIssues.length}) block build/launch`
        : "Confirm no outstanding issues block build/launch",
      ...requiredApprovals.filter((a) => a.startsWith("grand_king")),
    ]);
  }

  private supportingEvidence(
    now: string,
    facts: string[],
    recommendationsOnly: string[],
    assumptions: string[],
    sourceRefs: BusinessApprovalPack["sourceRefs"],
  ): SupportingEvidenceItem[] {
    const items: SupportingEvidenceItem[] = [];
    let idx = 0;
    for (const claim of facts.slice(0, 12)) {
      idx += 1;
      items.push({
        evidenceId: `ev-fact-${idx}`,
        source: "consolidated_facts",
        claim,
        kind: "fact",
        recordedAt: now,
      });
    }
    for (const claim of recommendationsOnly.slice(0, 8)) {
      idx += 1;
      items.push({
        evidenceId: `ev-rec-${idx}`,
        source: "pack_recommendations",
        claim,
        kind: "recommendation",
        recordedAt: now,
      });
    }
    for (const claim of assumptions.slice(0, 8)) {
      idx += 1;
      items.push({
        evidenceId: `ev-asm-${idx}`,
        source: "consolidated_assumptions",
        claim,
        kind: "assumption",
        recordedAt: now,
      });
    }
    for (const [key, value] of Object.entries(sourceRefs)) {
      if (!value) continue;
      idx += 1;
      items.push({
        evidenceId: `ev-src-${idx}`,
        source: key,
        claim: value,
        kind: "fact",
        recordedAt: now,
      });
    }
    return items;
  }
}

let packSequence = 0;

export function resetPackSequenceForTesting() {
  packSequence = 0;
}

function freeze<T extends object>(value: T): T {
  return { ...value };
}

function normalizeType(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clonePack(pack: BusinessApprovalPack): BusinessApprovalPack {
  return {
    ...pack,
    majorOpportunities: [...pack.majorOpportunities],
    majorRisks: [...pack.majorRisks],
    requiredApprovals: [...pack.requiredApprovals],
    outstandingIssues: [...pack.outstandingIssues],
    unresolvedRisks: [...pack.unresolvedRisks],
    requiredGrandKingDecisions: [...pack.requiredGrandKingDecisions],
    supportingEvidence: pack.supportingEvidence.map((e) => ({ ...e })),
    facts: [...pack.facts],
    recommendationsOnly: [...pack.recommendationsOnly],
    assumptions: [...pack.assumptions],
    sourceRefs: { ...pack.sourceRefs },
    preservedDecisions: [...pack.preservedDecisions],
    traceabilityRefs: [...pack.traceabilityRefs],
  };
}
