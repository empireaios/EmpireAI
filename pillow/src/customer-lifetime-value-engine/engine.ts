import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { LoyaltyProgrammeEngine } from "../loyalty-programme-engine/engine.js";
import type { CustomerRiskEngine } from "../customer-risk-engine/engine.js";
import {
  buildCustomerLifetimeValueEngineConfiguration,
  type CustomerLifetimeValueEngineConfiguration,
} from "./configuration.js";
import { appendClveLog, getClveLogs, resetClveLogsForTesting } from "./clve-logging.js";
import { CUSTOMER_LIFETIME_VALUE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  CalculateCustomerLifetimeValueInput,
  ClvCockpitSnapshot,
  ConnectClvEngineInput,
  CustomerLifetimeValueEngineState,
  ClvRunReport,
  DetectClvFailuresInput,
  IdentifyDecliningCustomerValueInput,
  IdentifyHighValueCustomersInput,
  PredictFutureCustomerValueInput,
  TrackAverageOrderValueInput,
  TrackCustomerProfitabilityInput,
  TrackCustomerRetentionInput,
  TrackCustomerRevenueInput,
  TrackPurchaseFrequencyInput,
} from "./types.js";
import { CustomerLifetimeValueController } from "./customer-lifetime-value-controller.js";
import { CustomerLifetimeValueManager } from "./customer-lifetime-value-manager.js";

export interface CustomerLifetimeValueEngineOptions {
  configuration?: Partial<CustomerLifetimeValueEngineConfiguration>;
}

/** Customer Lifetime Value Engine (PILLOW-CLVE-001 / R4-15). */
export class CustomerLifetimeValueEngine {
  private initializedAt: string | null = null;
  private readonly controller: CustomerLifetimeValueController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    identityEngine: CustomerIdentityEngine,
    crmFoundation: CrmFoundationEngine,
    timelineEngine: CustomerTimelineEngine,
    revenueEngine: RevenueEngine,
    profitCalculationEngine: ProfitCalculationEngine,
    loyaltyProgrammeEngine: LoyaltyProgrammeEngine,
    customerRiskEngine: CustomerRiskEngine,
    options: CustomerLifetimeValueEngineOptions = {},
  ) {
    const config = buildCustomerLifetimeValueEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CustomerLifetimeValueManager(
      identityEngine,
      crmFoundation,
      timelineEngine,
      revenueEngine,
      profitCalculationEngine,
      loyaltyProgrammeEngine,
      customerRiskEngine,
    );
    this.controller = new CustomerLifetimeValueController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CustomerLifetimeValueEngineState> {
    const doc = await this.reader.readText(CUSTOMER_LIFETIME_VALUE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Customer Lifetime Value Engine")) {
      throw new Error(
        `${CUSTOMER_LIFETIME_VALUE_ENGINE_SYSTEM_PATH} missing — CLV Engine requires R4-15 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendClveLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-15 Customer Lifetime Value Engine initialized",
    });
    return this.getState();
  }

  getState(): CustomerLifetimeValueEngineState {
    if (!this.initializedAt) {
      throw new Error("Customer Lifetime Value Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const clvRecords = this.controller.getManager().getClvRecords();
    const insights = this.controller.getManager().getRegistry().listInsights();
    const highValueCustomers = new Set(
      insights.filter((i) => i.insightType === "high_value").map((i) => i.customerId),
    ).size;
    const decliningValueCustomers = new Set(
      insights.filter((i) => i.insightType === "declining_value").map((i) => i.customerId),
    ).size;

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalClvRecords: clvRecords.length,
      highValueCustomers,
      decliningValueCustomers,
      failedRecords: clvRecords.filter((r) => r.validationStatus === "failed").length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CLVE-001",
      missionId: "R4-15",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectClvEngine(input: ConnectClvEngineInput = {}): ClvRunReport {
    return this.controller.connectClvEngine(input);
  }

  calculateCustomerLifetimeValue(input: CalculateCustomerLifetimeValueInput): ClvRunReport {
    return this.controller.calculateCustomerLifetimeValue(input);
  }

  trackCustomerRevenueContribution(input: TrackCustomerRevenueInput): ClvRunReport {
    return this.controller.trackCustomerRevenueContribution(input);
  }

  trackCustomerProfitability(input: TrackCustomerProfitabilityInput): ClvRunReport {
    return this.controller.trackCustomerProfitability(input);
  }

  trackCustomerRetention(input: TrackCustomerRetentionInput): ClvRunReport {
    return this.controller.trackCustomerRetention(input);
  }

  trackPurchaseFrequency(input: TrackPurchaseFrequencyInput): ClvRunReport {
    return this.controller.trackPurchaseFrequency(input);
  }

  trackAverageOrderValue(input: TrackAverageOrderValueInput): ClvRunReport {
    return this.controller.trackAverageOrderValue(input);
  }

  predictFutureCustomerValue(input: PredictFutureCustomerValueInput): ClvRunReport {
    return this.controller.predictFutureCustomerValue(input);
  }

  identifyHighValueCustomers(input: IdentifyHighValueCustomersInput = {}): ClvRunReport {
    return this.controller.identifyHighValueCustomers(input);
  }

  identifyDecliningCustomerValue(input: IdentifyDecliningCustomerValueInput = {}): ClvRunReport {
    return this.controller.identifyDecliningCustomerValue(input);
  }

  detectClvFailures(input: DetectClvFailuresInput = {}): ClvRunReport {
    return this.controller.detectClvFailures(input);
  }

  reportClvStatus(): ClvRunReport {
    return this.controller.reportClvStatus();
  }

  reportClvHealth(): ClvRunReport {
    return this.controller.reportClvHealth();
  }

  getLatestReport(): ClvRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getClvRecords() {
    return this.controller.getManager().getClvRecords();
  }

  getInsights() {
    return this.controller.getManager().getRegistry().listInsights();
  }

  getFailures() {
    return this.controller.getManager().getRegistry().listFailures();
  }

  getMachineReadableRecord(clvRecordId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getRecord(clvRecordId);
    if (!record) return null;
    return this.controller.getManager().getMetadataGenerator().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<CustomerLifetimeValueEngineConfiguration>,
  ): CustomerLifetimeValueEngineState {
    const next = buildCustomerLifetimeValueEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `CLV status: ${state.status}`,
        `Records: ${state.health.totalClvRecords} · High-value: ${state.health.highValueCustomers}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No CLV operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ClvCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalClvRecords: state.health.totalClvRecords,
      highValueCustomers: state.health.highValueCustomers,
      decliningValueCustomers: state.health.decliningValueCustomers,
      identityEngineConnected: record?.identityEngineConnected ?? false,
      crmFoundationConnected: record?.crmFoundationConnected ?? false,
      revenueEngineConnected: record?.revenueEngineConnected ?? false,
      recentLogs: getClveLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCustomerLifetimeValueEngine(
  bootstrap: EmpireBootstrapContext,
  identityEngine: CustomerIdentityEngine,
  crmFoundation: CrmFoundationEngine,
  timelineEngine: CustomerTimelineEngine,
  revenueEngine: RevenueEngine,
  profitCalculationEngine: ProfitCalculationEngine,
  loyaltyProgrammeEngine: LoyaltyProgrammeEngine,
  customerRiskEngine: CustomerRiskEngine,
  options?: CustomerLifetimeValueEngineOptions,
): CustomerLifetimeValueEngine {
  return new CustomerLifetimeValueEngine(
    bootstrap,
    identityEngine,
    crmFoundation,
    timelineEngine,
    revenueEngine,
    profitCalculationEngine,
    loyaltyProgrammeEngine,
    customerRiskEngine,
    options,
  );
}

export function resetCustomerLifetimeValueEngineForTesting(): void {
  resetClveLogsForTesting();
  new CustomerLifetimeValueManager(null, null, null, null, null, null, null).resetForTesting();
}
