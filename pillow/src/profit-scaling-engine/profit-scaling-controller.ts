/** X3-17 — Profit Scaling Engine orchestration controller. */



import { appendPseLog } from "./pse-logging.js";

import { HealthMonitor } from "./health-monitor.js";

import { RecoveryManager } from "./recovery-manager.js";

import { ProfitScalingManager } from "./profit-scaling-manager.js";

import type { ProfitScalingEngineConfiguration } from "./configuration.js";

import type {

  ProfitScalingInput,

  PsePerformanceStats,

  PseRunReport,

  ConnectProfitScalingEngineInput,

  EngineStatus,

  RunPseDiagnosticsInput,

} from "./types.js";



export class ProfitScalingController {

  private config: ProfitScalingEngineConfiguration;

  private status: EngineStatus = "idle";

  private latestReport: PseRunReport | null = null;

  private readonly healthMonitor = new HealthMonitor();

  private readonly recoveryManager = new RecoveryManager();

  private readonly performance: PsePerformanceStats = {

    totalOperations: 0,

    successfulOperations: 0,

    failedOperations: 0,

    monitoringRuns: 0,

    erosionsDetected: 0,

    unprofitableGrowthDetected: 0,

    optimizationsPerformed: 0,

    recommendationsGenerated: 0,

    retryAttempts: 0,

    averageOperationDurationMs: 0,

    peakOperationDurationMs: 0,

  };



  constructor(

    private readonly manager: ProfitScalingManager,

    config: ProfitScalingEngineConfiguration,

  ) {

    this.config = config;

  }



  initialize(): void {

    this.status = "active";

    appendPseLog({

      event: "engine_initialized",

      level: "info",

      details:

        "Profit Scaling Engine ready — never prioritize growth over validated profitability; structural signals only",

    });

  }



  getStatus(): EngineStatus {

    return this.status;

  }



  getConfiguration(): ProfitScalingEngineConfiguration {

    return { ...this.config };

  }



  updateConfiguration(config: ProfitScalingEngineConfiguration): void {

    this.config = config;

  }



  getLatestReport(): PseRunReport | null {

    return this.latestReport;

  }



  getManager() {

    return this.manager;

  }



  getHealthMonitor() {

    return this.healthMonitor;

  }



  getRecoveryManager() {

    return this.recoveryManager;

  }



  getPerformance(): PsePerformanceStats {

    return { ...this.performance };

  }



  connectProfitScalingEngine(

    input: ConnectProfitScalingEngineInput = {},

  ): PseRunReport {

    if (!this.config.enabled) throw new Error("Profit Scaling Engine is disabled");

    this.status = "connecting";

    const report = this.manager.connectProfitScalingEngine(input, this.config);

    this.finalizeOperation(report);

    return report;

  }



  monitorProfitGrowth(input: ProfitScalingInput = {}): PseRunReport {

    this.status = "evaluating";

    const report = this.manager.monitorProfitGrowth(input, this.config);

    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;

    this.finalizeOperation(report);

    return report;

  }



  monitorGrossMargin(input: ProfitScalingInput = {}): PseRunReport {

    this.status = "evaluating";

    const report = this.manager.monitorGrossMargin(input, this.config);

    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;

    this.finalizeOperation(report);

    return report;

  }



  monitorNetMargin(input: ProfitScalingInput = {}): PseRunReport {

    this.status = "evaluating";

    const report = this.manager.monitorNetMargin(input, this.config);

    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;

    this.finalizeOperation(report);

    return report;

  }



  monitorOperatingMargin(input: ProfitScalingInput = {}): PseRunReport {

    this.status = "evaluating";

    const report = this.manager.monitorOperatingMargin(input, this.config);

    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;

    this.finalizeOperation(report);

    return report;

  }



  monitorScalingCosts(input: ProfitScalingInput = {}): PseRunReport {

    this.status = "evaluating";

    const report = this.manager.monitorScalingCosts(input, this.config);

    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;

    this.finalizeOperation(report);

    return report;

  }



  monitorReturnOnInvestment(input: ProfitScalingInput = {}): PseRunReport {

    this.status = "evaluating";

    const report = this.manager.monitorReturnOnInvestment(input, this.config);

    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;

    this.finalizeOperation(report);

    return report;

  }



  detectProfitErosion(input: ProfitScalingInput = {}): PseRunReport {

    this.status = "detecting";

    const report = this.manager.detectProfitErosion(input, this.config);

    if (report.validation.decision !== "fail") {

      this.performance.erosionsDetected += report.profitScalingRecords.length;

    }

    this.finalizeOperation(report);

    return report;

  }



  detectUnprofitableGrowth(input: ProfitScalingInput = {}): PseRunReport {

    this.status = "detecting";

    const report = this.manager.detectUnprofitableGrowth(input, this.config);

    if (report.validation.decision !== "fail") {

      this.performance.unprofitableGrowthDetected += report.profitScalingRecords.length;

    }

    this.finalizeOperation(report);

    return report;

  }



  optimizeProfitDuringScaling(input: ProfitScalingInput = {}): PseRunReport {

    this.status = "optimizing";

    const report = this.manager.optimizeProfitDuringScaling(input, this.config);

    if (report.validation.decision !== "fail") {

      this.performance.optimizationsPerformed += report.profitScalingRecords.length;

    }

    this.finalizeOperation(report);

    return report;

  }



  recommendProfitScaling(input: ProfitScalingInput = {}): PseRunReport {

    this.status = "recommending";

    const report = this.manager.recommendProfitScaling(input, this.config);

    if (report.validation.decision !== "fail") {

      this.performance.recommendationsGenerated += report.recommendations.length;

    }

    this.finalizeOperation(report);

    return report;

  }



  runDiagnostics(input: RunPseDiagnosticsInput = {}): PseRunReport {

    const report = this.manager.runDiagnostics(input, this.config);

    this.finalizeOperation(report);

    return report;

  }



  private finalizeOperation(report: PseRunReport): void {

    this.latestReport = report;

    this.performance.totalOperations += 1;

    const duration = report.durationMs;



    if (report.validation.decision === "fail") {

      this.performance.failedOperations += 1;

      const recovered = this.recoveryManager.recordFailure(

        `Operation failed: ${report.validation.errors.join("; ")}`,

        this.config,

      );

      if (recovered) this.performance.retryAttempts += 1;

    } else {

      this.performance.successfulOperations += 1;

      this.recoveryManager.recordSuccess();

    }



    this.performance.averageOperationDurationMs = Math.round(

      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) +

        duration) /

        this.performance.totalOperations,

    );

    if (duration > this.performance.peakOperationDurationMs) {

      this.performance.peakOperationDurationMs = duration;

    }



    this.healthMonitor.recordOperation(report.validation.decision);

    this.status = "active";

    appendPseLog({

      event: "engine_operation_end",

      level: report.validation.decision === "fail" ? "warn" : "info",

      details: `${report.action} ${report.validation.decision} · ${duration}ms`,

    });

  }

}

