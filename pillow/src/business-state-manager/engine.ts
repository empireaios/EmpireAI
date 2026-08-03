import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBusinessStateManagerConfiguration,
  type BusinessStateManagerConfiguration,
} from "./configuration.js";
import { BusinessStateManagerController } from "./business-state-manager-controller.js";
import { BusinessStateManagerCore } from "./business-state-manager-core.js";
import { resetBsmLogsForTesting } from "./bsm-logging.js";
import { BUSINESS_STATE_MANAGER_SYSTEM_PATH } from "./paths.js";
import type {
  BusinessStateManagerCockpitSnapshot,
  BusinessStateManagerState,
  QueryBusinessStateInput,
  RegisterBusinessInput,
  UpdateBusinessStateInput,
} from "./types.js";

export interface BusinessStateManagerOptions {
  configuration?: Partial<BusinessStateManagerConfiguration>;
}

/** Authoritative Q0-03 Business State Manager — single source of live business state. */
export class BusinessStateManager {
  private initializedAt: string | null = null;
  private readonly controller: BusinessStateManagerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: BusinessStateManagerOptions = {},
  ) {
    this.controller = new BusinessStateManagerController(
      new BusinessStateManagerCore(),
      buildBusinessStateManagerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(BUSINESS_STATE_MANAGER_SYSTEM_PATH);
    if (!doc?.includes("Business State Manager")) {
      throw new Error(`${BUSINESS_STATE_MANAGER_SYSTEM_PATH} missing — Q0-03 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): BusinessStateManagerState {
    if (!this.initializedAt) throw new Error("Business State Manager not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const total = this.getBusinesses().length;
    const active = engineRecord?.activeBusinessCount ?? 0;
    return {
      engineVersion: "PILLOW-BSM-001",
      missionId: "Q0-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalBusinesses: total,
        activeBusinessCount: active,
        notes: [
          "State only: does not execute missions, assign workers, approve actions, launch businesses, or make strategic decisions.",
        ],
      },
    };
  }

  connectBusinessStateManager(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  registerBusiness(input: RegisterBusinessInput) {
    return this.controller.registerBusiness(input);
  }

  updateBusinessState(input: UpdateBusinessStateInput) {
    return this.controller.updateBusinessState(input);
  }

  updateBusinessHealth(input: UpdateBusinessStateInput) {
    return this.controller.updateHealth(input);
  }

  updateBusinessProgress(input: UpdateBusinessStateInput) {
    return this.controller.updateProgress(input);
  }

  queryBusinessState(input: QueryBusinessStateInput = {}) {
    return this.controller.queryBusinessState(input);
  }

  listBusinesses() {
    return this.controller.listBusinesses();
  }

  validateConsistency() {
    return this.controller.validateConsistency();
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getBusinesses() {
    return this.controller.getManager().getBusinesses();
  }

  getBusiness(businessId: string) {
    return this.controller.getManager().getBusiness(businessId);
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
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
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Businesses: ${state.health.totalBusinesses}`,
        `Active: ${state.health.activeBusinessCount}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BusinessStateManagerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-03",
      status: state.status,
      healthStatus: state.health.status,
      totalBusinesses: state.health.totalBusinesses,
      activeBusinessCount: state.health.activeBusinessCount,
      neverExecuteMissions: true,
      neverAssignWorkers: true,
      neverApproveActions: true,
      neverLaunchBusinesses: true,
      neverMakeStrategicDecisions: true,
    };
  }
}

export function createBusinessStateManager(
  bootstrap: EmpireBootstrapContext,
  options?: BusinessStateManagerOptions,
) {
  return new BusinessStateManager(bootstrap, options);
}

export function resetBusinessStateManagerForTesting() {
  resetBsmLogsForTesting();
}
