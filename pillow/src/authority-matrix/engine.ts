import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAuthorityMatrixConfiguration,
  type AuthorityMatrixConfiguration,
} from "./configuration.js";
import { resetBindingSequenceForTesting } from "./matrix-store.js";
import { AUTHORITY_MATRIX_SYSTEM_PATH } from "./paths.js";
import { AuthorityMatrixController } from "./authority-matrix-controller.js";
import { AuthorityMatrixCore } from "./authority-matrix-core.js";
import { resetAmxLogsForTesting } from "./amx-logging.js";
import type {
  AuthorityMatrixCockpitSnapshot,
  AuthorityMatrixInput,
  AuthorityMatrixState,
} from "./types.js";

export interface AuthorityMatrixOptions {
  configuration?: Partial<AuthorityMatrixConfiguration>;
}

/** Authoritative Q1-05 Authority Matrix — define and govern only. */
export class AuthorityMatrix {
  private initializedAt: string | null = null;
  private readonly controller: AuthorityMatrixController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: AuthorityMatrixOptions = {},
  ) {
    this.controller = new AuthorityMatrixController(
      new AuthorityMatrixCore(),
      buildAuthorityMatrixConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      AUTHORITY_MATRIX_SYSTEM_PATH,
    );
    if (!doc?.includes("Authority Matrix")) {
      throw new Error(`${AUTHORITY_MATRIX_SYSTEM_PATH} missing — Q1-05 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): AuthorityMatrixState {
    if (!this.initializedAt) {
      throw new Error("Authority Matrix not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-AMX-001",
      missionId: "Q1-05",
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
        totalRules: engineRecord?.totalRules ?? 0,
        totalBindings: this.getBindings().length,
        authorityLevelCount: engineRecord?.authorityLevelCount ?? 0,
        decisionCategoryCount: engineRecord?.decisionCategoryCount ?? 0,
        lastMatrixDecision: engineRecord?.lastMatrixDecision ?? null,
        notes: [
          "Define only: does not execute worker tasks, replace Approval Router, replace Organization Charter, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectAuthorityMatrix(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  defineMatrix(input: AuthorityMatrixInput = {}) {
    return this.controller.defineMatrix(input);
  }

  registerRule(input: AuthorityMatrixInput = {}) {
    return this.controller.registerRule(input);
  }

  deriveAuthority(input: AuthorityMatrixInput = {}) {
    return this.controller.deriveAuthority(input);
  }

  validateWorkerAuthority(input: AuthorityMatrixInput = {}) {
    return this.controller.validateWorkerAuthority(input);
  }

  validatePillowAuthority(input: AuthorityMatrixInput = {}) {
    return this.controller.validatePillowAuthority(input);
  }

  validateGrandKingAuthority(input: AuthorityMatrixInput = {}) {
    return this.controller.validateGrandKingAuthority(input);
  }

  validateApprovalRouting(input: AuthorityMatrixInput = {}) {
    return this.controller.validateApprovalRouting(input);
  }

  produceMatrix(input: AuthorityMatrixInput = {}) {
    return this.controller.produceMatrix(input);
  }

  listMatrixRecords() {
    return this.controller.list();
  }

  validateAuthorityMatrix(input: AuthorityMatrixInput = {}) {
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

  getRules() {
    return this.controller.getManager().getRules();
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
        `Rules: ${state.health.totalRules}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AuthorityMatrixCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q1-05",
      status: state.status,
      healthStatus: state.health.status,
      matrixVersion: state.health.matrixVersion,
      totalRules: state.health.totalRules,
      authorityLevelCount: state.health.authorityLevelCount,
      decisionCategoryCount: state.health.decisionCategoryCount,
      latestBindingId: this.getLatestBinding()?.bindingId ?? null,
      neverExecuteWorkerTasks: true,
      neverReplaceApprovalRouter: true,
      neverReplaceOrganizationCharter: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createAuthorityMatrix(
  bootstrap: EmpireBootstrapContext,
  options?: AuthorityMatrixOptions,
) {
  return new AuthorityMatrix(bootstrap, options);
}

export function resetAuthorityMatrixForTesting() {
  resetAmxLogsForTesting();
  resetBindingSequenceForTesting();
}
