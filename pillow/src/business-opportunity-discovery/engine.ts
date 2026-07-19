import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBusinessOpportunityDiscoveryConfiguration,
  type BusinessOpportunityDiscoveryConfiguration,
} from "./configuration.js";
import { appendBodLog, getBodLogs, resetBodLogsForTesting } from "./bod-logging.js";
import { BUSINESS_OPPORTUNITY_DISCOVERY_SYSTEM_PATH } from "./paths.js";
import type {
  BusinessOpportunityDiscoveryState,
  ConnectBusinessOpportunityDiscoveryInput,
  DiscoverOpportunitiesInput,
  OpportunityActionInput,
  OpportunityCockpitSnapshot,
  OpportunityRunReport,
} from "./types.js";
import { BusinessOpportunityDiscoveryController } from "./business-opportunity-discovery-controller.js";
import {
  BusinessOpportunityDiscoveryManager,
  type BusinessOpportunityDiscoveryDependencies,
} from "./business-opportunity-discovery-manager.js";

export interface BusinessOpportunityDiscoveryOptions {
  configuration?: Partial<BusinessOpportunityDiscoveryConfiguration>;
}

export type { BusinessOpportunityDiscoveryDependencies };

/**
 * Business Opportunity Discovery (PILLOW-BOD-001 / X1-02).
 * Continuously discovers profitable opportunities — structural signals only.
 */
export class BusinessOpportunityDiscovery {
  private initializedAt: string | null = null;
  private readonly controller: BusinessOpportunityDiscoveryController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: BusinessOpportunityDiscoveryDependencies,
    options: BusinessOpportunityDiscoveryOptions = {},
  ) {
    const config = buildBusinessOpportunityDiscoveryConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new BusinessOpportunityDiscoveryManager(dependencies);
    this.controller = new BusinessOpportunityDiscoveryController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<BusinessOpportunityDiscoveryState> {
    const doc = await this.reader.readText(BUSINESS_OPPORTUNITY_DISCOVERY_SYSTEM_PATH);
    if (!doc?.includes("Business Opportunity Discovery")) {
      throw new Error(
        `${BUSINESS_OPPORTUNITY_DISCOVERY_SYSTEM_PATH} missing — requires X1-02 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendBodLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-02 Business Opportunity Discovery initialized",
    });
    return this.getState();
  }

  getState(): BusinessOpportunityDiscoveryState {
    if (!this.initializedAt) {
      throw new Error(
        "Business Opportunity Discovery not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const opportunities = this.controller.getManager().getOpportunityRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalOpportunityRecords: opportunities.length,
      averageOpportunityScore: this.controller.getManager().averageOpportunityScore(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-BOD-001",
      missionId: "X1-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectBusinessOpportunityDiscovery(
    input: ConnectBusinessOpportunityDiscoveryInput = {},
  ): OpportunityRunReport {
    return this.controller.connectBusinessOpportunityDiscovery(input);
  }

  discoverOpportunities(input: DiscoverOpportunitiesInput = {}): OpportunityRunReport {
    return this.controller.discoverOpportunities(input);
  }

  monitorMarketTrends(input: OpportunityActionInput = {}): OpportunityRunReport {
    return this.controller.monitorMarketTrends(input);
  }

  monitorEmergingIndustries(input: OpportunityActionInput = {}): OpportunityRunReport {
    return this.controller.monitorEmergingIndustries(input);
  }

  monitorCustomerDemand(input: OpportunityActionInput = {}): OpportunityRunReport {
    return this.controller.monitorCustomerDemand(input);
  }

  monitorCompetitorActivity(input: OpportunityActionInput = {}): OpportunityRunReport {
    return this.controller.monitorCompetitorActivity(input);
  }

  identifyUnderservedMarkets(input: OpportunityActionInput = {}): OpportunityRunReport {
    return this.controller.identifyUnderservedMarkets(input);
  }

  identifyProfitableNiches(input: OpportunityActionInput = {}): OpportunityRunReport {
    return this.controller.identifyProfitableNiches(input);
  }

  scoreOpportunities(input: OpportunityActionInput = {}): OpportunityRunReport {
    return this.controller.scoreOpportunities(input);
  }

  rankOpportunities(input: OpportunityActionInput = {}): OpportunityRunReport {
    return this.controller.rankOpportunities(input);
  }

  getLatestReport(): OpportunityRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getOpportunityRecords() {
    return this.controller.getManager().getOpportunityRecords();
  }

  updateConfiguration(
    overrides: Partial<BusinessOpportunityDiscoveryConfiguration>,
  ): BusinessOpportunityDiscoveryState {
    const next = buildBusinessOpportunityDiscoveryConfiguration(this.bootstrap.repositoryRoot, {
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
        `Business Opportunity Discovery status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No opportunity discovery operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): OpportunityCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const dependenciesConnected = record
      ? Object.values(record.dependencyPresence).filter(Boolean).length
      : 0;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalOpportunityRecords: state.health.totalOpportunityRecords,
      averageOpportunityScore: state.health.averageOpportunityScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getBodLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createBusinessOpportunityDiscovery(
  bootstrap: EmpireBootstrapContext,
  dependencies: BusinessOpportunityDiscoveryDependencies,
  options?: BusinessOpportunityDiscoveryOptions,
): BusinessOpportunityDiscovery {
  return new BusinessOpportunityDiscovery(bootstrap, dependencies, options);
}

export function resetBusinessOpportunityDiscoveryForTesting(): void {
  resetBodLogsForTesting();
  new BusinessOpportunityDiscoveryManager({
    companyFactoryFramework: null,
  }).resetForTesting();
}
