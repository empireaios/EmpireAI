/** T4-09 — Maintains collaboration memory across sessions. */

import type { CollaborationSessionRecord } from "./types.js";
import type { ContinuousCollaborationConfiguration } from "./configuration.js";
import { appendCollaborationLog } from "./collaboration-logging.js";

export class CollaborationMemoryManager {
  private memory: CollaborationSessionRecord | null = null;

  remember(session: CollaborationSessionRecord, config: ContinuousCollaborationConfiguration): void {
    if (!config.sessionPersistenceRulesEnabled) return;
    this.memory = { ...session };
    appendCollaborationLog({
      event: "context_restoration",
      level: "info",
      details: `Memory stored for session ${session.collaborationSessionId}`,
    });
  }

  recall(config: ContinuousCollaborationConfiguration): CollaborationSessionRecord | null {
    if (!config.contextRetentionRulesEnabled || !this.memory) return null;
    return { ...this.memory };
  }

  clear(): void {
    this.memory = null;
  }

  resetForTesting(): void {
    this.memory = null;
  }
}
