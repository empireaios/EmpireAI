import type {
  CollaborationSession,
  CommunicationChannel,
  CommunicationMessage,
  CommunicationRuntimeReport,
  DeliveryRecord,
} from "./types.js";

let sequence = 0;

export function resetComrtSequenceForTesting() {
  sequence = 0;
}

export function nextComrtId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

export class CommunicationStore {
  private messages = new Map<string, CommunicationMessage>();
  private channels = new Map<string, CommunicationChannel>();
  private sessions = new Map<string, CollaborationSession>();
  private deliveries: DeliveryRecord[] = [];
  private reports: CommunicationRuntimeReport[] = [];
  private messageHistory: CommunicationMessage[] = [];
  private auditTrail: string[] = [];

  saveChannel(channel: CommunicationChannel) {
    const snapshot = this.cloneChannel(channel);
    this.channels.set(channel.channelId, snapshot);
    this.auditTrail.push(`channel_saved:${channel.channelId}@${channel.createdAt}`);
    return snapshot;
  }

  getChannel(channelId: string) {
    const channel = this.channels.get(channelId);
    return channel ? this.cloneChannel(channel) : null;
  }

  listChannels() {
    return [...this.channels.values()]
      .map((c) => this.cloneChannel(c))
      .sort((a, b) => a.channelId.localeCompare(b.channelId));
  }

  listActiveChannels() {
    return this.listChannels().filter((c) => c.status === "active" || c.status === "idle");
  }

  updateChannel(channelId: string, patch: Partial<CommunicationChannel>) {
    const existing = this.channels.get(channelId);
    if (!existing) return null;
    const updated: CommunicationChannel = {
      ...existing,
      ...patch,
      participants: patch.participants ? [...patch.participants] : [...existing.participants],
      structuralSignalOnly: true,
      fabricated: false,
    };
    this.channels.set(channelId, updated);
    this.auditTrail.push(`channel_updated:${channelId}@${new Date().toISOString()}`);
    return this.cloneChannel(updated);
  }

  saveMessage(message: CommunicationMessage) {
    const snapshot = this.cloneMessage(message);
    this.messages.set(message.messageId, snapshot);
    this.messageHistory.push(this.cloneMessage(message));
    this.auditTrail.push(`message_saved:${message.messageId}@${message.timestamp}`);
    return snapshot;
  }

  getMessage(messageId: string) {
    const message = this.messages.get(messageId);
    return message ? this.cloneMessage(message) : null;
  }

  listMessages() {
    return [...this.messages.values()]
      .map((m) => this.cloneMessage(m))
      .sort((a, b) => a.messageId.localeCompare(b.messageId));
  }

  /**
   * Update a message. NEVER deletes acknowledged messages — they remain in messages and history.
   */
  updateMessage(messageId: string, patch: Partial<CommunicationMessage>) {
    const existing = this.messages.get(messageId);
    if (!existing) return null;
    const updated: CommunicationMessage = {
      ...existing,
      ...patch,
      fabricated: false,
      structuralSignalOnly: true,
    };
    this.messages.set(messageId, updated);
    this.messageHistory.push(this.cloneMessage(updated));
    this.auditTrail.push(`message_updated:${messageId}@${new Date().toISOString()}`);
    return this.cloneMessage(updated);
  }

  /** Acknowledged messages are NEVER deleted — only status updates. */
  listAcknowledgedMessages() {
    return this.listMessages().filter((m) => m.deliveryStatus === "acknowledged");
  }

  listFailedMessages() {
    return this.listMessages().filter(
      (m) => m.deliveryStatus === "failed" || m.deliveryStatus === "retrying",
    );
  }

  saveSession(session: CollaborationSession) {
    const snapshot = this.cloneSession(session);
    this.sessions.set(session.sessionId, snapshot);
    this.auditTrail.push(`session_saved:${session.sessionId}@${session.startedAt}`);
    return snapshot;
  }

  getSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    return session ? this.cloneSession(session) : null;
  }

  listSessions() {
    return [...this.sessions.values()]
      .map((s) => this.cloneSession(s))
      .sort((a, b) => a.sessionId.localeCompare(b.sessionId));
  }

  updateSession(sessionId: string, patch: Partial<CollaborationSession>) {
    const existing = this.sessions.get(sessionId);
    if (!existing) return null;
    const updated: CollaborationSession = {
      ...existing,
      ...patch,
      participants: patch.participants ? [...patch.participants] : [...existing.participants],
      structuralSignalOnly: true,
      fabricated: false,
    };
    this.sessions.set(sessionId, updated);
    this.auditTrail.push(`session_updated:${sessionId}@${new Date().toISOString()}`);
    return this.cloneSession(updated);
  }

  saveDelivery(delivery: DeliveryRecord) {
    const snapshot = this.cloneDelivery(delivery);
    this.deliveries.push(snapshot);
    this.auditTrail.push(`delivery_saved:${delivery.deliveryId}@${delivery.timestamp}`);
    return snapshot;
  }

  listDeliveries() {
    return this.deliveries.map((d) => this.cloneDelivery(d));
  }

  listFailedDeliveries() {
    return this.listDeliveries().filter(
      (d) => d.status === "failed" || d.status === "dead_lettered",
    );
  }

  saveReport(report: CommunicationRuntimeReport) {
    this.reports.push({
      ...report,
      activeCommunicationChannels: report.activeCommunicationChannels.map((c) =>
        this.cloneChannel(c),
      ),
      failedDeliveries: report.failedDeliveries.map((d) => this.cloneDelivery(d)),
      collaborationSessions: report.collaborationSessions.map((s) => this.cloneSession(s)),
      supportingEvidence: [...report.supportingEvidence],
      outstandingIssues: [...report.outstandingIssues],
      runtimeHealth: {
        ...report.runtimeHealth,
        notes: [...report.runtimeHealth.notes],
      },
    });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
    return report;
  }

  listReports() {
    return this.reports.map((r) => ({ ...r }));
  }

  getAuditTrail() {
    return [...this.auditTrail];
  }

  getHistory() {
    return {
      messages: this.listMessages(),
      messageHistory: this.messageHistory.map((m) => this.cloneMessage(m)),
      channels: this.listChannels(),
      sessions: this.listSessions(),
      deliveries: this.listDeliveries(),
      reports: this.listReports(),
    };
  }

  private cloneMessage(message: CommunicationMessage): CommunicationMessage {
    return {
      ...message,
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneChannel(channel: CommunicationChannel): CommunicationChannel {
    return {
      ...channel,
      participants: [...channel.participants],
      structuralSignalOnly: true,
      fabricated: false,
    };
  }

  private cloneSession(session: CollaborationSession): CollaborationSession {
    return {
      ...session,
      participants: [...session.participants],
      structuralSignalOnly: true,
      fabricated: false,
    };
  }

  private cloneDelivery(delivery: DeliveryRecord): DeliveryRecord {
    return {
      ...delivery,
      structuralSignalOnly: true,
      fabricated: false,
    };
  }
}
