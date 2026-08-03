import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildResponsibilityMatrixConfiguration,
  type ResponsibilityMatrixConfiguration,
} from "./configuration.js";
import { resetBindingSequenceForTesting } from "./matrix-store.js";
import { RESPONSIBILITY_MATRIX_SYSTEM_PATH } from "./paths.js";
import { ResponsibilityMatrixController } from "./responsibility-matrix-controller.js";
import { ResponsibilityMatrixCore } from "./responsibility-matrix-core.js";
import { resetRmxLogsForTesting } from "./rmx-logging.js";
import type {
  ResponsibilityMatrixCockpitSnapshot,
  ResponsibilityMatrixInput,
  ResponsibilityMatrixState,
} from "./types.js";

export interface ResponsibilityMatrixOptions {
  configuration?: Partial<ResponsibilityMatrixConfiguration>;
}

/** Authoritative Q1-06 Responsibility Matrix — define and own only. */
export class ResponsibilityMatrix {
  private initializedAt: string | null = null;
  private readonly controller: ResponsibilityMatrixController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ResponsibilityMatrixOptions = {},
  ) {
    this.controller = new ResponsibilityMatrixController(
      new ResponsibilityMatrixCore(),
      buildResponsibilityMatrixConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      RESPONSIBILITY_MATRIX_SYSTEM_PATH,
    );
    if (!doc?.includes("Responsibility Matrix")) {
      throw new Error(
        `${RESPONSIBILITY_MATRIX_SYSTEM_PATH} missing — Q1-06 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ResponsibilityMatrixState {
    if (!this.initializedAt) {
      throw new Error("Responsibility Matrix not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-RMX-001",
      missionId: "Q1-06",
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
        matrixVersion: configuration.matrixVersion,
        totalResponsibilities: engineRecord?.totalResponsibilities ?? 0,
        totalBindings: this.getBindings().length,
        ownerCount: engineRecord?.ownerCount ?? 0,
        lastMatrixDecision: engineRecord?.lastMatrixDecision ?? null,
        notes: [
          "Define only: does not execute worker tasks, replace Authority Matrix, replace Organization Charter, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectResponsibilityMatrix(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  defineMatrix(input: ResponsibilityMatrixInput = {}) {
    return this.controller.defineMatrix(input);
  }

  registerResponsibility(input: ResponsibilityMatrixInput = {}) {
    return this.controller.registerResponsibility(input);
  }

  deriveOwnership(input: ResponsibilityMatrixInput = {}) {
    return this.controller.deriveOwnership(input);
  }

  validateOwnership(input: ResponsibilityMatrixInput = {}) {
    return this.controller.validateOwnership(input);
  }

  validateInputsOutputs(input: ResponsibilityMatrixInput = {}) {
    return this.controller.validateInputsOutputs(input);
  }

  validateDependencies(input: ResponsibilityMatrixInput = {}) {
    return this.controller.validateDependencies(input);
  }

  validateApprovals(input: ResponsibilityMatrixInput = {}) {
    return this.controller.validateApprovals(input);
  }

  produceMatrix(input: ResponsibilityMatrixInput = {}) {
    return this.controller.produceMatrix(input);
  }

  listMatrixRecords() {
    return this.controller.list();
  }

  validateResponsibilityMatrix(input: ResponsibilityMatrixInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getBindings() {
    return this.controller.getManager().getBindings();
  }

  getLatestBinding() {
    return this.controller.getManager().getLatestBinding();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getResponsibilities() {
    return this.controller.getManager().getResponsibilities();
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
        `Matrix: ${state.health.matrixVersion}`,
        `Responsibilities: ${state.health.totalResponsibilities}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ResponsibilityMatrixCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q1-06",
      status: state.status,
      healthStatus: state.health.status,
      matrixVersion: state.health.matrixVersion,
      totalResponsibilities: state.health.totalResponsibilities,
      ownerCount: state.health.ownerCount,
      latestBindingId: this.getLatestBinding()?.bindingId ?? null,
      neverExecuteWorkerTasks: true,
      neverReplaceAuthorityMatrix: true,
      neverReplaceOrganizationCharter: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createResponsibilityMatrix(
  bootstrap: EmpireBootstrapContext,
  options?: ResponsibilityMatrixOptions,
) {
  return new ResponsibilityMatrix(bootstrap, options);
}

export function resetResponsibilityMatrixForTesting() {
  resetRmxLogsForTesting();
  resetBindingSequenceForTesting();
}
