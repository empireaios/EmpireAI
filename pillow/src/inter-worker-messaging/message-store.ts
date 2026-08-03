import { IWM_METADATA_VERSION } from "./paths.js";
import type {
  DeliveryStatus,
  InterWorkerMessagingInput,
  MessagePriority,
  MessageRecord,
  MessageType,
  ValidationStatus,
} from "./types.js";

/** Authoritative in-memory Inter-Worker Messaging store — transport only. */
export class MessageStore {
  private records = new Map<string, MessageRecord>();
  private inbox = new Map<string, string[]>();

  seed(records: MessageRecord[]) {
    this.records.clear();
    this.inbox.clear();
    for (const record of records) {
      this.records.set(record.messageId, clone(record));
      this.pushInbox(record.receiverWorker, record.messageId);
    }
  }

  count() {
    return this.records.size;
  }

  deliveredCount() {
    return this.list().filter(
      (r) =>
        r.deliveryStatus === "delivered" ||
        r.deliveryStatus === "read" ||
        r.deliveryStatus === "acknowledged",
    ).length;
  }

  failedCount() {
    return this.list().filter(
      (r) => r.deliveryStatus === "failed" || r.deliveryStatus === "expired",
    ).length;
  }

  conversationCount() {
    return new Set(this.list().map((r) => r.conversationId)).size;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(messageId: string) {
    const record = this.records.get(messageId);
    return record ? clone(record) : null;
  }

  save(record: MessageRecord) {
    this.records.set(record.messageId, clone(record));
    return clone(record);
  }

  receiveFor(workerId: string) {
    const ids = this.inbox.get(workerId.trim()) ?? [];
    return ids
      .map((id) => this.get(id))
      .filter((r): r is MessageRecord => !!r);
  }

  search(params: {
    query?: string | null;
    missionId?: string | null;
    businessId?: string | null;
    conversationId?: string | null;
  }) {
    const q = params.query?.trim().toLowerCase() ?? "";
    return this.list().filter((r) => {
      if (params.missionId && r.missionId !== params.missionId) return false;
      if (params.businessId && r.businessId !== params.businessId) return false;
      if (params.conversationId && r.conversationId !== params.conversationId) return false;
      if (!q) return true;
      return (
        r.messageSummary.toLowerCase().includes(q) ||
        r.senderWorker.toLowerCase().includes(q) ||
        r.receiverWorker.toLowerCase().includes(q) ||
        r.messageType.toString().toLowerCase().includes(q) ||
        r.payloadReference.toLowerCase().includes(q) ||
        r.messageId.toLowerCase().includes(q)
      );
    });
  }

  buildRecord(params: {
    input: InterWorkerMessagingInput;
    senderWorker: string;
    receiverWorker: string;
    businessId: string;
    missionId: string;
    conversationId: string;
    messageType: MessageType | string;
    priority: MessagePriority;
    messageSummary: string;
    payloadReference: string;
    deliveryStatus: DeliveryStatus;
    inReplyTo: string | null;
    isBroadcast: boolean;
    validationStatus: ValidationStatus;
    deliveryHistory?: DeliveryStatus[];
    messageId?: string;
  }): MessageRecord {
    messageSequence += 1;
    const messageId =
      params.messageId?.trim() ||
      params.input.messageId?.trim() ||
      `iwm-msg-${Date.now()}-${messageSequence}`;
    const history = uniqueStatuses([
      ...(params.deliveryHistory ?? []),
      params.deliveryStatus,
    ]);
    const record: MessageRecord = {
      messageId,
      timestamp: new Date().toISOString(),
      senderWorker: params.senderWorker,
      receiverWorker: params.receiverWorker,
      businessId: params.businessId,
      missionId: params.missionId,
      conversationId: params.conversationId,
      messageType: params.messageType,
      priority: params.priority,
      messageSummary: params.messageSummary,
      payloadReference: params.payloadReference,
      deliveryStatus: params.deliveryStatus,
      metadataVersion: IWM_METADATA_VERSION,
      messageTraceId: `iwm-trace-${Date.now()}-${messageSequence}`,
      validationStatus: params.validationStatus,
      inReplyTo: params.inReplyTo,
      isBroadcast: params.isBroadcast,
      deliveryHistory: history,
      neverExecuteWorkerLogic: true,
      neverModifyWorkerDecisions: true,
      neverReplaceWorkforceOrchestrator: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerLogicExecuted: false,
      workerDecisionsModified: false,
      workforceOrchestratorReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveMessageTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    this.save(record);
    this.pushInbox(record.receiverWorker, record.messageId);
    return clone(record);
  }

  updateDelivery(messageId: string, status: DeliveryStatus) {
    const existing = this.records.get(messageId);
    if (!existing) return null;
    existing.deliveryStatus = status;
    existing.deliveryHistory = uniqueStatuses([...existing.deliveryHistory, status]);
    this.records.set(messageId, clone(existing));
    return clone(existing);
  }

  private pushInbox(workerId: string, messageId: string) {
    const key = workerId.trim();
    if (!key) return;
    const list = this.inbox.get(key) ?? [];
    if (!list.includes(messageId)) list.push(messageId);
    this.inbox.set(key, list);
  }
}

let messageSequence = 0;

export function resetMessageSequenceForTesting() {
  messageSequence = 0;
}

function uniqueStatuses(values: DeliveryStatus[]) {
  const out: DeliveryStatus[] = [];
  for (const value of values) {
    if (!out.includes(value)) out.push(value);
  }
  return out;
}

function clone(record: MessageRecord): MessageRecord {
  return {
    ...record,
    deliveryHistory: [...record.deliveryHistory],
  };
}
