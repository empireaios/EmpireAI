import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { AmazonMarketplaceIntegrationEngine } from "../amazon-marketplace-integration/engine.js";
import type { AmazonProductIntelligenceEngine } from "../amazon-product-intelligence/engine.js";
import {
  buildAmazonOrderManagementConfiguration,
  type AmazonOrderManagementConfiguration,
} from "./configuration.js";
import {
  appendOrderLog,
  getOrderLogs,
  resetOrderLogsForTesting,
} from "./amzord-logging.js";
import { AMAZON_ORDER_MANAGEMENT_SYSTEM_PATH } from "./paths.js";
import type {
  AmazonOrderCockpitSnapshot,
  AmazonOrderSyncReport,
  AmazonOrderManagementState,
  FetchAmazonOrderInput,
  ProcessAmazonOrderEventInput,
  SyncAmazonOrdersInput,
} from "./types.js";
import { AmazonOrderManagementController } from "./amazon-order-management-controller.js";
import { AmazonOrderManagementManager } from "./amazon-order-management-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface AmazonOrderManagementOptions {
  configuration?: Partial<AmazonOrderManagementConfiguration>;
}

/**
 * Amazon Order Management (PILLOW-AMZO-001 / R1-04).
 * Amazon order lifecycle processing — consumes R1-02 connector and R1-03 product intelligence.
 */
export class AmazonOrderManagementEngine {
  private initializedAt: string | null = null;
  private readonly controller: AmazonOrderManagementController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    amazonIntegration: AmazonMarketplaceIntegrationEngine,
    productIntelligence: AmazonProductIntelligenceEngine,
    options: AmazonOrderManagementOptions = {},
  ) {
    const config = buildAmazonOrderManagementConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AmazonOrderManagementManager(amazonIntegration, productIntelligence);
    this.controller = new AmazonOrderManagementController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AmazonOrderManagementState> {
    const doc = await this.reader.readText(AMAZON_ORDER_MANAGEMENT_SYSTEM_PATH);
    if (!doc?.includes("Amazon Order Management")) {
      throw new Error(
        `${AMAZON_ORDER_MANAGEMENT_SYSTEM_PATH} missing — Amazon Order Management requires R1-04 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendOrderLog({
      event: "engine_initialization",
      level: "info",
      details: "R1-04 Amazon Order Management initialized",
    });
    return this.getState();
  }

  getState(): AmazonOrderManagementState {
    if (!this.initializedAt) {
      throw new Error("Amazon Order Management not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const orders = this.controller.getManager().getOrders();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      orders,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-AMZO-001",
      missionId: "R1-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      orders,
      health,
      performance,
    };
  }

  async syncAmazonOrders(input: SyncAmazonOrdersInput = {}): Promise<AmazonOrderSyncReport> {
    return this.controller.syncAmazonOrders(input);
  }

  async fetchAmazonOrder(input: FetchAmazonOrderInput): Promise<AmazonOrderSyncReport> {
    return this.controller.fetchAmazonOrder(input);
  }

  processOrderEvent(input: ProcessAmazonOrderEventInput): AmazonOrderSyncReport {
    return this.controller.processOrderEvent(input);
  }

  getLatestReport(): AmazonOrderSyncReport | null {
    return this.controller.getLatestReport();
  }

  getOrders() {
    return this.controller.getManager().getOrders();
  }

  configureOrderFixture(
    options: Parameters<AmazonOrderManagementManager["setFixtureOptionsForTesting"]>[0],
  ): void {
    this.controller.getManager().setFixtureOptionsForTesting(options);
  }

  updateConfiguration(
    overrides: Partial<AmazonOrderManagementConfiguration>,
  ): AmazonOrderManagementState {
    const next = buildAmazonOrderManagementConfiguration(this.bootstrap.repositoryRoot, {
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
        `Order management status: ${state.status}`,
        `Order count: ${state.orders.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No order sync operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AmazonOrderCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      orderCount: state.orders.length,
      lastSyncAt: state.health.lastSyncAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      newOrdersDetected: state.performance.newOrdersDetected,
      cancelledOrdersDetected: state.performance.cancelledOrdersDetected,
      fulfilledOrdersDetected: state.performance.fulfilledOrdersDetected,
      recentLogs: getOrderLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAmazonOrderManagementEngine(
  bootstrap: EmpireBootstrapContext,
  amazonIntegration: AmazonMarketplaceIntegrationEngine,
  productIntelligence: AmazonProductIntelligenceEngine,
  options?: AmazonOrderManagementOptions,
): AmazonOrderManagementEngine {
  return new AmazonOrderManagementEngine(
    bootstrap,
    amazonIntegration,
    productIntelligence,
    options,
  );
}

export function resetAmazonOrderManagementForTesting(): void {
  resetOrderLogsForTesting();
  new AmazonOrderManagementManager(null, null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
