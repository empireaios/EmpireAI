import { KSB_METADATA_VERSION } from "./paths.js";
import type {
  KnowledgeCategory,
  KnowledgeRecord,
  KnowledgeSharingBusInput,
  KnowledgeSubscription,
  KnowledgeUsageEvent,
  PublicationStatus,
  ValidationStatus,
} from "./types.js";

/** Authoritative in-memory Knowledge Sharing Bus store — share/distribute only. */
export class KnowledgeStore {
  private records = new Map<string, KnowledgeRecord>();
  private subscriptions = new Map<string, KnowledgeSubscription>();
  private usage: KnowledgeUsageEvent[] = [];

  seed(records: KnowledgeRecord[]) {
    this.records.clear();
    this.subscriptions.clear();
    this.usage = [];
    for (const record of records) {
      this.records.set(record.knowledgeId, clone(record));
    }
  }

  count() {
    return this.records.size;
  }

  publishedCount() {
    return this.list().filter((r) => r.publicationStatus === "published").length;
  }

  archivedCount() {
    return this.list().filter((r) => r.publicationStatus === "archived").length;
  }

  subscriptionCount() {
    return this.subscriptions.size;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(knowledgeId: string) {
    const record = this.records.get(knowledgeId);
    return record ? clone(record) : null;
  }

  save(record: KnowledgeRecord) {
    this.records.set(record.knowledgeId, clone(record));
    return clone(record);
  }

  listPublished(category?: string | null) {
    return this.list().filter((r) => {
      if (r.publicationStatus !== "published") return false;
      if (!category) return true;
      return r.knowledgeCategory === category;
    });
  }

  subscribe(workerId: string, categories: string[]) {
    const id = workerId.trim();
    const existing = this.subscriptions.get(id);
    const merged = unique([...(existing?.categories ?? []), ...categories]);
    const subscription: KnowledgeSubscription = {
      workerId: id,
      categories: merged,
      subscribedAt: existing?.subscribedAt ?? new Date().toISOString(),
    };
    this.subscriptions.set(id, subscription);
    return { ...subscription, categories: [...subscription.categories] };
  }

  getSubscriptions() {
    return [...this.subscriptions.values()].map((s) => ({
      ...s,
      categories: [...s.categories],
    }));
  }

  trackUsage(workerId: string, knowledgeId: string) {
    const event: KnowledgeUsageEvent = {
      workerId: workerId.trim(),
      knowledgeId,
      retrievedAt: new Date().toISOString(),
    };
    this.usage.push(event);
    const record = this.records.get(knowledgeId);
    if (record) {
      record.usageCount += 1;
      this.records.set(knowledgeId, clone(record));
    }
    return event;
  }

  getUsage() {
    return this.usage.map((u) => ({ ...u }));
  }

  buildRecord(params: {
    input: KnowledgeSharingBusInput;
    category: KnowledgeCategory | string;
    title: string;
    summary: string;
    confidenceScore: number;
    version: string;
    publicationStatus: PublicationStatus;
    classificationLabels: string[];
    evidence: string[];
    playbooks: string[];
    validationStatus: ValidationStatus;
    versionHistory?: string[];
    subscribers?: string[];
    usageCount?: number;
    knowledgeId?: string;
  }): KnowledgeRecord {
    knowledgeSequence += 1;
    const knowledgeId =
      params.knowledgeId?.trim() ||
      params.input.knowledgeId?.trim() ||
      `ksb-kn-${Date.now()}-${knowledgeSequence}`;
    const record: KnowledgeRecord = {
      knowledgeId,
      timestamp: new Date().toISOString(),
      sourceWorker: params.input.sourceWorker?.trim() || "worker-unspecified",
      businessId: params.input.businessId?.trim() || "biz-unspecified",
      missionId: params.input.missionId?.trim() || "mission-unspecified",
      knowledgeCategory: params.category,
      knowledgeTitle: params.title,
      knowledgeSummary: params.summary,
      supportingEvidence: unique(params.evidence),
      relatedPlaybooks: unique(params.playbooks),
      confidenceScore: params.confidenceScore,
      version: params.version,
      publicationStatus: params.publicationStatus,
      metadataVersion: KSB_METADATA_VERSION,
      knowledgeTraceId: `ksb-trace-${Date.now()}-${knowledgeSequence}`,
      validationStatus: params.validationStatus,
      classificationLabels: unique(params.classificationLabels),
      usageCount: params.usageCount ?? 0,
      subscribers: unique(params.subscribers ?? []),
      versionHistory: unique(params.versionHistory ?? [params.version]),
      neverExecuteWorkerTasks: true,
      neverReplaceExecutionMemory: true,
      neverReplaceDecisionMemory: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerTasksExecuted: false,
      executionMemoryReplaced: false,
      decisionMemoryReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveKnowledgeTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let knowledgeSequence = 0;

export function resetKnowledgeSequenceForTesting() {
  knowledgeSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clone(record: KnowledgeRecord): KnowledgeRecord {
  return {
    ...record,
    supportingEvidence: [...record.supportingEvidence],
    relatedPlaybooks: [...record.relatedPlaybooks],
    classificationLabels: [...record.classificationLabels],
    subscribers: [...record.subscribers],
    versionHistory: [...record.versionHistory],
  };
}
