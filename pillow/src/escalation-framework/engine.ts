import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildEscalationFrameworkConfiguration,
  type EscalationFrameworkConfiguration,
} from "./configuration.js";
import { EscalationFrameworkController } from "./escalation-framework-controller.js";
import { EscalationFrameworkCore } from "./escalation-framework-core.js";
import { resetEsfLogsForTesting } from "./esf-logging.js";
import { resetEscalationSequenceForTesting } from "./escalation-store.js";
import { ESCALATION_FRAMEWORK_SYSTEM_PATH } from "./paths.js";
import type {
  EscalationFrameworkCockpitSnapshot,
  EscalationFrameworkInput,
  EscalationFrameworkState,
} from "./types.js";

export interface EscalationFrameworkOptions {
  configuration?: Partial<EscalationFrameworkConfiguration>;
}

/** Authoritative Q0-22 Escalation Framework — escalate/route only. */
export class EscalationFramework {
  private initializedAt: string | null = null;
  private readonly controller: EscalationFrameworkController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: EscalationFrameworkOptions = {},
  ) {
    this.controller = new EscalationFrameworkController(
      new EscalationFrameworkCore(),
      buildEscalationFrameworkConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      ESCALATION_FRAMEWORK_SYSTEM_PATH,
    );
    if (!doc?.includes("Escalation Framework")) {
      throw new Error(`${ESCALATION_FRAMEWORK_SYSTEM_PATH} missing — Q0-22 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): EscalationFrameworkState {
    if (!this.initializedAt) {
      throw new Error("Escalation Framework not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-ESF-001",
      missionId: "Q0-22",
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
        totalEscalationRecords: this.getRecords().length,
        openEscalations: engineRecord?.openEscalations ?? 0,
        lastPriority: engineRecord?.lastPriority ?? null,
        notes: [
          "Escalate only: does not execute worker tasks, resolve business disputes, override Pillow, override Grand King, or replace executive judgement.",
        ],
      },
    };
  }

  connectEscalationFramework(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  detectEscalation(input: EscalationFrameworkInput = {}) {
    return this.controller.detect(input);
  }

  escalateLowConfidence(input: EscalationFrameworkInput = {}) {
    return this.controller.escalateLowConfidence(input);
  }

  escalateMissingInformation(input: EscalationFrameworkInput = {}) {
    return this.controller.escalateMissingInformation(input);
  }

  escalateConflictingRecommendations(input: EscalationFrameworkInput = {}) {
    return this.controller.escalateConflictingRecommendations(input);
  }

  escalateWorkerDeadlock(input: EscalationFrameworkInput = {}) {
    return this.controller.escalateWorkerDeadlock(input);
  }

  escalateExecutiveDecision(input: EscalationFrameworkInput = {}) {
    return this.controller.escalateExecutiveDecision(input);
  }

  generateEscalation(input: EscalationFrameworkInput = {}) {
    return this.controller.generate(input);
  }

  routeEscalationToPillow(input: EscalationFrameworkInput = {}) {
    return this.controller.routeToPillow(input);
  }

  listEscalations() {
    return this.controller.list();
  }

  validateEscalationFramework(input: EscalationFrameworkInput = {}) {
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
        `Escalation records: ${state.health.totalEscalationRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): EscalationFrameworkCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-22",
      status: state.status,
      healthStatus: state.health.status,
      totalEscalationRecords: state.health.totalEscalationRecords,
      latestEscalationId: this.getLatestRecord()?.escalationId ?? null,
      openEscalations: state.health.openEscalations,
      neverExecuteWorkerTasks: true,
      neverResolveBusinessDisputes: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverReplaceExecutiveJudgement: true,
    };
  }
}

export function createEscalationFramework(
  bootstrap: EmpireBootstrapContext,
  options?: EscalationFrameworkOptions,
) {
  return new EscalationFramework(bootstrap, options);
}

export function resetEscalationFrameworkForTesting() {
  resetEsfLogsForTesting();
  resetEscalationSequenceForTesting();
}
