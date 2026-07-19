/** R5-04 — TikTok Ads Metadata Generator. */

import { TAI_CAPABILITIES, TAI_METADATA_VERSION, TIKTOK_ADS_INTEGRATION_ID } from "./paths.js";
import type {
  AuthenticationStatus,
  ConnectionStatus,
  TikTokAdsRecord,
  TikTokAdsRunReport,
  TikTokAuthResult,
  TikTokConnectionTestResult,
  TikTokAdsEngineRecord,
  TikTokAdsValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class TikTokAdsMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    auth: TikTokAuthResult;
    connection: TikTokConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
    advertiserAccountId: string | null;
  }): TikTokAdsEngineRecord {
    return {
      engineRecordId: `tai-${TIKTOK_ADS_INTEGRATION_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      integrationId: TIKTOK_ADS_INTEGRATION_ID,
      integrationVersion: TAI_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedCapabilities: [...TAI_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      metadataVersion: TAI_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkModuleId: input.frameworkModuleId,
      advertiserAccountId: input.advertiserAccountId,
    };
  }

  buildRunReport(input: {
    action: TikTokAdsRunReport["action"];
    engineRecord: TikTokAdsEngineRecord;
    tiktokAdsRecords: TikTokAdsRecord[];
    validation: TikTokAdsValidationReport;
    durationMs: number;
  }): TikTokAdsRunReport {
    return {
      tiktokAdsRunReportId: `tai-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      tiktokAdsRecords: input.tiktokAdsRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: TAI_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(
  auth: TikTokAuthResult,
  connection: TikTokConnectionTestResult | null,
): ValidationStatus {
  if (!auth.authenticated) return "failed";
  if (connection && !connection.passed) return "failed";
  if (auth.authenticationStatus === "authenticated" && connection?.passed) return "passed";
  return "partial";
}

export type { AuthenticationStatus, ConnectionStatus };
