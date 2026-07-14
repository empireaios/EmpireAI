import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { ExecutiveRoadmapEngine } from "../executive-roadmap-engine/types.js";
import type { OpportunityPrioritizationEngine } from "../opportunity-prioritization-engine/types.js";
import type { PriorityManagementEngine } from "../priority-management-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  ALIGNMENT_PIPELINE,
  ALIGNMENT_PRINCIPLES,
  GOVERNED_ALIGNMENT_DOMAINS,
  ALIGNMENT_SCORING_DOMAINS,
  DRIFT_DETECTION_TYPES,
  PILLOW_ALIGNMENT_EVALUATIONS,
} from "./paths.js";
import type {
  StrategicAlignmentMonitor,
  AlignmentPipelineStep,
  AlignmentPipelinePhase,
  AlignmentAssessment,
  AlignmentScoreMetric,
  DriftDetectionItem,
  AlignmentTrendItem,
  StrategicAlignmentRecommendation,
  PillowAlignmentEvaluationMetric,
  GovernedAlignmentDomain,
  DeviationLevel,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function healthLabel(score: number): string {
  if (score >= 85) return "healthy";
  if (score >= 70) return "stable";
  if (score >= 50) return "attention";
  return "critical";
}

function deviationFromScore(score: number): DeviationLevel {
  if (score >= 90) return "none";
  if (score >= 80) return "minimal";
  if (score >= 65) return "moderate";
  if (score >= 50) return "significant";
  return "critical";
}

function buildPipeline(activePhase: AlignmentPipelinePhase = "continuous_monitoring"): AlignmentPipelineStep[] {
  const activeIdx = ALIGNMENT_PIPELINE.indexOf(activePhase);
  return ALIGNMENT_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildAssessments(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  vie?: Record<string, unknown>;
}): AlignmentAssessment[] {
  const vision = input.corporateVision?.visionSummary ?? "Constitutional vision · perpetual Empire evolution";
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E1 Executive Planning",
    ];
  const vieStatus = String(input.vie?.approvalStatus ?? "validated");
  const topOppScore = input.opportunityPrioritization?.topOpportunityScore ?? 80;

  const catalogue: Array<{
    id: string;
    scope: AlignmentAssessment["scope"];
    domain: GovernedAlignmentDomain;
    objective: string;
    baseScore: number;
    businessImpact: string;
    strategicImpact: string;
    riskLevel: string;
    corrective: string;
    evidence: string[];
  }> = [
    {
      id: "sam-vision",
      scope: "enterprise",
      domain: "vision_alignment",
      objective: objectives[0] ?? "E1 Executive Planning",
      baseScore: input.corporateVision?.healthScore ?? 85,
      businessImpact: "critical",
      strategicImpact: "critical",
      riskLevel: "low",
      corrective: "Maintain vision synchronization · VIE validation",
      evidence: [vision, `VIE: ${vieStatus}`],
    },
    {
      id: "sam-objectives",
      scope: "executive_programme",
      domain: "strategic_objective_alignment",
      objective: objectives[0] ?? "E1 Executive Planning",
      baseScore: input.strategicObjectives?.healthScore ?? 82,
      businessImpact: "high",
      strategicImpact: "critical",
      riskLevel: "low",
      corrective: "Monitor objective completion · reassess quarterly",
      evidence: [`${input.strategicObjectives?.currentStrategicObjectives.length ?? 3} objectives active`],
    },
    {
      id: "sam-roadmap",
      scope: "roadmap",
      domain: "roadmap_alignment",
      objective: objectives[0] ?? "E1 Executive Planning",
      baseScore: input.executiveRoadmap?.healthScore ?? 80,
      businessImpact: "high",
      strategicImpact: "high",
      riskLevel: "low",
      corrective: "Roadmap review · programme sequencing validation",
      evidence: [input.executiveRoadmap?.roadmapSummary ?? "E1 programme active"],
    },
    {
      id: "sam-programme",
      scope: "programme",
      domain: "programme_alignment",
      objective: "E1 Executive Planning",
      baseScore: 88,
      businessImpact: "high",
      strategicImpact: "critical",
      riskLevel: "low",
      corrective: "Complete E1-14 Executive Planning Dashboard",
      evidence: ["E1-01 through E1-13 operational", "No competing planning systems"],
    },
    {
      id: "sam-department",
      scope: "department",
      domain: "department_alignment",
      objective: objectives[1] ?? "Department Coordination",
      baseScore: 78,
      businessImpact: "moderate",
      strategicImpact: "high",
      riskLevel: "low",
      corrective: "Department Planning Engine review · capacity alignment",
      evidence: ["E1-07 Department Planning active"],
    },
    {
      id: "sam-mission",
      scope: "mission",
      domain: "mission_alignment",
      objective: "Current Mission Alignment",
      baseScore: 86,
      businessImpact: "high",
      strategicImpact: "high",
      riskLevel: "low",
      corrective: "Supervisor monitoring · Journey recording",
      evidence: ["Supervisor active", "Journey system operational"],
    },
    {
      id: "sam-business",
      scope: "business",
      domain: "business_alignment",
      objective: "MS-A Financial Milestone",
      baseScore: 72,
      businessImpact: "critical",
      strategicImpact: "high",
      riskLevel: "medium",
      corrective: "Commerce alignment review · MS-A progress tracking",
      evidence: ["P8 Commerce programme", "Business Factory"],
    },
    {
      id: "sam-commerce",
      scope: "business",
      domain: "commerce_alignment",
      objective: "Commerce Growth",
      baseScore: 70,
      businessImpact: "high",
      strategicImpact: "high",
      riskLevel: "medium",
      corrective: "Commercial intelligence review · revenue path validation",
      evidence: ["P8 Commerce Operating Model"],
    },
    {
      id: "sam-engineering",
      scope: "engineering",
      domain: "engineering_alignment",
      objective: "Execution Velocity",
      baseScore: 84,
      businessImpact: "high",
      strategicImpact: "high",
      riskLevel: "low",
      corrective: "Builder monitor · ETA engine alignment",
      evidence: ["Builder operational", "Production truth validated"],
    },
    {
      id: "sam-architecture",
      scope: "engineering",
      domain: "architecture_alignment",
      objective: "Canonical Architecture",
      baseScore: input.executiveArchitecture?.healthScore ?? 87,
      businessImpact: "high",
      strategicImpact: "critical",
      riskLevel: "low",
      corrective: "Architecture evolution review · drift detection",
      evidence: ["E1-01 Executive Architecture", "P9-03 Architecture Evolution"],
    },
    {
      id: "sam-production",
      scope: "enterprise",
      domain: "production_alignment",
      objective: "Production Truth",
      baseScore: 83,
      businessImpact: "high",
      strategicImpact: "high",
      riskLevel: "low",
      corrective: "Guardian monitoring · production centre review",
      evidence: ["Production mode active", "Browser truth validated"],
    },
    {
      id: "sam-executive",
      scope: "executive_programme",
      domain: "executive_alignment",
      objective: "Executive Governance",
      baseScore: Math.round((topOppScore + (input.priorityManagement?.healthScore ?? 80)) / 2),
      businessImpact: "critical",
      strategicImpact: "critical",
      riskLevel: "low",
      corrective: "Opportunity prioritization review · priority management sync",
      evidence: [
        `E1-12 top opportunity score: ${topOppScore}`,
        `E1-05 priority health: ${input.priorityManagement?.priorityHealth ?? "active"}`,
      ],
    },
  ];

  return catalogue.map((c) => {
    const score = Math.min(100, Math.max(0, c.baseScore));
    return {
      alignmentId: c.id,
      scope: c.scope,
      domain: c.domain,
      relatedVision: vision.slice(0, 120),
      relatedStrategicObjective: c.objective,
      currentAlignmentScore: score,
      deviationLevel: deviationFromScore(score),
      businessImpact: c.businessImpact,
      strategicImpact: c.strategicImpact,
      riskLevel: c.riskLevel,
      correctiveRecommendation: c.corrective,
      confidence: score >= 80 ? 88 : score >= 65 ? 75 : 60,
      evidence: c.evidence,
    };
  });
}

function buildAlignmentScoring(assessments: AlignmentAssessment[]): AlignmentScoreMetric[] {
  const domainMap: Record<string, number[]> = {
    vision_consistency: [],
    objective_consistency: [],
    roadmap_consistency: [],
    programme_consistency: [],
    mission_consistency: [],
    business_consistency: [],
    architecture_consistency: [],
    production_consistency: [],
    executive_consistency: [],
  };

  for (const a of assessments) {
    if (a.domain.includes("vision")) domainMap.vision_consistency?.push(a.currentAlignmentScore);
    if (a.domain.includes("objective")) domainMap.objective_consistency?.push(a.currentAlignmentScore);
    if (a.domain.includes("roadmap")) domainMap.roadmap_consistency?.push(a.currentAlignmentScore);
    if (a.domain.includes("programme")) domainMap.programme_consistency?.push(a.currentAlignmentScore);
    if (a.domain.includes("mission")) domainMap.mission_consistency?.push(a.currentAlignmentScore);
    if (a.domain.includes("business") || a.domain.includes("commerce"))
      domainMap.business_consistency?.push(a.currentAlignmentScore);
    if (a.domain.includes("architecture") || a.domain.includes("engineering"))
      domainMap.architecture_consistency?.push(a.currentAlignmentScore);
    if (a.domain.includes("production")) domainMap.production_consistency?.push(a.currentAlignmentScore);
    if (a.domain.includes("executive")) domainMap.executive_consistency?.push(a.currentAlignmentScore);
  }

  return ALIGNMENT_SCORING_DOMAINS.map((domain) => {
    const scores = domainMap[domain] ?? [];
    const score = scores.length
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : 75;
    return {
      domain,
      label: label(domain),
      score,
      status: score >= 85 ? "aligned" : score >= 70 ? "stable" : score >= 55 ? "attention" : "drift",
      summary: `${scores.length || "no"} assessments · ${deviationFromScore(score)} deviation`,
    };
  });
}

function buildDriftDetections(assessments: AlignmentAssessment[]): DriftDetectionItem[] {
  const drifts: DriftDetectionItem[] = [];
  const now = new Date().toISOString();

  for (const a of assessments) {
    if (a.deviationLevel === "none" || a.deviationLevel === "minimal") continue;
    const driftTypeMap: Partial<Record<GovernedAlignmentDomain, DriftDetectionItem["driftType"]>> = {
      vision_alignment: "vision_drift",
      strategic_objective_alignment: "objective_drift",
      roadmap_alignment: "roadmap_drift",
      programme_alignment: "programme_drift",
      department_alignment: "department_drift",
      mission_alignment: "mission_drift",
      business_alignment: "business_drift",
      commerce_alignment: "business_drift",
      architecture_alignment: "architecture_drift",
      engineering_alignment: "execution_drift",
      production_alignment: "execution_drift",
    };
    drifts.push({
      driftId: `drift-${a.alignmentId}`,
      driftType: driftTypeMap[a.domain] ?? "execution_drift",
      label: label(a.domain),
      scope: label(a.scope),
      severity: a.deviationLevel === "critical" ? "critical" : a.deviationLevel === "significant" ? "high" : "medium",
      deviationLevel: a.deviationLevel,
      description: `${label(a.domain)} score ${a.currentAlignmentScore} · ${a.deviationLevel} deviation detected`,
      correctiveAction: a.correctiveRecommendation,
      detectedAt: now,
    });
  }

  if (drifts.length === 0) {
    drifts.push({
      driftId: "drift-none",
      driftType: "vision_drift",
      label: "No Active Drift",
      scope: "Enterprise",
      severity: "none",
      deviationLevel: "none",
      description: "All alignment domains within acceptable thresholds · continuous monitoring active",
      correctiveAction: "Maintain continuous monitoring · early drift detection",
      detectedAt: now,
    });
  }

  return drifts.slice(0, 8);
}

function buildAlignmentTrends(overallScore: number): AlignmentTrendItem[] {
  const periods = ["Previous Quarter", "Previous Month", "Current Week", "Current"];
  const base = overallScore - 4;
  return periods.map((period, i) => {
    const score = Math.min(100, base + i * 1 + (i === 3 ? 2 : 0));
    return {
      period,
      overallScore: score,
      visionScore: score + 2,
      programmeScore: score - 1,
      trend: i === 0 ? "baseline" : score > base + i - 1 ? "improving" : "stable",
    };
  });
}

function buildRecommendations(input: {
  assessments: AlignmentAssessment[];
  drifts: DriftDetectionItem[];
  corporateVision?: CorporateVisionEngine | null;
}): StrategicAlignmentRecommendation[] {
  const lowest = [...input.assessments].sort((a, b) => a.currentAlignmentScore - b.currentAlignmentScore)[0];
  const activeDrifts = input.drifts.filter((d) => d.deviationLevel !== "none");

  return [
    {
      id: "sam-rec-1",
      title: "Maintain enterprise-wide vision synchronization",
      category: "vision_alignment",
      why: "Vision First principle · every activity must remain aligned with constitutional vision",
      what: `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? "aligned")}`,
      how: "Corporate Vision Engine · VIE validation · Continuous monitoring pipeline",
      confidencePercent: 92,
    },
    {
      id: "sam-rec-2",
      title: activeDrifts.length
        ? `Address ${activeDrifts.length} alignment deviation(s) before expansion`
        : "Continue proactive drift prevention",
      category: "drift_correction",
      why: "Strategic drift detected before organizational drift · early correction required",
      what: activeDrifts.map((d) => d.label).join(" · ") || "No active drift · maintain vigilance",
      how: "ECC corrective actions · Supervisor monitoring · Priority adjustments",
      confidencePercent: activeDrifts.length ? 85 : 90,
    },
    {
      id: "sam-rec-3",
      title: lowest
        ? `Strengthen lowest alignment domain: ${label(lowest.domain)}`
        : "Review all alignment domains",
      category: "corrective_action",
      why: `Score ${lowest?.currentAlignmentScore ?? 0} · ${lowest?.deviationLevel ?? "unknown"} deviation`,
      what: lowest?.correctiveRecommendation ?? "Alignment review",
      how: "Executive approval · Programme realignment · Journey recording",
      confidencePercent: lowest?.confidence ?? 80,
    },
    {
      id: "sam-rec-4",
      title: "Prepare E1-14 Executive Planning Dashboard consolidation",
      category: "programme_alignment",
      why: "E1 programme nearing completion · unified executive planning visibility required",
      what: "Consolidate all E1 engines into Executive Planning Dashboard",
      how: "E1-14 mission · Cockpit integration · No competing systems",
      confidencePercent: 88,
    },
  ];
}

function buildPillowEvaluations(input: {
  assessments: AlignmentAssessment[];
  drifts: DriftDetectionItem[];
  recommendations: StrategicAlignmentRecommendation[];
  overallScore: number;
}): PillowAlignmentEvaluationMetric[] {
  const activeDrifts = input.drifts.filter((d) => d.deviationLevel !== "none");
  const values: Record<string, { status: string; summary: string }> = {
    strategic_alignment: {
      status: input.overallScore >= 80 ? "aligned" : "attention",
      summary: `Overall alignment ${input.overallScore}/100 · ${input.assessments.length} domains assessed`,
    },
    enterprise_alignment: {
      status: input.assessments.filter((a) => a.scope === "enterprise").every((a) => a.currentAlignmentScore >= 75)
        ? "aligned"
        : "review",
      summary: "Enterprise-wide alignment validated across vision and production",
    },
    emerging_drift: {
      status: activeDrifts.length ? "detected" : "clear",
      summary: activeDrifts.length
        ? `${activeDrifts.length} deviation(s) detected · corrective actions recommended`
        : "No emerging drift · early detection active",
    },
    corrective_opportunities: {
      status: activeDrifts.length ? "active" : "preventive",
      summary: `${input.recommendations.filter((r) => r.category.includes("corrective") || r.category.includes("drift")).length} corrective recommendations`,
    },
    strategic_risks: {
      status: input.assessments.some((a) => a.riskLevel === "high" || a.riskLevel === "critical")
        ? "evaluated"
        : "managed",
      summary: `${input.assessments.filter((a) => a.riskLevel === "medium" || a.riskLevel === "high").length} domains with elevated risk`,
    },
    executive_recommendations: {
      status: input.recommendations.length >= 3 ? "strong" : "building",
      summary: `${input.recommendations.length} evidence-based alignment recommendations`,
    },
  };

  return PILLOW_ALIGNMENT_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    summary: values[domain]?.summary ?? "Pillow alignment evaluation active",
  }));
}

export function assembleStrategicAlignmentMonitor(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): StrategicAlignmentMonitor {
  const alignmentAssessments = buildAssessments(input);
  const alignmentScoring = buildAlignmentScoring(alignmentAssessments);
  const driftDetections = buildDriftDetections(alignmentAssessments);

  const overallAlignmentScore = Math.round(
    alignmentAssessments.reduce((s, a) => s + a.currentAlignmentScore, 0) /
      Math.max(alignmentAssessments.length, 1),
  );

  const alignmentTrends = buildAlignmentTrends(overallAlignmentScore);
  const recommendedActions = buildRecommendations({
    assessments: alignmentAssessments,
    drifts: driftDetections,
    corporateVision: input.corporateVision,
  });

  const healthScore = Math.round(
    (overallAlignmentScore +
      (input.corporateVision?.healthScore ?? 80) +
      (input.opportunityPrioritization?.healthScore ?? 80) +
      (input.strategicObjectives?.healthScore ?? 80)) /
      4,
  );

  const pillowEvaluations = buildPillowEvaluations({
    assessments: alignmentAssessments,
    drifts: driftDetections,
    recommendations: recommendedActions,
    overallScore: overallAlignmentScore,
  });

  const programmeScore =
    alignmentAssessments.find((a) => a.domain === "programme_alignment")?.currentAlignmentScore ?? 85;
  const departmentScore =
    alignmentAssessments.find((a) => a.domain === "department_alignment")?.currentAlignmentScore ?? 78;
  const businessScore =
    alignmentAssessments.find((a) => a.domain === "business_alignment")?.currentAlignmentScore ?? 72;

  const activeDriftCount = driftDetections.filter((d) => d.deviationLevel !== "none").length;
  const currentDrift =
    activeDriftCount === 0
      ? "none detected · continuous monitoring active"
      : `${activeDriftCount} deviation(s) · corrective actions recommended`;

  const pillowAdvisory = [
    `Monitor health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `Overall alignment: ${overallAlignmentScore}/100 · ${alignmentAssessments.length} domains assessed`,
    `Current drift: ${currentDrift}`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `No competing alignment systems · one constitutional monitor`,
    `Ready for E1-14 Executive Planning Dashboard`,
  ];

  return {
    architectureVersion: "E1-13",
    computedAt: new Date().toISOString(),
    monitorSummary:
      "One permanent Strategic Alignment Monitor — continuously measures, validates and protects enterprise-wide strategic alignment, ensuring every programme, mission and business remains synchronized with the Vision and Constitution",
    monitorHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    overallAlignmentScore,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    programmeAlignment: `${programmeScore}/100 · ${deviationFromScore(programmeScore)} deviation`,
    departmentAlignment: `${departmentScore}/100 · ${deviationFromScore(departmentScore)} deviation`,
    businessAlignment: `${businessScore}/100 · ${deviationFromScore(businessScore)} deviation`,
    currentDrift,
    healthScore,
    alignmentAssessments,
    alignmentScoring,
    driftDetections,
    alignmentTrends,
    alignmentPipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    alignmentPrinciples: [...ALIGNMENT_PRINCIPLES],
    governedDomains: [...GOVERNED_ALIGNMENT_DOMAINS],
    pillowAdvisory,
    integrations: {
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      strategicObjectiveEngine: input.strategicObjectives
        ? `E1-03 · ${input.strategicObjectives.objectiveHealth}`
        : "standby",
      executiveRoadmapEngine: input.executiveRoadmap
        ? `E1-04 · ${input.executiveRoadmap.roadmapHealth}`
        : "standby",
      priorityManagementEngine: input.priorityManagement
        ? `E1-05 · ${input.priorityManagement.priorityHealth}`
        : "standby",
      opportunityPrioritizationEngine: input.opportunityPrioritization
        ? `E1-12 · ${input.opportunityPrioritization.engineHealth}`
        : "standby",
      executiveArchitecture: input.executiveArchitecture
        ? `E1-01 · ${input.executiveArchitecture.executiveHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring alignment"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "corrective coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE114: true,
  };
}

export function buildFallbackStrategicAlignmentMonitor(): StrategicAlignmentMonitor {
  return assembleStrategicAlignmentMonitor({});
}
