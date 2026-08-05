import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMonitoringRuntimeConfiguration,
  type MonitoringRuntimeConfiguration,
} from "./configuration.js";
import type { MonitoringRuntimeDependencies } from "./integrations.js";
import { MonitoringRuntimeController } from "./monitoring-runtime-controller.js";
import { MonitoringRuntimeManager } from "./monitoring-runtime-manager.js";
import { resetMonrtLogsForTesting } from "./monrt-logging.js";
import { MONITORING_RUNTIME_SYSTEM_PATH } from "./paths.js";
import { resetMonrtSequenceForTesting } from "./monitoring-store.js";
import type {
  MonitoringRuntimeCockpitSnapshot,
  MonitoringRuntimeState,
  MonrtInput,
} from "./types.js";

export interface MonitoringRuntimeOptions {
  configuration?: Partial<MonitoringRuntimeConfiguration>;
  dependencies?: MonitoringRuntimeDependencies;
}

/**
 * Authoritative Q10-10 Monitoring Runtime — enterprise monitoring and health service.
 *
 * MONRT registers components, collects heartbeats, monitors workers/factories/runtimes/
 * APIs/queues/missions/tools from observed evidence only, detects anomalies, generates
 * alerts (critical never suppressed), calculates health deterministically, and produces
 * Monitoring Runtime Reports consumable by Q10-11 Recovery Runtime — without fabricating
 * health, auto-repairing, replacing recovery systems, or bypassing Pillow/Grand King.
 */
export class MonitoringRuntime {
  private initializedAt: string | null = null;
  private readonly controller: MonitoringRuntimeController;
  private readonly manager: MonitoringRuntimeManager;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: MonitoringRuntimeOptions = {},
  ) {
    this.manager = new MonitoringRuntimeManager();
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new MonitoringRuntimeController(
      this.manager,
      buildMonitoringRuntimeConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      MONITORING_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("Monitoring Runtime")) {
      throw new Error(
        `${MONITORING_RUNTIME_SYSTEM_PATH} missing — Q10-10 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: MonitoringRuntimeDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): MonitoringRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Monitoring Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-MONRT-001",
      missionId: "Q10-10",
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
        totalComponents: engineRecord?.totalComponents ?? 0,
        totalAlerts: engineRecord?.totalAlerts ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        notes: [
          "Enterprise monitoring runtime only: observed evidence health, no fabricated health, no critical alert suppression, no auto-repair, no recovery replacement, no Pillow/Grand King bypass, does not implement Q10-11+.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  registerComponent(input: MonrtInput = {}) {
    return this.controller.registerComponent(input);
  }

  recordHeartbeat(input: MonrtInput = {}) {
    return this.controller.recordHeartbeat(input);
  }

  monitorWorkers(input: MonrtInput = {}) {
    return this.controller.monitorWorkers(input);
  }

  monitorFactories(input: MonrtInput = {}) {
    return this.controller.monitorFactories(input);
  }

  monitorRuntimes(input: MonrtInput = {}) {
    return this.controller.monitorRuntimes(input);
  }

  monitorApis(input: MonrtInput = {}) {
    return this.controller.monitorApis(input);
  }

  monitorQueues(input: MonrtInput = {}) {
    return this.controller.monitorQueues(input);
  }

  monitorMissions(input: MonrtInput = {}) {
    return this.controller.monitorMissions(input);
  }

  monitorTools(input: MonrtInput = {}) {
    return this.controller.monitorTools(input);
  }

  detectAnomalies(input: MonrtInput = {}) {
    return this.controller.detectAnomalies(input);
  }

  generateAlerts(input: MonrtInput = {}) {
    return this.controller.generateAlerts(input);
  }

  produceReport(input: MonrtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: MonrtInput = {}) {
    return this.controller.submitReport(input);
  }

  list(input: MonrtInput = {}) {
    return this.controller.list(input);
  }

  validate(input: MonrtInput = {}) {
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

  getQ1011ConsumableContract() {
    return this.controller.getQ1011ConsumableContract();
  }

  getDashboard() {
    return this.controller.getDashboard();
  }

  getCockpitSnapshot(): MonitoringRuntimeCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }
}

export function createMonitoringRuntime(
  bootstrap: EmpireBootstrapContext,
  options: MonitoringRuntimeOptions = {},
) {
  return new MonitoringRuntime(bootstrap, options);
}

export function resetMonitoringRuntimeForTesting() {
  resetMonrtLogsForTesting();
  resetMonrtSequenceForTesting();
}
