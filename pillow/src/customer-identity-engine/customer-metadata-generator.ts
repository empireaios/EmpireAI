/** R4-01 — Customer metadata generator. */

import {
  CIE_CAPABILITIES,
  CIE_METADATA_VERSION,
  CUSTOMER_IDENTITY_ENGINE_ID,
} from "./paths.js";
import type {
  CustomerIdentityEngineRecord,
  CustomerIdentityRecord,
  CustomerIdentityRunReport,
  DuplicateIdentityMatch,
  EngineState,
  IdentityValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildCustomerEngineRecordId(): string {
  return `cie-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCustomerIdentityRunReportId(): string {
  return `cie-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCustomerId(): string {
  return `cie-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildDuplicateMatchId(): string {
  return `cie-dup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class CustomerMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
  }): CustomerIdentityEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildCustomerEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: CUSTOMER_IDENTITY_ENGINE_ID,
      engineVersion: CIE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CIE_CAPABILITIES],
      metadataVersion: CIE_METADATA_VERSION,
    };
  }

  buildCustomerRecord(input: {
    customerName?: string | null;
    customerIdentifiers: CustomerIdentityRecord["customerIdentifiers"];
    contactReferences?: string[];
    marketplaceReferences?: string[];
    communicationReferences?: string[];
    identityStatus?: CustomerIdentityRecord["identityStatus"];
    validationStatus?: ValidationStatus;
  }): CustomerIdentityRecord {
    return {
      customerId: buildCustomerId(),
      timestamp: new Date().toISOString(),
      customerIdentifiers: input.customerIdentifiers,
      customerName: input.customerName ?? null,
      contactReferences: input.contactReferences ?? [],
      marketplaceReferences: input.marketplaceReferences ?? [],
      communicationReferences: input.communicationReferences ?? [],
      identityStatus: input.identityStatus ?? "active",
      validationStatus: input.validationStatus ?? "passed",
      metadataVersion: CIE_METADATA_VERSION,
    };
  }

  buildDuplicateMatch(input: {
    customerId: string;
    matchedCustomerId: string;
    matchReason: string;
    confidenceScore: number;
  }): DuplicateIdentityMatch {
    return {
      matchId: buildDuplicateMatchId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      matchedCustomerId: input.matchedCustomerId,
      matchReason: input.matchReason,
      confidenceScore: input.confidenceScore,
      metadataVersion: CIE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: CustomerIdentityRunReport["action"];
    engineRecord: CustomerIdentityEngineRecord;
    customerRecords: CustomerIdentityRecord[];
    duplicateMatches: DuplicateIdentityMatch[];
    validation: IdentityValidationReport;
    durationMs: number;
  }): CustomerIdentityRunReport {
    return {
      identityRunReportId: buildCustomerIdentityRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      customerRecords: input.customerRecords,
      duplicateMatches: input.duplicateMatches,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CIE_METADATA_VERSION,
    };
  }
}
