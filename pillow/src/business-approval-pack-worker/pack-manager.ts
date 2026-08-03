import type { BusinessApprovalPackWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type BusinessApprovalPackWorkerDependencies,
} from "./integrations.js";
import { appendBapLog } from "./bap-logging.js";
import {
  BAP_CAPABILITIES,
  BAP_METADATA_VERSION,
  BUSINESS_APPROVAL_PACK_WORKER_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import { PackBuilder } from "./pack-builder.js";
import { PackStore } from "./pack-store.js";
import { HealthMonitor, PackValidator, RecoveryManager } from "./pack-validator.js";
import type {
  BusinessApprovalPack,
  BusinessApprovalPackWorkerCatalog,
  BusinessApprovalPackWorkerEngineRecord,
  BusinessApprovalPackWorkerInput,
  BusinessApprovalPackWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

type PendingInputs = {
  businessModel: BusinessApprovalPackWorkerInput["businessModel"];
  marketResearch: BusinessApprovalPackWorkerInput["marketResearch"];
  opportunityEvaluation: BusinessApprovalPackWorkerInput["opportunityEvaluation"];
  businessBlueprint: BusinessApprovalPackWorkerInput["businessBlueprint"];
  launchPlan: BusinessApprovalPackWorkerInput["launchPlan"];
  businessRiskReport: BusinessApprovalPackWorkerInput["businessRiskReport"];
};

export class PackManager {
  private engineRecord: BusinessApprovalPackWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: BusinessApprovalPackWorkerCatalog | null = null;
  private readonly store = new PackStore();
  private readonly builder = new PackBuilder();
  private readonly validator = new PackValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pending: PendingInputs = {
    businessModel: null,
    marketResearch: null,
    opportunityEvaluation: null,
    businessBlueprint: null,
    launchPlan: null,
    businessRiskReport: null,
  };

  bindIntegrations(deps: BusinessApprovalPackWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: BusinessApprovalPackWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedPacks);
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

  getPacks() {
    return this.store.list();
  }

  getLatestPackId() {
    return this.store.getLatestPackId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: BusinessApprovalPackWorkerConfiguration,
  ): BusinessApprovalPackWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendBapLog({
      event: "connect",
      details: `Business Approval Pack Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `bap-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Business Approval Pack Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: BAP_METADATA_VERSION,
      },
      started,
    );
  }

  receiveBusinessModel(
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
  ) {
    this.pending.businessModel = input.businessModel ?? this.pending.businessModel;
    return this.runPack("receive_business_model", input, config);
  }

  receiveMarketResearch(
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
  ) {
    this.pending.marketResearch = input.marketResearch ?? this.pending.marketResearch;
    return this.runPack("receive_market_research", input, config);
  }

  receiveOpportunityEvaluation(
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
  ) {
    this.pending.opportunityEvaluation =
      input.opportunityEvaluation ?? this.pending.opportunityEvaluation;
    return this.runPack("receive_opportunity_evaluation", input, config);
  }

  receiveBlueprint(
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
  ) {
    this.pending.businessBlueprint = input.businessBlueprint ?? this.pending.businessBlueprint;
    return this.runPack("receive_blueprint", input, config);
  }

  receiveLaunchPlan(
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
  ) {
    this.pending.launchPlan = input.launchPlan ?? this.pending.launchPlan;
    return this.runPack("receive_launch_plan", input, config);
  }

  receiveRiskReport(
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
  ) {
    this.pending.businessRiskReport =
      input.businessRiskReport ?? this.pending.businessRiskReport;
    return this.runPack("receive_risk_report", input, config);
  }

  consolidateFindings(
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
  ) {
    return this.runPack("consolidate_findings", input, config);
  }

  produceExecutiveSummary(
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
  ) {
    return this.runPack("produce_executive_summary", input, config);
  }

  produceApprovalPack(
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
  ) {
    return this.runPack("produce_approval_pack", input, config);
  }

  submitApprovalPack(
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_approval_pack", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_approval_pack",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let pack =
      (input.approvalPackId ? this.store.get(input.approvalPackId) : null) ??
      this.store.list().at(-1) ??
      null;
    if (!pack) {
      const generated = this.runPack("produce_approval_pack", input, config);
      pack = generated.latestPack;
      if (!pack || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitApprovalPack(pack);
    if (submission.submitted && submission.executiveReportId) {
      pack =
        this.store.markSubmitted(pack.approvalPackId, submission.executiveReportId) ?? pack;
    }

    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validatePacks(
      pack ? [pack] : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) {
      validation.warnings.push(submission.details);
    }
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      pack,
    );
    appendBapLog({
      event: "submit_approval_pack",
      details: `pack=${pack?.approvalPackId ?? "none"} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_approval_pack",
      this.getCatalog(),
      pack ? [pack] : [],
      pack,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: BusinessApprovalPackWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const packs = this.store.list();
    const latest = packs[packs.length - 1] ?? null;
    const validation = this.validator.validatePacks(
      packs.length ? packs : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), packs, latest, validation, started);
  }

  validate(
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const packs = this.store.list();
    const latest = packs[packs.length - 1] ?? null;
    const validation = this.validator.validatePacks(
      packs.length ? packs : null,
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
    return this.report("validate", this.getCatalog(), packs, latest, validation, started);
  }

  diagnostics(config: BusinessApprovalPackWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Business Approval Pack Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendBapLog({ event: "diagnostics", details: `packs=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runPack(
    action: BusinessApprovalPackWorkerRunReport["action"],
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
  ): BusinessApprovalPackWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.consolidationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Business Approval Pack Worker is disabled"
          : "Consolidation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const merged = this.mergePending(input);
    this.pending = {
      businessModel: merged.businessModel ?? null,
      marketResearch: merged.marketResearch ?? null,
      opportunityEvaluation: merged.opportunityEvaluation ?? null,
      businessBlueprint: merged.businessBlueprint ?? null,
      launchPlan: merged.launchPlan ?? null,
      businessRiskReport: merged.businessRiskReport ?? null,
    };

    const receiveActions = new Set([
      "receive_business_model",
      "receive_market_research",
      "receive_opportunity_evaluation",
      "receive_blueprint",
      "receive_launch_plan",
      "receive_risk_report",
    ]);

    if (receiveActions.has(action) && !this.hasAllInputs(merged)) {
      const missing = this.missingInputLabels(merged);
      const partialValidation = this.validator.finalize(
        "partial",
        [],
        [`Received partial inputs; still missing: ${missing.join(", ")}`],
        started,
      );
      this.ensureRecord("active", config, "partial");
      appendBapLog({
        event: action,
        details: `partial_inputs_pending missing=${missing.join("|")}`,
      });
      return this.report(action, this.getCatalog(), [], null, partialValidation, started);
    }

    if (!this.hasAllInputs(merged)) {
      return this.disabled(
        action,
        config,
        `Approval pack requires all six upstream artifacts; missing: ${this.missingInputLabels(merged).join(", ")}`,
      );
    }

    const pack = this.builder.consolidate(merged, config);
    this.store.saveCanonical(pack, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validatePacks(
      [pack],
      { ...merged, validated: merged.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      pack,
    );
    appendBapLog({
      event: action,
      details: `pack=${pack.approvalPackId} recommendation=${pack.recommendation}`,
    });
    return this.report(action, this.getCatalog(), [pack], pack, validation, started);
  }

  private mergePending(input: BusinessApprovalPackWorkerInput): BusinessApprovalPackWorkerInput {
    return {
      ...input,
      businessModel: input.businessModel ?? this.pending.businessModel,
      marketResearch: input.marketResearch ?? this.pending.marketResearch,
      opportunityEvaluation:
        input.opportunityEvaluation ?? this.pending.opportunityEvaluation,
      businessBlueprint: input.businessBlueprint ?? this.pending.businessBlueprint,
      launchPlan: input.launchPlan ?? this.pending.launchPlan,
      businessRiskReport: input.businessRiskReport ?? this.pending.businessRiskReport,
    };
  }

  private hasAllInputs(input: BusinessApprovalPackWorkerInput) {
    return !!(
      input.businessModel &&
      input.marketResearch &&
      input.opportunityEvaluation &&
      input.businessBlueprint &&
      input.launchPlan &&
      input.businessRiskReport
    );
  }

  private missingInputLabels(input: BusinessApprovalPackWorkerInput) {
    const missing: string[] = [];
    if (!input.businessModel) missing.push("business_model");
    if (!input.marketResearch) missing.push("market_research");
    if (!input.opportunityEvaluation) missing.push("opportunity_evaluation");
    if (!input.businessBlueprint) missing.push("business_blueprint");
    if (!input.launchPlan) missing.push("launch_plan");
    if (!input.businessRiskReport) missing.push("business_risk_report");
    return missing;
  }

  private boundaryFail(
    action: BusinessApprovalPackWorkerRunReport["action"],
    input: BusinessApprovalPackWorkerInput,
    config: BusinessApprovalPackWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validatePacks(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: BusinessApprovalPackWorkerRunReport["action"],
    config: BusinessApprovalPackWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: BusinessApprovalPackWorkerInput) {
    return (
      input.approveBusiness === true ||
      input.launchBusiness === true ||
      input.modifyPreviousReports === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ210OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: BusinessApprovalPackWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: BusinessApprovalPack | null = null,
  ) {
    const pack = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `bap-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: BUSINESS_APPROVAL_PACK_WORKER_ID,
      engineVersion: "PILLOW-BAP-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...BAP_CAPABILITIES],
      totalApprovalPacks: this.store.count(),
      lastBusinessType: pack?.businessType ?? null,
      lastApprovalPackId: pack?.approvalPackId ?? this.store.getLatestPackId(),
      lastRecommendation: pack?.recommendation ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: BAP_METADATA_VERSION,
    };
  }

  private report(
    action: BusinessApprovalPackWorkerRunReport["action"],
    catalog: BusinessApprovalPackWorkerCatalog | null,
    packs: BusinessApprovalPack[],
    latestPack: BusinessApprovalPack | null,
    validation: BusinessApprovalPackWorkerRunReport["validation"],
    started: number,
  ): BusinessApprovalPackWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      approvalPackRunReportId: `bap-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      packs,
      latestPack,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: BAP_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: BusinessApprovalPackWorkerCatalog,
): BusinessApprovalPackWorkerCatalog {
  return {
    ...catalog,
    packs: catalog.packs.map((pack) => ({
      ...pack,
      majorOpportunities: [...pack.majorOpportunities],
      majorRisks: [...pack.majorRisks],
      requiredApprovals: [...pack.requiredApprovals],
      outstandingIssues: [...pack.outstandingIssues],
      unresolvedRisks: [...pack.unresolvedRisks],
      requiredGrandKingDecisions: [...pack.requiredGrandKingDecisions],
      supportingEvidence: pack.supportingEvidence.map((e) => ({ ...e })),
      facts: [...pack.facts],
      recommendationsOnly: [...pack.recommendationsOnly],
      assumptions: [...pack.assumptions],
      sourceRefs: { ...pack.sourceRefs },
      preservedDecisions: [...pack.preservedDecisions],
      traceabilityRefs: [...pack.traceabilityRefs],
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
