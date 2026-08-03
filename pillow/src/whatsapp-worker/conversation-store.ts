import type {
  AutomationWorkflow,
  Conversation,
  EscalationRecord,
  Message,
  MessageTemplate,
  ReminderScheduleEntry,
  WhatsAppReport,
} from "./types.js";

/** Authoritative in-memory WAW store — conversations, messages, history, reports. */
export class ConversationStore {
  private conversations = new Map<string, Conversation>();
  private messages = new Map<string, Message>();
  private templates = new Map<string, MessageTemplate>();
  private workflows = new Map<string, AutomationWorkflow>();
  private reminders = new Map<string, ReminderScheduleEntry>();
  private escalations = new Map<string, EscalationRecord>();
  private reports = new Map<string, WhatsAppReport>();
  private latestConversationId: string | null = null;
  private latestMessageId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: WhatsAppReport[]) {
    this.conversations.clear();
    this.messages.clear();
    this.templates.clear();
    this.workflows.clear();
    this.reminders.clear();
    this.escalations.clear();
    this.reports.clear();
    this.latestConversationId = null;
    this.latestMessageId = null;
    this.latestReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.reportId, cloneReport(report));
      this.latestReportId = report.reportId;
      this.latestConversationId = report.conversationId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        entityId: report.conversationId,
        action: "seed",
        details: `seeded report for project=${report.businessProjectId}`,
      });
    }
  }

  conversationCount() {
    return this.conversations.size;
  }

  messageCount() {
    return this.messages.size;
  }

  reportCount() {
    return this.reports.size;
  }

  listConversations() {
    return [...this.conversations.values()]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(cloneConversation);
  }

  listMessages(conversationId?: string) {
    return [...this.messages.values()]
      .filter((m) => !conversationId || m.conversationId === conversationId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneMessage);
  }

  listTemplates() {
    return [...this.templates.values()].map((t) => ({
      ...t,
      variables: [...t.variables],
    }));
  }

  listWorkflows(conversationId?: string) {
    return [...this.workflows.values()]
      .filter((w) => !conversationId || w.conversationId === conversationId)
      .map((w) => ({ ...w, steps: w.steps.map((s) => ({ ...s })) }));
  }

  listReminders(conversationId?: string) {
    return [...this.reminders.values()]
      .filter((r) => !conversationId || r.conversationId === conversationId)
      .map((r) => ({ ...r }));
  }

  listEscalations(conversationId?: string) {
    return [...this.escalations.values()]
      .filter((e) => !conversationId || e.conversationId === conversationId)
      .map((e) => ({ ...e }));
  }

  listReports() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneReport);
  }

  getConversation(conversationId: string) {
    const c = this.conversations.get(conversationId);
    return c ? cloneConversation(c) : null;
  }

  getMessage(messageId: string) {
    const m = this.messages.get(messageId);
    return m ? cloneMessage(m) : null;
  }

  getReport(reportId: string) {
    const r = this.reports.get(reportId);
    return r ? cloneReport(r) : null;
  }

  getLatestConversationId() {
    return this.latestConversationId;
  }

  getLatestMessageId() {
    return this.latestMessageId;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getAuditTrail() {
    return this.auditTrail.map((a) => ({ ...a }));
  }

  saveConversation(conversation: Conversation, action: string) {
    const saved = cloneConversation(conversation);
    this.conversations.set(saved.conversationId, saved);
    this.latestConversationId = saved.conversationId;
    this.audit(saved.conversationId, action, `status=${saved.status}`);
    return cloneConversation(saved);
  }

  saveMessage(message: Message, action: string) {
    const saved = cloneMessage(message);
    this.messages.set(saved.messageId, saved);
    this.latestMessageId = saved.messageId;
    const conv = this.conversations.get(saved.conversationId);
    if (conv && !conv.messageIds.includes(saved.messageId)) {
      conv.messageIds = [...conv.messageIds, saved.messageId];
      conv.updatedAt = new Date().toISOString();
      this.conversations.set(conv.conversationId, conv);
    }
    this.audit(saved.messageId, action, `direction=${saved.direction} status=${saved.deliveryStatus}`);
    return cloneMessage(saved);
  }

  saveTemplate(template: MessageTemplate, action: string) {
    const saved = { ...template, variables: [...template.variables] };
    this.templates.set(saved.templateId, saved);
    this.audit(saved.templateId, action, `name=${saved.name}`);
    return { ...saved, variables: [...saved.variables] };
  }

  saveWorkflow(workflow: AutomationWorkflow, action: string) {
    const saved = {
      ...workflow,
      steps: workflow.steps.map((s) => ({ ...s })),
    };
    this.workflows.set(saved.workflowId, saved);
    const conv = this.conversations.get(saved.conversationId);
    if (conv && !conv.workflowIds.includes(saved.workflowId)) {
      conv.workflowIds = [...conv.workflowIds, saved.workflowId];
      conv.updatedAt = new Date().toISOString();
      this.conversations.set(conv.conversationId, conv);
    }
    this.audit(saved.workflowId, action, `status=${saved.status}`);
    return {
      ...saved,
      steps: saved.steps.map((s) => ({ ...s })),
    };
  }

  saveReminder(reminder: ReminderScheduleEntry, action: string) {
    const saved = { ...reminder };
    this.reminders.set(saved.reminderId, saved);
    const conv = this.conversations.get(saved.conversationId);
    if (conv && !conv.reminderIds.includes(saved.reminderId)) {
      conv.reminderIds = [...conv.reminderIds, saved.reminderId];
      conv.updatedAt = new Date().toISOString();
      this.conversations.set(conv.conversationId, conv);
    }
    this.audit(saved.reminderId, action, `status=${saved.status}`);
    return { ...saved };
  }

  saveEscalation(escalation: EscalationRecord, action: string) {
    const saved = { ...escalation };
    this.escalations.set(saved.escalationId, saved);
    const conv = this.conversations.get(saved.conversationId);
    if (conv && !conv.escalationIds.includes(saved.escalationId)) {
      conv.escalationIds = [...conv.escalationIds, saved.escalationId];
      conv.updatedAt = new Date().toISOString();
      this.conversations.set(conv.conversationId, conv);
    }
    this.audit(saved.escalationId, action, `status=${saved.status}`);
    return { ...saved };
  }

  saveReport(report: WhatsAppReport, action: string) {
    const saved = cloneReport(report);
    this.reports.set(saved.reportId, saved);
    this.latestReportId = saved.reportId;
    this.audit(saved.reportId, action, `conversation=${saved.conversationId}`);
    return cloneReport(saved);
  }

  updateReport(report: WhatsAppReport) {
    return this.saveReport(report, "update_report");
  }

  private audit(entityId: string, action: string, details: string) {
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId,
      action,
      details,
    });
  }
}

function cloneConversation(c: Conversation): Conversation {
  return {
    ...c,
    labels: [...c.labels],
    messageIds: [...c.messageIds],
    templateIds: [...c.templateIds],
    workflowIds: [...c.workflowIds],
    reminderIds: [...c.reminderIds],
    escalationIds: [...c.escalationIds],
    outstandingIssues: [...c.outstandingIssues],
  };
}

function cloneMessage(m: Message): Message {
  return {
    ...m,
    mediaAttachments: m.mediaAttachments.map((a) => ({ ...a })),
    labels: [...m.labels],
    deliveryOutcome: m.deliveryOutcome ? { ...m.deliveryOutcome } : null,
    fabricated: false as const,
  };
}

function cloneReport(r: WhatsAppReport): WhatsAppReport {
  return {
    ...r,
    templatesUsed: [...r.templatesUsed],
    automationSteps: r.automationSteps.map((s) => ({ ...s })),
    outstandingIssues: [...r.outstandingIssues],
    messages: r.messages.map(cloneMessage),
    labels: [...r.labels],
    mediaAttachments: r.mediaAttachments.map((a) => ({ ...a })),
    reminderSchedule: r.reminderSchedule.map((x) => ({ ...x })),
    traceabilityRefs: [...r.traceabilityRefs],
    consumableByQ707: true,
    neverReplaceCrm: true,
    neverReplaceBookingWorker: true,
    neverReplaceOperationsWorker: true,
    neverModifyUnrelatedPlatformComponents: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateMessageDeliveryResults: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ707OrLater: true,
    preserveCompleteTraceability: true,
    preserveConversationHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
