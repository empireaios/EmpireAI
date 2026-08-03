import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildDigitalProductsFactoryCoreConfiguration,
  type DigitalProductsFactoryCoreConfiguration,
} from "./configuration.js";
import type { DigitalProductsFactoryCoreDependencies } from "./integrations.js";
import { DigitalProductsFactoryCoreController } from "./digital-products-factory-core-controller.js";
import { resetDpfLogsForTesting } from "./dpf-logging.js";
import { DIGITAL_PRODUCTS_FACTORY_CORE_SYSTEM_PATH } from "./paths.js";
import { resetMissionSequenceForTesting } from "./mission-builder.js";
import { DigitalProductsFactoryManager } from "./factory-manager.js";
import type {
  DigitalProductsFactoryCoreCockpitSnapshot,
  DigitalProductsFactoryCoreInput,
  DigitalProductsFactoryCoreState,
} from "./types.js";

export interface DigitalProductsFactoryCoreOptions {
  configuration?: Partial<DigitalProductsFactoryCoreConfiguration>;
  dependencies?: DigitalProductsFactoryCoreDependencies;
}

/** Authoritative Q5-01 Digital Products Factory Core — executive orchestration only. */
export class DigitalProductsFactoryCore {
  private initializedAt: string | null = null;
  private readonly controller: DigitalProductsFactoryCoreController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: DigitalProductsFactoryCoreOptions = {},
  ) {
    const manager = new DigitalProductsFactoryManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new DigitalProductsFactoryCoreController(
      manager,
      buildDigitalProductsFactoryCoreConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      DIGITAL_PRODUCTS_FACTORY_CORE_SYSTEM_PATH,
    );
    if (!doc?.includes("Digital Products Factory Core")) {
      throw new Error(
        `${DIGITAL_PRODUCTS_FACTORY_CORE_SYSTEM_PATH} missing — Q5-01 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: DigitalProductsFactoryCoreDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): DigitalProductsFactoryCoreState {
    if (!this.initializedAt) {
      throw new Error(
        "Digital Products Factory Core not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-DPF-001",
      missionId: "Q5-01",
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
        totalMissions: engineRecord?.totalMissions ?? 0,
        lastMissionId: engineRecord?.lastMissionId ?? null,
        notes: [
          "Orchestration-only: does not create ebooks/courses, build sales pages, process payments, bypass approval, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  createDigitalProductBusinessMission(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.createDigitalProductBusinessMission(input);
  }

  registerDigitalProductBusiness(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.registerDigitalProductBusiness(input);
  }

  coordinateProductCreation(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.coordinateProductCreation(input);
  }

  coordinateDesignBranding(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.coordinateDesignBranding(input);
  }

  coordinateSalesPage(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.coordinateSalesPage(input);
  }

  coordinateCheckout(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.coordinateCheckout(input);
  }

  coordinateFulfilment(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.coordinateFulfilment(input);
  }

  coordinateCustomerDelivery(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.coordinateCustomerDelivery(input);
  }

  coordinateAnalytics(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.coordinateAnalytics(input);
  }

  coordinateLearning(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.coordinateLearning(input);
  }

  trackBusinessLifecycle(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.trackBusinessLifecycle(input);
  }

  manageLifecycle(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.manageLifecycle(input);
  }

  coordinateWorkers(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.coordinateWorkers(input);
  }

  coordinateApproval(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.coordinateApproval(input);
  }

  produceReport(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: DigitalProductsFactoryCoreInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getMissions() {
    return this.controller.getManager().getMissions();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestMissionId() {
    return this.controller.getManager().getLatestMissionId();
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
        `Digital product missions: ${state.health.totalMissions}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DigitalProductsFactoryCoreCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q5-01",
      status: state.status,
      healthStatus: state.health.status,
      totalMissions: state.health.totalMissions,
      latestMissionId: this.getLatestMissionId(),
      workerId: state.configuration.workerId,
      neverCreateEbooks: true,
      neverCreateCourses: true,
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverBypassApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createDigitalProductsFactoryCore(
  bootstrap: EmpireBootstrapContext,
  options?: DigitalProductsFactoryCoreOptions,
) {
  return new DigitalProductsFactoryCore(bootstrap, options);
}

export function resetDigitalProductsFactoryCoreForTesting() {
  resetDpfLogsForTesting();
  resetMissionSequenceForTesting();
}
