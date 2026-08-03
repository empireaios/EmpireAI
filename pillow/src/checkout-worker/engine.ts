import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCheckoutWorkerConfiguration,
  type CheckoutWorkerConfiguration,
} from "./configuration.js";
import type { CheckoutWorkerDependencies } from "./integrations.js";
import { CheckoutWorkerController } from "./checkout-worker-controller.js";
import { resetCkwLogsForTesting } from "./ckw-logging.js";
import { CHECKOUT_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetCheckoutSequenceForTesting } from "./checkout-builder.js";
import { CheckoutManager } from "./checkout-manager.js";
import type {
  CheckoutWorkerCockpitSnapshot,
  CheckoutWorkerInput,
  CheckoutWorkerState,
} from "./types.js";

export interface CheckoutWorkerOptions {
  configuration?: Partial<CheckoutWorkerConfiguration>;
  dependencies?: CheckoutWorkerDependencies;
}

/** Authoritative Q5-09 Checkout Worker — checkout preparation (structural signals). */
export class CheckoutWorker {
  private initializedAt: string | null = null;
  private readonly controller: CheckoutWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: CheckoutWorkerOptions = {},
  ) {
    const manager = new CheckoutManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new CheckoutWorkerController(
      manager,
      buildCheckoutWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      CHECKOUT_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Checkout Worker")) {
      throw new Error(
        `${CHECKOUT_WORKER_SYSTEM_PATH} missing — Q5-09 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: CheckoutWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): CheckoutWorkerState {
    if (!this.initializedAt) {
      throw new Error("Checkout Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-CKW-001",
      missionId: "Q5-09",
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
        totalCheckouts: engineRecord?.totalCheckouts ?? 0,
        lastCheckoutId: engineRecord?.lastCheckoutId ?? null,
        lastCheckoutFlowType: engineRecord?.lastCheckoutFlowType ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Checkout Worker prepares checkout workflows only: does not charge customers, execute payment transactions, deliver products, publish storefronts, store sensitive payment credentials, override Pillow or Grand King, or implement Q5-10 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedDigitalProductInformation(input: CheckoutWorkerInput = {}) {
    return this.controller.receiveApprovedDigitalProductInformation(input);
  }

  generateCheckoutWorkflow(input: CheckoutWorkerInput = {}) {
    return this.controller.generateCheckoutWorkflow(input);
  }

  preparePaymentProviderConfiguration(input: CheckoutWorkerInput = {}) {
    return this.controller.preparePaymentProviderConfiguration(input);
  }

  generateOrderSummary(input: CheckoutWorkerInput = {}) {
    return this.controller.generateOrderSummary(input);
  }

  generateCustomerConfirmationWorkflow(input: CheckoutWorkerInput = {}) {
    return this.controller.generateCustomerConfirmationWorkflow(input);
  }

  validateRequiredPurchaseInformation(input: CheckoutWorkerInput = {}) {
    return this.controller.validateRequiredPurchaseInformation(input);
  }

  preparePostPaymentHandoff(input: CheckoutWorkerInput = {}) {
    return this.controller.preparePostPaymentHandoff(input);
  }

  configurePaymentProviderAbstraction(input: CheckoutWorkerInput = {}) {
    return this.controller.configurePaymentProviderAbstraction(input);
  }

  validateCheckoutReadiness(input: CheckoutWorkerInput = {}) {
    return this.controller.validateCheckoutReadiness(input);
  }

  produceCheckoutReport(input: CheckoutWorkerInput = {}) {
    return this.controller.produceCheckoutReport(input);
  }

  submitReport(input: CheckoutWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: CheckoutWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getCheckouts() {
    return this.controller.getManager().getCheckouts();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestCheckoutId() {
    return this.controller.getManager().getLatestCheckoutId();
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
        `Checkouts: ${state.health.totalCheckouts}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CheckoutWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q5-09",
      status: state.status,
      healthStatus: state.health.status,
      totalCheckouts: state.health.totalCheckouts,
      latestCheckoutId: this.getLatestCheckoutId(),
      lastCheckoutFlowType: state.health.lastCheckoutFlowType,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverChargeCustomers: true,
      neverExecutePaymentTransactions: true,
      neverDeliverProducts: true,
      neverPublishStorefronts: true,
      neverStoreSensitivePaymentCredentials: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createCheckoutWorker(
  bootstrap: EmpireBootstrapContext,
  options?: CheckoutWorkerOptions,
) {
  return new CheckoutWorker(bootstrap, options);
}

export function resetCheckoutWorkerForTesting() {
  resetCkwLogsForTesting();
  resetCheckoutSequenceForTesting();
}
