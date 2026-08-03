/** X3-14 — Global Scaling Planner orchestration controller. */



import { appendGspLog } from "./gsp-logging.js";

import { HealthMonitor } from "./health-monitor.js";

import { RecoveryManager } from "./recovery-manager.js";

import { GlobalScalingPlannerManager } from "./global-scaling-planner-manager.js";

import type { GlobalScalingPlannerConfiguration } from "./configuration.js";

import type {

  GlobalScalingInput,

  GspPerformanceStats,

  GspRunReport,

  ConnectGlobalScalingPlannerInput,

  EngineStatus,

  RunGspDiagnosticsInput,

} from "./types.js";



export class GlobalScalingPlannerController {

  private config: GlobalScalingPlannerConfiguration;

  private status: EngineStatus = "idle";

  private latestReport: GspRunReport | null = null;

  private readonly healthMonitor = new HealthMonitor();

  private readonly recoveryManager = new RecoveryManager();

  private readonly performance: GspPerformanceStats = {

    totalOperations: 0,

    successfulOperations: 0,

    failedOperations: 0,

    evaluationRuns: 0,

    regionsIdentified: 0,

    countriesIdentified: 0,

    recommendationsGenerated: 0,

    retryAttempts: 0,

    averageOperationDurationMs: 0,

    peakOperationDurationMs: 0,

  };



  constructor(

    private readonly manager: GlobalScalingPlannerManager,

    config: GlobalScalingPlannerConfiguration,

  ) {

    this.config = config;

  }



  initialize(): void {

    this.status = "active";

    appendGspLog({

      event: "engine_initialized",

      level: "info",

      details:

        "Global Scaling Planner ready — never recommend international expansion without validated readiness; structural signals only",

    });

  }



  getStatus(): EngineStatus {

    return this.status;

  }



  getConfiguration(): GlobalScalingPlannerConfiguration {

    return { ...this.config };

  }



  updateConfiguration(config: GlobalScalingPlannerConfiguration): void {

    this.config = config;

  }



  getLatestReport(): GspRunReport | null {

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



  getPerformance(): GspPerformanceStats {

    return { ...this.performance };

  }



  connectGlobalScalingPlanner(input: ConnectGlobalScalingPlannerInput = {}): GspRunReport {

    if (!this.config.enabled) throw new Error("Global Scaling Planner is disabled");

    this.status = "connecting";

    const report = this.manager.connectGlobalScalingPlanner(input, this.config);

    this.finalizeOperation(report);

    return report;

  }



  evaluateInternationalExpansionReadiness(input: GlobalScalingInput = {}): GspRunReport {

    this.status = "evaluating";

    const report = this.manager.evaluateInternationalExpansionReadiness(input, this.config);

    if (report.validation.decision !== "fail") this.performance.evaluationRuns += 1;

    this.finalizeOperation(report);

    return report;

  }



  identifyTargetRegions(input: GlobalScalingInput = {}): GspRunReport {

    this.status = "identifying";

    const report = this.manager.identifyTargetRegions(input, this.config);

    if (report.validation.decision !== "fail") {

      this.performance.evaluationRuns += 1;

      this.performance.regionsIdentified += report.globalScalingRecords.length;

    }

    this.finalizeOperation(report);

    return report;

  }



  identifyTargetCountries(input: GlobalScalingInput = {}): GspRunReport {

    this.status = "identifying";

    const report = this.manager.identifyTargetCountries(input, this.config);

    if (report.validation.decision !== "fail") {

      this.performance.evaluationRuns += 1;

      this.performance.countriesIdentified += report.globalScalingRecords.length;

    }

    this.finalizeOperation(report);

    return report;

  }



  evaluateRegionalDemand(input: GlobalScalingInput = {}): GspRunReport {

    this.status = "evaluating";

    const report = this.manager.evaluateRegionalDemand(input, this.config);

    if (report.validation.decision !== "fail") this.performance.evaluationRuns += 1;

    this.finalizeOperation(report);

    return report;

  }



  evaluateRegionalOperationalReadiness(input: GlobalScalingInput = {}): GspRunReport {

    this.status = "evaluating";

    const report = this.manager.evaluateRegionalOperationalReadiness(input, this.config);

    if (report.validation.decision !== "fail") this.performance.evaluationRuns += 1;

    this.finalizeOperation(report);

    return report;

  }



  evaluateSupplierReadinessByRegion(input: GlobalScalingInput = {}): GspRunReport {

    this.status = "evaluating";

    const report = this.manager.evaluateSupplierReadinessByRegion(input, this.config);

    if (report.validation.decision !== "fail") this.performance.evaluationRuns += 1;

    this.finalizeOperation(report);

    return report;

  }



  evaluateFinancialReadinessForExpansion(input: GlobalScalingInput = {}): GspRunReport {

    this.status = "evaluating";

    const report = this.manager.evaluateFinancialReadinessForExpansion(input, this.config);

    if (report.validation.decision !== "fail") this.performance.evaluationRuns += 1;

    this.finalizeOperation(report);

    return report;

  }



  rankInternationalScalingOpportunities(input: GlobalScalingInput = {}): GspRunReport {

    this.status = "ranking";

    const report = this.manager.rankInternationalScalingOpportunities(input, this.config);

    this.finalizeOperation(report);

    return report;

  }



  recommendGlobalExpansion(input: GlobalScalingInput = {}): GspRunReport {

    this.status = "recommending";

    const report = this.manager.recommendGlobalExpansion(input, this.config);

    if (report.validation.decision !== "fail") {

      this.performance.recommendationsGenerated += report.recommendations.length;

    }

    this.finalizeOperation(report);

    return report;

  }



  runDiagnostics(input: RunGspDiagnosticsInput = {}): GspRunReport {

    const report = this.manager.runDiagnostics(input, this.config);

    this.finalizeOperation(report);

    return report;

  }



  private finalizeOperation(report: GspRunReport): void {

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

    appendGspLog({

      event: "engine_operation_end",

      level: report.validation.decision === "fail" ? "warn" : "info",

      details: `${report.action} ${report.validation.decision} · ${duration}ms`,

    });

  }

}


