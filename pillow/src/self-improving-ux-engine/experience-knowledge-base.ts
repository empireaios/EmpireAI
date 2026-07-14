/** T5-09 — Experience knowledge base for accumulated UX learning. */

import { randomUUID } from "node:crypto";
import { UX_LEARNING_METADATA_VERSION } from "./paths.js";
import { appendLearningLog } from "./siux-logging.js";
import type { KnowledgeBaseEntry, RawLearningCandidate } from "./types.js";

export class ExperienceKnowledgeBase {
  private entries: KnowledgeBaseEntry[] = [];

  update(input: {
    candidates: RawLearningCandidate[];
    maxEntries: number;
  }): KnowledgeBaseEntry[] {
    const now = new Date().toISOString();
    const newEntries = input.candidates.map((candidate) => ({
      entryId: `siux-kb-${randomUUID()}`,
      recordedAt: now,
      learningCategory: candidate.learningCategory,
      insightSummary: candidate.learnedUxInsight,
      confidenceScore: candidate.confidenceScore,
      metadataVersion: UX_LEARNING_METADATA_VERSION,
    }));

    this.entries.push(...newEntries);
    if (this.entries.length > input.maxEntries) {
      this.entries = this.entries.slice(-input.maxEntries);
    }

    appendLearningLog({
      event: "knowledge_base_update",
      level: "info",
      details: `Knowledge base updated · ${this.entries.length} entries`,
    });

    return newEntries;
  }

  getEntries(): KnowledgeBaseEntry[] {
    return [...this.entries];
  }

  getSize(): number {
    return this.entries.length;
  }

  resetForTesting(): void {
    this.entries = [];
  }
}
