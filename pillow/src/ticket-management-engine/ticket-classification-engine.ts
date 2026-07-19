/** R4-09 — Ticket classification engine. */

import type { TicketManagementEngineConfiguration } from "./configuration.js";
import type { TicketCategory } from "./types.js";

export class TicketClassificationEngine {
  classifyCategory(
    text: string,
    config: TicketManagementEngineConfiguration,
  ): TicketCategory {
    const normalized = text.toLowerCase().trim();
    if (!normalized) return "general";

    if (config.classificationRulesEnabled) {
      for (const rule of config.classificationRules) {
        if (!rule.enabled) continue;
        if (rule.keywords.some((kw) => normalized.includes(kw.toLowerCase()))) {
          return rule.category;
        }
      }
    }

    return "general";
  }
}
