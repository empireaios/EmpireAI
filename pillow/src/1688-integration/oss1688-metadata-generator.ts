/** R2-04 — 1688 connector metadata generator. */

import { OSS1688_CAPABILITIES, OSS1688_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type {
  Oss1688AuthResult,
  Oss1688ConnectionTestResult,
  Oss1688ConnectorRecord,
  Oss1688ConnectorRunReport,
  Oss1688ValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export function buildOss1688ConnectorId(): string {
  return `oss-${Date.now()}`;
}

export function buildOss1688RunReportId(): string {
  return `oss-run-${Date.now()}`;
}

export class Oss1688MetadataGenerator {
  buildRecord(input: {
    frameworkSupplierId: string | null;
    auth: Oss1688AuthResult;
    connection: Oss1688ConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
  }): Oss1688ConnectorRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      connectorId: buildOss1688ConnectorId(),
      timestamp: new Date().toISOString(),
      supplierId: "1688",
      connectorVersion: OSS1688_CONNECTOR_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      apiSessionStatus: input.auth.sessionStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedCapabilities: [...OSS1688_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      metadataVersion: OSS1688_CONNECTOR_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkSupplierId: input.frameworkSupplierId,
    };
  }

  buildRunReport(input: {
    action: Oss1688ConnectorRunReport["action"];
    record: Oss1688ConnectorRecord;
    validation: Oss1688ValidationReport;
    durationMs: number;
  }): Oss1688ConnectorRunReport {
    return {
      connectorRunReportId: buildOss1688RunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      record: input.record,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: OSS1688_CONNECTOR_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(auth: Oss1688AuthResult): ValidationStatus {
  return auth.authenticated ? "passed" : "failed";
}
