import type { RequirementsWorkerConfiguration } from "./configuration.js";
import { RequirementsBuilder } from "./requirements-builder.js";
import { RequirementsStore } from "./requirements-store.js";
import {
  HealthMonitor,
  RecoveryManager,
  RequirementsValidator,
} from "./requirements-validator.js";
import {
  IntegrationCoordinator,
  type RequirementsWorkerDependencies,
} from "./integrations.js";
import { appendRqwLog } from "./rqw-logging.js";
import {
  INTEGRATION_TARGETS,
  REQUIREMENTS_WORKER_ID,
  RQW_CAPABILITIES,
  RQW_METADATA_VERSION,
} from "./paths.js";
import type {
  RequirementsContext,
  RequirementsReport,
  RequirementsWorkerCatalog,
  RequirementsWorkerEngineRecord,
  RequirementsWorkerInput,
  RequirementsWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class RequirementsManager {
  private engineRecord: RequirementsWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: RequirementsWorkerCatalog | null = null;
  private readonly store = new RequirementsStore();
  private readonly builder = new RequirementsBuilder();
  private readonly validator = new RequirementsValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: RequirementsContext = {};

  bindIntegrations(deps: RequirementsWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: RequirementsWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedRequirementsReports);
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

  getRequirementsReports() {
    return this.store.list();
  }

  getLatestRequirementsReportId() {
    return this.store.getLatestRequirementsReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getContext() {
    return {
      ...this.context,
      stakeholders: [...(this.context.stakeholders ?? [])],
    };
  }

  connect(
    _input: Record<string, unknown>,
    config: RequirementsWorkerConfiguration,
  ): RequirementsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendRqwLog({
      event: "connect",
      details: `Requirements Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `rqw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Requirements Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: RQW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedBusinessIntent(
    input: RequirementsWorkerInput,
    config: RequirementsWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.requirementsRulesEnabled) {
      return this.disabled(
        "receive_approved_business_intent",
        config,
        !config.enabled ? "Requirements Worker is disabled" : "Requirements rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_approved_business_intent", input, config, started);
    }
    const enriched = this.integrations.enrichFromEnterprisePlatformFactoryCore(input);
    const { enrichment } = this.integrations.pullPlatformContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    this.context = {
      ...this.context,
      intentApproved: enriched.intentApproved ?? Boolean(enriched.approvedBusinessIntent?.trim()),
    };
    const report = this.builder.createRequirementsShell(enriched, config, this.context);
    this.store.save(report, "receive_approved_business_intent");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateRequirementsReports(
      [report],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      { allowIncompleteReport: true },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendRqwLog({
      event: "receive_approved_business_intent",
      details: `requirements=${report.requirementsId} intent=${report.approvedBusinessIntent.slice(0, 80)}`,
    });
    return this.report(
      "receive_approved_business_intent",
      this.getCatalog(),
      [report],
      report,
      validation,
      started,
    );
  }

  identifyStakeholders(input: RequirementsWorkerInput, config: RequirementsWorkerConfiguration) {
    return this.runContentStage("identify_stakeholders", input, config, (report) => {
      const result = this.builder.identifyStakeholders(this.context, report);
      return {
        ...report,
        stakeholders: result.stakeholders,
        requirementsSteps: [...report.requirementsSteps, ...result.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `rqw-dec-stakeholders-${Date.now()}`,
            topic: report.platformName,
            decision: `Identified ${result.stakeholders.length} stakeholder(s)`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  defineBusinessObjectives(input: RequirementsWorkerInput, config: RequirementsWorkerConfiguration) {
    return this.runContentStage("define_business_objectives", input, config, (report) => {
      const result = this.builder.defineBusinessObjectives(this.context, report);
      return {
        ...report,
        businessObjective: result.businessObjective,
        requirementsSteps: [...report.requirementsSteps, ...result.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `rqw-dec-objectives-${Date.now()}`,
            topic: report.platformName,
            decision: result.businessObjective.slice(0, 200),
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  produceFunctionalRequirements(
    input: RequirementsWorkerInput,
    config: RequirementsWorkerConfiguration,
  ) {
    return this.runContentStage("produce_functional_requirements", input, config, (report) => {
      const result = this.builder.produceFunctionalRequirements(report);
      return {
        ...report,
        functionalRequirements: result.functionalRequirements,
        businessRules: result.businessRules,
        requirementsSteps: [...report.requirementsSteps, ...result.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `rqw-dec-fr-${Date.now()}`,
            topic: report.platformName,
            decision: `Produced ${result.functionalRequirements.length} functional requirement(s)`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  produceNonFunctionalRequirements(
    input: RequirementsWorkerInput,
    config: RequirementsWorkerConfiguration,
  ) {
    return this.runContentStage("produce_non_functional_requirements", input, config, (report) => {
      const result = this.builder.produceNonFunctionalRequirements(report);
      return {
        ...report,
        nonFunctionalRequirements: result.nonFunctionalRequirements,
        requirementsSteps: [...report.requirementsSteps, ...result.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `rqw-dec-nfr-${Date.now()}`,
            topic: report.platformName,
            decision: `Produced ${result.nonFunctionalRequirements.length} non-functional requirement(s)`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  generateUserStories(input: RequirementsWorkerInput, config: RequirementsWorkerConfiguration) {
    return this.runContentStage("generate_user_stories", input, config, (report) => {
      const result = this.builder.generateUserStories(report);
      return {
        ...report,
        userStories: result.userStories,
        requirementsSteps: [...report.requirementsSteps, ...result.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `rqw-dec-stories-${Date.now()}`,
            topic: report.platformName,
            decision: `Generated ${result.userStories.length} user story/stories`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  generateUseCases(input: RequirementsWorkerInput, config: RequirementsWorkerConfiguration) {
    return this.runContentStage("generate_use_cases", input, config, (report) => {
      const result = this.builder.generateUseCases(report);
      return {
        ...report,
        useCases: result.useCases,
        requirementsSteps: [...report.requirementsSteps, ...result.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `rqw-dec-uc-${Date.now()}`,
            topic: report.platformName,
            decision: `Generated ${result.useCases.length} use case(s)`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  generateAcceptanceCriteria(
    input: RequirementsWorkerInput,
    config: RequirementsWorkerConfiguration,
  ) {
    return this.runContentStage("generate_acceptance_criteria", input, config, (report) => {
      const result = this.builder.generateAcceptanceCriteria(report);
      return {
        ...report,
        acceptanceCriteria: result.acceptanceCriteria,
        requirementsSteps: [...report.requirementsSteps, ...result.steps],
        preservedDecisions: [
          ...report.preservedDecisions,
          {
            decisionId: `rqw-dec-ac-${Date.now()}`,
            topic: report.platformName,
            decision: `Generated ${result.acceptanceCriteria.length} acceptance criterion/criteria`,
            recordedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  identifyAssumptionsRisksAndConstraints(
    input: RequirementsWorkerInput,
    config: RequirementsWorkerConfiguration,
  ) {
    return this.runContentStage(
      "identify_assumptions_risks_and_constraints",
      input,
      config,
      (report) => {
        const result = this.builder.identifyAssumptionsRisksAndConstraints(report);
        return {
          ...report,
          assumptions: result.assumptions,
          constraints: result.constraints,
          technicalConstraints: result.technicalConstraints,
          regulatoryConstraints: result.regulatoryConstraints,
          risks: result.risks,
          requirementsSteps: [...report.requirementsSteps, ...result.steps],
          preservedDecisions: [
            ...report.preservedDecisions,
            {
              decisionId: `rqw-dec-risks-${Date.now()}`,
              topic: report.platformName,
              decision: `${result.assumptions.length} assumption(s), ${result.risks.length} risk(s)`,
              recordedAt: new Date().toISOString(),
            },
          ],
        };
      },
    );
  }

  produceRequirementsReport(
    input: RequirementsWorkerInput,
    config: RequirementsWorkerConfiguration,
  ) {
    return this.runFullBuild("produce_requirements_report", input, config);
  }

  submitReport(input: RequirementsWorkerInput, config: RequirementsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.requirementsId) {
      const one = this.store.get(input.requirementsId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFullBuild("produce_requirements_report", input, config);
      reports = generated.requirementsReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.requirementsId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateRequirementsReports(
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
    appendRqwLog({
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

  list(config: RequirementsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateRequirementsReports(
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

  validate(input: RequirementsWorkerInput, config: RequirementsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateRequirementsReports(
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

  diagnostics(config: RequirementsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Requirements Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendRqwLog({ event: "diagnostics", details: `reports=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runContentStage(
    action: RequirementsWorkerRunReport["action"],
    input: RequirementsWorkerInput,
    config: RequirementsWorkerConfiguration,
    mutate: (report: RequirementsReport) => RequirementsReport,
    allowIncomplete = true,
  ): RequirementsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.requirementsRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Requirements Worker is disabled" : "Requirements rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromEnterprisePlatformFactoryCore(input);
    const { enrichment } = this.integrations.pullPlatformContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const latest = this.ensureWorkingReport(enriched, config);
    if (!latest) {
      const validation = this.validator.finalize(
        "fail",
        ["No requirements report available — approved business intent required"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const updated: RequirementsReport = {
      ...mutate(latest),
      timestamp: new Date().toISOString(),
    };
    const selfReview = this.builder.runSelfReview(updated);
    const withReview: RequirementsReport = {
      ...updated,
      confidenceScore: selfReview.confidenceScore,
      selfReviewPassed: selfReview.passed,
      selfReviewFindings: selfReview.findings,
      selfReviewSummary: selfReview.summary,
      qualityReview: selfReview.qualityReview,
      complianceReview: selfReview.complianceReview,
      researchCompliance: selfReview.researchCompliance,
      researchComplianceNotes: selfReview.researchComplianceNotes,
    };
    this.store.save(withReview, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateRequirementsReports(
      [withReview],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      allowIncomplete ? { allowIncompleteReport: true } : {},
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      withReview,
    );
    appendRqwLog({
      event: action,
      details: `requirements=${withReview.requirementsId} confidence=${withReview.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [withReview], withReview, validation, started);
  }

  private runFullBuild(
    action: RequirementsWorkerRunReport["action"],
    input: RequirementsWorkerInput,
    config: RequirementsWorkerConfiguration,
  ): RequirementsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.requirementsRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Requirements Worker is disabled" : "Requirements rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromEnterprisePlatformFactoryCore(input);
    const { enrichment } = this.integrations.pullPlatformContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const partial = this.store.list().at(-1) ?? null;
    const report = this.builder.buildRequirementsReport(enriched, config, this.context, partial);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateRequirementsReports(
      [report],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendRqwLog({
      event: action,
      details: `requirements=${report.requirementsId} confidence=${report.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private ensureWorkingReport(
    input: RequirementsWorkerInput,
    config: RequirementsWorkerConfiguration,
  ): RequirementsReport | null {
    if (input.requirementsId) {
      const existing = this.store.get(input.requirementsId);
      if (existing) return existing;
    }
    const latest = this.store.list().at(-1);
    if (latest) return latest;
    const intent =
      input.approvedBusinessIntent?.trim() ||
      this.context.approvedBusinessIntent?.trim() ||
      input.businessObjective?.trim();
    if (!intent) return null;
    const created = this.builder.createRequirementsShell(input, config, this.context);
    this.store.save(created, "bootstrap_requirements");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    return created;
  }

  private boundaryFail(
    action: RequirementsWorkerRunReport["action"],
    input: RequirementsWorkerInput,
    config: RequirementsWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateRequirementsReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: RequirementsWorkerRunReport["action"],
    config: RequirementsWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: RequirementsWorkerInput) {
    return (
      input.designArchitecture === true ||
      input.writeApplicationCode === true ||
      input.deploySoftware === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.inventUnsupportedBusinessRequirements === true ||
      input.implementQ603OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: RequirementsWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: RequirementsReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `rqw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: REQUIREMENTS_WORKER_ID,
      engineVersion: "PILLOW-RQW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...RQW_CAPABILITIES],
      totalRequirementsReports: this.store.count(),
      lastRequirementsReportId:
        report?.requirementsId ?? this.store.getLatestRequirementsReportId(),
      lastRequirementType: report?.requirementType ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: RQW_METADATA_VERSION,
    };
  }

  private report(
    action: RequirementsWorkerRunReport["action"],
    catalog: RequirementsWorkerCatalog | null,
    reports: RequirementsReport[],
    latestRequirementsReport: RequirementsReport | null,
    validation: RequirementsWorkerRunReport["validation"],
    started: number,
  ): RequirementsWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      requirementsRunReportId: `rqw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      requirementsReports: reports,
      latestRequirementsReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: RQW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: RequirementsWorkerCatalog): RequirementsWorkerCatalog {
  return {
    ...catalog,
    requirementsReports: catalog.requirementsReports.map((report) => ({
      ...report,
      requirementsSteps: report.requirementsSteps.map((s) => ({ ...s })),
      supportedRequirementTypes: [...report.supportedRequirementTypes],
      functionalRequirements: report.functionalRequirements.map((r) => ({ ...r })),
      nonFunctionalRequirements: report.nonFunctionalRequirements.map((r) => ({ ...r })),
      userStories: report.userStories.map((s) => ({ ...s })),
      useCases: report.useCases.map((u) => ({ ...u })),
      acceptanceCriteria: report.acceptanceCriteria.map((a) => ({ ...a })),
      assumptions: [...report.assumptions],
      constraints: [...report.constraints],
      technicalConstraints: [...report.technicalConstraints],
      regulatoryConstraints: [...report.regulatoryConstraints],
      risks: report.risks.map((r) => ({ ...r })),
      businessRules: report.businessRules.map((b) => ({ ...b })),
      stakeholders: [...report.stakeholders],
      selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
      traceabilityRefs: [...report.traceabilityRefs],
      preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
