import { GateManager, HealthMonitor, PcfctValidator } from "./audit-validator.js";
import {
  AuditStore,
  nextFinalCertificationId,
  nextHistoryEntryId,
  nextReportId,
  resetProgrammeCertificationFactoryManagerSequencesForTesting,
} from "./audit-store.js";
import type { ProgrammeCertificationFactoryConfiguration } from "./configuration.js";
import {
  auditProgrammeRepository,
  buildProgrammeCertification,
  classifyMissions,
  compareAgainstRoadmapEvidence,
  consumeQ1306Contract,
  CONSTITUTIONAL_PROGRAMME_CODES,
  detectRemainingConstitutionalExceptions,
  discoverApprovedProgrammes,
  generateCompletionRecommendations,
  produceProgrammeGapAnalysis,
  resolveRepositorySnapshot,
  validateBoundaries,
  validateGovernance,
  verifyCompletionAfterCorrections,
} from "./evidence-collector.js";
import {
  IntegrationCoordinator,
  verifyIntegrations,
  type ProgrammeCertificationFactoryDependencies,
} from "./integrations.js";
import { appendPcfctLog } from "./pcfct-logging.js";
import { buildCatalog, buildFinalRepositoryConstitutionalCertification, buildReport } from "./report-builder.js";
import {
  PCFCT_CAPABILITIES,
  PCFCT_METADATA_VERSION,
  PROGRAMME_CERTIFICATION_FACTORY_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  ApprovedProgramme,
  FinalRepositoryConstitutionalCertification,
  PcfctInput,
  ProgrammeAuditResult,
  ProgrammeCertification,
  ProgrammeCertificationReport,
  QSeriesConstitutionalCompletionContract,
} from "./types.js";

export { resetProgrammeCertificationFactoryManagerSequencesForTesting };

export class ProgrammeCertificationFactoryManager {
  private discoveredProgrammes: ApprovedProgramme[] = [];
  private programmeAudits: Map<string, ProgrammeAuditResult> = new Map();
  private readonly store = new AuditStore();
  private readonly validator = new PcfctValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly gateManager = new GateManager();
  private readonly integrations = new IntegrationCoordinator();
  private engineRecord: import("./types.js").PcfctEngineRecord | null = null;
  private seeded = false;

  bindIntegrations(deps: ProgrammeCertificationFactoryDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ProgrammeCertificationFactoryConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getReports() {
    return this.store.listReports();
  }

  getCertifications() {
    return this.store.listCertifications();
  }

  getLatestReport() {
    return this.store.getLatestReport();
  }

  getLatestFinalCertification() {
    return this.store.getLatestFinalCertification();
  }

  getDiscoveredProgrammes() {
    return this.discoveredProgrammes.map((p) => ({ ...p }));
  }

  getCatalog() {
    return buildCatalog(
      PROGRAMME_CERTIFICATION_FACTORY_IDENTITY.workerId,
      this.store.listReports(),
      this.store.listCertifications(),
      this.integrations.getHandshakes(),
      this.store.getCertificationHistory().length,
    );
  }

  getCertificationHistory(limit = 100) {
    return this.store.getCertificationHistory(limit);
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  connect(config: ProgrammeCertificationFactoryConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendPcfctLog({ event: "connect", details: `Programme Certification Factory connected; integrations=${handshakes.length}` });
    return handshakes;
  }

  discoverApprovedProgrammes(config: ProgrammeCertificationFactoryConfiguration) {
    this.discoveredProgrammes = discoverApprovedProgrammes(config.repositoryRoot);
    appendPcfctLog({ event: "discover_programmes", details: `programmes=${this.discoveredProgrammes.length}` });
    return this.getDiscoveredProgrammes();
  }

  auditProgrammeRepository(input: PcfctInput, config: ProgrammeCertificationFactoryConfiguration) {
    const programmes = this.discoveredProgrammes.length
      ? this.discoveredProgrammes
      : discoverApprovedProgrammes(config.repositoryRoot);
    const targetCode = input.programmeCode;
    const toAudit = targetCode ? programmes.filter((p) => p.programmeCode === targetCode) : programmes;
    const results: ProgrammeAuditResult[] = [];
    for (const programme of toAudit) {
      const audit = auditProgrammeRepository(config.repositoryRoot, programme);
      this.programmeAudits.set(programme.programmeCode, audit);
      results.push(audit);
    }
    appendPcfctLog({ event: "audit_programme", details: `audited=${results.length}` });
    return targetCode ? results[0] ?? null : results;
  }

  classifyMissions(input: PcfctInput) {
    const code = input.programmeCode;
    if (code) {
      const audit = this.programmeAudits.get(code);
      if (!audit) throw new Error(`Programme ${code} not audited — call auditProgrammeRepository first`);
      return classifyMissions(audit);
    }
    const all: import("./types.js").MissionInventoryEntry[] = [];
    for (const audit of this.programmeAudits.values()) {
      all.push(...classifyMissions(audit));
    }
    return all;
  }

  compareAgainstRoadmapEvidence() {
    const audits = [...this.programmeAudits.values()];
    return compareAgainstRoadmapEvidence(audits);
  }

  produceProgrammeGapAnalysis(input: PcfctInput) {
    const code = input.programmeCode;
    if (!code) throw new Error("programmeCode required for gap analysis");
    const audit = this.programmeAudits.get(code);
    if (!audit) throw new Error(`Programme ${code} not audited`);
    return produceProgrammeGapAnalysis(audit);
  }

  generateCompletionRecommendations(input: PcfctInput) {
    const code = input.programmeCode;
    if (!code) throw new Error("programmeCode required for recommendations");
    const audit = this.programmeAudits.get(code);
    if (!audit) throw new Error(`Programme ${code} not audited`);
    const gap = produceProgrammeGapAnalysis(audit);
    return generateCompletionRecommendations(gap, audit);
  }

  verifyCompletionAfterCorrections(input: PcfctInput, config: ProgrammeCertificationFactoryConfiguration) {
    const code = input.programmeCode;
    if (!code) throw new Error("programmeCode required");
    const programme = this.discoveredProgrammes.find((p) => p.programmeCode === code);
    if (!programme) throw new Error(`Programme ${code} not discovered`);
    const prior = this.programmeAudits.get(code);
    if (!prior) throw new Error(`Programme ${code} not previously audited`);
    const reaudit = verifyCompletionAfterCorrections(prior, config.repositoryRoot, programme);
    this.programmeAudits.set(code, reaudit);
    return reaudit;
  }

  certifyProgramme(input: PcfctInput, config: ProgrammeCertificationFactoryConfiguration) {
    const started = Date.now();
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedCertification(input, config, started);
    }
    const code = input.programmeCode;
    if (!code) throw new Error("programmeCode required for certification");
    const audit = this.programmeAudits.get(code);
    if (!audit) throw new Error(`Programme ${code} not audited`);
    const programme = this.discoveredProgrammes.find((p) => p.programmeCode === code);
    if (!programme) throw new Error(`Programme ${code} not discovered`);

    const deps = this.integrations.getDependencies();
    const snapshot = resolveRepositorySnapshot(config.repositoryRoot, deps);
    const gap = produceProgrammeGapAnalysis(audit);
    const certification = buildProgrammeCertification(audit, gap, snapshot, programme);
    this.store.saveCertification(certification);
    appendPcfctLog({ event: "certify_programme", details: `${code}:${certification.certificationStatus}` });
    this.ensureRecord("active", config, "healthy", undefined, certification);
    return certification;
  }

  async produceProgrammeCertificationReport(input: PcfctInput, config: ProgrammeCertificationFactoryConfiguration) {
    const started = Date.now();
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }
    const code = input.programmeCode;
    if (!code) throw new Error("programmeCode required for programme report");
    let certification = this.store.getCertification(code);
    if (!certification) {
      certification = this.certifyProgramme(input, config);
    }
    const audit = this.programmeAudits.get(code)!;
    const gap = produceProgrammeGapAnalysis(audit);
    const recommendations = generateCompletionRecommendations(gap, audit);
    const deps = this.integrations.getDependencies();
    const q1306 = consumeQ1306Contract(deps);
    const validation = this.validator.validateInput(input, started);
    const healthStatus = this.healthMonitor.evaluate(certification.confidenceScore, validation.decision);

    const report = buildReport({
      reportId: input.reportId ?? nextReportId(),
      workerId: config.workerId,
      programmeCode: code,
      programmeName: certification.programmeName,
      programmeCertification: certification,
      gapAnalysis: gap,
      recommendations,
      boundaryValidation: validateBoundaries(),
      governanceValidation: validateGovernance(deps),
      validation,
      confidenceScore: certification.confidenceScore,
      q1306ContractConsumed: q1306,
      supportingEvidence: [...audit.evidenceReferences, ...gap.gapSummary],
      historyRefs: [],
    });

    this.store.saveReport(report);
    this.store.saveCertificationHistory(this.buildHistoryEntry(report, certification));
    this.ensureRecord("active", config, healthStatus, report, certification);
    appendPcfctLog({ event: "produce_programme_report", details: report.reportId });
    return report;
  }

  produceFinalRepositoryConstitutionalCertification(input: PcfctInput, config: ProgrammeCertificationFactoryConfiguration) {
    if (this.validator.hasBoundaryViolation(input)) {
      throw new Error("Boundary violation — final certification withheld");
    }
    const required = [...CONSTITUTIONAL_PROGRAMME_CODES];
    if (!this.store.hasAllProgrammeCertifications(required)) {
      throw new Error(
        `Final certification requires individual records for all programmes (${required.join(", ")}) — certify each programme first`,
      );
    }
    const certifications = this.store.listCertifications();
    const overallMissionInventory = certifications.flatMap((c) => c.missionInventory);
    const deps = this.integrations.getDependencies();
    const q1306 = consumeQ1306Contract(deps);
    const exceptions = detectRemainingConstitutionalExceptions(config.repositoryRoot, certifications);

    const final = buildFinalRepositoryConstitutionalCertification({
      reportId: input.reportId ?? nextFinalCertificationId(),
      certifications,
      overallMissionInventory,
      remainingConstitutionalExceptions: exceptions,
      q1306ContractConsumed: q1306.consumed,
      supportingEvidence: certifications.flatMap((c) => c.evidenceReferences).slice(0, 20),
    });

    this.store.saveFinalCertification(final);
    appendPcfctLog({ event: "produce_final_certification", details: final.reportId });
    return final;
  }

  async submitReport(input: PcfctInput, config: ProgrammeCertificationFactoryConfiguration) {
    const report = await this.produceProgrammeCertificationReport(input, config);
    const errt = this.integrations.getDependencies().executiveReportingRuntime;
    if (!config.executiveReportingEnabled || !errt) {
      return { submitted: false, report, reason: "executiveReportingRuntime unavailable" };
    }
    const result = errt.submitWorkerReport({
      workerId: config.workerId,
      missionId: "Q13-06",
      reportId: report.reportId,
      report,
    });
    return { submitted: true, report, executiveRecords: result.records ?? [] };
  }

  validate(input: PcfctInput) {
    return this.validator.validateInput(input);
  }

  diagnostics(config: ProgrammeCertificationFactoryConfiguration) {
    this.ensureSeeded(config);
    const deps = this.integrations.getDependencies();
    const q1306 = consumeQ1306Contract(deps);
    return {
      missionId: "Q13-06" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      certifications: this.store.certificationCount(),
      failureCount: this.gateManager.failureCount(),
      q1306PrerequisitePresent: q1306.consumed,
      readinessScore: q1306.consumed ? 0.85 : 0.45,
      integrations: verifyIntegrations(deps),
      locks: config,
      finalQSeriesMission: true as const,
    };
  }

  getQSeriesConstitutionalCompletionContract(): QSeriesConstitutionalCompletionContract {
    const final = this.getLatestFinalCertification();
    const certifications = this.store.listCertifications();
    const exceptions = final?.remainingConstitutionalExceptions ?? [];
    return {
      contractId: `q-series-completion-contract-${PCFCT_METADATA_VERSION}`,
      contractVersion: PCFCT_METADATA_VERSION,
      producedBy: "programme-certification-factory",
      missionId: "Q13-06",
      qSeriesConstitutionallyComplete: Boolean(final && final.finalConstitutionalDecision !== "withheld"),
      neverImplementFutureProgramme: true,
      neverImplementQ1307OrLater: true,
      structuralSignalOnly: true,
      finalConstitutionalDecision: final?.finalConstitutionalDecision ?? null,
      certifiedProgrammes: final?.certifiedProgrammes ?? certifications.filter((c) => c.certificationStatus !== "intentionally_deferred").map((c) => c.programmeName),
      deferredProgrammes: final?.deferredProgrammes ?? certifications.filter((c) => c.certificationStatus === "intentionally_deferred").map((c) => c.programmeName),
      remainingConstitutionalExceptions: [...exceptions],
      exposedFields: [
        "repositorySummary",
        "certifiedProgrammes",
        "deferredProgrammes",
        "overallMissionInventory",
        "repositoryCompletenessMatrix",
        "finalConstitutionalDecision",
        "remainingConstitutionalExceptions",
        "repositoryCertificationTimestamp",
      ],
      notes: [
        "Programme Certification Factory Q13-06 — FINAL Q Series mission",
        "Emits Q Series constitutional completion contract — NOT a Q13-07 consumer",
        "Never implements Q13-07 or any future programme",
        "Repository evidence only — never certify from claims alone",
      ],
      certificationPrerequisite: Boolean(final),
    };
  }

  private buildHistoryEntry(report: ProgrammeCertificationReport, certification: ProgrammeCertification) {
    return {
      entryId: nextHistoryEntryId(),
      timestamp: report.timestamp,
      reportId: report.reportId,
      certificationId: certification.certificationId,
      programmeCode: certification.programmeCode,
      certificationStatus: certification.certificationStatus,
      confidenceScore: certification.confidenceScore,
      evidence: report.supportingEvidence.slice(0, 5),
    };
  }

  private rejectedCertification(input: PcfctInput, config: ProgrammeCertificationFactoryConfiguration, started: number): never {
    const errors = this.validator.collectBoundaryErrors(input);
    this.gateManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    throw new Error(errors.join("; "));
  }

  private async rejectedReport(input: PcfctInput, config: ProgrammeCertificationFactoryConfiguration, started: number) {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("failed", errors, [], started);
    this.gateManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendPcfctLog({ event: "boundary_reject", details: errors.join(";") });

    const deps = this.integrations.getDependencies();
    const q1306 = consumeQ1306Contract(deps);
    const code = input.programmeCode ?? "Q";
    const audit = this.programmeAudits.get(code);
    const snapshot = resolveRepositorySnapshot(config.repositoryRoot, deps);

    const emptyCert: ProgrammeCertification = {
      certificationId: "rejected",
      programmeName: "Rejected",
      programmeCode: code,
      roadmapVersion: "constitutional-catalog-v1",
      repositorySnapshot: snapshot,
      missionInventory: [],
      completedMissions: [],
      partiallyImplementedMissions: [],
      missingMissions: [],
      brokenOrDeviatingMissions: [],
      duplicateMissions: [],
      intentionallyDeferredMissions: [],
      evidenceReferences: errors,
      gapSummary: errors,
      completionStatus: "Missing",
      certificationStatus: "failed",
      confidenceScore: 0.1,
      timestamp: new Date().toISOString(),
    };

    const report = buildReport({
      reportId: input.reportId ?? nextReportId(),
      workerId: config.workerId,
      programmeCode: code,
      programmeName: "Rejected",
      programmeCertification: emptyCert,
      gapAnalysis: {
        programmeCode: code,
        programmeName: "Rejected",
        analysedAt: new Date().toISOString(),
        completedCount: 0,
        partialCount: 0,
        missingCount: 0,
        brokenCount: 0,
        duplicateCount: 0,
        deferredCount: 0,
        gapSummary: errors,
        evidenceReferences: errors,
      },
      recommendations: [],
      boundaryValidation: { ...validateBoundaries(), passed: false, issues: errors },
      governanceValidation: validateGovernance(deps),
      validation,
      confidenceScore: 0.1,
      q1306ContractConsumed: q1306,
      supportingEvidence: errors,
      historyRefs: [],
    });
    this.store.saveReport(report);
    return report;
  }

  private ensureRecord(
    status: import("./types.js").OperationalState,
    config: ProgrammeCertificationFactoryConfiguration,
    healthStatus: import("./types.js").EngineHealthStatus = "standby",
    report?: ProgrammeCertificationReport,
    certification?: ProgrammeCertification | null,
  ) {
    const latestReport = report ?? this.getLatestReport();
    const latestCert = certification ?? this.store.listCertifications().at(-1) ?? null;
    this.engineRecord = {
      engineVersion: "PILLOW-PCFCT-001",
      missionId: "Q13-06",
      workerId: config.workerId,
      status,
      healthStatus,
      supportedCapabilities: [...PCFCT_CAPABILITIES],
      integrationTargets: [...INTEGRATION_TARGETS],
      totalReports: this.store.reportCount(),
      totalCertifications: this.store.certificationCount(),
      lastReportId: latestReport?.reportId ?? this.engineRecord?.lastReportId ?? null,
      lastCertificationId: latestCert?.certificationId ?? this.engineRecord?.lastCertificationId ?? null,
      lastConfidenceScore: latestReport?.programmeCertification.confidenceScore ?? this.engineRecord?.lastConfidenceScore ?? null,
      connectedAt: this.engineRecord?.connectedAt ?? new Date().toISOString(),
    };
  }
}
