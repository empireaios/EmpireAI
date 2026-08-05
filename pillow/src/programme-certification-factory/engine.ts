import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildProgrammeCertificationFactoryConfiguration,
  type ProgrammeCertificationFactoryConfiguration,
} from "./configuration.js";
import type { ProgrammeCertificationFactoryDependencies } from "./integrations.js";
import {
  ProgrammeCertificationFactoryManager,
  resetProgrammeCertificationFactoryManagerSequencesForTesting,
} from "./programme-certification-factory-manager.js";
import { ProgrammeCertificationFactoryController } from "./programme-certification-factory-controller.js";
import { resetPcfctLogsForTesting } from "./pcfct-logging.js";
import { PROGRAMME_CERTIFICATION_FACTORY_SYSTEM_PATH } from "./paths.js";
import { resetPcfctSequenceForTesting } from "./audit-store.js";
import type {
  ProgrammeCertificationFactoryCockpitSnapshot,
  ProgrammeCertificationFactoryState,
  PcfctInput,
  ProgrammeCode,
} from "./types.js";

export interface ProgrammeCertificationFactoryOptions {
  configuration?: Partial<ProgrammeCertificationFactoryConfiguration>;
  dependencies?: ProgrammeCertificationFactoryDependencies;
}

/**
 * Authoritative Q13-06 Programme Certification Factory — FINAL Q Series mission.
 * Consumes getQ1306ConsumableContract from implementationRecoveryPlanner (IRPLN, Q13-05).
 * Emits getQSeriesConstitutionalCompletionContract — NOT a Q13-07 consumer.
 */
export class ProgrammeCertificationFactory {
  private initializedAt: string | null = null;
  private readonly manager: ProgrammeCertificationFactoryManager;
  private readonly controller: ProgrammeCertificationFactoryController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ProgrammeCertificationFactoryOptions = {},
  ) {
    this.manager = new ProgrammeCertificationFactoryManager();
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new ProgrammeCertificationFactoryController(
      this.manager,
      buildProgrammeCertificationFactoryConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      PROGRAMME_CERTIFICATION_FACTORY_SYSTEM_PATH,
    );
    if (!doc?.includes("Programme Certification Factory")) {
      throw new Error(`${PROGRAMME_CERTIFICATION_FACTORY_SYSTEM_PATH} missing — Q13-06 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ProgrammeCertificationFactoryDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): ProgrammeCertificationFactoryState {
    if (!this.initializedAt) {
      throw new Error("Programme Certification Factory not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const latestFinalCertification = this.controller.getLatestFinalCertification();
    return {
      engineVersion: "PILLOW-PCFCT-001",
      missionId: "Q13-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      latestFinalCertification,
      discoveredProgrammes: this.controller.getDiscoveredProgrammes(),
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: Math.round((latestReport?.programmeCertification.confidenceScore ?? 0) * 100) || 0,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        totalCertifications: engineRecord?.totalCertifications ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastCertificationId: engineRecord?.lastCertificationId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Programme Certification Factory: FINAL Q Series mission Q13-06; never implements Q13-07 or later.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  discoverApprovedProgrammes() {
    return this.controller.discoverApprovedProgrammes();
  }

  auditProgrammeRepository(input: PcfctInput = {}) {
    return this.controller.auditProgrammeRepository(input);
  }

  compareAgainstRoadmapEvidence() {
    return this.controller.compareAgainstRoadmapEvidence();
  }

  classifyMissions(input: PcfctInput = {}) {
    return this.controller.classifyMissions(input);
  }

  produceProgrammeGapAnalysis(input: PcfctInput = {}) {
    return this.controller.produceProgrammeGapAnalysis(input);
  }

  generateCompletionRecommendations(input: PcfctInput = {}) {
    return this.controller.generateCompletionRecommendations(input);
  }

  verifyCompletionAfterCorrections(input: PcfctInput = {}) {
    return this.controller.verifyCompletionAfterCorrections(input);
  }

  certifyProgramme(input: PcfctInput = {}) {
    return this.controller.certifyProgramme(input);
  }

  produceProgrammeCertificationReport(input: PcfctInput = {}) {
    return this.controller.produceProgrammeCertificationReport(input);
  }

  async produceReport(input: PcfctInput = {}) {
    return this.produceProgrammeCertificationReport(input);
  }

  produceFinalRepositoryConstitutionalCertification(input: PcfctInput = {}) {
    return this.controller.produceFinalRepositoryConstitutionalCertification(input);
  }

  submitReport(input: PcfctInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.manager.getReports();
  }

  getCertifications() {
    return this.manager.getCertifications();
  }

  getCatalog() {
    return this.manager.getCatalog();
  }

  getAuditTrail(limit = 100) {
    return this.manager.getAuditTrail(limit);
  }

  getCertificationHistory(limit = 100) {
    return this.manager.getCertificationHistory(limit);
  }

  getQSeriesConstitutionalCompletionContract() {
    return this.controller.getQSeriesConstitutionalCompletionContract();
  }

  validate(input: PcfctInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  getCockpitSnapshot(): ProgrammeCertificationFactoryCockpitSnapshot {
    const state = this.getState();
    const certifications = this.manager.getCertifications();
    return {
      missionId: "Q13-06",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalCertifications: state.health.totalCertifications,
      latestReportId: state.health.lastReportId,
      latestCertificationId: state.health.lastCertificationId,
      workerId: state.configuration.workerId,
      programmesDiscovered: state.discoveredProgrammes.length,
      programmesCertified: certifications.length,
      neverFabricateFindings: true,
      neverAutoModifyProduction: true,
      neverCertifyFromClaimsAlone: true,
      neverImplementFutureProgramme: true,
      neverImplementQ1307OrLater: true,
      neverBypassGovernance: true,
      finalQSeriesMission: true,
    };
  }

  validateForSupervisorSync() {
    const diagnostics = this.runDiagnostics();
    return {
      missionId: "Q13-06" as const,
      readinessScore: diagnostics.readinessScore,
      q1306PrerequisitePresent: diagnostics.q1306PrerequisitePresent,
      reports: diagnostics.reports,
      certifications: diagnostics.certifications,
      finalQSeriesMission: true as const,
    };
  }
}

export function createProgrammeCertificationFactory(
  bootstrap: EmpireBootstrapContext,
  options?: ProgrammeCertificationFactoryOptions,
) {
  return new ProgrammeCertificationFactory(bootstrap, options);
}

export function resetProgrammeCertificationFactoryForTesting() {
  resetPcfctSequenceForTesting();
  resetPcfctLogsForTesting();
  resetProgrammeCertificationFactoryManagerSequencesForTesting();
}

/** Alias to avoid clash with EmpireProgrammeCertificationResult elsewhere. */
export type { ProgrammeCertification as ProgrammeSeriesCertification } from "./types.js";
