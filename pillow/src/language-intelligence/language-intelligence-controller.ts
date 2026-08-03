/** X4-04 — Language Intelligence orchestration controller. */

import { appendLiLog } from "./li-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { LanguageIntelligenceManager } from "./language-intelligence-manager.js";
import type { LanguageIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectLanguageIntelligenceInput,
  EngineStatus,
  LanguageAnalysisInput,
  LiPerformanceStats,
  LiRunReport,
  RunLiDiagnosticsInput,
} from "./types.js";

export class LanguageIntelligenceController {
  private config: LanguageIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: LiRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: LiPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    languageDetections: 0,
    customerTranslations: 0,
    operationalTranslations: 0,
    aiWorkforceTranslations: 0,
    terminologyOperations: 0,
    qualityAnalyses: 0,
    unsupportedDetections: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: LanguageIntelligenceManager,
    config: LanguageIntelligenceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendLiLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Language Intelligence ready — structural signals only; never overwrite canonical source automatically",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): LanguageIntelligenceConfiguration {
    return { ...this.config, supportedLanguages: [...this.config.supportedLanguages] };
  }

  updateConfiguration(config: LanguageIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): LiRunReport | null {
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

  getPerformance(): LiPerformanceStats {
    return { ...this.performance };
  }

  connectLanguageIntelligence(input: ConnectLanguageIntelligenceInput = {}): LiRunReport {
    if (!this.config.enabled) throw new Error("Language Intelligence is disabled");
    this.status = "connecting";
    const report = this.manager.connectLanguageIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectLanguage(input: LanguageAnalysisInput = {}): LiRunReport {
    this.status = "detecting";
    const report = this.manager.detectLanguage(input, this.config);
    if (report.validation.decision !== "fail") this.performance.languageDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  manageSupportedLanguages(input: LanguageAnalysisInput = {}): LiRunReport {
    this.status = "active";
    const report = this.manager.manageSupportedLanguages(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  translateCustomerFacing(input: LanguageAnalysisInput = {}): LiRunReport {
    this.status = "translating";
    const report = this.manager.translateCustomerFacing(input, this.config);
    if (report.validation.decision !== "fail") this.performance.customerTranslations += 1;
    this.finalizeOperation(report);
    return report;
  }

  translateOperational(input: LanguageAnalysisInput = {}): LiRunReport {
    this.status = "translating";
    const report = this.manager.translateOperational(input, this.config);
    if (report.validation.decision !== "fail") this.performance.operationalTranslations += 1;
    this.finalizeOperation(report);
    return report;
  }

  translateAiWorkforce(input: LanguageAnalysisInput = {}): LiRunReport {
    this.status = "translating";
    const report = this.manager.translateAiWorkforce(input, this.config);
    if (report.validation.decision !== "fail") this.performance.aiWorkforceTranslations += 1;
    this.finalizeOperation(report);
    return report;
  }

  maintainTerminology(input: LanguageAnalysisInput = {}): LiRunReport {
    this.status = "translating";
    const report = this.manager.maintainTerminology(input, this.config);
    if (report.validation.decision !== "fail") this.performance.terminologyOperations += 1;
    this.finalizeOperation(report);
    return report;
  }

  analyzeQuality(input: LanguageAnalysisInput = {}): LiRunReport {
    this.status = "validating";
    const report = this.manager.analyzeQuality(input, this.config);
    if (report.validation.decision !== "fail") this.performance.qualityAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectUnsupported(input: LanguageAnalysisInput = {}): LiRunReport {
    this.status = "detecting";
    const report = this.manager.detectUnsupported(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.unsupportedDetections += report.languageRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  recommendLanguage(input: LanguageAnalysisInput = {}): LiRunReport {
    this.status = "recommending";
    const report = this.manager.recommendLanguage(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunLiDiagnosticsInput = {}): LiRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: LiRunReport): void {
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
    appendLiLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
