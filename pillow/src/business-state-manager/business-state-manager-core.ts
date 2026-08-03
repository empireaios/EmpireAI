import type { BusinessStateManagerConfiguration } from "./configuration.js";
import { appendBsmLog } from "./bsm-logging.js";
import {
  BusinessStateRegistry,
  BusinessStateValidator,
  HealthMonitor,
  RecoveryManager,
} from "./business-state-registry.js";
import {
  BSM_CAPABILITIES,
  BSM_METADATA_VERSION,
  BUSINESS_STATE_MANAGER_ID,
} from "./paths.js";
import type {
  BusinessState,
  BusinessStateManagerEngineRecord,
  BusinessStateManagerRunReport,
  OperationalState,
  QueryBusinessStateInput,
  RegisterBusinessInput,
  UpdateBusinessStateInput,
} from "./types.js";

export class BusinessStateManagerCore {
  private engineRecord: BusinessStateManagerEngineRecord | null = null;
  private readonly registry = new BusinessStateRegistry();
  private readonly validator = new BusinessStateValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getBusinesses() {
    return this.registry.list();
  }

  getBusiness(businessId: string) {
    return this.registry.get(businessId);
  }

  connect(_input: Record<string, unknown>, config: BusinessStateManagerConfiguration): BusinessStateManagerRunReport {
    const started = Date.now();
    this.ensureRecord("connected", config);
    appendBsmLog({ event: "connect", details: "Business State Manager connected; state-only mode" });
    return this.report("connect", [], {
      validationReportId: `bsm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Business State Manager is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: BSM_METADATA_VERSION,
    }, started);
  }

  registerBusiness(input: RegisterBusinessInput, config: BusinessStateManagerConfiguration): BusinessStateManagerRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    appendBsmLog({ event: "register_business", details: `name=${input.name ?? ""}` });

    if (!config.enabled || !config.registryRulesEnabled) {
      const validation = this.validator.validateRecords([], input, started);
      return this.report("register_business", [], { ...validation, errors: [...validation.errors, "Registry disabled"] }, started);
    }

    const decision = this.validator.decide(input);
    if (decision === "fail" || !input.name?.trim()) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords([], input, started);
      if (!input.name?.trim()) validation.errors.push("Business name is required");
      validation.decision = "fail";
      appendBsmLog({ event: "validation_failure", details: `register; errors=${validation.errors.join("|")}` });
      return this.report("register_business", [], validation, started);
    }

    if (this.registry.count() >= config.maxBusinesses) {
      this.recovery.recordFailure();
      return this.report("register_business", [], {
        validationReportId: `bsm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors: [`Registry capacity exceeded (${config.maxBusinesses})`],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: BSM_METADATA_VERSION,
      }, started);
    }

    try {
      const status = decision === "partial" ? "partial" : "passed";
      const record = this.registry.register(input, status);
      this.ensureRecord("active", config);
      const validation = this.validator.validateRecords([record], input, started);
      if (validation.decision === "fail") this.recovery.recordFailure();
      else this.recovery.reset();
      appendBsmLog({ event: "register_complete", details: `businessId=${record.businessId}; state=${record.currentState}` });
      return this.report("register_business", [record], validation, started);
    } catch (error) {
      this.recovery.recordFailure();
      return this.report("register_business", [], {
        validationReportId: `bsm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors: [error instanceof Error ? error.message : "Registration failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: BSM_METADATA_VERSION,
      }, started);
    }
  }

  updateBusinessState(input: UpdateBusinessStateInput, config: BusinessStateManagerConfiguration): BusinessStateManagerRunReport {
    return this.mutate("update_business_state", input, config);
  }

  updateHealth(input: UpdateBusinessStateInput, config: BusinessStateManagerConfiguration): BusinessStateManagerRunReport {
    return this.mutate("update_health", input, config);
  }

  updateProgress(input: UpdateBusinessStateInput, config: BusinessStateManagerConfiguration): BusinessStateManagerRunReport {
    return this.mutate("update_progress", input, config);
  }

  queryBusinessState(input: QueryBusinessStateInput, config: BusinessStateManagerConfiguration): BusinessStateManagerRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const decision = this.validator.decide(input);
    if (decision === "fail") {
      this.recovery.recordFailure();
      const validation = this.validator.validateRecords([], input, started);
      return this.report("query_business_state", [], validation, started);
    }
    const results = this.registry.query({
      businessId: input.businessId,
      currentState: input.currentState,
      healthStatus: input.healthStatus,
      category: input.category,
    });
    const validation = this.validator.validateRecords(results, input, started);
    appendBsmLog({ event: "query_business_state", details: `matches=${results.length}` });
    return this.report("query_business_state", results, validation, started);
  }

  listBusinesses(config: BusinessStateManagerConfiguration): BusinessStateManagerRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const results = this.registry.list();
    const validation = this.validator.validateRecords(results, { validated: true }, started);
    appendBsmLog({ event: "list_businesses", details: `total=${results.length}` });
    return this.report("list_businesses", results, validation, started);
  }

  validateConsistency(config: BusinessStateManagerConfiguration): BusinessStateManagerRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const results = this.registry.list();
    const validation = this.validator.validateRecords(results, { validated: true }, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    appendBsmLog({ event: "validate_consistency", details: `decision=${validation.decision}; total=${results.length}` });
    return this.report("validate_consistency", results, validation, started);
  }

  diagnostics(config: BusinessStateManagerConfiguration): BusinessStateManagerRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    const results = this.registry.list();
    const validation = results.length
      ? this.validator.validateRecords(results, { validated: true }, started)
      : {
          validationReportId: `bsm-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Business State Manager is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: BSM_METADATA_VERSION,
        };
    appendBsmLog({
      event: "health_information",
      details: `businesses=${results.length}; active=${this.registry.activeCount()}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report("diagnostics", results, validation, started);
  }

  private mutate(
    action: BusinessStateManagerRunReport["action"],
    input: UpdateBusinessStateInput,
    config: BusinessStateManagerConfiguration,
  ): BusinessStateManagerRunReport {
    const started = Date.now();
    this.ensureRecord("active", config);
    appendBsmLog({ event: action, details: `businessId=${input.businessId ?? ""}` });

    const decision = this.validator.decide(input);
    if (decision === "fail" || !input.businessId?.trim()) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords([], input, started);
      if (!input.businessId?.trim()) validation.errors.push("businessId is required");
      validation.decision = "fail";
      return this.report(action, [], validation, started);
    }

    try {
      const status = decision === "partial" ? "partial" : "passed";
      const record = this.registry.update(input, status);
      this.ensureRecord("active", config);
      const validation = this.validator.validateRecords([record], input, started);
      if (validation.decision === "fail") this.recovery.recordFailure();
      else this.recovery.reset();
      appendBsmLog({
        event: "state_updated",
        details: `businessId=${record.businessId}; state=${record.currentState}; health=${record.healthStatus}; version=${record.version}`,
      });
      return this.report(action, [record], validation, started);
    } catch (error) {
      this.recovery.recordFailure();
      return this.report(action, [], {
        validationReportId: `bsm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors: [error instanceof Error ? error.message : "Update failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: BSM_METADATA_VERSION,
      }, started);
    }
  }

  private ensureRecord(state: OperationalState, config: BusinessStateManagerConfiguration) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `bsm-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: BUSINESS_STATE_MANAGER_ID,
      engineVersion: "PILLOW-BSM-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status("pass", config.enabled),
      validationStatus: "passed",
      supportedCapabilities: [...BSM_CAPABILITIES],
      totalBusinesses: this.registry.count(),
      activeBusinessCount: this.registry.activeCount(),
      metadataVersion: BSM_METADATA_VERSION,
    };
  }

  private report(
    action: BusinessStateManagerRunReport["action"],
    businesses: BusinessState[],
    validation: BusinessStateManagerRunReport["validation"],
    started: number,
  ): BusinessStateManagerRunReport {
    return {
      stateRunReportId: `bsm-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      businesses: businesses.map((b) => ({ ...b })),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: BSM_METADATA_VERSION,
    };
  }
}
