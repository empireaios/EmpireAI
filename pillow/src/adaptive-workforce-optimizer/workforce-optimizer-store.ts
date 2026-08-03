import { AWO_METADATA_VERSION } from "./paths.js";
import type {
  AdaptiveWorkforceOptimizerInput,
  CurrentPerformance,
  OptimizationRecord,
  RecommendedChange,
  ValidationStatus,
  WorkerPerformanceSnapshot,
} from "./types.js";

/** Authoritative in-memory Adaptive Workforce Optimizer store — analyse/recommend only. */
export class WorkforceOptimizerStore {
  private records = new Map<string, OptimizationRecord>();

  seed(records: OptimizationRecord[]) {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.optimizationId, clone(record));
    }
  }

  count() {
    return this.records.size;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(optimizationId: string) {
    const record = this.records.get(optimizationId);
    return record ? clone(record) : null;
  }

  save(record: OptimizationRecord) {
    this.records.set(record.optimizationId, clone(record));
    return clone(record);
  }

  buildRecord(params: {
    input: AdaptiveWorkforceOptimizerInput;
    scope: string;
    workers: WorkerPerformanceSnapshot[];
    performance: CurrentPerformance;
    bottlenecks: string[];
    opportunities: string[];
    recommendedChanges: RecommendedChange[];
    expectedBenefits: string[];
    evidence: string[];
    confidenceScore: number;
    overloadedWorkers: string[];
    underutilizedWorkers: string[];
    idleWorkers: string[];
    targetsAddressed: string[];
    validationStatus: ValidationStatus;
  }): OptimizationRecord {
    optimizationSequence += 1;
    const optimizationId =
      params.input.optimizationId?.trim() ||
      `awo-opt-${Date.now()}-${optimizationSequence}`;
    const department =
      params.input.department?.trim() ||
      dominantDepartment(params.workers) ||
      "department-unspecified";
    const record: OptimizationRecord = {
      optimizationId,
      timestamp: new Date().toISOString(),
      scope: params.scope,
      workers: unique(params.workers.map((w) => w.workerId)),
      department,
      currentPerformance: { ...params.performance },
      bottlenecks: unique(params.bottlenecks),
      improvementOpportunities: unique(params.opportunities),
      recommendedChanges: params.recommendedChanges.map((c) => ({
        ...c,
        affectedWorkers: [...c.affectedWorkers],
      })),
      expectedBenefits: unique(params.expectedBenefits),
      confidenceScore: clampConfidence(params.confidenceScore),
      supportingEvidence: unique(params.evidence),
      metadataVersion: AWO_METADATA_VERSION,
      optimizationTraceId: `awo-trace-${Date.now()}-${optimizationSequence}`,
      validationStatus: params.validationStatus,
      overloadedWorkers: unique(params.overloadedWorkers),
      underutilizedWorkers: unique(params.underutilizedWorkers),
      idleWorkers: unique(params.idleWorkers),
      optimizationTargetsAddressed: unique(params.targetsAddressed),
      neverExecuteWorkerTasks: true,
      neverModifyWorkersAutomatically: true,
      neverReplacePillow: true,
      neverOverrideGrandKing: true,
      neverPerformStrategicPlanning: true,
      workerTasksExecuted: false,
      workersModifiedAutomatically: false,
      pillowReplaced: false,
      grandKingOverridden: false,
      strategicPlanningPerformed: false,
      preserveOptimizationTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let optimizationSequence = 0;

export function resetOptimizationSequenceForTesting() {
  optimizationSequence = 0;
}

export function normalizeWorkers(
  workers: WorkerPerformanceSnapshot[] | undefined,
): WorkerPerformanceSnapshot[] {
  if (!workers?.length) return [];
  return workers.map((worker, index) => ({
    workerId: worker.workerId?.trim() || `worker-${index + 1}`,
    department: worker.department?.trim() || "operations",
    utilizationPct: clampMetric(worker.utilizationPct, 0, 100, 50),
    queueDepth: clampMetric(worker.queueDepth, 0, 10_000, 0),
    throughput: clampMetric(worker.throughput, 0, 10_000, 0),
    accuracy: clampMetric(worker.accuracy, 0, 100, 80),
    reliability: clampMetric(worker.reliability, 0, 100, 80),
    collaborationScore: clampMetric(worker.collaborationScore, 0, 100, 70),
    routingEfficiency: clampMetric(worker.routingEfficiency, 0, 100, 70),
    operationalCost: clampMetric(worker.operationalCost, 0, 1_000_000, 0),
    assignmentLoad: clampMetric(worker.assignmentLoad, 0, 100, worker.utilizationPct ?? 50),
  }));
}

export function summarizePerformance(workers: WorkerPerformanceSnapshot[]): CurrentPerformance {
  if (!workers.length) {
    return {
      averageUtilizationPct: 0,
      averageThroughput: 0,
      averageAccuracy: 0,
      averageReliability: 0,
      averageCollaborationScore: 0,
      averageRoutingEfficiency: 0,
      totalQueueDepth: 0,
      totalOperationalCost: 0,
      workerCount: 0,
    };
  }
  const n = workers.length;
  return {
    averageUtilizationPct: avg(workers.map((w) => w.utilizationPct)),
    averageThroughput: avg(workers.map((w) => w.throughput)),
    averageAccuracy: avg(workers.map((w) => w.accuracy)),
    averageReliability: avg(workers.map((w) => w.reliability)),
    averageCollaborationScore: avg(workers.map((w) => w.collaborationScore)),
    averageRoutingEfficiency: avg(workers.map((w) => w.routingEfficiency)),
    totalQueueDepth: workers.reduce((sum, w) => sum + w.queueDepth, 0),
    totalOperationalCost: workers.reduce((sum, w) => sum + w.operationalCost, 0),
    workerCount: n,
  };
}

function clone(record: OptimizationRecord): OptimizationRecord {
  return {
    ...record,
    workers: [...record.workers],
    bottlenecks: [...record.bottlenecks],
    improvementOpportunities: [...record.improvementOpportunities],
    recommendedChanges: record.recommendedChanges.map((c) => ({
      ...c,
      affectedWorkers: [...c.affectedWorkers],
    })),
    expectedBenefits: [...record.expectedBenefits],
    supportingEvidence: [...record.supportingEvidence],
    overloadedWorkers: [...record.overloadedWorkers],
    underutilizedWorkers: [...record.underutilizedWorkers],
    idleWorkers: [...record.idleWorkers],
    optimizationTargetsAddressed: [...record.optimizationTargetsAddressed],
    currentPerformance: { ...record.currentPerformance },
  };
}

function unique(values: string[]) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) return 70;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampMetric(value: number | undefined, min: number, max: number, fallback: number) {
  if (value == null || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function dominantDepartment(workers: WorkerPerformanceSnapshot[]) {
  const counts = new Map<string, number>();
  for (const worker of workers) {
    counts.set(worker.department, (counts.get(worker.department) ?? 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [department, count] of counts) {
    if (count > bestCount) {
      best = department;
      bestCount = count;
    }
  }
  return best;
}
