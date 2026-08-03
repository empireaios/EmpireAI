import type { WhatsAppWorkerConfiguration } from "./configuration.js";
import { ConversationStore } from "./conversation-store.js";
import { ConversationWorkflowEngine } from "./conversation-workflows.js";
import {
  IntegrationCoordinator,
  type WhatsAppWorkerDependencies,
} from "./integrations.js";
import { MessageTemplateRegistry } from "./message-templates.js";
import {
  FixtureTransportProvider,
  resolveTransportProvider,
} from "./transport-providers.js";
import { appendWawLog } from "./waw-logging.js";
import {
  nextEscalationId,
  nextMessageId,
  nextReminderId,
  nextRunReportId,
  nextEngineRecordId,
  normalizeEvidenceMode,
  WhatsAppBuilder,
} from "./whatsapp-builder.js";
import {
  HealthMonitor,
  RecoveryManager,
  WhatsAppValidator,
} from "./whatsapp-validator.js";
import {
  INTEGRATION_TARGETS,
  WAW_CAPABILITIES,
  WAW_METADATA_VERSION,
  WHATSAPP_WORKER_ID,
} from "./paths.js";
import type {
  AutomationWorkflow,
  Conversation,
  EscalationRecord,
  IntegrationHandshake,
  Message,
  OperationalState,
  ReminderScheduleEntry,
  WhatsAppInput,
  WhatsAppReport,
  WhatsAppWorkerCatalog,
  WhatsAppWorkerEngineRecord,
  WhatsAppWorkerRunReport,
  WhatsAppWorkerValidationReport,
} from "./types.js";

export class WhatsAppManager {
  private engineRecord: WhatsAppWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: WhatsAppWorkerCatalog | null = null;
  private readonly store = new ConversationStore();
  private readonly builder = new WhatsAppBuilder();
  private readonly validator = new WhatsAppValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private readonly templates = new MessageTemplateRegistry();
  private readonly workflows = new ConversationWorkflowEngine();
  private readonly fixtureTransport = new FixtureTransportProvider();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: WhatsAppWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: WhatsAppWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
    this.templates.ensureDefaults();
    for (const t of this.templates.list()) {
      this.store.saveTemplate(t, "seed_template");
    }
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listConversations(),
      this.store.listMessages(),
      this.store.listTemplates(),
      this.store.listWorkflows(),
      this.store.listReminders(),
      this.store.listEscalations(),
      this.handshakes,
    );
    this.seeded = true;
    this.ensureRecord("connected", config);
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

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getReports() {
    return this.store.listReports();
  }

  getConversations() {
    return this.store.listConversations();
  }

  getMessages(conversationId?: string) {
    return this.store.listMessages(conversationId);
  }

  getLatestReportId() {
    return this.store.getLatestReportId();
  }

  getLatestConversationId() {
    return this.store.getLatestConversationId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: WhatsAppWorkerConfiguration,
  ): WhatsAppWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.refreshCatalog(config);
    this.ensureRecord("connected", config);
    appendWawLog({
      event: "connect",
      details: `WhatsApp Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      [],
      [],
      null,
      null,
      null,
      null,
      null,
      null,
      {
        validationReportId: `waw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["WhatsApp Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WAW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveInboundEnquiry(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.whatsappRulesEnabled) {
      return this.disabled(
        "receive_inbound_enquiry",
        config,
        !config.enabled ? "WhatsApp Worker is disabled" : "WhatsApp rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("receive_inbound_enquiry", input, config, started);
    }
    const conversation = this.resolveOrCreateConversation(input, config);
    const now = new Date().toISOString();
    const message: Message = {
      messageId: input.messageId?.trim() || nextMessageId(),
      conversationId: conversation.conversationId,
      timestamp: now,
      direction: "inbound",
      body: input.messageBody?.trim() || "Inbound WhatsApp enquiry",
      templateId: null,
      deliveryStatus: "received",
      deliveryOutcome: {
        passed: true,
        observed: true,
        provider: "fixture",
        reason: "inbound_enquiry_observed",
        observedAt: now,
        transportMessageId: null,
      },
      evidenceMode: normalizeEvidenceMode(input.evidenceMode, config.defaultEvidenceMode),
      fabricated: false,
      mediaAttachments: [...(input.mediaAttachments ?? [])],
      labels: [...(input.labels ?? [])],
      source: "inbound",
    };
    conversation.status = "open";
    conversation.updatedAt = now;
    const savedConv = this.store.saveConversation(conversation, "receive_inbound_enquiry");
    const savedMsg = this.store.saveMessage(message, "receive_inbound_enquiry");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWawLog({
      event: "receive_inbound_enquiry",
      details: `conversation=${savedConv.conversationId} message=${savedMsg.messageId}`,
    });
    return this.report(
      "receive_inbound_enquiry",
      this.getCatalog(),
      [],
      [savedConv],
      [savedMsg],
      null,
      savedConv,
      savedMsg,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  sendOutboundMessage(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.whatsappRulesEnabled) {
      return this.disabled(
        "send_outbound_message",
        config,
        !config.enabled ? "WhatsApp Worker is disabled" : "WhatsApp rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("send_outbound_message", input, config, started);
    }
    if (input.fabricateMessageDeliveryResults === true) {
      return this.boundaryFail("send_outbound_message", input, config, started);
    }
    const conversation = this.resolveConversation(input);
    if (!conversation) {
      return this.failAction(
        "send_outbound_message",
        config,
        started,
        input,
        "conversation_not_found",
      );
    }
    const evidenceMode = normalizeEvidenceMode(input.evidenceMode, config.defaultEvidenceMode);
    const transport = resolveTransportProvider(evidenceMode, {
      fixture: this.fixtureTransport,
    });
    const transportResult = transport.send({
      conversationId: conversation.conversationId,
      messageBody: input.messageBody?.trim() || "",
      customerReference: conversation.customerReference,
      templateId: input.templateId ?? null,
      evidenceMode,
      deliveryFixture: input.deliveryFixture,
    });
    const outcome = transportResult.deliveryOutcome;
    const now = new Date().toISOString();
    const message: Message = {
      messageId: input.messageId?.trim() || nextMessageId(),
      conversationId: conversation.conversationId,
      timestamp: now,
      direction: "outbound",
      body: input.messageBody?.trim() || "",
      templateId: input.templateId?.trim() || null,
      deliveryStatus: outcome.passed ? "delivered" : "failed",
      deliveryOutcome: outcome,
      evidenceMode: transportResult.evidenceMode,
      fabricated: false,
      mediaAttachments: [...(input.mediaAttachments ?? [])],
      labels: [...(input.labels ?? [])],
      source: "outbound",
    };
    if (!outcome.passed) {
      conversation.outstandingIssues = [
        ...conversation.outstandingIssues.filter((i) => !i.startsWith("delivery:")),
        `delivery:${outcome.reason}`,
      ];
      if (conversation.status !== "escalated") conversation.status = "failed";
    } else {
      conversation.status =
        conversation.status === "open" || conversation.status === "failed"
          ? "awaiting_customer"
          : conversation.status;
      conversation.outstandingIssues = conversation.outstandingIssues.filter(
        (i) => !i.startsWith("delivery:"),
      );
    }
    conversation.updatedAt = now;
    conversation.evidenceMode = transportResult.evidenceMode;
    const savedConv = this.store.saveConversation(conversation, "send_outbound_message");
    const savedMsg = this.store.saveMessage(message, "send_outbound_message");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWawLog({
      event: "send_outbound_message",
      details: `message=${savedMsg.messageId} delivered=${outcome.passed} mode=${transportResult.evidenceMode}`,
    });
    return this.report(
      "send_outbound_message",
      this.getCatalog(),
      [],
      [savedConv],
      [savedMsg],
      null,
      savedConv,
      savedMsg,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  applyTemplate(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("apply_template", input, config, started);
    }
    const conversation = this.resolveConversation(input);
    if (!conversation) {
      return this.failAction("apply_template", config, started, input, "conversation_not_found");
    }
    let template = input.templateId
      ? this.templates.get(input.templateId)
      : input.templateName
        ? this.templates.findByName(input.templateName)
        : null;
    if (!template && (input.templateBody || input.templateName)) {
      template = this.templates.createFromInput(input);
      this.store.saveTemplate(template, "create_template");
    }
    if (!template) {
      template = this.templates.findByName("enquiry_auto_reply");
    }
    if (!template) {
      return this.failAction("apply_template", config, started, input, "template_not_found");
    }
    if (!conversation.templateIds.includes(template.templateId)) {
      conversation.templateIds = [...conversation.templateIds, template.templateId];
    }
    const body = this.templates.applyVariables(template, {
      customerReference: conversation.customerReference,
      businessProjectId: conversation.businessProjectId,
    });
    const sendResult = this.sendOutboundMessage(
      {
        ...input,
        conversationId: conversation.conversationId,
        messageBody: body,
        templateId: template.templateId,
        messageDirection: "outbound",
      },
      config,
    );
    appendWawLog({
      event: "apply_template",
      details: `template=${template.templateId}`,
    });
    return {
      ...sendResult,
      action: "apply_template" as const,
    };
  }

  runAutomatedWorkflow(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("run_automated_workflow", input, config, started);
    }
    const conversation = this.resolveOrCreateConversation(input, config);
    const steps =
      input.workflowSteps && input.workflowSteps.length > 0
        ? input.workflowSteps
        : (["enquiry_received", "auto_reply"] as const);
    const workflow = this.workflows.startWorkflow({
      conversationId: conversation.conversationId,
      input,
      allowedSteps: config.automationStepTypes,
      defaultSteps: [...steps],
    });
    this.store.saveWorkflow(workflow, "start_workflow");

    if (!conversation.messageIds.length && (input.messageBody || true)) {
      this.receiveInboundEnquiry(
        {
          ...input,
          conversationId: conversation.conversationId,
          messageBody: input.messageBody ?? "Automated workflow enquiry",
        },
        config,
      );
    }
    this.workflows.completeStep(
      workflow.workflowId,
      "enquiry_received",
      "enquiry recorded for automation",
    );

    const reply = this.applyTemplate(
      {
        ...input,
        conversationId: conversation.conversationId,
        templateName: input.templateName ?? "enquiry_auto_reply",
        deliveryFixture: input.deliveryFixture ?? { passed: true, reason: "fixture_auto_reply" },
        evidenceMode: input.evidenceMode ?? "fixture",
      },
      config,
    );
    const updatedWorkflow =
      this.workflows.completeStep(
        workflow.workflowId,
        "auto_reply",
        "auto reply attempted via fixture transport",
        {
          messageId: reply.latestMessage?.messageId ?? null,
          templateId: reply.latestMessage?.templateId ?? null,
          failed: reply.latestMessage?.deliveryStatus === "failed",
        },
      ) ?? workflow;

    conversation.status = "automated";
    conversation.updatedAt = new Date().toISOString();
    const savedConv = this.store.saveConversation(conversation, "run_automated_workflow");
    this.store.saveWorkflow(updatedWorkflow, "complete_workflow");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWawLog({
      event: "run_automated_workflow",
      details: `workflow=${updatedWorkflow.workflowId}`,
    });
    return this.report(
      "run_automated_workflow",
      this.getCatalog(),
      [],
      [savedConv],
      reply.latestMessage ? [reply.latestMessage] : [],
      null,
      savedConv,
      reply.latestMessage,
      updatedWorkflow,
      null,
      null,
      validation,
      started,
    );
  }

  triggerCrmWorkflow(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("trigger_crm_workflow", input, config, started);
    }
    if (input.replaceCrm === true) {
      return this.boundaryFail("trigger_crm_workflow", input, config, started);
    }
    const conversation = this.resolveConversation(input);
    if (!conversation) {
      return this.failAction("trigger_crm_workflow", config, started, input, "conversation_not_found");
    }
    // Consume Q7-05 contract / report / fixture when present (structural only).
    void this.integrations.getQ706ConsumableContract();
    void input.crmReport;
    void input.fixtureCrm;

    const result = this.integrations.triggerCrm({
      action: "captureLead",
      input: {
        businessProjectId: conversation.businessProjectId,
        customerReference: conversation.customerReference,
        displayName: conversation.customerReference,
        contactName: conversation.customerReference,
        contactChannel: "chat",
        contactSummary: `WhatsApp conversation ${conversation.conversationId}`,
        interest: "whatsapp_enquiry",
        source: "whatsapp",
        validated: true,
      },
    });
    const contactResult = this.integrations.triggerCrm({
      action: "recordContact",
      input: {
        businessProjectId: conversation.businessProjectId,
        customerReference: conversation.customerReference,
        contactSummary: `WhatsApp contact for ${conversation.conversationId}`,
        contactChannel: "chat",
        contactDirection: "inbound",
        validated: true,
      },
    });
    conversation.crmIntegrationStatus =
      result.ok || contactResult.ok ? "triggered" : "unavailable";
    if (!result.ok && !contactResult.ok) {
      conversation.outstandingIssues = [
        ...conversation.outstandingIssues.filter((i) => !i.startsWith("crm:")),
        `crm:${result.details}`,
      ];
    }
    conversation.updatedAt = new Date().toISOString();
    const savedConv = this.store.saveConversation(conversation, "trigger_crm_workflow");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!result.ok && !contactResult.ok && validation.decision !== "fail") {
      validation.warnings.push(result.details);
      validation.decision = "partial";
    }
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "trigger_crm_workflow",
      this.getCatalog(),
      [],
      [savedConv],
      [],
      null,
      savedConv,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  triggerBookingWorkflow(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("trigger_booking_workflow", input, config, started);
    }
    if (input.replaceBookingWorker === true) {
      return this.boundaryFail("trigger_booking_workflow", input, config, started);
    }
    const conversation = this.resolveConversation(input);
    if (!conversation) {
      return this.failAction(
        "trigger_booking_workflow",
        config,
        started,
        input,
        "conversation_not_found",
      );
    }
    const result = this.integrations.triggerBooking({
      action: "createBooking",
      input: {
        businessProjectId: conversation.businessProjectId,
        customerReference: conversation.customerReference,
        serviceSelected: "whatsapp_requested_service",
        validated: true,
      },
    });
    if (result.ok) {
      this.integrations.triggerBooking({
        action: "generateConfirmation",
        input: {
          customerReference: conversation.customerReference,
          validated: true,
        },
      });
    }
    conversation.bookingIntegrationStatus = result.ok ? "triggered" : "unavailable";
    if (!result.ok) {
      conversation.outstandingIssues = [
        ...conversation.outstandingIssues.filter((i) => !i.startsWith("booking:")),
        `booking:${result.details}`,
      ];
    }
    conversation.updatedAt = new Date().toISOString();
    const savedConv = this.store.saveConversation(conversation, "trigger_booking_workflow");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!result.ok && validation.decision !== "fail") {
      validation.warnings.push(result.details);
      validation.decision = "partial";
    }
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "trigger_booking_workflow",
      this.getCatalog(),
      [],
      [savedConv],
      [],
      null,
      savedConv,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  scheduleReminder(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("schedule_reminder", input, config, started);
    }
    const conversation = this.resolveConversation(input);
    if (!conversation) {
      return this.failAction("schedule_reminder", config, started, input, "conversation_not_found");
    }
    const now = new Date().toISOString();
    const reminder: ReminderScheduleEntry = {
      reminderId: input.reminderId?.trim() || nextReminderId(),
      conversationId: conversation.conversationId,
      scheduledAt: now,
      dueAt: input.reminderDueAt?.trim() || new Date(Date.now() + 86400000).toISOString(),
      purpose: input.reminderPurpose?.trim() || "whatsapp_reminder",
      status: "scheduled",
      messageBody: input.messageBody?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };
    const saved = this.store.saveReminder(reminder, "schedule_reminder");
    conversation.updatedAt = now;
    const savedConv = this.store.saveConversation(conversation, "schedule_reminder");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWawLog({
      event: "schedule_reminder",
      details: `reminder=${saved.reminderId}`,
    });
    return this.report(
      "schedule_reminder",
      this.getCatalog(),
      [],
      [savedConv],
      [],
      null,
      savedConv,
      null,
      null,
      saved,
      null,
      validation,
      started,
    );
  }

  scheduleFollowUpMessage(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("schedule_follow_up_message", input, config, started);
    }
    const conversation = this.resolveConversation(input);
    if (!conversation) {
      return this.failAction(
        "schedule_follow_up_message",
        config,
        started,
        input,
        "conversation_not_found",
      );
    }
    this.integrations.triggerCrm({
      action: "scheduleFollowUp",
      input: {
        businessProjectId: conversation.businessProjectId,
        customerReference: conversation.customerReference,
        followUpPurpose: input.followUpPurpose?.trim() || "whatsapp_follow_up",
        followUpDueAt: input.followUpDueAt?.trim() || new Date(Date.now() + 172800000).toISOString(),
        validated: true,
      },
    });
    const reminderResult = this.scheduleReminder(
      {
        ...input,
        reminderPurpose: input.followUpPurpose ?? "whatsapp_follow_up",
        reminderDueAt: input.followUpDueAt,
      },
      config,
    );
    return {
      ...reminderResult,
      action: "schedule_follow_up_message" as const,
    };
  }

  escalateToHuman(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("escalate_to_human", input, config, started);
    }
    const conversation = this.resolveConversation(input);
    if (!conversation) {
      return this.failAction("escalate_to_human", config, started, input, "conversation_not_found");
    }
    const now = new Date().toISOString();
    const escalation: EscalationRecord = {
      escalationId: nextEscalationId(),
      conversationId: conversation.conversationId,
      escalatedAt: now,
      reason: input.escalationReason?.trim() || "human_assistance_requested",
      assignedAgent: input.assignedAgent?.trim() || conversation.assignedAgent,
      status: "open",
      notes: input.messageBody?.trim() || "",
    };
    conversation.status = "escalated";
    conversation.assignedAgent = escalation.assignedAgent;
    conversation.updatedAt = now;
    const savedEsc = this.store.saveEscalation(escalation, "escalate_to_human");
    const savedConv = this.store.saveConversation(conversation, "escalate_to_human");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWawLog({
      event: "escalate_to_human",
      details: `escalation=${savedEsc.escalationId}`,
    });
    return this.report(
      "escalate_to_human",
      this.getCatalog(),
      [],
      [savedConv],
      [],
      null,
      savedConv,
      null,
      null,
      null,
      savedEsc,
      validation,
      started,
    );
  }

  assignConversation(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("assign_conversation", input, config, started);
    }
    const conversation = this.resolveConversation(input);
    if (!conversation) {
      return this.failAction("assign_conversation", config, started, input, "conversation_not_found");
    }
    conversation.assignedAgent = input.assignedAgent?.trim() || conversation.assignedAgent;
    conversation.status =
      conversation.status === "escalated" ? "awaiting_agent" : conversation.status;
    conversation.updatedAt = new Date().toISOString();
    const savedConv = this.store.saveConversation(conversation, "assign_conversation");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "assign_conversation",
      this.getCatalog(),
      [],
      [savedConv],
      [],
      null,
      savedConv,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  labelConversation(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("label_conversation", input, config, started);
    }
    const conversation = this.resolveConversation(input);
    if (!conversation) {
      return this.failAction("label_conversation", config, started, input, "conversation_not_found");
    }
    const labels = Array.from(new Set([...conversation.labels, ...(input.labels ?? [])]));
    conversation.labels = labels;
    conversation.updatedAt = new Date().toISOString();
    const savedConv = this.store.saveConversation(conversation, "label_conversation");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "label_conversation",
      this.getCatalog(),
      [],
      [savedConv],
      [],
      null,
      savedConv,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  getConversationHistory(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("get_conversation_history", input, config, started);
    }
    const conversation = this.resolveConversation(input);
    if (!conversation) {
      return this.failAction(
        "get_conversation_history",
        config,
        started,
        input,
        "conversation_not_found",
      );
    }
    const messages = this.store.listMessages(conversation.conversationId);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, "passed");
    return this.report(
      "get_conversation_history",
      this.getCatalog(),
      [],
      [conversation],
      messages,
      null,
      conversation,
      messages[messages.length - 1] ?? null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  produceReport(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("produce_report", input, config, started);
    }
    const conversation = this.resolveConversation(input);
    if (!conversation) {
      return this.failAction("produce_report", config, started, input, "conversation_not_found");
    }
    const messages = this.store.listMessages(conversation.conversationId);
    const workflows = this.store.listWorkflows(conversation.conversationId);
    const automationSteps = workflows.flatMap((w) => w.steps);
    const reminders = this.store.listReminders(conversation.conversationId);
    const report = this.builder.assembleReport({
      conversation,
      messages,
      automationSteps,
      templatesUsed: [...conversation.templateIds],
      reminders,
      config,
    });
    const saved = this.store.saveReport(report, "produce_report");
    this.refreshCatalog(config);
    const validation = this.validator.validateReports([saved], input, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendWawLog({
      event: "produce_report",
      details: `report=${saved.reportId}`,
    });
    return this.report(
      "produce_report",
      this.getCatalog(),
      [saved],
      [conversation],
      messages,
      saved,
      conversation,
      messages[messages.length - 1] ?? null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  submitReport(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    let report =
      (input.reportId ? this.store.getReport(input.reportId) : null) ??
      this.store.listReports().slice(-1)[0] ??
      null;
    if (!report) {
      const produced = this.produceReport(input, config);
      report = produced.latestReport;
    }
    if (!report) {
      return this.failAction("submit_report", config, started, input, "report_not_found");
    }
    const submission = this.integrations.submitReport(report);
    const updated: WhatsAppReport = {
      ...report,
      submittedToExecutiveReporting: submission.submitted,
      executiveReportId: submission.executiveReportId,
    };
    const saved = this.store.updateReport(updated);
    this.refreshCatalog(config);
    const validation = this.validator.validateReports([saved], input, started);
    if (!submission.submitted && validation.decision !== "fail") {
      validation.warnings.push(submission.details);
      validation.decision = "partial";
    }
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "submit_report",
      this.getCatalog(),
      [saved],
      [],
      [],
      saved,
      null,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  list(config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.refreshCatalog(config);
    return this.report(
      "list",
      this.getCatalog(),
      this.store.listReports(),
      this.store.listConversations(),
      this.store.listMessages(),
      this.store.listReports().slice(-1)[0] ?? null,
      this.store.listConversations().slice(-1)[0] ?? null,
      this.store.listMessages().slice(-1)[0] ?? null,
      null,
      null,
      null,
      {
        validationReportId: `waw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WAW_METADATA_VERSION,
      },
      started,
    );
  }

  validate(input: WhatsAppInput, config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const reports = this.store.listReports();
    const validation = this.validator.validateReports(reports, input, started, {
      allowIncompleteReport: reports.length === 0,
    });
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      this.getCatalog(),
      reports,
      [],
      [],
      reports.slice(-1)[0] ?? null,
      null,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  diagnostics(config: WhatsAppWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.refreshCatalog(config);
    const health = this.healthMonitor.score({
      totalReports: this.store.reportCount(),
      totalConversations: this.store.conversationCount(),
      lastDecision: null,
    });
    this.ensureRecord("active", config, health === "failed" ? "failed" : "passed");
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listReports(),
      this.store.listConversations(),
      this.store.listMessages(),
      this.store.listReports().slice(-1)[0] ?? null,
      this.store.listConversations().slice(-1)[0] ?? null,
      null,
      null,
      null,
      null,
      {
        validationReportId: `waw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: health === "failed" ? "fail" : "pass",
        errors: [],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WAW_METADATA_VERSION,
      },
      started,
    );
  }

  private resolveOrCreateConversation(
    input: WhatsAppInput,
    config: WhatsAppWorkerConfiguration,
  ): Conversation {
    const existing = this.resolveConversation(input);
    if (existing) return existing;
    const created = this.builder.createConversation(input, config);
    return this.store.saveConversation(created, "create_conversation");
  }

  private resolveConversation(input: WhatsAppInput): Conversation | null {
    if (input.conversationId?.trim()) {
      return this.store.getConversation(input.conversationId.trim());
    }
    const latestId = this.store.getLatestConversationId();
    if (latestId) return this.store.getConversation(latestId);
    if (input.customerReference?.trim()) {
      return (
        this.store
          .listConversations()
          .find((c) => c.customerReference === input.customerReference?.trim()) ?? null
      );
    }
    return null;
  }

  private refreshCatalog(config: WhatsAppWorkerConfiguration) {
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listConversations(),
      this.store.listMessages(),
      this.store.listTemplates(),
      this.store.listWorkflows(),
      this.store.listReminders(),
      this.store.listEscalations(),
      this.handshakes,
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: WhatsAppWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
  ) {
    const health = this.healthMonitor.score({
      totalReports: this.store.reportCount(),
      totalConversations: this.store.conversationCount(),
      lastDecision:
        validationStatus === "failed"
          ? "fail"
          : validationStatus === "partial"
            ? "partial"
            : validationStatus === "passed"
              ? "pass"
              : null,
    });
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? nextEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: WHATSAPP_WORKER_ID,
      engineVersion: "PILLOW-WAW-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...WAW_CAPABILITIES],
      totalReports: this.store.reportCount(),
      totalConversations: this.store.conversationCount(),
      totalMessages: this.store.messageCount(),
      lastConversationId: this.store.getLatestConversationId(),
      lastReportId: this.store.getLatestReportId(),
      lastConfidenceScore:
        this.store.listReports().slice(-1)[0]?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: WAW_METADATA_VERSION,
    };
  }

  private disabled(
    action: WhatsAppWorkerRunReport["action"],
    config: WhatsAppWorkerConfiguration,
    reason: string,
  ) {
    const started = Date.now();
    return this.report(
      action,
      this.getCatalog(),
      [],
      [],
      [],
      null,
      null,
      null,
      null,
      null,
      null,
      {
        validationReportId: `waw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors: [reason],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: WAW_METADATA_VERSION,
      },
      started,
    );
  }

  private boundaryFail(
    action: WhatsAppWorkerRunReport["action"],
    input: WhatsAppInput,
    config: WhatsAppWorkerConfiguration,
    started: number,
  ) {
    this.ensureSeeded(config);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    const validation = this.validator.validateInput(input, started);
    appendWawLog({
      event: "boundary_violation",
      details: `action=${action} errors=${validation.errors.join("|")}`,
    });
    return this.report(
      action,
      this.getCatalog(),
      [],
      [],
      [],
      null,
      null,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  private failAction(
    action: WhatsAppWorkerRunReport["action"],
    config: WhatsAppWorkerConfiguration,
    started: number,
    input: WhatsAppInput,
    reason: string,
  ) {
    const validation = this.validator.finalize(
      "fail",
      [...this.validator.collectBoundaryErrors(input), reason],
      [],
      started,
    );
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      [],
      [],
      [],
      null,
      null,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  private report(
    action: WhatsAppWorkerRunReport["action"],
    catalog: WhatsAppWorkerCatalog | null,
    reports: WhatsAppReport[],
    conversations: Conversation[],
    messages: Message[],
    latestReport: WhatsAppReport | null,
    latestConversation: Conversation | null,
    latestMessage: Message | null,
    latestWorkflow: AutomationWorkflow | null,
    latestReminder: ReminderScheduleEntry | null,
    latestEscalation: EscalationRecord | null,
    validation: WhatsAppWorkerValidationReport,
    started: number,
  ): WhatsAppWorkerRunReport {
    return {
      whatsappRunReportId: nextRunReportId(),
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      catalog,
      reports,
      conversations,
      messages,
      latestReport,
      latestConversation,
      latestMessage,
      latestWorkflow,
      latestReminder,
      latestEscalation,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: WAW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: WhatsAppWorkerCatalog): WhatsAppWorkerCatalog {
  return {
    ...catalog,
    reports: catalog.reports.map((r) => ({ ...r })),
    conversations: catalog.conversations.map((c) => ({ ...c })),
    messages: catalog.messages.map((m) => ({ ...m })),
    templates: catalog.templates.map((t) => ({ ...t })),
    workflows: catalog.workflows.map((w) => ({ ...w })),
    reminders: catalog.reminders.map((r) => ({ ...r })),
    escalations: catalog.escalations.map((e) => ({ ...e })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
    neverReplaceCrm: true,
    neverReplaceBookingWorker: true,
    neverReplaceOperationsWorker: true,
    neverFabricateMessageDeliveryResults: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ707OrLater: true,
    consumableByQ707: true,
  };
}
