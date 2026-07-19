/** R2-03 — AliExpress connector metadata generator. */

import { AEX_CAPABILITIES, AEX_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type {
  AliExpressAuthResult,
  AliExpressConnectionTestResult,
  AliExpressConnectorRecord,
  AliExpressConnectorRunReport,
  AliExpressValidationReport,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export function buildAliExpressConnectorId(): string {
  return `aex-${Date.now()}`;
}

export function buildAliExpressRunReportId(): string {
  return `aex-run-${Date.now()}`;
}

export class AliExpressMetadataGenerator {
  buildRecord(input: {
    frameworkSupplierId: string | null;
    auth: AliExpressAuthResult;
    connection: AliExpressConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
  }): AliExpressConnectorRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      connectorId: buildAliExpressConnectorId(),
      timestamp: new Date().toISOString(),
      supplierId: "aliexpress",
      connectorVersion: AEX_CONNECTOR_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      apiSessionStatus: input.auth.sessionStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedCapabilities: [...AEX_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      metadataVersion: AEX_CONNECTOR_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkSupplierId: input.frameworkSupplierId,
    };
  }

  buildRunReport(input: {
    action: AliExpressConnectorRunReport["action"];
    record: AliExpressConnectorRecord;
    validation: AliExpressValidationReport;
    durationMs: number;
  }): AliExpressConnectorRunReport {
    return {
      connectorRunReportId: buildAliExpressRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      record: input.record,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: AEX_CONNECTOR_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(auth: AliExpressAuthResult): ValidationStatus {
  return auth.authenticated ? "passed" : "failed";
}
