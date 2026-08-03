import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildOrganizationCharterConfiguration,
  type OrganizationCharterConfiguration,
} from "./configuration.js";
import { resetStructureSequenceForTesting } from "./charter-store.js";
import { ORGANIZATION_CHARTER_SYSTEM_PATH } from "./paths.js";
import { OrganizationCharterController } from "./organization-charter-controller.js";
import { OrganizationCharterCore } from "./organization-charter-core.js";
import { resetOchLogsForTesting } from "./och-logging.js";
import type {
  OrganizationCharterCockpitSnapshot,
  OrganizationCharterInput,
  OrganizationCharterState,
} from "./types.js";

export interface OrganizationCharterOptions {
  configuration?: Partial<OrganizationCharterConfiguration>;
}

/** Authoritative Q1-02 Organization Charter — define and register only. */
export class OrganizationCharter {
  private initializedAt: string | null = null;
  private readonly controller: OrganizationCharterController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: OrganizationCharterOptions = {},
  ) {
    this.controller = new OrganizationCharterController(
      new OrganizationCharterCore(),
      buildOrganizationCharterConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      ORGANIZATION_CHARTER_SYSTEM_PATH,
    );
    if (!doc?.includes("Organization Charter")) {
      throw new Error(
        `${ORGANIZATION_CHARTER_SYSTEM_PATH} missing — Q1-02 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): OrganizationCharterState {
    if (!this.initializedAt) {
      throw new Error("Organization Charter not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-OCH-001",
      missionId: "Q1-02",
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
        charterVersion: configuration.charterVersion,
        totalStructureRecords: this.getRecords().length,
        factoryCount: engineRecord?.factoryCount ?? 0,
        departmentCount: engineRecord?.departmentCount ?? 0,
        workerCount: engineRecord?.workerCount ?? 0,
        lastStructureDecision: engineRecord?.lastStructureDecision ?? null,
        notes: [
          "Define only: does not execute worker tasks, replace Workforce Operating System, replace Workforce Orchestrator, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectOrganizationCharter(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  defineCharter(input: OrganizationCharterInput = {}) {
    return this.controller.defineCharter(input);
  }

  registerFactory(input: OrganizationCharterInput = {}) {
    return this.controller.registerFactory(input);
  }

  registerDepartment(input: OrganizationCharterInput = {}) {
    return this.controller.registerDepartment(input);
  }

  registerWorker(input: OrganizationCharterInput = {}) {
    return this.controller.registerWorker(input);
  }

  validateReporting(input: OrganizationCharterInput = {}) {
    return this.controller.validateReporting(input);
  }

  validateEscalation(input: OrganizationCharterInput = {}) {
    return this.controller.validateEscalation(input);
  }

  produceStructure(input: OrganizationCharterInput = {}) {
    return this.controller.produceStructure(input);
  }

  listStructureRecords() {
    return this.controller.list();
  }

  validateOrganizationCharter(input: OrganizationCharterInput = {}) {
    return this.controller.validate(input);
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

  getCharter() {
    return this.controller.getManager().getCharter();
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
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Charter: ${state.health.charterVersion}`,
        `Factories: ${state.health.factoryCount}`,
        `Departments: ${state.health.departmentCount}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): OrganizationCharterCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q1-02",
      status: state.status,
      healthStatus: state.health.status,
      charterVersion: state.health.charterVersion,
      factoryCount: state.health.factoryCount,
      departmentCount: state.health.departmentCount,
      workerCount: state.health.workerCount,
      latestStructureRecordId: this.getLatestRecord()?.structureRecordId ?? null,
      neverExecuteWorkerTasks: true,
      neverReplaceWorkforceOperatingSystem: true,
      neverReplaceWorkforceOrchestrator: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createOrganizationCharter(
  bootstrap: EmpireBootstrapContext,
  options?: OrganizationCharterOptions,
) {
  return new OrganizationCharter(bootstrap, options);
}

export function resetOrganizationCharterForTesting() {
  resetOchLogsForTesting();
  resetStructureSequenceForTesting();
}
