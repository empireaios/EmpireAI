/** R4-07 — Chat assignment engine. */

import type { LiveChatIntegrationConfiguration } from "./configuration.js";
import type { LiveChatRecord } from "./types.js";
import type { LiveChatRegistry } from "./live-chat-registry.js";

export class ChatAssignmentEngine {
  canAssign(
    registry: LiveChatRegistry,
    config: LiveChatIntegrationConfiguration,
    handlerId: string,
  ): { allowed: boolean; error: string | null } {
    if (!config.assignmentRulesEnabled) {
      return { allowed: true, error: null };
    }
    const rule = config.assignmentRules.find((r) => r.ruleId === "default_assignment");
    if (!rule?.enabled) return { allowed: true, error: null };

    const handlerSessions = registry
      .listSessions()
      .filter((s) => s.assignedHandler === handlerId && s.chatStatus !== "closed" && s.chatStatus !== "resolved")
      .length;
    if (handlerSessions >= rule.maxSessionsPerHandler) {
      return { allowed: false, error: `Handler ${handlerId} at maximum session capacity` };
    }
    return { allowed: true, error: null };
  }

  assign(session: LiveChatRecord, handlerId: string): LiveChatRecord {
    return {
      ...session,
      timestamp: new Date().toISOString(),
      assignedHandler: handlerId,
      chatStatus: "assigned",
    };
  }
}
