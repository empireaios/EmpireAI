import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { ReviewManagementEngine } from "../review-management-engine/engine.js";
import {
  buildLoyaltyProgrammeEngineConfiguration,
  type LoyaltyProgrammeEngineConfiguration,
} from "./configuration.js";
import { appendLpeLog, getLpeLogs, resetLpeLogsForTesting } from "./lpe-logging.js";
import { LOYALTY_PROGRAMME_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AwardLoyaltyPointsInput,
  ConnectLoyaltyProgrammeEngineInput,
  CreateLoyaltyProgrammeInput,
  DetectLoyaltyAbuseInput,
  DetectLoyaltyFailuresInput,
  GenerateLoyaltyRewardsInput,
  LoyaltyCockpitSnapshot,
  LoyaltyProgrammeEngineState,
  LoyaltyRunReport,
  ManageLoyaltyTierInput,
  RedeemLoyaltyPointsInput,
  RegisterLoyaltyMemberInput,
  TrackLoyaltyActivityInput,
  TrackLoyaltyBalanceInput,
} from "./types.js";
import { LoyaltyProgrammeController } from "./loyalty-programme-controller.js";
import { LoyaltyProgrammeManager } from "./loyalty-programme-manager.js";

export interface LoyaltyProgrammeEngineOptions {
  configuration?: Partial<LoyaltyProgrammeEngineConfiguration>;
}

/**
 * Loyalty Programme Engine (PILLOW-LPE-001 / R4-12).
 * Centralized loyalty management consuming R4-01, R4-02, R4-03, R4-10 and R4-11.
 */
export class LoyaltyProgrammeEngine {
  private initializedAt: string | null = null;
  private readonly controller: LoyaltyProgrammeController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    identityEngine: CustomerIdentityEngine,
    crmFoundation: CrmFoundationEngine,
    timelineEngine: CustomerTimelineEngine,
    sentimentEngine: CustomerSentimentEngine,
    reviewManagementEngine: ReviewManagementEngine,
    options: LoyaltyProgrammeEngineOptions = {},
  ) {
    const config = buildLoyaltyProgrammeEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new LoyaltyProgrammeManager(
      identityEngine,
      crmFoundation,
      timelineEngine,
      sentimentEngine,
      reviewManagementEngine,
    );
    this.controller = new LoyaltyProgrammeController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<LoyaltyProgrammeEngineState> {
    const doc = await this.reader.readText(LOYALTY_PROGRAMME_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Loyalty Programme Engine")) {
      throw new Error(
        `${LOYALTY_PROGRAMME_ENGINE_SYSTEM_PATH} missing — Loyalty Programme Engine requires R4-12 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendLpeLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-12 Loyalty Programme Engine initialized",
    });
    return this.getState();
  }

  getState(): LoyaltyProgrammeEngineState {
    if (!this.initializedAt) {
      throw new Error("Loyalty Programme Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const loyaltyRecords = this.controller.getManager().getLoyaltyRecords();
    const summary = this.controller
      .getManager()
      .getAnalyticsEngine()
      .summarize(
        loyaltyRecords,
        this.controller.getManager().getRegistry().listProgrammes().length,
        this.controller.getManager().getRegistry().listMembers().length,
        this.controller.getManager().getRegistry().listAlerts(),
      );

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalProgrammes: summary.totalProgrammes,
      totalMembers: summary.totalMembers,
      totalLoyaltyRecords: summary.totalRecords,
      totalPointsAwarded: summary.totalPointsAwarded,
      totalPointsRedeemed: summary.totalPointsRedeemed,
      activeAbuseAlerts: summary.activeAbuseAlerts,
      failedRecords: summary.failedRecords,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-LPE-001",
      missionId: "R4-12",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectLoyaltyProgrammeEngine(
    input: ConnectLoyaltyProgrammeEngineInput = {},
  ): LoyaltyRunReport {
    return this.controller.connectLoyaltyProgrammeEngine(input);
  }

  createLoyaltyProgramme(input: CreateLoyaltyProgrammeInput): LoyaltyRunReport {
    return this.controller.createLoyaltyProgramme(input);
  }

  registerLoyaltyMember(input: RegisterLoyaltyMemberInput): LoyaltyRunReport {
    return this.controller.registerLoyaltyMember(input);
  }

  awardLoyaltyPoints(input: AwardLoyaltyPointsInput): LoyaltyRunReport {
    return this.controller.awardLoyaltyPoints(input);
  }

  redeemLoyaltyPoints(input: RedeemLoyaltyPointsInput): LoyaltyRunReport {
    return this.controller.redeemLoyaltyPoints(input);
  }

  manageLoyaltyTier(input: ManageLoyaltyTierInput): LoyaltyRunReport {
    return this.controller.manageLoyaltyTier(input);
  }

  trackLoyaltyBalance(input: TrackLoyaltyBalanceInput): LoyaltyRunReport {
    return this.controller.trackLoyaltyBalance(input);
  }

  trackLoyaltyActivity(input: TrackLoyaltyActivityInput = {}): LoyaltyRunReport {
    return this.controller.trackLoyaltyActivity(input);
  }

  detectLoyaltyAbuse(input: DetectLoyaltyAbuseInput = {}): LoyaltyRunReport {
    return this.controller.detectLoyaltyAbuse(input);
  }

  generateLoyaltyRewards(input: GenerateLoyaltyRewardsInput): LoyaltyRunReport {
    return this.controller.generateLoyaltyRewards(input);
  }

  detectLoyaltyFailures(input: DetectLoyaltyFailuresInput = {}): LoyaltyRunReport {
    return this.controller.detectLoyaltyFailures(input);
  }

  reportLoyaltyStatus(): LoyaltyRunReport {
    return this.controller.reportLoyaltyStatus();
  }

  reportLoyaltyHealth(): LoyaltyRunReport {
    return this.controller.reportLoyaltyHealth();
  }

  getLatestReport(): LoyaltyRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLoyaltyRecords() {
    return this.controller.getManager().getLoyaltyRecords();
  }

  getProgrammes() {
    return this.controller.getManager().getRegistry().listProgrammes();
  }

  getMembers() {
    return this.controller.getManager().getRegistry().listMembers();
  }

  getRewards() {
    return this.controller.getManager().getRegistry().listRewards();
  }

  getAbuseAlerts() {
    return this.controller.getManager().getRegistry().listAlerts();
  }

  getMachineReadableRecord(loyaltyRecordId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getRecord(loyaltyRecordId);
    if (!record) return null;
    return this.controller.getManager().getAnalyticsEngine().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<LoyaltyProgrammeEngineConfiguration>,
  ): LoyaltyProgrammeEngineState {
    const next = buildLoyaltyProgrammeEngineConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Loyalty engine status: ${state.status}`,
        `Programmes: ${state.health.totalProgrammes} · Members: ${state.health.totalMembers}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No loyalty operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LoyaltyCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalProgrammes: state.health.totalProgrammes,
      totalMembers: state.health.totalMembers,
      totalLoyaltyRecords: state.health.totalLoyaltyRecords,
      activeAbuseAlerts: state.health.activeAbuseAlerts,
      identityEngineConnected: record?.identityEngineConnected ?? false,
      crmFoundationConnected: record?.crmFoundationConnected ?? false,
      timelineEngineConnected: record?.timelineEngineConnected ?? false,
      recentLogs: getLpeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createLoyaltyProgrammeEngine(
  bootstrap: EmpireBootstrapContext,
  identityEngine: CustomerIdentityEngine,
  crmFoundation: CrmFoundationEngine,
  timelineEngine: CustomerTimelineEngine,
  sentimentEngine: CustomerSentimentEngine,
  reviewManagementEngine: ReviewManagementEngine,
  options?: LoyaltyProgrammeEngineOptions,
): LoyaltyProgrammeEngine {
  return new LoyaltyProgrammeEngine(
    bootstrap,
    identityEngine,
    crmFoundation,
    timelineEngine,
    sentimentEngine,
    reviewManagementEngine,
    options,
  );
}

export function resetLoyaltyProgrammeEngineForTesting(): void {
  resetLpeLogsForTesting();
  new LoyaltyProgrammeManager(null, null, null, null, null).resetForTesting();
}
