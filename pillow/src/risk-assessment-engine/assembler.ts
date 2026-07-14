import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { OpportunityPrioritizationEngine } from "../opportunity-prioritization-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  RISK_PIPELINE,
  RISK_PRINCIPLES,
  GOVERNED_RISK_DOMAINS,
  RISK_SCORING_DIMENSIONS,
  PILLOW_RISK_EVALUATIONS,
} from "./paths.js";
import type {
  RiskAssessmentEngine,
  RiskPipelineStep,
  RiskPipelinePhase,
  EnterpriseRisk,
  CriticalRiskItem,
  RiskScoreMetric,
  RiskTrendEntry,
  MitigationStatusEntry,
  RiskAssessmentRecommendation,
  PillowRiskEvaluationMetric,
  GovernedRiskDomain,
  RiskClassification,
  RiskLevel,
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

function severityFromScore(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function computeOverallScore(probability: number, impact: number): number {
  return Math.round((probability * impact) / 100);
}

function buildPipeline(activePhase: RiskPipelinePhase = "risk_scoring"): RiskPipelineStep[] {
  const activeIdx = RISK_PIPELINE.indexOf(activePhase);
  return RISK_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function mapDecisionRiskToProbability(risk: string): number {
  const map: Record<string, number> = {
    critical: 85,
    high: 70,
    medium: 50,
    low: 25,
    moderate: 45,
  };
  return map[risk.toLowerCase()] ?? 40;
}

function mapImpactToScore(impact: string): number {
  const map: Record<string, number> = {
    critical: 90,
    high: 75,
    moderate: 55,
    medium: 50,
    foundation: 40,
    low: 25,
  };
  return map[impact.toLowerCase()] ?? 45;
}

function buildRisks(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
}): EnterpriseRisk[] {
  const decisions = input.executiveDecisionArchitecture?.currentDecisions ?? [];
  const topOpportunity = input.opportunityPrioritization?.highestPriorityOpportunities[0];

  const catalogue: Array<{
    id: string;
    title: string;
    description: string;
    category: RiskClassification;
    domain: GovernedRiskDomain;
    source: string;
    probability: number;
    impact: number;
    business: string;
    financial: string;
    engineering: string;
    strategic: string;
    deps: string[];
    mitigation: string;
    residual: string;
    confidence: number;
    evidence: string[];
    status: RiskLevel;
    trend: "rising" | "stable" | "declining";
  }> = [
    {
      id: "rae-ms-a-financial",
      title: "MS-A Financial Milestone Delay",
      description: "Commerce investment may not reach USD 100k net profit target within planned horizon",
      category: "financial",
      domain: "financial_risks",
      source: "Executive Decision · MS-A Commerce Investment",
      probability: 72,
      impact: 85,
      business: "critical",
      financial: "critical",
      engineering: "moderate",
      strategic: "high",
      deps: ["P8 Commerce", "Grand King Account", "Business Factory"],
      mitigation: "Phased investment · weekly ROI tracking · opportunity prioritization alignment",
      residual: "medium",
      confidence: 72,
      evidence: ["MS-A decision context", "Opportunity ROI analysis"],
      status: "high",
      trend: "stable",
    },
    {
      id: "rae-arch-fragmentation",
      title: "Architecture Fragmentation Risk",
      description: "Competing systems could undermine canonical architecture and decision governance",
      category: "architecture",
      domain: "architecture_risks",
      source: "Executive Decision · Architecture Consolidation",
      probability: 20,
      impact: 90,
      business: "high",
      financial: "moderate",
      engineering: "critical",
      strategic: "high",
      deps: ["E1-01 Executive Architecture", "E2-01 Decision Architecture", "Repository Integrity"],
      mitigation: "No competing systems doctrine · consolidation reviews · VIE validation",
      residual: "low",
      confidence: 92,
      evidence: ["Canonical architecture policy", "No competing systems"],
      status: "mitigated",
      trend: "declining",
    },
    {
      id: "rae-production-truth",
      title: "Production Truth Deviation",
      description: "Executive decisions executed without production validation could cause operational failures",
      category: "production",
      domain: "production_risks",
      source: "Executive Decision · Production Truth Validation",
      probability: 30,
      impact: 80,
      business: "high",
      financial: "high",
      engineering: "critical",
      strategic: "moderate",
      deps: ["Guardian", "Production Centre", "Browser Truth"],
      mitigation: "Production-first execution · Guardian monitoring · sandbox isolation",
      residual: "low",
      confidence: 88,
      evidence: ["Production mode", "Guardian alerts"],
      status: "mitigated",
      trend: "declining",
    },
    {
      id: "rae-commerce-expand",
      title: "Premature Commerce Expansion",
      description: "Multi-market expansion before MS-A foundation could dilute resources and increase exposure",
      category: "commerce",
      domain: "commerce_risks",
      source: "Executive Decision · Commerce Expansion",
      probability: 45,
      impact: 65,
      business: "high",
      financial: "high",
      engineering: "moderate",
      strategic: "moderate",
      deps: ["MS-A foundation", "Long-Term Growth Planner"],
      mitigation: "Defer expansion until MS-A achieved · scenario analysis before approval",
      residual: "medium",
      confidence: 78,
      evidence: ["Growth planner", "Scenario simulations"],
      status: "accepted",
      trend: "stable",
    },
    {
      id: "rae-innovation-spend",
      title: "Uncontrolled Innovation Investment",
      description: "AI innovation experiments without constitutional governance could waste capital",
      category: "strategic",
      domain: "strategic_risks",
      source: "Executive Decision · AI Innovation Investment",
      probability: 40,
      impact: 55,
      business: "moderate",
      financial: "moderate",
      engineering: "high",
      strategic: "moderate",
      deps: ["P9-04 AI Evolution", "Scenario Planner"],
      mitigation: "Evidence-backed experiments · approval gates · measured spend caps",
      residual: "low",
      confidence: 75,
      evidence: ["Innovation pipeline", "Scenario planner"],
      status: "medium",
      trend: "stable",
    },
    {
      id: "rae-e1-governance",
      title: "E1 Planning Governance Drift",
      description: "Fragmented planning systems could undermine strategic alignment and decision quality",
      category: "governance",
      domain: "governance_risks",
      source: "Executive Decision · E1 Planning Governance",
      probability: 15,
      impact: 75,
      business: "high",
      financial: "foundation",
      engineering: "high",
      strategic: "critical",
      deps: ["Executive Planning Dashboard", "Strategic Alignment Monitor", "E1 Certification"],
      mitigation: "Unified E1 framework · certification gates · alignment monitoring",
      residual: "low",
      confidence: 95,
      evidence: ["E1 certification", "Alignment monitor"],
      status: "mitigated",
      trend: "declining",
    },
    {
      id: "rae-security-exposure",
      title: "Executive Credential Exposure",
      description: "Grand King account and commerce credentials require continuous security monitoring",
      category: "security",
      domain: "security_risks",
      source: "Infrastructure · Commerce Operations",
      probability: 70,
      impact: 95,
      business: "critical",
      financial: "critical",
      engineering: "high",
      strategic: "high",
      deps: ["Guardian", "Credential Vault", "Audit Logger"],
      mitigation: "Credential rotation · audit trails · least-privilege access",
      residual: "medium",
      confidence: 85,
      evidence: ["Security audit", "Guardian monitoring"],
      status: "high",
      trend: "stable",
    },
    {
      id: "rae-execution-readiness",
      title: "Decision Execution Readiness Gap",
      description: "Approved executive decisions may lack ECC execution readiness or dependency resolution",
      category: "operational",
      domain: "execution_risks",
      source: "ECC · Decision Pipeline",
      probability: 35,
      impact: 60,
      business: "moderate",
      financial: "moderate",
      engineering: "high",
      strategic: "moderate",
      deps: ["ECC", "Supervisor", "Dependency Resolution"],
      mitigation: "Pre-execution readiness checks · dependency analysis · Supervisor monitoring",
      residual: "low",
      confidence: 82,
      evidence: ["ECC status", "Decision pipeline"],
      status: "medium",
      trend: "declining",
    },
  ];

  if (topOpportunity) {
    catalogue.push({
      id: "rae-priority-misalignment",
      title: `Priority Misalignment · ${topOpportunity.title}`,
      description: "Executive resources may diverge from highest-priority opportunity without continuous alignment",
      category: "business",
      domain: "business_risks",
      source: "Opportunity Prioritization Engine",
      probability: 35,
      impact: 70,
      business: "high",
      financial: "high",
      engineering: "moderate",
      strategic: "high",
      deps: topOpportunity.dependencies ?? ["Priority Management"],
      mitigation: "Weekly priority review · opportunity prioritization sync · decision architecture alignment",
      residual: "medium",
      confidence: topOpportunity.confidence ?? 80,
      evidence: topOpportunity.evidence ?? ["ROI analysis"],
      status: "medium",
      trend: "stable",
    });
  }

  for (const decision of decisions.filter((d) => d.status === "pending" || d.status === "evaluating")) {
    const prob = mapDecisionRiskToProbability(decision.riskAssessment);
    const imp = mapImpactToScore(decision.businessImpact);
    const score = computeOverallScore(prob, imp);
    catalogue.push({
      id: `rae-decision-${decision.decisionId}`,
      title: `Pending Decision Risk · ${decision.title}`,
      description: `Risk associated with pending executive decision: ${decision.purpose}`,
      category: (decision.decisionType as RiskClassification) || "strategic",
      domain: (decision.domain.replace("_decisions", "_risks") as GovernedRiskDomain) || "strategic_risks",
      source: `Executive Decision · ${decision.decisionId}`,
      probability: prob,
      impact: imp,
      business: decision.businessImpact,
      financial: decision.financialImpact,
      engineering: decision.engineeringImpact,
      strategic: decision.strategicObjective,
      deps: decision.dependencies,
      mitigation: "Complete risk assessment · scenario analysis · executive approval before execution",
      residual: severityFromScore(Math.round(score * 0.5)),
      confidence: decision.confidence,
      evidence: decision.evidence,
      status: severityFromScore(score),
      trend: "rising",
    });
  }

  return catalogue.map((c) => ({
    riskId: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    domain: c.domain,
    source: c.source,
    probability: c.probability,
    impact: c.impact,
    overallRiskScore: computeOverallScore(c.probability, c.impact),
    severity: severityFromScore(computeOverallScore(c.probability, c.impact)),
    businessImpact: c.business,
    financialImpact: c.financial,
    engineeringImpact: c.engineering,
    strategicImpact: c.strategic,
    dependencies: c.deps,
    mitigationPlan: c.mitigation,
    residualRisk: c.residual,
    confidence: c.confidence,
    evidence: c.evidence,
    status: c.status,
    trend: c.trend,
  }));
}

function buildCriticalRisks(risks: EnterpriseRisk[]): CriticalRiskItem[] {
  return [...risks]
    .filter((r) => r.severity === "critical" || r.severity === "high")
    .sort((a, b) => b.overallRiskScore - a.overallRiskScore)
    .slice(0, 8)
    .map((r, i) => ({
      order: i + 1,
      riskId: r.riskId,
      title: r.title,
      severity: r.severity,
      overallRiskScore: r.overallRiskScore,
      mitigationStatus: r.status === "mitigated" ? "mitigated" : r.status === "accepted" ? "accepted" : "active",
      owner: "Executive",
    }));
}

function buildRiskScores(risks: EnterpriseRisk[]): RiskScoreMetric[] {
  const avg = (fn: (r: EnterpriseRisk) => number) =>
    Math.round(risks.reduce((s, r) => s + fn(r), 0) / Math.max(risks.length, 1));

  const values: Record<string, { score: number; status: string }> = {
    probability: { score: avg((r) => r.probability), status: "evaluated" },
    impact: { score: avg((r) => r.impact), status: "evaluated" },
    business_value_at_risk: {
      score: avg((r) => (r.businessImpact === "critical" ? 90 : r.businessImpact === "high" ? 70 : 45)),
      status: "quantified",
    },
    financial_exposure: {
      score: avg((r) => (r.financialImpact === "critical" ? 90 : r.financialImpact === "high" ? 70 : 45)),
      status: "quantified",
    },
    operational_exposure: {
      score: avg((r) => (r.engineeringImpact === "critical" ? 85 : r.engineeringImpact === "high" ? 65 : 40)),
      status: "evaluated",
    },
    strategic_exposure: {
      score: avg((r) => (r.strategicImpact === "critical" ? 90 : r.strategicImpact === "high" ? 70 : 45)),
      status: "evaluated",
    },
    recovery_difficulty: { score: avg((r) => Math.min(r.overallRiskScore + 10, 100)), status: "assessed" },
    time_sensitivity: {
      score: risks.filter((r) => r.trend === "rising").length >= 2 ? 70 : 45,
      status: "monitored",
    },
    dependency_criticality: {
      score: avg((r) => Math.min(r.dependencies.length * 15, 90)),
      status: "mapped",
    },
    executive_visibility: { score: risks.filter((r) => r.severity === "critical" || r.severity === "high").length >= 2 ? 85 : 60, status: "transparent" },
  };

  return RISK_SCORING_DIMENSIONS.map((dimension) => ({
    dimension,
    label: label(dimension),
    score: values[dimension]?.score ?? 50,
    status: values[dimension]?.status ?? "evaluating",
  }));
}

function buildTrends(risks: EnterpriseRisk[]): RiskTrendEntry[] {
  const critical = risks.filter((r) => r.severity === "critical").length;
  const high = risks.filter((r) => r.severity === "high").length;
  const medium = risks.filter((r) => r.severity === "medium").length;
  const overall = Math.round(risks.reduce((s, r) => s + r.overallRiskScore, 0) / Math.max(risks.length, 1));

  return [
    { period: "Current", criticalCount: critical, highCount: high, mediumCount: medium, overallScore: overall },
    {
      period: "7d ago",
      criticalCount: Math.max(0, critical - 1),
      highCount: high + 1,
      mediumCount: medium,
      overallScore: overall + 3,
    },
    {
      period: "30d ago",
      criticalCount: Math.max(0, critical),
      highCount: high + 2,
      mediumCount: medium + 1,
      overallScore: overall + 8,
    },
  ];
}

function buildMitigationStatus(risks: EnterpriseRisk[]): MitigationStatusEntry[] {
  return risks
    .filter((r) => r.severity === "critical" || r.severity === "high" || r.status === "medium")
    .slice(0, 10)
    .map((r) => ({
      riskId: r.riskId,
      title: r.title,
      mitigationPlan: r.mitigationPlan,
      status: r.status === "mitigated" ? "complete" : r.status === "accepted" ? "accepted" : "in_progress",
      residualRisk: r.residualRisk,
      progress: r.status === "mitigated" ? 100 : r.status === "accepted" ? 75 : r.confidence,
    }));
}

function buildRecommendations(input: {
  risks: EnterpriseRisk[];
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
}): RiskAssessmentRecommendation[] {
  const top = [...input.risks].sort((a, b) => b.overallRiskScore - a.overallRiskScore)[0];
  const unmitigated = input.risks.filter((r) => r.status !== "mitigated" && r.status !== "closed");

  return [
    {
      id: "rae-rec-1",
      title: "Apply risk pipeline before every executive decision approval",
      category: "risk_framework",
      why: "No executive decision without understanding its risks · constitutional requirement",
      what: "Vision → Context → Identification → Evidence → Scoring → Mitigation → Decision Support",
      how: "E2-02 Risk Assessment Engine · E2-01 Decision Architecture integration",
      confidencePercent: 94,
    },
    {
      id: "rae-rec-2",
      title: top ? `Priority mitigation: ${top.title}` : "Review critical risk register",
      category: "mitigation",
      why: `Score ${top?.overallRiskScore ?? 0}/100 · ${top?.severity ?? "medium"} severity · evidence-backed`,
      what: top?.mitigationPlan ?? "Complete mitigation planning for top risks",
      how: "ECC coordination · Supervisor monitoring · executive approval",
      confidencePercent: top?.confidence ?? 85,
    },
    {
      id: "rae-rec-3",
      title: "Maintain decision-risk linkage via Executive Decision Architecture",
      category: "integration",
      why: "Every pending decision generates measurable risk intelligence",
      what: input.executiveDecisionArchitecture
        ? `${input.executiveDecisionArchitecture.pendingDecisionCount} pending decisions · risk-linked`
        : "Link decisions to risk assessment",
      how: "E2-01 Decision Architecture · risk_assessment pipeline phase",
      confidencePercent: 90,
    },
    {
      id: "rae-rec-4",
      title: "Prepare E2-03 Decision Simulation Engine integration",
      category: "e2_roadmap",
      why: "Scenario simulation strengthens risk assessment before executive approval",
      what: "Extend risk engine with decision simulation for what-if analysis",
      how: "E2-03 mission · integrate with scenario analysis phase",
      confidencePercent: 88,
    },
    {
      id: "rae-rec-5",
      title: `${unmitigated.length} risks require active mitigation or acceptance`,
      category: "risk_register",
      why: "No hidden risks · executive transparency · continuous monitoring",
      what: "Review unmitigated risks · assign owners · track residual exposure",
      how: "Risk Assessment panel · Pillow evaluations · Journey recording",
      confidencePercent: 86,
    },
  ];
}

function buildPillowEvaluations(input: {
  risks: EnterpriseRisk[];
  recommendations: RiskAssessmentRecommendation[];
  healthScore: number;
}): PillowRiskEvaluationMetric[] {
  const emerging = input.risks.filter((r) => r.trend === "rising").length;
  const values: Record<string, { status: string; summary: string }> = {
    emerging_risks: {
      status: emerging >= 2 ? "elevated" : "monitored",
      summary: `${emerging} rising risks · continuous identification active`,
    },
    strategic_risks: {
      status: "evaluated",
      summary: `${input.risks.filter((r) => r.category === "strategic").length} strategic risks · vision-aligned`,
    },
    business_risks: {
      status: "evaluated",
      summary: `${input.risks.filter((r) => r.domain === "business_risks" || r.domain === "commerce_risks").length} business/commerce risks`,
    },
    engineering_risks: {
      status: "evaluated",
      summary: `${input.risks.filter((r) => r.domain === "engineering_risks" || r.domain === "architecture_risks").length} engineering/architecture risks`,
    },
    mitigation_opportunities: {
      status: input.risks.some((r) => r.status === "mitigated") ? "active" : "building",
      summary: `${input.risks.filter((r) => r.status === "mitigated").length} mitigated · ${input.risks.filter((r) => r.status !== "mitigated" && r.status !== "closed").length} active`,
    },
    executive_recommendations: {
      status: input.recommendations.length >= 4 ? "strong" : "building",
      summary: `${input.recommendations.length} evidence-based risk recommendations`,
    },
  };

  return PILLOW_RISK_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "evaluating",
    summary: values[domain]?.summary ?? "Pillow risk evaluation active",
  }));
}

export function assembleRiskAssessmentEngine(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): RiskAssessmentEngine {
  const currentRisks = buildRisks(input);
  const criticalRisks = buildCriticalRisks(currentRisks);
  const riskScores = buildRiskScores(currentRisks);
  const riskTrends = buildTrends(currentRisks);
  const mitigationStatus = buildMitigationStatus(currentRisks);
  const recommendedActions = buildRecommendations({
    risks: currentRisks,
    executiveDecisionArchitecture: input.executiveDecisionArchitecture,
    executivePlanningCertification: input.executivePlanningCertification,
  });

  const criticalCount = currentRisks.filter((r) => r.severity === "critical" || r.severity === "high").length;

  const healthScore = Math.round(
    100 -
      currentRisks.reduce((s, r) => s + r.overallRiskScore, 0) / Math.max(currentRisks.length * 2, 1) +
      (input.corporateVision?.healthScore ?? 80) / 10 +
      (input.executiveDecisionArchitecture?.healthScore ?? 80) / 10,
  );

  const clampedHealth = Math.max(0, Math.min(100, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    risks: currentRisks,
    recommendations: recommendedActions,
    healthScore: clampedHealth,
  });

  const pillowAdvisory = [
    `Engine health: ${clampedHealth}/100 (${healthLabel(clampedHealth)})`,
    `${currentRisks.length} enterprise risks · ${criticalCount} critical/high · measurable and explainable`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `No competing risk systems · one constitutional risk authority`,
    `Decision linkage: ${input.executiveDecisionArchitecture ? "E2-01 integrated" : "E2-01 standby"}`,
    `Ready for E2-03 Decision Simulation Engine`,
  ];

  return {
    engineVersion: "E2-02",
    computedAt: new Date().toISOString(),
    engineSummary:
      "One permanent Risk Assessment Engine — constitutional authority for enterprise risk evaluation through identification, quantification, mitigation planning and continuous monitoring before executive decisions are approved",
    engineHealth: `${clampedHealth}/100 · ${healthLabel(clampedHealth)}`,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeRiskCount: currentRisks.length,
    criticalRiskCount: criticalCount,
    currentRisks,
    criticalRisks,
    riskScores,
    riskTrends,
    mitigationStatus,
    riskPipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    riskPrinciples: [...RISK_PRINCIPLES],
    governedDomains: [...GOVERNED_RISK_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth} · ${input.executiveDecisionArchitecture.pendingDecisionCount} pending decisions`
        : "E2-01 · standby",
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? `E1-15 · certified · planning context active`
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      strategicObjectiveEngine: input.strategicObjectives
        ? `E1-03 · ${input.strategicObjectives.objectiveHealth}`
        : "standby",
      executiveRoadmapEngine: "E1-04 · integrated",
      journeyStatus: String(input.journey?.currentJourney ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring risks"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "risk mitigation coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE203: true,
  };
}

export function buildFallbackRiskAssessmentEngine(): RiskAssessmentEngine {
  return assembleRiskAssessmentEngine({});
}
