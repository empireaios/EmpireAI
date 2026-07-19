/** R1-11 — WooCommerce connector metadata generator. */

import { WOOCOMMERCE_CAPABILITIES, WOOCOMMERCE_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type {
  WooCommerceAuthResult,
  WooCommerceConnectionTestResult,
  WooCommerceConnectorRecord,
  WooCommerceConnectorRunReport,
  WooCommerceValidationReport,
  AuthenticationStatus,
  ConnectionStatus,
  OperationalState,
  SessionStatus,
  ValidationStatus,
} from "./types.js";

export function buildWooCommerceConnectorId(): string {
  return `woo-${Date.now()}`;
}

export function buildWooCommerceRunReportId(): string {
  return `woo-run-${Date.now()}`;
}

export class WooCommerceConnectorMetadataGenerator {
  buildRecord(input: {
    frameworkConnectorId: string | null;
    storeId: string | null;
    storeUrl: string | null;
    auth: WooCommerceAuthResult;
    connection: WooCommerceConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
  }): WooCommerceConnectorRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      connectorId: buildWooCommerceConnectorId(),
      storeId: input.storeId,
      storeUrl: input.storeUrl,
      timestamp: new Date().toISOString(),
      marketplaceIdentifier: "woocommerce",
      connectorVersion: WOOCOMMERCE_CONNECTOR_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      apiSessionStatus: input.auth.sessionStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedWooCommerceCapabilities: [...WOOCOMMERCE_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      metadataVersion: WOOCOMMERCE_CONNECTOR_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkConnectorId: input.frameworkConnectorId,
    };
  }

  buildRunReport(input: {
    action: WooCommerceConnectorRunReport["action"];
    record: WooCommerceConnectorRecord;
    validation: WooCommerceValidationReport;
    durationMs: number;
  }): WooCommerceConnectorRunReport {
    return {
      connectorRunReportId: buildWooCommerceRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      record: input.record,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: WOOCOMMERCE_CONNECTOR_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(auth: WooCommerceAuthResult): ValidationStatus {
  return auth.authenticated ? "passed" : "failed";
}

export function mapConnectionToStatus(conn: WooCommerceConnectionTestResult): ConnectionStatus {
  return conn.passed ? "connected" : "failed";
}

export function mapSessionStatus(session: SessionStatus): SessionStatus {
  return session;
}

export function mapAuthenticationStatus(status: AuthenticationStatus): AuthenticationStatus {
  return status;
}
