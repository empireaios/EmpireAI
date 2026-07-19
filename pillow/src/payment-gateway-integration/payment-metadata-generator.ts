/** R3-02 — Payment metadata generator. */

import { PG_CAPABILITIES, PG_METADATA_VERSION, PAYMENT_GATEWAY_ID } from "./paths.js";
import type {
  GatewayRecord,
  GatewayState,
  PaymentAuthResult,
  PaymentConnectionTestResult,
  PaymentGatewayRunReport,
  PaymentRecord,
  PaymentValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildGatewayRecordId(): string {
  return `pg-${Date.now()}`;
}

export function buildGatewayRunReportId(): string {
  return `pg-run-${Date.now()}`;
}

export function buildPaymentId(): string {
  return `pg-pay-${Date.now()}`;
}

export function buildTransactionId(): string {
  return `pg-txn-${Date.now()}`;
}

export class PaymentMetadataGenerator {
  buildGatewayRecord(input: {
    frameworkModuleId: string | null;
    auth: PaymentAuthResult;
    connection: PaymentConnectionTestResult | null;
    operationalState: GatewayState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
    providerIdentifier: string;
  }): GatewayRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      gatewayRecordId: buildGatewayRecordId(),
      timestamp: new Date().toISOString(),
      gatewayId: PAYMENT_GATEWAY_ID,
      gatewayVersion: PG_METADATA_VERSION,
      providerIdentifier: input.providerIdentifier,
      authenticationStatus: input.auth.authenticationStatus,
      sessionStatus: input.auth.sessionStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedCapabilities: [...PG_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      metadataVersion: PG_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkModuleId: input.frameworkModuleId,
    };
  }

  buildPaymentRecord(input: {
    customerReference: string;
    orderReference: string;
    paymentAmount: number;
    currency: string;
    paymentStatus: PaymentRecord["paymentStatus"];
    authorizationStatus: PaymentRecord["authorizationStatus"];
    validationStatus: ValidationStatus;
    transactionId?: string;
  }): PaymentRecord {
    return {
      paymentId: buildPaymentId(),
      timestamp: new Date().toISOString(),
      gatewayId: PAYMENT_GATEWAY_ID,
      transactionId: input.transactionId ?? buildTransactionId(),
      customerReference: input.customerReference,
      orderReference: input.orderReference,
      paymentAmount: input.paymentAmount,
      currency: input.currency,
      paymentStatus: input.paymentStatus,
      authorizationStatus: input.authorizationStatus,
      validationStatus: input.validationStatus,
      metadataVersion: PG_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: PaymentGatewayRunReport["action"];
    gatewayRecord: GatewayRecord;
    paymentRecords: PaymentRecord[];
    validation: PaymentValidationReport;
    durationMs: number;
  }): PaymentGatewayRunReport {
    return {
      gatewayRunReportId: buildGatewayRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      gatewayRecord: input.gatewayRecord,
      paymentRecords: input.paymentRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: PG_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(auth: PaymentAuthResult): ValidationStatus {
  return auth.authenticated ? "passed" : "failed";
}
