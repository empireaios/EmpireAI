import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildApiRuntimeConfiguration,
  type ApiRuntimeConfiguration,
} from "./configuration.js";
import type { ApiRuntimeDependencies } from "./integrations.js";
import { ApiRuntimeController } from "./api-runtime-controller.js";
import { ApiRuntimeManager } from "./api-runtime-manager.js";
import { resetApirtLogsForTesting } from "./apirt-logging.js";
import { API_RUNTIME_SYSTEM_PATH } from "./paths.js";
import { resetApirtSequenceForTesting } from "./api-store.js";
import type {
  ApiRuntimeCockpitSnapshot,
  ApiRuntimeState,
  ApirtInput,
} from "./types.js";

export interface ApiRuntimeOptions {
  configuration?: Partial<ApiRuntimeConfiguration>;
  dependencies?: ApiRuntimeDependencies;
}

/**
 * Authoritative Q10-06 API Runtime — enterprise API connection and routing service.
 *
 * APIRT registers providers, manages connections, authenticates via credentialReference
 * only, routes structural requests with rate limits / retries / circuit breakers, and
 * produces API Runtime Reports consumable by Q10-07 Tool Runtime — without fabricating
 * response bodies, exposing secrets, or bypassing Pillow/Grand King governance.
 */
export class ApiRuntime {
  private initializedAt: string | null = null;
  private readonly controller: ApiRuntimeController;
  private readonly manager: ApiRuntimeManager;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ApiRuntimeOptions = {},
  ) {
    this.manager = new ApiRuntimeManager();
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new ApiRuntimeController(
      this.manager,
      buildApiRuntimeConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      API_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("API Runtime")) {
      throw new Error(`${API_RUNTIME_SYSTEM_PATH} missing — Q10-06 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ApiRuntimeDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ApiRuntimeState {
    if (!this.initializedAt) {
      throw new Error("API Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-APIRT-001",
      missionId: "Q10-06",
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
        totalProviders: engineRecord?.totalProviders ?? 0,
        totalTraces: engineRecord?.totalTraces ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        notes: [
          "Enterprise API runtime only: credentialReference routing, no secret exposure, no fabricated response bodies, no Pillow/Grand King bypass, does not implement Q10-07+.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  registerProvider(input: ApirtInput = {}) {
    return this.controller.registerProvider(input);
  }

  manageConnection(input: ApirtInput = {}) {
    return this.controller.manageConnection(input);
  }

  authenticate(input: ApirtInput = {}) {
    return this.controller.authenticate(input);
  }

  routeRequest(input: ApirtInput = {}) {
    return this.controller.routeRequest(input);
  }

  checkHealth(input: ApirtInput = {}) {
    return this.controller.checkHealth(input);
  }

  produceReport(input: ApirtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: ApirtInput = {}) {
    return this.controller.submitReport(input);
  }

  list(input: ApirtInput = {}) {
    return this.controller.list(input);
  }

  validate(input: ApirtInput = {}) {
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

  getQ1007ConsumableContract() {
    return this.controller.getQ1007ConsumableContract();
  }

  getCockpitSnapshot(): ApiRuntimeCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }
}

export function createApiRuntime(
  bootstrap: EmpireBootstrapContext,
  options: ApiRuntimeOptions = {},
) {
  return new ApiRuntime(bootstrap, options);
}

export function resetApiRuntimeForTesting() {
  resetApirtLogsForTesting();
  resetApirtSequenceForTesting();
}
