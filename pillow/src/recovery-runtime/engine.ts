import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildRecoveryRuntimeConfiguration,
  type RecoveryRuntimeConfiguration,
} from "./configuration.js";
import type { RecoveryRuntimeDependencies } from "./integrations.js";
import { RecoveryRuntimeController } from "./recovery-runtime-controller.js";
import { RecoveryRuntimeManager } from "./recovery-runtime-manager.js";
import { resetRecrtLogsForTesting } from "./recrt-logging.js";
import { RECOVERY_RUNTIME_SYSTEM_PATH } from "./paths.js";
import { resetRecrtSequenceForTesting } from "./recovery-store.js";
import type {
  RecoveryRuntimeCockpitSnapshot,
  RecoveryRuntimeState,
  RecrtInput,
} from "./types.js";

export interface RecoveryRuntimeOptions {
  configuration?: Partial<RecoveryRuntimeConfiguration>;
  dependencies?: RecoveryRuntimeDependencies;
}

/**
 * Authoritative Q10-11 Recovery Runtime — enterprise failure recovery coordination.
 *
 * RECRT detects failures, classifies them, selects strategies, restores state,
 * restarts jobs, resumes workflows, rolls back partial execution, escalates
 * unrecoverable cases, and produces Recovery Runtime Reports consumable by
 * Q10-12 Audit Runtime — without fabricating success, losing recoverable state,
 * modifying business data, replacing business logic, or bypassing Pillow/Grand King.
 *
 * Distinct from worker-recovery-system / autonomous-recovery-engine / recovery /
 * recovery-doctrine.
 */
export class RecoveryRuntime {
  private initializedAt: string | null = null;
  private readonly controller: RecoveryRuntimeController;
  private readonly manager: RecoveryRuntimeManager;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: RecoveryRuntimeOptions = {},
  ) {
    this.manager = new RecoveryRuntimeManager();
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new RecoveryRuntimeController(
      this.manager,
      buildRecoveryRuntimeConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      RECOVERY_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("Recovery Runtime")) {
      throw new Error(
        `${RECOVERY_RUNTIME_SYSTEM_PATH} missing — Q10-11 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: RecoveryRuntimeDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): RecoveryRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Recovery Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-RECRT-001",
      missionId: "Q10-11",
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
        totalFailures: engineRecord?.totalFailures ?? 0,
        totalRecoveries: engineRecord?.totalRecoveries ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        notes: [
          "Enterprise recovery runtime only: structural failure recovery, no fabricated success, no lost recoverable state, no business-data mutation, no business-logic replacement, no Pillow/Grand King bypass, distinct from worker-recovery-system/autonomous-recovery-engine/recovery/recovery-doctrine, does not implement Q10-12+.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  detectFailure(input: RecrtInput = {}) {
    return this.controller.detectFailure(input);
  }

  classifyFailure(input: RecrtInput = {}) {
    return this.controller.classifyFailure(input);
  }

  selectStrategy(input: RecrtInput = {}) {
    return this.controller.selectStrategy(input);
  }

  restoreState(input: RecrtInput = {}) {
    return this.controller.restoreState(input);
  }

  restartJob(input: RecrtInput = {}) {
    return this.controller.restartJob(input);
  }

  resumeWorkflow(input: RecrtInput = {}) {
    return this.controller.resumeWorkflow(input);
  }

  rollback(input: RecrtInput = {}) {
    return this.controller.rollback(input);
  }

  escalate(input: RecrtInput = {}) {
    return this.controller.escalate(input);
  }

  runRecovery(input: RecrtInput = {}) {
    return this.controller.runRecovery(input);
  }

  produceReport(input: RecrtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: RecrtInput = {}) {
    return this.controller.submitReport(input);
  }

  list(input: RecrtInput = {}) {
    return this.controller.list(input);
  }

  validate(input: RecrtInput = {}) {
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

  getQ1012ConsumableContract() {
    return this.controller.getQ1012ConsumableContract();
  }

  getCockpitSnapshot(): RecoveryRuntimeCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }
}

export function createRecoveryRuntime(
  bootstrap: EmpireBootstrapContext,
  options: RecoveryRuntimeOptions = {},
) {
  return new RecoveryRuntime(bootstrap, options);
}

export function resetRecoveryRuntimeForTesting() {
  resetRecrtLogsForTesting();
  resetRecrtSequenceForTesting();
}
