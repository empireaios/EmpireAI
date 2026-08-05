import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMemoryRuntimeConfiguration,
  type MemoryRuntimeConfiguration,
} from "./configuration.js";
import type { MemoryRuntimeDependencies } from "./integrations.js";
import { MemoryRuntimeController } from "./memory-runtime-controller.js";
import { MemoryRuntimeManager } from "./memory-runtime-manager.js";
import { resetMemrtLogsForTesting } from "./memrt-logging.js";
import { MEMORY_RUNTIME_SYSTEM_PATH } from "./paths.js";
import { resetMemrtSequenceForTesting } from "./memory-store.js";
import type {
  MemoryRuntimeCockpitSnapshot,
  MemoryRuntimeState,
  MemrtInput,
} from "./types.js";

export interface MemoryRuntimeOptions {
  configuration?: Partial<MemoryRuntimeConfiguration>;
  dependencies?: MemoryRuntimeDependencies;
}

/**
 * Authoritative Q10-05 Memory Runtime — enterprise operational memory service.
 *
 * MEMRT stores/retrieves operational memory, decision history, previous results,
 * and runtime context with append-only versioning. It integrates with Shared Runtime
 * Core, Pillow Orchestration Runtime, Mission Runtime, Queue Runtime, Worker Registry,
 * ERR, Audit, and Recovery — without replacing EKLS, application DBs, or PILLOW-005.
 */
export class MemoryRuntime {
  private initializedAt: string | null = null;
  private readonly controller: MemoryRuntimeController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: MemoryRuntimeOptions = {},
  ) {
    const manager = new MemoryRuntimeManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new MemoryRuntimeController(
      manager,
      buildMemoryRuntimeConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      MEMORY_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("Memory Runtime")) {
      throw new Error(`${MEMORY_RUNTIME_SYSTEM_PATH} missing — Q10-05 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: MemoryRuntimeDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): MemoryRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Memory Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-MEMRT-001",
      missionId: "Q10-05",
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
        totalEntries: engineRecord?.totalEntries ?? 0,
        totalVersions: engineRecord?.totalVersions ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        notes: [
          "Enterprise operational memory service only: does not replace EKLS, application DBs, or PILLOW-005 repository memory, fabricate memory, silently overwrite historical decisions, bypass governance, or implement Q10-06+.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  storeMemory(input: MemrtInput = {}) {
    return this.controller.storeMemory(input);
  }

  retrieveMemory(input: MemrtInput = {}) {
    return this.controller.retrieveMemory(input);
  }

  storeDecision(input: MemrtInput = {}) {
    return this.controller.storeDecision(input);
  }

  retrieveDecisionHistory(input: MemrtInput = {}) {
    return this.controller.retrieveDecisionHistory(input);
  }

  retrievePreviousResults(input: MemrtInput = {}) {
    return this.controller.retrievePreviousResults(input);
  }

  provideRuntimeContext(input: MemrtInput = {}) {
    return this.controller.provideRuntimeContext(input);
  }

  listVersions(input: MemrtInput = {}) {
    return this.controller.listVersions(input);
  }

  produceReport(input: MemrtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: MemrtInput = {}) {
    return this.controller.submitReport(input);
  }

  list(input: MemrtInput = {}) {
    return this.controller.list(input);
  }

  validate(input: MemrtInput = {}) {
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

  getQ1006ConsumableContract() {
    return this.controller.getQ1006ConsumableContract();
  }

  getCockpitSnapshot(): MemoryRuntimeCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }
}

export function createMemoryRuntime(
  bootstrap: EmpireBootstrapContext,
  options: MemoryRuntimeOptions = {},
) {
  return new MemoryRuntime(bootstrap, options);
}

export function resetMemoryRuntimeForTesting() {
  resetMemrtLogsForTesting();
  resetMemrtSequenceForTesting();
}
