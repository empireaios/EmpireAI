import type { ArchitectureWorkerConfiguration } from "./configuration.js";

import { ArchitectureBuilder } from "./architecture-builder.js";

import { ArchitectureStore } from "./architecture-store.js";

import {

  HealthMonitor,

  RecoveryManager,

  ArchitectureValidator,

} from "./architecture-validator.js";

import {

  IntegrationCoordinator,

  type ArchitectureWorkerDependencies,

} from "./integrations.js";

import { appendArwLog } from "./arw-logging.js";

import {

  ARW_CAPABILITIES,

  ARCHITECTURE_WORKER_ID,

  ARW_METADATA_VERSION,

  INTEGRATION_TARGETS,

} from "./paths.js";

import type {

  ArchitectureContext,

  ArchitectureReport,

  ArchitectureWorkerCatalog,

  ArchitectureWorkerEngineRecord,

  ArchitectureWorkerInput,

  ArchitectureWorkerRunReport,

  IntegrationHandshake,

  OperationalState,

} from "./types.js";



export class ArchitectureManager {

  private engineRecord: ArchitectureWorkerEngineRecord | null = null;

  private seeded = false;

  private catalog: ArchitectureWorkerCatalog | null = null;

  private readonly store = new ArchitectureStore();

  private readonly builder = new ArchitectureBuilder();

  private readonly validator = new ArchitectureValidator();

  private readonly healthMonitor = new HealthMonitor();

  private readonly recovery = new RecoveryManager();

  private readonly integrations = new IntegrationCoordinator();

  private handshakes: IntegrationHandshake[] = [];

  private context: ArchitectureContext = {};



  bindIntegrations(deps: ArchitectureWorkerDependencies = {}) {

    this.integrations.bind(deps);

  }



  ensureSeeded(config: ArchitectureWorkerConfiguration) {

    if (this.seeded) return;

    this.store.seed(config.seedArchitectureReports);

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



  getArchitectureReports() {

    return this.store.list();

  }



  getLatestArchitectureReportId() {

    return this.store.getLatestArchitectureReportId();

  }



  getAuditTrail() {

    return this.store.getAuditTrail();

  }



  getIntegrations() {

    return this.handshakes.map((h) => ({ ...h }));

  }



  getContext() {

    return { ...this.context };

  }



  connect(

    _input: Record<string, unknown>,

    config: ArchitectureWorkerConfiguration,

  ): ArchitectureWorkerRunReport {

    const started = Date.now();

    this.ensureSeeded(config);

    this.handshakes = this.integrations.connect(

      config.workerId,

      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],

    );

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);

    this.ensureRecord("connected", config);

    appendArwLog({

      event: "connect",

      details: `Architecture Worker connected; integrations=${this.handshakes.length}`,

    });

    return this.report(

      "connect",

      this.getCatalog(),

      [],

      null,

      {

        validationReportId: `arw-val-${Date.now()}`,

        validationTimestamp: new Date().toISOString(),

        decision: config.enabled ? "pass" : "fail",

        errors: config.enabled ? [] : ["Architecture Worker is disabled"],

        warnings: [],

        durationMs: Date.now() - started,

        metadataVersion: ARW_METADATA_VERSION,

      },

      started,

    );

  }



  receiveApprovedRequirementsReports(

    input: ArchitectureWorkerInput,

    config: ArchitectureWorkerConfiguration,

  ) {

    const started = Date.now();

    this.ensureSeeded(config);

    if (!config.enabled || !config.architectureRulesEnabled) {

      return this.disabled(

        "receive_approved_requirements_reports",

        config,

        !config.enabled ? "Architecture Worker is disabled" : "Architecture rules are disabled",

      );

    }

    if (this.hasBoundary(input)) {

      return this.boundaryFail("receive_approved_requirements_reports", input, config, started);

    }

    const enriched = this.integrations.enrichFromApprovedRequirements(input);

    const { enrichment } = this.integrations.pullRequirementsContext(enriched);

    this.context = this.builder.mergeContext(enriched, this.context, enrichment);

    const report = this.builder.createArchitectureShell(enriched, config, this.context);

    this.store.save(report, "receive_approved_requirements_reports");

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);

    const validation = this.validator.validateArchitectureReports(

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

    appendArwLog({

      event: "receive_approved_requirements_reports",

      details: `architecture=${report.architectureId} requirements=${report.requirementsReportId}`,

    });

    return this.report(

      "receive_approved_requirements_reports",

      this.getCatalog(),

      [report],

      report,

      validation,

      started,

    );

  }



  designOverallSystemArchitecture(

    input: ArchitectureWorkerInput,

    config: ArchitectureWorkerConfiguration,

  ) {

    return this.runContentStage("design_overall_system_architecture", input, config, (report) => {

      const result = this.builder.designOverallSystemArchitecture(this.context, report);

      return {

        ...report,

        systemOverview: result.systemOverview,

        architecturalDecisions: [...report.architecturalDecisions, ...result.decisions],

        architectureSteps: [...report.architectureSteps, ...result.steps],

        preservedDecisions: [

          ...report.preservedDecisions,

          {

            decisionId: `arw-dec-sys-${Date.now()}`,

            topic: report.platformName,

            decision: result.systemOverview.slice(0, 200),

            recordedAt: new Date().toISOString(),

          },

        ],

      };

    });

  }



  defineApplicationModules(input: ArchitectureWorkerInput, config: ArchitectureWorkerConfiguration) {

    return this.runContentStage("define_application_modules", input, config, (report) => {

      const result = this.builder.defineApplicationModules(report);

      return {

        ...report,

        moduleArchitecture: result.moduleArchitecture,

        architecturalDecisions: [...report.architecturalDecisions, ...result.decisions],

        architectureSteps: [...report.architectureSteps, ...result.steps],

        preservedDecisions: [

          ...report.preservedDecisions,

          {

            decisionId: `arw-dec-mod-${Date.now()}`,

            topic: report.platformName,

            decision: `Defined ${result.moduleArchitecture.length} module(s)`,

            recordedAt: new Date().toISOString(),

          },

        ],

      };

    });

  }



  designInternalAndExternalApis(

    input: ArchitectureWorkerInput,

    config: ArchitectureWorkerConfiguration,

  ) {

    return this.runContentStage("design_internal_and_external_apis", input, config, (report) => {

      const result = this.builder.designInternalAndExternalApis(report);

      return {

        ...report,

        apiArchitecture: result.apiArchitecture,

        architecturalDecisions: [...report.architecturalDecisions, ...result.decisions],

        architectureSteps: [...report.architectureSteps, ...result.steps],

        preservedDecisions: [

          ...report.preservedDecisions,

          {

            decisionId: `arw-dec-api-${Date.now()}`,

            topic: report.platformName,

            decision: `Designed ${result.apiArchitecture.length} API contract(s)`,

            recordedAt: new Date().toISOString(),

          },

        ],

      };

    });

  }



  designServiceBoundaries(input: ArchitectureWorkerInput, config: ArchitectureWorkerConfiguration) {

    return this.runContentStage("design_service_boundaries", input, config, (report) => {

      const result = this.builder.designServiceBoundaries(report);

      return {

        ...report,

        serviceDependencies: result.serviceDependencies,

        architecturalDecisions: [...report.architecturalDecisions, ...result.decisions],

        architectureSteps: [...report.architectureSteps, ...result.steps],

        preservedDecisions: [

          ...report.preservedDecisions,

          {

            decisionId: `arw-dec-svc-${Date.now()}`,

            topic: report.platformName,

            decision: `Defined ${result.serviceDependencies.length} service boundary/dependencies`,

            recordedAt: new Date().toISOString(),

          },

        ],

      };

    });

  }



  designDataFlowArchitecture(

    input: ArchitectureWorkerInput,

    config: ArchitectureWorkerConfiguration,

  ) {

    return this.runContentStage("design_data_flow_architecture", input, config, (report) => {

      const result = this.builder.designDataFlowArchitecture(report);

      return {

        ...report,

        dataFlow: result.dataFlow,

        architecturalDecisions: [...report.architecturalDecisions, ...result.decisions],

        architectureSteps: [...report.architectureSteps, ...result.steps],

        preservedDecisions: [

          ...report.preservedDecisions,

          {

            decisionId: `arw-dec-flow-${Date.now()}`,

            topic: report.platformName,

            decision: `Defined ${result.dataFlow.length} data flow(s)`,

            recordedAt: new Date().toISOString(),

          },

        ],

      };

    });

  }



  designDeploymentTopology(input: ArchitectureWorkerInput, config: ArchitectureWorkerConfiguration) {

    return this.runContentStage("design_deployment_topology", input, config, (report) => {

      const result = this.builder.designDeploymentTopology(report);

      return {

        ...report,

        deploymentArchitecture: result.deploymentArchitecture,

        integrationArchitecture: result.integrationArchitecture,

        architecturalDecisions: [...report.architecturalDecisions, ...result.decisions],

        architectureSteps: [...report.architectureSteps, ...result.steps],

        preservedDecisions: [

          ...report.preservedDecisions,

          {

            decisionId: `arw-dec-dep-${Date.now()}`,

            topic: report.platformName,

            decision: `Defined ${result.deploymentArchitecture.topology} deployment topology`,

            recordedAt: new Date().toISOString(),

          },

        ],

      };

    });

  }



  identifyArchitecturalDependencies(

    input: ArchitectureWorkerInput,

    config: ArchitectureWorkerConfiguration,

  ) {

    return this.runContentStage("identify_architectural_dependencies", input, config, (report) => {

      const result = this.builder.identifyArchitecturalDependencies(report);

      return {

        ...report,

        serviceDependencies: result.serviceDependencies,

        assumptions: [...report.assumptions, ...result.assumptions],

        architecturalDecisions: [...report.architecturalDecisions, ...result.decisions],

        architectureSteps: [...report.architectureSteps, ...result.steps],

        preservedDecisions: [

          ...report.preservedDecisions,

          {

            decisionId: `arw-dec-deps-${Date.now()}`,

            topic: report.platformName,

            decision: `Identified ${result.serviceDependencies.length} architectural dependency/dependencies`,

            recordedAt: new Date().toISOString(),

          },

        ],

      };

    });

  }



  evaluateScalabilitySecurityAndMaintainability(

    input: ArchitectureWorkerInput,

    config: ArchitectureWorkerConfiguration,

  ) {

    return this.runContentStage(

      "evaluate_scalability_security_and_maintainability",

      input,

      config,

      (report) => {

        const result = this.builder.evaluateScalabilitySecurityAndMaintainability(report);

        return {

          ...report,

          securityConsiderations: result.securityConsiderations,

          scalabilityConsiderations: result.scalabilityConsiderations,

          maintainabilityConsiderations: result.maintainabilityConsiderations,

          architecturalDecisions: [...report.architecturalDecisions, ...result.decisions],

          architectureSteps: [...report.architectureSteps, ...result.steps],

          preservedDecisions: [

            ...report.preservedDecisions,

            {

              decisionId: `arw-dec-qual-${Date.now()}`,

              topic: report.platformName,

              decision: "Evaluated scalability, security, and maintainability",

              recordedAt: new Date().toISOString(),

            },

          ],

        };

      },

    );

  }



  produceArchitectureReport(input: ArchitectureWorkerInput, config: ArchitectureWorkerConfiguration) {

    return this.runFullBuild("produce_architecture_report", input, config);

  }



  submitReport(input: ArchitectureWorkerInput, config: ArchitectureWorkerConfiguration) {

    const started = Date.now();

    this.ensureSeeded(config);

    if (this.hasBoundary(input)) {

      return this.boundaryFail("submit_report", input, config, started);

    }

    if (!config.executiveReportingEnabled) {

      return this.disabled("submit_report", config, "Executive reporting submission is disabled");

    }

    let reports = this.store.list();

    if (input.architectureId) {

      const one = this.store.get(input.architectureId);

      reports = one ? [one] : [];

    }

    if (!reports.length) {

      const generated = this.runFullBuild("produce_architecture_report", input, config);

      reports = generated.architectureReports;

      if (!reports.length || generated.validation.decision === "fail") return generated;

    }

    const submission = this.integrations.submitReport(reports);

    if (submission.submitted && submission.executiveReportId) {

      reports = reports.map(

        (r) => this.store.markSubmitted(r.architectureId, submission.executiveReportId!) ?? r,

      );

    }

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);

    const latest = reports[reports.length - 1] ?? null;

    const validation = this.validator.validateArchitectureReports(

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

    appendArwLog({

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



  list(config: ArchitectureWorkerConfiguration) {

    const started = Date.now();

    this.ensureSeeded(config);

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);

    const reports = this.store.list();

    const latest = reports[reports.length - 1] ?? null;

    const validation = this.validator.validateArchitectureReports(

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



  validate(input: ArchitectureWorkerInput, config: ArchitectureWorkerConfiguration) {

    const started = Date.now();

    this.ensureSeeded(config);

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);

    const reports = this.store.list();

    const latest = reports[reports.length - 1] ?? null;

    const validation = this.validator.validateArchitectureReports(

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



  diagnostics(config: ArchitectureWorkerConfiguration) {

    const started = Date.now();

    this.ensureSeeded(config);

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);

    const validation = this.validator.finalize(

      config.enabled ? "pass" : "fail",

      config.enabled ? [] : ["Architecture Worker is disabled"],

      [],

      started,

    );

    this.ensureRecord("active", config);

    appendArwLog({ event: "diagnostics", details: `reports=${this.store.count()}` });

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

    action: ArchitectureWorkerRunReport["action"],

    input: ArchitectureWorkerInput,

    config: ArchitectureWorkerConfiguration,

    mutate: (report: ArchitectureReport) => ArchitectureReport,

    allowIncomplete = true,

  ): ArchitectureWorkerRunReport {

    const started = Date.now();

    this.ensureSeeded(config);

    if (!config.enabled || !config.architectureRulesEnabled) {

      return this.disabled(

        action,

        config,

        !config.enabled ? "Architecture Worker is disabled" : "Architecture rules are disabled",

      );

    }

    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const enriched = this.integrations.enrichFromApprovedRequirements(input);

    const { enrichment } = this.integrations.pullRequirementsContext(enriched);

    this.context = this.builder.mergeContext(enriched, this.context, enrichment);

    const latest = this.ensureWorkingReport(enriched, config);

    if (!latest) {

      const validation = this.validator.finalize(

        "fail",

        ["No architecture report available — approved requirements report required"],

        [],

        started,

      );

      this.recovery.recordFailure();

      this.ensureRecord("failed", config, "failed");

      return this.report(action, this.getCatalog(), [], null, validation, started);

    }

    const updated: ArchitectureReport = {

      ...mutate(latest),

      timestamp: new Date().toISOString(),

    };

    const selfReview = this.builder.runSelfReview(updated);

    const withReview: ArchitectureReport = {

      ...updated,

      confidenceScore: selfReview.confidenceScore,

      selfReviewPassed: selfReview.passed,

      selfReviewFindings: selfReview.findings,

      selfReviewSummary: selfReview.summary,

      qualityReview: selfReview.qualityReview,

      complianceReview: selfReview.complianceReview,

      architecturalCompliance: selfReview.architecturalCompliance,

      architecturalComplianceNotes: selfReview.architecturalComplianceNotes,

    };

    this.store.save(withReview, action);

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);

    const validation = this.validator.validateArchitectureReports(

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

    appendArwLog({

      event: action,

      details: `architecture=${withReview.architectureId} confidence=${withReview.confidenceScore}`,

    });

    return this.report(action, this.getCatalog(), [withReview], withReview, validation, started);

  }



  private runFullBuild(

    action: ArchitectureWorkerRunReport["action"],

    input: ArchitectureWorkerInput,

    config: ArchitectureWorkerConfiguration,

  ): ArchitectureWorkerRunReport {

    const started = Date.now();

    this.ensureSeeded(config);

    if (!config.enabled || !config.architectureRulesEnabled) {

      return this.disabled(

        action,

        config,

        !config.enabled ? "Architecture Worker is disabled" : "Architecture rules are disabled",

      );

    }

    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const enriched = this.integrations.enrichFromApprovedRequirements(input);

    const { enrichment } = this.integrations.pullRequirementsContext(enriched);

    this.context = this.builder.mergeContext(enriched, this.context, enrichment);

    const partial = this.store.list().at(-1) ?? null;

    const report = this.builder.buildArchitectureReport(enriched, config, this.context, partial);

    this.store.save(report, action);

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);

    const validation = this.validator.validateArchitectureReports(

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

    appendArwLog({

      event: action,

      details: `architecture=${report.architectureId} confidence=${report.confidenceScore}`,

    });

    return this.report(action, this.getCatalog(), [report], report, validation, started);

  }



  private ensureWorkingReport(

    input: ArchitectureWorkerInput,

    config: ArchitectureWorkerConfiguration,

  ): ArchitectureReport | null {

    if (input.architectureId) {

      const existing = this.store.get(input.architectureId);

      if (existing) return existing;

    }

    const latest = this.store.list().at(-1);

    if (latest) return latest;

    const reqId =

      input.requirementsReportId?.trim() ||

      this.context.requirementsReportId?.trim();

    if (!reqId) return null;

    const created = this.builder.createArchitectureShell(input, config, this.context);

    this.store.save(created, "bootstrap_architecture");

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);

    return created;

  }



  private boundaryFail(

    action: ArchitectureWorkerRunReport["action"],

    input: ArchitectureWorkerInput,

    config: ArchitectureWorkerConfiguration,

    started: number,

  ) {

    const validation = this.validator.validateArchitectureReports(null, input, started);

    this.recovery.recordFailure();

    this.ensureRecord("failed", config, "failed");

    return this.report(action, this.getCatalog(), [], null, validation, started);

  }



  private disabled(

    action: ArchitectureWorkerRunReport["action"],

    config: ArchitectureWorkerConfiguration,

    message: string,

  ) {

    const started = Date.now();

    const validation = this.validator.finalize("fail", [message], [], started);

    this.recovery.recordFailure();

    this.ensureRecord("failed", config, "failed");

    return this.report(action, this.getCatalog(), [], null, validation, started);

  }



  private hasBoundary(input: ArchitectureWorkerInput) {

    return (

      input.writeFrontendCode === true ||

      input.writeBackendCode === true ||

      input.deployApplications === true ||

      input.implementApplicationLogic === true ||

      input.overridePillow === true ||

      input.overrideGrandKing === true ||

      input.implementQ604OrLater === true

    );

  }



  private ensureRecord(

    state: OperationalState,

    config: ArchitectureWorkerConfiguration,

    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",

    latest: ArchitectureReport | null = null,

  ) {

    const report = latest ?? this.store.list().at(-1) ?? null;

    this.engineRecord = {

      engineRecordId: this.engineRecord?.engineRecordId ?? `arw-eng-${Date.now()}`,

      timestamp: new Date().toISOString(),

      engineId: ARCHITECTURE_WORKER_ID,

      engineVersion: "PILLOW-ARW-001",

      currentOperationalState: state,

      healthStatus: this.healthMonitor.status(

        validationStatus === "failed" ? "fail" : "pass",

        config.enabled,

      ),

      validationStatus,

      supportedCapabilities: [...ARW_CAPABILITIES],

      totalArchitectureReports: this.store.count(),

      lastArchitectureReportId:

        report?.architectureId ?? this.store.getLatestArchitectureReportId(),

      lastArchitectureDomain: "system_architecture",

      lastConfidenceScore: report?.confidenceScore ?? null,

      workerId: config.workerId,

      integrationTargets: [...INTEGRATION_TARGETS],

      metadataVersion: ARW_METADATA_VERSION,

    };

  }



  private report(

    action: ArchitectureWorkerRunReport["action"],

    catalog: ArchitectureWorkerCatalog | null,

    reports: ArchitectureReport[],

    latestArchitectureReport: ArchitectureReport | null,

    validation: ArchitectureWorkerRunReport["validation"],

    started: number,

  ): ArchitectureWorkerRunReport {

    const engineRecord = this.getEngineRecord()!;

    return {

      architectureRunReportId: `arw-run-${Date.now()}`,

      runTimestamp: new Date().toISOString(),

      action,

      engineRecord,

      catalog,

      architectureReports: reports,

      latestArchitectureReport,

      integrations: this.getIntegrations(),

      validation,

      durationMs: Date.now() - started,

      metadataVersion: ARW_METADATA_VERSION,

    };

  }

}



function cloneCatalog(catalog: ArchitectureWorkerCatalog): ArchitectureWorkerCatalog {

  return {

    ...catalog,

    architectureReports: catalog.architectureReports.map((report) => ({

      ...report,

      architectureSteps: report.architectureSteps.map((s) => ({ ...s })),

      supportedArchitectureDomains: [...report.supportedArchitectureDomains],

      moduleArchitecture: report.moduleArchitecture.map((m) => ({ ...m })),

      apiArchitecture: report.apiArchitecture.map((a) => ({ ...a })),

      dataFlow: report.dataFlow.map((f) => ({ ...f })),

      serviceDependencies: report.serviceDependencies.map((d) => ({ ...d })),

      deploymentArchitecture: {

        ...report.deploymentArchitecture,

        environments: [...report.deploymentArchitecture.environments],

        components: report.deploymentArchitecture.components.map((c) => ({ ...c })),

      },

      integrationArchitecture: report.integrationArchitecture.map((i) => ({ ...i })),

      securityConsiderations: [...report.securityConsiderations],

      scalabilityConsiderations: [...report.scalabilityConsiderations],

      maintainabilityConsiderations: [...report.maintainabilityConsiderations],

      architecturalDecisions: report.architecturalDecisions.map((d) => ({ ...d })),

      assumptions: [...report.assumptions],

      selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),

      traceabilityRefs: [...report.traceabilityRefs],

      preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),

    })),

    integrations: catalog.integrations.map((i) => ({ ...i })),

  };

}


