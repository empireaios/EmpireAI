import type { LocalBusinessLaunchPackConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type LocalBusinessLaunchPackDependencies,
} from "./integrations.js";
import { appendLblpLog } from "./lblp-logging.js";
import {
  LaunchPackageBuilder,
  nextEngineRecordId,
  nextPackageId,
  nextRunReportId,
} from "./package-builder.js";
import {
  provideApprovalRecommendation,
  provideBookingArtefact,
  provideBookingReadinessSection,
  provideBusinessOverviewSection,
  provideCollectedFactoryOutputs,
  provideConfidenceScore,
  provideCrmArtefact,
  provideCrmReadinessSection,
  provideDeliverableVerification,
  provideExecutiveSummary,
  provideLbfcArtefact,
  provideLeadGenerationArtefact,
  provideLeadGenerationReadinessSection,
  provideLocalSeoArtefact,
  provideLocalSeoReadinessSection,
  provideMarketResearchArtefact,
  provideOperationsArtefact,
  provideOperationsReadinessSection,
  providePricingSummarySection,
  provideReadinessAssessment,
  provideReadinessStatus,
  provideRisksAndOutstandingIssues,
  provideServiceCatalogueSection,
  provideServiceOfferArtefact,
  provideTargetMarketSection,
  provideUnresolvedSection,
  provideWhatsAppArtefact,
  provideWhatsAppReadinessSection,
} from "./package-providers.js";
import { LaunchPackageStore } from "./package-store.js";
import { HealthMonitor, LblpValidator, RecoveryManager } from "./package-validator.js";
import {
  INTEGRATION_TARGETS,
  LBLP_CAPABILITIES,
  LBLP_METADATA_VERSION,
  LOCAL_BUSINESS_LAUNCH_PACK_ID,
} from "./paths.js";
import type {
  CollectedArtefact,
  CollectedFactoryOutputs,
  IntegrationHandshake,
  LaunchPackage,
  LaunchPackageSections,
  LblpCatalog,
  LblpEngineRecord,
  LblpInput,
  LblpRunReport,
  LocalBusinessLaunchReport,
  OperationalState,
} from "./types.js";

type ReportParams = {
  action: LblpRunReport["action"];
  catalog: LblpCatalog | null;
  reports?: LocalBusinessLaunchReport[];
  packages?: LaunchPackage[];
  latestReport?: LocalBusinessLaunchReport | null;
  latestPackage?: LaunchPackage | null;
  latestCollection?: CollectedFactoryOutputs | null;
  latestVerification?: LblpRunReport["latestVerification"];
  validation: LblpRunReport["validation"];
  started: number;
};

function resolveBusinessProjectId(input: LblpInput): string | null {
  return input.businessProjectId?.trim() || input.fixtureLbfc?.businessProjectId?.trim() || null;
}

function mergeArtefact<T>(
  fresh: CollectedArtefact<T>,
  previous: CollectedArtefact<T> | undefined,
): CollectedArtefact<T> {
  if (fresh.present) return fresh;
  if (previous?.present) return previous;
  return fresh;
}

export class LaunchPackageManager {
  private engineRecord: LblpEngineRecord | null = null;
  private seeded = false;
  private catalog: LblpCatalog | null = null;
  private readonly store = new LaunchPackageStore();
  private readonly builder = new LaunchPackageBuilder();
  private readonly validator = new LblpValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: LocalBusinessLaunchPackDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: LocalBusinessLaunchPackConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
    this.refreshCatalog(config);
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

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getReports() {
    return this.store.listReports();
  }

  getPackages() {
    return this.store.listPackages();
  }

  getLatestPackageId() {
    return this.store.getLatestPackageId();
  }

  getLatestReportId() {
    return this.store.getLatestReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: LocalBusinessLaunchPackConfiguration,
  ): LblpRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.refreshCatalog(config);
    this.ensureRecord("connected", config);
    appendLblpLog({
      event: "connect",
      details: `Local Business Launch Pack connected; integrations=${this.handshakes.length}`,
    });
    return this.report({
      action: "connect",
      catalog: this.getCatalog(),
      validation: this.validator.finalize("pass", [], [], started),
      started,
    });
  }

  collectFactoryOutputs(
    input: LblpInput,
    config: LocalBusinessLaunchPackConfiguration,
  ): LblpRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.assemblyRulesEnabled) {
      return this.disabled(
        "collect_factory_outputs",
        config,
        !config.enabled
          ? "Local Business Launch Pack is disabled"
          : "Assembly rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("collect_factory_outputs", input, config, started);
    }
    const collected = this.collectInternal(input, config);
    if ("error" in collected) {
      return this.failSimple("collect_factory_outputs", config, started, collected.error);
    }
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendLblpLog({
      event: "collect_factory_outputs",
      details: `project=${collected.collection.businessProjectId} present=${collected.collection.sourcesPresent.length}/9`,
    });
    return this.report({
      action: "collect_factory_outputs",
      catalog: this.getCatalog(),
      latestCollection: collected.collection,
      validation,
      started,
    });
  }

  verifyDeliverables(
    input: LblpInput,
    config: LocalBusinessLaunchPackConfiguration,
  ): LblpRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("verify_deliverables", input, config, started);
    }
    const collected = this.collectInternal(input, config);
    if ("error" in collected) {
      return this.failSimple("verify_deliverables", config, started, collected.error);
    }
    const verification = provideDeliverableVerification(collected.collection);
    this.store.saveVerification(verification);
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendLblpLog({
      event: "verify_deliverables",
      details: `project=${collected.collection.businessProjectId} present=${verification.presentCount}/${verification.requiredCount}`,
    });
    return this.report({
      action: "verify_deliverables",
      catalog: this.getCatalog(),
      latestCollection: collected.collection,
      latestVerification: verification,
      validation,
      started,
    });
  }

  generateExecutiveLaunchPackage(
    input: LblpInput,
    config: LocalBusinessLaunchPackConfiguration,
  ): LblpRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.assemblyRulesEnabled) {
      return this.disabled(
        "generate_executive_launch_package",
        config,
        !config.enabled
          ? "Local Business Launch Pack is disabled"
          : "Assembly rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("generate_executive_launch_package", input, config, started);
    }
    const collected = this.collectInternal(input, config);
    if ("error" in collected) {
      return this.failSimple(
        "generate_executive_launch_package",
        config,
        started,
        collected.error,
      );
    }
    const verification = provideDeliverableVerification(collected.collection);
    this.store.saveVerification(verification);
    const readinessStatus = provideReadinessStatus(verification, false);
    const businessName =
      input.businessName?.trim() ||
      collected.collection.lbfc.summary?.businessName ||
      collected.collection.businessProjectId;
    const businessType =
      input.businessType?.trim() ||
      input.category?.trim() ||
      collected.collection.lbfc.summary?.businessCategory ||
      "unknown";
    const sections = this.buildSections(
      collected.collection,
      verification,
      readinessStatus,
      businessName,
    );
    const now = new Date().toISOString();
    const packageDoc: LaunchPackage = {
      packageId: nextPackageId(),
      businessProjectId: collected.collection.businessProjectId,
      businessName,
      businessType,
      createdAt: now,
      updatedAt: now,
      collection: collected.collection,
      verification,
      sections,
      status: "assembled",
      neverLaunchBusinessAutomatically: true,
      neverReplaceCertification: true,
    };
    const saved = this.store.savePackage(packageDoc);
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendLblpLog({
      event: "generate_executive_launch_package",
      details: `package=${saved.packageId} project=${saved.businessProjectId} present=${verification.presentCount}/${verification.requiredCount}`,
    });
    return this.report({
      action: "generate_executive_launch_package",
      catalog: this.getCatalog(),
      packages: [saved],
      latestPackage: saved,
      latestCollection: collected.collection,
      latestVerification: verification,
      validation,
      started,
    });
  }

  summarizeBusinessOpportunity(input: LblpInput, config: LocalBusinessLaunchPackConfiguration) {
    const collected = this.collectInternal(input, config);
    if ("error" in collected) {
      const section = provideUnresolvedSection(collected.error);
      return { businessOverview: section, targetMarket: section };
    }
    return {
      businessOverview: provideBusinessOverviewSection(collected.collection),
      targetMarket: provideTargetMarketSection(collected.collection),
    };
  }

  summarizeServicesAndPricing(input: LblpInput, config: LocalBusinessLaunchPackConfiguration) {
    const collected = this.collectInternal(input, config);
    if ("error" in collected) {
      const section = provideUnresolvedSection(collected.error);
      return { serviceCatalogue: section, pricingSummary: section };
    }
    return {
      serviceCatalogue: provideServiceCatalogueSection(collected.collection),
      pricingSummary: providePricingSummarySection(collected.collection),
    };
  }

  summarizeBookingCrmCommunicationReadiness(
    input: LblpInput,
    config: LocalBusinessLaunchPackConfiguration,
  ) {
    const collected = this.collectInternal(input, config);
    if ("error" in collected) {
      const section = provideUnresolvedSection(collected.error);
      return { bookingReadiness: section, crmReadiness: section, whatsAppReadiness: section };
    }
    return {
      bookingReadiness: provideBookingReadinessSection(collected.collection),
      crmReadiness: provideCrmReadinessSection(collected.collection),
      whatsAppReadiness: provideWhatsAppReadinessSection(collected.collection),
    };
  }

  summarizeSeoAndLeadGenerationReadiness(
    input: LblpInput,
    config: LocalBusinessLaunchPackConfiguration,
  ) {
    const collected = this.collectInternal(input, config);
    if ("error" in collected) {
      const section = provideUnresolvedSection(collected.error);
      return { localSeoReadiness: section, leadGenerationReadiness: section };
    }
    return {
      localSeoReadiness: provideLocalSeoReadinessSection(collected.collection),
      leadGenerationReadiness: provideLeadGenerationReadinessSection(collected.collection),
    };
  }

  summarizeOperationalReadiness(input: LblpInput, config: LocalBusinessLaunchPackConfiguration) {
    const collected = this.collectInternal(input, config);
    if ("error" in collected) {
      return { operationsReadiness: provideUnresolvedSection(collected.error) };
    }
    return { operationsReadiness: provideOperationsReadinessSection(collected.collection) };
  }

  identifyRisksAndOutstandingIssues(
    input: LblpInput,
    config: LocalBusinessLaunchPackConfiguration,
  ) {
    const collected = this.collectInternal(input, config);
    if ("error" in collected) {
      return { risks: [collected.error], outstandingItems: [collected.error], assumptions: [] as string[] };
    }
    const verification = provideDeliverableVerification(collected.collection);
    return provideRisksAndOutstandingIssues(collected.collection, verification);
  }

  produceReport(input: LblpInput, config: LocalBusinessLaunchPackConfiguration): LblpRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.assemblyRulesEnabled) {
      return this.disabled(
        "produce_report",
        config,
        !config.enabled
          ? "Local Business Launch Pack is disabled"
          : "Assembly rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("produce_report", input, config, started);
    }

    let packageDoc = this.resolvePackage(input);
    if (!packageDoc) {
      const generated = this.generateExecutiveLaunchPackage(input, config);
      if (generated.validation.decision === "fail" || !generated.latestPackage) {
        return generated;
      }
      packageDoc = generated.latestPackage;
    }

    const readinessStatus = provideReadinessStatus(packageDoc.verification, false);
    const confidenceScore = provideConfidenceScore(packageDoc.verification);
    const readinessAssessment = provideReadinessAssessment(
      packageDoc.verification,
      readinessStatus,
      confidenceScore,
    );

    const validationBase = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );

    const reportDoc = this.builder.buildReport({
      packageDoc,
      verification: packageDoc.verification,
      sections: packageDoc.sections,
      readinessAssessment,
      validation: validationBase,
      config,
      reportId: input.reportId?.trim() || undefined,
    });

    const saved = this.store.saveReport(reportDoc, "produce_report");
    this.refreshCatalog(config);
    const validation = this.validator.validateReports(
      [saved],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      saved,
      packageDoc,
    );
    appendLblpLog({
      event: "produce_report",
      details: `report=${saved.reportId} package=${saved.packageId} readiness=${saved.readinessStatus} recommendation=${saved.approvalRecommendation}`,
    });
    return this.report({
      action: "produce_report",
      catalog: this.getCatalog(),
      reports: [saved],
      packages: [packageDoc],
      latestReport: saved,
      latestPackage: packageDoc,
      latestCollection: packageDoc.collection,
      latestVerification: packageDoc.verification,
      validation,
      started,
    });
  }

  submitReport(input: LblpInput, config: LocalBusinessLaunchPackConfiguration): LblpRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    let reportDoc =
      (input.reportId?.trim() ? this.store.getReport(input.reportId.trim()) : null) ??
      (this.store.getLatestReportId() ? this.store.getReport(this.store.getLatestReportId()!) : null);
    if (!reportDoc) {
      const produced = this.produceReport(input, config);
      if (produced.validation.decision === "fail" || !produced.latestReport) {
        return produced;
      }
      reportDoc = produced.latestReport;
    }
    const submission = this.integrations.submitReport(reportDoc);
    const updated: LocalBusinessLaunchReport = {
      ...reportDoc,
      submittedToExecutiveReporting: submission.submitted,
      executiveReportId: submission.executiveReportId,
      auditStatus: submission.submitted ? "submitted" : reportDoc.auditStatus,
    };
    const saved = this.store.saveReport(updated, "submit_report");
    this.refreshCatalog(config);
    const validation = this.validator.finalize(
      submission.submitted ? "pass" : "partial",
      [],
      submission.submitted ? [] : [submission.details],
      started,
    );
    this.ensureRecord("active", config, "passed", saved);
    return this.report({
      action: "submit_report",
      catalog: this.getCatalog(),
      reports: [saved],
      latestReport: saved,
      validation,
      started,
    });
  }

  list(config: LocalBusinessLaunchPackConfiguration): LblpRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.refreshCatalog(config);
    return this.report({
      action: "list",
      catalog: this.getCatalog(),
      reports: this.store.listReports(),
      packages: this.store.listPackages(),
      latestReport: this.store.getLatestReportId()
        ? this.store.getReport(this.store.getLatestReportId()!)
        : null,
      latestPackage: this.store.getLatestPackageId()
        ? this.store.getPackage(this.store.getLatestPackageId()!)
        : null,
      validation: this.validator.finalize("pass", [], [], started),
      started,
    });
  }

  validate(input: LblpInput, config: LocalBusinessLaunchPackConfiguration): LblpRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const reports = this.store.listReports();
    const validation = this.validator.validateReports(reports, input, started, {
      allowIncompleteReport: reports.length === 0,
    });
    return this.report({
      action: "validate",
      catalog: this.getCatalog(),
      reports,
      packages: this.store.listPackages(),
      latestReport: reports[reports.length - 1] ?? null,
      validation,
      started,
    });
  }

  diagnostics(config: LocalBusinessLaunchPackConfiguration): LblpRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "partial",
      [],
      config.enabled ? [] : ["Local Business Launch Pack disabled"],
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report({
      action: "diagnostics",
      catalog: this.getCatalog(),
      reports: this.store.listReports(),
      packages: this.store.listPackages(),
      validation,
      started,
    });
  }

  private buildSections(
    collection: CollectedFactoryOutputs,
    verification: ReturnType<typeof provideDeliverableVerification>,
    readinessStatus: ReturnType<typeof provideReadinessStatus>,
    businessName: string,
  ): LaunchPackageSections {
    const { risks, outstandingItems, assumptions } = provideRisksAndOutstandingIssues(
      collection,
      verification,
    );
    const approvalRecommendation = provideApprovalRecommendation(readinessStatus, verification, false);
    const executiveSummary = provideExecutiveSummary(
      businessName,
      collection.businessProjectId,
      verification,
      readinessStatus,
    );
    return {
      executiveSummary,
      businessOverview: provideBusinessOverviewSection(collection),
      targetMarket: provideTargetMarketSection(collection),
      serviceCatalogue: provideServiceCatalogueSection(collection),
      pricingSummary: providePricingSummarySection(collection),
      bookingReadiness: provideBookingReadinessSection(collection),
      crmReadiness: provideCrmReadinessSection(collection),
      whatsAppReadiness: provideWhatsAppReadinessSection(collection),
      localSeoReadiness: provideLocalSeoReadinessSection(collection),
      leadGenerationReadiness: provideLeadGenerationReadinessSection(collection),
      operationsReadiness: provideOperationsReadinessSection(collection),
      risks,
      assumptions,
      outstandingItems,
      approvalRecommendation,
    };
  }

  private collectInternal(
    input: LblpInput,
    _config: LocalBusinessLaunchPackConfiguration,
  ): { collection: CollectedFactoryOutputs } | { error: string } {
    const businessProjectId = resolveBusinessProjectId(input);
    if (!businessProjectId) {
      return {
        error:
          "Local Business Launch Pack requires a businessProjectId (directly or via fixtureLbfc.businessProjectId) to collect factory outputs",
      };
    }
    const businessNameHint = input.businessName?.trim() || input.fixtureLbfc?.businessName?.trim() || null;
    const previous = this.store.getCollection(businessProjectId);

    const lbfc = mergeArtefact(
      provideLbfcArtefact(
        input.fixtureLbfc,
        this.integrations.getLiveLbfcProjects(),
        businessProjectId,
        businessNameHint,
      ),
      previous?.lbfc,
    );
    const marketResearch = mergeArtefact(
      provideMarketResearchArtefact(
        input.fixtureMarketResearch,
        this.integrations.getLiveMarketResearchReports(),
        businessProjectId,
      ),
      previous?.marketResearch,
    );
    const serviceOffer = mergeArtefact(
      provideServiceOfferArtefact(
        input.fixtureServiceOffer,
        this.integrations.getLiveServiceOfferReports(),
        businessProjectId,
      ),
      previous?.serviceOffer,
    );
    const booking = mergeArtefact(
      provideBookingArtefact(
        input.fixtureBooking,
        this.integrations.getLiveBookingReports(),
        businessProjectId,
      ),
      previous?.booking,
    );
    const crm = mergeArtefact(
      provideCrmArtefact(input.fixtureCrm, this.integrations.getLiveCrmReports(), businessProjectId),
      previous?.crm,
    );
    const whatsApp = mergeArtefact(
      provideWhatsAppArtefact(
        input.fixtureWhatsApp,
        this.integrations.getLiveWhatsAppReports(),
        businessProjectId,
      ),
      previous?.whatsApp,
    );
    const localSeo = mergeArtefact(
      provideLocalSeoArtefact(
        input.fixtureLocalSeo,
        this.integrations.getLiveLocalSeoReports(),
        businessProjectId,
      ),
      previous?.localSeo,
    );
    const leadGeneration = mergeArtefact(
      provideLeadGenerationArtefact(
        input.fixtureLeadGeneration,
        this.integrations.getLiveLeadGenerationReports(),
        businessProjectId,
      ),
      previous?.leadGeneration,
    );
    const operations = mergeArtefact(
      provideOperationsArtefact(
        input.fixtureOperations,
        this.integrations.getLiveOperationsReports(),
        businessProjectId,
      ),
      previous?.operations,
    );

    const collection = provideCollectedFactoryOutputs({
      businessProjectId,
      lbfc,
      marketResearch,
      serviceOffer,
      booking,
      crm,
      whatsApp,
      localSeo,
      leadGeneration,
      operations,
    });
    const saved = this.store.saveCollection(collection);
    return { collection: saved };
  }

  private resolvePackage(input: LblpInput): LaunchPackage | null {
    if (input.packageId?.trim()) {
      const found = this.store.getPackage(input.packageId.trim());
      if (found) return found;
    }
    const businessProjectId = resolveBusinessProjectId(input);
    if (businessProjectId) {
      const found = this.store.getLatestPackageForProject(businessProjectId);
      if (found) return found;
    }
    const latestId = this.store.getLatestPackageId();
    return latestId ? this.store.getPackage(latestId) : null;
  }

  private refreshCatalog(config: LocalBusinessLaunchPackConfiguration) {
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listPackages(),
      this.handshakes,
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: LocalBusinessLaunchPackConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: LocalBusinessLaunchReport | null = null,
    latestPackage: LaunchPackage | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? nextEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: LOCAL_BUSINESS_LAUNCH_PACK_ID,
      engineVersion: "PILLOW-LBLP-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...LBLP_CAPABILITIES],
      totalPackages: this.store.packageCount(),
      totalReports: this.store.reportCount(),
      lastPackageId: latestPackage?.packageId ?? this.store.getLatestPackageId(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: LBLP_METADATA_VERSION,
    };
  }

  private boundaryFail(
    action: LblpRunReport["action"],
    input: LblpInput,
    config: LocalBusinessLaunchPackConfiguration,
    started: number,
  ) {
    const errors = this.validator.collectBoundaryErrors(input);
    const boundaryOnly = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendLblpLog({
      event: action,
      details: `boundary_reject=${errors.join(";")}`,
    });
    return this.report({
      action,
      catalog: this.getCatalog(),
      validation: boundaryOnly,
      started,
    });
  }

  private failSimple(
    action: LblpRunReport["action"],
    config: LocalBusinessLaunchPackConfiguration,
    started: number,
    message: string,
  ) {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report({
      action,
      catalog: this.getCatalog(),
      validation,
      started,
    });
  }

  private disabled(
    action: LblpRunReport["action"],
    config: LocalBusinessLaunchPackConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.ensureRecord("failed", config, "failed");
    return this.report({
      action,
      catalog: this.getCatalog(),
      validation,
      started,
    });
  }

  private report(params: ReportParams): LblpRunReport {
    return {
      lblpRunReportId: nextRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: params.action,
      engineRecord: this.getEngineRecord()!,
      catalog: params.catalog,
      reports: params.reports ?? [],
      packages: params.packages ?? [],
      latestReport: params.latestReport ?? null,
      latestPackage: params.latestPackage ?? null,
      latestCollection: params.latestCollection ?? null,
      latestVerification: params.latestVerification ?? null,
      integrations: this.getIntegrations(),
      validation: params.validation,
      durationMs: Date.now() - params.started,
      metadataVersion: LBLP_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: LblpCatalog): LblpCatalog {
  return {
    ...catalog,
    reports: catalog.reports.map((r) => ({ ...r })),
    packages: catalog.packages.map((p) => ({ ...p })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
    neverLaunchBusinessAutomatically: true,
    neverOverrideGovernance: true,
    neverReplaceCertification: true,
    neverClaimReadinessWithoutEvidence: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ711OrLater: true,
    consumableByQ711: true,
  };
}
