/** R4-02 — CRM metadata generator. */

import {
  CRM_CAPABILITIES,
  CRM_FOUNDATION_ID,
  CRM_METADATA_VERSION,
} from "./paths.js";
import type {
  CrmEngineRecord,
  CrmRecord,
  CrmRunReport,
  CrmSearchResult,
  CrmValidationReport,
  CustomerNote,
  EngineState,
  ValidationStatus,
} from "./types.js";

export function buildCrmEngineRecordId(): string {
  return `crm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCrmRunReportId(): string {
  return `crm-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCrmRecordId(): string {
  return `crm-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCrmSearchResultId(): string {
  return `crm-srch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCustomerNoteId(): string {
  return `crm-note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class CrmMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    identityEngineConnected: boolean;
  }): CrmEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildCrmEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: CRM_FOUNDATION_ID,
      engineVersion: CRM_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CRM_CAPABILITIES],
      identityEngineConnected: input.identityEngineConnected,
      metadataVersion: CRM_METADATA_VERSION,
    };
  }

  buildCrmRecord(input: {
    customerId: string;
    customerProfileReference: string;
    customerLifecycleStatus?: CrmRecord["customerLifecycleStatus"];
    customerOwner?: string | null;
    customerTags?: string[];
    customerAccountRefs?: string[];
    contactInformation?: CrmRecord["contactInformation"];
    customAttributes?: CrmRecord["customAttributes"];
    validationStatus?: ValidationStatus;
  }): CrmRecord {
    return {
      crmRecordId: buildCrmRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      customerProfileReference: input.customerProfileReference,
      customerLifecycleStatus: input.customerLifecycleStatus ?? "prospect",
      customerOwner: input.customerOwner ?? null,
      customerTags: input.customerTags ?? [],
      customerNotes: [],
      customAttributes: input.customAttributes ?? [],
      customerAccountRefs: input.customerAccountRefs ?? [],
      contactInformation: input.contactInformation ?? {
        email: null,
        phone: null,
        address: null,
      },
      validationStatus: input.validationStatus ?? "passed",
      metadataVersion: CRM_METADATA_VERSION,
    };
  }

  buildCustomerNote(input: { author: string; content: string }): CustomerNote {
    return {
      noteId: buildCustomerNoteId(),
      timestamp: new Date().toISOString(),
      author: input.author,
      content: input.content,
    };
  }

  buildSearchResult(input: {
    crmRecordId: string;
    customerId: string;
    matchReason: string;
    relevanceScore: number;
  }): CrmSearchResult {
    return {
      resultId: buildCrmSearchResultId(),
      timestamp: new Date().toISOString(),
      crmRecordId: input.crmRecordId,
      customerId: input.customerId,
      matchReason: input.matchReason,
      relevanceScore: input.relevanceScore,
      metadataVersion: CRM_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: CrmRunReport["action"];
    engineRecord: CrmEngineRecord;
    crmRecords: CrmRecord[];
    searchResults: CrmSearchResult[];
    validation: CrmValidationReport;
    durationMs: number;
  }): CrmRunReport {
    return {
      crmRunReportId: buildCrmRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      crmRecords: input.crmRecords,
      searchResults: input.searchResults,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CRM_METADATA_VERSION,
    };
  }
}
