/** T4-01 — Conversation metadata and ID generation. */

import type { ConversationTurn } from "./types.js";
import { CONVERSATION_METADATA_VERSION } from "./paths.js";

export class ConversationMetadataGenerator {
  buildConversationId(): string {
    return `nuc-conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildSessionId(): string {
    return `nuc-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRunReportId(): string {
    return `nuc-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `nuc-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildActionId(): string {
    return `nuc-action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildBuilderRequestId(): string {
    return `nuc-builder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildQuestionId(): string {
    return `nuc-q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichTurn(turn: ConversationTurn): ConversationTurn {
    return { ...turn, metadataVersion: CONVERSATION_METADATA_VERSION };
  }
}
