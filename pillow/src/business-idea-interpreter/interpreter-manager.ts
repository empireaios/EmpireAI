import type { BusinessIdeaInterpreterConfiguration } from "./configuration.js";
import { IntentBuilder } from "./intent-builder.js";
import { IntentStore } from "./intent-store.js";
import { HealthMonitor, IntentValidator, RecoveryManager } from "./intent-validator.js";
import { appendBiiLog } from "./bii-logging.js";
import {
  BII_CAPABILITIES,
  BII_METADATA_VERSION,
  BUSINESS_IDEA_INTERPRETER_ID,
} from "./paths.js";
import type {
  BusinessIdeaInterpreterCatalog,
  BusinessIdeaInterpreterEngineRecord,
  BusinessIdeaInterpreterInput,
  BusinessIdeaInterpreterRunReport,
  OperationalState,
  StructuredBusinessIntent,
} from "./types.js";

export class BusinessIdeaInterpreterManager {
  private engineRecord: BusinessIdeaInterpreterEngineRecord | null = null;
  private seeded = false;
  private catalog: BusinessIdeaInterpreterCatalog | null = null;
  private readonly store = new IntentStore();
  private readonly builder = new IntentBuilder();
  private readonly validator = new IntentValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: BusinessIdeaInterpreterConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedIntents);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getIntents() {
    return this.store.list();
  }

  getLatestIntentId() {
    return this.store.getLatestIntentId();
  }

  connect(
    _input: Record<string, unknown>,
    config: BusinessIdeaInterpreterConfiguration,
  ): BusinessIdeaInterpreterRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendBiiLog({
      event: "connect",
      details: "Business Idea Interpreter connected; interpret-only mode",
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `bii-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Business Idea Interpreter is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: BII_METADATA_VERSION,
      },
      started,
    );
  }

  acceptCommand(
    input: BusinessIdeaInterpreterInput,
    config: BusinessIdeaInterpreterConfiguration,
  ) {
    return this.runInterpret("accept_command", input, config);
  }

  interpret(
    input: BusinessIdeaInterpreterInput,
    config: BusinessIdeaInterpreterConfiguration,
  ) {
    return this.runInterpret("interpret", input, config);
  }

  produce(
    input: BusinessIdeaInterpreterInput,
    config: BusinessIdeaInterpreterConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("produce", input, config, started);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const intents = this.store.list();
    const latest = intents[intents.length - 1] ?? null;
    const validation = this.validator.validateIntents(
      intents.length ? intents : null,
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
    appendBiiLog({ event: "produce", details: `intents=${this.store.count()}` });
    return this.report("produce", this.getCatalog(), intents, latest, validation, started);
  }

  list(config: BusinessIdeaInterpreterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const intents = this.store.list();
    const latest = intents[intents.length - 1] ?? null;
    const validation = this.validator.validateIntents(
      intents.length ? intents : null,
      { validated: true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", latest);
    return this.report("list", this.getCatalog(), intents, latest, validation, started);
  }

  validate(
    input: BusinessIdeaInterpreterInput,
    config: BusinessIdeaInterpreterConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const intents = this.store.list();
    const latest = intents[intents.length - 1] ?? null;
    const validation = this.validator.validateIntents(
      intents.length ? intents : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", latest);
    return this.report("validate", this.getCatalog(), intents, latest, validation, started);
  }

  diagnostics(config: BusinessIdeaInterpreterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Business Idea Interpreter is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendBiiLog({ event: "diagnostics", details: `intents=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runInterpret(
    action: BusinessIdeaInterpreterRunReport["action"],
    input: BusinessIdeaInterpreterInput,
    config: BusinessIdeaInterpreterConfiguration,
  ): BusinessIdeaInterpreterRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.interpretationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Business Idea Interpreter is disabled"
          : "Interpretation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    if (!input.originalCommand?.trim()) {
      return this.disabled(action, config, "originalCommand is required");
    }

    const intent = this.builder.interpret(input, config);
    this.store.save(intent);
    this.catalog = this.builder.buildCatalog(config, this.store.list());
    const validation = this.validator.validateIntents(
      [intent],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", intent);
    appendBiiLog({
      event: action,
      details: `intent=${intent.intentId} type=${intent.businessType} confidence=${intent.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [intent], intent, validation, started);
  }

  private boundaryFail(
    action: BusinessIdeaInterpreterRunReport["action"],
    input: BusinessIdeaInterpreterInput,
    config: BusinessIdeaInterpreterConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateIntents(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: BusinessIdeaInterpreterRunReport["action"],
    config: BusinessIdeaInterpreterConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: BusinessIdeaInterpreterInput) {
    return (
      input.generateBusinessModels === true ||
      input.researchMarkets === true ||
      input.buildBusinesses === true ||
      input.assignWorkers === true ||
      input.executeAnything === true ||
      input.implementQ203OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: BusinessIdeaInterpreterConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: StructuredBusinessIntent | null = null,
  ) {
    const intent = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `bii-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: BUSINESS_IDEA_INTERPRETER_ID,
      engineVersion: "PILLOW-BII-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...BII_CAPABILITIES],
      totalIntents: this.store.count(),
      lastBusinessType: intent?.businessType ?? null,
      lastIntentId: intent?.intentId ?? this.store.getLatestIntentId(),
      lastConfidenceScore: intent?.confidenceScore ?? null,
      metadataVersion: BII_METADATA_VERSION,
    };
  }

  private report(
    action: BusinessIdeaInterpreterRunReport["action"],
    catalog: BusinessIdeaInterpreterCatalog | null,
    intents: StructuredBusinessIntent[],
    latestIntent: StructuredBusinessIntent | null,
    validation: BusinessIdeaInterpreterRunReport["validation"],
    started: number,
  ): BusinessIdeaInterpreterRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      interpreterRunReportId: `bii-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      intents,
      latestIntent,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: BII_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: BusinessIdeaInterpreterCatalog): BusinessIdeaInterpreterCatalog {
  return {
    ...catalog,
    businessTypes: [...catalog.businessTypes],
    intents: catalog.intents.map((intent) => ({
      ...intent,
      constraints: [...intent.constraints],
      missingInformation: [...intent.missingInformation],
    })),
  };
}
