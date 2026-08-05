import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPostLaunchMonitoringConfiguration,
  type PostLaunchMonitoringConfiguration,
} from "./configuration.js";
import type { PostLaunchMonitoringDependencies } from "./integrations.js";
import {
  PostLaunchMonitoringManager,
  resetPostLaunchMonitoringManagerSequencesForTesting,
} from "./post-launch-monitoring-manager.js";
import { PostLaunchMonitoringController } from "./post-launch-monitoring-controller.js";
import { resetPlmrtLogsForTesting } from "./plmrt-logging.js";
import { POST_LAUNCH_MONITORING_SYSTEM_PATH } from "./paths.js";
import { resetPlmrtSequenceForTesting } from "./audit-store.js";
import type {
  PlmrtInput,
  PostLaunchMonitoringCockpitSnapshot,
  PostLaunchMonitoringState,
} from "./types.js";

export interface PostLaunchMonitoringOptions {
  configuration?: Partial<PostLaunchMonitoringConfiguration>;
  dependencies?: PostLaunchMonitoringDependencies;
}

/**
 * Authoritative Q11-11 Post-Launch Monitoring — production-active monitoring ONLY when
 * Grand King decision === approve AND deploymentAuthorisationStatus === authorised.
 * Consumes Q1111ConsumableContract from injected grandKingAcceptanceGate; exposes
 * Q1112ConsumableContract for Q11-12 without implementing Q11-12.
 *
 * NEVER fabricates production evidence, NEVER suppresses critical incidents,
 * NEVER hides failures, NEVER auto-modifies production, NEVER overrides GK/Pillow.
 */
export class PostLaunchMonitoring {
  private initializedAt: string | null = null;
  private readonly manager: PostLaunchMonitoringManager;
  private readonly controller: PostLaunchMonitoringController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: PostLaunchMonitoringOptions = {},
  ) {
    this.manager = new PostLaunchMonitoringManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new PostLaunchMonitoringController(
      this.manager,
      buildPostLaunchMonitoringConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      POST_LAUNCH_MONITORING_SYSTEM_PATH,
    );
    if (!doc?.includes("Post-Launch Monitoring")) {
      throw new Error(`${POST_LAUNCH_MONITORING_SYSTEM_PATH} missing — Q11-11 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: PostLaunchMonitoringDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): PostLaunchMonitoringState {
    if (!this.initializedAt) {
      throw new Error("Post-Launch Monitoring not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const verification = this.manager.getCurrentVerification();
    const grandKingAcceptanceGranted = verification?.grandKingAcceptanceGranted ?? latestReport?.grandKingAcceptanceGranted ?? false;
    const productionActiveMonitoring = verification?.productionActiveMonitoring ?? latestReport?.productionActiveMonitoring ?? false;
    return {
      engineVersion: "PILLOW-PLMRT-001",
      missionId: "Q11-11",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      grandKingAcceptanceGranted,
      productionActiveMonitoring,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: productionActiveMonitoring ? (latestReport?.productionHealthSummary.overallHealthScore ?? 70) : 0,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastProductionActiveMonitoring: engineRecord?.lastProductionActiveMonitoring ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Post-Launch Monitoring: production-active ONLY when Grand King approve + deployment authorised; honest standby/blocked evidence otherwise.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  verifyGrandKingAcceptanceGranted() {
    return this.controller.verifyGrandKingAcceptanceGranted();
  }

  startMonitoringSession(_input: Record<string, unknown> = {}) {
    return this.controller.startMonitoringSession();
  }

  monitorWorkers() {
    return this.controller.monitorWorkers();
  }

  monitorFactories() {
    return this.controller.monitorFactories();
  }

  monitorWorkflows() {
    return this.controller.monitorWorkflows();
  }

  monitorRuntimeServices() {
    return this.controller.monitorRuntimeServices();
  }

  monitorApiIntegrations() {
    return this.controller.monitorApiIntegrations();
  }

  detectIncidents() {
    return this.controller.detectIncidents();
  }

  detectAbnormalWorkerBehaviour() {
    return this.controller.detectAbnormalWorkerBehaviour();
  }

  generateAlerts() {
    return this.controller.generateAlerts();
  }

  produceProductionHealthSummary() {
    return this.controller.produceProductionHealthSummary();
  }

  producePostLaunchMonitoringReport(input: PlmrtInput = {}) {
    return this.controller.producePostLaunchMonitoringReport(input);
  }

  auditPostLaunch(input: PlmrtInput = {}) {
    return this.controller.auditPostLaunch(input);
  }

  produceReport(input: PlmrtInput = {}) {
    return this.producePostLaunchMonitoringReport(input);
  }

  submitReport(input: PlmrtInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.manager.getReports();
  }

  getCatalog() {
    return this.manager.getCatalog();
  }

  getAuditTrail(limit = 100) {
    return this.manager.getAuditTrail(limit);
  }

  getQ1112ConsumableContract() {
    return this.controller.getQ1112ConsumableContract();
  }

  getMonitoringHistory(limit = 100) {
    return this.controller.getMonitoringHistory(limit);
  }

  validate(input: PlmrtInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getIntegrations() {
    return this.manager.getIntegrations();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : Math.round((state.health.lastConfidenceScore ?? 0) * 100) || (state.productionActiveMonitoring ? 100 : 50);
    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Monitoring reports: ${state.health.totalReports}`,
        `Grand King acceptance granted: ${state.grandKingAcceptanceGranted}`,
        `Production active monitoring: ${state.productionActiveMonitoring}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PostLaunchMonitoringCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q11-11",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      grandKingAcceptanceGranted: state.grandKingAcceptanceGranted,
      productionActiveMonitoring: state.productionActiveMonitoring,
      workerId: state.configuration.workerId,
      neverFabricateProductionEvidence: true,
      neverSuppressCriticalIncidents: true,
      neverHideFailures: true,
      neverAutoModifyProduction: true,
      neverImplementQ1112OrLater: true,
    };
  }
}

export function createPostLaunchMonitoring(
  bootstrap: EmpireBootstrapContext,
  options?: PostLaunchMonitoringOptions,
) {
  return new PostLaunchMonitoring(bootstrap, options);
}

export function resetPostLaunchMonitoringForTesting() {
  resetPlmrtLogsForTesting();
  resetPlmrtSequenceForTesting();
  resetPostLaunchMonitoringManagerSequencesForTesting();
}
