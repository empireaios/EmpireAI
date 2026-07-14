/** R1-02 — Amazon connector metadata generator. */

import { AMAZON_CAPABILITIES, AMAZON_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type {
  AmazonAuthResult,
  AmazonConnectionTestResult,
  AmazonConnectorRecord,
  AmazonConnectorRunReport,
  AmazonValidationReport,
  AuthenticationStatus,
  ConnectionStatus,
  OperationalState,
  SessionStatus,
  ValidationStatus,
} from "./types.js";

export function buildAmazonConnectorId(): string {
  return `amz-${Date.now()}`;
}

export function buildAmazonRunReportId(): string {
  return `amz-run-${Date.now()}`;
}

export class AmazonConnectorMetadataGenerator {
  buildRecord(input: {
    frameworkConnectorId: string | null;
    auth: AmazonAuthResult;
    connection: AmazonConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
  }): AmazonConnectorRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      connectorId: buildAmazonConnectorId(),
      timestamp: new Date().toISOString(),
      marketplaceIdentifier: "amazon",
      connectorVersion: AMAZON_CONNECTOR_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      apiSessionStatus: input.auth.sessionStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedAmazonCapabilities: [...AMAZON_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      metadataVersion: AMAZON_CONNECTOR_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkConnectorId: input.frameworkConnectorId,
    };
  }

  buildRunReport(input: {
    action: AmazonConnectorRunReport["action"];
    record: AmazonConnectorRecord;
    validation: AmazonValidationReport;
    durationMs: number;
  }): AmazonConnectorRunReport {
    return {
      connectorRunReportId: buildAmazonRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      record: input.record,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: AMAZON_CONNECTOR_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(auth: AmazonAuthResult): ValidationStatus {
  return auth.authenticated ? "passed" : "failed";
}

export function mapConnectionToStatus(conn: AmazonConnectionTestResult): ConnectionStatus {
  return conn.passed ? "connected" : "failed";
}

export function mapSessionStatus(session: SessionStatus): SessionStatus {
  return session;
}

export function mapAuthenticationStatus(status: AuthenticationStatus): AuthenticationStatus {
  return status;
}
