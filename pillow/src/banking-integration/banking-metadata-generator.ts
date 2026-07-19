/** R3-03 — Banking metadata generator. */

import { BI_CAPABILITIES, BI_METADATA_VERSION, BANKING_INTEGRATION_ID } from "./paths.js";
import type {
  BankingAuthResult,
  BankingConnectionTestResult,
  BankingIntegrationRecord,
  BankingIntegrationRunReport,
  BankingRecord,
  BankingTransactionRecord,
  BankingValidationReport,
  IntegrationState,
  ValidationStatus,
} from "./types.js";

export function buildIntegrationRecordId(): string {
  return `bi-${Date.now()}`;
}

export function buildIntegrationRunReportId(): string {
  return `bi-run-${Date.now()}`;
}

export function buildBankingRecordId(): string {
  return `bi-acct-${Date.now()}`;
}

export function buildTransactionId(): string {
  return `bi-txn-${Date.now()}`;
}

export class BankingMetadataGenerator {
  buildIntegrationRecord(input: {
    frameworkModuleId: string | null;
    auth: BankingAuthResult;
    connection: BankingConnectionTestResult | null;
    operationalState: IntegrationState;
    validationStatus: ValidationStatus;
    credentialRefPresent: boolean;
    providerIdentifier: string;
  }): BankingIntegrationRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      integrationRecordId: buildIntegrationRecordId(),
      timestamp: new Date().toISOString(),
      bankingProviderId: BANKING_INTEGRATION_ID,
      integrationVersion: BI_METADATA_VERSION,
      providerIdentifier: input.providerIdentifier,
      authenticationStatus: input.auth.authenticationStatus,
      sessionStatus: input.auth.sessionStatus,
      connectionStatus: input.connection?.connectionStatus ?? "disconnected",
      supportedCapabilities: [...BI_CAPABILITIES],
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      metadataVersion: BI_METADATA_VERSION,
      credentialRefPresent: input.credentialRefPresent,
      frameworkModuleId: input.frameworkModuleId,
    };
  }

  buildBankingRecord(input: {
    bankingProviderId: string;
    bankAccountReference: string;
    accountType: BankingRecord["accountType"];
    accountBalance: number;
    currency: string;
    synchronizationStatus: BankingRecord["synchronizationStatus"];
    validationStatus: ValidationStatus;
  }): BankingRecord {
    const now = new Date().toISOString();
    return {
      bankingRecordId: buildBankingRecordId(),
      timestamp: now,
      bankingProviderId: input.bankingProviderId,
      bankAccountReference: input.bankAccountReference,
      accountType: input.accountType,
      accountBalance: input.accountBalance,
      currency: input.currency,
      synchronizationStatus: input.synchronizationStatus,
      lastSynchronizationTimestamp:
        input.synchronizationStatus === "synchronized" ? now : null,
      validationStatus: input.validationStatus,
      metadataVersion: BI_METADATA_VERSION,
    };
  }

  buildTransactionRecord(input: {
    bankingRecordId: string;
    amount: number;
    currency: string;
    transactionType: BankingTransactionRecord["transactionType"];
    description: string;
  }): BankingTransactionRecord {
    return {
      transactionId: buildTransactionId(),
      bankingRecordId: input.bankingRecordId,
      timestamp: new Date().toISOString(),
      amount: input.amount,
      currency: input.currency,
      transactionType: input.transactionType,
      description: input.description,
      postedAt: new Date().toISOString(),
      metadataVersion: BI_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: BankingIntegrationRunReport["action"];
    integrationRecord: BankingIntegrationRecord;
    bankingRecords: BankingRecord[];
    transactionRecords: BankingTransactionRecord[];
    validation: BankingValidationReport;
    durationMs: number;
  }): BankingIntegrationRunReport {
    return {
      integrationRunReportId: buildIntegrationRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      integrationRecord: input.integrationRecord,
      bankingRecords: input.bankingRecords,
      transactionRecords: input.transactionRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: BI_METADATA_VERSION,
    };
  }
}

export function mapAuthToValidation(auth: BankingAuthResult): ValidationStatus {
  return auth.authenticated ? "passed" : "failed";
}
