import type { AdaptiveWorkforceOptimizerConfiguration } from "./configuration.js";
import { appendAwoLog } from "./awo-logging.js";
import { WorkforceOptimizerAnalyzer, type AnalysisBundle } from "./workforce-optimizer-analyzer.js";
import {
  AdaptiveWorkforceOptimizerMetadataGenerator,
  HealthMonitor,
  RecoveryManager,
  WorkforceOptimizerValidator,
} from "./workforce-optimizer-validator.js";
import {
  normalizeWorkers,
  WorkforceOptimizerStore,
} from "./workforce-optimizer-store.js";
import {
  ADAPTIVE_WORKFORCE_OPTIMIZER_ID,
  AWO_CAPABILITIES,
  AWO_METADATA_VERSION,
} from "./paths.js";
import type {
  AdaptiveWorkforceOptimizerEngineRecord,
  AdaptiveWorkforceOptimizerInput,
  AdaptiveWorkforceOptimizerRunReport,
  OperationalState,
  OptimizationRecord,
  RecommendedChange,
} from "./types.js";

export class AdaptiveWorkforceOptimizerCore {
  private engineRecord: AdaptiveWorkforceOptimizerEngineRecord | null = null;
  private seeded = false;
  private readonly store = new WorkforceOptimizerStore();
  private readonly analyzer = new WorkforceOptimizerAnalyzer();
  private readonly validator = new WorkforceOptimizerValidator();
  private readonly metadata = new AdaptiveWorkforceOptimizerMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: AdaptiveWorkforceOptimizerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedOptimizations);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getRecords() {
    return this.store.list();
  }

  getLatestRecord() {
    const records = this.getRecords();
    return records[records.length - 1] ?? null;
  }

  connect(
    _input: Record<string, unknown>,
    config: AdaptiveWorkforceOptimizerConfiguration,
  ): AdaptiveWorkforceOptimizerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendAwoLog({
      event: "connect",
      details: "Adaptive Workforce Optimizer connected; analyse/recommend-only mode",
    });
    return this.report(
      "connect",
      [],
      [],
      [],
      [],
      [],
      {
        validationReportId: `awo-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Adaptive Workforce Optimizer is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: AWO_METADATA_VERSION,
      },
      started,
    );
  }

  analyseUtilization(
    input: AdaptiveWorkforceOptimizerInput,
    config: AdaptiveWorkforceOptimizerConfiguration,
  ) {
    return this.runAnalysis(
      "analyse_utilization",
      input,
      config,
      "workforce",
      (workers) => this.analyzer.analyseUtilization(workers, withThresholdOverrides(config, input)),
      !config.analysisRulesEnabled,
    );
  }

  analysePerformance(
    input: AdaptiveWorkforceOptimizerInput,
    config: AdaptiveWorkforceOptimizerConfiguration,
  ) {
    return this.runAnalysis(
      "analyse_performance",
      input,
      config,
      "workforce",
      (workers) => this.analyzer.analysePerformance(workers),
      !config.analysisRulesEnabled,
    );
  }

  analyseRouting(
    input: AdaptiveWorkforceOptimizerInput,
    config: AdaptiveWorkforceOptimizerConfiguration,
  ) {
    return this.runAnalysis(
      "analyse_routing",
      input,
      config,
      "routing",
      (workers) => this.analyzer.analyseRouting(workers),
      !config.analysisRulesEnabled,
    );
  }

  analyseCollaboration(
    input: AdaptiveWorkforceOptimizerInput,
    config: AdaptiveWorkforceOptimizerConfiguration,
  ) {
    return this.runAnalysis(
      "analyse_collaboration",
      input,
      config,
      "collaboration",
      (workers) => this.analyzer.analyseCollaboration(workers),
      !config.analysisRulesEnabled,
    );
  }

  detectBottlenecks(
    input: AdaptiveWorkforceOptimizerInput,
    config: AdaptiveWorkforceOptimizerConfiguration,
  ) {
    return this.runAnalysis(
      "detect_bottlenecks",
      input,
      config,
      "workforce",
      (workers) => this.analyzer.detectBottlenecks(workers, withThresholdOverrides(config, input)),
      !config.detectionRulesEnabled,
    );
  }

  detectOverloaded(
    input: AdaptiveWorkforceOptimizerInput,
    config: AdaptiveWorkforceOptimizerConfiguration,
  ) {
    return this.runAnalysis(
      "detect_overloaded",
      input,
      config,
      "worker",
      (workers) => {
        const cfg = withThresholdOverrides(config, input);
        const overloaded = this.analyzer.detectOverloaded(workers, cfg);
        const utilization = this.analyzer.analyseUtilization(workers, cfg);
        return {
          ...utilization,
          bottlenecks: overloaded.map((id) => `overloaded:${id}`),
          overloadedWorkers: overloaded,
          opportunities: overloaded.map((id) => `shed_load_from_overloaded:${id}`),
        };
      },
      !config.detectionRulesEnabled,
    );
  }

  detectUnderutilized(
    input: AdaptiveWorkforceOptimizerInput,
    config: AdaptiveWorkforceOptimizerConfiguration,
  ) {
    return this.runAnalysis(
      "detect_underutilized",
      input,
      config,
      "worker",
      (workers) => {
        const cfg = withThresholdOverrides(config, input);
        const underutilized = this.analyzer.detectUnderutilized(workers, cfg);
        const idle = this.analyzer.detectIdle(workers, cfg);
        const utilization = this.analyzer.analyseUtilization(workers, cfg);
        return {
          ...utilization,
          underutilizedWorkers: underutilized,
          idleWorkers: idle,
          bottlenecks: [
            ...underutilized.map((id) => `underutilized:${id}`),
            ...idle.map((id) => `idle:${id}`),
          ],
          opportunities: [
            ...underutilized.map((id) => `rebalance_to_underutilized:${id}`),
            ...idle.map((id) => `activate_idle_worker:${id}`),
          ],
        };
      },
      !config.detectionRulesEnabled,
    );
  }

  recommend(
    input: AdaptiveWorkforceOptimizerInput,
    config: AdaptiveWorkforceOptimizerConfiguration,
  ) {
    return this.runAnalysis(
      "recommend",
      input,
      config,
      normalizeScope(input.scope) || "workforce",
      (workers) =>
        this.analyzer.recommend(workers, withThresholdOverrides(config, input), normalize(input)),
      !config.recommendationRulesEnabled,
    );
  }

  list(config: AdaptiveWorkforceOptimizerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const records = this.store.list();
    return this.report(
      "list",
      records,
      [],
      [],
      [],
      [],
      {
        validationReportId: `awo-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Adaptive Workforce Optimizer is disabled"],
        warnings: records.length === 0 ? ["No optimization records stored yet"] : [],
        durationMs: Date.now() - started,
        metadataVersion: AWO_METADATA_VERSION,
      },
      started,
    );
  }

  validate(
    input: AdaptiveWorkforceOptimizerInput,
    config: AdaptiveWorkforceOptimizerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const records = this.store.list();
    const validation = this.validator.validateRecords(
      records.length ? records : null,
      normalize(input),
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    return this.report("validate", records.slice(-5), [], [], [], [], validation, started);
  }

  diagnostics(config: AdaptiveWorkforceOptimizerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const records = this.store.list();
    const validation = records.length
      ? this.validator.validateRecords(records, { validated: true }, started)
      : {
          validationReportId: `awo-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Adaptive Workforce Optimizer is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: AWO_METADATA_VERSION,
        };
    appendAwoLog({
      event: "health_information",
      details: `optimizationRecords=${records.length}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report(
      "diagnostics",
      records.slice(-20),
      [],
      [],
      [],
      [],
      validation,
      started,
    );
  }

  private runAnalysis(
    action: AdaptiveWorkforceOptimizerRunReport["action"],
    input: AdaptiveWorkforceOptimizerInput,
    config: AdaptiveWorkforceOptimizerConfiguration,
    defaultScope: string,
    analyse: (workers: ReturnType<typeof normalizeWorkers>) => AnalysisBundle,
    rulesDisabled: boolean,
  ): AdaptiveWorkforceOptimizerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const normalized = normalize(input);
    appendAwoLog({
      event: action,
      details: `workers=${normalized.workers?.length ?? 0}; scope=${normalized.scope ?? defaultScope}`,
    });

    const decision = this.validator.decide(normalized, true);
    if (decision === "fail" || !config.enabled || rulesDisabled) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords(null, normalized, started, true);
      return this.report(action, [], [], [], [], [], validation, started);
    }

    const workers = normalizeWorkers(normalized.workers);
    const bundle = analyse(workers);
    const status = decision === "partial" ? "partial" : "passed";
    const record = this.store.buildRecord({
      input: normalized,
      scope: normalizeScope(normalized.scope) || defaultScope,
      workers: bundle.workers,
      performance: bundle.performance,
      bottlenecks: bundle.bottlenecks,
      opportunities: bundle.opportunities,
      recommendedChanges: bundle.recommendedChanges,
      expectedBenefits: bundle.expectedBenefits,
      evidence: bundle.evidence,
      confidenceScore: bundle.confidenceScore,
      overloadedWorkers: bundle.overloadedWorkers,
      underutilizedWorkers: bundle.underutilizedWorkers,
      idleWorkers: bundle.idleWorkers,
      targetsAddressed: filterTargets(bundle.targetsAddressed, config, normalized),
      validationStatus: status,
    });
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords([record], normalized, started, true);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.metadata.generate(this.store.count(), record.confidenceScore);
    appendAwoLog({
      event: "produce_optimization_record",
      details: `optimizationId=${record.optimizationId}; confidence=${record.confidenceScore}; workerTasksExecuted=false`,
    });
    return this.report(
      action,
      [record],
      bundle.overloadedWorkers,
      bundle.underutilizedWorkers,
      bundle.idleWorkers,
      bundle.bottlenecks,
      validation,
      started,
      bundle.recommendedChanges,
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: AdaptiveWorkforceOptimizerConfiguration,
  ) {
    const latest = this.getLatestRecord();
    const mapped =
      latest?.validationStatus === "passed"
        ? "passed"
        : latest?.validationStatus === "partial"
          ? "partial"
          : latest?.validationStatus === "failed"
            ? "failed"
            : "pending";
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `awo-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: ADAPTIVE_WORKFORCE_OPTIMIZER_ID,
      engineVersion: "PILLOW-AWO-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed"
          ? "pass"
          : mapped === "partial"
            ? "partial"
            : mapped === "failed"
              ? "fail"
              : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...AWO_CAPABILITIES],
      totalOptimizationRecords: this.store.count(),
      lastConfidenceScore: latest?.confidenceScore ?? null,
      metadataVersion: AWO_METADATA_VERSION,
    };
  }

  private report(
    action: AdaptiveWorkforceOptimizerRunReport["action"],
    records: OptimizationRecord[],
    overloadedWorkers: string[],
    underutilizedWorkers: string[],
    idleWorkers: string[],
    bottlenecks: string[],
    validation: AdaptiveWorkforceOptimizerRunReport["validation"],
    started: number,
    recommendations: RecommendedChange[] = [],
  ): AdaptiveWorkforceOptimizerRunReport {
    const latestRecs =
      recommendations.length > 0
        ? recommendations
        : records.flatMap((r) => r.recommendedChanges);
    return {
      optimizationRunReportId: `awo-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      records: records.map((r) => ({
        ...r,
        workers: [...r.workers],
        bottlenecks: [...r.bottlenecks],
        improvementOpportunities: [...r.improvementOpportunities],
        recommendedChanges: r.recommendedChanges.map((c) => ({
          ...c,
          affectedWorkers: [...c.affectedWorkers],
        })),
        expectedBenefits: [...r.expectedBenefits],
        supportingEvidence: [...r.supportingEvidence],
        overloadedWorkers: [...r.overloadedWorkers],
        underutilizedWorkers: [...r.underutilizedWorkers],
        idleWorkers: [...r.idleWorkers],
        optimizationTargetsAddressed: [...r.optimizationTargetsAddressed],
        currentPerformance: { ...r.currentPerformance },
      })),
      overloadedWorkers: [...overloadedWorkers],
      underutilizedWorkers: [...underutilizedWorkers],
      idleWorkers: [...idleWorkers],
      bottlenecks: [...bottlenecks],
      recommendations: latestRecs.map((c) => ({
        ...c,
        affectedWorkers: [...c.affectedWorkers],
      })),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: AWO_METADATA_VERSION,
    };
  }
}

function normalize(input: AdaptiveWorkforceOptimizerInput): AdaptiveWorkforceOptimizerInput {
  return { ...input, validated: input.validated !== false };
}

function normalizeScope(scope: string | null | undefined) {
  return (scope ?? "").toString().trim().toLowerCase().replace(/\s+/g, "_");
}

function withThresholdOverrides(
  config: AdaptiveWorkforceOptimizerConfiguration,
  input: AdaptiveWorkforceOptimizerInput,
): AdaptiveWorkforceOptimizerConfiguration {
  return {
    ...config,
    overloadedThreshold:
      input.overloadedThreshold != null && Number.isFinite(input.overloadedThreshold)
        ? input.overloadedThreshold
        : config.overloadedThreshold,
    underutilizedThreshold:
      input.underutilizedThreshold != null && Number.isFinite(input.underutilizedThreshold)
        ? input.underutilizedThreshold
        : config.underutilizedThreshold,
    idleThreshold:
      input.idleThreshold != null && Number.isFinite(input.idleThreshold)
        ? input.idleThreshold
        : config.idleThreshold,
  };
}

function filterTargets(
  addressed: string[],
  config: AdaptiveWorkforceOptimizerConfiguration,
  input: AdaptiveWorkforceOptimizerInput,
) {
  const requested = (input.targets ?? []).map((t) => t.toString());
  const allowed = new Set([...config.optimizationTargets, ...requested]);
  const filtered = addressed.filter((t) => allowed.has(t) || requested.length === 0);
  return filtered.length ? filtered : addressed;
}
