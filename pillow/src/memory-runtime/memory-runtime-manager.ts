import type { MemoryRuntimeConfiguration } from "./configuration.js";
import { MemrtIntegrationCoordinator, type MemoryRuntimeDependencies } from "./integrations.js";
import { ContextIndexer } from "./context-indexer.js";
import { ContextProvider } from "./context-provider.js";
import { LineageTracker } from "./lineage-tracker.js";
import { appendMemrtLog } from "./memrt-logging.js";
import { MemoryReader } from "./memory-reader.js";
import { MemoryStore } from "./memory-store.js";
import { MemoryValidator } from "./memory-validator.js";
import { MemoryWriter } from "./memory-writer.js";
import { MetricsCollector } from "./metrics-collector.js";
import { QueryEngine } from "./query-engine.js";
import { ReportBuilder } from "./report-builder.js";
import { VersioningEngine } from "./versioning-engine.js";
import {
  INTEGRATION_TARGETS,
  MEMORY_RUNTIME_ID,
  MEMRT_CAPABILITIES,
  MEMRT_METADATA_VERSION,
} from "./paths.js";
import type {
  IntegrationHandshake,
  MemrtEngineRecord,
  MemrtInput,
  MemrtRunReport,
  MemrtValidationReport,
  MemoryEntry,
  MemoryRuntimeReport,
  Q1006ConsumableContract,
} from "./types.js";

export class MemoryRuntimeManager {
  private engineRecord: MemrtEngineRecord | null = null;
  private seeded = false;
  private readonly store = new MemoryStore();
  private readonly validator = new MemoryValidator();
  private readonly versioning = new VersioningEngine();
  private readonly lineage = new LineageTracker();
  private readonly queryEngine = new QueryEngine();
  private readonly writer = new MemoryWriter(this.versioning, this.lineage);
  private readonly reader = new MemoryReader(this.queryEngine);
  private readonly contextProvider = new ContextProvider(new ContextIndexer());
  private readonly metricsCollector = new MetricsCollector();
  private readonly reportBuilder = new ReportBuilder();
  private readonly integrations = new MemrtIntegrationCoordinator();

  bindIntegrations(deps: MemoryRuntimeDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  ensureSeeded(_config: MemoryRuntimeConfiguration) {
    if (this.seeded) return;
    this.seeded = true;
    this.ensureRecord("active", _config);
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

  getHistory() {
    return this.store.getHistory();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getQ1006ConsumableContract(config: MemoryRuntimeConfiguration): Q1006ConsumableContract {
    return this.reportBuilder.buildQ1006ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: MemoryRuntimeConfiguration): MemrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    appendMemrtLog({
      event: "connect",
      details: `Memory Runtime connected; integrations=${handshakes.filter((h) => h.available).length}`,
    });
    return this.reportAction("connect", started, { validated: true }, config, null, null, null, handshakes);
  }

  storeMemory(input: MemrtInput, config: MemoryRuntimeConfiguration): MemrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateStore(input, started);
    if (validation.decision === "fail") {
      return this.failReport("store_memory", started, validation, config);
    }
    const memory = this.writer.store(this.store, input, config);
    this.ensureRecord("active", config);
    appendMemrtLog({ event: "store_memory", details: memory.memoryId });
    return this.reportAction("store_memory", started, input, config, memory, null, null);
  }

  retrieveMemory(input: MemrtInput, config: MemoryRuntimeConfiguration): MemrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("retrieve_memory", started, validation, config);
    }
    let memory = this.reader.retrieve(this.store, input);
    let retrievalResult = null;
    if (!memory && input.query) {
      retrievalResult = this.reader.query(this.store, input.query);
      memory = retrievalResult.matches[0] ?? null;
    }
    return this.reportAction("retrieve_memory", started, input, config, memory, null, retrievalResult);
  }

  storeDecision(input: MemrtInput, config: MemoryRuntimeConfiguration): MemrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateStore(input, started);
    if (validation.decision === "fail") {
      return this.failReport("store_decision", started, validation, config);
    }
    const memory = this.writer.storeDecision(this.store, input, config);
    appendMemrtLog({ event: "store_decision", details: memory.memoryId });
    return this.reportAction("store_decision", started, input, config, memory, null, null);
  }

  retrieveDecisionHistory(input: MemrtInput, config: MemoryRuntimeConfiguration): MemrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("retrieve_decision_history", started, validation, config);
    }
    const retrievalResult = this.reader.retrieveDecisionHistory(this.store, input);
    return this.reportAction(
      "retrieve_decision_history",
      started,
      input,
      config,
      retrievalResult.matches[0] ?? null,
      null,
      retrievalResult,
    );
  }

  retrievePreviousResults(input: MemrtInput, config: MemoryRuntimeConfiguration): MemrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("retrieve_previous_results", started, validation, config);
    }
    const retrievalResult = this.reader.retrievePreviousResults(this.store, input);
    return this.reportAction(
      "retrieve_previous_results",
      started,
      input,
      config,
      retrievalResult.matches[0] ?? null,
      null,
      retrievalResult,
    );
  }

  provideRuntimeContext(input: MemrtInput, config: MemoryRuntimeConfiguration): MemrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("provide_runtime_context", started, validation, config);
    }
    const contextBundle = this.contextProvider.provideRuntimeContext(this.store, input);
    appendMemrtLog({ event: "provide_runtime_context", details: contextBundle.bundleId });
    return this.reportAction("provide_runtime_context", started, input, config, null, contextBundle, null);
  }

  listVersions(input: MemrtInput, config: MemoryRuntimeConfiguration): MemrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail" || !input.memoryId) {
      if (!input.memoryId) validation.errors.push("memoryId required");
      return this.failReport("list_versions", started, validation, config);
    }
    const memory = this.store.getEntry(input.memoryId);
    return this.reportAction("list_versions", started, input, config, memory, null, null);
  }

  produceReport(input: MemrtInput, config: MemoryRuntimeConfiguration): MemrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("produce_report", started, validation, config);
    }
    const metrics = this.metricsCollector.collect(this.store);
    const report = this.reportBuilder.buildMemoryRuntimeReport(this.store, this.metricsCollector, config, {
      auditStatus: "passed",
      outstandingIssues: [],
      confidenceScore: Math.min(95, 70 + metrics.totalEntries * 2),
      supportingEvidence: ["memory-runtime operational evidence"],
    });
    this.store.saveReport(report);
    this.ensureRecord("active", config);
    return {
      action: "produce_report",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "pass",
      validation,
      memory: null,
      contextBundle: null,
      retrievalResult: null,
      memoryRuntimeReport: report,
      errors: [],
      warnings: [],
    };
  }

  submitReport(input: MemrtInput, config: MemoryRuntimeConfiguration): MemrtRunReport {
    const started = Date.now();
    const produced = this.produceReport(input, config);
    if (produced.decision === "fail" || !produced.memoryRuntimeReport) {
      return produced;
    }
    this.integrations.submitReport(produced.memoryRuntimeReport);
    this.integrations.recordAudit({
      event: "memory_runtime_report_submitted",
      reportId: produced.memoryRuntimeReport.reportId,
    });
    return { ...produced, action: "submit_report" };
  }

  list(_input: MemrtInput, config: MemoryRuntimeConfiguration): MemrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    return this.reportAction("list", started, _input, config, null, null, null);
  }

  validate(input: MemrtInput, config: MemoryRuntimeConfiguration): MemrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (input.forceFail === true) {
      validation.decision = "fail";
      validation.errors.push("forceFail is not permitted");
    }
    return {
      action: "validate",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: validation.decision === "pass" ? "pass" : "fail",
      validation,
      memory: null,
      contextBundle: null,
      retrievalResult: null,
      memoryRuntimeReport: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  diagnostics(_input: MemrtInput, config: MemoryRuntimeConfiguration): MemrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(config.integrationTargets);
    this.reportBuilder.buildDiagnostics(this.store, handshakes);
    return this.reportAction("diagnostics", started, _input, config, null, null, null, handshakes);
  }

  private ensureRecord(state: MemrtEngineRecord["operationalState"], config: MemoryRuntimeConfiguration) {
    const entries = this.store.listEntries();
    const totalVersions = entries.reduce((sum, e) => sum + e.versions.length, 0);
    const lastReport = this.store.listReports().at(-1);
    this.engineRecord = {
      engineId: MEMORY_RUNTIME_ID,
      workerId: config.workerId,
      operationalState: state,
      healthStatus: entries.length > 0 ? "healthy" : "standby",
      totalEntries: entries.length,
      totalVersions,
      totalReports: this.store.listReports().length,
      lastReportId: lastReport?.reportId ?? null,
      supportedCapabilities: [...MEMRT_CAPABILITIES],
      integrationTargets: [...config.integrationTargets] as MemrtEngineRecord["integrationTargets"],
      metadataVersion: MEMRT_METADATA_VERSION,
    };
  }

  private reportAction(
    action: string,
    started: number,
    input: MemrtInput,
    config: MemoryRuntimeConfiguration,
    memory: MemoryEntry | null,
    contextBundle: MemrtRunReport["contextBundle"],
    retrievalResult: MemrtRunReport["retrievalResult"],
    handshakes: IntegrationHandshake[] = [],
  ): MemrtRunReport {
    const validation = this.validator.validateInput(input, started);
    const decision = validation.decision === "fail" ? "fail" : "pass";
    if (handshakes.length) {
      appendMemrtLog({ event: action, details: `integrations=${handshakes.length}` });
    }
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision,
      validation,
      memory,
      contextBundle,
      retrievalResult,
      memoryRuntimeReport: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  private failReport(
    action: string,
    started: number,
    validation: MemrtValidationReport,
    _config: MemoryRuntimeConfiguration,
  ): MemrtRunReport {
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      memory: null,
      contextBundle: null,
      retrievalResult: null,
      memoryRuntimeReport: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
}
