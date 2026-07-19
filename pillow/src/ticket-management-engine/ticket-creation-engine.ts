/** R4-09 — Ticket creation engine. */

import type { TicketManagementEngineConfiguration } from "./configuration.js";
import type { TicketRecord } from "./types.js";
import type { TicketRegistry } from "./ticket-registry.js";
import { TicketMetadataGenerator } from "./ticket-metadata-generator.js";

export class TicketCreationEngine {
  private readonly metadataGenerator = new TicketMetadataGenerator();

  createTicket(
    registry: TicketRegistry,
    config: TicketManagementEngineConfiguration,
    input: {
      customerId: string;
      subject: string;
      description: string;
      conversationReference?: string;
    },
  ): { ticket: TicketRecord | null; error: string | null } {
    if (!input.customerId?.trim()) {
      return { ticket: null, error: "Customer ID is required" };
    }
    if (!input.subject?.trim() && !input.description?.trim()) {
      return { ticket: null, error: "Subject or description is required" };
    }

    const createKey = `tkt:${input.customerId}:${input.subject.slice(0, 50)}:${input.description.slice(0, 50)}`;
    if (config.duplicateDetectionEnabled && registry.hasCreateKey(createKey)) {
      return { ticket: null, error: "Duplicate ticket detected" };
    }

    const conversationReference =
      input.conversationReference ?? `conv-${input.customerId}-${Date.now()}`;

    const ticket = this.metadataGenerator.buildTicketRecord({
      customerId: input.customerId,
      conversationReference,
    });

    registry.storeRecord(ticket, createKey);
    registry.storeTicketText(ticket.ticketId, input.subject, input.description);
    registry.appendStatusHistory(ticket.ticketId, "open");

    return { ticket, error: null };
  }
}
