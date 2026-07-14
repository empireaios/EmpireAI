/** T4-02 — Connects transcribed voice text to T4-01 Natural UX Conversation. */

import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { ConversationRunReport } from "../natural-ux-conversation/types.js";
import { appendVoiceCommandLog } from "./voice-command-logging.js";

export type ConversationLinkResult = {
  linked: boolean;
  conversationRunId: string | null;
  intentId: string | null;
  report: ConversationRunReport | null;
  error: string | null;
};

/**
 * Forwards transcribed voice text into Natural UX Conversation.
 * Safety: interpretation only — never applies, approves, or executes builder changes.
 */
export class NaturalUxConversationConnector {
  connect(input: {
    transcribedText: string;
    sessionId?: string;
    naturalUxConversation: NaturalUxConversationEngine | null;
  }): ConversationLinkResult {
    if (!input.naturalUxConversation) {
      appendVoiceCommandLog({
        event: "conversation_link",
        level: "warn",
        details: "Natural UX Conversation unavailable",
      });
      return {
        linked: false,
        conversationRunId: null,
        intentId: null,
        report: null,
        error: "Natural UX Conversation engine not available",
      };
    }

    try {
      const report = input.naturalUxConversation.converse(
        input.transcribedText,
        input.sessionId,
      );
      const turn = report.latestTurn;
      appendVoiceCommandLog({
        event: "conversation_link",
        level: "info",
        details: `Linked voice → NUC turn ${turn?.conversationId ?? "none"}`,
      });
      return {
        linked: true,
        conversationRunId: report.conversationRunReportId,
        intentId: turn?.conversationId ?? null,
        report,
        error: null,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Conversation link failed";
      appendVoiceCommandLog({
        event: "conversation_link",
        level: "error",
        details: message,
      });
      return {
        linked: false,
        conversationRunId: null,
        intentId: null,
        report: null,
        error: message,
      };
    }
  }
}
