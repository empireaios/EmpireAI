import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkforceCapabilityRegistryConfiguration,
  type WorkforceCapabilityRegistryConfiguration,
} from "./configuration.js";
import { WorkforceCapabilityRegistryController } from "./workforce-capability-registry-controller.js";
import { WorkforceCapabilityRegistryManager } from "./workforce-capability-registry-manager.js";
import { resetWcrLogsForTesting } from "./wcr-logging.js";
import { resetRegistrySequenceForTesting } from "./registry-store.js";
import { WORKFORCE_CAPABILITY_REGISTRY_SYSTEM_PATH } from "./paths.js";
import type {
  LookupInput,
  RegisterCatalogInput,
  RegisterWorkerInput,
  UpdateWorkerStatusInput,
  WorkforceCapabilityRegistryCockpitSnapshot,
  WorkforceCapabilityRegistryInput,
  WorkforceCapabilityRegistryState,
} from "./types.js";

export interface WorkforceCapabilityRegistryOptions {
  configuration?: Partial<WorkforceCapabilityRegistryConfiguration>;
}

/** Authoritative Q0-10 Workforce Capability Registry — capability intelligence only. */
export class WorkforceCapabilityRegistry {
  private initializedAt: string | null = null;
  private readonly controller: WorkforceCapabilityRegistryController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkforceCapabilityRegistryOptions = {},
  ) {
    this.controller = new WorkforceCapabilityRegistryController(
      new WorkforceCapabilityRegistryManager(),
      buildWorkforceCapabilityRegistryConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKFORCE_CAPABILITY_REGISTRY_SYSTEM_PATH,
    );
    if (!doc?.includes("Workforce Capability Registry")) {
      throw new Error(`${WORKFORCE_CAPABILITY_REGISTRY_SYSTEM_PATH} missing — Q0-10 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkforceCapabilityRegistryState {
    if (!this.initializedAt) {
      throw new Error("Workforce Capability Registry not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WCR-001",
      missionId: "Q0-10",
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
        totalWorkers: engineRecord?.totalWorkers ?? this.getRecords().length,
        totalDepartments: engineRecord?.totalDepartments ?? 0,
        notes: [
          "Registry only: does not execute work, assign workers, orchestrate workers, approve actions, or replace Pillow.",
        ],
      },
    };
  }

  connectWorkforceCapabilityRegistry(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  registerWorker(input: RegisterWorkerInput) {
    return this.controller.registerWorker(input);
  }

  registerDepartment(input: RegisterCatalogInput) {
    return this.controller.registerDepartment(input);
  }

  registerCapability(input: RegisterCatalogInput) {
    return this.controller.registerCapability(input);
  }

  registerTool(input: RegisterCatalogInput) {
    return this.controller.registerTool(input);
  }

  registerSkill(input: RegisterCatalogInput) {
    return this.controller.registerSkill(input);
  }

  updateStatus(input: UpdateWorkerStatusInput) {
    return this.controller.updateStatus(input);
  }

  lookup(input: LookupInput) {
    return this.controller.lookup(input);
  }

  listRecords() {
    return this.controller.listRecords();
  }

  validateRegistry(input: WorkforceCapabilityRegistryInput = {}) {
    return this.controller.validateRegistry(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getLatestRecord() {
    return this.controller.getManager().getLatestRecord();
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
        `Workers: ${state.health.totalWorkers}`,
        `Departments: ${state.health.totalDepartments}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkforceCapabilityRegistryCockpitSnapshot {
    const state = this.getState();
    const engineRecord = this.getEngineRecord();
    return {
      missionId: "Q0-10",
      status: state.status,
      healthStatus: state.health.status,
      totalWorkers: state.health.totalWorkers,
      totalDepartments: state.health.totalDepartments,
      totalCapabilities: engineRecord?.totalCapabilities ?? 0,
      totalTools: engineRecord?.totalTools ?? 0,
      totalSkills: engineRecord?.totalSkills ?? 0,
      latestRegistryId: this.getLatestRecord()?.registryId ?? null,
      neverExecuteWork: true,
      neverAssignWorkers: true,
      neverOrchestrateWorkers: true,
      neverApproveActions: true,
      neverReplacePillow: true,
    };
  }
}

export function createWorkforceCapabilityRegistry(
  bootstrap: EmpireBootstrapContext,
  options?: WorkforceCapabilityRegistryOptions,
) {
  return new WorkforceCapabilityRegistry(bootstrap, options);
}

export function resetWorkforceCapabilityRegistryForTesting() {
  resetWcrLogsForTesting();
  resetRegistrySequenceForTesting();
}
