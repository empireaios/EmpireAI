import type {
  ContinuousEvolutionDeps,
  DueDiligenceCoverage,
  ExecutiveRecommendation,
  OpportunityDiscoveryReport,
  RiskDetectionReport,
  SelfImprovementReport,
} from "./types.js";

const IMPACT_WEIGHT = { low: 1, medium: 2, high: 3, critical: 4 };
const EFFORT_PENALTY = { low: 0, medium: 5, high: 15 };

export function rankExecutiveRecommendations(input: {
  dueDiligence: DueDiligenceCoverage;
  selfImprovement: SelfImprovementReport;
  opportunities: OpportunityDiscoveryReport;
  risks: RiskDetectionReport;
  deps: ContinuousEvolutionDeps;
}): ExecutiveRecommendation[] {
  const recs: ExecutiveRecommendation[] = [];

  for (const finding of input.dueDiligence.findings.filter((f) => f.severity === "critical" || f.severity === "high")) {
    recs.push({
      id: `REC-DD-${finding.domain}`,
      title: finding.preventiveAction,
      missionId: null,
      businessImpact: finding.domain === "commerce" ? "high" : "medium",
      technicalImpact: finding.domain === "architecture" || finding.domain === "engineering" ? "critical" : "high",
      estimatedEffort: "medium",
      expectedRoi: 75,
      empireValueScore: 0,
      rationale: finding.weakness,
    });
  }

  if (input.selfImprovement.topPriority) {
    const top = input.selfImprovement.topPriority;
    recs.push({
      id: top.id,
      title: top.title,
      missionId: "PILLOW-CEV-001",
      businessImpact: top.category === "cost_reduction" ? "high" : "medium",
      technicalImpact: top.category === "technical_debt" ? "critical" : "high",
      estimatedEffort: top.estimatedEffort,
      expectedRoi: top.priority,
      empireValueScore: 0,
      rationale: top.description,
    });
  }

  for (const opp of input.opportunities.opportunities.slice(0, 3)) {
    recs.push({
      id: `REC-OPP-${opp.type}`,
      title: `Pursue: ${opp.title}`,
      missionId: opp.type === "product" ? "PILLOW-CI-001" : null,
      businessImpact: "high",
      technicalImpact: opp.type === "ai_capability" ? "high" : "low",
      estimatedEffort: opp.type === "product" ? "medium" : "high",
      expectedRoi: opp.valueScore,
      empireValueScore: 0,
      rationale: opp.rationale,
    });
  }

  for (const risk of input.risks.risks.filter((r) => r.level === "critical" || r.level === "high")) {
    recs.push({
      id: `REC-RISK-${risk.category}`,
      title: risk.preventiveAction,
      missionId: risk.category === "deployment" ? "PILLOW-IC-001" : null,
      businessImpact: risk.category === "business" || risk.category === "financial" ? "high" : "medium",
      technicalImpact: risk.category === "engineering" || risk.category === "deployment" ? "critical" : "high",
      estimatedEffort: "medium",
      expectedRoi: 80,
      empireValueScore: 0,
      rationale: risk.description,
    });
  }

  const objective = input.deps.objective?.getActiveObjective();
  if (objective) {
    recs.push({
      id: "REC-OBJ-001",
      title: `Advance objective: ${objective.title}`,
      missionId: "PILLOW-019",
      businessImpact: "critical",
      technicalImpact: "high",
      estimatedEffort: "high",
      expectedRoi: 90,
      empireValueScore: 0,
      rationale: `Current progress ${objective.progressPercent}%`,
    });
  }

  for (const rec of recs) {
    rec.empireValueScore = Math.round(
      IMPACT_WEIGHT[rec.businessImpact] * 12 +
      IMPACT_WEIGHT[rec.technicalImpact] * 10 +
      rec.expectedRoi * 0.4 -
      EFFORT_PENALTY[rec.estimatedEffort],
    );
  }

  return recs.sort((a, b) => b.empireValueScore - a.empireValueScore).slice(0, 10);
}
