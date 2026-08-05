import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAuditRuntimeConfiguration,
  type AuditRuntimeConfiguration,
} from "./configuration.js";
import type { AuditRuntimeDependencies } from "./integrations.js";
import { AuditRuntimeController } from "./audit-runtime-controller.js";
import { AuditRuntimeManager } from "./audit-runtime-manager.js";
import { resetAudrtLogsForTesting } from "./audrt-logging.js";
import { AUDIT_RUNTIME_SYSTEM_PATH } from "./paths.js";
import { resetAudrtSequenceForTesting } from "./audit-store.js";
import { resetAudrtValidationSequenceForTesting } from "./audit-validator.js";
import type {
  AuditRuntimeCockpitSnapshot,
  AuditRuntimeState,
  AudrtInput,
} from "./types.js";

export interface AuditRuntimeOptions {
  configuration?: Partial<AuditRuntimeConfiguration>;
  dependencies?: AuditRuntimeDependencies;
}

/**
 * Authoritative Q10-13 Audit Runtime — enterprise audit recording & integrity.
 *
 * AUDRT records runtime/worker/mission/approval/recovery/scheduling events,
 * attaches evidence references only, verifies deterministic integrity digests,
 * and produces Audit Runtime Reports consumable by Q10-14 — without fabricating
 * evidence, deleting records, executing business logic, or bypassing Pillow/Grand King.
 *
 * Distinct from audit-reviewer, enterprise-audit-engine, executive-audit-engine,
 * decision-audit-engine, master-audit, and autonomous-ux-audit-engine.
 */
export class AuditRuntime {
  private initializedAt: string | null = null;
  private readonly controller: AuditRuntimeController;
  private readonly manager: AuditRuntimeManager;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: AuditRuntimeOptions = {},
  ) {
    this.manager = new AuditRuntimeManager();
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new AuditRuntimeController(
      this.manager,
      buildAuditRuntimeConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      AUDIT_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("Audit Runtime")) {
      throw new Error(
        `${AUDIT_RUNTIME_SYSTEM_PATH} missing — Q10-13 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: AuditRuntimeDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): AuditRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Audit Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-AUDRT-001",
      missionId: "Q10-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy"
            ? 85
            : engineRecord?.healthStatus === "degraded"
              ? 60
              : engineRecord
                ? 50
                : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalAuditRecords: engineRecord?.totalAuditRecords ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        notes: [
          "Enterprise audit runtime only: deterministic integrity digests, immutable append-only records, evidence refs only, no fabricated evidence, no business logic, no Pillow/Grand King bypass, distinct from other audit engines, does not implement Q10-14+.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  recordEvent(input: AudrtInput = {}) {
    return this.controller.recordEvent(input);
  }

  recordWorkerAction(input: AudrtInput = {}) {
    return this.controller.recordWorkerAction(input);
  }

  recordMissionLifecycle(input: AudrtInput = {}) {
    return this.controller.recordMissionLifecycle(input);
  }

  recordApproval(input: AudrtInput = {}) {
    return this.controller.recordApproval(input);
  }

  recordRecovery(input: AudrtInput = {}) {
    return this.controller.recordRecovery(input);
  }

  recordScheduling(input: AudrtInput = {}) {
    return this.controller.recordScheduling(input);
  }

  attachEvidence(input: AudrtInput = {}) {
    return this.controller.attachEvidence(input);
  }

  query(input: AudrtInput = {}) {
    return this.controller.query(input);
  }

  verifyIntegrity(input: AudrtInput = {}) {
    return this.controller.verifyIntegrity(input);
  }

  exportRecords(input: AudrtInput = {}) {
    return this.controller.exportRecords(input);
  }

  produceReport(input: AudrtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: AudrtInput = {}) {
    return this.controller.submitReport(input);
  }

  list(input: AudrtInput = {}) {
    return this.controller.list(input);
  }

  validate(input: AudrtInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getHistory() {
    return this.controller.getHistory();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  getQ1014ConsumableContract() {
    return this.controller.getQ1014ConsumableContract();
  }

  /** Thin adapter matching AuditRuntimeHandle.recordAuditEvent. */
  recordAuditEvent(payload: unknown) {
    return this.controller.recordAuditEvent(payload);
  }

  getCockpitSnapshot(): AuditRuntimeCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }
}

export function createAuditRuntime(
  bootstrap: EmpireBootstrapContext,
  options: AuditRuntimeOptions = {},
) {
  return new AuditRuntime(bootstrap, options);
}

export function resetAuditRuntimeForTesting() {
  resetAudrtLogsForTesting();
  resetAudrtSequenceForTesting();
  resetAudrtValidationSequenceForTesting();
}
