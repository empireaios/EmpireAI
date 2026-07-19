/** R4-09 — Ticket assignment engine. */

import type { TicketManagementEngineConfiguration } from "./configuration.js";
import type { TicketCategory, TicketPriority, TicketRecord } from "./types.js";
import type { TicketRegistry } from "./ticket-registry.js";

export class TicketAssignmentEngine {
  assignPriority(
    category: TicketCategory,
    config: TicketManagementEngineConfiguration,
  ): TicketPriority {
    if (config.priorityRulesEnabled) {
      for (const rule of config.priorityRules) {
        if (!rule.enabled) continue;
        if (rule.categories.includes(category)) {
          return rule.priority;
        }
      }
    }
    return "medium";
  }

  assignOwner(
    category: TicketCategory,
    registry: TicketRegistry,
    config: TicketManagementEngineConfiguration,
  ): { ownerId: string | null; error: string | null } {
    if (!config.assignmentRulesEnabled) {
      return { ownerId: "support-team", error: null };
    }

    const rule = config.assignmentRules.find(
      (r) => r.enabled && r.categories.includes(category),
    );
    const fallback = config.assignmentRules.find((r) => r.enabled && r.ruleId === "default_support");
    const selected = rule ?? fallback;
    if (!selected) {
      return { ownerId: null, error: "No assignment rule matched" };
    }

    const ownerTickets = registry
      .listRecords()
      .filter(
        (t) =>
          t.assignedOwner === selected.defaultOwner &&
          t.currentStatus !== "closed" &&
          t.currentStatus !== "resolved" &&
          t.currentStatus !== "failed",
      ).length;

    if (ownerTickets >= selected.maxTicketsPerOwner) {
      return {
        ownerId: null,
        error: `Owner ${selected.defaultOwner} at maximum ticket capacity`,
      };
    }

    return { ownerId: selected.defaultOwner, error: null };
  }

  applyOwnership(ticket: TicketRecord, ownerId: string): TicketRecord {
    return {
      ...ticket,
      timestamp: new Date().toISOString(),
      assignedOwner: ownerId,
      currentStatus: "assigned",
    };
  }

  applyPriority(ticket: TicketRecord, priority: TicketPriority): TicketRecord {
    return {
      ...ticket,
      timestamp: new Date().toISOString(),
      ticketPriority: priority,
    };
  }
}
