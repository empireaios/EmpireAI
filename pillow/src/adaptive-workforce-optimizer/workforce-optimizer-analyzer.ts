import type { AdaptiveWorkforceOptimizerConfiguration } from "./configuration.js";
import type {
  AdaptiveWorkforceOptimizerInput,
  RecommendedChange,
  WorkerPerformanceSnapshot,
} from "./types.js";
import { summarizePerformance } from "./workforce-optimizer-store.js";

export type AnalysisBundle = {
  workers: WorkerPerformanceSnapshot[];
  performance: ReturnType<typeof summarizePerformance>;
  bottlenecks: string[];
  opportunities: string[];
  overloadedWorkers: string[];
  underutilizedWorkers: string[];
  idleWorkers: string[];
  recommendedChanges: RecommendedChange[];
  expectedBenefits: string[];
  evidence: string[];
  confidenceScore: number;
  targetsAddressed: string[];
};

/** Pure analysis helpers for Q0-17 Adaptive Workforce Optimizer. */
export class WorkforceOptimizerAnalyzer {
  analyseUtilization(
    workers: WorkerPerformanceSnapshot[],
    config: AdaptiveWorkforceOptimizerConfiguration,
  ): AnalysisBundle {
    const overloaded = this.detectOverloaded(workers, config);
    const underutilized = this.detectUnderutilized(workers, config);
    const idle = this.detectIdle(workers, config);
    const performance = summarizePerformance(workers);
    const bottlenecks = [
      ...overloaded.map((id) => `utilization_overload:${id}`),
      ...(performance.averageUtilizationPct > config.overloadedThreshold
        ? ["workforce_average_utilization_high"]
        : []),
      ...(performance.averageUtilizationPct < config.underutilizedThreshold
        ? ["workforce_average_utilization_low"]
        : []),
    ];
    const opportunities = [
      ...underutilized.map((id) => `rebalance_to_underutilized:${id}`),
      ...idle.map((id) => `activate_idle_worker:${id}`),
      ...overloaded.map((id) => `shed_load_from_overloaded:${id}`),
    ];
    const evidence = [
      `avg_utilization=${performance.averageUtilizationPct}`,
      `overloaded_count=${overloaded.length}`,
      `underutilized_count=${underutilized.length}`,
      `idle_count=${idle.length}`,
    ];
    return {
      workers,
      performance,
      bottlenecks,
      opportunities,
      overloadedWorkers: overloaded,
      underutilizedWorkers: underutilized,
      idleWorkers: idle,
      recommendedChanges: [],
      expectedBenefits: [
        "Improved worker utilization balance",
        "Reduced idle capacity waste",
        "Lower overload risk on hot workers",
      ],
      evidence,
      confidenceScore: confidenceFromCoverage(workers.length, bottlenecks.length + opportunities.length),
      targetsAddressed: ["worker_utilization", "worker_assignment", "queue_efficiency"],
    };
  }

  analysePerformance(workers: WorkerPerformanceSnapshot[]): AnalysisBundle {
    const performance = summarizePerformance(workers);
    const bottlenecks: string[] = [];
    const opportunities: string[] = [];
    for (const worker of workers) {
      if (worker.accuracy < 75) {
        bottlenecks.push(`accuracy_gap:${worker.workerId}`);
        opportunities.push(`raise_accuracy:${worker.workerId}`);
      }
      if (worker.reliability < 75) {
        bottlenecks.push(`reliability_gap:${worker.workerId}`);
        opportunities.push(`raise_reliability:${worker.workerId}`);
      }
      if (worker.throughput < performance.averageThroughput * 0.6) {
        bottlenecks.push(`throughput_lag:${worker.workerId}`);
        opportunities.push(`raise_throughput:${worker.workerId}`);
      }
    }
    return {
      workers,
      performance,
      bottlenecks,
      opportunities,
      overloadedWorkers: [],
      underutilizedWorkers: [],
      idleWorkers: [],
      recommendedChanges: [],
      expectedBenefits: [
        "Higher execution quality",
        "More consistent worker performance",
        "Improved throughput reliability",
      ],
      evidence: [
        `avg_accuracy=${performance.averageAccuracy}`,
        `avg_reliability=${performance.averageReliability}`,
        `avg_throughput=${performance.averageThroughput}`,
      ],
      confidenceScore: confidenceFromCoverage(workers.length, bottlenecks.length),
      targetsAddressed: ["worker_performance", "accuracy", "reliability", "throughput"],
    };
  }

  analyseRouting(workers: WorkerPerformanceSnapshot[]): AnalysisBundle {
    const performance = summarizePerformance(workers);
    const bottlenecks: string[] = [];
    const opportunities: string[] = [];
    for (const worker of workers) {
      if (worker.routingEfficiency < 70) {
        bottlenecks.push(`routing_inefficiency:${worker.workerId}`);
        opportunities.push(`reroute_away_from_low_efficiency:${worker.workerId}`);
      }
      if (worker.queueDepth >= 8) {
        bottlenecks.push(`queue_congestion:${worker.workerId}`);
        opportunities.push(`redistribute_queue:${worker.workerId}`);
      }
    }
    if (performance.averageRoutingEfficiency < 70) {
      bottlenecks.push("routing_average_below_target");
    }
    return {
      workers,
      performance,
      bottlenecks,
      opportunities,
      overloadedWorkers: [],
      underutilizedWorkers: [],
      idleWorkers: [],
      recommendedChanges: [],
      expectedBenefits: [
        "Faster routing decisions",
        "Lower queue congestion",
        "Better assignment fit",
      ],
      evidence: [
        `avg_routing_efficiency=${performance.averageRoutingEfficiency}`,
        `total_queue_depth=${performance.totalQueueDepth}`,
      ],
      confidenceScore: confidenceFromCoverage(workers.length, bottlenecks.length),
      targetsAddressed: ["routing", "queue_efficiency", "worker_assignment"],
    };
  }

  analyseCollaboration(workers: WorkerPerformanceSnapshot[]): AnalysisBundle {
    const performance = summarizePerformance(workers);
    const bottlenecks: string[] = [];
    const opportunities: string[] = [];
    for (const worker of workers) {
      if (worker.collaborationScore < 65) {
        bottlenecks.push(`collaboration_weakness:${worker.workerId}`);
        opportunities.push(`pair_for_collaboration_lift:${worker.workerId}`);
      }
    }
    if (performance.averageCollaborationScore < 65) {
      bottlenecks.push("collaboration_average_below_target");
    }
    return {
      workers,
      performance,
      bottlenecks,
      opportunities,
      overloadedWorkers: [],
      underutilizedWorkers: [],
      idleWorkers: [],
      recommendedChanges: [],
      expectedBenefits: [
        "Stronger multi-worker collaboration",
        "Fewer handoff failures",
        "Higher collective execution quality",
      ],
      evidence: [`avg_collaboration=${performance.averageCollaborationScore}`],
      confidenceScore: confidenceFromCoverage(workers.length, bottlenecks.length),
      targetsAddressed: ["collaboration", "worker_performance"],
    };
  }

  detectOverloaded(
    workers: WorkerPerformanceSnapshot[],
    config: AdaptiveWorkforceOptimizerConfiguration,
  ): string[] {
    const threshold = config.overloadedThreshold;
    return workers
      .filter(
        (w) =>
          w.utilizationPct >= threshold ||
          w.assignmentLoad >= threshold ||
          w.queueDepth >= 10,
      )
      .map((w) => w.workerId);
  }

  detectUnderutilized(
    workers: WorkerPerformanceSnapshot[],
    config: AdaptiveWorkforceOptimizerConfiguration,
  ): string[] {
    const threshold = config.underutilizedThreshold;
    return workers
      .filter((w) => w.utilizationPct <= threshold && w.utilizationPct > config.idleThreshold)
      .map((w) => w.workerId);
  }

  detectIdle(
    workers: WorkerPerformanceSnapshot[],
    config: AdaptiveWorkforceOptimizerConfiguration,
  ): string[] {
    return workers.filter((w) => w.utilizationPct <= config.idleThreshold).map((w) => w.workerId);
  }

  detectBottlenecks(
    workers: WorkerPerformanceSnapshot[],
    config: AdaptiveWorkforceOptimizerConfiguration,
  ): AnalysisBundle {
    const utilization = this.analyseUtilization(workers, config);
    const routing = this.analyseRouting(workers);
    const performance = this.analysePerformance(workers);
    const collaboration = this.analyseCollaboration(workers);
    const bottlenecks = unique([
      ...utilization.bottlenecks,
      ...routing.bottlenecks,
      ...performance.bottlenecks,
      ...collaboration.bottlenecks,
    ]);
    return {
      workers,
      performance: utilization.performance,
      bottlenecks,
      opportunities: unique([
        ...utilization.opportunities,
        ...routing.opportunities,
        ...performance.opportunities,
        ...collaboration.opportunities,
      ]),
      overloadedWorkers: utilization.overloadedWorkers,
      underutilizedWorkers: utilization.underutilizedWorkers,
      idleWorkers: utilization.idleWorkers,
      recommendedChanges: [],
      expectedBenefits: [
        "Clear bottleneck map for workforce optimization",
        "Prioritized remediation opportunities",
      ],
      evidence: unique([
        ...utilization.evidence,
        ...routing.evidence,
        ...performance.evidence,
        ...collaboration.evidence,
        `bottleneck_count=${bottlenecks.length}`,
      ]),
      confidenceScore: confidenceFromCoverage(workers.length, bottlenecks.length),
      targetsAddressed: unique([
        ...utilization.targetsAddressed,
        ...routing.targetsAddressed,
        ...performance.targetsAddressed,
        ...collaboration.targetsAddressed,
      ]),
    };
  }

  recommend(
    workers: WorkerPerformanceSnapshot[],
    config: AdaptiveWorkforceOptimizerConfiguration,
    input: AdaptiveWorkforceOptimizerInput,
  ): AnalysisBundle {
    const base = this.detectBottlenecks(workers, config);
    const focus = (input.recommendationFocus ?? "all").toString().toLowerCase();
    const changes: RecommendedChange[] = [];
    let changeSeq = 0;

    const push = (
      target: string,
      summary: string,
      priority: RecommendedChange["priority"],
      affectedWorkers: string[],
    ) => {
      changeSeq += 1;
      changes.push({
        changeId: `awo-chg-${changeSeq}`,
        target,
        summary,
        priority,
        affectedWorkers: [...affectedWorkers],
      });
    };

    if (focus === "all" || focus === "workforce") {
      for (const id of base.overloadedWorkers) {
        push(
          "worker_assignment",
          `Reassign excess load away from overloaded worker ${id}`,
          "high",
          [id, ...base.underutilizedWorkers.slice(0, 2)],
        );
      }
      for (const id of base.idleWorkers) {
        push(
          "worker_utilization",
          `Activate idle worker ${id} with queued eligible work`,
          "medium",
          [id],
        );
      }
      for (const id of base.underutilizedWorkers) {
        push(
          "worker_utilization",
          `Increase assignment share for underutilized worker ${id}`,
          "medium",
          [id],
        );
      }
    }

    if (focus === "all" || focus === "routing") {
      for (const worker of workers.filter((w) => w.routingEfficiency < 70 || w.queueDepth >= 8)) {
        push(
          "routing",
          `Improve routing rules for ${worker.workerId} to reduce congestion and inefficiency`,
          worker.queueDepth >= 10 ? "critical" : "high",
          [worker.workerId],
        );
      }
      if (base.performance.averageRoutingEfficiency < 70) {
        push(
          "queue_efficiency",
          "Tune global routing weights to raise average routing efficiency above 70",
          "high",
          workers.map((w) => w.workerId),
        );
      }
    }

    if (focus === "all" || focus === "collaboration") {
      for (const worker of workers.filter((w) => w.collaborationScore < 65)) {
        push(
          "collaboration",
          `Pair ${worker.workerId} with high-collaboration peers on shared missions`,
          "medium",
          [worker.workerId],
        );
      }
    }

    if (focus === "all" || focus === "capability") {
      for (const worker of workers.filter((w) => w.accuracy < 75 || w.reliability < 75)) {
        push(
          "worker_performance",
          `Recommend capability uplift for ${worker.workerId} (accuracy/reliability gaps)`,
          "high",
          [worker.workerId],
        );
      }
      if (base.performance.averageAccuracy < 80) {
        push(
          "accuracy",
          "Recommend department-wide capability refresh to raise average accuracy",
          "high",
          workers.map((w) => w.workerId),
        );
      }
      if (base.performance.totalOperationalCost > workers.length * 120) {
        push(
          "operational_cost",
          "Recommend cost-aware assignment to reduce elevated operational spend",
          "medium",
          workers.map((w) => w.workerId),
        );
      }
    }

    const expectedBenefits = unique([
      ...base.expectedBenefits,
      ...changes.map((c) => `Expected from ${c.target}: ${c.summary}`),
    ]);

    return {
      ...base,
      recommendedChanges: changes,
      opportunities: unique([...base.opportunities, ...changes.map((c) => c.changeId)]),
      expectedBenefits,
      evidence: unique([
        ...base.evidence,
        `recommendation_focus=${focus}`,
        `recommendation_count=${changes.length}`,
      ]),
      confidenceScore: confidenceFromCoverage(workers.length, changes.length + base.bottlenecks.length),
      targetsAddressed: unique([
        ...base.targetsAddressed,
        ...changes.map((c) => c.target),
      ]),
    };
  }
}

function confidenceFromCoverage(workerCount: number, signalCount: number) {
  if (workerCount === 0) return 40;
  const base = 55 + Math.min(30, workerCount * 5);
  const signalBoost = Math.min(15, signalCount * 2);
  return Math.min(97, base + signalBoost);
}

function unique(values: string[]) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}
