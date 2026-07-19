/** R1-09 — TikTok Shop connector metadata generator. */

import { TIKTOK_SHOP_CAPABILITIES, TIKTOK_SHOP_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type {
  TikTokShopAuthResult,
  TikTokShopConnectionTestResult,
  TikTokShopConnectorRecord,
  TikTokShopConnectorRunReport,
  TikTokShopValidationReport,
  AuthenticationStatus,
  ConnectionStatus,
  OperationalState,
  SessionStatus,
  ValidationStatus,
} from "./types.js";

export function buildTikTokShopConnectorId(): string {
  return `tts-${Date.now()}`;
}

export function buildTikTokShopRunReportId(): string {
  return `tts-run-${Date.now()}`;
}

export class TikTokShopConnectorMetadataGenerator {
  buildRecord(input: {
    frameworkConnectorId: string | null;
    shopId: string | null;
    auth: TikTokShopAuthResult;
    connection: TikTokShopConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
  }): TikTokShopConnectorRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      connectorId: buildTikTokShopConnectorId(),
      shopId: input.shopId,
      timestamp: new Date().toISOString(),
      marketplaceIdentifier: "tiktok-shop",
      connectorVersion: TIKTOK_SHOP_CONNECTOR_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      apiSessionStatus: input.auth.sessionStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedTikTokShopCapabilities: [...TIKTOK_SHOP_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      metadataVersion: TIKTOK_SHOP_CONNECTOR_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkConnectorId: input.frameworkConnectorId,
    };
  }

  buildRunReport(input: {
    action: TikTokShopConnectorRunReport["action"];
    record: TikTokShopConnectorRecord;
    validation: TikTokShopValidationReport;
    durationMs: number;
  }): TikTokShopConnectorRunReport {
    return {
      connectorRunReportId: buildTikTokShopRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      record: input.record,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: TIKTOK_SHOP_CONNECTOR_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(auth: TikTokShopAuthResult): ValidationStatus {
  return auth.authenticated ? "passed" : "failed";
}

export function mapConnectionToStatus(conn: TikTokShopConnectionTestResult): ConnectionStatus {
  return conn.passed ? "connected" : "failed";
}

export function mapSessionStatus(session: SessionStatus): SessionStatus {
  return session;
}

export function mapAuthenticationStatus(status: AuthenticationStatus): AuthenticationStatus {
  return status;
}
