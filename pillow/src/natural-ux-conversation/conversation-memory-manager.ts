/** T4-01 — Conversation memory retention and history. */

import type { ConversationSession, ConversationTurn } from "./types.js";
import type { NaturalUxConversationConfiguration } from "./configuration.js";

export class ConversationMemoryManager {
  trimHistory(
    session: ConversationSession,
    config: NaturalUxConversationConfiguration,
  ): ConversationSession {
    const maxTurns = config.maxHistoryTurns;
    if (session.turns.length <= maxTurns) return session;

    const retained = session.turns.slice(-maxTurns);
    return {
      ...session,
      turns: retained,
      updatedAt: new Date().toISOString(),
    };
  }

  getRecentTurns(session: ConversationSession, limit = 5): ConversationTurn[] {
    return session.turns.slice(-limit);
  }

  summarizeHistory(session: ConversationSession): string {
    if (session.turns.length === 0) return "No prior conversation history";
    const recent = session.turns.slice(-3);
    return recent
      .map((t) => `${t.intentCategory} (${Math.round(t.confidenceScore * 100)}%)`)
      .join(" → ");
  }
}
