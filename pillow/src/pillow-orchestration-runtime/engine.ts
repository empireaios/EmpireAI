import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPillowOrchestrationRuntimeConfiguration,
  type PillowOrchestrationRuntimeConfiguration,
} from "./configuration.js";
import type { PillowOrchestrationRuntimeDependencies } from "./integrations.js";
import { OrchestrationManager } from "./orchestration-manager.js";
import { PillowOrchestrationRuntimeController } from "./pillow-orchestration-runtime-controller.js";
import { resetPorLogsForTesting } from "./por-logging.js";
import { PILLOW_ORCHESTRATION_RUNTIME_SYSTEM_PATH } from "./paths.js";
import { resetPorSequenceForTesting } from "./orchestration-store.js";
import type {
  PillowOrchestrationRuntimeCockpitSnapshot,
  PillowOrchestrationRuntimeState,
  PorInput,
} from "./types.js";

export interface PillowOrchestrationRuntimeOptions {
  configuration?: Partial<PillowOrchestrationRuntimeConfiguration>;
  dependencies?: PillowOrchestrationRuntimeDependencies;
}

/**
 * Authoritative Q10-02 Pillow Orchestration Runtime — executive orchestration layer on Shared Runtime Core.
 *
 * POR invokes registered workers/tools/workflows via orchestration records, routes approvals through
 * Approval Runtime interfaces, retrieves executive reports via ERR, coordinates cross-factory
 * orchestration using SRTC routing, and produces Orchestration Reports consumable by Q10-03.
 */
export class PillowOrchestrationRuntime {
  private initializedAt: string | null = null;
  private readonly controller: PillowOrchestrationRuntimeController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: PillowOrchestrationRuntimeOptions = {},
  ) {
    const manager = new OrchestrationManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new PillowOrchestrationRuntimeController(
      manager,
      buildPillowOrchestrationRuntimeConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      PILLOW_ORCHESTRATION_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("Pillow Orchestration Runtime")) {
      throw new Error(
        `${PILLOW_ORCHESTRATION_RUNTIME_SYSTEM_PATH} missing — Q10-02 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: PillowOrchestrationRuntimeDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): PillowOrchestrationRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Pillow Orchestration Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-POR-001",
      missionId: "Q10-02",
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
        totalSessions: engineRecord?.totalSessions ?? 0,
        totalInvocations: engineRecord?.totalInvocations ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        notes: [
          "Executive orchestration layer only: does not replace worker/tool implementations, execute unauthorised actions, fabricate execution results, bypass approval runtime, override Pillow/Grand King, or implement Q10-03+.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  createSession(input: PorInput = {}) {
    return this.controller.createSession(input);
  }

  invokeWorker(input: PorInput = {}) {
    return this.controller.invokeWorker(input);
  }

  invokeTool(input: PorInput = {}) {
    return this.controller.invokeTool(input);
  }

  invokeWorkflow(input: PorInput = {}) {
    return this.controller.invokeWorkflow(input);
  }

  routeApproval(input: PorInput = {}) {
    return this.controller.routeApproval(input);
  }

  retrieveReport(input: PorInput = {}) {
    return this.controller.retrieveReport(input);
  }

  orchestrateCrossFactory(input: PorInput = {}) {
    return this.controller.orchestrateCrossFactory(input);
  }

  produceOrchestrationReport(input: PorInput = {}) {
    return this.controller.produceOrchestrationReport(input);
  }

  submitReport(input: PorInput = {}) {
    return this.controller.submitReport(input);
  }

  list(input: PorInput = {}) {
    return this.controller.list(input);
  }

  validate(input: PorInput = {}) {
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

  getQ1003ConsumableContract() {
    return this.controller.getQ1003ConsumableContract();
  }

  getCockpitSnapshot(): PillowOrchestrationRuntimeCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }
}

export function createPillowOrchestrationRuntime(
  bootstrap: EmpireBootstrapContext,
  options: PillowOrchestrationRuntimeOptions = {},
) {
  return new PillowOrchestrationRuntime(bootstrap, options);
}

export function resetPillowOrchestrationRuntimeForTesting() {
  resetPorLogsForTesting();
  resetPorSequenceForTesting();
}
