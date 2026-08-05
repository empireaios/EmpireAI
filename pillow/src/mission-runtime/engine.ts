import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMissionRuntimeConfiguration,
  type MissionRuntimeConfiguration,
} from "./configuration.js";
import type { MissionRuntimeDependencies } from "./integrations.js";
import { MissionRuntimeController } from "./mission-runtime-controller.js";
import { MissionManager } from "./mission-manager.js";
import { resetMsrLogsForTesting } from "./msr-logging.js";
import { MISSION_RUNTIME_SYSTEM_PATH } from "./paths.js";
import { resetMsrSequenceForTesting } from "./mission-store.js";
import type {
  MissionRuntimeCockpitSnapshot,
  MissionRuntimeState,
  MsrInput,
} from "./types.js";

export interface MissionRuntimeOptions {
  configuration?: Partial<MissionRuntimeConfiguration>;
  dependencies?: MissionRuntimeDependencies;
}

/**
 * Authoritative Q10-03 Mission Runtime — enterprise mission lifecycle manager.
 *
 * MSR creates, executes, monitors, pauses, resumes, retries, cancels, and recovers missions
 * with deterministic state transitions. It integrates with Shared Runtime Core, Pillow
 * Orchestration Runtime, Worker Registry, ERR, Audit, and Recovery — without replacing
 * worker or orchestration logic or bypassing governance.
 */
export class MissionRuntime {
  private initializedAt: string | null = null;
  private readonly controller: MissionRuntimeController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: MissionRuntimeOptions = {},
  ) {
    const manager = new MissionManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new MissionRuntimeController(
      manager,
      buildMissionRuntimeConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      MISSION_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("Mission Runtime")) {
      throw new Error(`${MISSION_RUNTIME_SYSTEM_PATH} missing — Q10-03 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: MissionRuntimeDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): MissionRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Mission Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-MSR-001",
      missionId: "Q10-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 85 : engineRecord ? 60 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalMissions: engineRecord?.totalMissions ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        notes: [
          "Enterprise mission lifecycle manager only: does not replace worker/orchestration logic, execute unauthorised missions, fabricate mission state, bypass governance, or implement Q10-04+.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  createMission(input: MsrInput = {}) {
    return this.controller.createMission(input);
  }

  queue(input: MsrInput = {}) {
    return this.controller.queue(input);
  }

  ready(input: MsrInput = {}) {
    return this.controller.ready(input);
  }

  execute(input: MsrInput = {}) {
    return this.controller.execute(input);
  }

  pause(input: MsrInput = {}) {
    return this.controller.pause(input);
  }

  resume(input: MsrInput = {}) {
    return this.controller.resume(input);
  }

  retry(input: MsrInput = {}) {
    return this.controller.retry(input);
  }

  cancel(input: MsrInput = {}) {
    return this.controller.cancel(input);
  }

  recover(input: MsrInput = {}) {
    return this.controller.recover(input);
  }

  archive(input: MsrInput = {}) {
    return this.controller.archive(input);
  }

  monitor(input: MsrInput = {}) {
    return this.controller.monitor(input);
  }

  produceReport(input: MsrInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: MsrInput = {}) {
    return this.controller.submitReport(input);
  }

  list(input: MsrInput = {}) {
    return this.controller.list(input);
  }

  validate(input: MsrInput = {}) {
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

  getQ1004ConsumableContract() {
    return this.controller.getQ1004ConsumableContract();
  }

  getCockpitSnapshot(): MissionRuntimeCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }
}

export function createMissionRuntime(
  bootstrap: EmpireBootstrapContext,
  options: MissionRuntimeOptions = {},
) {
  return new MissionRuntime(bootstrap, options);
}

export function resetMissionRuntimeForTesting() {
  resetMsrLogsForTesting();
  resetMsrSequenceForTesting();
}
