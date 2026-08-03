import type { ProductEvaluationReport } from "./types.js";

/** Authoritative in-memory Product Evaluation store — evaluation only. */
export class EvaluationStore {
  private evaluations = new Map<string, ProductEvaluationReport>();
  private latestEvaluationId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    evaluationId: string;
    action: string;
    details: string;
  }> = [];

  seed(evaluations: ProductEvaluationReport[]) {
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
        details: `seeded evaluation product=${evaluation.productName}`,
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

  save(evaluation: ProductEvaluationReport, action = "save") {
    this.evaluations.set(evaluation.evaluationId, clone(evaluation));
    this.latestEvaluationId = evaluation.evaluationId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      evaluationId: evaluation.evaluationId,
      action,
      details: `product=${evaluation.productName} overall=${evaluation.overallScore} recommendation=${evaluation.recommendation}`,
    });
    return clone(evaluation);
  }

  saveMany(evaluations: ProductEvaluationReport[], action = "save") {
    return evaluations.map((e) => this.save(e, action));
  }

  markSubmitted(evaluationId: string, executiveReportId: string) {
    const current = this.evaluations.get(evaluationId);
    if (!current) return null;
    const updated: ProductEvaluationReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_findings");
  }
}

function clone(evaluation: ProductEvaluationReport): ProductEvaluationReport {
  return {
    ...evaluation,
    facts: [...evaluation.facts],
    assumptions: [...evaluation.assumptions],
    supportingEvidence: evaluation.supportingEvidence.map((e) => ({ ...e })),
    scoreNotes: { ...evaluation.scoreNotes },
  };
}
