/** R4-17 — Customer Journey Intelligence Controller. */

import { appendCjiLog } from "./cji-logging.js";
import { CustomerJourneyIntelligenceManager } from "./customer-journey-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CustomerJourneyIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectJourneyIntelligenceInput,
  DetectDropOffPointsInput,
  DetectFrictionPointsInput,
  DetectJourneyFailuresInput,
  EngineStatus,
  IdentifyJourneyStagesInput,
  JourneyPerformanceStats,
  JourneyRunReport,
  MapCustomerJourneyInput,
  MeasureConversionRatesInput,
  MeasureJourneyPerformanceInput,
  PredictCustomerProgressionInput,
  RecommendJourneyImprovementsInput,
  TrackCustomerTouchpointsInput,
} from "./types.js";

export class CustomerJourneyIntelligenceController {
  private config: CustomerJourneyIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: JourneyRunReport | null = null;
  private readonly manager: CustomerJourneyIntelligenceManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: JourneyPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    journeysMapped: 0,
    touchpointsTracked: 0,
    stagesIdentified: 0,
    dropOffsDetected: 0,
    frictionPointsDetected: 0,
    performanceMeasurements: 0,
    conversionMeasurements: 0,
    recommendationsGenerated: 0,
    predictionsGenerated: 0,
    failuresDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: CustomerJourneyIntelligenceManager,
    config: CustomerJourneyIntelligenceConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCjiLog({
      event: "engine_initialization",
      level: "info",
      details: "Customer Journey Intelligence Engine ready (R4-17)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CustomerJourneyIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CustomerJourneyIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): JourneyRunReport | null {
    return this.latestReport;
  }

  getManager(): CustomerJourneyIntelligenceManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): JourneyPerformanceStats {
    return { ...this.performance };
  }

  connectJourneyIntelligenceEngine(
    input: ConnectJourneyIntelligenceInput = {},
  ): JourneyRunReport {
    if (!this.config.enabled) throw new Error("Customer Journey Intelligence Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectJourneyIntelligenceEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  mapCustomerJourney(input: MapCustomerJourneyInput): JourneyRunReport {
    this.performance.journeysMapped += 1;
    const report = this.manager.mapCustomerJourney(input, this.config);
    this.finalizeOperation(report, "map_journey");
    return report;
  }

  trackCustomerTouchpoints(input: TrackCustomerTouchpointsInput): JourneyRunReport {
    this.performance.touchpointsTracked += 1;
    const report = this.manager.trackCustomerTouchpoints(input, this.config);
    this.finalizeOperation(report, "track_touchpoints");
    return report;
  }

  identifyJourneyStages(input: IdentifyJourneyStagesInput): JourneyRunReport {
    this.performance.stagesIdentified += 1;
    const report = this.manager.identifyJourneyStages(input, this.config);
    this.finalizeOperation(report, "identify_stages");
    return report;
  }

  detectDropOffPoints(input: DetectDropOffPointsInput): JourneyRunReport {
    const report = this.manager.detectDropOffPoints(input, this.config);
    this.performance.dropOffsDetected += report.insights.filter((i) => i.insightType === "dropoff").length;
    this.finalizeOperation(report, "detect_dropoff");
    return report;
  }

  detectFrictionPoints(input: DetectFrictionPointsInput): JourneyRunReport {
    const report = this.manager.detectFrictionPoints(input, this.config);
    this.performance.frictionPointsDetected += report.insights.filter(
      (i) => i.insightType === "friction",
    ).length;
    this.finalizeOperation(report, "detect_friction");
    return report;
  }

  measureJourneyPerformance(input: MeasureJourneyPerformanceInput): JourneyRunReport {
    this.performance.performanceMeasurements += 1;
    const report = this.manager.measureJourneyPerformance(input, this.config);
    this.finalizeOperation(report, "measure_performance");
    return report;
  }

  measureConversionRates(input: MeasureConversionRatesInput = {}): JourneyRunReport {
    this.performance.conversionMeasurements += 1;
    const report = this.manager.measureConversionRates(input, this.config);
    this.finalizeOperation(report, "measure_conversion");
    return report;
  }

  recommendJourneyImprovements(input: RecommendJourneyImprovementsInput): JourneyRunReport {
    this.performance.recommendationsGenerated += 1;
    const report = this.manager.recommendJourneyImprovements(input, this.config);
    this.finalizeOperation(report, "recommend_improvements");
    return report;
  }

  predictCustomerProgression(input: PredictCustomerProgressionInput): JourneyRunReport {
    this.performance.predictionsGenerated += 1;
    const report = this.manager.predictCustomerProgression(input, this.config);
    this.finalizeOperation(report, "predict_progression");
    return report;
  }

  detectJourneyFailures(input: DetectJourneyFailuresInput = {}): JourneyRunReport {
    const report = this.manager.detectJourneyFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  reportJourneyStatus(): JourneyRunReport {
    const report = this.manager.reportJourneyStatus(this.config);
    this.finalizeOperation(report, "report_status");
    return report;
  }

  reportJourneyHealth(): JourneyRunReport {
    const report = this.manager.reportJourneyHealth(this.config);
    this.finalizeOperation(report, "report_health");
    return report;
  }

  private finalizeOperation(report: JourneyRunReport, action: string): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `${action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      this.status = "failed";
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
      this.status =
        report.engineRecord.currentOperationalState === "active" ? "active" : "connected";
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
    appendCjiLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
