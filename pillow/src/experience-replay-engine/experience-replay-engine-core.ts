import type { ExperienceReplayEngineConfiguration } from "./configuration.js";
import { appendXplLog } from "./xpl-logging.js";
import { HistoryRetriever } from "./history-retriever.js";
import { LessonExtractor } from "./lesson-extractor.js";
import {
  ExperienceMetadataGenerator,
  ExperienceValidator,
  HealthMonitor,
  RecoveryManager,
} from "./experience-validator.js";
import {
  EXPERIENCE_REPLAY_ENGINE_ID,
  XPL_CAPABILITIES,
  XPL_METADATA_VERSION,
} from "./paths.js";
import type {
  ExperienceRecord,
  ExperienceReplayEngineInput,
  ExperienceReplayEngineRecord,
  ExperienceReplayEngineRunReport,
  HistoricalExecutionEvent,
  LearnedLesson,
  OperationalState,
  RepeatedMistake,
} from "./types.js";

export class ExperienceReplayEngineCore {
  private engineRecord: ExperienceReplayEngineRecord | null = null;
  private records: ExperienceRecord[] = [];
  private lessons: LearnedLesson[] = [];
  private repeatedMistakes: RepeatedMistake[] = [];
  private seeded = false;
  private readonly history = new HistoryRetriever();
  private readonly extractor = new LessonExtractor();
  private readonly validator = new ExperienceValidator();
  private readonly metadata = new ExperienceMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: ExperienceReplayEngineConfiguration) {
    if (this.seeded) return;
    this.history.seed(config.historicalCatalog);
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

  getLessons() {
    return this.lessons.map((l) => ({ ...l, relatedMissionIds: [...l.relatedMissionIds] }));
  }

  getRepeatedMistakes() {
    return this.repeatedMistakes.map((m) => ({
      ...m,
      relatedMissionIds: [...m.relatedMissionIds],
    }));
  }

  getHistory() {
    return this.history.list();
  }

  connect(
    _input: Record<string, unknown>,
    config: ExperienceReplayEngineConfiguration,
  ): ExperienceReplayEngineRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendXplLog({ event: "connect", details: "Experience Replay Engine connected; learning-only mode" });
    return this.report(
      "connect",
      [],
      this.history.list(),
      [],
      [],
      {
        validationReportId: `xpl-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Experience Replay Engine is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: XPL_METADATA_VERSION,
      },
      started,
    );
  }

  replay(input: ExperienceReplayEngineInput, config: ExperienceReplayEngineConfiguration) {
    return this.runLearning("replay", input, config, () => this.history.retrieve(normalizeInput(input)));
  }

  analyseSuccess(input: ExperienceReplayEngineInput, config: ExperienceReplayEngineConfiguration) {
    return this.runLearning("analyse_success", input, config, () =>
      this.history.byOutcome("success").filter((e) => matchesFilters(e, input)),
    );
  }

  analyseFailure(input: ExperienceReplayEngineInput, config: ExperienceReplayEngineConfiguration) {
    return this.runLearning("analyse_failure", input, config, () =>
      this.history.byOutcome("failure").filter((e) => matchesFilters(e, input)),
    );
  }

  analyseRejection(input: ExperienceReplayEngineInput, config: ExperienceReplayEngineConfiguration) {
    return this.runLearning("analyse_rejection", input, config, () =>
      this.history.byOutcome("rejected").filter((e) => matchesFilters(e, input)),
    );
  }

  analyseGrandKing(input: ExperienceReplayEngineInput, config: ExperienceReplayEngineConfiguration) {
    return this.runLearning("analyse_grand_king", input, config, () =>
      this.history.withGrandKingFeedback().filter((e) => matchesFilters(e, input)),
    );
  }

  detectPatterns(input: ExperienceReplayEngineInput, config: ExperienceReplayEngineConfiguration) {
    return this.runLearning("detect_patterns", input, config, () =>
      this.history.retrieve(normalizeInput(input)),
    );
  }

  extractLessons(input: ExperienceReplayEngineInput, config: ExperienceReplayEngineConfiguration) {
    return this.runLearning("extract_lessons", input, config, () =>
      this.history.retrieve(normalizeInput(input)),
    );
  }

  recommend(input: ExperienceReplayEngineInput, config: ExperienceReplayEngineConfiguration) {
    return this.runLearning("recommend", input, config, () =>
      this.history.retrieve(normalizeInput(input)),
    );
  }

  listRecords(config: ExperienceReplayEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    return this.report(
      "list_records",
      this.getRecords(),
      this.history.list(),
      this.getLessons(),
      this.getRepeatedMistakes(),
      {
        validationReportId: `xpl-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Experience Replay Engine is disabled"],
        warnings: this.records.length === 0 ? ["No experience records stored yet"] : [],
        durationMs: Date.now() - started,
        metadataVersion: XPL_METADATA_VERSION,
      },
      started,
    );
  }

  validateExperience(input: ExperienceReplayEngineInput, config: ExperienceReplayEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = this.validator.validateRecords(this.records, normalizeInput(input), started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    return this.report(
      "validate_experience",
      this.getRecords().slice(-5),
      this.history.list(),
      this.getLessons(),
      this.getRepeatedMistakes(),
      validation,
      started,
    );
  }

  diagnostics(config: ExperienceReplayEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const validation = this.records.length
      ? this.validator.validateRecords(this.records, { validated: true }, started)
      : {
          validationReportId: `xpl-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.enabled ? ("pass" as const) : ("fail" as const),
          errors: config.enabled ? [] : ["Experience Replay Engine is disabled"],
          warnings: [] as string[],
          durationMs: Date.now() - started,
          metadataVersion: XPL_METADATA_VERSION,
        };
    appendXplLog({
      event: "health_information",
      details: `experienceRecords=${this.records.length}; mistakes=${this.repeatedMistakes.length}; health=${this.healthMonitor.status(validation.decision, config.enabled)}`,
    });
    return this.report(
      "diagnostics",
      this.getRecords().slice(-20),
      this.history.list(),
      this.getLessons(),
      this.getRepeatedMistakes(),
      validation,
      started,
    );
  }

  private runLearning(
    action: ExperienceReplayEngineRunReport["action"],
    input: ExperienceReplayEngineInput,
    config: ExperienceReplayEngineConfiguration,
    select: () => HistoricalExecutionEvent[],
  ): ExperienceReplayEngineRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("active", config);
    const normalized = normalizeInput(input);
    appendXplLog({
      event: "experience_replay_request",
      details: `action=${action}; missionId=${normalized.missionId ?? "all"}; sources=${(normalized.sources ?? []).join("|") || "all"}`,
    });

    const decision = this.validator.decide(normalized);
    if (decision === "fail" || !config.enabled || !config.learningRulesEnabled) {
      if (decision === "fail") this.recovery.recordFailure();
      const validation = this.validator.validateRecords(null, normalized, started);
      appendXplLog({ event: "validation_failure", details: `action=${action}; errors=${validation.errors.join("|")}` });
      return this.report(action, [], this.history.list(), [], [], validation, started);
    }

    const selected = select();
    const status = decision === "partial" ? "partial" : "passed";
    const learning = this.extractor.analyseSubset(
      normalized,
      selected,
      this.history.list(),
      config.mistakeRepeatThreshold,
      config.experienceSources,
      status,
    );

    // Update authoritative experience store with newly learned records.
    for (const record of learning.records) {
      this.records.push(record);
    }
    this.lessons = mergeLessons(this.lessons, learning.lessons);
    this.repeatedMistakes = learning.repeatedMistakes;
    this.ensureRecord("active", config);

    const validation = this.validator.validateRecords(learning.records, normalized, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();

    appendXplLog({
      event: "produce_experience_record",
      details: `records=${learning.records.length}; lessons=${learning.lessons.length}; mistakes=${learning.repeatedMistakes.length}; workExecuted=false`,
    });
    this.metadata.generate(
      this.records.length,
      learning.records[learning.records.length - 1]?.confidenceScore ?? null,
    );
    return this.report(
      action,
      learning.records,
      selected,
      learning.lessons,
      learning.repeatedMistakes,
      validation,
      started,
    );
  }

  private ensureRecord(state: OperationalState, config: ExperienceReplayEngineConfiguration) {
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
      engineRecordId: this.engineRecord?.engineRecordId ?? `xpl-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EXPERIENCE_REPLAY_ENGINE_ID,
      engineVersion: "PILLOW-XPL-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        mapped === "passed" ? "pass" : mapped === "partial" ? "partial" : mapped === "failed" ? "fail" : null,
        config.enabled,
      ),
      validationStatus: mapped,
      supportedCapabilities: [...XPL_CAPABILITIES],
      totalExperienceRecords: this.records.length,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      metadataVersion: XPL_METADATA_VERSION,
    };
  }

  private report(
    action: ExperienceReplayEngineRunReport["action"],
    records: ExperienceRecord[],
    history: HistoricalExecutionEvent[],
    lessons: LearnedLesson[],
    repeatedMistakes: RepeatedMistake[],
    validation: ExperienceReplayEngineRunReport["validation"],
    started: number,
  ): ExperienceReplayEngineRunReport {
    return {
      experienceRunReportId: `xpl-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      records: records.map((r) => this.clone(r)),
      history: history.map((h) => ({ ...h, factors: [...h.factors] })),
      lessons: lessons.map((l) => ({ ...l, relatedMissionIds: [...l.relatedMissionIds] })),
      repeatedMistakes: repeatedMistakes.map((m) => ({
        ...m,
        relatedMissionIds: [...m.relatedMissionIds],
      })),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: XPL_METADATA_VERSION,
    };
  }

  private clone(record: ExperienceRecord): ExperienceRecord {
    return {
      ...record,
      successFactors: [...record.successFactors],
      failureFactors: [...record.failureFactors],
      lessonsLearned: [...record.lessonsLearned],
      supportingEvidence: [...record.supportingEvidence],
      sourcesApplied: [...record.sourcesApplied],
      patternsIdentified: [...record.patternsIdentified],
      repeatedMistakes: record.repeatedMistakes.map((m) => ({
        ...m,
        relatedMissionIds: [...m.relatedMissionIds],
      })),
    };
  }
}

function normalizeInput(input: ExperienceReplayEngineInput): ExperienceReplayEngineInput {
  return {
    ...input,
    validated: input.validated !== false,
  };
}

function matchesFilters(event: HistoricalExecutionEvent, input: ExperienceReplayEngineInput) {
  if (input.missionId && event.missionId !== input.missionId) return false;
  if (input.businessId && event.businessId !== input.businessId) return false;
  return true;
}

function mergeLessons(existing: LearnedLesson[], incoming: LearnedLesson[]) {
  const map = new Map<string, LearnedLesson>();
  for (const lesson of [...existing, ...incoming]) {
    map.set(lesson.statement, {
      ...lesson,
      relatedMissionIds: [...lesson.relatedMissionIds],
    });
  }
  return [...map.values()];
}
