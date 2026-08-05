import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCommunicationRuntimeConfiguration,
  type CommunicationRuntimeConfiguration,
} from "./configuration.js";
import type { CommunicationRuntimeDependencies } from "./integrations.js";
import { CommunicationRuntimeController } from "./communication-runtime-controller.js";
import { CommunicationRuntimeManager } from "./communication-runtime-manager.js";
import { resetComrtLogsForTesting } from "./comrt-logging.js";
import { COMMUNICATION_RUNTIME_SYSTEM_PATH } from "./paths.js";
import { resetComrtSequenceForTesting } from "./communication-store.js";
import type {
  CommunicationRuntimeCockpitSnapshot,
  CommunicationRuntimeState,
  ComrtInput,
} from "./types.js";

export interface CommunicationRuntimeOptions {
  configuration?: Partial<CommunicationRuntimeConfiguration>;
  dependencies?: CommunicationRuntimeDependencies;
}

/**
 * Authoritative Q10-08 Communication Runtime — enterprise inter-worker/factory messaging service.
 *
 * COMRT opens channels, routes messages deterministically, supports sync/async delivery,
 * acknowledgements, retries, collaboration sessions, and produces Communication Runtime Reports
 * consumable by Q10-09 Approval Runtime — without fabricating messages, losing acknowledged
 * history, exposing secrets, or bypassing Pillow/Grand King governance.
 */
export class CommunicationRuntime {
  private initializedAt: string | null = null;
  private readonly controller: CommunicationRuntimeController;
  private readonly manager: CommunicationRuntimeManager;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: CommunicationRuntimeOptions = {},
  ) {
    this.manager = new CommunicationRuntimeManager();
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new CommunicationRuntimeController(
      this.manager,
      buildCommunicationRuntimeConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      COMMUNICATION_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("Communication Runtime")) {
      throw new Error(
        `${COMMUNICATION_RUNTIME_SYSTEM_PATH} missing — Q10-08 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: CommunicationRuntimeDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): CommunicationRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Communication Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-COMRT-001",
      missionId: "Q10-08",
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
        totalChannels: engineRecord?.totalChannels ?? 0,
        totalMessages: engineRecord?.totalMessages ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        notes: [
          "Enterprise communication runtime only: contextReference messaging, no fabricated messages, no acknowledged history loss, no Pillow/Grand King bypass, does not implement Q10-09+.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  openChannel(input: ComrtInput = {}) {
    return this.controller.openChannel(input);
  }

  sendMessage(input: ComrtInput = {}) {
    return this.controller.sendMessage(input);
  }

  acknowledgeMessage(input: ComrtInput = {}) {
    return this.controller.acknowledgeMessage(input);
  }

  openCollaborationSession(input: ComrtInput = {}) {
    return this.controller.openCollaborationSession(input);
  }

  closeCollaborationSession(input: ComrtInput = {}) {
    return this.controller.closeCollaborationSession(input);
  }

  retryFailed(input: ComrtInput = {}) {
    return this.controller.retryFailed(input);
  }

  produceReport(input: ComrtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: ComrtInput = {}) {
    return this.controller.submitReport(input);
  }

  list(input: ComrtInput = {}) {
    return this.controller.list(input);
  }

  validate(input: ComrtInput = {}) {
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

  getQ1009ConsumableContract() {
    return this.controller.getQ1009ConsumableContract();
  }

  getCockpitSnapshot(): CommunicationRuntimeCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }
}

export function createCommunicationRuntime(
  bootstrap: EmpireBootstrapContext,
  options: CommunicationRuntimeOptions = {},
) {
  return new CommunicationRuntime(bootstrap, options);
}

export function resetCommunicationRuntimeForTesting() {
  resetComrtLogsForTesting();
  resetComrtSequenceForTesting();
}
