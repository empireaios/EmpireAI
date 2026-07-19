/** R5-02 — Meta Metadata Generator. */

import { MAI_CAPABILITIES, MAI_METADATA_VERSION, META_ADS_INTEGRATION_ID } from "./paths.js";
import type {
  AuthenticationStatus,
  ConnectionStatus,
  MetaAdsRecord,
  MetaAdsRunReport,
  MetaAuthResult,
  MetaConnectionTestResult,
  MetaEngineRecord,
  MetaValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class MetaMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    auth: MetaAuthResult;
    connection: MetaConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
    businessAccountId: string | null;
    adAccountId: string | null;
  }): MetaEngineRecord {
    return {
      engineRecordId: `mai-${META_ADS_INTEGRATION_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      integrationId: META_ADS_INTEGRATION_ID,
      integrationVersion: MAI_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedCapabilities: [...MAI_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      metadataVersion: MAI_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkModuleId: input.frameworkModuleId,
      businessAccountId: input.businessAccountId,
      adAccountId: input.adAccountId,
    };
  }

  buildRunReport(input: {
    action: MetaAdsRunReport["action"];
    engineRecord: MetaEngineRecord;
    metaRecords: MetaAdsRecord[];
    validation: MetaValidationReport;
    durationMs: number;
  }): MetaAdsRunReport {
    return {
      metaRunReportId: `mai-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      metaRecords: input.metaRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: MAI_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(
  auth: MetaAuthResult,
  connection: MetaConnectionTestResult | null,
): ValidationStatus {
  if (!auth.authenticated) return "failed";
  if (connection && !connection.passed) return "failed";
  if (auth.authenticationStatus === "authenticated" && connection?.passed) return "passed";
  return "partial";
}

export type { AuthenticationStatus, ConnectionStatus };
