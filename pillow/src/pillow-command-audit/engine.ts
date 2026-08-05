import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPillowCommandAuditConfiguration,
  type PillowCommandAuditConfiguration,
} from "./configuration.js";
import type { PillowCommandAuditDependencies } from "./integrations.js";
import { PillowCommandAuditManager } from "./pillow-command-audit-manager.js";
import { PillowCommandAuditController } from "./pillow-command-audit-controller.js";
import { resetPcartLogsForTesting } from "./pcart-logging.js";
import { PILLOW_COMMAND_AUDIT_SYSTEM_PATH, READINESS_CLASSIFICATIONS } from "./paths.js";
import { resetPcartSequenceForTesting } from "./audit-store.js";
import type {
  PcartInput,
  PillowCommandAuditCockpitSnapshot,
  PillowCommandAuditState,
} from "./types.js";

export interface PillowCommandAuditOptions {
  configuration?: Partial<PillowCommandAuditConfiguration>;
  dependencies?: PillowCommandAuditDependencies;
}

/**
 * Authoritative Q11-03 Pillow Command Audit — the third Q11 acceptance gate.
 * It discovers every registered worker strictly from an injected Worker
 * Registry (never inventing workers), verifies worker assignment
 * (factory/role + missionRuntime.createMission presence), command dispatch
 * (pillowOrchestrationRuntime.invokeWorker presence — structural,
 * presence-only, never executing business logic), worker communication
 * (communicationRuntime.sendMessage/acknowledgeMessage presence),
 * supervision capability, progress tracking, result collection, and
 * governance from observed evidence only. It classifies each worker's
 * command readiness deterministically, and produces a machine-readable
 * Pillow Command Audit Report.
 *
 * It NEVER fabricates audit evidence, NEVER certifies unverified command
 * capability, NEVER assumes implementation, NEVER modifies worker
 * implementations, NEVER repairs failed workers, and NEVER overrides
 * governance, approved architecture, Pillow, or Grand King. It NEVER
 * implements Q11-04 (Factory Readiness Audit) or later — it only exposes a
 * Q1104ConsumableContract for Q11-04 to consume, and it consumes the
 * Q1103ConsumableContract exposed by Q11-02 (Worker Readiness Audit) when
 * injected.
 */
export class PillowCommandAudit {
  private initializedAt: string | null = null;
  private readonly manager: PillowCommandAuditManager;
  private readonly controller: PillowCommandAuditController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: PillowCommandAuditOptions = {},
  ) {
    this.manager = new PillowCommandAuditManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new PillowCommandAuditController(
      this.manager,
      buildPillowCommandAuditConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      PILLOW_COMMAND_AUDIT_SYSTEM_PATH,
    );
    if (!doc?.includes("Pillow Command Audit")) {
      throw new Error(`${PILLOW_COMMAND_AUDIT_SYSTEM_PATH} missing — Q11-03 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: PillowCommandAuditDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): PillowCommandAuditState {
    if (!this.initializedAt) {
      throw new Error("Pillow Command Audit not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-PCART-001",
      missionId: "Q11-03",
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
        totalReports: engineRecord?.totalReports ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastCommandReadinessDecision: engineRecord?.lastCommandReadinessDecision ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Pillow Command Audit is the third Q11 acceptance gate: it discovers every registered worker strictly from the injected Worker Registry, verifies assignment/command dispatch/communication/supervision/progress/result collection/governance from observed evidence only, and classifies command readiness deterministically. It never fabricates evidence, never certifies unverified command capability, and never overrides Pillow, Grand King, or approved architecture. It never implements Q11-04 (Factory Readiness Audit) or later.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  discoverWorkers() {
    return this.controller.discoverWorkers();
  }

  verifyAssignment() {
    return this.controller.verifyAssignment();
  }

  verifyCommandDispatch() {
    return this.controller.verifyCommandDispatch();
  }

  verifyCommunication() {
    return this.controller.verifyCommunication();
  }

  verifySupervision() {
    return this.controller.verifySupervision();
  }

  verifyGovernance() {
    return this.controller.verifyGovernance();
  }

  verifyIntegrations() {
    return this.controller.verifyIntegrations();
  }

  classifyCommandReadiness() {
    return this.controller.classifyCommandReadiness();
  }

  produceCommandReadinessFindings(input: PcartInput = {}) {
    return this.controller.produceCommandReadinessFindings(input);
  }

  producePillowCommandAuditReport(input: PcartInput = {}) {
    return this.controller.produceReport(input);
  }

  produceReport(input: PcartInput = {}) {
    return this.controller.produceReport(input);
  }

  auditPillowCommand(input: PcartInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: PcartInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.manager.getReports();
  }

  getCatalog() {
    return this.manager.getCatalog();
  }

  getAuditTrail(limit = 100) {
    return this.manager.getAuditTrail(limit);
  }

  getCommandMatrix() {
    return this.controller.getCommandMatrix();
  }

  getQ1104ConsumableContract() {
    return this.controller.getQ1104ConsumableContract();
  }

  validate(input: PcartInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getIntegrations() {
    return this.manager.getIntegrations();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : Math.round((state.health.lastConfidenceScore ?? 0) * 100) || 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Audit reports: ${state.health.totalReports}`,
        `Last command readiness decision: ${state.health.lastCommandReadinessDecision ?? "none"}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PillowCommandAuditCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q11-03",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastCommandReadinessDecision: state.health.lastCommandReadinessDecision,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      readinessClassificationOptions: [...READINESS_CLASSIFICATIONS],
      neverFabricateAuditEvidence: true,
      neverCertifyUnverifiedCommandCapability: true,
      neverAssumeImplementation: true,
      neverModifyWorkerImplementations: true,
      neverRepairFailedWorkers: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1104OrLater: true,
      thirdQ11Gate: true,
    };
  }
}

export function createPillowCommandAudit(
  bootstrap: EmpireBootstrapContext,
  options?: PillowCommandAuditOptions,
) {
  return new PillowCommandAudit(bootstrap, options);
}

export function resetPillowCommandAuditForTesting() {
  resetPcartLogsForTesting();
  resetPcartSequenceForTesting();
}
