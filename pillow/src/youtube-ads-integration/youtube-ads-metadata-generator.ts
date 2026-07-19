/** R5-05 — YouTube Ads Metadata Generator. */

import { YAI_CAPABILITIES, YAI_METADATA_VERSION, YOUTUBE_ADS_INTEGRATION_ID } from "./paths.js";
import type {
  AuthenticationStatus,
  ConnectionStatus,
  YouTubeAdsRecord,
  YouTubeAdsRunReport,
  GoogleAuthResult,
  YouTubeConnectionTestResult,
  YouTubeAdsEngineRecord,
  YouTubeAdsValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class YouTubeAdsMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    auth: GoogleAuthResult;
    connection: YouTubeConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
    googleAdsDependencyPresent: boolean;
    advertiserAccountId: string | null;
  }): YouTubeAdsEngineRecord {
    return {
      engineRecordId: `yai-${YOUTUBE_ADS_INTEGRATION_ID}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      integrationId: YOUTUBE_ADS_INTEGRATION_ID,
      integrationVersion: YAI_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedCapabilities: [...YAI_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus:
        input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy",
      validationStatus: input.validationStatus,
      metadataVersion: YAI_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkModuleId: input.frameworkModuleId,
      googleAdsDependencyPresent: input.googleAdsDependencyPresent,
      advertiserAccountId: input.advertiserAccountId,
    };
  }

  buildRunReport(input: {
    action: YouTubeAdsRunReport["action"];
    engineRecord: YouTubeAdsEngineRecord;
    youtubeAdsRecords: YouTubeAdsRecord[];
    validation: YouTubeAdsValidationReport;
    durationMs: number;
  }): YouTubeAdsRunReport {
    return {
      youtubeAdsRunReportId: `yai-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      youtubeAdsRecords: input.youtubeAdsRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: YAI_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(
  auth: GoogleAuthResult,
  connection: YouTubeConnectionTestResult | null,
): ValidationStatus {
  if (!auth.authenticated) return "failed";
  if (connection && !connection.passed) return "failed";
  if (auth.authenticationStatus === "authenticated" && connection?.passed) return "passed";
  return "partial";
}

export type { AuthenticationStatus, ConnectionStatus };
