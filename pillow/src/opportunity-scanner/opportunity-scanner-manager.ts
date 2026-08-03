import type { OpportunityScannerConfiguration } from "./configuration.js";
import { appendOscLog } from "./osc-logging.js";
import {
  filterByCategory,
  HealthMonitor,
  OpportunityMetadataGenerator,
  OpportunityRecordBuilder,
  OpportunityValidator,
  RecoveryManager,
} from "./opportunity-validator.js";
import {
  OSC_CAPABILITIES,
  OSC_METADATA_VERSION,
  OPPORTUNITY_SCANNER_ID,
} from "./paths.js";
import type {
  OpportunityRecord,
  OpportunityScannerEngineRecord,
  OpportunityScannerInput,
  OpportunityScannerRunReport,
  OperationalState,
} from "./types.js";

export class OpportunityScannerManager {
  private engineRecord: OpportunityScannerEngineRecord | null = null;
  private opportunities: OpportunityRecord[] = [];
  private configuredDomains: string[] = [];
  private readonly builder = new OpportunityRecordBuilder();
  private readonly validator = new OpportunityValidator();
  private readonly metadata = new OpportunityMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          configuredDomains: [...this.engineRecord.configuredDomains],
        }
      : null;
  }

  getOpportunities() {
    return this.opportunities.map((o) => ({ ...o }));
  }

  getPendingReview() {
    return this.getOpportunities().filter((o) => o.reviewStatus === "pending_pillow_review");
  }

  getConfiguredDomains() {
    return [...this.configuredDomains];
  }

  connect(_input: Record<string, unknown>, config: OpportunityScannerConfiguration): OpportunityScannerRunReport {
    const started = Date.now();
    this.configuredDomains = [...config.opportunityDomains];
    this.ensureRecord("connected", config);
    appendOscLog({ event: "connect", details: "Opportunity Scanner connected; discovery-only mode" });
    return this.report("connect", [], {
      validationReportId: `osc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Opportunity Scanner is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: OSC_METADATA_VERSION,
    }, started);
  }

  configureDomains(input: OpportunityScannerInput, config: OpportunityScannerConfiguration): OpportunityScannerRunReport {
    const started = Date.now();
    const domains = input.domains?.length ? input.domains : config.opportunityDomains;
    this.configuredDomains = [...domains];
    this.ensureRecord("active", config);
    appendOscLog({ event: "configure_domains", details: `domains=${domains.join(",")}` });
    const boundaryFail =
      input.executeOpportunities === true ||
      input.approveOpportunities === true ||
      input.assignWorkers === true ||
      input.createBusinesses === true ||
      input.validated === false;
    return this.report("configure_domains", [], {
      validationReportId: `osc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: boundaryFail ? "fail" : domains.length ? "pass" : "partial",
      errors: boundaryFail
        ? this.validator.validateRecords([], input, started).errors
        : [],
      warnings: domains.length ? [] : ["Empty domain list narrows scan coverage"],
      durationMs: Date.now() - started,
      metadataVersion: OSC_METADATA_VERSION,
    }, started);
  }

  scanBusiness(input: OpportunityScannerInput, config: OpportunityScannerConfiguration): OpportunityScannerRunReport {
    return this.scan("scan_business", { ...input, categoryFocus: "business" }, config);
  }

  scanOperational(input: OpportunityScannerInput, config: OpportunityScannerConfiguration): OpportunityScannerRunReport {
    return this.scan("scan_operational", { ...input, categoryFocus: "operational" }, config);
  }

  scanAll(input: OpportunityScannerInput, config: OpportunityScannerConfiguration): OpportunityScannerRunReport {
    return this.scan("scan_all", { ...input, categoryFocus: input.categoryFocus ?? "all" }, config);
  }

  scoreOpportunities(input: OpportunityScannerInput, config: OpportunityScannerConfiguration): OpportunityScannerRunReport {
    return this.scan("score_opportunities", input, config);
  }

  markForReview(input: OpportunityScannerInput, config: OpportunityScannerConfiguration): OpportunityScannerRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    if (!this.opportunities.length) {
      return this.scan("mark_for_review", input, config);
    }
    this.opportunities = this.opportunities.map((o) => ({
      ...o,
      reviewStatus: "pending_pillow_review" as const,
    }));
    const pending = this.getPendingReview();
    const validation = this.validator.validateRecords(pending, { ...input, validated: input.validated !== false }, started);
    appendOscLog({ event: "mark_for_review", details: `pending=${pending.length}` });
    return this.report("mark_for_review", pending, validation, started);
  }

  validateOpportunities(input: OpportunityScannerInput, config: OpportunityScannerConfiguration): OpportunityScannerRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const records = this.getOpportunities();
    const validation = this.validator.validateRecords(records, { ...input, validated: input.validated !== false }, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    appendOscLog({ event: "validate_opportunities", details: `decision=${validation.decision}; count=${records.length}` });
    return this.report("validate_opportunities", records, validation, started);
  }

  diagnostics(config: OpportunityScannerConfiguration): OpportunityScannerRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const records = this.getOpportunities();
    const validation = records.length
      ? this.validator.validateRecords(records, { validated: true }, started)
      : {
          validationReportId: `osc-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Opportunity Scanner is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: OSC_METADATA_VERSION,
        };
    appendOscLog({
      event: "health_information",
      details: `opportunities=${records.length}; pending=${this.getPendingReview().length}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report("diagnostics", records, validation, started);
  }

  private scan(
    action: OpportunityScannerRunReport["action"],
    input: OpportunityScannerInput,
    config: OpportunityScannerConfiguration,
  ): OpportunityScannerRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const domains = input.domains?.length ? input.domains : this.configuredDomains.length ? this.configuredDomains : config.opportunityDomains;
    this.configuredDomains = [...domains];
    appendOscLog({ event: "scan_start", details: `action=${action}; domains=${domains.join(",")}` });

    const decision = this.validator.decide({ ...input, domains });
    if (decision === "fail" || !config.enabled || !config.scanningRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords([], { ...input, domains }, started);
      appendOscLog({ event: "validation_failure", details: `action=${action}; errors=${validation.errors.join("|")}` });
      return this.report(action, [], validation, started);
    }

    const status = decision === "partial" ? "partial" : "passed";
    let records = this.builder.build({ ...input, domains }, config, status);
    if (input.categoryFocus === "business") records = filterByCategory(records, "business");
    if (input.categoryFocus === "operational") records = filterByCategory(records, "operational");

    this.opportunities = [...this.opportunities, ...records];
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords(records, { ...input, domains }, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    this.metadata.generate(this.opportunities.length, domains);
    appendOscLog({
      event: "scan_complete",
      details: `action=${action}; discovered=${records.length}; pending=${records.filter((r) => r.reviewStatus === "pending_pillow_review").length}; executed=false`,
    });
    return this.report(action, records, validation, started);
  }

  private ensureRecord(state: OperationalState, config: OpportunityScannerConfiguration) {
    const pending = this.opportunities.filter((o) => o.reviewStatus === "pending_pillow_review").length;
    const lastStatus = this.opportunities[this.opportunities.length - 1]?.validationStatus ?? "pending";
    const mapped =
      lastStatus === "passed" ? "passed" : lastStatus === "partial" ? "partial" : lastStatus === "failed" ? "failed" : "pending";
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `osc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: OPPORTUNITY_SCANNER_ID,
      engineVersion: "PILLOW-OSC-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...OSC_CAPABILITIES],
      configuredDomains: [...this.configuredDomains],
      totalOpportunities: this.opportunities.length,
      pendingReviewCount: pending,
      metadataVersion: OSC_METADATA_VERSION,
    };
  }

  private report(
    action: OpportunityScannerRunReport["action"],
    opportunities: OpportunityRecord[],
    validation: OpportunityScannerRunReport["validation"],
    started: number,
  ): OpportunityScannerRunReport {
    return {
      scannerRunReportId: `osc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      opportunities: opportunities.map((o) => ({ ...o })),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: OSC_METADATA_VERSION,
    };
  }
}
