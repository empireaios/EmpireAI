import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSchedulingRuntimeConfiguration,
  type SchedulingRuntimeConfiguration,
} from "./configuration.js";
import type { SchedulingRuntimeDependencies } from "./integrations.js";
import { SchedulingRuntimeController } from "./scheduling-runtime-controller.js";
import { SchedulingRuntimeManager } from "./scheduling-runtime-manager.js";
import { resetSchrtLogsForTesting } from "./schrt-logging.js";
import { SCHEDULING_RUNTIME_SYSTEM_PATH } from "./paths.js";
import { resetSchrtSequenceForTesting } from "./schedule-store.js";
import type {
  SchedulingRuntimeCockpitSnapshot,
  SchedulingRuntimeState,
  SchrtInput,
} from "./types.js";

export interface SchedulingRuntimeOptions {
  configuration?: Partial<SchedulingRuntimeConfiguration>;
  dependencies?: SchedulingRuntimeDependencies;
}

/**
 * Authoritative Q10-12 Scheduling Runtime — enterprise schedule coordination.
 *
 * SCHRT registers schedules, computes deterministic nextExecution, evaluates due
 * schedules, fires event-driven triggers, detects conflicts, and produces
 * Scheduling Runtime Reports consumable by Q10-13 — without fabricating
 * execution times, replacing Queue/Mission Runtime, or bypassing Pillow/Grand King.
 *
 * Distinct from queue-runtime/scheduler.ts.
 */
export class SchedulingRuntime {
  private initializedAt: string | null = null;
  private readonly controller: SchedulingRuntimeController;
  private readonly manager: SchedulingRuntimeManager;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: SchedulingRuntimeOptions = {},
  ) {
    this.manager = new SchedulingRuntimeManager();
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new SchedulingRuntimeController(
      this.manager,
      buildSchedulingRuntimeConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      SCHEDULING_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("Scheduling Runtime")) {
      throw new Error(
        `${SCHEDULING_RUNTIME_SYSTEM_PATH} missing — Q10-12 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: SchedulingRuntimeDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): SchedulingRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Scheduling Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-SCHRT-001",
      missionId: "Q10-12",
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
        totalSchedules: engineRecord?.totalSchedules ?? 0,
        totalExecutions: engineRecord?.totalExecutions ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        notes: [
          "Enterprise scheduling runtime only: deterministic next/previous execution, no fabricated times, structural mission/queue signals only, no Pillow/Grand King bypass, distinct from queue-runtime/scheduler.ts, does not implement Q10-13+.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  createSchedule(input: SchrtInput = {}) {
    return this.controller.createSchedule(input);
  }

  updateSchedule(input: SchrtInput = {}) {
    return this.controller.updateSchedule(input);
  }

  pauseSchedule(input: SchrtInput = {}) {
    return this.controller.pauseSchedule(input);
  }

  resumeSchedule(input: SchrtInput = {}) {
    return this.controller.resumeSchedule(input);
  }

  cancelSchedule(input: SchrtInput = {}) {
    return this.controller.cancelSchedule(input);
  }

  triggerEvent(input: SchrtInput = {}) {
    return this.controller.triggerEvent(input);
  }

  evaluateDue(input: SchrtInput = {}) {
    return this.controller.evaluateDue(input);
  }

  detectConflicts(input: SchrtInput = {}) {
    return this.controller.detectConflicts(input);
  }

  produceReport(input: SchrtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: SchrtInput = {}) {
    return this.controller.submitReport(input);
  }

  list(input: SchrtInput = {}) {
    return this.controller.list(input);
  }

  validate(input: SchrtInput = {}) {
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

  getQ1013ConsumableContract() {
    return this.controller.getQ1013ConsumableContract();
  }

  getCockpitSnapshot(): SchedulingRuntimeCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }
}

export function createSchedulingRuntime(
  bootstrap: EmpireBootstrapContext,
  options: SchedulingRuntimeOptions = {},
) {
  return new SchedulingRuntime(bootstrap, options);
}

export function resetSchedulingRuntimeForTesting() {
  resetSchrtLogsForTesting();
  resetSchrtSequenceForTesting();
}
