import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildToolRuntimeConfiguration,
  type ToolRuntimeConfiguration,
} from "./configuration.js";
import type { ToolRuntimeDependencies } from "./integrations.js";
import { ToolRuntimeController } from "./tool-runtime-controller.js";
import { ToolRuntimeManager } from "./tool-runtime-manager.js";
import { resetToolrtLogsForTesting } from "./toolrt-logging.js";
import { TOOL_RUNTIME_SYSTEM_PATH } from "./paths.js";
import { resetToolrtSequenceForTesting } from "./tool-store.js";
import type {
  ToolRuntimeCockpitSnapshot,
  ToolRuntimeState,
  ToolrtInput,
} from "./types.js";

export interface ToolRuntimeOptions {
  configuration?: Partial<ToolRuntimeConfiguration>;
  dependencies?: ToolRuntimeDependencies;
}

/**
 * Authoritative Q10-07 Tool Runtime — enterprise tool registration and invocation service.
 *
 * TOOLRT registers tools, discovers them by category/provider/availability, authenticates
 * via credentialReference only, invokes approved actions with permission gating and retries,
 * and produces Tool Runtime Reports consumable by Q10-08 Communication Runtime — without
 * fabricating execution results, exposing secrets, or bypassing Pillow/Grand King governance.
 */
export class ToolRuntime {
  private initializedAt: string | null = null;
  private readonly controller: ToolRuntimeController;
  private readonly manager: ToolRuntimeManager;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ToolRuntimeOptions = {},
  ) {
    this.manager = new ToolRuntimeManager();
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new ToolRuntimeController(
      this.manager,
      buildToolRuntimeConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      TOOL_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("Tool Runtime")) {
      throw new Error(`${TOOL_RUNTIME_SYSTEM_PATH} missing — Q10-07 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ToolRuntimeDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ToolRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Tool Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-TOOLRT-001",
      missionId: "Q10-07",
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
        totalTools: engineRecord?.totalTools ?? 0,
        totalInvocations: engineRecord?.totalInvocations ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        notes: [
          "Enterprise tool runtime only: credentialReference auth, no secret exposure, no fabricated execution results, no unauthorized tool invocation, no Pillow/Grand King bypass, does not implement Q10-08+.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  registerTool(input: ToolrtInput = {}) {
    return this.controller.registerTool(input);
  }

  discoverTools(input: ToolrtInput = {}) {
    return this.controller.discoverTools(input);
  }

  authenticate(input: ToolrtInput = {}) {
    return this.controller.authenticate(input);
  }

  invokeTool(input: ToolrtInput = {}) {
    return this.controller.invokeTool(input);
  }

  checkAvailability(input: ToolrtInput = {}) {
    return this.controller.checkAvailability(input);
  }

  produceReport(input: ToolrtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: ToolrtInput = {}) {
    return this.controller.submitReport(input);
  }

  list(input: ToolrtInput = {}) {
    return this.controller.list(input);
  }

  validate(input: ToolrtInput = {}) {
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

  getQ1008ConsumableContract() {
    return this.controller.getQ1008ConsumableContract();
  }

  getCockpitSnapshot(): ToolRuntimeCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }
}

export function createToolRuntime(
  bootstrap: EmpireBootstrapContext,
  options: ToolRuntimeOptions = {},
) {
  return new ToolRuntime(bootstrap, options);
}

export function resetToolRuntimeForTesting() {
  resetToolrtLogsForTesting();
  resetToolrtSequenceForTesting();
}
