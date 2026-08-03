import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSupplierDiscoveryWorkerConfiguration,
  type SupplierDiscoveryWorkerConfiguration,
} from "./configuration.js";
import type { SupplierDiscoveryWorkerDependencies } from "./integrations.js";
import { SupplierDiscoveryWorkerController } from "./supplier-discovery-worker-controller.js";
import { resetSdwLogsForTesting } from "./sdw-logging.js";
import { SUPPLIER_DISCOVERY_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetDiscoverySequenceForTesting } from "./discovery-builder.js";
import { DiscoveryManager } from "./discovery-manager.js";
import type {
  SupplierDiscoveryWorkerCockpitSnapshot,
  SupplierDiscoveryWorkerInput,
  SupplierDiscoveryWorkerState,
} from "./types.js";

export interface SupplierDiscoveryWorkerOptions {
  configuration?: Partial<SupplierDiscoveryWorkerConfiguration>;
  dependencies?: SupplierDiscoveryWorkerDependencies;
}

/** Authoritative Q3-04 Supplier Discovery Worker — discovery only. */
export class SupplierDiscoveryWorker {
  private initializedAt: string | null = null;
  private readonly controller: SupplierDiscoveryWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: SupplierDiscoveryWorkerOptions = {},
  ) {
    const manager = new DiscoveryManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new SupplierDiscoveryWorkerController(
      manager,
      buildSupplierDiscoveryWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      SUPPLIER_DISCOVERY_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Supplier Discovery Worker")) {
      throw new Error(
        `${SUPPLIER_DISCOVERY_WORKER_SYSTEM_PATH} missing — Q3-04 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: SupplierDiscoveryWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): SupplierDiscoveryWorkerState {
    if (!this.initializedAt) {
      throw new Error("Supplier Discovery Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-SDW-001",
      missionId: "Q3-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalDiscoveries: engineRecord?.totalDiscoveries ?? 0,
        lastDiscoveryId: engineRecord?.lastDiscoveryId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Discovery-only: does not evaluate/negotiate/select suppliers, place orders, modify supplier data, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectSupplierDiscoveryWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedProducts(input: SupplierDiscoveryWorkerInput = {}) {
    return this.controller.receiveApprovedProducts(input);
  }

  searchApprovedSupplierPlatforms(input: SupplierDiscoveryWorkerInput = {}) {
    return this.controller.searchPlatforms(input);
  }

  searchIntegratedSupplierApis(input: SupplierDiscoveryWorkerInput = {}) {
    return this.controller.searchApis(input);
  }

  discoverSupplierCandidates(input: SupplierDiscoveryWorkerInput = {}) {
    return this.controller.discoverCandidates(input);
  }

  captureSupplierProductInformation(input: SupplierDiscoveryWorkerInput = {}) {
    return this.controller.captureProductInformation(input);
  }

  capturePricingInformation(input: SupplierDiscoveryWorkerInput = {}) {
    return this.controller.capturePricing(input);
  }

  captureMoqInformation(input: SupplierDiscoveryWorkerInput = {}) {
    return this.controller.captureMoq(input);
  }

  captureShippingAvailability(input: SupplierDiscoveryWorkerInput = {}) {
    return this.controller.captureShipping(input);
  }

  captureSupplierLocation(input: SupplierDiscoveryWorkerInput = {}) {
    return this.controller.captureLocation(input);
  }

  produceSupplierDiscoveryReport(input: SupplierDiscoveryWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitFindings(input: SupplierDiscoveryWorkerInput = {}) {
    return this.controller.submitFindings(input);
  }

  listSupplierDiscoveryReports() {
    return this.controller.list();
  }

  validateSupplierDiscoveryWorker(input: SupplierDiscoveryWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getDiscoveries() {
    return this.controller.getManager().getDiscoveries();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestDiscoveryId() {
    return this.controller.getManager().getLatestDiscoveryId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Discoveries: ${state.health.totalDiscoveries}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SupplierDiscoveryWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-04",
      status: state.status,
      healthStatus: state.health.status,
      totalDiscoveries: state.health.totalDiscoveries,
      latestDiscoveryId: this.getLatestDiscoveryId(),
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverEvaluateSuppliers: true,
      neverNegotiateSuppliers: true,
      neverSelectSuppliers: true,
      neverPlaceOrders: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createSupplierDiscoveryWorker(
  bootstrap: EmpireBootstrapContext,
  options?: SupplierDiscoveryWorkerOptions,
) {
  return new SupplierDiscoveryWorker(bootstrap, options);
}

export function resetSupplierDiscoveryWorkerForTesting() {
  resetSdwLogsForTesting();
  resetDiscoverySequenceForTesting();
}
