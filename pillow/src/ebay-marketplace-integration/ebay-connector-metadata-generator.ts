/** R1-08 — eBay connector metadata generator. */

import { EBAY_CAPABILITIES, EBAY_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type {
  EbayAuthResult,
  EbayConnectionTestResult,
  EbayConnectorRecord,
  EbayConnectorRunReport,
  EbayValidationReport,
  AuthenticationStatus,
  ConnectionStatus,
  OperationalState,
  SessionStatus,
  ValidationStatus,
} from "./types.js";

export function buildEbayConnectorId(): string {
  return `ebay-${Date.now()}`;
}

export function buildEbayRunReportId(): string {
  return `ebay-run-${Date.now()}`;
}

export class EbayConnectorMetadataGenerator {
  buildRecord(input: {
    frameworkConnectorId: string | null;
    auth: EbayAuthResult;
    connection: EbayConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
  }): EbayConnectorRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      connectorId: buildEbayConnectorId(),
      timestamp: new Date().toISOString(),
      marketplaceIdentifier: "ebay",
      connectorVersion: EBAY_CONNECTOR_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      apiSessionStatus: input.auth.sessionStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedEbayCapabilities: [...EBAY_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      metadataVersion: EBAY_CONNECTOR_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkConnectorId: input.frameworkConnectorId,
    };
  }

  buildRunReport(input: {
    action: EbayConnectorRunReport["action"];
    record: EbayConnectorRecord;
    validation: EbayValidationReport;
    durationMs: number;
  }): EbayConnectorRunReport {
    return {
      connectorRunReportId: buildEbayRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      record: input.record,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: EBAY_CONNECTOR_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(auth: EbayAuthResult): ValidationStatus {
  return auth.authenticated ? "passed" : "failed";
}

export function mapConnectionToStatus(conn: EbayConnectionTestResult): ConnectionStatus {
  return conn.passed ? "connected" : "failed";
}

export function mapSessionStatus(session: SessionStatus): SessionStatus {
  return session;
}

export function mapAuthenticationStatus(status: AuthenticationStatus): AuthenticationStatus {
  return status;
}
