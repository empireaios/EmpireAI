import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildExecutiveAuditEngineConfiguration,
  type ExecutiveAuditEngineConfiguration,
} from "./configuration.js";
import { ExecutiveAuditController } from "./executive-audit-controller.js";
import { ExecutiveAuditManager } from "./executive-audit-manager.js";
import { resetExaLogsForTesting } from "./exa-logging.js";
import { resetAuditSequenceForTesting } from "./audit-report-builder.js";
import { EXECUTIVE_AUDIT_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ExecutiveAuditCockpitSnapshot,
  ExecutiveAuditEngineState,
  ExecutiveAuditInput,
} from "./types.js";

export interface ExecutiveAuditEngineOptions {
  configuration?: Partial<ExecutiveAuditEngineConfiguration>;
}

/** Authoritative Q0-08 Executive Audit Engine — validates and reports only. */
export class ExecutiveAuditEngine {
  private initializedAt: string | null = null;
  private readonly controller: ExecutiveAuditController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ExecutiveAuditEngineOptions = {},
  ) {
    this.controller = new ExecutiveAuditController(
      new ExecutiveAuditManager(),
      buildExecutiveAuditEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      EXECUTIVE_AUDIT_ENGINE_SYSTEM_PATH,
    );
    if (!doc?.includes("Executive Audit Engine")) {
      throw new Error(`${EXECUTIVE_AUDIT_ENGINE_SYSTEM_PATH} missing — Q0-08 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ExecutiveAuditEngineState {
    if (!this.initializedAt) {
      throw new Error("Executive Audit Engine not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const total = this.getReports().length;
    const violationCount = this.getReports().reduce((sum, r) => sum + r.violations.length, 0);
    return {
      engineVersion: "PILLOW-EXA-001",
      missionId: "Q0-08",
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
        totalAudits: total,
        violationCount,
        notes: [
          "Audit only: does not execute corrections, approve missions, assign workers, modify business state, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectExecutiveAuditEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  auditExecutiveDecision(input: ExecutiveAuditInput) {
    return this.controller.auditExecutiveDecision(input);
  }

  auditMissionOutput(input: ExecutiveAuditInput) {
    return this.controller.auditMissionOutput(input);
  }

  auditWorkforceAction(input: ExecutiveAuditInput) {
    return this.controller.auditWorkforceAction(input);
  }

  auditGovernance(input: ExecutiveAuditInput) {
    return this.controller.auditGovernance(input);
  }

  auditApproval(input: ExecutiveAuditInput) {
    return this.controller.auditApproval(input);
  }

  auditBusinessState(input: ExecutiveAuditInput) {
    return this.controller.auditBusinessState(input);
  }

  auditExecutionMemory(input: ExecutiveAuditInput) {
    return this.controller.auditExecutionMemory(input);
  }

  auditDecisionRecommendations(input: ExecutiveAuditInput) {
    return this.controller.auditDecisionRecommendations(input);
  }

  auditRecommendationQuality(input: ExecutiveAuditInput) {
    return this.controller.auditRecommendationQuality(input);
  }

  runAudit(input: ExecutiveAuditInput) {
    return this.controller.runAudit(input);
  }

  validateAudits(input: ExecutiveAuditInput = {}) {
    return this.controller.validateAudits(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getLatestAuditReport() {
    return this.controller.getManager().getLatestReport();
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
        `Audits: ${state.health.totalAudits}`,
        `Violations: ${state.health.violationCount}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExecutiveAuditCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-08",
      status: state.status,
      healthStatus: state.health.status,
      totalAudits: state.health.totalAudits,
      violationCount: state.health.violationCount,
      latestAuditId: this.getLatestAuditReport()?.auditId ?? null,
      neverExecuteCorrections: true,
      neverApproveMissions: true,
      neverAssignWorkers: true,
      neverModifyBusinessState: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createExecutiveAuditEngine(
  bootstrap: EmpireBootstrapContext,
  options?: ExecutiveAuditEngineOptions,
) {
  return new ExecutiveAuditEngine(bootstrap, options);
}

export function resetExecutiveAuditEngineForTesting() {
  resetExaLogsForTesting();
  resetAuditSequenceForTesting();
}
