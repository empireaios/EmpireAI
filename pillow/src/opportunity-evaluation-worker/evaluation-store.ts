import type { OpportunityEvaluationReport } from "./types.js";

/** Authoritative in-memory Opportunity Evaluation store — evaluation only. */
export class EvaluationStore {
  private evaluations = new Map<string, OpportunityEvaluationReport>();
  private latestEvaluationId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    evaluationId: string;
    action: string;
    details: string;
  }> = [];

  seed(evaluations: OpportunityEvaluationReport[]) {
    this.evaluations.clear();
    this.latestEvaluationId = null;
    this.auditTrail = [];
    for (const evaluation of evaluations) {
      this.evaluations.set(evaluation.evaluationId, clone(evaluation));
      this.latestEvaluationId = evaluation.evaluationId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        evaluationId: evaluation.evaluationId,
        action: "seed",
        details: `seeded evaluation for mission=${evaluation.businessBuildMissionId}`,
      });
    }
  }

  count() {
    return this.evaluations.size;
  }

  list() {
    return [...this.evaluations.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(evaluationId: string) {
    const evaluation = this.evaluations.get(evaluationId);
    return evaluation ? clone(evaluation) : null;
  }

  getLatestEvaluationId() {
    return this.latestEvaluationId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(evaluation: OpportunityEvaluationReport, action = "save") {
    this.evaluations.set(evaluation.evaluationId, clone(evaluation));
    this.latestEvaluationId = evaluation.evaluationId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      evaluationId: evaluation.evaluationId,
      action,
      details: `overall=${evaluation.overallOpportunityScore} recommendation=${evaluation.recommendation}`,
    });
    return clone(evaluation);
  }

  markSubmitted(evaluationId: string, executiveReportId: string) {
    const current = this.evaluations.get(evaluationId);
    if (!current) return null;
    const updated: OpportunityEvaluationReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: OpportunityEvaluationReport): OpportunityEvaluationReport {
  const cloneScore = (s: OpportunityEvaluationReport["scoreExplanations"]["demand"]) => ({
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
