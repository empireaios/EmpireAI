import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSharedRuntimeCoreConfiguration,
  type SharedRuntimeCoreConfiguration,
} from "./configuration.js";
import type { IntegrationWiringDeps } from "../common/integration-wiring.js";
import type { SharedRuntimeCoreDependencies } from "./integrations.js";
import { RuntimeManager } from "./runtime-manager.js";
import { SharedRuntimeCoreController } from "./shared-runtime-core-controller.js";
import { resetSrtcLogsForTesting } from "./srtc-logging.js";
import { SHARED_RUNTIME_CORE_SYSTEM_PATH } from "./paths.js";
import { resetSrtcSequenceForTesting } from "./runtime-store.js";
import type {
  SharedRuntimeCoreCockpitSnapshot,
  SharedRuntimeCoreState,
  SrtcInput,
} from "./types.js";

export interface SharedRuntimeCoreOptions {
  configuration?: Partial<SharedRuntimeCoreConfiguration>;
  dependencies?: SharedRuntimeCoreDependencies;
}

/**
 * Authoritative Q10-01 Shared Runtime Core — foundational orchestration infrastructure.
 *
 * SRTC registers factories and workers into a unified runtime registry, provides shared
 * execution context, routes cross-factory requests as records only (never invokes business
 * logic), coordinates runtime lifecycle and health, and produces Shared Runtime Reports.
 */
export class SharedRuntimeCore {
  private initializedAt: string | null = null;
  private readonly controller: SharedRuntimeCoreController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: SharedRuntimeCoreOptions = {},
  ) {
    const manager = new RuntimeManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new SharedRuntimeCoreController(
      manager,
      buildSharedRuntimeCoreConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      SHARED_RUNTIME_CORE_SYSTEM_PATH,
    );
    if (!doc?.includes("Shared Runtime Core")) {
      throw new Error(`${SHARED_RUNTIME_CORE_SYSTEM_PATH} missing — Q10-01 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: IntegrationWiringDeps = {}) {
    this.controller.bindIntegrations(deps as SharedRuntimeCoreDependencies);
  }

  getState(): SharedRuntimeCoreState {
    if (!this.initializedAt) {
      throw new Error("Shared Runtime Core not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-SRTC-001",
      missionId: "Q10-01",
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
        totalFactories: engineRecord?.totalFactories ?? 0,
        totalWorkers: engineRecord?.totalWorkers ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        notes: [
          "Orchestration infrastructure only: does not replace factory/worker logic, execute business decisions, fabricate runtime state, bypass Grand King approval, override Pillow, or implement Q10-02+.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  registerDefaultFactories(input: SrtcInput = {}) {
    return this.controller.registerDefaultFactories(input);
  }

  registerFactory(input: SrtcInput = {}) {
    return this.controller.registerFactory(input);
  }

  registerWorker(input: SrtcInput = {}) {
    return this.controller.registerWorker(input);
  }

  createExecutionContext(input: SrtcInput = {}) {
    return this.controller.createExecutionContext(input);
  }

  routeRequest(input: SrtcInput = {}) {
    return this.controller.routeRequest(input);
  }

  resolveDependencies(input: SrtcInput = {}) {
    return this.controller.resolveDependencies(input);
  }

  collectDiagnostics(input: SrtcInput = {}) {
    return this.controller.collectDiagnostics(input);
  }

  produceSharedRuntimeReport(input: SrtcInput = {}) {
    return this.controller.produceSharedRuntimeReport(input);
  }

  submitReport(input: SrtcInput = {}) {
    return this.controller.submitReport(input);
  }

  list(input: SrtcInput = {}) {
    return this.controller.list(input);
  }

  validate(input: SrtcInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getTopology() {
    return this.controller.getTopology();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  getQ1002ConsumableContract() {
    return this.controller.getQ1002ConsumableContract();
  }

  getCockpitSnapshot(): SharedRuntimeCoreCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }
}

export function createSharedRuntimeCore(
  bootstrap: EmpireBootstrapContext,
  options: SharedRuntimeCoreOptions = {},
) {
  return new SharedRuntimeCore(bootstrap, options);
}

export function resetSharedRuntimeCoreForTesting() {
  resetSrtcLogsForTesting();
  resetSrtcSequenceForTesting();
}
