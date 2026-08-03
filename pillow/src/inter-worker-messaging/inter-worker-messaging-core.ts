import type { InterWorkerMessagingConfiguration } from "./configuration.js";
import { appendIwmLog } from "./iwm-logging.js";
import { MessageRouter } from "./message-router.js";
import { MessageStore } from "./message-store.js";
import {
  HealthMonitor,
  InterWorkerMessagingMetadataGenerator,
  MessageValidator,
  RecoveryManager,
} from "./message-validator.js";
import {
  INTER_WORKER_MESSAGING_ID,
  IWM_CAPABILITIES,
  IWM_METADATA_VERSION,
} from "./paths.js";
import type {
  DeliveryStatus,
  InterWorkerMessagingEngineRecord,
  InterWorkerMessagingInput,
  InterWorkerMessagingRunReport,
  MessageRecord,
  OperationalState,
} from "./types.js";

export class InterWorkerMessagingCore {
  private engineRecord: InterWorkerMessagingEngineRecord | null = null;
  private seeded = false;
  private readonly store = new MessageStore();
  private readonly router = new MessageRouter();
  private readonly validator = new MessageValidator();
  private readonly metadata = new InterWorkerMessagingMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: InterWorkerMessagingConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedMessages);
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

  connect(
    _input: Record<string, unknown>,
    config: InterWorkerMessagingConfiguration,
  ): InterWorkerMessagingRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendIwmLog({
      event: "connect",
      details: "Inter-Worker Messaging connected; transport-only mode",
    });
    return this.report(
      "connect",
      [],
      false,
      null,
      null,
      {
        validationReportId: `iwm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Inter-Worker Messaging is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: IWM_METADATA_VERSION,
      },
      started,
    );
  }

  send(input: InterWorkerMessagingInput, config: InterWorkerMessagingConfiguration) {
    return this.transport("send", input, config, { requireParticipants: true });
  }

  route(input: InterWorkerMessagingInput, config: InterWorkerMessagingConfiguration) {
    return this.transport("route", input, config, { requireParticipants: true });
  }

  broadcast(input: InterWorkerMessagingInput, config: InterWorkerMessagingConfiguration) {
    if (!config.broadcastRulesEnabled) {
      const started = Date.now();
      return this.disabledReport("broadcast", config, started, "Broadcast rules are disabled");
    }
    return this.transport(
      "broadcast",
      { ...input, broadcast: true, messageType: input.messageType ?? "broadcast" },
      config,
      { requireParticipants: false, broadcast: true },
    );
  }

  reply(input: InterWorkerMessagingInput, config: InterWorkerMessagingConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.routingRulesEnabled) {
      return this.disabledReport(
        "reply",
        config,
        started,
        !config.enabled ? "Inter-Worker Messaging is disabled" : "Routing rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, true);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("reply", [], false, null, null, validation, started);
    }

    const parent = input.inReplyTo?.trim()
      ? this.store.get(input.inReplyTo.trim())
      : this.getLatestRecord();
    if (!parent) {
      const validation = this.validator.finalize(
        "fail",
        ["No parent message available for reply"],
        [],
        started,
      );
      return this.report("reply", [], false, null, null, validation, started);
    }

    const replyInput: InterWorkerMessagingInput = {
      ...input,
      senderWorker: input.senderWorker?.trim() || parent.receiverWorker,
      receiverWorker: input.receiverWorker?.trim() || parent.senderWorker,
      businessId: input.businessId?.trim() || parent.businessId,
      missionId: input.missionId?.trim() || parent.missionId,
      conversationId: input.conversationId?.trim() || parent.conversationId,
      messageType:
        input.messageType?.toString().trim() ||
        this.router.responseTypeFor(parent.messageType.toString()),
      inReplyTo: parent.messageId,
      priority: input.priority ?? parent.priority,
      messageSummary:
        input.messageSummary?.trim() ||
        `Reply to ${parent.messageId}: ${parent.messageSummary}`,
      validated: input.validated ?? true,
    };

    return this.transport("reply", replyInput, config, {
      requireParticipants: true,
      reply: true,
    });
  }

  receive(input: InterWorkerMessagingInput, config: InterWorkerMessagingConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled) {
      return this.disabledReport("receive", config, started, "Inter-Worker Messaging is disabled");
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, false);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("receive", [], false, null, null, validation, started);
    }

    const workerId = input.receiverWorker?.trim() || input.senderWorker?.trim();
    if (!workerId) {
      const validation = this.validator.finalize(
        "fail",
        ["receiverWorker is required to receive messages"],
        [],
        started,
      );
      return this.report("receive", [], false, null, null, validation, started);
    }

    let records = this.store.receiveFor(workerId);
    if (config.deliveryTrackingEnabled) {
      records = records.map((r) => {
        if (r.deliveryStatus === "queued" || r.deliveryStatus === "sent") {
          return this.store.updateDelivery(r.messageId, "delivered") ?? r;
        }
        return r;
      });
    }

    const validation =
      records.length === 0
        ? this.validator.finalize("pass", [], ["Inbox empty for worker"], started)
        : this.validator.validateRecords(
            records,
            { ...input, validated: input.validated ?? true },
            started,
            false,
          );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendIwmLog({
      event: "receive",
      details: `worker=${workerId} count=${records.length}`,
    });
    return this.report(
      "receive",
      records,
      true,
      records[0]?.deliveryStatus ?? null,
      records[0]?.conversationId ?? null,
      validation,
      started,
    );
  }

  trackDelivery(input: InterWorkerMessagingInput, config: InterWorkerMessagingConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.deliveryTrackingEnabled) {
      return this.disabledReport(
        "track_delivery",
        config,
        started,
        !config.enabled
          ? "Inter-Worker Messaging is disabled"
          : "Delivery tracking is disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, false);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("track_delivery", [], false, null, null, validation, started);
    }

    const existing = input.messageId?.trim()
      ? this.store.get(input.messageId.trim())
      : this.getLatestRecord();
    if (!existing) {
      const validation = this.validator.finalize(
        "fail",
        ["No message available for delivery tracking"],
        [],
        started,
      );
      return this.report("track_delivery", [], false, null, null, validation, started);
    }

    const next = this.router.advanceDelivery(
      existing.deliveryStatus,
      normalizeDelivery(input.deliveryStatus),
    );
    const record = this.store.updateDelivery(existing.messageId, next)!;
    return this.finish("track_delivery", input, config, started, record, true);
  }

  searchHistory(input: InterWorkerMessagingInput, config: InterWorkerMessagingConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.historyRulesEnabled) {
      return this.disabledReport(
        "search_history",
        config,
        started,
        !config.enabled
          ? "Inter-Worker Messaging is disabled"
          : "History rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(null, input, started, false);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("search_history", [], false, null, null, validation, started);
    }

    const records = this.store.search({
      query: input.searchQuery,
      missionId: input.searchMissionId ?? input.missionId,
      businessId: input.searchBusinessId ?? input.businessId,
      conversationId: input.searchConversationId ?? input.conversationId,
    });
    const validation =
      records.length === 0
        ? this.validator.finalize("pass", [], ["No messages matched search criteria"], started)
        : this.validator.validateRecords(
            records,
            { ...input, validated: input.validated ?? true },
            started,
            false,
          );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendIwmLog({
      event: "search_history",
      details: `matches=${records.length} query=${input.searchQuery ?? ""}`,
    });
    return this.report(
      "search_history",
      records,
      false,
      records[0]?.deliveryStatus ?? null,
      records[0]?.conversationId ?? null,
      validation,
      started,
    );
  }

  list(config: InterWorkerMessagingConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0
        ? this.validator.finalize("pass", [], ["Message history is empty"], started)
        : this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      records,
      false,
      latest?.deliveryStatus ?? null,
      latest?.conversationId ?? null,
      validation,
      started,
    );
  }

  validate(input: InterWorkerMessagingInput, config: InterWorkerMessagingConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.finalize("pass", [], ["No message records yet"], started)
        : this.validator.validateRecords(
            records.length ? records : null,
            { ...input, validated: input.validated ?? true },
            started,
          );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      records,
      false,
      latest?.deliveryStatus ?? null,
      latest?.conversationId ?? null,
      validation,
      started,
    );
  }

  diagnostics(config: InterWorkerMessagingConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Inter-Worker Messaging is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendIwmLog({
      event: "diagnostics",
      details: `records=${this.store.count()} delivered=${this.store.deliveredCount()} conversations=${this.store.conversationCount()}`,
    });
    const latest = this.getLatestRecord();
    return this.report(
      "diagnostics",
      this.store.list(),
      false,
      latest?.deliveryStatus ?? null,
      latest?.conversationId ?? null,
      validation,
      started,
    );
  }

  private transport(
    action: InterWorkerMessagingRunReport["action"],
    input: InterWorkerMessagingInput,
    config: InterWorkerMessagingConfiguration,
    options: { requireParticipants: boolean; broadcast?: boolean; reply?: boolean },
  ): InterWorkerMessagingRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (!config.enabled || !config.routingRulesEnabled) {
      return this.disabledReport(
        action,
        config,
        started,
        !config.enabled
          ? "Inter-Worker Messaging is disabled"
          : "Routing rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      const validation = this.validator.validateRecords(
        null,
        input,
        started,
        options.requireParticipants,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, [], false, null, null, validation, started);
    }

    const bundle = this.router.route(input, config, {
      broadcast: options.broadcast,
      reply: options.reply,
    });

    let deliveryStatus: DeliveryStatus = "queued";
    if (config.deliveryTrackingEnabled) {
      deliveryStatus = "sent";
    }

    const record = this.store.buildRecord({
      input,
      senderWorker: bundle.senderWorker,
      receiverWorker: bundle.receiverWorker,
      businessId: bundle.businessId,
      missionId: bundle.missionId,
      conversationId: bundle.conversationId,
      messageType: bundle.messageType,
      priority: bundle.priority,
      messageSummary: bundle.messageSummary,
      payloadReference: bundle.payloadReference,
      deliveryStatus,
      inReplyTo: bundle.inReplyTo,
      isBroadcast: bundle.isBroadcast,
      validationStatus: "passed",
      deliveryHistory: deliveryStatus === "sent" ? ["queued", "sent"] : ["queued"],
    });

    // Auto-deliver on send/route for directed messages when tracking enabled
    let finalRecord = record;
    if (config.deliveryTrackingEnabled && !bundle.isBroadcast) {
      finalRecord = this.store.updateDelivery(record.messageId, "delivered") ?? record;
    }

    return this.finish(action, input, config, started, finalRecord, true, options.requireParticipants);
  }

  private finish(
    action: InterWorkerMessagingRunReport["action"],
    input: InterWorkerMessagingInput,
    config: InterWorkerMessagingConfiguration,
    started: number,
    record: MessageRecord,
    routed: boolean,
    requireParticipants = false,
  ): InterWorkerMessagingRunReport {
    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
      requireParticipants,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      record.messageType,
    );
    appendIwmLog({
      event: action,
      details: `id=${record.messageId} from=${record.senderWorker} to=${record.receiverWorker} status=${record.deliveryStatus}`,
    });
    this.metadata.generate(this.store.count(), this.store.conversationCount());
    return this.report(
      action,
      [record],
      routed,
      record.deliveryStatus,
      record.conversationId,
      validation,
      started,
    );
  }

  private disabledReport(
    action: InterWorkerMessagingRunReport["action"],
    config: InterWorkerMessagingConfiguration,
    started: number,
    message: string,
  ) {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], false, null, null, validation, started);
  }

  private hasBoundary(input: InterWorkerMessagingInput) {
    return (
      input.executeWorkerLogic === true ||
      input.modifyWorkerDecisions === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: InterWorkerMessagingConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastMessageType: string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `iwm-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: INTER_WORKER_MESSAGING_ID,
      engineVersion: "PILLOW-IWM-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...IWM_CAPABILITIES],
      totalMessageRecords: this.store.count(),
      deliveredCount: this.store.deliveredCount(),
      failedCount: this.store.failedCount(),
      conversationCount: this.store.conversationCount(),
      lastMessageType: lastMessageType ?? this.getLatestRecord()?.messageType ?? null,
      metadataVersion: IWM_METADATA_VERSION,
    };
  }

  private report(
    action: InterWorkerMessagingRunReport["action"],
    records: MessageRecord[],
    routed: boolean,
    deliveryStatus: DeliveryStatus | null,
    conversationId: string | null,
    validation: InterWorkerMessagingRunReport["validation"],
    started: number,
  ): InterWorkerMessagingRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      messagingRunReportId: `iwm-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      records,
      routed,
      deliveryStatus,
      conversationId,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: IWM_METADATA_VERSION,
    };
  }
}

function normalizeDelivery(value: string | null | undefined): DeliveryStatus | null {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  const allowed: DeliveryStatus[] = [
    "queued",
    "sent",
    "delivered",
    "read",
    "acknowledged",
    "failed",
    "expired",
  ];
  return allowed.includes(normalized as DeliveryStatus)
    ? (normalized as DeliveryStatus)
    : null;
}
