import type { SkillToolRouterConfiguration } from "./configuration.js";
import { appendStrLog } from "./str-logging.js";
import { CapabilityAnalyzer } from "./capability-analyzer.js";
import { RegistryQuery } from "./registry-query.js";
import { SuitabilityEvaluator } from "./suitability-evaluator.js";
import {
  HealthMonitor,
  RecoveryManager,
  RoutingMetadataGenerator,
  RoutingValidator,
} from "./routing-validator.js";
import {
  SKILL_TOOL_ROUTER_ID,
  STR_CAPABILITIES,
  STR_METADATA_VERSION,
} from "./paths.js";
import type {
  OperationalState,
  RoutingRecord,
  SkillToolRouterEngineRecord,
  SkillToolRouterInput,
  SkillToolRouterRunReport,
} from "./types.js";

export class SkillToolRouterCore {
  private engineRecord: SkillToolRouterEngineRecord | null = null;
  private records: RoutingRecord[] = [];
  private seeded = false;
  private readonly registry = new RegistryQuery();
  private readonly analyzer = new CapabilityAnalyzer();
  private readonly evaluator = new SuitabilityEvaluator();
  private readonly validator = new RoutingValidator();
  private readonly metadata = new RoutingMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: SkillToolRouterConfiguration) {
    if (this.seeded) return;
    this.registry.seed(config.workerCatalog, config.toolCatalog);
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

  getRecords() {
    return this.records.map((r) => this.clone(r));
  }

  getLatestRecord() {
    const records = this.getRecords();
    return records[records.length - 1] ?? null;
  }

  getWorkers() {
    return this.registry.listWorkers();
  }

  getTools() {
    return this.registry.listTools();
  }

  connect(
    _input: Record<string, unknown>,
    config: SkillToolRouterConfiguration,
  ): SkillToolRouterRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendStrLog({ event: "connect", details: "Skill & Tool Router connected; routing-only mode" });
    return this.report(
      "connect",
      [],
      this.registry.listWorkers(),
      this.registry.listTools(),
      [],
      {
        validationReportId: `str-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Skill & Tool Router is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: STR_METADATA_VERSION,
      },
      started,
    );
  }

  route(input: SkillToolRouterInput, config: SkillToolRouterConfiguration) {
    return this.runRoute("route", input, config, true);
  }

  analyseCapabilities(input: SkillToolRouterInput, config: SkillToolRouterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const decision = this.validator.decide(input);
    if (decision === "fail" || !config.enabled) {
      const validation = this.validator.validateRecords(null, input, started);
      return this.report("analyse_capabilities", [], this.getWorkers(), this.getTools(), [], validation, started);
    }
    const required = this.analyzer.analyse(input, config.capabilityKeywords);
    appendStrLog({
      event: "analyse_capabilities",
      details: `capabilities=${required.join("|")}; requestLength=${input.executiveRequest.length}`,
    });
    return this.report(
      "analyse_capabilities",
      [],
      this.getWorkers(),
      this.getTools(),
      required,
      {
        validationReportId: `str-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision,
        errors: [],
        warnings: required.length === 0 ? ["No capabilities identified"] : [],
        durationMs: Date.now() - started,
        metadataVersion: STR_METADATA_VERSION,
      },
      started,
    );
  }

  queryRegistry(input: SkillToolRouterInput, config: SkillToolRouterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const required = this.analyzer.analyse(input, config.capabilityKeywords);
    const workers = this.registry.queryWorkersByCapabilities(required);
    const tools = this.registry.queryToolsByCapabilities(required);
    appendStrLog({
      event: "query_registry",
      details: `workers=${workers.length}; tools=${tools.length}; capabilities=${required.join("|")}`,
    });
    const validation = this.validator.decide(input);
    return this.report(
      "query_registry",
      [],
      workers,
      tools,
      required,
      {
        validationReportId: `str-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: validation === "fail" ? "fail" : workers.length ? validation : "partial",
        errors: validation === "fail" ? ["Registry query rejected due to invalid executive request"] : [],
        warnings: workers.length ? [] : ["No workers found for required capabilities"],
        durationMs: Date.now() - started,
        metadataVersion: STR_METADATA_VERSION,
      },
      started,
    );
  }

  matchWorkers(input: SkillToolRouterInput, config: SkillToolRouterConfiguration) {
    return this.runRoute("match_workers", input, config, true);
  }

  matchTools(input: SkillToolRouterInput, config: SkillToolRouterConfiguration) {
    return this.runRoute("match_tools", input, config, true);
  }

  recommend(input: SkillToolRouterInput, config: SkillToolRouterConfiguration) {
    return this.runRoute("recommend", input, config, true);
  }

  listRoutes(config: SkillToolRouterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    return this.report(
      "list_routes",
      this.getRecords(),
      this.getWorkers(),
      this.getTools(),
      [],
      {
        validationReportId: `str-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Skill & Tool Router is disabled"],
        warnings: this.records.length === 0 ? ["No routing records stored yet"] : [],
        durationMs: Date.now() - started,
        metadataVersion: STR_METADATA_VERSION,
      },
      started,
    );
  }

  validateRouting(input: SkillToolRouterInput, config: SkillToolRouterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords(
      this.records,
      input.executiveRequest
        ? input
        : {
            ...input,
            executiveRequest: this.records[this.records.length - 1]?.executiveRequest ?? "validate",
            validated: true,
          },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    return this.report(
      "validate_routing",
      this.getRecords().slice(-5),
      this.getWorkers(),
      this.getTools(),
      this.getLatestRecord()?.requiredCapabilities ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: SkillToolRouterConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = this.records.length
      ? this.validator.validateRecords(
          this.records,
          {
            executiveRequest: this.records[this.records.length - 1]!.executiveRequest,
            validated: true,
          },
          started,
        )
      : {
          validationReportId: `str-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Skill & Tool Router is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: STR_METADATA_VERSION,
        };
    appendStrLog({
      event: "health_information",
      details: `routingRecords=${this.records.length}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report(
      "diagnostics",
      this.getRecords().slice(-20),
      this.getWorkers(),
      this.getTools(),
      this.getLatestRecord()?.requiredCapabilities ?? [],
      validation,
      started,
    );
  }

  private runRoute(
    action: SkillToolRouterRunReport["action"],
    input: SkillToolRouterInput,
    config: SkillToolRouterConfiguration,
    persist: boolean,
  ): SkillToolRouterRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    appendStrLog({
      event: "executive_routing_request",
      details: `action=${action}; requestLength=${input.executiveRequest?.length ?? 0}`,
    });

    const decision = this.validator.decide(input);
    if (decision === "fail" || !config.enabled || !config.routingRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords(null, input, started);
      appendStrLog({ event: "validation_failure", details: `action=${action}; errors=${validation.errors.join("|")}` });
      return this.report(action, [], this.getWorkers(), this.getTools(), [], validation, started);
    }

    const required = this.analyzer.analyse(input, config.capabilityKeywords);
    const workers = this.registry.queryWorkersByCapabilities(required);
    const tools = this.registry.queryToolsByCapabilities(required);
    const suitability = this.evaluator.evaluate(
      input,
      required,
      workers,
      tools,
      config.routingFactors,
      {
        escalationConfidenceThreshold: config.escalationConfidenceThreshold,
        multiWorkerCapabilityThreshold: config.multiWorkerCapabilityThreshold,
      },
    );
    const status = decision === "partial" ? "partial" : "passed";
    const record = this.evaluator.buildRecord(input, required, suitability, status);
    if (persist) this.records.push(record);
    this.ensureRecord("active", config);

    const validation = this.validator.validateRecords([record], input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    appendStrLog({
      event: "produce_routing_record",
      details: `routingId=${record.routingId}; workers=${record.selectedWorkers.join("|")}; tools=${record.selectedTools.join("|")}; confidence=${record.confidenceScore}; workExecuted=false`,
    });
    this.metadata.generate(this.records.length, record.confidenceScore);
    return this.report(
      action,
      [record],
      suitability.workers.map((w) => w.worker),
      suitability.tools.map((t) => t.tool),
      required,
      validation,
      started,
    );
  }

  private ensureRecord(state: OperationalState, config: SkillToolRouterConfiguration) {
    const latest = this.records[this.records.length - 1];
    const mapped =
      latest?.validationStatus === "passed"
        ? "passed"
        : latest?.validationStatus === "partial"
          ? "partial"
          : latest?.validationStatus === "failed"
            ? "failed"
            : "pending";
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `str-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SKILL_TOOL_ROUTER_ID,
      engineVersion: "PILLOW-STR-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...STR_CAPABILITIES],
      totalRoutingRecords: this.records.length,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      metadataVersion: STR_METADATA_VERSION,
    };
  }

  private report(
    action: SkillToolRouterRunReport["action"],
    records: RoutingRecord[],
    workers: SkillToolRouterRunReport["workers"],
    tools: SkillToolRouterRunReport["tools"],
    requiredCapabilities: string[],
    validation: SkillToolRouterRunReport["validation"],
    started: number,
  ): SkillToolRouterRunReport {
    return {
      routingRunReportId: `str-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      records: records.map((r) => this.clone(r)),
      workers: workers.map((w) => ({
        ...w,
        capabilities: [...w.capabilities],
        skills: [...w.skills],
        approvedTools: [...w.approvedTools],
      })),
      tools: tools.map((t) => ({
        ...t,
        compatibleCapabilities: [...t.compatibleCapabilities],
      })),
      requiredCapabilities: [...requiredCapabilities],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: STR_METADATA_VERSION,
    };
  }

  private clone(record: RoutingRecord): RoutingRecord {
    return {
      ...record,
      requiredCapabilities: [...record.requiredCapabilities],
      selectedWorkers: [...record.selectedWorkers],
      selectedTools: [...record.selectedTools],
      routingFactorsApplied: [...record.routingFactorsApplied],
      riskAssessment: {
        ...record.riskAssessment,
        factors: [...record.riskAssessment.factors],
      },
      costAssessment: {
        ...record.costAssessment,
        factors: [...record.costAssessment.factors],
      },
      alternativeRoutes: record.alternativeRoutes.map((alt) => ({
        ...alt,
        selectedWorkers: [...alt.selectedWorkers],
        selectedTools: [...alt.selectedTools],
      })),
    };
  }
}
