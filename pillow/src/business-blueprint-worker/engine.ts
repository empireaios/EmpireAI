import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { resetBbwLogsForTesting } from "./bbw-logging.js";
import { resetBlueprintSequenceForTesting } from "./blueprint-builder.js";
import { BlueprintManager } from "./blueprint-manager.js";
import { BusinessBlueprintWorkerController } from "./business-blueprint-worker-controller.js";
import {
  buildBusinessBlueprintWorkerConfiguration,
  type BusinessBlueprintWorkerConfiguration,
} from "./configuration.js";
import type { BusinessBlueprintWorkerDependencies } from "./integrations.js";
import { BUSINESS_BLUEPRINT_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  BusinessBlueprintWorkerCockpitSnapshot,
  BusinessBlueprintWorkerInput,
  BusinessBlueprintWorkerState,
} from "./types.js";

export interface BusinessBlueprintWorkerOptions {
  configuration?: Partial<BusinessBlueprintWorkerConfiguration>;
  dependencies?: BusinessBlueprintWorkerDependencies;
}

/** Authoritative Q2-06 Business Blueprint Worker — blueprint only. */
export class BusinessBlueprintWorker {
  private initializedAt: string | null = null;
  private readonly controller: BusinessBlueprintWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: BusinessBlueprintWorkerOptions = {},
  ) {
    const manager = new BlueprintManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new BusinessBlueprintWorkerController(
      manager,
      buildBusinessBlueprintWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      BUSINESS_BLUEPRINT_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Business Blueprint Worker")) {
      throw new Error(
        `${BUSINESS_BLUEPRINT_WORKER_SYSTEM_PATH} missing — Q2-06 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: BusinessBlueprintWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): BusinessBlueprintWorkerState {
    if (!this.initializedAt) {
      throw new Error(
        "Business Blueprint Worker not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-BBW-001",
      missionId: "Q2-06",
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
        totalBlueprints: engineRecord?.totalBlueprints ?? 0,
        lastBlueprintId: engineRecord?.lastBlueprintId ?? null,
        notes: [
          "Blueprint-only: does not execute the business, launch products, create branding, build websites, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectBusinessBlueprintWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveBusinessModel(input: BusinessBlueprintWorkerInput = {}) {
    return this.controller.receiveBusinessModel(input);
  }

  receiveMarketResearch(input: BusinessBlueprintWorkerInput = {}) {
    return this.controller.receiveMarketResearch(input);
  }

  receiveOpportunityEvaluation(input: BusinessBlueprintWorkerInput = {}) {
    return this.controller.receiveOpportunityEvaluation(input);
  }

  consolidateApprovedInformation(input: BusinessBlueprintWorkerInput = {}) {
    return this.controller.consolidate(input);
  }

  defineBusinessArchitecture(input: BusinessBlueprintWorkerInput = {}) {
    return this.controller.defineArchitecture(input);
  }

  defineOperationalWorkflow(input: BusinessBlueprintWorkerInput = {}) {
    return this.controller.defineWorkflow(input);
  }

  defineRequiredWorkers(input: BusinessBlueprintWorkerInput = {}) {
    return this.controller.defineWorkers(input);
  }

  defineBusinessMilestones(input: BusinessBlueprintWorkerInput = {}) {
    return this.controller.defineMilestones(input);
  }

  produceBusinessBlueprint(input: BusinessBlueprintWorkerInput = {}) {
    return this.controller.produceBlueprint(input);
  }

  submitBusinessBlueprint(input: BusinessBlueprintWorkerInput = {}) {
    return this.controller.submitBlueprint(input);
  }

  listBusinessBlueprints() {
    return this.controller.list();
  }

  validateBusinessBlueprintWorker(input: BusinessBlueprintWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getBlueprints() {
    return this.controller.getManager().getBlueprints();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestBlueprintId() {
    return this.controller.getManager().getLatestBlueprintId();
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
        `Blueprints: ${state.health.totalBlueprints}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BusinessBlueprintWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q2-06",
      status: state.status,
      healthStatus: state.health.status,
      totalBlueprints: state.health.totalBlueprints,
      latestBlueprintId: this.getLatestBlueprintId(),
      workerId: state.configuration.workerId,
      neverExecuteBusiness: true,
      neverLaunchProducts: true,
      neverCreateBranding: true,
      neverBuildWebsites: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createBusinessBlueprintWorker(
  bootstrap: EmpireBootstrapContext,
  options?: BusinessBlueprintWorkerOptions,
) {
  return new BusinessBlueprintWorker(bootstrap, options);
}

export function resetBusinessBlueprintWorkerForTesting() {
  resetBbwLogsForTesting();
  resetBlueprintSequenceForTesting();
}
