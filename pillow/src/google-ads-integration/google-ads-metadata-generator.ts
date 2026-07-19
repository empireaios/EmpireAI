/** R5-03 — Google Ads Metadata Generator. */

import { GAI_CAPABILITIES, GAI_METADATA_VERSION, GOOGLE_ADS_INTEGRATION_ID } from "./paths.js";
import type {
  AuthenticationStatus,
  ConnectionStatus,
  GoogleAdsRecord,
  GoogleAdsRunReport,
  GoogleAuthResult,
  GoogleConnectionTestResult,
  GoogleAdsEngineRecord,
  GoogleAdsValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class GoogleAdsMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    auth: GoogleAuthResult;
    connection: GoogleConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
    customerAccountId: string | null;
    advertisingAccountId: string | null;
  }): GoogleAdsEngineRecord {
    return {
      engineRecordId: `gai-${GOOGLE_ADS_INTEGRATION_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      integrationId: GOOGLE_ADS_INTEGRATION_ID,
      integrationVersion: GAI_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedCapabilities: [...GAI_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      metadataVersion: GAI_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkModuleId: input.frameworkModuleId,
      customerAccountId: input.customerAccountId,
      advertisingAccountId: input.advertisingAccountId,
    };
  }

  buildRunReport(input: {
    action: GoogleAdsRunReport["action"];
    engineRecord: GoogleAdsEngineRecord;
    googleAdsRecords: GoogleAdsRecord[];
    validation: GoogleAdsValidationReport;
    durationMs: number;
  }): GoogleAdsRunReport {
    return {
      googleAdsRunReportId: `gai-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      googleAdsRecords: input.googleAdsRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: GAI_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(
  auth: GoogleAuthResult,
  connection: GoogleConnectionTestResult | null,
): ValidationStatus {
  if (!auth.authenticated) return "failed";
  if (connection && !connection.passed) return "failed";
  if (auth.authenticationStatus === "authenticated" && connection?.passed) return "passed";
  return "partial";
}

export type { AuthenticationStatus, ConnectionStatus };
