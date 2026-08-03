import type { WorkerMonitoringConfiguration } from "./configuration.js";
import {
  MONITORING_VERSION,
  WMO_METADATA_VERSION,
} from "./paths.js";
import type {
  DriftStatus,
  MonitoredWorker,
  MonitoringAlert,
  MonitoringDecision,
  MonitoringEvent,
  MonitoringRecord,
  WorkerHealthState,
  WorkerMonitoringCatalog,
  WorkerMonitoringInput,
} from "./types.js";

export type ObservationAssessment = {
  healthStatus: WorkerHealthState;
  driftStatus: DriftStatus;
  runtimeHealth: WorkerHealthState;
  events: MonitoringEvent[];
  alerts: MonitoringAlert[];
  performanceScore: number;
};

export type MonitoringEvaluation = {
  catalog: WorkerMonitoringCatalog;
  records: MonitoringRecord[];
  anomalies: MonitoringRecord[];
  alerts: MonitoringAlert[];
  monitoringDecision: MonitoringDecision;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
};

/** Pure Worker Monitoring helpers for Q1-10 — observe and report only. */
export class MonitoringBuilder {
  buildCatalog(
    config: WorkerMonitoringConfiguration,
    workers: MonitoredWorker[],
    records: MonitoringRecord[],
  ): WorkerMonitoringCatalog {
    return {
      monitoringVersion: MONITORING_VERSION,
      healthStates: [...config.healthStates],
      monitoringEvents: [...config.monitoringEvents],
      workers: workers.map(cloneWorker),
      records: records.map(cloneRecord),
      metadataVersion: WMO_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverExecuteWorkerTasks: true,
      neverRestartWorkersAutomatically: true,
      neverReplaceWorkforceCertificationMonitor: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      supportsExecutiveReportingRuntime: true,
    };
  }

  applyObservation(
    existing: MonitoredWorker | null,
    input: WorkerMonitoringInput,
  ): MonitoredWorker {
    const workerId = input.workerId?.trim() || existing?.workerId || `wkr-mon-${Date.now()}`;
    const base: MonitoredWorker = existing ?? {
      workerId,
      workerName: input.workerName?.trim() || workerId,
      department: input.department?.trim() || "unassigned",
      currentMission: null,
      available: true,
      active: true,
      progress: 0,
      currentWorkload: 0,
      errorCount: 0,
      repeatedErrorCount: 0,
      executionTimeMs: 0,
      expectedExecutionTimeMs: 180000,
      resourceUsage: 0,
      qualityScore: 0.8,
      performanceScore: 0.8,
      lastHeartbeatAt: new Date().toISOString(),
      stallThresholdMs: 300000,
      neverExecuteWorkerTasks: true,
    };
    return {
      ...base,
      workerId,
      workerName: input.workerName?.trim() || base.workerName,
      department: input.department?.trim() || base.department,
      currentMission:
        input.currentMission === undefined
          ? base.currentMission
          : input.currentMission,
      available: input.available ?? base.available,
      active: input.active ?? base.active,
      progress: clamp(input.progress ?? base.progress, 0, 1),
      currentWorkload: clamp(input.currentWorkload ?? base.currentWorkload, 0, 1),
      errorCount: Math.max(0, Math.floor(input.errorCount ?? base.errorCount)),
      repeatedErrorCount: Math.max(
        0,
        Math.floor(input.repeatedErrorCount ?? base.repeatedErrorCount),
      ),
      executionTimeMs: Math.max(0, Math.floor(input.executionTimeMs ?? base.executionTimeMs)),
      expectedExecutionTimeMs: Math.max(
        1,
        Math.floor(input.expectedExecutionTimeMs ?? base.expectedExecutionTimeMs),
      ),
      resourceUsage: clamp(input.resourceUsage ?? base.resourceUsage, 0, 1),
      qualityScore: clamp(input.qualityScore ?? base.qualityScore, 0, 1),
      performanceScore: clamp(input.performanceScore ?? base.performanceScore, 0, 1),
      lastHeartbeatAt: input.lastHeartbeatAt?.trim() || new Date().toISOString(),
      stallThresholdMs: base.stallThresholdMs,
      neverExecuteWorkerTasks: true,
    };
  }

  assess(
    worker: MonitoredWorker,
    config: WorkerMonitoringConfiguration,
    nowMs = Date.now(),
  ): ObservationAssessment {
    const events: MonitoringEvent[] = [];
    const alerts: MonitoringAlert[] = [];
    const parsedHeartbeat = Date.parse(worker.lastHeartbeatAt || "");
    const heartbeatAge = Number.isFinite(parsedHeartbeat)
      ? Math.max(0, nowMs - parsedHeartbeat)
      : Number.POSITIVE_INFINITY;
    const driftRatio =
      worker.expectedExecutionTimeMs > 0
        ? worker.executionTimeMs / worker.expectedExecutionTimeMs
        : 1;

    let driftStatus: DriftStatus = "none";
    if (driftRatio >= config.driftRatioThreshold * 1.5) driftStatus = "severe";
    else if (driftRatio >= config.driftRatioThreshold) driftStatus = "major";
    else if (driftRatio >= 1.25) driftStatus = "minor";

    const stalled =
      worker.active &&
      worker.progress < 0.95 &&
      (heartbeatAge >= (worker.stallThresholdMs || config.stallThresholdMs) ||
        driftRatio >= config.driftRatioThreshold);
    const overloaded = worker.currentWorkload >= config.overloadWorkloadThreshold;
    const offline =
      !worker.available ||
      heartbeatAge >= config.offlineHeartbeatMs ||
      (!worker.active && !worker.available);
    const degraded = worker.performanceScore < config.performanceDegradeThreshold;
    const repeatedErrors = worker.repeatedErrorCount >= 2 || worker.errorCount >= 3;

    let healthStatus: WorkerHealthState = "healthy";
    if (offline) {
      healthStatus = "offline";
      events.push("worker_offline");
    } else if (stalled && repeatedErrors) {
      healthStatus = "critical";
      events.push("worker_stalled", "worker_failed");
    } else if (stalled) {
      healthStatus = "critical";
      events.push("worker_stalled");
    } else if (overloaded || degraded || driftStatus === "major" || driftStatus === "severe") {
      healthStatus = "warning";
      if (overloaded) events.push("worker_overloaded");
      if (degraded || driftStatus !== "none") events.push("performance_degraded");
    } else if (worker.active && worker.progress >= 1) {
      healthStatus = "healthy";
      events.push("worker_completed");
    } else if (worker.active) {
      healthStatus = "healthy";
      events.push("worker_started");
    } else if (worker.errorCount > 0 && !worker.active) {
      healthStatus = "recovering";
      events.push("worker_recovered");
    }

    if (worker.active === false && worker.available === false && !offline) {
      events.push("worker_suspended");
    }

    const runtimeHealth = healthStatus;
    const performanceScore = Number(
      clamp(
        worker.performanceScore * 0.5 +
          worker.qualityScore * 0.3 +
          (1 - worker.currentWorkload) * 0.1 +
          (driftStatus === "none" ? 0.1 : 0),
        0,
        1,
      ).toFixed(4),
    );

    for (const event of unique(events)) {
      const severity =
        event === "worker_offline" ||
        event === "worker_stalled" ||
        event === "worker_failed"
          ? "critical"
          : event === "worker_overloaded" ||
              event === "performance_degraded" ||
              event === "worker_suspended"
            ? "warning"
            : "info";
      if (severity === "info" && event === "worker_started") continue;
      if (severity === "info" && event === "worker_completed") continue;
      if (severity === "info" && event === "worker_recovered") continue;
      alerts.push({
        alertId: `wmo-alert-${worker.workerId}-${event}-${monitoringSequence + 1}`,
        severity,
        event,
        message: `${worker.workerId}: ${event}`,
        reportedToPillow: true,
        timestamp: new Date(nowMs).toISOString(),
      });
    }

    return {
      healthStatus,
      driftStatus,
      runtimeHealth,
      events: unique(events),
      alerts,
      performanceScore,
    };
  }

  buildRecord(params: {
    input: WorkerMonitoringInput;
    worker: MonitoredWorker;
    assessment: ObservationAssessment;
  }): MonitoringRecord {
    monitoringSequence += 1;
    return {
      monitoringId:
        params.input.monitoringId?.trim() ||
        `wmo-${Date.now()}-${monitoringSequence}`,
      timestamp: new Date().toISOString(),
      workerId: params.worker.workerId,
      workerName: params.worker.workerName,
      department: params.worker.department,
      currentMission: params.worker.currentMission,
      healthStatus: params.assessment.healthStatus,
      availability: params.worker.available,
      progress: params.worker.progress,
      currentWorkload: params.worker.currentWorkload,
      errorCount: params.worker.errorCount,
      driftStatus: params.assessment.driftStatus,
      runtimeHealth: params.assessment.runtimeHealth,
      performanceScore: params.assessment.performanceScore,
      alerts: params.assessment.alerts.map((a) => ({ ...a, reportedToPillow: true as const })),
      metadataVersion: WMO_METADATA_VERSION,
      events: [...params.assessment.events],
      neverExecuteWorkerTasks: true,
      neverRestartWorkersAutomatically: true,
      neverReplaceWorkforceCertificationMonitor: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveMonitoringHistory: true,
      supportsExecutiveReportingRuntime: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  evaluate(
    input: WorkerMonitoringInput,
    config: WorkerMonitoringConfiguration,
    workers: MonitoredWorker[],
    records: MonitoringRecord[],
    scanned: MonitoringRecord[],
  ): MonitoringEvaluation {
    const catalog = this.buildCatalog(config, workers, records);
    const alerts = scanned.flatMap((r) => r.alerts);
    const anomalies = scanned.filter((r) =>
      ["warning", "critical", "offline", "recovering"].includes(String(r.healthStatus)),
    );
    const rules = unique(input.rules ?? config.monitoringRules);
    const violated = new Set(unique(input.violatedRules ?? []));
    const satisfied: string[] = [];
    const failed: string[] = [];
    for (const rule of rules) {
      const ok = this.ruleSatisfied(rule, input, catalog, scanned, alerts, violated);
      if (ok) satisfied.push(rule);
      else failed.push(rule);
    }
    let monitoringDecision: MonitoringDecision = "valid";
    if (failed.length === 0) monitoringDecision = "valid";
    else if (failed.length <= Math.ceil(rules.length / 3)) monitoringDecision = "partially_valid";
    else monitoringDecision = "invalid";

    return {
      catalog,
      records: scanned,
      anomalies,
      alerts,
      monitoringDecision,
      rulesApplied: rules,
      rulesSatisfied: satisfied,
      rulesFailed: failed,
    };
  }

  private ruleSatisfied(
    rule: string,
    input: WorkerMonitoringInput,
    catalog: WorkerMonitoringCatalog,
    scanned: MonitoringRecord[],
    alerts: MonitoringAlert[],
    violated: Set<string>,
  ): boolean {
    if (violated.has(rule)) return false;
    switch (rule) {
      case "continuously_monitor_active_workers":
        return catalog.workers.filter((w) => w.active).every((w) =>
          scanned.some((r) => r.workerId === w.workerId),
        ) || scanned.length > 0 || catalog.workers.filter((w) => w.active).length === 0;
      case "detect_abnormal_behaviour":
        return true;
      case "detect_execution_drift":
        return scanned.every((r) => typeof r.driftStatus === "string");
      case "detect_performance_degradation":
        return scanned.every((r) => typeof r.performanceScore === "number");
      case "report_critical_events_to_pillow":
        return alerts
          .filter((a) => a.severity === "critical")
          .every((a) => a.reportedToPillow === true);
      case "preserve_monitoring_history":
        return scanned.every((r) => r.preserveMonitoringHistory === true);
      case "support_executive_reporting_runtime_integration":
        return catalog.supportsExecutiveReportingRuntime === true;
      default:
        return input.overridePillow !== true;
    }
  }
}

let monitoringSequence = 0;

export function resetMonitoringSequenceForTesting() {
  monitoringSequence = 0;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function unique<T extends string>(values: T[]) {
  return Array.from(new Set(values));
}

function cloneWorker(worker: MonitoredWorker): MonitoredWorker {
  return { ...worker, neverExecuteWorkerTasks: true };
}

function cloneRecord(record: MonitoringRecord): MonitoringRecord {
  return {
    ...record,
    alerts: record.alerts.map((a) => ({ ...a, reportedToPillow: true as const })),
    events: [...record.events],
  };
}
