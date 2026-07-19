/** R2-02 — CJdropshipping connector metadata generator. */

import { CJ_CAPABILITIES, CJ_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type {
  CjAuthResult,
  CjConnectionTestResult,
  CjConnectorRecord,
  CjConnectorRunReport,
  CjValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export function buildCjConnectorId(): string {
  return `cj-${Date.now()}`;
}

export function buildCjRunReportId(): string {
  return `cj-run-${Date.now()}`;
}

export class CjMetadataGenerator {
  buildRecord(input: {
    frameworkSupplierId: string | null;
    auth: CjAuthResult;
    connection: CjConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
  }): CjConnectorRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      connectorId: buildCjConnectorId(),
      timestamp: new Date().toISOString(),
      supplierId: "cj-dropshipping",
      connectorVersion: CJ_CONNECTOR_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      apiSessionStatus: input.auth.sessionStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedCapabilities: [...CJ_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      metadataVersion: CJ_CONNECTOR_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkSupplierId: input.frameworkSupplierId,
    };
  }

  buildRunReport(input: {
    action: CjConnectorRunReport["action"];
    record: CjConnectorRecord;
    validation: CjValidationReport;
    durationMs: number;
  }): CjConnectorRunReport {
    return {
      connectorRunReportId: buildCjRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      record: input.record,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CJ_CONNECTOR_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(auth: CjAuthResult): ValidationStatus {
  return auth.authenticated ? "passed" : "failed";
}
