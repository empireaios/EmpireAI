import type { BusinessRiskWorkerConfiguration } from "./configuration.js";
import {
  BRW_METADATA_VERSION,
  BUSINESS_RISK_REPORT_VERSION,
  BUSINESS_RISK_WORKER_IDENTITY,
} from "./paths.js";
import type {
  BusinessBlueprintInput,
  BusinessRiskReport,
  BusinessRiskWorkerCatalog,
  BusinessRiskWorkerInput,
  EvidenceItem,
  ImpactLevel,
  IntegrationHandshake,
  LaunchPlanInput,
  LikelihoodLevel,
  OverallRiskRating,
  RiskCategory,
  RiskEntry,
} from "./types.js";

type DraftRisk = {
  category: RiskCategory;
  description: string;
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  mitigation: string;
  confirmed: boolean;
  evidenceClaims: Array<{ source: string; claim: string; kind: "fact" | "assumption" }>;
};

/** Pure Business Risk Worker helpers for Q2-08 — assessment only. */
export class RiskBuilder {
  buildCatalog(
    config: BusinessRiskWorkerConfiguration,
    reports: BusinessRiskReport[],
    integrations: IntegrationHandshake[],
  ): BusinessRiskWorkerCatalog {
    return {
      reportVersion: BUSINESS_RISK_REPORT_VERSION,
      workerId: config.workerId,
      riskCategories: [...config.riskCategories],
      reports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: BRW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverRemoveRisksAutomatically: true,
      neverApproveBusiness: true,
      neverRejectBusiness: true,
      neverLaunchBusiness: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  assess(
    input: BusinessRiskWorkerInput,
    config: BusinessRiskWorkerConfiguration,
  ): BusinessRiskReport {
    reportSequence += 1;
    const now = new Date().toISOString();
    const blueprint = input.businessBlueprint ?? {};
    const launchPlan = input.launchPlan ?? {};
    const businessType = normalizeType(
      input.businessType || blueprint.businessType || launchPlan.businessType || "unknown",
    );
    const missionId =
      input.businessBuildMissionId?.trim() ||
      blueprint.businessBuildMissionId?.trim() ||
      launchPlan.businessBuildMissionId?.trim() ||
      `bbm-${Date.now()}-${reportSequence}`;
    const blueprintId =
      input.businessBlueprintId?.trim() ||
      blueprint.blueprintId?.trim() ||
      launchPlan.businessBlueprintId?.trim() ||
      `blueprint-missing-${reportSequence}`;
    const launchPlanId =
      input.launchPlanId?.trim() ||
      launchPlan.launchPlanId?.trim() ||
      `launch-plan-missing-${reportSequence}`;

    const drafts = this.identifyAllRisks(blueprint, launchPlan, businessType, config);
    const risks = drafts
      .map((draft, index) => this.toRiskEntry(draft, index + 1, now))
      .sort((a, b) => a.priorityRank - b.priorityRank || b.overallRiskScore - a.overallRiskScore);

    const prioritizedRiskIds = risks
      .filter((r) => r.overallRiskRating === "critical" || r.overallRiskRating === "high")
      .map((r) => r.riskId);
    const highOrCriticalCount = prioritizedRiskIds.length;
    const overallPortfolioRiskRating = this.portfolioRating(risks);

    const facts = unique([
      ...risks.flatMap((r) =>
        r.supportingEvidence.filter((e) => e.kind === "fact").map((e) => e.claim),
      ),
      `blueprint_id=${blueprintId}`,
      `launch_plan_id=${launchPlanId}`,
    ]);
    const assumptions = unique(
      risks.flatMap((r) =>
        r.supportingEvidence.filter((e) => e.kind === "assumption").map((e) => e.claim),
      ),
    );
    const missingInformation = this.identifyMissing(blueprint, launchPlan);
    const preservedDecisions = unique([
      ...(blueprint.preservedDecisions ?? []),
      ...(launchPlan.preservedDecisions ?? []),
    ]);
    const traceabilityRefs = unique([
      `q2-06:business_blueprint:${blueprintId}`,
      `q2-07:launch_plan:${launchPlanId}`,
      ...(blueprint.traceabilityRefs ?? []),
      ...(launchPlan.traceabilityRefs ?? []),
    ]);

    return {
      riskReportId:
        input.riskReportId?.trim() || `brw-report-${Date.now()}-${reportSequence}`,
      timestamp: now,
      businessBuildMissionId: missionId,
      businessBlueprintId: blueprintId,
      launchPlanId,
      businessType,
      risks,
      prioritizedRiskIds,
      highOrCriticalCount,
      overallPortfolioRiskRating,
      facts,
      assumptions,
      missingInformation,
      preservedDecisions,
      traceabilityRefs,
      metadataVersion: BRW_METADATA_VERSION,
      reportVersion: BUSINESS_RISK_REPORT_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || BUSINESS_RISK_WORKER_IDENTITY.workerId,
      neverRemoveRisksAutomatically: true,
      neverApproveBusiness: true,
      neverRejectBusiness: true,
      neverLaunchBusiness: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      evidenceBasedFindings: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  identifyAllRisks(
    blueprint: BusinessBlueprintInput,
    launchPlan: LaunchPlanInput,
    businessType: string,
    config: BusinessRiskWorkerConfiguration,
  ): DraftRisk[] {
    const allowed = new Set(config.riskCategories);
    const drafts: DraftRisk[] = [];
    const include = (draft: DraftRisk) => {
      if (allowed.has(String(draft.category))) drafts.push(draft);
    };

    // Legal
    include({
      category: "legal",
      description: `Legal exposure for ${businessType.replace(/_/g, " ")} offer terms, customer contracts, and jurisdiction obligations`,
      likelihood: businessType === "agency" || businessType === "local_services" ? "moderate" : "low",
      impact: "high",
      mitigation: "Document jurisdiction, terms templates, and counsel review checkpoint before production launch",
      confirmed: !!(blueprint.businessObjective || launchPlan.launchObjective),
      evidenceClaims: [
        {
          source: "business_blueprint",
          claim: `Objective: ${blueprint.businessObjective ?? "unspecified"}`,
          kind: blueprint.businessObjective ? "fact" : "assumption",
        },
      ],
    });

    // Operational
    const workflowPressure = (launchPlan.tasks?.length ?? 0) + (launchPlan.launchStages?.length ?? 0);
    include({
      category: "operational",
      description: "Operational complexity may exceed planned workforce capacity during staged launch",
      likelihood: workflowPressure >= 8 ? "high" : "moderate",
      impact: "high",
      mitigation: "Sequence critical stages, validate prerequisites, and hold soft-launch until ops checklist is complete",
      confirmed: workflowPressure > 0,
      evidenceClaims: [
        {
          source: "launch_plan",
          claim: `stages=${launchPlan.launchStages?.length ?? 0} tasks=${launchPlan.tasks?.length ?? 0}`,
          kind: "fact",
        },
      ],
    });

    // Financial
    const leanCost = /lean_/i.test(blueprint.businessArchitecture?.costModel ?? "");
    include({
      category: "financial",
      description: "Cashflow and cost overrun risk relative to revenue model and acquisition spend",
      likelihood: leanCost ? "moderate" : "high",
      impact: "high",
      mitigation: "Set launch budget caps, track unit economics, and gate production launch on cost checkpoints",
      confirmed: !!blueprint.businessArchitecture?.revenueModel,
      evidenceClaims: [
        {
          source: "business_blueprint",
          claim: `revenue=${blueprint.businessArchitecture?.revenueModel ?? "unknown"}; cost=${blueprint.businessArchitecture?.costModel ?? "unknown"}`,
          kind: blueprint.businessArchitecture?.revenueModel ? "fact" : "assumption",
        },
      ],
    });

    // Brand
    include({
      category: "brand",
      description: "Brand and reputation risk from unmet customer expectations or poor early delivery quality",
      likelihood: "moderate",
      impact: businessType === "media" || businessType === "agency" ? "high" : "moderate",
      mitigation: "Limit soft-launch audience, monitor quality signals, and define escalation for reputation incidents",
      confirmed: !!(blueprint.valueProposition || blueprint.customerSegments?.length),
      evidenceClaims: [
        {
          source: "business_blueprint",
          claim: `value_proposition=${blueprint.valueProposition ?? "unspecified"}`,
          kind: blueprint.valueProposition ? "fact" : "assumption",
        },
      ],
    });

    // Marketplace / Platform
    const integrations = blueprint.requiredIntegrations ?? launchPlan.requiredTools ?? [];
    include({
      category: "marketplace_platform",
      description: "Platform policy, API, or marketplace dependency risk for distribution channels",
      likelihood: integrations.length >= 2 ? "high" : "moderate",
      impact: "high",
      mitigation: "Diversify critical channels where feasible and document platform policy compliance checks",
      confirmed: integrations.length > 0,
      evidenceClaims: [
        {
          source: "business_blueprint",
          claim: `integrations=${integrations.slice(0, 5).join("|") || "none"}`,
          kind: integrations.length ? "fact" : "assumption",
        },
      ],
    });

    // Supplier
    const supplierRelevant =
      businessType === "commerce" ||
      businessType === "local_cleaning" ||
      businessType === "local_services" ||
      businessType === "agency";
    include({
      category: "supplier",
      description: supplierRelevant
        ? "Supplier/partner reliability risk affecting fulfillment or service delivery"
        : "Third-party dependency risk for supporting services and content/tooling suppliers",
      likelihood: supplierRelevant ? "moderate" : "low",
      impact: supplierRelevant ? "high" : "moderate",
      mitigation: "Identify backup suppliers/partners and define SLA/acceptance criteria before production launch",
      confirmed: supplierRelevant || (blueprint.requiredAssets?.length ?? 0) > 0,
      evidenceClaims: [
        {
          source: "business_type_profile",
          claim: `supplier_sensitivity=${supplierRelevant}`,
          kind: "assumption",
        },
      ],
    });

    // Technical
    include({
      category: "technical",
      description: "Technical integration and tooling readiness risk across planned launch tools",
      likelihood: (launchPlan.requiredTools?.length ?? 0) >= 3 ? "moderate" : "low",
      impact: businessType === "saas" ? "high" : "moderate",
      mitigation: "Complete integration testing stage and block production launch on failed validation checkpoints",
      confirmed: !!(launchPlan.requiredTools?.length || blueprint.requiredIntegrations?.length),
      evidenceClaims: [
        {
          source: "launch_plan",
          claim: `required_tools=${(launchPlan.requiredTools ?? []).slice(0, 5).join("|") || "none"}`,
          kind: launchPlan.requiredTools?.length ? "fact" : "assumption",
        },
      ],
    });

    // Security
    include({
      category: "security",
      description: "Security risk for customer data, payments, credentials, and platform access",
      likelihood: businessType === "saas" || businessType === "commerce" ? "moderate" : "low",
      impact: "high",
      mitigation: "Enforce least-privilege access, secret hygiene, and security validation before soft launch",
      confirmed: integrations.some((i) => /payment|billing|auth|shopify/i.test(i)),
      evidenceClaims: [
        {
          source: "integrations",
          claim: "Payment/platform integrations imply credential and data handling exposure",
          kind: integrations.length ? "fact" : "assumption",
        },
      ],
    });

    // Compliance
    include({
      category: "compliance",
      description: "Compliance risk for disclosures, consumer protection, and platform/regulatory rules",
      likelihood: "moderate",
      impact: "high",
      mitigation: "Map compliance checklist to approval checkpoints and retain evidence in audit trail",
      confirmed: !!(launchPlan.approvalCheckpoints?.length || launchPlan.validationCheckpoints?.length),
      evidenceClaims: [
        {
          source: "launch_plan",
          claim: `approval_checkpoints=${launchPlan.approvalCheckpoints?.length ?? 0}`,
          kind: "fact",
        },
      ],
    });

    // Execution
    const openBlockers = launchPlan.blockers?.length ?? 0;
    const missingPrereqs = launchPlan.missingPrerequisites?.length ?? 0;
    include({
      category: "execution",
      description: "Execution risk from open launch blockers, missing prerequisites, or rollback triggers",
      likelihood: openBlockers + missingPrereqs >= 2 ? "high" : "moderate",
      impact: "high",
      mitigation: "Resolve high-severity blockers, close missing prerequisites, and rehearse rollback/pause conditions",
      confirmed: openBlockers > 0 || missingPrereqs > 0 || !!(launchPlan.rollbackConditions?.length),
      evidenceClaims: [
        {
          source: "launch_plan",
          claim: `blockers=${openBlockers}; missing_prerequisites=${missingPrereqs}; rollback_conditions=${launchPlan.rollbackConditions?.length ?? 0}`,
          kind: "fact",
        },
      ],
    });

    // Blueprint dependency echoes as operational/execution assumptions
    for (const dep of (blueprint.dependencies ?? []).slice(0, 2)) {
      include({
        category: "execution",
        description: dep.description?.trim() || "Unresolved blueprint dependency may delay launch readiness",
        likelihood: "moderate",
        impact: "moderate",
        mitigation: "Track dependency to an explicit launch-plan milestone owner and acceptance criterion",
        confirmed: !!dep.description,
        evidenceClaims: [
          {
            source: "business_blueprint",
            claim: dep.description?.trim() || "dependency_present",
            kind: dep.description ? "fact" : "assumption",
          },
        ],
      });
    }

    return drafts;
  }

  toRiskEntry(draft: DraftRisk, sequence: number, now: string): RiskEntry {
    const likelihoodScore = levelScore(draft.likelihood);
    const impactScore = levelScore(draft.impact);
    const overallRiskScore = Number((likelihoodScore * 0.45 + impactScore * 0.55).toFixed(2));
    const overallRiskRating = ratingFromScore(overallRiskScore, draft.likelihood, draft.impact);
    const residualRisk = residualFrom(overallRiskRating, draft.confirmed);
    const supportingEvidence: EvidenceItem[] = draft.evidenceClaims.map((claim, idx) => ({
      evidenceId: `ev-${sequence}-${idx + 1}`,
      source: claim.source,
      claim: claim.claim,
      kind: claim.kind,
      relatedCategory: draft.category,
      recordedAt: now,
    }));

    return {
      riskId: `risk-${String(sequence).padStart(2, "0")}`,
      riskCategory: draft.category,
      riskDescription: draft.description,
      likelihood: draft.likelihood,
      impact: draft.impact,
      likelihoodScore,
      impactScore,
      overallRiskRating,
      overallRiskScore,
      recommendedMitigation: draft.mitigation,
      residualRisk,
      supportingEvidence,
      confirmed: draft.confirmed,
      priorityRank: priorityRank(overallRiskRating),
    };
  }

  portfolioRating(risks: RiskEntry[]): OverallRiskRating {
    if (risks.some((r) => r.overallRiskRating === "critical")) return "critical";
    if (risks.filter((r) => r.overallRiskRating === "high").length >= 2) return "high";
    if (risks.some((r) => r.overallRiskRating === "high")) return "high";
    if (risks.some((r) => r.overallRiskRating === "moderate")) return "moderate";
    return "low";
  }

  identifyMissing(
    blueprint: BusinessBlueprintInput,
    launchPlan: LaunchPlanInput,
  ): string[] {
    const missing: string[] = [];
    if (!blueprint.blueprintId) missing.push("business_blueprint_id");
    if (!launchPlan.launchPlanId) missing.push("launch_plan_id");
    if (!(blueprint.requiredIntegrations?.length) && !(launchPlan.requiredTools?.length)) {
      missing.push("integration_or_tool_inventory");
    }
    if (!(launchPlan.blockers?.length)) missing.push("explicit_launch_blocker_register");
    if (!(launchPlan.rollbackConditions?.length)) missing.push("rollback_conditions");
    for (const item of launchPlan.missingPrerequisites ?? []) {
      missing.push(`launch_gap:${item}`);
    }
    return unique(missing);
  }
}

let reportSequence = 0;

export function resetRiskSequenceForTesting() {
  reportSequence = 0;
}

function levelScore(level: LikelihoodLevel | ImpactLevel): number {
  return level === "high" ? 85 : level === "moderate" ? 55 : 25;
}

function ratingFromScore(
  score: number,
  likelihood: LikelihoodLevel,
  impact: ImpactLevel,
): OverallRiskRating {
  if (likelihood === "high" && impact === "high") return "critical";
  if (score >= 75) return "high";
  if (score >= 45) return "moderate";
  return "low";
}

function residualFrom(
  rating: OverallRiskRating,
  confirmed: boolean,
): OverallRiskRating {
  if (rating === "critical") return confirmed ? "high" : "critical";
  if (rating === "high") return "moderate";
  if (rating === "moderate") return "low";
  return "low";
}

function priorityRank(rating: OverallRiskRating): number {
  return rating === "critical" ? 0 : rating === "high" ? 1 : rating === "moderate" ? 2 : 3;
}

function normalizeType(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneReport(report: BusinessRiskReport): BusinessRiskReport {
  return {
    ...report,
    risks: report.risks.map((risk) => ({
      ...risk,
      supportingEvidence: risk.supportingEvidence.map((e) => ({ ...e })),
    })),
    prioritizedRiskIds: [...report.prioritizedRiskIds],
    facts: [...report.facts],
    assumptions: [...report.assumptions],
    missingInformation: [...report.missingInformation],
    preservedDecisions: [...report.preservedDecisions],
    traceabilityRefs: [...report.traceabilityRefs],
  };
}
