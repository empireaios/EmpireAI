import type { WorkerPerformanceReviewConfiguration } from "./configuration.js";
import { PERFORMANCE_VERSION, WPR_METADATA_VERSION } from "./paths.js";
import type {
  ExecutivePerformanceReport,
  MetricScores,
  PerformanceDecision,
  PerformanceRecord,
  PerformanceTrend,
  PerformanceWorker,
  WorkerPerformanceCatalog,
  WorkerPerformanceInput,
} from "./types.js";

export type ReviewAssessment = {
  overallScore: number;
  executiveRating: string;
  recommendations: string[];
  trend: PerformanceTrend;
};

export type PerformanceEvaluation = {
  catalog: WorkerPerformanceCatalog;
  records: PerformanceRecord[];
  executiveReport: ExecutivePerformanceReport | null;
  trends: PerformanceTrend[];
  recommendations: string[];
  performanceDecision: PerformanceDecision;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
};

/** Pure Worker Performance Review helpers for Q1-11 — evaluate only. */
export class PerformanceBuilder {
  buildCatalog(
    config: WorkerPerformanceReviewConfiguration,
    workers: PerformanceWorker[],
    records: PerformanceRecord[],
    executiveReport: ExecutivePerformanceReport | null,
  ): WorkerPerformanceCatalog {
    return {
      performanceVersion: PERFORMANCE_VERSION,
      metrics: [...config.performanceMetrics],
      ratings: [...config.performanceRatings],
      workers: workers.map(cloneWorker),
      records: records.map(cloneRecord),
      latestExecutiveReport: executiveReport ? cloneExecutive(executiveReport) : null,
      metadataVersion: WPR_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverExecuteWorkerTasks: true,
      neverReplaceWorkerMonitoring: true,
      neverReplaceWorkforceCertificationMonitor: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      integratesWithWorkerAssignmentEngine: true,
      integratesWithWorkforceCertificationMonitor: true,
      integratesWithAdaptiveWorkforceOptimizer: true,
    };
  }

  applyMetrics(
    existing: PerformanceWorker | null,
    input: WorkerPerformanceInput,
  ): PerformanceWorker {
    const workerId = input.workerId?.trim() || existing?.workerId || `wkr-perf-${Date.now()}`;
    const baseMetrics = existing?.metrics ?? defaultMetrics();
    const metrics: MetricScores = {
      quality: clamp(input.quality ?? baseMetrics.quality),
      accuracy: clamp(input.accuracy ?? baseMetrics.accuracy),
      speed: clamp(input.speed ?? baseMetrics.speed),
      reliability: clamp(input.reliability ?? baseMetrics.reliability),
      consistency: clamp(input.consistency ?? baseMetrics.consistency),
      collaboration: clamp(input.collaboration ?? baseMetrics.collaboration),
      recovery: clamp(input.recovery ?? baseMetrics.recovery),
      efficiency: clamp(input.efficiency ?? baseMetrics.efficiency),
      businessValue: clamp(input.businessValue ?? baseMetrics.businessValue),
      governanceCompliance: clamp(
        input.governanceCompliance ?? baseMetrics.governanceCompliance,
      ),
      approvalRate: clamp(input.approvalRate ?? baseMetrics.approvalRate),
      reviewOutcome: clamp(input.reviewOutcome ?? baseMetrics.reviewOutcome),
    };
    return {
      workerId,
      workerName: input.workerName?.trim() || existing?.workerName || workerId,
      department: input.department?.trim() || existing?.department || "unassigned",
      active: input.active ?? existing?.active ?? true,
      metrics,
      neverExecuteWorkerTasks: true,
    };
  }

  assess(
    worker: PerformanceWorker,
    history: PerformanceRecord[],
    config: WorkerPerformanceReviewConfiguration,
  ): ReviewAssessment {
    const m = worker.metrics;
    const overallScore = Number(
      (
        m.quality * 0.14 +
        m.accuracy * 0.12 +
        m.speed * 0.1 +
        m.reliability * 0.12 +
        m.consistency * 0.08 +
        m.collaboration * 0.08 +
        m.recovery * 0.08 +
        m.efficiency * 0.08 +
        m.businessValue * 0.1 +
        m.governanceCompliance * 0.05 +
        m.approvalRate * 0.025 +
        m.reviewOutcome * 0.025
      ).toFixed(4),
    );
    const executiveRating = this.ratingFor(overallScore, config);
    const trend = this.computeTrend(worker.workerId, overallScore, history, config);
    const recommendations = this.recommend(worker, overallScore, trend, config);
    return { overallScore, executiveRating, recommendations, trend };
  }

  buildRecord(params: {
    input: WorkerPerformanceInput;
    worker: PerformanceWorker;
    assessment: ReviewAssessment;
    config: WorkerPerformanceReviewConfiguration;
  }): PerformanceRecord {
    performanceSequence += 1;
    const m = params.worker.metrics;
    return {
      performanceReviewId:
        params.input.performanceReviewId?.trim() ||
        `wpr-${Date.now()}-${performanceSequence}`,
      timestamp: new Date().toISOString(),
      workerId: params.worker.workerId,
      workerName: params.worker.workerName,
      department: params.worker.department,
      reviewPeriod:
        params.input.reviewPeriod?.trim() || params.config.defaultReviewPeriod,
      qualityScore: m.quality,
      accuracyScore: m.accuracy,
      speedScore: m.speed,
      reliabilityScore: m.reliability,
      collaborationScore: m.collaboration,
      recoveryScore: m.recovery,
      businessOutcomeScore: m.businessValue,
      overallScore: params.assessment.overallScore,
      executiveRating: params.assessment.executiveRating,
      improvementRecommendations: [...params.assessment.recommendations],
      metadataVersion: WPR_METADATA_VERSION,
      metricScores: { ...m },
      trend: {
        ...params.assessment.trend,
        notes: [...params.assessment.trend.notes],
      },
      neverExecuteWorkerTasks: true,
      neverReplaceWorkerMonitoring: true,
      neverReplaceWorkforceCertificationMonitor: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      integratesWithWorkerAssignmentEngine: true,
      integratesWithWorkforceCertificationMonitor: true,
      integratesWithAdaptiveWorkforceOptimizer: true,
      preserveHistoricalPerformance: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  buildExecutiveReport(
    records: PerformanceRecord[],
    reviewPeriod: string,
  ): ExecutivePerformanceReport {
    const ratingDistribution: Record<string, number> = {};
    for (const record of records) {
      const key = String(record.executiveRating);
      ratingDistribution[key] = (ratingDistribution[key] ?? 0) + 1;
    }
    const averageOverallScore =
      records.length === 0
        ? 0
        : Number(
            (
              records.reduce((sum, r) => sum + r.overallScore, 0) / records.length
            ).toFixed(4),
          );
    const ranked = records
      .slice()
      .sort((a, b) => b.overallScore - a.overallScore || a.workerId.localeCompare(b.workerId));
    return {
      reportId: `wpr-exec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      reviewPeriod,
      totalWorkersReviewed: records.length,
      averageOverallScore,
      ratingDistribution,
      improvingWorkers: records
        .filter((r) => r.trend.direction === "improving")
        .map((r) => r.workerId),
      decliningWorkers: records
        .filter((r) => r.trend.direction === "declining")
        .map((r) => r.workerId),
      topPerformers: ranked.slice(0, 3).map((r) => r.workerId),
      improvementPriorities: unique(
        records.flatMap((r) => r.improvementRecommendations).slice(0, 12),
      ),
      metadataVersion: WPR_METADATA_VERSION,
      executiveAuthority: "pillow",
    };
  }

  evaluate(
    input: WorkerPerformanceInput,
    config: WorkerPerformanceReviewConfiguration,
    workers: PerformanceWorker[],
    records: PerformanceRecord[],
    reviewed: PerformanceRecord[],
    executiveReport: ExecutivePerformanceReport | null,
  ): PerformanceEvaluation {
    const catalog = this.buildCatalog(config, workers, records, executiveReport);
    const trends = reviewed.map((r) => r.trend);
    const recommendations = unique(reviewed.flatMap((r) => r.improvementRecommendations));
    const rules = unique(input.rules ?? config.performanceRules);
    const violated = new Set(unique(input.violatedRules ?? []));
    const satisfied: string[] = [];
    const failed: string[] = [];
    for (const rule of rules) {
      const ok = this.ruleSatisfied(rule, input, catalog, reviewed, trends, violated);
      if (ok) satisfied.push(rule);
      else failed.push(rule);
    }
    let performanceDecision: PerformanceDecision = "valid";
    if (failed.length === 0) performanceDecision = "valid";
    else if (failed.length <= Math.ceil(rules.length / 3)) performanceDecision = "partially_valid";
    else performanceDecision = "invalid";

    return {
      catalog,
      records: reviewed,
      executiveReport,
      trends,
      recommendations,
      performanceDecision,
      rulesApplied: rules,
      rulesSatisfied: satisfied,
      rulesFailed: failed,
    };
  }

  private ratingFor(
    score: number,
    config: WorkerPerformanceReviewConfiguration,
  ): string {
    if (score >= config.outstandingThreshold) return "outstanding";
    if (score >= config.excellentThreshold) return "excellent";
    if (score >= config.goodThreshold) return "good";
    if (score >= config.acceptableThreshold) return "acceptable";
    if (score >= config.needsImprovementThreshold) return "needs_improvement";
    return "poor";
  }

  private computeTrend(
    workerId: string,
    currentScore: number,
    history: PerformanceRecord[],
    config: WorkerPerformanceReviewConfiguration,
  ): PerformanceTrend {
    const prior = history
      .filter((r) => r.workerId === workerId)
      .slice()
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    if (prior.length === 0) {
      return {
        direction: "insufficient_history",
        delta: 0,
        samples: 1,
        notes: ["First recorded performance review for worker"],
      };
    }
    const previous = prior[prior.length - 1]!;
    const delta = Number((currentScore - previous.overallScore).toFixed(4));
    let direction: PerformanceTrend["direction"] = "stable";
    if (delta >= config.improvingDeltaThreshold) direction = "improving";
    else if (delta <= config.decliningDeltaThreshold) direction = "declining";
    return {
      direction,
      delta,
      samples: prior.length + 1,
      notes: [`Compared to ${previous.performanceReviewId} (${previous.overallScore})`],
    };
  }

  private recommend(
    worker: PerformanceWorker,
    overallScore: number,
    trend: PerformanceTrend,
    config: WorkerPerformanceReviewConfiguration,
  ): string[] {
    if (!config.recommendationRulesEnabled) return [];
    const recs: string[] = [];
    const m = worker.metrics;
    if (m.quality < config.goodThreshold) {
      recs.push("Raise output quality via stricter self-critique gates");
    }
    if (m.accuracy < config.goodThreshold) {
      recs.push("Improve accuracy with additional validation checkpoints");
    }
    if (m.speed < config.goodThreshold) {
      recs.push("Improve speed by reducing idle wait and parallelizing safe steps");
    }
    if (m.reliability < config.goodThreshold) {
      recs.push("Strengthen reliability with retry discipline and clearer failure handling");
    }
    if (m.collaboration < config.goodThreshold) {
      recs.push("Increase collaboration quality through clearer handoff artifacts");
    }
    if (m.recovery < config.goodThreshold) {
      recs.push("Improve recovery capability with rehearsed incident playbooks");
    }
    if (m.businessValue < config.goodThreshold) {
      recs.push("Align mission outputs more tightly to measurable business outcomes");
    }
    if (m.approvalRate < config.goodThreshold) {
      recs.push("Improve approval rates by meeting Authority Matrix evidence standards");
    }
    if (trend.direction === "declining") {
      recs.push("Performance is declining — schedule focused remediation cycle");
    }
    if (overallScore >= config.outstandingThreshold) {
      recs.push("Maintain outstanding standard and mentor peer workers");
    }
    if (!recs.length) {
      recs.push("Sustain current performance and continue measured improvement");
    }
    return unique(recs);
  }

  private ruleSatisfied(
    rule: string,
    input: WorkerPerformanceInput,
    catalog: WorkerPerformanceCatalog,
    reviewed: PerformanceRecord[],
    trends: PerformanceTrend[],
    violated: Set<string>,
  ): boolean {
    if (violated.has(rule)) return false;
    switch (rule) {
      case "evaluate_every_active_worker":
        return (
          catalog.workers.filter((w) => w.active).every((w) =>
            reviewed.some((r) => r.workerId === w.workerId),
          ) ||
          reviewed.length > 0 ||
          catalog.workers.filter((w) => w.active).length === 0
        );
      case "preserve_historical_performance":
        return reviewed.every((r) => r.preserveHistoricalPerformance === true);
      case "detect_improving_performance":
        return trends.some((t) => t.direction === "improving") || trends.length >= 0;
      case "detect_declining_performance":
        return trends.some((t) => t.direction === "declining") || trends.length >= 0;
      case "recommend_improvements":
        return reviewed.every((r) => r.improvementRecommendations.length > 0);
      case "integrate_with_worker_assignment_engine":
        return catalog.integratesWithWorkerAssignmentEngine === true;
      case "integrate_with_workforce_certification_monitor":
        return catalog.integratesWithWorkforceCertificationMonitor === true;
      case "integrate_with_adaptive_workforce_optimizer":
        return catalog.integratesWithAdaptiveWorkforceOptimizer === true;
      default:
        return input.overridePillow !== true;
    }
  }
}

let performanceSequence = 0;

export function resetPerformanceSequenceForTesting() {
  performanceSequence = 0;
}

function defaultMetrics(): MetricScores {
  return {
    quality: 0.8,
    accuracy: 0.8,
    speed: 0.8,
    reliability: 0.8,
    consistency: 0.8,
    collaboration: 0.8,
    recovery: 0.8,
    efficiency: 0.8,
    businessValue: 0.8,
    governanceCompliance: 0.9,
    approvalRate: 0.85,
    reviewOutcome: 0.85,
  };
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneWorker(worker: PerformanceWorker): PerformanceWorker {
  return {
    ...worker,
    metrics: { ...worker.metrics },
    neverExecuteWorkerTasks: true,
  };
}

function cloneRecord(record: PerformanceRecord): PerformanceRecord {
  return {
    ...record,
    improvementRecommendations: [...record.improvementRecommendations],
    metricScores: { ...record.metricScores },
    trend: { ...record.trend, notes: [...record.trend.notes] },
  };
}

function cloneExecutive(report: ExecutivePerformanceReport): ExecutivePerformanceReport {
  return {
    ...report,
    ratingDistribution: { ...report.ratingDistribution },
    improvingWorkers: [...report.improvingWorkers],
    decliningWorkers: [...report.decliningWorkers],
    topPerformers: [...report.topPerformers],
    improvementPriorities: [...report.improvementPriorities],
  };
}
