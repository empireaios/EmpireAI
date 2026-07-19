/** R4-09 — Ticket workflow engine. */

import type { TicketManagementEngineConfiguration } from "./configuration.js";
import type { ResolutionStatus, TicketRecord, TicketStatus } from "./types.js";
import type { TicketRegistry } from "./ticket-registry.js";

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["assigned", "in_progress", "pending", "failed"],
  assigned: ["in_progress", "pending", "resolved", "failed"],
  in_progress: ["pending", "resolved", "failed"],
  pending: ["in_progress", "resolved", "failed"],
  resolved: ["closed"],
  closed: [],
  failed: ["open", "assigned"],
};

export class TicketWorkflowEngine {
  canTransition(current: TicketStatus, next: TicketStatus): boolean {
    return VALID_TRANSITIONS[current]?.includes(next) ?? false;
  }

  updateLifecycle(
    registry: TicketRegistry,
    config: TicketManagementEngineConfiguration,
    ticket: TicketRecord,
    input: { status: TicketStatus; resolutionStatus?: ResolutionStatus },
  ): { ticket: TicketRecord | null; error: string | null } {
    if (!this.canTransition(ticket.currentStatus, input.status)) {
      return {
        ticket: null,
        error: `Invalid transition from ${ticket.currentStatus} to ${input.status}`,
      };
    }

    if (
      config.validationRulesEnabled &&
      (input.status === "closed" || input.status === "resolved") &&
      ticket.validationStatus === "failed"
    ) {
      return {
        ticket: null,
        error: "Cannot close ticket without passing validation",
      };
    }

    const resolutionStatus =
      input.resolutionStatus ??
      (input.status === "resolved" || input.status === "closed"
        ? "resolved"
        : input.status === "failed"
          ? "failed"
          : input.status === "in_progress"
            ? "in_progress"
            : ticket.resolutionStatus);

    const updated: TicketRecord = {
      ...ticket,
      timestamp: new Date().toISOString(),
      currentStatus: input.status,
      resolutionStatus,
    };

    registry.storeRecord(updated);
    registry.appendStatusHistory(ticket.ticketId, input.status);

    return { ticket: updated, error: null };
  }

  isOverdue(ticket: TicketRecord, config: TicketManagementEngineConfiguration): boolean {
    if (ticket.currentStatus === "closed" || ticket.currentStatus === "resolved") {
      return false;
    }
    const created = new Date(ticket.timestamp).getTime();
    const thresholdMs = config.overdueThresholdHours * 60 * 60 * 1000;
    return Date.now() - created > thresholdMs;
  }

  isStalled(ticket: TicketRecord, registry: TicketRegistry, config: TicketManagementEngineConfiguration): boolean {
    if (ticket.currentStatus === "closed" || ticket.currentStatus === "resolved") {
      return false;
    }
    const history = registry.getStatusHistory(ticket.ticketId);
    const lastChange =
      history.length > 0 ? history[history.length - 1]! : `${ticket.timestamp}|open`;
    const [lastTimestamp = ticket.timestamp] = lastChange.split("|");
    const lastChangeMs = new Date(lastTimestamp).getTime();
    const thresholdMs = config.stalledThresholdHours * 60 * 60 * 1000;
    return Date.now() - lastChangeMs > thresholdMs;
  }
}
