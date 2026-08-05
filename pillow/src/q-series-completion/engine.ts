import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildQSeriesCompletionConfiguration,
  type QSeriesCompletionConfiguration,
} from "./configuration.js";
import type { QSeriesCompletionDependencies } from "./integrations.js";
import {
  QSeriesCompletionManager,
  resetQSeriesCompletionManagerSequencesForTesting,
} from "./q-series-completion-manager.js";
import { QSeriesCompletionController } from "./q-series-completion-controller.js";
import { resetQscptLogsForTesting } from "./qscpt-logging.js";
import { Q_SERIES_COMPLETION_SYSTEM_PATH } from "./paths.js";
import { resetQscptSequenceForTesting } from "./audit-store.js";
import type {
  QscptInput,
  QSeriesCompletionCockpitSnapshot,
  QSeriesCompletionState,
} from "./types.js";

export interface QSeriesCompletionOptions {
  configuration?: Partial<QSeriesCompletionConfiguration>;
  dependencies?: QSeriesCompletionDependencies;
}

/**
 * Authoritative Q11-13 Q Series Completion — constitutional Q Series programme completion
 * from injected evidence only. Consumes Q1113ConsumableContract from injected
 * qSeriesCertification; exposes Q1201ConsumableContract for Q12-01 without implementing Q12-01.
 *
 * NEVER fabricates completion evidence, NEVER marks complete when unmet,
 * NEVER bypasses governance, NEVER overrides GK/Pillow, NEVER auto-completes the series.
 */
export class QSeriesCompletion {
  private initializedAt: string | null = null;
  private readonly manager: QSeriesCompletionManager;
  private readonly controller: QSeriesCompletionController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: QSeriesCompletionOptions = {},
  ) {
    this.manager = new QSeriesCompletionManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new QSeriesCompletionController(
      this.manager,
      buildQSeriesCompletionConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      Q_SERIES_COMPLETION_SYSTEM_PATH,
    );
    if (!doc?.includes("Q Series Completion")) {
      throw new Error(`${Q_SERIES_COMPLETION_SYSTEM_PATH} missing — Q11-13 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: QSeriesCompletionDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): QSeriesCompletionState {
    if (!this.initializedAt) {
      throw new Error("Q Series Completion not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-QSCPT-001",
      missionId: "Q11-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: Math.round((latestReport?.confidenceScore ?? 0) * 100) || 0,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastCompletionDecision: engineRecord?.lastCompletionDecision ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Q Series Completion: honest complete rule — withhold/incomplete when FINART/EAPRT/GK/PLMRT/QSCRT chain incomplete; never fabricate success.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  verifyMissionCompletion() {
    return this.controller.verifyMissionCompletion();
  }

  verifyWorkforceCapabilities() {
    return this.controller.verifyWorkforceCapabilities();
  }

  verifyRuntimeIntegration() {
    return this.controller.verifyRuntimeIntegration();
  }

  verifyGovernanceCompliance() {
    return this.controller.verifyGovernanceCompliance();
  }

  verifyCertificationCompletion() {
    return this.controller.verifyCertificationCompletion();
  }

  verifyProductionReadiness() {
    return this.controller.verifyProductionReadiness();
  }

  aggregateFinalCompletionEvidence() {
    return this.controller.aggregateFinalCompletionEvidence();
  }

  produceFinalCompletionDecision(input: QscptInput = {}) {
    return this.controller.produceFinalCompletionDecision(input);
  }

  produceQSeriesCompletionReport(input: QscptInput = {}) {
    return this.controller.produceQSeriesCompletionReport(input);
  }

  completeQSeries(input: QscptInput = {}) {
    return this.controller.completeQSeries(input);
  }

  produceReport(input: QscptInput = {}) {
    return this.produceQSeriesCompletionReport(input);
  }

  submitReport(input: QscptInput = {}) {
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

  getQ1201ConsumableContract() {
    return this.controller.getQ1201ConsumableContract();
  }

  getCompletionHistory(limit = 100) {
    return this.controller.getCompletionHistory(limit);
  }

  validate(input: QscptInput = {}) {
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
          : Math.round((state.health.lastConfidenceScore ?? 0) * 100) || 50;
    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Completion reports: ${state.health.totalReports}`,
        `Last completion decision: ${state.health.lastCompletionDecision ?? "none"}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): QSeriesCompletionCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q11-13",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastCompletionDecision: state.health.lastCompletionDecision,
      workerId: state.configuration.workerId,
      neverFabricateCompletionEvidence: true,
      neverMarkCompleteWhenUnmet: true,
      neverBypassGovernance: true,
      neverImplementQ1201OrLater: true,
    };
  }
}

export function createQSeriesCompletion(
  bootstrap: EmpireBootstrapContext,
  options?: QSeriesCompletionOptions,
) {
  return new QSeriesCompletion(bootstrap, options);
}

export function resetQSeriesCompletionForTesting() {
  resetQscptLogsForTesting();
  resetQscptSequenceForTesting();
  resetQSeriesCompletionManagerSequencesForTesting();
}
