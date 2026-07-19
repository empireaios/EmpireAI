import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCustomerIdentityEngineConfiguration,
  type CustomerIdentityEngineConfiguration,
} from "./configuration.js";
import { appendCieLog, getCieLogs, resetCieLogsForTesting } from "./cie-logging.js";
import { CUSTOMER_IDENTITY_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectCustomerIdentityEngineInput,
  CreateCustomerIdentityInput,
  CustomerIdentityCockpitSnapshot,
  CustomerIdentityEngineState,
  CustomerIdentityRunReport,
  DetectDuplicateIdentitiesInput,
  LinkCustomerIdentityInput,
  MergeCustomerIdentitiesInput,
  ResolveCustomerIdentityInput,
} from "./types.js";
import { CustomerIdentityController } from "./customer-identity-controller.js";
import { CustomerIdentityManager } from "./customer-identity-manager.js";

export interface CustomerIdentityEngineOptions {
  configuration?: Partial<CustomerIdentityEngineConfiguration>;
}

/**
 * Customer Identity Engine (PILLOW-CIE-001 / R4-01).
 * Unified customer identity platform for Customer Operations.
 */
export class CustomerIdentityEngine {
  private initializedAt: string | null = null;
  private readonly controller: CustomerIdentityController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    options: CustomerIdentityEngineOptions = {},
  ) {
    const config = buildCustomerIdentityEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CustomerIdentityManager();
    this.controller = new CustomerIdentityController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CustomerIdentityEngineState> {
    const doc = await this.reader.readText(CUSTOMER_IDENTITY_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Customer Identity Engine")) {
      throw new Error(
        `${CUSTOMER_IDENTITY_ENGINE_SYSTEM_PATH} missing — Customer Identity Engine requires R4-01 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCieLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-01 Customer Identity Engine initialized",
    });
    return this.getState();
  }

  getState(): CustomerIdentityEngineState {
    if (!this.initializedAt) {
      throw new Error("Customer Identity Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const customerRecords = this.controller.getManager().getCustomerRecords();
    const profileEngine = this.controller.getManager().getProfileEngine();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCustomerRecords: customerRecords.length,
      activeIdentities: profileEngine.countActive(this.controller.getManager().getRegistry()),
      mergedIdentities: profileEngine.countMerged(this.controller.getManager().getRegistry()),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CIE-001",
      missionId: "R4-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCustomerIdentityEngine(
    input: ConnectCustomerIdentityEngineInput = {},
  ): CustomerIdentityRunReport {
    return this.controller.connectCustomerIdentityEngine(input);
  }

  createCustomerIdentity(input: CreateCustomerIdentityInput = {}): CustomerIdentityRunReport {
    return this.controller.createCustomerIdentity(input);
  }

  linkCustomerIdentity(input: LinkCustomerIdentityInput): CustomerIdentityRunReport {
    return this.controller.linkCustomerIdentity(input);
  }

  detectDuplicateIdentities(
    input: DetectDuplicateIdentitiesInput = {},
  ): CustomerIdentityRunReport {
    return this.controller.detectDuplicateIdentities(input);
  }

  mergeCustomerIdentities(input: MergeCustomerIdentitiesInput): CustomerIdentityRunReport {
    return this.controller.mergeCustomerIdentities(input);
  }

  resolveCustomerIdentity(input: ResolveCustomerIdentityInput): CustomerIdentityRunReport {
    return this.controller.resolveCustomerIdentity(input);
  }

  getLatestReport(): CustomerIdentityRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getCustomerRecords() {
    return this.controller.getManager().getCustomerRecords();
  }

  getMachineReadableRecord(customerId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().get(customerId);
    if (!record) return null;
    return this.controller.getManager().getProfileEngine().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<CustomerIdentityEngineConfiguration>,
  ): CustomerIdentityEngineState {
    const next = buildCustomerIdentityEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Customer identity status: ${state.status}`,
        `Active identities: ${state.health.activeIdentities}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No identity operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CustomerIdentityCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalCustomerRecords: state.health.totalCustomerRecords,
      activeIdentities: state.health.activeIdentities,
      recentLogs: getCieLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCustomerIdentityEngine(
  bootstrap: EmpireBootstrapContext,
  options?: CustomerIdentityEngineOptions,
): CustomerIdentityEngine {
  return new CustomerIdentityEngine(bootstrap, options);
}

export function resetCustomerIdentityEngineForTesting(): void {
  resetCieLogsForTesting();
  new CustomerIdentityManager().resetForTesting();
}
