import type {
  BusinessOptimizationReport,
  CrossDomainSynthesis,
  EmpireCommanderReport,
  EngineCoordinationPlan,
  ExecutiveDecisionEvaluation,
  StrategicPlan,
} from "./types.js";

export function buildEmpireCommanderReport(input: {
  crossDomain: CrossDomainSynthesis;
  decisionEvaluation: ExecutiveDecisionEvaluation | null;
  coordination: EngineCoordinationPlan;
  strategicPlan: StrategicPlan;
  optimization: BusinessOptimizationReport;
  engineeringSummary: string;
  infrastructureSummary: string;
  commerceSummary: string;
  businessSummary: string;
}): EmpireCommanderReport {
  const strategicPriorities = [
    ...input.strategicPlan.operationalPriorities.slice(0, 2),
    ...input.strategicPlan.commerceExpansion.slice(0, 1),
    input.decisionEvaluation
      ? `Decision: ${input.decisionEvaluation.executiveSummary}`
      : "Awaiting strategic query for executive decision evaluation",
  ].filter(Boolean);

  const recommendedActions: string[] = [];
  if (input.crossDomain.overallHealthScore < 75) {
    recommendedActions.push("Address systemic risks before major strategic moves");
  }
  recommendedActions.push(...input.coordination.scheduledActions.slice(0, 3));
  recommendedActions.push(...input.optimization.profitLevers.slice(0, 1));
  if (input.decisionEvaluation?.options[0]) {
    recommendedActions.push(`Execute: ${input.decisionEvaluation.options[0].label}`);
  }

  const riskAssessment =
    input.crossDomain.systemicRisks.length > 0
      ? input.crossDomain.systemicRisks.join("; ")
      : "Cross-domain risk profile manageable";

  const executiveBrief = formatExecutiveBrief({
    ...input,
    riskAssessment,
    strategicPriorities,
    recommendedActions,
  });

  return {
    version: "PILLOW-EC-001",
    generatedAt: new Date().toISOString(),
    crossDomain: input.crossDomain,
    decisionEvaluation: input.decisionEvaluation,
    coordination: input.coordination,
    strategicPlan: input.strategicPlan,
    optimization: input.optimization,
    engineeringSummary: input.engineeringSummary,
    infrastructureSummary: input.infrastructureSummary,
    commerceSummary: input.commerceSummary,
    businessSummary: input.businessSummary,
    riskAssessment,
    strategicPriorities,
    recommendedActions,
    executiveBrief,
  };
}

function formatExecutiveBrief(input: {
  crossDomain: CrossDomainSynthesis;
  decisionEvaluation: ExecutiveDecisionEvaluation | null;
  coordination: EngineCoordinationPlan;
  strategicPlan: StrategicPlan;
  optimization: BusinessOptimizationReport;
  engineeringSummary: string;
  infrastructureSummary: string;
  commerceSummary: string;
  businessSummary: string;
  riskAssessment: string;
  strategicPriorities: string[];
  recommendedActions: string[];
}): string {
  const lines: string[] = [
    "--- Empire Commander Executive (PILLOW-EC-001) ---",
    `Overall Empire Health: ${input.crossDomain.overallHealthScore}/100`,
    "",
    "### Cross-Domain Intelligence",
    ...input.crossDomain.domainSignals.map(
      (s) => `- ${s.domain}: ${s.healthScore}/100 — ${s.summary}`,
    ),
    "",
    "### Connected Insights",
    ...input.crossDomain.connectedInsights.map((i) => `- ${i}`),
    "",
    "### Engineering",
    input.engineeringSummary,
    "",
    "### Infrastructure",
    input.infrastructureSummary,
    "",
    "### Commerce",
    input.commerceSummary,
    "",
    "### Business",
    input.businessSummary,
  ];

  if (input.decisionEvaluation) {
    lines.push("", "### Executive Decision", input.decisionEvaluation.executiveSummary);
    for (const opt of input.decisionEvaluation.options.slice(0, 3)) {
      lines.push(
        `- ${opt.label} (${opt.recommendation}, score ${opt.compositeScore}) — business ${opt.businessImpact}, risk ${opt.riskLevel}`,
      );
    }
  }

  lines.push(
    "",
    "### Engine Coordination",
    `Priorities: ${input.coordination.priorities.slice(0, 3).map((p) => p.label).join(" → ")}`,
  );
  if (input.coordination.conflicts.length > 0) {
    lines.push(`Conflicts: ${input.coordination.conflicts.join("; ")}`);
  }

  lines.push(
    "",
    "### Strategic Plan (90d)",
    ...input.strategicPlan.roadmapItems.slice(0, 4).map((r) => `- ${r}`),
    "",
    "### Optimisation",
    ...input.optimization.recommendations.slice(0, 3).map(
      (r) => `- ${r.area}: ${r.targetImprovement}`,
    ),
    "",
    "### Risk Assessment",
    input.riskAssessment,
    "",
    "### Strategic Priorities",
    ...input.strategicPriorities.map((p) => `- ${p}`),
    "",
    "### Recommended Actions",
    ...input.recommendedActions.map((a) => `- ${a}`),
  );

  return lines.join("\n");
}

export function formatEmpireCommanderReport(report: EmpireCommanderReport): string {
  return report.executiveBrief;
}
