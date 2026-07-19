import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSupplierFrameworkConfiguration,
  type SupplierFrameworkConfiguration,
} from "./configuration.js";
import {
  appendFrameworkLog,
  getFrameworkLogs,
  resetFrameworkLogsForTesting,
} from "./sf-logging.js";
import { SUPPLIER_FRAMEWORK_SYSTEM_PATH } from "./paths.js";
import type {
  AbstractSupplierDataInput,
  FrameworkCockpitSnapshot,
  FrameworkRunReport,
  RegisterSupplierInput,
  RouteSupplierEventInput,
  RunDiagnosticsInput,
  SupplierFrameworkState,
} from "./types.js";
import { SupplierFrameworkController } from "./supplier-framework-controller.js";
import { SupplierFrameworkManager } from "./supplier-framework-manager.js";

export interface SupplierFrameworkEngineOptions {
  configuration?: Partial<SupplierFrameworkConfiguration>;
}

/**
 * Supplier Framework (PILLOW-SF-001 / R2-01).
 * Unified supplier connector architecture — framework only, no live supplier APIs.
 */
export class SupplierFrameworkEngine {
  private initializedAt: string | null = null;
  private readonly controller: SupplierFrameworkController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    options: SupplierFrameworkEngineOptions = {},
  ) {
    const config = buildSupplierFrameworkConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new SupplierFrameworkController(config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SupplierFrameworkState> {
    const doc = await this.reader.readText(SUPPLIER_FRAMEWORK_SYSTEM_PATH);
    if (!doc?.includes("Supplier Framework")) {
      throw new Error(
        `${SUPPLIER_FRAMEWORK_SYSTEM_PATH} missing — Supplier Framework requires R2-01 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendFrameworkLog({
      event: "supplier_framework_ready",
      level: "info",
      details: "R2-01 Supplier Framework initialized",
    });
    return this.getState();
  }

  getState(): SupplierFrameworkState {
    if (!this.initializedAt) {
      throw new Error("Supplier Framework not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const suppliers = this.controller.getManager().getSuppliers();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      suppliers,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SF-001",
      missionId: "R2-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      registeredSuppliers: suppliers,
      health,
      performance,
    };
  }

  registerSupplier(input: RegisterSupplierInput): FrameworkRunReport {
    return this.controller.registerSupplier(input);
  }

  activateSupplier(supplierIdentifier: string): FrameworkRunReport {
    return this.controller.activateSupplier(supplierIdentifier);
  }

  suspendSupplier(supplierIdentifier: string): FrameworkRunReport {
    return this.controller.suspendSupplier(supplierIdentifier);
  }

  shutdownSupplier(supplierIdentifier: string): FrameworkRunReport {
    return this.controller.shutdownSupplier(supplierIdentifier);
  }

  routeSupplierEvent(input: RouteSupplierEventInput): FrameworkRunReport {
    return this.controller.routeSupplierEvent(input);
  }

  abstractSupplierData(input: AbstractSupplierDataInput): FrameworkRunReport {
    return this.controller.abstractSupplierData(input);
  }

  runDiagnostics(input: RunDiagnosticsInput = {}): FrameworkRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): FrameworkRunReport | null {
    return this.controller.getLatestReport();
  }

  getRegisteredSuppliers() {
    return this.controller.getManager().getSuppliers();
  }

  updateConfiguration(
    overrides: Partial<SupplierFrameworkConfiguration>,
  ): SupplierFrameworkState {
    const next = buildSupplierFrameworkConfiguration(this.bootstrap.repositoryRoot, {
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
        `Framework status: ${state.status}`,
        `Registered suppliers: ${state.registeredSuppliers.length}`,
        `Active suppliers: ${state.health.activeSuppliers}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No framework operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): FrameworkCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      registeredSupplierCount: state.registeredSuppliers.length,
      activeSupplierCount: state.health.activeSuppliers,
      totalEventsRouted: state.performance.totalEventsRouted,
      rateLimitedEvents: state.performance.rateLimitedEvents,
      recoveryAttempts: state.health.recoveryAttempts,
      recentLogs: getFrameworkLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createSupplierFrameworkEngine(
  bootstrap: EmpireBootstrapContext,
  options?: SupplierFrameworkEngineOptions,
): SupplierFrameworkEngine {
  return new SupplierFrameworkEngine(bootstrap, options);
}

export function resetSupplierFrameworkForTesting(): void {
  resetFrameworkLogsForTesting();
  new SupplierFrameworkManager().resetForTesting();
}
