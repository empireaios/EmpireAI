import type { DigitalProductResearchWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type DigitalProductResearchWorkerDependencies,
} from "./integrations.js";
import { appendDprLog } from "./dpr-logging.js";
import {
  DIGITAL_PRODUCT_RESEARCH_WORKER_ID,
  DPR_CAPABILITIES,
  DPR_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import { focusForAction, ResearchBuilder } from "./research-builder.js";
import { ResearchStore } from "./research-store.js";
import { HealthMonitor, RecoveryManager, ResearchValidator } from "./research-validator.js";
import type {
  DigitalProductResearchReport,
  DigitalProductResearchWorkerCatalog,
  DigitalProductResearchWorkerEngineRecord,
  DigitalProductResearchWorkerInput,
  DigitalProductResearchWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class ResearchManager {
  private engineRecord: DigitalProductResearchWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: DigitalProductResearchWorkerCatalog | null = null;
  private readonly store = new ResearchStore();
  private readonly builder = new ResearchBuilder();
  private readonly validator = new ResearchValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingContext: DigitalProductResearchWorkerInput = {};

  bindIntegrations(deps: DigitalProductResearchWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: DigitalProductResearchWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
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

  getResearchReports() {
    return this.store.list();
  }

  getLatestResearchReportId() {
    return this.store.getLatestResearchReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: DigitalProductResearchWorkerConfiguration,
  ): DigitalProductResearchWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendDprLog({
      event: "connect",
      details: `Digital Product Research Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `dpr-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Digital Product Research Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: DPR_METADATA_VERSION,
      },
      started,
    );
  }

  analyseCustomerPainPoints(
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
  ) {
    return this.runResearch("analyse_customer_pain_points", input, config);
  }

  analyseSearchDemand(
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
  ) {
    return this.runResearch("analyse_search_demand", input, config);
  }

  analyseMarketGaps(
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
  ) {
    return this.runResearch("analyse_market_gaps", input, config);
  }

  analyseCompetitorProducts(
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
  ) {
    return this.runResearch("analyse_competitor_products", input, config);
  }

  analyseEmergingTrends(
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
  ) {
    return this.runResearch("analyse_emerging_trends", input, config);
  }

  discoverUnderservedNiches(
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
  ) {
    return this.runResearch("discover_underserved_niches", input, config);
  }

  estimateDemand(
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
  ) {
    return this.runResearch("estimate_demand", input, config);
  }

  estimateCommercialOpportunity(
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
  ) {
    return this.runResearch("estimate_commercial_opportunity", input, config);
  }

  produceReport(
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
  ) {
    return this.runResearch("produce_report", input, config, { requireFactEvidence: true });
  }

  rankOpportunities(
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.researchRulesEnabled) {
      return this.disabled(
        "rank_opportunities",
        config,
        !config.enabled
          ? "Digital Product Research Worker is disabled"
          : "Research rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("rank_opportunities", input, config, started);
    }
    if (this.hasUnapprovedSource(input)) {
      return this.boundaryFail("rank_opportunities", input, config, started);
    }

    let reports = this.store.list();
    if (!reports.length) {
      const generated = this.runResearch("produce_report", input, config, {
        requireFactEvidence: true,
      });
      if (generated.validation.decision === "fail") return generated;
      reports = generated.researchReports;
    }

    const ranked = this.builder.rankReports(reports, config);
    for (const report of ranked) {
      this.store.save(report, "rank_opportunities");
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = ranked[0] ?? null;
    const validation = this.validator.validateReports(
      ranked.length ? ranked : null,
      { ...input, validated: input.validated ?? true },
      started,
      { requireFactEvidence: true },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    appendDprLog({
      event: "rank_opportunities",
      details: `ranked=${ranked.length} top=${latest?.researchReportId ?? "none"} score=${latest?.opportunityScore ?? "n/a"}`,
    });
    return this.report(
      "rank_opportunities",
      this.getCatalog(),
      ranked,
      latest,
      validation,
      started,
    );
  }

  submitReport(
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.researchReportId) {
      const one = this.store.get(input.researchReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runResearch("produce_report", input, config, {
        requireFactEvidence: true,
      });
      reports = generated.researchReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.researchReportId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) validation.warnings.push(submission.details);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    appendDprLog({
      event: "submit_report",
      details: `reports=${reports.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      reports,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: DigitalProductResearchWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), reports, latest, validation, started);
  }

  validate(
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("validate", this.getCatalog(), reports, latest, validation, started);
  }

  diagnostics(config: DigitalProductResearchWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Digital Product Research Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendDprLog({
      event: "diagnostics",
      details: `researchReports=${this.store.count()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runResearch(
    action: DigitalProductResearchWorkerRunReport["action"],
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
    options: { requireFactEvidence?: boolean } = {},
  ): DigitalProductResearchWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.researchRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Digital Product Research Worker is disabled"
          : "Research rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    if (this.hasUnapprovedSource(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    const enriched = this.integrations.enrichFromDigitalProductsFactory({
      ...this.pendingContext,
      ...input,
    });
    const { enrichment } = this.integrations.pullDpfContext(enriched);
    this.pendingContext = enriched;
    const focus = focusForAction(action) ?? "full_report";
    const existing = enriched.researchReportId
      ? this.store.get(enriched.researchReportId)
      : null;
    const report = this.builder.buildReport(enriched, config, enrichment, focus, existing);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateReports(
      [report],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      options,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendDprLog({
      event: action,
      details: `report=${report.researchReportId} topic=${report.researchTopic} opportunityScore=${report.opportunityScore} confidence=${report.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: DigitalProductResearchWorkerRunReport["action"],
    input: DigitalProductResearchWorkerInput,
    config: DigitalProductResearchWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: DigitalProductResearchWorkerRunReport["action"],
    config: DigitalProductResearchWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: DigitalProductResearchWorkerInput) {
    return (
      input.createDigitalProducts === true ||
      input.createSalesPages === true ||
      input.processPayments === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.inventUnsupportedMarketEvidence === true ||
      input.implementQ503OrLater === true ||
      input.useUnapprovedSource === true
    );
  }

  private hasUnapprovedSource(input: DigitalProductResearchWorkerInput) {
    if (input.useUnapprovedSource === true) return true;
    const source = input.discoverySource?.trim();
    if (!source) return false;
    return !this.validator.isApprovedSource(source);
  }

  private ensureRecord(
    state: OperationalState,
    config: DigitalProductResearchWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: DigitalProductResearchReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `dpr-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: DIGITAL_PRODUCT_RESEARCH_WORKER_ID,
      engineVersion: "PILLOW-DPR-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...DPR_CAPABILITIES],
      totalResearchReports: this.store.count(),
      lastResearchReportId: report?.researchReportId ?? this.store.getLatestResearchReportId(),
      lastOpportunityScore: report?.opportunityScore ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      lastRecommendedPriority: report?.recommendedPriority ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: DPR_METADATA_VERSION,
    };
  }

  private report(
    action: DigitalProductResearchWorkerRunReport["action"],
    catalog: DigitalProductResearchWorkerCatalog | null,
    researchReports: DigitalProductResearchReport[],
    latestResearchReport: DigitalProductResearchReport | null,
    validation: DigitalProductResearchWorkerRunReport["validation"],
    started: number,
  ): DigitalProductResearchWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      researchRunReportId: `dpr-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      researchReports,
      latestResearchReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: DPR_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: DigitalProductResearchWorkerCatalog,
): DigitalProductResearchWorkerCatalog {
  return {
    ...catalog,
    researchReports: catalog.researchReports.map((report) => ({
      ...report,
      customerPainPoints: [...report.customerPainPoints],
      supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
      evidenceKinds: [...report.evidenceKinds],
      traceabilityRefs: [...report.traceabilityRefs],
      preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
