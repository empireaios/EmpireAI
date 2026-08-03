import type { KnowledgeSharingBusConfiguration } from "./configuration.js";
import { KnowledgeClassifier } from "./knowledge-classifier.js";
import { KnowledgeStore } from "./knowledge-store.js";
import {
  HealthMonitor,
  KnowledgeSharingBusMetadataGenerator,
  KnowledgeValidator,
  RecoveryManager,
} from "./knowledge-validator.js";
import { appendKsbLog } from "./ksb-logging.js";
import {
  KNOWLEDGE_SHARING_BUS_ID,
  KSB_CAPABILITIES,
  KSB_METADATA_VERSION,
} from "./paths.js";
import type {
  KnowledgeRecord,
  KnowledgeSharingBusEngineRecord,
  KnowledgeSharingBusInput,
  KnowledgeSharingBusRunReport,
  OperationalState,
} from "./types.js";

export class KnowledgeSharingBusCore {
  private engineRecord: KnowledgeSharingBusEngineRecord | null = null;
  private seeded = false;
  private readonly store = new KnowledgeStore();
  private readonly classifier = new KnowledgeClassifier();
  private readonly validator = new KnowledgeValidator();
  private readonly metadata = new KnowledgeSharingBusMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: KnowledgeSharingBusConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedKnowledge);
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
    return this.store.list();
  }

  getLatestRecord() {
    const records = this.getRecords();
    return records[records.length - 1] ?? null;
  }

  getSubscriptions() {
    return this.store.getSubscriptions();
  }

  connect(
    _input: Record<string, unknown>,
    config: KnowledgeSharingBusConfiguration,
  ): KnowledgeSharingBusRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendKsbLog({
      event: "connect",
      details: "Knowledge Sharing Bus connected; distribute-only mode",
    });
    return this.report(
      "connect",
      [],
      [],
      false,
      null,
      {
        validationReportId: `ksb-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Knowledge Sharing Bus is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: KSB_METADATA_VERSION,
      },
      started,
    );
  }

  submit(input: KnowledgeSharingBusInput, config: KnowledgeSharingBusConfiguration) {
    return this.runKnowledge("submit", input, config, true, "draft");
  }

  classify(input: KnowledgeSharingBusInput, config: KnowledgeSharingBusConfiguration) {
    return this.runKnowledge("classify", input, config, true, "validated");
  }

  categorize(input: KnowledgeSharingBusInput, config: KnowledgeSharingBusConfiguration) {
    return this.runKnowledge("categorize", input, config, true, "validated");
  }

  version(input: KnowledgeSharingBusInput, config: KnowledgeSharingBusConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.versioningRulesEnabled) {
      return this.disabledReport("version", config, started, "Versioning rules are disabled");
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, true);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("version", [], [], false, null, validation, started);
    }

    const existing = input.knowledgeId?.trim()
      ? this.store.get(input.knowledgeId.trim())
      : this.getLatestRecord();
    if (!existing) {
      return this.runKnowledge("version", input, config, true, "validated");
    }

    const nextVersion = this.classifier.nextVersion(existing.version);
    const bundle = this.classifier.classify(
      {
        ...input,
        knowledgeCategory: input.knowledgeCategory ?? existing.knowledgeCategory,
        knowledgeTitle: input.knowledgeTitle ?? existing.knowledgeTitle,
        knowledgeSummary: input.knowledgeSummary ?? existing.knowledgeSummary,
        supportingEvidence: input.supportingEvidence ?? existing.supportingEvidence,
        relatedPlaybooks: input.relatedPlaybooks ?? existing.relatedPlaybooks,
        confidenceScore: input.confidenceScore ?? existing.confidenceScore,
        sourceWorker: input.sourceWorker ?? existing.sourceWorker,
        businessId: input.businessId ?? existing.businessId,
        missionId: input.missionId ?? existing.missionId,
        version: nextVersion,
      },
      config,
    );
    const record = this.store.buildRecord({
      input: { ...input, knowledgeId: existing.knowledgeId },
      category: bundle.category,
      title: bundle.title,
      summary: bundle.summary,
      confidenceScore: bundle.confidenceScore,
      version: nextVersion,
      publicationStatus:
        existing.publicationStatus === "archived" ? "validated" : existing.publicationStatus,
      classificationLabels: bundle.classificationLabels,
      evidence: bundle.evidence.length ? bundle.evidence : existing.supportingEvidence,
      playbooks: bundle.playbooks.length ? bundle.playbooks : existing.relatedPlaybooks,
      validationStatus: "passed",
      versionHistory: [...existing.versionHistory, nextVersion],
      subscribers: existing.subscribers,
      usageCount: existing.usageCount,
      knowledgeId: existing.knowledgeId,
    });

    return this.finishKnowledge("version", input, config, started, record, false, null);
  }

  publish(input: KnowledgeSharingBusInput, config: KnowledgeSharingBusConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.publicationRulesEnabled) {
      return this.disabledReport("publish", config, started, "Publication rules are disabled");
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, true);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("publish", [], [], false, null, validation, started);
    }

    const existing = input.knowledgeId?.trim()
      ? this.store.get(input.knowledgeId.trim())
      : null;
    const submitFirst = existing
      ? null
      : this.runKnowledge("submit", input, config, true, "validated");
    if (submitFirst && submitFirst.validation.decision === "fail") return submitFirst;

    const target = existing ?? this.getLatestRecord();
    if (!target) {
      const validation = this.validator.finalize(
        "fail",
        ["No knowledge record available to publish"],
        [],
        started,
      );
      return this.report("publish", [], [], false, null, validation, started);
    }

    if (target.confidenceScore < config.minConfidenceToPublish) {
      const validation = this.validator.finalize(
        "fail",
        [
          `Confidence ${target.confidenceScore} below publish threshold ${config.minConfidenceToPublish}`,
        ],
        [],
        started,
      );
      this.recovery.recordFailure();
      return this.report("publish", [target], target.classificationLabels, false, null, validation, started);
    }

    const subscribers = this.store
      .getSubscriptions()
      .filter(
        (s) =>
          s.categories.length === 0 ||
          s.categories.includes(target.knowledgeCategory) ||
          s.categories.includes("*"),
      )
      .map((s) => s.workerId);

    const record = this.store.buildRecord({
      input: {
        ...input,
        knowledgeId: target.knowledgeId,
        sourceWorker: target.sourceWorker,
        businessId: target.businessId,
        missionId: target.missionId,
        knowledgeCategory: target.knowledgeCategory,
        knowledgeTitle: target.knowledgeTitle,
        knowledgeSummary: target.knowledgeSummary,
        supportingEvidence: target.supportingEvidence,
        relatedPlaybooks: target.relatedPlaybooks,
        confidenceScore: target.confidenceScore,
        version: target.version,
      },
      category: target.knowledgeCategory,
      title: target.knowledgeTitle,
      summary: target.knowledgeSummary,
      confidenceScore: target.confidenceScore,
      version: target.version,
      publicationStatus: "published",
      classificationLabels: target.classificationLabels,
      evidence: target.supportingEvidence,
      playbooks: target.relatedPlaybooks,
      validationStatus: "passed",
      versionHistory: target.versionHistory,
      subscribers: unique([...target.subscribers, ...subscribers]),
      usageCount: target.usageCount,
      knowledgeId: target.knowledgeId,
    });

    return this.finishKnowledge("publish", input, config, started, record, true, null);
  }

  subscribe(input: KnowledgeSharingBusInput, config: KnowledgeSharingBusConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.subscriptionRulesEnabled) {
      return this.disabledReport("subscribe", config, started, "Subscription rules are disabled");
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, false);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("subscribe", [], [], false, null, validation, started);
    }

    const workerId = input.subscriberWorkerId?.trim() || input.sourceWorker?.trim();
    if (!workerId) {
      const validation = this.validator.finalize(
        "fail",
        ["subscriberWorkerId is required for subscription"],
        [],
        started,
      );
      return this.report("subscribe", [], [], false, null, validation, started);
    }

    const categories =
      input.subscriptionCategories?.length
        ? input.subscriptionCategories
        : input.knowledgeCategory
          ? [input.knowledgeCategory.toString()]
          : ["*"];
    this.store.subscribe(workerId, categories);

    const published = this.store.listPublished(
      categories.includes("*") ? null : categories[0] ?? null,
    );
    const validation = this.validator.finalize(
      "pass",
      [],
      published.length ? [] : ["Subscription registered; catalog empty or unmatched"],
      started,
    );
    this.recovery.reset();
    this.ensureRecord("active", config, "passed");
    appendKsbLog({
      event: "subscribe",
      details: `worker=${workerId} categories=${categories.join(",")}`,
    });
    this.metadata.generate(this.store.count(), this.store.publishedCount());
    return this.report(
      "subscribe",
      published,
      categories.map((c) => `subscription:${c}`),
      false,
      workerId,
      validation,
      started,
    );
  }

  retrieve(input: KnowledgeSharingBusInput, config: KnowledgeSharingBusConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled) {
      return this.disabledReport("retrieve", config, started, "Knowledge Sharing Bus is disabled");
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, false);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("retrieve", [], [], false, null, validation, started);
    }

    const workerId =
      input.retrievingWorkerId?.trim() ||
      input.subscriberWorkerId?.trim() ||
      input.sourceWorker?.trim() ||
      "worker-reader";
    const category = input.knowledgeCategory?.toString().trim() || null;
    let records = input.knowledgeId?.trim()
      ? ([this.store.get(input.knowledgeId.trim())].filter(Boolean) as KnowledgeRecord[])
      : this.store.listPublished(category);

    if (!records.length) {
      records = this.store.listPublished(null);
    }

    for (const record of records) {
      this.store.trackUsage(workerId, record.knowledgeId);
    }
    const refreshed = records
      .map((r) => this.store.get(r.knowledgeId))
      .filter((r): r is KnowledgeRecord => !!r);

    const validation = this.validator.validateRecords(
      refreshed.length ? refreshed : null,
      { ...input, validated: input.validated ?? true },
      started,
      false,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendKsbLog({
      event: "retrieve",
      details: `worker=${workerId} count=${refreshed.length}`,
    });
    return this.report(
      "retrieve",
      refreshed,
      refreshed[0]?.classificationLabels ?? [],
      refreshed.some((r) => r.publicationStatus === "published"),
      workerId,
      validation,
      started,
    );
  }

  trackUsage(input: KnowledgeSharingBusInput, config: KnowledgeSharingBusConfiguration) {
    const report = this.retrieve(input, config);
    return { ...report, action: "track_usage" as const };
  }

  archive(input: KnowledgeSharingBusInput, config: KnowledgeSharingBusConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.archivalRulesEnabled) {
      return this.disabledReport("archive", config, started, "Archival rules are disabled");
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, false);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("archive", [], [], false, null, validation, started);
    }

    const existing = input.knowledgeId?.trim()
      ? this.store.get(input.knowledgeId.trim())
      : this.getLatestRecord();
    if (!existing) {
      const validation = this.validator.finalize(
        "fail",
        ["No knowledge record available to archive"],
        [],
        started,
      );
      return this.report("archive", [], [], false, null, validation, started);
    }

    const reason = input.archiveReason?.trim() || "obsolete";
    const record = this.store.buildRecord({
      input: {
        ...input,
        knowledgeId: existing.knowledgeId,
        sourceWorker: existing.sourceWorker,
        businessId: existing.businessId,
        missionId: existing.missionId,
        knowledgeCategory: existing.knowledgeCategory,
        knowledgeTitle: existing.knowledgeTitle,
        knowledgeSummary: `${existing.knowledgeSummary} [archived:${reason}]`,
        supportingEvidence: [...existing.supportingEvidence, `archive_reason:${reason}`],
        relatedPlaybooks: existing.relatedPlaybooks,
        confidenceScore: existing.confidenceScore,
        version: existing.version,
      },
      category: existing.knowledgeCategory,
      title: existing.knowledgeTitle,
      summary: `${existing.knowledgeSummary} [archived:${reason}]`,
      confidenceScore: existing.confidenceScore,
      version: existing.version,
      publicationStatus: "archived",
      classificationLabels: [...existing.classificationLabels, "archived"],
      evidence: [...existing.supportingEvidence, `archive_reason:${reason}`],
      playbooks: existing.relatedPlaybooks,
      validationStatus: "passed",
      versionHistory: existing.versionHistory,
      subscribers: existing.subscribers,
      usageCount: existing.usageCount,
      knowledgeId: existing.knowledgeId,
    });

    return this.finishKnowledge("archive", input, config, started, record, false, null);
  }

  list(config: KnowledgeSharingBusConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0
        ? this.validator.finalize("pass", [], ["Knowledge catalog is empty"], started)
        : this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      records,
      latest?.classificationLabels ?? [],
      latest?.publicationStatus === "published",
      null,
      validation,
      started,
    );
  }

  validate(input: KnowledgeSharingBusInput, config: KnowledgeSharingBusConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0
        ? this.validator.validateRecords(null, { ...input, validated: input.validated ?? true }, started)
        : this.validator.validateRecords(
            records,
            { ...input, validated: input.validated ?? true },
            started,
          );
    // Empty catalog validate should pass if no boundary violation
    const finalValidation =
      records.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.finalize("pass", [], ["No knowledge records yet"], started)
        : validation;
    if (finalValidation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, finalValidation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      records,
      latest?.classificationLabels ?? [],
      latest?.publicationStatus === "published",
      null,
      finalValidation,
      started,
    );
  }

  diagnostics(config: KnowledgeSharingBusConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Knowledge Sharing Bus is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendKsbLog({
      event: "diagnostics",
      details: `records=${this.store.count()} published=${this.store.publishedCount()} subscriptions=${this.store.subscriptionCount()}`,
    });
    const latest = this.getLatestRecord();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.classificationLabels ?? [],
      latest?.publicationStatus === "published",
      null,
      validation,
      started,
    );
  }

  private runKnowledge(
    action: KnowledgeSharingBusRunReport["action"],
    input: KnowledgeSharingBusInput,
    config: KnowledgeSharingBusConfiguration,
    requireContent: boolean,
    status: "draft" | "validated" | "published",
  ): KnowledgeSharingBusRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.submissionRulesEnabled) {
      return this.disabledReport(
        action,
        config,
        started,
        !config.enabled
          ? "Knowledge Sharing Bus is disabled"
          : "Submission rules are disabled",
      );
    }
    if (!config.classificationRulesEnabled && (action === "classify" || action === "categorize")) {
      return this.disabledReport(action, config, started, "Classification rules are disabled");
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, requireContent);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], [], false, null, validation, started);
    }

    const bundle = this.classifier.classify(input, config);
    const record = this.store.buildRecord({
      input,
      category: bundle.category,
      title: bundle.title,
      summary: bundle.summary,
      confidenceScore: bundle.confidenceScore,
      version: bundle.version,
      publicationStatus: status,
      classificationLabels: bundle.classificationLabels,
      evidence: bundle.evidence,
      playbooks: bundle.playbooks,
      validationStatus: "passed",
    });

    return this.finishKnowledge(
      action,
      input,
      config,
      started,
      record,
      status === "published",
      null,
      requireContent,
    );
  }

  private finishKnowledge(
    action: KnowledgeSharingBusRunReport["action"],
    input: KnowledgeSharingBusInput,
    config: KnowledgeSharingBusConfiguration,
    started: number,
    record: KnowledgeRecord,
    published: boolean,
    retrievedBy: string | null,
    requireContent = true,
  ): KnowledgeSharingBusRunReport {
    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
      requireContent,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      record.knowledgeCategory,
    );
    appendKsbLog({
      event: action,
      details: `id=${record.knowledgeId} category=${record.knowledgeCategory} version=${record.version} status=${record.publicationStatus}`,
    });
    this.metadata.generate(this.store.count(), this.store.publishedCount());
    return this.report(
      action,
      [record],
      record.classificationLabels,
      published,
      retrievedBy,
      validation,
      started,
    );
  }

  private disabledReport(
    action: KnowledgeSharingBusRunReport["action"],
    config: KnowledgeSharingBusConfiguration,
    started: number,
    message: string,
  ) {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], [], false, null, validation, started);
  }

  private hasBoundary(input: KnowledgeSharingBusInput) {
    return (
      input.executeWorkerTasks === true ||
      input.replaceExecutionMemory === true ||
      input.replaceDecisionMemory === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: KnowledgeSharingBusConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastCategory: string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `ksb-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: KNOWLEDGE_SHARING_BUS_ID,
      engineVersion: "PILLOW-KSB-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...KSB_CAPABILITIES],
      totalKnowledgeRecords: this.store.count(),
      publishedCount: this.store.publishedCount(),
      archivedCount: this.store.archivedCount(),
      subscriptionCount: this.store.subscriptionCount(),
      lastCategory: lastCategory ?? this.getLatestRecord()?.knowledgeCategory ?? null,
      metadataVersion: KSB_METADATA_VERSION,
    };
  }

  private report(
    action: KnowledgeSharingBusRunReport["action"],
    records: KnowledgeRecord[],
    classificationLabels: string[],
    published: boolean,
    retrievedBy: string | null,
    validation: KnowledgeSharingBusRunReport["validation"],
    started: number,
  ): KnowledgeSharingBusRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      knowledgeRunReportId: `ksb-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      records,
      classificationLabels: [...classificationLabels],
      published,
      retrievedBy,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: KSB_METADATA_VERSION,
    };
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}
