import type { CollectiveReasoningEngineConfiguration } from "./configuration.js";
import { appendCoreLog } from "./core-logging.js";
import { ExpertiseIdentifier, PanelAssembler } from "./panel-assembler.js";
import { DebateCoordinator } from "./debate-coordinator.js";
import {
  HealthMonitor,
  RecoveryManager,
  ReasoningMetadataGenerator,
  ReasoningValidator,
} from "./reasoning-validator.js";
import {
  COLLECTIVE_REASONING_ENGINE_ID,
  CORE_CAPABILITIES,
  CORE_METADATA_VERSION,
} from "./paths.js";
import type {
  CollectiveReasoningEngineInput,
  CollectiveReasoningEngineRecord,
  CollectiveReasoningEngineRunReport,
  OperationalState,
  ReasoningParticipant,
  ReasoningRecord,
} from "./types.js";

export class CollectiveReasoningEngineCore {
  private engineRecord: CollectiveReasoningEngineRecord | null = null;
  private records: ReasoningRecord[] = [];
  private seeded = false;
  private catalog: ReasoningParticipant[] = [];
  private readonly expertise = new ExpertiseIdentifier();
  private readonly assembler = new PanelAssembler();
  private readonly debateCoordinator = new DebateCoordinator();
  private readonly validator = new ReasoningValidator();
  private readonly metadata = new ReasoningMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: CollectiveReasoningEngineConfiguration) {
    if (this.seeded) return;
    this.catalog = config.expertCatalog.map((p) => ({ ...p, expertise: [...p.expertise] }));
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

  getParticipants() {
    return this.catalog.map((p) => ({ ...p, expertise: [...p.expertise] }));
  }

  connect(
    _input: Record<string, unknown>,
    config: CollectiveReasoningEngineConfiguration,
  ): CollectiveReasoningEngineRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendCoreLog({ event: "connect", details: "Collective Reasoning Engine connected; reasoning-only mode" });
    return this.report("connect", [], this.getParticipants(), [], [], {
      validationReportId: `core-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Collective Reasoning Engine is disabled"],
      warnings: [],
      durationMs: Date.now() - started,
      metadataVersion: CORE_METADATA_VERSION,
    }, started);
  }

  reason(input: CollectiveReasoningEngineInput, config: CollectiveReasoningEngineConfiguration) {
    return this.runReasoning("reason", input, config, true);
  }

  identifyExpertise(input: CollectiveReasoningEngineInput, config: CollectiveReasoningEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const decision = this.validator.decide(input);
    if (decision === "fail" || !config.enabled) {
      const validation = this.validator.validateRecords(null, input, started);
      return this.report("identify_expertise", [], this.getParticipants(), [], [], validation, started);
    }
    const required = this.expertise.identify(input, config.expertiseKeywords);
    appendCoreLog({
      event: "identify_expertise",
      details: `expertise=${required.join("|")}; questionLength=${input.executiveQuestion.length}`,
    });
    return this.report("identify_expertise", [], this.getParticipants(), required, [], {
      validationReportId: `core-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors: [],
      warnings: required.length === 0 ? ["No expertise identified"] : [],
      durationMs: Date.now() - started,
      metadataVersion: CORE_METADATA_VERSION,
    }, started);
  }

  assemblePanel(input: CollectiveReasoningEngineInput, config: CollectiveReasoningEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const decision = this.validator.decide(input);
    if (decision === "fail" || !config.enabled) {
      const validation = this.validator.validateRecords(null, input, started);
      return this.report("assemble_panel", [], [], [], [], validation, started);
    }
    const required = this.expertise.identify(input, config.expertiseKeywords);
    const panel = this.assembler.assemble(this.catalog, required, input, {
      minPanelSize: config.minPanelSize,
      maxPanelSize: config.maxPanelSize,
      defaultPanelSize: config.defaultPanelSize,
    });
    appendCoreLog({
      event: "assemble_panel",
      details: `participants=${panel.map((p) => p.workerId).join("|")}; expertise=${required.join("|")}`,
    });
    return this.report("assemble_panel", [], panel, required, [], {
      validationReportId: `core-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: panel.length >= config.minPanelSize ? decision : "partial",
      errors: [],
      warnings: panel.length < config.minPanelSize ? ["Panel below minimum size"] : [],
      durationMs: Date.now() - started,
      metadataVersion: CORE_METADATA_VERSION,
    }, started);
  }

  collectOpinions(input: CollectiveReasoningEngineInput, config: CollectiveReasoningEngineConfiguration) {
    return this.runReasoning("collect_opinions", input, config, true);
  }

  detectConflicts(input: CollectiveReasoningEngineInput, config: CollectiveReasoningEngineConfiguration) {
    return this.runReasoning("detect_conflicts", input, config, true);
  }

  debate(input: CollectiveReasoningEngineInput, config: CollectiveReasoningEngineConfiguration) {
    return this.runReasoning("debate", input, config, true);
  }

  buildConsensus(input: CollectiveReasoningEngineInput, config: CollectiveReasoningEngineConfiguration) {
    return this.runReasoning("build_consensus", input, config, true);
  }

  recommend(input: CollectiveReasoningEngineInput, config: CollectiveReasoningEngineConfiguration) {
    return this.runReasoning("recommend", input, config, true);
  }

  listRecords(config: CollectiveReasoningEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    return this.report("list_records", this.getRecords(), this.getParticipants(), [], [], {
      validationReportId: `core-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Collective Reasoning Engine is disabled"],
      warnings: this.records.length === 0 ? ["No reasoning records stored yet"] : [],
      durationMs: Date.now() - started,
      metadataVersion: CORE_METADATA_VERSION,
    }, started);
  }

  validateReasoning(input: CollectiveReasoningEngineInput, config: CollectiveReasoningEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords(
      this.records,
      input.executiveQuestion
        ? input
        : {
            ...input,
            executiveQuestion: this.records[this.records.length - 1]?.executiveQuestion ?? "validate",
            validated: true,
          },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    return this.report(
      "validate_reasoning",
      this.getRecords().slice(-5),
      this.getParticipants(),
      this.getLatestRecord()?.requiredExpertise ?? [],
      this.getLatestRecord()?.modesApplied ?? [],
      validation,
      started,
    );
  }

  diagnostics(config: CollectiveReasoningEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = this.records.length
      ? this.validator.validateRecords(
          this.records,
          {
            executiveQuestion: this.records[this.records.length - 1]!.executiveQuestion,
            validated: true,
          },
          started,
        )
      : {
          validationReportId: `core-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Collective Reasoning Engine is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: CORE_METADATA_VERSION,
        };
    appendCoreLog({
      event: "health_information",
      details: `reasoningRecords=${this.records.length}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report(
      "diagnostics",
      this.getRecords().slice(-20),
      this.getParticipants(),
      this.getLatestRecord()?.requiredExpertise ?? [],
      this.getLatestRecord()?.modesApplied ?? [],
      validation,
      started,
    );
  }

  private runReasoning(
    action: CollectiveReasoningEngineRunReport["action"],
    input: CollectiveReasoningEngineInput,
    config: CollectiveReasoningEngineConfiguration,
    persist: boolean,
  ): CollectiveReasoningEngineRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    appendCoreLog({
      event: "executive_reasoning_request",
      details: `action=${action}; questionLength=${input.executiveQuestion?.length ?? 0}`,
    });

    const decision = this.validator.decide(input);
    if (decision === "fail" || !config.enabled || !config.reasoningRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords(null, input, started);
      appendCoreLog({ event: "validation_failure", details: `action=${action}; errors=${validation.errors.join("|")}` });
      return this.report(action, [], this.getParticipants(), [], [], validation, started);
    }

    const required = this.expertise.identify(input, config.expertiseKeywords);
    const panel = this.assembler.assemble(this.catalog, required, input, {
      minPanelSize: config.minPanelSize,
      maxPanelSize: config.maxPanelSize,
      defaultPanelSize: config.defaultPanelSize,
    });
    const session = this.debateCoordinator.run(
      input,
      panel,
      required,
      config.supportedModes,
      config.consensusThreshold,
    );
    const status = decision === "partial" ? "partial" : "passed";
    const record = this.debateCoordinator.buildRecord(input, panel, required, session, status);
    if (persist) this.records.push(record);
    this.ensureRecord("active", config);

    const validation = this.validator.validateRecords([record], input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    appendCoreLog({
      event: "produce_reasoning_record",
      details: `reasoningId=${record.reasoningId}; participants=${record.participants.length}; conflicts=${record.conflictsDetected}; confidence=${record.confidenceScore}; workExecuted=false`,
    });
    this.metadata.generate(this.records.length, record.confidenceScore);
    return this.report(
      action,
      [record],
      panel,
      required,
      session.modesApplied,
      validation,
      started,
    );
  }

  private ensureRecord(state: OperationalState, config: CollectiveReasoningEngineConfiguration) {
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
      engineRecordId: this.engineRecord?.engineRecordId ?? `core-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: COLLECTIVE_REASONING_ENGINE_ID,
      engineVersion: "PILLOW-CORE-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...CORE_CAPABILITIES],
      totalReasoningRecords: this.records.length,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      metadataVersion: CORE_METADATA_VERSION,
    };
  }

  private report(
    action: CollectiveReasoningEngineRunReport["action"],
    records: ReasoningRecord[],
    participants: ReasoningParticipant[],
    requiredExpertise: string[],
    modesApplied: string[],
    validation: CollectiveReasoningEngineRunReport["validation"],
    started: number,
  ): CollectiveReasoningEngineRunReport {
    return {
      reasoningRunReportId: `core-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      records: records.map((r) => this.clone(r)),
      participants: participants.map((p) => ({ ...p, expertise: [...p.expertise] })),
      requiredExpertise: [...requiredExpertise],
      modesApplied: [...modesApplied],
      validation,
      durationMs: Date.now() - started,
      metadataVersion: CORE_METADATA_VERSION,
    };
  }

  private clone(record: ReasoningRecord): ReasoningRecord {
    return {
      ...record,
      participants: [...record.participants],
      independentOpinions: record.independentOpinions.map((o) => ({
        ...o,
        assumptions: [...o.assumptions],
        evidence: [...o.evidence],
      })),
      challengesRaised: record.challengesRaised.map((c) => ({ ...c })),
      supportingEvidence: [...record.supportingEvidence],
      minorityOpinions: record.minorityOpinions.map((m) => ({ ...m })),
      modesApplied: [...record.modesApplied],
      requiredExpertise: [...record.requiredExpertise],
    };
  }
}
