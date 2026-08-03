/** X2-20 — Autonomous Portfolio Board orchestration controller. */

import { appendApbLog } from "./apb-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { AutonomousPortfolioBoardManager } from "./autonomous-portfolio-board-manager.js";
import type { AutonomousPortfolioBoardConfiguration } from "./configuration.js";
import type {
  ConnectAutonomousPortfolioBoardInput,
  EngineStatus,
  ExecutiveBoardPerformanceStats,
  ExecutiveBoardRunReport,
  GenerateExecutiveRecommendationsInput,
  PrioritizeExecutiveDecisionsInput,
  ReviewAcquisitionOpportunitiesInput,
  ReviewCapitalAllocationInput,
  ReviewEnterprisePerformanceInput,
  ReviewEnterpriseRisksInput,
  ReviewExpansionOpportunitiesInput,
  ReviewPortfolioHealthInput,
  ReviewStrategicOpportunitiesInput,
  RunExecutiveBoardDiagnosticsInput,
} from "./types.js";

export class AutonomousPortfolioBoardController {
  private config: AutonomousPortfolioBoardConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ExecutiveBoardRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ExecutiveBoardPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    performanceReviews: 0,
    healthReviews: 0,
    opportunityReviews: 0,
    riskReviews: 0,
    capitalReviews: 0,
    expansionReviews: 0,
    acquisitionReviews: 0,
    prioritizations: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: AutonomousPortfolioBoardManager,
    config: AutonomousPortfolioBoardConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendApbLog({
      event: "framework_initialized",
      level: "info",
      details:
        "Autonomous Portfolio Board ready — strategic decisions never auto-execute beyond approval policies",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AutonomousPortfolioBoardConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AutonomousPortfolioBoardConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ExecutiveBoardRunReport | null {
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

  getPerformance(): ExecutiveBoardPerformanceStats {
    return { ...this.performance };
  }

  connectAutonomousPortfolioBoard(
    input: ConnectAutonomousPortfolioBoardInput = {},
  ): ExecutiveBoardRunReport {
    if (!this.config.enabled) throw new Error("Autonomous Portfolio Board is disabled");
    this.status = "connecting";
    const report = this.manager.connectAutonomousPortfolioBoard(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  reviewEnterprisePerformance(
    input: ReviewEnterprisePerformanceInput = {},
  ): ExecutiveBoardRunReport {
    this.status = "reviewing";
    const report = this.manager.reviewEnterprisePerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.performanceReviews += 1;
    this.finalizeOperation(report);
    return report;
  }

  reviewPortfolioHealth(input: ReviewPortfolioHealthInput = {}): ExecutiveBoardRunReport {
    this.status = "reviewing";
    const report = this.manager.reviewPortfolioHealth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.healthReviews += 1;
    this.finalizeOperation(report);
    return report;
  }

  reviewStrategicOpportunities(
    input: ReviewStrategicOpportunitiesInput = {},
  ): ExecutiveBoardRunReport {
    this.status = "reviewing";
    const report = this.manager.reviewStrategicOpportunities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.opportunityReviews += 1;
    this.finalizeOperation(report);
    return report;
  }

  reviewEnterpriseRisks(input: ReviewEnterpriseRisksInput = {}): ExecutiveBoardRunReport {
    this.status = "reviewing";
    const report = this.manager.reviewEnterpriseRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.riskReviews += 1;
    this.finalizeOperation(report);
    return report;
  }

  reviewCapitalAllocation(input: ReviewCapitalAllocationInput = {}): ExecutiveBoardRunReport {
    this.status = "reviewing";
    const report = this.manager.reviewCapitalAllocation(input, this.config);
    if (report.validation.decision !== "fail") this.performance.capitalReviews += 1;
    this.finalizeOperation(report);
    return report;
  }

  reviewExpansionOpportunities(
    input: ReviewExpansionOpportunitiesInput = {},
  ): ExecutiveBoardRunReport {
    this.status = "reviewing";
    const report = this.manager.reviewExpansionOpportunities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.expansionReviews += 1;
    this.finalizeOperation(report);
    return report;
  }

  reviewAcquisitionOpportunities(
    input: ReviewAcquisitionOpportunitiesInput = {},
  ): ExecutiveBoardRunReport {
    this.status = "reviewing";
    const report = this.manager.reviewAcquisitionOpportunities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.acquisitionReviews += 1;
    this.finalizeOperation(report);
    return report;
  }

  prioritizeExecutiveDecisions(
    input: PrioritizeExecutiveDecisionsInput = {},
  ): ExecutiveBoardRunReport {
    this.status = "prioritizing";
    const report = this.manager.prioritizeExecutiveDecisions(input, this.config);
    if (report.validation.decision !== "fail") this.performance.prioritizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateExecutiveRecommendations(
    input: GenerateExecutiveRecommendationsInput = {},
  ): ExecutiveBoardRunReport {
    this.status = "recommending";
    const report = this.manager.generateExecutiveRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunExecutiveBoardDiagnosticsInput = {}): ExecutiveBoardRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: ExecutiveBoardRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;
    this.performance.peakOperationDurationMs = Math.max(
      this.performance.peakOperationDurationMs,
      duration,
    );
    const prior = this.performance.totalOperations - 1;
    this.performance.averageOperationDurationMs =
      prior <= 0
        ? duration
        : Math.round(
            (this.performance.averageOperationDurationMs * prior + duration) /
              this.performance.totalOperations,
          );

    this.healthMonitor.recordOperation(report.validation.decision);
    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        report.validation.errors.join("; ") || "executive board operation failed",
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
      this.status = "failed";
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
      this.status = "active";
    }
  }
}
