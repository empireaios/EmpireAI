import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildQSeriesCertificationConfiguration,
  type QSeriesCertificationConfiguration,
} from "./configuration.js";
import type { QSeriesCertificationDependencies } from "./integrations.js";
import {
  QSeriesCertificationManager,
  resetQSeriesCertificationManagerSequencesForTesting,
} from "./q-series-certification-manager.js";
import { QSeriesCertificationController } from "./q-series-certification-controller.js";
import { resetQscrtLogsForTesting } from "./qscrt-logging.js";
import { Q_SERIES_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import { resetQscrtSequenceForTesting } from "./audit-store.js";
import type {
  QscrtInput,
  QSeriesCertificationCockpitSnapshot,
  QSeriesCertificationState,
} from "./types.js";

export interface QSeriesCertificationOptions {
  configuration?: Partial<QSeriesCertificationConfiguration>;
  dependencies?: QSeriesCertificationDependencies;
}

/**
 * Authoritative Q11-12 Q Series Certification — constitutional Q Series rollup
 * certification from injected evidence only. Consumes Q1112ConsumableContract from
 * injected postLaunchMonitoring; exposes Q1113ConsumableContract for Q11-13 without
 * implementing Q11-13.
 *
 * NEVER fabricates certification evidence, NEVER certifies missing functionality,
 * NEVER bypasses governance, NEVER overrides GK/Pillow, NEVER auto-greens the chain.
 */
export class QSeriesCertification {
  private initializedAt: string | null = null;
  private readonly manager: QSeriesCertificationManager;
  private readonly controller: QSeriesCertificationController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: QSeriesCertificationOptions = {},
  ) {
    this.manager = new QSeriesCertificationManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new QSeriesCertificationController(
      this.manager,
      buildQSeriesCertificationConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      Q_SERIES_CERTIFICATION_SYSTEM_PATH,
    );
    if (!doc?.includes("Q Series Certification")) {
      throw new Error(`${Q_SERIES_CERTIFICATION_SYSTEM_PATH} missing — Q11-12 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: QSeriesCertificationDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): QSeriesCertificationState {
    if (!this.initializedAt) {
      throw new Error("Q Series Certification not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-QSCRT-001",
      missionId: "Q11-12",
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
        lastCertificationDecision: engineRecord?.lastCertificationDecision ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Q Series Certification: honest certify rule — withhold when FINART/EAPRT/GK/PLMRT chain incomplete; never fabricate success.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  discoverFactories() {
    return this.controller.discoverFactories();
  }

  verifyWorkers() {
    return this.controller.verifyWorkers();
  }

  verifyRuntimes() {
    return this.controller.verifyRuntimes();
  }

  verifyCrossFactoryOrchestration() {
    return this.controller.verifyCrossFactoryOrchestration();
  }

  verifyGovernanceCompliance() {
    return this.controller.verifyGovernanceCompliance();
  }

  verifyProductionReadiness() {
    return this.controller.verifyProductionReadiness();
  }

  aggregateCertificationEvidence() {
    return this.controller.aggregateCertificationEvidence();
  }

  classifyQSeriesReadiness(input: QscrtInput = {}) {
    return this.controller.classifyQSeriesReadiness(input);
  }

  produceQSeriesCertificationReport(input: QscrtInput = {}) {
    return this.controller.produceQSeriesCertificationReport(input);
  }

  certifyQSeries(input: QscrtInput = {}) {
    return this.controller.certifyQSeries(input);
  }

  produceReport(input: QscrtInput = {}) {
    return this.produceQSeriesCertificationReport(input);
  }

  submitReport(input: QscrtInput = {}) {
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

  getQ1113ConsumableContract() {
    return this.controller.getQ1113ConsumableContract();
  }

  getCertificationHistory(limit = 100) {
    return this.controller.getCertificationHistory(limit);
  }

  validate(input: QscrtInput = {}) {
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
        `Certification reports: ${state.health.totalReports}`,
        `Last certification decision: ${state.health.lastCertificationDecision ?? "none"}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): QSeriesCertificationCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q11-12",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastCertificationDecision: state.health.lastCertificationDecision,
      workerId: state.configuration.workerId,
      neverFabricateCertificationEvidence: true,
      neverCertifyMissingFunctionality: true,
      neverBypassGovernance: true,
      neverImplementQ1113OrLater: true,
    };
  }
}

export function createQSeriesCertification(
  bootstrap: EmpireBootstrapContext,
  options?: QSeriesCertificationOptions,
) {
  return new QSeriesCertification(bootstrap, options);
}

export function resetQSeriesCertificationForTesting() {
  resetQscrtLogsForTesting();
  resetQscrtSequenceForTesting();
  resetQSeriesCertificationManagerSequencesForTesting();
}
