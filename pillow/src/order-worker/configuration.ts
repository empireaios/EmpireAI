import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  ORW_METADATA_VERSION,
  ORDER_WORKER_IDENTITY,
} from "./paths.js";
import type { OrderReport } from "./types.js";

export type OrderWorkerConfiguration = {
  enabled: boolean;
  orderRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultDelayDaysThreshold: number;
  defaultExpectedShipDays: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedOrderReports: OrderReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-11 hard boundaries — force-locked true. */
  neverProcessPayments: true;
  neverIssueRefunds: true;
  neverModifyInventoryDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ312OrLater: true;
  neverAlterFinancialRecords: true;
  preserveOrderTraceability: true;
  preserveFulfilmentHistory: true;
  preserveSupplierReferences: true;
  detectOperationalExceptions: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_ORDER_WORKER_CONFIGURATION: OrderWorkerConfiguration = {
  enabled: true,
  orderRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultDelayDaysThreshold: 7,
  defaultExpectedShipDays: 5,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: ORDER_WORKER_IDENTITY.workerId,
  workerName: ORDER_WORKER_IDENTITY.workerName,
  factory: ORDER_WORKER_IDENTITY.factory,
  department: ORDER_WORKER_IDENTITY.department,
  role: ORDER_WORKER_IDENTITY.role,
  reportingLine: [...ORDER_WORKER_IDENTITY.reportingLine],
  seedOrderReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverProcessPayments: true,
  neverIssueRefunds: true,
  neverModifyInventoryDirectly: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ312OrLater: true,
  neverAlterFinancialRecords: true,
  preserveOrderTraceability: true,
  preserveFulfilmentHistory: true,
  preserveSupplierReferences: true,
  detectOperationalExceptions: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildOrderWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<OrderWorkerConfiguration> = {},
): OrderWorkerConfiguration {
  let file: Partial<OrderWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "order-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.ORDER_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.ORDER_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_ORDER_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_ORDER_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_ORDER_WORKER_CONFIGURATION.reportingLine),
    ],
    seedOrderReports: (overrides.seedOrderReports ?? file.seedOrderReports ?? []).map((r) =>
      lockReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverProcessPayments: true,
    neverIssueRefunds: true,
    neverModifyInventoryDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ312OrLater: true,
    neverAlterFinancialRecords: true,
    preserveOrderTraceability: true,
    preserveFulfilmentHistory: true,
    preserveSupplierReferences: true,
    detectOperationalExceptions: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockReport(report: OrderReport): OrderReport {
  return {
    ...report,
    exceptions: report.exceptions.map((e) => ({ ...e })),
    customerUpdates: report.customerUpdates.map((u) => ({ ...u })),
    escalations: report.escalations.map((e) => ({ ...e })),
    fulfilmentHistory: report.fulfilmentHistory.map((h) => ({ ...h })),
    orderHistory: report.orderHistory.map((h) => ({ ...h })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    metadataVersion: report.metadataVersion || ORW_METADATA_VERSION,
    neverProcessPayments: true,
    neverIssueRefunds: true,
    neverModifyInventoryDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ312OrLater: true,
    neverAlterFinancialRecords: true,
    preserveOrderTraceability: true,
    preserveFulfilmentHistory: true,
    preserveSupplierReferences: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
