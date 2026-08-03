import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildDigitalDeliveryWorkerConfiguration,
  type DigitalDeliveryWorkerConfiguration,
} from "./configuration.js";
import type { DigitalDeliveryWorkerDependencies } from "./integrations.js";
import { DigitalDeliveryWorkerController } from "./digital-delivery-worker-controller.js";
import { resetDdwLogsForTesting } from "./ddw-logging.js";
import { DIGITAL_DELIVERY_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetDeliverySequenceForTesting } from "./digital-delivery-builder.js";
import { DigitalDeliveryManager } from "./digital-delivery-manager.js";
import type {
  DigitalDeliveryWorkerCockpitSnapshot,
  DigitalDeliveryWorkerInput,
  DigitalDeliveryWorkerState,
} from "./types.js";

export interface DigitalDeliveryWorkerOptions {
  configuration?: Partial<DigitalDeliveryWorkerConfiguration>;
  dependencies?: DigitalDeliveryWorkerDependencies;
}

/** Authoritative Q5-10 Digital Delivery Worker — fulfilment (structural signals). */
export class DigitalDeliveryWorker {
  private initializedAt: string | null = null;
  private readonly controller: DigitalDeliveryWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: DigitalDeliveryWorkerOptions = {},
  ) {
    const manager = new DigitalDeliveryManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new DigitalDeliveryWorkerController(
      manager,
      buildDigitalDeliveryWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      DIGITAL_DELIVERY_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Digital Delivery Worker")) {
      throw new Error(
        `${DIGITAL_DELIVERY_WORKER_SYSTEM_PATH} missing — Q5-10 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: DigitalDeliveryWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): DigitalDeliveryWorkerState {
    if (!this.initializedAt) {
      throw new Error("Digital Delivery Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-DDW-001",
      missionId: "Q5-10",
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
        totalDeliveries: engineRecord?.totalDeliveries ?? 0,
        lastDeliveryId: engineRecord?.lastDeliveryId ?? null,
        lastDeliveryType: engineRecord?.lastDeliveryType ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Digital Delivery Worker fulfils verified digital purchases only: does not process payments, create products, publish storefronts, expose unauthorized access, override Pillow or Grand King, or implement Q5-11 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveValidatedCheckoutCompletion(input: DigitalDeliveryWorkerInput = {}) {
    return this.controller.receiveValidatedCheckoutCompletion(input);
  }

  verifyFulfilmentEligibility(input: DigitalDeliveryWorkerInput = {}) {
    return this.controller.verifyFulfilmentEligibility(input);
  }

  deliverPurchasedDigitalAssets(input: DigitalDeliveryWorkerInput = {}) {
    return this.controller.deliverPurchasedDigitalAssets(input);
  }

  grantProductAccess(input: DigitalDeliveryWorkerInput = {}) {
    return this.controller.grantProductAccess(input);
  }

  generateSecureDownloadLinks(input: DigitalDeliveryWorkerInput = {}) {
    return this.controller.generateSecureDownloadLinks(input);
  }

  trackDeliveryStatus(input: DigitalDeliveryWorkerInput = {}) {
    return this.controller.trackDeliveryStatus(input);
  }

  handleDeliveryRetries(input: DigitalDeliveryWorkerInput = {}) {
    return this.controller.handleDeliveryRetries(input);
  }

  detectFulfilmentFailures(input: DigitalDeliveryWorkerInput = {}) {
    return this.controller.detectFulfilmentFailures(input);
  }

  produceCustomerDeliveryConfirmations(input: DigitalDeliveryWorkerInput = {}) {
    return this.controller.produceCustomerDeliveryConfirmations(input);
  }

  produceDigitalDeliveryReport(input: DigitalDeliveryWorkerInput = {}) {
    return this.controller.produceDigitalDeliveryReport(input);
  }

  submitReport(input: DigitalDeliveryWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: DigitalDeliveryWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getDeliveries() {
    return this.controller.getManager().getDeliveries();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestDeliveryId() {
    return this.controller.getManager().getLatestDeliveryId();
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
        `Deliveries: ${state.health.totalDeliveries}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DigitalDeliveryWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q5-10",
      status: state.status,
      healthStatus: state.health.status,
      totalDeliveries: state.health.totalDeliveries,
      latestDeliveryId: this.getLatestDeliveryId(),
      lastDeliveryType: state.health.lastDeliveryType,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverProcessPayments: true,
      neverCreateProducts: true,
      neverPublishStorefronts: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ511OrLater: true,
      neverExposeUnauthorizedAccess: true,
    };
  }
}

export function createDigitalDeliveryWorker(
  bootstrap: EmpireBootstrapContext,
  options?: DigitalDeliveryWorkerOptions,
) {
  return new DigitalDeliveryWorker(bootstrap, options);
}

export function resetDigitalDeliveryWorkerForTesting() {
  resetDdwLogsForTesting();
  resetDeliverySequenceForTesting();
}
