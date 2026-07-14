/** T5-07 — Evolution history management. */

import { randomUUID } from "node:crypto";
import { UX_EVOLUTION_METADATA_VERSION } from "./paths.js";
import type { EvolutionHistoryEntry, RawEvolutionCandidate } from "./types.js";

export class EvolutionHistoryManager {
  private history: EvolutionHistoryEntry[] = [];

  recordEntries(input: {
    sessionId: string;
    candidates: RawEvolutionCandidate[];
    maxEntries: number;
  }): EvolutionHistoryEntry[] {
    const now = new Date().toISOString();
    const entries = input.candidates.map((candidate) => ({
      historyId: `cue-history-${randomUUID()}`,
      sessionId: input.sessionId,
      recordedAt: now,
      evolutionCategory: candidate.evolutionCategory,
      improvementSummary: candidate.recommendedUxImprovements[0] ?? "UX improvement",
      confidenceScore: candidate.confidenceScore,
      metadataVersion: UX_EVOLUTION_METADATA_VERSION,
    }));

    this.history.push(...entries);
    if (this.history.length > input.maxEntries) {
      this.history = this.history.slice(-input.maxEntries);
    }
    return entries;
  }

  getHistory(): EvolutionHistoryEntry[] {
    return [...this.history];
  }

  resetForTesting(): void {
    this.history = [];
  }
}
