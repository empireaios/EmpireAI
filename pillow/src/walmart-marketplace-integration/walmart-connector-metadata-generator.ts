/** R1-06 — Walmart connector metadata generator. */

import { WALMART_CAPABILITIES, WALMART_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type {
  WalmartAuthResult,
  WalmartConnectionTestResult,
  WalmartConnectorRecord,
  WalmartConnectorRunReport,
  WalmartValidationReport,
  AuthenticationStatus,
  ConnectionStatus,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export function buildWalmartConnectorId(): string {
  return `wmt-${Date.now()}`;
}

export function buildWalmartRunReportId(): string {
  return `wmt-run-${Date.now()}`;
}

export class WalmartConnectorMetadataGenerator {
  buildRecord(input: {
    frameworkConnectorId: string | null;
    auth: WalmartAuthResult;
    connection: WalmartConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
  }): WalmartConnectorRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      connectorId: buildWalmartConnectorId(),
      timestamp: new Date().toISOString(),
      marketplaceId: "walmart",
      connectorVersion: WALMART_CONNECTOR_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      apiSessionStatus: input.auth.sessionStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedCapabilities: [...WALMART_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      metadataVersion: WALMART_CONNECTOR_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkConnectorId: input.frameworkConnectorId,
    };
  }

  buildRunReport(input: {
    action: WalmartConnectorRunReport["action"];
    record: WalmartConnectorRecord;
    validation: WalmartValidationReport;
    durationMs: number;
  }): WalmartConnectorRunReport {
    return {
      connectorRunReportId: buildWalmartRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      record: input.record,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: WALMART_CONNECTOR_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(auth: WalmartAuthResult): ValidationStatus {
  return auth.authenticated ? "passed" : "failed";
}

export function mapConnectionToStatus(conn: WalmartConnectionTestResult): ConnectionStatus {
  return conn.passed ? "connected" : "failed";
}

export function mapAuthenticationStatus(status: AuthenticationStatus): AuthenticationStatus {
  return status;
}
