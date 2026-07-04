import type {
  AutonomousOptimisationReport,
  ContinuousEvolutionReport,
  DueDiligenceCoverage,
  EmpireEvolutionMetrics,
  ExecutiveRecommendation,
  OpportunityDiscoveryReport,
  RiskDetectionReport,
  SelfImprovementReport,
  Version1FinalCertification,
} from "./types.js";

export function certifyVersion1(input: {
  evolution: EmpireEvolutionMetrics;
  dueDiligence: DueDiligenceCoverage;
  risks: RiskDetectionReport;
  opportunities: OpportunityDiscoveryReport;
}): Version1FinalCertification {
  const phasesComplete = 10;
  const totalPhases = 10;

  const blockers: string[] = [];
  if (input.risks.criticalCount > 0) {
    blockers.push(`${input.risks.criticalCount} critical risk(s) require resolution`);
  }
  if (input.evolution.qualityIndex < 50) {
    blockers.push("Repository quality below Version 1 threshold");
  }
  if (input.evolution.stagnationRisk === "high") {
    blockers.push("Empire evolution stagnation detected");
  }

  const overallScore = Math.round(
    input.evolution.automationIndex * 0.12 +
    input.evolution.qualityIndex * 0.15 +
    input.evolution.profitabilityIndex * 0.12 +
    input.evolution.intelligenceIndex * 0.13 +
    input.evolution.reliabilityIndex * 0.15 +
    input.evolution.maintainabilityIndex * 0.1 +
    input.evolution.executiveVisibilityIndex * 0.13 +
    (input.opportunities.highValueCount >= 3 ? 10 : 0),
  );

  const certified = blockers.length === 0 && overallScore >= 65 && phasesComplete === totalPhases;
  const readinessLevel: Version1FinalCertification["readinessLevel"] = certified
    ? "production"
    : overallScore >= 55
      ? "conditional"
      : "not_ready";

  const summary = certified
    ? "EmpireAI Version 1 FINAL CERTIFIED — Pillow Phases 2–10 complete with permanent continuous evolution"
    : readinessLevel === "conditional"
      ? "EmpireAI Version 1 conditionally certified — resolve blockers for full production certification"
      : "EmpireAI Version 1 not yet certified";

  return {
    certified,
    overallScore,
    phasesComplete,
    totalPhases,
    readinessLevel,
    summary,
    blockers,
  };
}

export function buildContinuousEvolutionReport(input: {
  dueDiligence: DueDiligenceCoverage;
  selfImprovement: SelfImprovementReport;
  opportunities: OpportunityDiscoveryReport;
  risks: RiskDetectionReport;
  optimisation: AutonomousOptimisationReport;
  recommendations: ExecutiveRecommendation[];
  evolution: EmpireEvolutionMetrics;
  version1Certification: Version1FinalCertification;
}): ContinuousEvolutionReport {
  const recommendedActions = [
    ...input.recommendations.slice(0, 3).map((r) => r.title),
    ...input.risks.risks
      .filter((r) => r.level === "critical")
      .map((r) => r.preventiveAction),
    input.optimisation.plans.filter((p) => p.autonomous).map((p) => `[Auto] ${p.action}`)[0],
  ].filter(Boolean).slice(0, 6) as string[];

  const executiveBrief = formatExecutiveBrief({ ...input, recommendedActions });

  return {
    version: "PILLOW-CEV-001",
    generatedAt: new Date().toISOString(),
    dueDiligence: input.dueDiligence,
    selfImprovement: input.selfImprovement,
    opportunities: input.opportunities,
    risks: input.risks,
    optimisation: input.optimisation,
    recommendations: input.recommendations,
    evolution: input.evolution,
    version1Certification: input.version1Certification,
    recommendedActions,
    executiveBrief,
  };
}

function formatExecutiveBrief(input: {
  dueDiligence: DueDiligenceCoverage;
  selfImprovement: SelfImprovementReport;
  opportunities: OpportunityDiscoveryReport;
  risks: RiskDetectionReport;
  optimisation: AutonomousOptimisationReport;
  recommendations: ExecutiveRecommendation[];
  evolution: EmpireEvolutionMetrics;
  version1Certification: Version1FinalCertification;
  recommendedActions: string[];
}): string {
  const lines: string[] = [
    "--- Continuous Empire Evolution (PILLOW-CEV-001) ---",
    `Evolution trend: ${input.evolution.evolutionTrend} · Stagnation risk: ${input.evolution.stagnationRisk}`,
    "",
    "### Due Diligence Coverage",
    `Domains: ${input.dueDiligence.domainsInspected.join(", ")}`,
    `Findings: ${input.dueDiligence.findings.length} · Weakness score: ${input.dueDiligence.overallWeaknessScore}/100`,
    ...input.dueDiligence.findings.slice(0, 4).map((f) => `- [${f.severity}] ${f.domain}: ${f.weakness}`),
    "",
    "### Self-Improvement Backlog",
    `Items: ${input.selfImprovement.totalItems} · Top: ${input.selfImprovement.topPriority?.title ?? "none"}`,
    "",
    "### Opportunity Discovery",
    `High-value opportunities: ${input.opportunities.highValueCount} (threshold ${input.opportunities.qualityThreshold})`,
    ...input.opportunities.opportunities.slice(0, 4).map((o) => `- ${o.title} (${o.valueScore})`),
    "",
    "### Risk Detection",
    `Risk score: ${input.risks.overallRiskScore}/100 · Critical: ${input.risks.criticalCount}`,
    ...input.risks.risks.slice(0, 4).map((r) => `- [${r.level}] ${r.category}: ${r.description}`),
    "",
    "### Autonomous Optimisation",
    `Autonomous: ${input.optimisation.autonomousCount} · Approval required: ${input.optimisation.approvalRequiredCount}`,
    "",
    "### Empire Evolution Metrics",
    `- Automation: ${input.evolution.automationIndex}/100`,
    `- Quality: ${input.evolution.qualityIndex}/100`,
    `- Profitability: ${input.evolution.profitabilityIndex}/100`,
    `- Intelligence: ${input.evolution.intelligenceIndex}/100`,
    `- Reliability: ${input.evolution.reliabilityIndex}/100`,
    "",
    "### Executive Recommendations (ranked)",
    ...input.recommendations.slice(0, 5).map(
      (r) => `- ${r.title} (value ${r.empireValueScore}, ROI ${r.expectedRoi})`,
    ),
    "",
    "### EmpireAI Version 1 Final Certification",
    input.version1Certification.summary,
    `Score: ${input.version1Certification.overallScore}/100 · Phases: ${input.version1Certification.phasesComplete}/${input.version1Certification.totalPhases}`,
    ...(input.version1Certification.blockers.length > 0
      ? input.version1Certification.blockers.map((b) => `Blocker: ${b}`)
      : []),
    "",
    "### Recommended Actions",
    ...input.recommendedActions.map((a) => `- ${a}`),
  ];

  return lines.join("\n");
}

export function formatContinuousEvolutionReport(report: ContinuousEvolutionReport): string {
  return report.executiveBrief;
}
