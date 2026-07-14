/** R1-07 — Etsy connector metadata generator. */

import { ETSY_CAPABILITIES, ETSY_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type {
  EtsyAuthResult,
  EtsyConnectionTestResult,
  EtsyConnectorRecord,
  EtsyConnectorRunReport,
  EtsyValidationReport,
  AuthenticationStatus,
  ConnectionStatus,
  OperationalState,
  SessionStatus,
  ValidationStatus,
} from "./types.js";

export function buildEtsyConnectorId(): string {
  return `etsy-${Date.now()}`;
}

export function buildEtsyRunReportId(): string {
  return `etsy-run-${Date.now()}`;
}

export class EtsyConnectorMetadataGenerator {
  buildRecord(input: {
    frameworkConnectorId: string | null;
    auth: EtsyAuthResult;
    connection: EtsyConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
  }): EtsyConnectorRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      connectorId: buildEtsyConnectorId(),
      timestamp: new Date().toISOString(),
      marketplaceIdentifier: "etsy",
      connectorVersion: ETSY_CONNECTOR_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      apiSessionStatus: input.auth.sessionStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedEtsyCapabilities: [...ETSY_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      metadataVersion: ETSY_CONNECTOR_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkConnectorId: input.frameworkConnectorId,
    };
  }

  buildRunReport(input: {
    action: EtsyConnectorRunReport["action"];
    record: EtsyConnectorRecord;
    validation: EtsyValidationReport;
    durationMs: number;
  }): EtsyConnectorRunReport {
    return {
      connectorRunReportId: buildEtsyRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      record: input.record,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: ETSY_CONNECTOR_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(auth: EtsyAuthResult): ValidationStatus {
  return auth.authenticated ? "passed" : "failed";
}

export function mapConnectionToStatus(conn: EtsyConnectionTestResult): ConnectionStatus {
  return conn.passed ? "connected" : "failed";
}

export function mapSessionStatus(session: SessionStatus): SessionStatus {
  return session;
}

export function mapAuthenticationStatus(status: AuthenticationStatus): AuthenticationStatus {
  return status;
}
