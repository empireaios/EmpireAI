/** R4-12 — Loyalty Programme Controller. */

import { appendLpeLog } from "./lpe-logging.js";
import { LoyaltyProgrammeManager } from "./loyalty-programme-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { LoyaltyProgrammeEngineConfiguration } from "./configuration.js";
import type {
  AwardLoyaltyPointsInput,
  ConnectLoyaltyProgrammeEngineInput,
  CreateLoyaltyProgrammeInput,
  DetectLoyaltyAbuseInput,
  DetectLoyaltyFailuresInput,
  EngineStatus,
  GenerateLoyaltyRewardsInput,
  LoyaltyPerformanceStats,
  LoyaltyRunReport,
  ManageLoyaltyTierInput,
  RedeemLoyaltyPointsInput,
  RegisterLoyaltyMemberInput,
  TrackLoyaltyActivityInput,
  TrackLoyaltyBalanceInput,
} from "./types.js";

export class LoyaltyProgrammeController {
  private config: LoyaltyProgrammeEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: LoyaltyRunReport | null = null;
  private readonly manager: LoyaltyProgrammeManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: LoyaltyPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    programmesCreated: 0,
    membersRegistered: 0,
    pointsAwarded: 0,
    pointsRedeemed: 0,
    tiersUpdated: 0,
    rewardsGenerated: 0,
    abuseDetected: 0,
    failuresDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: LoyaltyProgrammeManager, config: LoyaltyProgrammeEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendLpeLog({
      event: "engine_initialization",
      level: "info",
      details: "Loyalty Programme Engine ready (R4-12)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): LoyaltyProgrammeEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: LoyaltyProgrammeEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): LoyaltyRunReport | null {
    return this.latestReport;
  }

  getManager(): LoyaltyProgrammeManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): LoyaltyPerformanceStats {
    return { ...this.performance };
  }

  connectLoyaltyProgrammeEngine(
    input: ConnectLoyaltyProgrammeEngineInput = {},
  ): LoyaltyRunReport {
    if (!this.config.enabled) throw new Error("Loyalty Programme Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectLoyaltyProgrammeEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  createLoyaltyProgramme(input: CreateLoyaltyProgrammeInput): LoyaltyRunReport {
    this.performance.programmesCreated += 1;
    const report = this.manager.createLoyaltyProgramme(input, this.config);
    this.finalizeOperation(report, "create_programme");
    return report;
  }

  registerLoyaltyMember(input: RegisterLoyaltyMemberInput): LoyaltyRunReport {
    this.performance.membersRegistered += 1;
    const report = this.manager.registerLoyaltyMember(input, this.config);
    this.finalizeOperation(report, "register_member");
    return report;
  }

  awardLoyaltyPoints(input: AwardLoyaltyPointsInput): LoyaltyRunReport {
    this.performance.pointsAwarded += input.points;
    const report = this.manager.awardLoyaltyPoints(input, this.config);
    this.finalizeOperation(report, "award_points");
    return report;
  }

  redeemLoyaltyPoints(input: RedeemLoyaltyPointsInput): LoyaltyRunReport {
    this.performance.pointsRedeemed += input.points;
    const report = this.manager.redeemLoyaltyPoints(input, this.config);
    this.finalizeOperation(report, "redeem_points");
    return report;
  }

  manageLoyaltyTier(input: ManageLoyaltyTierInput): LoyaltyRunReport {
    const report = this.manager.manageLoyaltyTier(input, this.config);
    this.performance.tiersUpdated += report.loyaltyRecords.filter(
      (r) => r.activityType === "tier_change",
    ).length;
    this.finalizeOperation(report, "manage_tier");
    return report;
  }

  trackLoyaltyBalance(input: TrackLoyaltyBalanceInput): LoyaltyRunReport {
    const report = this.manager.trackLoyaltyBalance(input, this.config);
    this.finalizeOperation(report, "track_balance");
    return report;
  }

  trackLoyaltyActivity(input: TrackLoyaltyActivityInput = {}): LoyaltyRunReport {
    const report = this.manager.trackLoyaltyActivity(input, this.config);
    this.finalizeOperation(report, "track_activity");
    return report;
  }

  detectLoyaltyAbuse(input: DetectLoyaltyAbuseInput = {}): LoyaltyRunReport {
    const report = this.manager.detectLoyaltyAbuse(input, this.config);
    this.performance.abuseDetected += report.abuseAlerts.length;
    this.finalizeOperation(report, "detect_abuse");
    return report;
  }

  generateLoyaltyRewards(input: GenerateLoyaltyRewardsInput): LoyaltyRunReport {
    const report = this.manager.generateLoyaltyRewards(input, this.config);
    this.performance.rewardsGenerated += report.rewards.length;
    this.finalizeOperation(report, "generate_rewards");
    return report;
  }

  detectLoyaltyFailures(input: DetectLoyaltyFailuresInput = {}): LoyaltyRunReport {
    const report = this.manager.detectLoyaltyFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  reportLoyaltyStatus(): LoyaltyRunReport {
    const report = this.manager.reportLoyaltyStatus(this.config);
    this.finalizeOperation(report, "report_status");
    return report;
  }

  reportLoyaltyHealth(): LoyaltyRunReport {
    const report = this.manager.reportLoyaltyHealth(this.config);
    this.finalizeOperation(report, "report_health");
    return report;
  }

  private finalizeOperation(report: LoyaltyRunReport, action: string): void {
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
    appendLpeLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
