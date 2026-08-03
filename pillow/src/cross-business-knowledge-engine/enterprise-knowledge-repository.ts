/** X2-04 — Enterprise knowledge repository. */

import { appendCbkLog } from "./cbk-logging.js";
import { CBK_METADATA_VERSION } from "./paths.js";
import type {
  CollectKnowledgeInput,
  KnowledgeCategory,
  KnowledgeRecord,
} from "./types.js";

function normalizeSummary(summary: string): string {
  return summary.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildIdentityKey(sourceCompany: string, summary: string, category: KnowledgeCategory): string {
  return `${sourceCompany.trim().toLowerCase()}::${category}::${normalizeSummary(summary)}`;
}

function clamp(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export class EnterpriseKnowledgeRepository {
  private records = new Map<string, KnowledgeRecord>();
  private identityIndex = new Map<string, string>();

  list(): KnowledgeRecord[] {
    return [...this.records.values()];
  }

  get(knowledgeRecordId: string): KnowledgeRecord | null {
    return this.records.get(knowledgeRecordId) ?? null;
  }

  findByIdentity(
    sourceCompany: string,
    summary: string,
    category: KnowledgeCategory,
  ): KnowledgeRecord | null {
    const key = buildIdentityKey(sourceCompany, summary, category);
    const id = this.identityIndex.get(key);
    return id ? (this.records.get(id) ?? null) : null;
  }

  findDuplicates(knowledgeRecordId?: string): KnowledgeRecord[] {
    if (knowledgeRecordId) {
      const target = this.records.get(knowledgeRecordId);
      if (!target) return [];
      return this.list().filter(
        (r) =>
          r.knowledgeRecordId !== knowledgeRecordId &&
          r.identityKey === target.identityKey,
      );
    }

    const seen = new Map<string, KnowledgeRecord[]>();
    for (const record of this.list()) {
      const bucket = seen.get(record.identityKey) ?? [];
      bucket.push(record);
      seen.set(record.identityKey, bucket);
    }
    return [...seen.values()].filter((b) => b.length > 1).flat();
  }

  collect(input: CollectKnowledgeInput): KnowledgeRecord {
    const category = input.knowledgeCategory ?? "general";
    const knowledgeRecordId = `cbk-kn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const identityKey = buildIdentityKey(input.sourceCompany, input.knowledgeSummary, category);

    const record: KnowledgeRecord = {
      knowledgeRecordId,
      timestamp: new Date().toISOString(),
      sourceCompany: input.sourceCompany.trim(),
      knowledgeCategory: category,
      knowledgeSummary: input.knowledgeSummary.trim(),
      reusabilityScore: clamp(input.reusabilityScore, 55),
      confidenceScore: clamp(input.confidenceScore, 60),
      distributionStatus: "local",
      validationStatus: "passed",
      metadataVersion: CBK_METADATA_VERSION,
      identityKey,
      sharedWith: [],
      structuralSignalOnly: true,
      confidentialContent: false,
      ranking: null,
    };

    this.records.set(knowledgeRecordId, record);
    this.identityIndex.set(identityKey, knowledgeRecordId);

    appendCbkLog({
      event: "knowledge_collection",
      level: "info",
      details: `Collected ${knowledgeRecordId} from ${record.sourceCompany} · ${category}`,
    });

    return record;
  }

  upsert(record: KnowledgeRecord): KnowledgeRecord {
    record.timestamp = new Date().toISOString();
    this.records.set(record.knowledgeRecordId, record);
    this.identityIndex.set(record.identityKey, record.knowledgeRecordId);
    return record;
  }

  sharedCount(): number {
    return this.list().filter((r) => r.distributionStatus === "shared").length;
  }

  resetForTesting(): void {
    this.records.clear();
    this.identityIndex.clear();
  }
}
