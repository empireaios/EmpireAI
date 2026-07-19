/** R1-10 — Shopify connector metadata generator. */

import { SHOPIFY_STORE_CAPABILITIES, SHOPIFY_STORE_CONNECTOR_METADATA_VERSION } from "./paths.js";
import type {
  ShopifyStoreAuthResult,
  ShopifyStoreConnectionTestResult,
  ShopifyStoreConnectorRecord,
  ShopifyStoreConnectorRunReport,
  ShopifyStoreValidationReport,
  AuthenticationStatus,
  ConnectionStatus,
  OperationalState,
  SessionStatus,
  ValidationStatus,
} from "./types.js";

export function buildShopifyStoreConnectorId(): string {
  return `shf-${Date.now()}`;
}

export function buildShopifyStoreRunReportId(): string {
  return `shf-run-${Date.now()}`;
}

export class ShopifyStoreConnectorMetadataGenerator {
  buildRecord(input: {
    frameworkConnectorId: string | null;
    storeId: string | null;
    storeDomain: string | null;
    auth: ShopifyStoreAuthResult;
    connection: ShopifyStoreConnectionTestResult | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
  }): ShopifyStoreConnectorRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      connectorId: buildShopifyStoreConnectorId(),
      storeId: input.storeId,
      storeDomain: input.storeDomain,
      timestamp: new Date().toISOString(),
      marketplaceIdentifier: "shopify",
      connectorVersion: SHOPIFY_STORE_CONNECTOR_METADATA_VERSION,
      authenticationStatus: input.auth.authenticationStatus,
      apiSessionStatus: input.auth.sessionStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedShopifyStoreCapabilities: [...SHOPIFY_STORE_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      metadataVersion: SHOPIFY_STORE_CONNECTOR_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkConnectorId: input.frameworkConnectorId,
    };
  }

  buildRunReport(input: {
    action: ShopifyStoreConnectorRunReport["action"];
    record: ShopifyStoreConnectorRecord;
    validation: ShopifyStoreValidationReport;
    durationMs: number;
  }): ShopifyStoreConnectorRunReport {
    return {
      connectorRunReportId: buildShopifyStoreRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      record: input.record,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SHOPIFY_STORE_CONNECTOR_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(auth: ShopifyStoreAuthResult): ValidationStatus {
  return auth.authenticated ? "passed" : "failed";
}

export function mapConnectionToStatus(conn: ShopifyStoreConnectionTestResult): ConnectionStatus {
  return conn.passed ? "connected" : "failed";
}

export function mapSessionStatus(session: SessionStatus): SessionStatus {
  return session;
}

export function mapAuthenticationStatus(status: AuthenticationStatus): AuthenticationStatus {
  return status;
}
