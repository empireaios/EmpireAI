/** R4-09 — Ticket metadata generator. */

import {
  TME_CAPABILITIES,
  TME_METADATA_VERSION,
  TICKET_MANAGEMENT_ENGINE_ID,
} from "./paths.js";
import type {
  EngineState,
  ResolutionStatus,
  TicketCategory,
  TicketEngineRecord,
  TicketFailure,
  TicketPriority,
  TicketRecord,
  TicketRunReport,
  TicketStatus,
  TicketValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildTicketEngineRecordId(): string {
  return `tme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildTicketRunReportId(): string {
  return `tme-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildTicketId(): string {
  return `tme-tkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildTicketFailureId(): string {
  return `tme-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class TicketMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    identityEngineConnected: boolean;
    crmFoundationConnected: boolean;
    timelineEngineConnected: boolean;
    liveChatIntegrationConnected: boolean;
    aiCustomerSupportConnected: boolean;
  }): TicketEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildTicketEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: TICKET_MANAGEMENT_ENGINE_ID,
      engineVersion: TME_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...TME_CAPABILITIES],
      identityEngineConnected: input.identityEngineConnected,
      crmFoundationConnected: input.crmFoundationConnected,
      timelineEngineConnected: input.timelineEngineConnected,
      liveChatIntegrationConnected: input.liveChatIntegrationConnected,
      aiCustomerSupportConnected: input.aiCustomerSupportConnected,
      metadataVersion: TME_METADATA_VERSION,
    };
  }

  buildTicketRecord(input: {
    customerId: string;
    conversationReference: string;
    ticketCategory?: TicketCategory;
    ticketPriority?: TicketPriority;
    assignedOwner?: string | null;
    currentStatus?: TicketStatus;
    resolutionStatus?: ResolutionStatus;
    relatedTimelineReference?: string | null;
    validationStatus?: ValidationStatus;
  }): TicketRecord {
    return {
      ticketId: buildTicketId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      conversationReference: input.conversationReference,
      ticketCategory: input.ticketCategory ?? "general",
      ticketPriority: input.ticketPriority ?? "medium",
      assignedOwner: input.assignedOwner ?? null,
      currentStatus: input.currentStatus ?? "open",
      resolutionStatus: input.resolutionStatus ?? "unresolved",
      relatedTimelineReference: input.relatedTimelineReference ?? null,
      validationStatus: input.validationStatus ?? "passed",
      metadataVersion: TME_METADATA_VERSION,
    };
  }

  buildFailure(
    ticketId: string | null,
    reason: string,
    severity: TicketFailure["severity"],
  ): TicketFailure {
    return {
      failureId: buildTicketFailureId(),
      timestamp: new Date().toISOString(),
      ticketId,
      reason,
      severity,
      metadataVersion: TME_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: TicketRunReport["action"];
    engineRecord: TicketEngineRecord;
    ticketRecords: TicketRecord[];
    failures: TicketFailure[];
    validation: TicketValidationReport;
    durationMs: number;
  }): TicketRunReport {
    return {
      ticketRunReportId: buildTicketRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      ticketRecords: input.ticketRecords,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: TME_METADATA_VERSION,
    };
  }
}
