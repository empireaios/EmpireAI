import type { CommunicationRuntimeConfiguration } from "./configuration.js";
import {
  ComrtIntegrationCoordinator,
  type CommunicationRuntimeDependencies,
} from "./integrations.js";
import { appendComrtLog } from "./comrt-logging.js";
import { CommunicationStore, nextComrtId } from "./communication-store.js";
import { CommunicationValidator } from "./communication-validator.js";
import { ChannelManager } from "./channel-manager.js";
import { MessageRouter } from "./message-router.js";
import { SyncEngine } from "./sync-engine.js";
import { AsyncEngine } from "./async-engine.js";
import { AcknowledgementHandler } from "./acknowledgement-handler.js";
import { RetryEngine } from "./retry-engine.js";
import { ContextPropagator } from "./context-propagator.js";
import { CollaborationSessionManager } from "./collaboration-session-manager.js";
import { MetricsCollector } from "./metrics-collector.js";
import { HealthMonitor } from "./health-monitor.js";
import { ReportBuilder } from "./report-builder.js";
import {
  COMRT_CAPABILITIES,
  COMRT_METADATA_VERSION,
  COMRT_MISSION_ID,
  COMMUNICATION_RUNTIME_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  CollaborationSession,
  CommunicationChannel,
  CommunicationMessage,
  ComrtEngineRecord,
  ComrtInput,
  ComrtRunReport,
  ComrtValidationReport,
  DeliveryRecord,
  IntegrationHandshake,
  Priority,
  Q1009ConsumableContract,
} from "./types.js";

const SEED_CHANNELS: Array<{
  channelId: string;
  channelType: CommunicationChannel["channelType"];
  participants: string[];
  status: CommunicationChannel["status"];
}> = [
  {
    channelId: "chan-wkr-alpha-beta",
    channelType: "worker_to_worker",
    participants: ["wkr-alpha", "wkr-beta"],
    status: "active",
  },
  {
    channelId: "chan-wkr-gamma-delta",
    channelType: "worker_to_worker",
    participants: ["wkr-gamma", "wkr-delta"],
    status: "active",
  },
  {
    channelId: "chan-factory-pillow-capital",
    channelType: "factory_to_factory",
    participants: ["factory-pillow", "factory-capital"],
    status: "active",
  },
  {
    channelId: "chan-factory-commerce-runtime",
    channelType: "factory_to_factory",
    participants: ["factory-commerce", "factory-runtime"],
    status: "active",
  },
  {
    channelId: "chan-runtime-service-01",
    channelType: "runtime_service",
    participants: ["runtime-comrt", "runtime-orchestration"],
    status: "active",
  },
];

export class CommunicationRuntimeManager {
  private engineRecord: ComrtEngineRecord | null = null;
  private seeded = false;
  private readonly store = new CommunicationStore();
  private readonly validator = new CommunicationValidator();
  private readonly channelManager = new ChannelManager();
  private readonly messageRouter = new MessageRouter();
  private readonly syncEngine = new SyncEngine();
  private readonly asyncEngine = new AsyncEngine();
  private readonly acknowledgementHandler = new AcknowledgementHandler();
  private readonly retryEngine = new RetryEngine();
  private readonly contextPropagator = new ContextPropagator();
  private readonly collaborationSessionManager = new CollaborationSessionManager();
  private readonly metricsCollector = new MetricsCollector();
  private readonly healthMonitor = new HealthMonitor();
  private readonly reportBuilder = new ReportBuilder();
  private readonly integrations = new ComrtIntegrationCoordinator();

  bindIntegrations(deps: CommunicationRuntimeDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  ensureSeeded(config: CommunicationRuntimeConfiguration) {
    if (this.seeded) return;
    this.seeded = true;
    for (const seed of SEED_CHANNELS) {
      this.store.saveChannel({
        channelId: seed.channelId,
        channelType: seed.channelType,
        participants: [...seed.participants],
        status: seed.status,
        createdAt: new Date().toISOString(),
        metadataVersion: COMRT_METADATA_VERSION,
        structuralSignalOnly: true,
        fabricated: false,
      });
    }
    this.store.saveSession({
      sessionId: "sess-collab-template-01",
      participants: ["wkr-alpha", "wkr-beta"],
      missionId: COMRT_MISSION_ID,
      status: "idle",
      startedAt: new Date().toISOString(),
      endedAt: null,
      messageCount: 0,
      contextReference: "ctx://structural/session/sess-collab-template-01",
      auditReference: "audit://comrt/session/sess-collab-template-01",
      structuralSignalOnly: true,
      fabricated: false,
    });
    this.ensureRecord("active", config);
    appendComrtLog({
      event: "seed_channels",
      details: `Seeded ${SEED_CHANNELS.length} channels + 1 idle collaboration session template`,
    });
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

  getQ1009ConsumableContract(config: CommunicationRuntimeConfiguration): Q1009ConsumableContract {
    return this.reportBuilder.buildQ1009ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: CommunicationRuntimeConfiguration): ComrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    appendComrtLog({
      event: "connect",
      details: `Communication Runtime connected; integrations=${handshakes.filter((h) => h.available).length}`,
    });
    return this.reportAction(
      "connect",
      started,
      { validated: true },
      config,
      null,
      [],
      null,
      this.store.listChannels(),
      null,
      [],
      null,
      [],
      handshakes,
    );
  }

  openChannel(input: ComrtInput, config: CommunicationRuntimeConfiguration): ComrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateOpenChannel(input, started);
    if (validation.decision === "fail") {
      return this.failReport("open_channel", started, validation, config);
    }
    const channel = this.channelManager.openChannel(this.store, input);
    this.ensureRecord("active", config);
    appendComrtLog({ event: "open_channel", details: channel.channelId });
    return this.reportAction(
      "open_channel",
      started,
      input,
      config,
      null,
      [],
      channel,
      [channel],
      null,
      [],
      null,
      [],
    );
  }

  sendMessage(input: ComrtInput, config: CommunicationRuntimeConfiguration): ComrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);

    // 1. validate
    const validation = this.validator.validateSend(input, started);
    if (validation.decision === "fail") {
      return this.failReport("send_message", started, validation, config);
    }

    // 3. permission/governance — highRisk requires Grand King
    if (input.highRisk === true && input.grandKingApproved !== true) {
      return this.failReport(
        "send_message",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "High-risk messaging requires grandKingApproved=true"],
        },
        config,
      );
    }
    if (config.requirePillowCommandConfirmation && input.pillowConfirmed !== true) {
      return this.failReport(
        "send_message",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "Pillow confirmation required for sendMessage"],
        },
        config,
      );
    }

    // 2. resolve/create channel
    const channel = this.channelManager.resolveOrCreate(this.store, input);

    // 9. propagate contextReference
    const contextReference = this.contextPropagator.resolveContextReference(
      input,
      `${input.sender}-${input.receiver}`,
    );

    const priority: Priority = input.priority ?? "normal";
    const syncMode = input.syncMode ?? "async";
    const maxRetries = input.maxRetries ?? config.defaultMaxRetries;
    const messageId = input.messageId ?? nextComrtId("comrt-msg");
    const correlationId = input.correlationId ?? (syncMode === "sync" ? messageId : null);

    const message: CommunicationMessage = {
      messageId,
      sender: input.sender!,
      receiver: input.receiver!,
      messageType: input.messageType!,
      correlationId,
      sessionId: input.sessionId ?? null,
      missionId: input.missionId ?? COMRT_MISSION_ID,
      priority,
      deliveryStatus: "pending",
      retryCount: 0,
      maxRetries,
      timestamp: new Date().toISOString(),
      contextReference,
      auditReference: input.auditReference ?? `audit://comrt/message/${messageId}`,
      channelType: channel.channelType,
      syncMode,
      acknowledgedAt: null,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: COMRT_METADATA_VERSION,
    };

    // 10. NEVER fabricate — payload is contextReference only
    this.store.saveMessage(message);

    // 4. route deterministically
    this.messageRouter.route(message, channel.channelId);

    let primary: CommunicationMessage = message;
    let messages: CommunicationMessage[] = [message];
    let deliveries: DeliveryRecord[] = [];
    let decision: ComrtRunReport["decision"] = "pass";
    const errors: string[] = [];

    // 7. simulateFailure → mark failed, eligible for retry
    const simulateFailure = input.simulateFailure === true;

    // 5. sync → sync-engine request-response
    if (syncMode === "sync" && !simulateFailure) {
      const syncResult = this.syncEngine.deliver(this.store, message, channel.channelId, input);
      primary = syncResult.request;
      messages = [syncResult.request, syncResult.response];
      deliveries = syncResult.deliveries;
    } else {
      // 6. async → async-engine deliver
      const asyncResult = this.asyncEngine.deliver(
        this.store,
        message,
        channel.channelId,
        simulateFailure,
      );
      primary = asyncResult.message;
      messages = [asyncResult.message];
      deliveries = asyncResult.deliveries;
      if (asyncResult.failed) {
        decision = "fail";
        errors.push("Message delivery failed — eligible for retry");
      }
    }

    if (input.sessionId) {
      this.collaborationSessionManager.incrementMessageCount(this.store, input.sessionId);
    }

    this.ensureRecord("active", config);
    appendComrtLog({
      event: "send_message",
      details: `${primary.messageId}:${primary.deliveryStatus}:${syncMode}`,
    });

    return {
      action: "send_message",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision,
      validation,
      message: primary,
      messages,
      channel,
      channels: [channel],
      session: input.sessionId ? this.store.getSession(input.sessionId) : null,
      sessions: [],
      delivery: deliveries.at(-1) ?? null,
      deliveries,
      communicationRuntimeReport: null,
      q1009Contract: null,
      errors,
      warnings: [],
    };
  }

  acknowledgeMessage(input: ComrtInput, config: CommunicationRuntimeConfiguration): ComrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("acknowledge_message", started, validation, config);
    }
    if (!input.messageId) {
      return this.failReport(
        "acknowledge_message",
        started,
        { ...validation, decision: "fail", errors: [...validation.errors, "messageId required"] },
        config,
      );
    }

    const existing = this.store.getMessage(input.messageId);
    if (!existing) {
      return this.failReport(
        "acknowledge_message",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, `Unknown messageId ${input.messageId}`],
        },
        config,
      );
    }

    const channel =
      (input.channelId ? this.store.getChannel(input.channelId) : null) ??
      this.store.listChannels().find((c) => c.participants.includes(existing.receiver)) ??
      this.store.listChannels()[0]!;

    // 8. ack → acknowledgement-handler, never remove from history
    const result = this.acknowledgementHandler.acknowledge(
      this.store,
      input.messageId,
      channel.channelId,
    )!;

    appendComrtLog({
      event: "acknowledge_message",
      details: `${result.message.messageId}:acknowledged:history_preserved`,
    });

    return this.reportAction(
      "acknowledge_message",
      started,
      input,
      config,
      result.message,
      [result.message],
      channel,
      [channel],
      null,
      [],
      result.delivery,
      [result.delivery],
    );
  }

  openCollaborationSession(
    input: ComrtInput,
    config: CommunicationRuntimeConfiguration,
  ): ComrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("open_collaboration_session", started, validation, config);
    }
    if (!input.participants?.length) {
      return this.failReport(
        "open_collaboration_session",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "participants required for openCollaborationSession"],
        },
        config,
      );
    }
    const session = this.collaborationSessionManager.openSession(this.store, input);
    this.channelManager.openChannel(this.store, {
      channelType: "collaboration_session",
      participants: session.participants,
      channelId: `chan-collab-${session.sessionId}`,
      validated: true,
    });
    this.ensureRecord("collaborating", config);
    appendComrtLog({ event: "open_collaboration_session", details: session.sessionId });
    return this.reportAction(
      "open_collaboration_session",
      started,
      input,
      config,
      null,
      [],
      null,
      [],
      session,
      [session],
      null,
      [],
    );
  }

  closeCollaborationSession(
    input: ComrtInput,
    config: CommunicationRuntimeConfiguration,
  ): ComrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail" || !input.sessionId) {
      return this.failReport(
        "close_collaboration_session",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [
            ...validation.errors,
            ...(input.sessionId ? [] : ["sessionId required for closeCollaborationSession"]),
          ],
        },
        config,
      );
    }
    const session = this.collaborationSessionManager.closeSession(this.store, input.sessionId);
    if (!session) {
      return this.failReport(
        "close_collaboration_session",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, `Unknown sessionId ${input.sessionId}`],
        },
        config,
      );
    }
    appendComrtLog({ event: "close_collaboration_session", details: session.sessionId });
    return this.reportAction(
      "close_collaboration_session",
      started,
      input,
      config,
      null,
      [],
      null,
      [],
      session,
      [session],
      null,
      [],
    );
  }

  retryFailed(input: ComrtInput, config: CommunicationRuntimeConfiguration): ComrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("retry_failed", started, validation, config);
    }

    const eligible = input.messageId
      ? [this.store.getMessage(input.messageId)].filter(Boolean) as CommunicationMessage[]
      : this.retryEngine.listRetryEligible(this.store);

    if (eligible.length === 0) {
      return this.failReport(
        "retry_failed",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "No failed messages eligible for retry"],
        },
        config,
      );
    }

    const messages: CommunicationMessage[] = [];
    const deliveries: DeliveryRecord[] = [];
    for (const msg of eligible) {
      const channel =
        (input.channelId ? this.store.getChannel(input.channelId) : null) ??
        this.store.listChannels().find((c) => c.channelType === msg.channelType) ??
        this.store.listChannels()[0]!;
      const result = this.retryEngine.retryFailed(
        this.store,
        msg.messageId,
        channel.channelId,
        config,
      );
      if (result) {
        messages.push(result.message);
        deliveries.push(result.delivery);
      }
    }

    this.ensureRecord("retrying", config);
    appendComrtLog({
      event: "retry_failed",
      details: `retried=${messages.length}`,
    });

    return this.reportAction(
      "retry_failed",
      started,
      input,
      config,
      messages[0] ?? null,
      messages,
      null,
      [],
      null,
      [],
      deliveries[0] ?? null,
      deliveries,
    );
  }

  produceReport(input: ComrtInput, config: CommunicationRuntimeConfiguration): ComrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("produce_report", started, validation, config);
    }
    const metrics = this.metricsCollector.collect(this.store);
    const report = this.reportBuilder.buildCommunicationRuntimeReport(
      this.store,
      this.metricsCollector,
      this.healthMonitor,
      config,
      {
        auditStatus: "passed",
        outstandingIssues: [],
        confidenceScore: Math.min(
          95,
          70 + metrics.totalChannels * 2 + metrics.totalMessages,
        ),
        supportingEvidence: ["communication-runtime operational evidence"],
      },
    );
    this.store.saveReport(report);
    this.ensureRecord("active", config);
    return {
      action: "produce_report",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "pass",
      validation,
      message: null,
      messages: [],
      channel: null,
      channels: [],
      session: null,
      sessions: [],
      delivery: null,
      deliveries: [],
      communicationRuntimeReport: report,
      q1009Contract: null,
      errors: [],
      warnings: [],
    };
  }

  submitReport(input: ComrtInput, config: CommunicationRuntimeConfiguration): ComrtRunReport {
    const produced = this.produceReport(input, config);
    if (produced.decision === "fail" || !produced.communicationRuntimeReport) {
      return produced;
    }
    this.integrations.submitReport(produced.communicationRuntimeReport);
    this.integrations.recordAudit({
      event: "communication_runtime_report_submitted",
      reportId: produced.communicationRuntimeReport.reportId,
    });
    return { ...produced, action: "submit_report" };
  }

  list(_input: ComrtInput, config: CommunicationRuntimeConfiguration): ComrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const channels = this.store.listChannels();
    const messages = this.store.listMessages();
    const sessions = this.store.listSessions();
    return this.reportAction(
      "list",
      started,
      _input,
      config,
      messages[0] ?? null,
      messages,
      channels[0] ?? null,
      channels,
      sessions[0] ?? null,
      sessions,
      null,
      [],
    );
  }

  validate(input: ComrtInput, config: CommunicationRuntimeConfiguration): ComrtRunReport {
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
      message: null,
      messages: [],
      channel: null,
      channels: [],
      session: null,
      sessions: [],
      delivery: null,
      deliveries: [],
      communicationRuntimeReport: null,
      q1009Contract: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  diagnostics(_input: ComrtInput, config: CommunicationRuntimeConfiguration): ComrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(config.integrationTargets);
    this.reportBuilder.buildDiagnostics(this.store, handshakes);
    return this.reportAction(
      "diagnostics",
      started,
      _input,
      config,
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      handshakes,
    );
  }

  private ensureRecord(
    state: ComrtEngineRecord["operationalState"],
    config: CommunicationRuntimeConfiguration,
  ) {
    const lastReport = this.store.listReports().at(-1);
    const channels = this.store.listChannels();
    this.engineRecord = {
      engineId: COMMUNICATION_RUNTIME_ID,
      workerId: config.workerId,
      operationalState: state,
      healthStatus: channels.length > 0 ? "healthy" : "standby",
      totalChannels: channels.length,
      totalMessages: this.store.listMessages().length,
      totalSessions: this.store.listSessions().length,
      totalReports: this.store.listReports().length,
      lastReportId: lastReport?.reportId ?? null,
      supportedCapabilities: [...COMRT_CAPABILITIES],
      integrationTargets: [...config.integrationTargets] as ComrtEngineRecord["integrationTargets"],
      metadataVersion: COMRT_METADATA_VERSION,
    };
  }

  private reportAction(
    action: string,
    started: number,
    input: ComrtInput,
    _config: CommunicationRuntimeConfiguration,
    message: CommunicationMessage | null,
    messages: CommunicationMessage[],
    channel: CommunicationChannel | null,
    channels: CommunicationChannel[],
    session: CollaborationSession | null,
    sessions: CollaborationSession[],
    delivery: DeliveryRecord | null,
    deliveries: DeliveryRecord[],
    handshakes: IntegrationHandshake[] = [],
  ): ComrtRunReport {
    const validation = this.validator.validateInput(input, started);
    const decision = validation.decision === "fail" ? "fail" : "pass";
    if (handshakes.length) {
      appendComrtLog({ event: action, details: `integrations=${handshakes.length}` });
    }
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision,
      validation,
      message,
      messages,
      channel,
      channels,
      session,
      sessions,
      delivery,
      deliveries,
      communicationRuntimeReport: null,
      q1009Contract: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  private failReport(
    action: string,
    started: number,
    validation: ComrtValidationReport,
    _config: CommunicationRuntimeConfiguration,
  ): ComrtRunReport {
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      message: null,
      messages: [],
      channel: null,
      channels: [],
      session: null,
      sessions: [],
      delivery: null,
      deliveries: [],
      communicationRuntimeReport: null,
      q1009Contract: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
}
