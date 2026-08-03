import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  INW_METADATA_VERSION,
  INVENTORY_WORKER_IDENTITY,
} from "./paths.js";
import type { InventoryReport } from "./types.js";

export type InventoryWorkerConfiguration = {
  enabled: boolean;
  inventoryRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultLeadTimeDays: number;
  defaultDailyDemand: number;
  defaultSafetyStockDays: number;
  abnormalChangePercent: number;
  abnormalAbsoluteDrop: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedInventoryReports: InventoryReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-10 hard boundaries — force-locked true. */
  neverPurchaseInventory: true;
  neverModifySupplierStock: true;
  neverPlaceSupplierOrders: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ311OrLater: true;
  neverModifySupplierInventoryDirectly: true;
  preserveInventoryTraceability: true;
  preserveSupplierReferences: true;
  preserveInventoryHistory: true;
  generateAlertsForCriticalEvents: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_INVENTORY_WORKER_CONFIGURATION: InventoryWorkerConfiguration = {
  enabled: true,
  inventoryRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultLeadTimeDays: 14,
  defaultDailyDemand: 5,
  defaultSafetyStockDays: 3,
  abnormalChangePercent: 0.5,
  abnormalAbsoluteDrop: 50,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: INVENTORY_WORKER_IDENTITY.workerId,
  workerName: INVENTORY_WORKER_IDENTITY.workerName,
  factory: INVENTORY_WORKER_IDENTITY.factory,
  department: INVENTORY_WORKER_IDENTITY.department,
  role: INVENTORY_WORKER_IDENTITY.role,
  reportingLine: [...INVENTORY_WORKER_IDENTITY.reportingLine],
  seedInventoryReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverPurchaseInventory: true,
  neverModifySupplierStock: true,
  neverPlaceSupplierOrders: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ311OrLater: true,
  neverModifySupplierInventoryDirectly: true,
  preserveInventoryTraceability: true,
  preserveSupplierReferences: true,
  preserveInventoryHistory: true,
  generateAlertsForCriticalEvents: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildInventoryWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<InventoryWorkerConfiguration> = {},
): InventoryWorkerConfiguration {
  let file: Partial<InventoryWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "inventory-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.INVENTORY_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.INVENTORY_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_INVENTORY_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_INVENTORY_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_INVENTORY_WORKER_CONFIGURATION.reportingLine),
    ],
    seedInventoryReports: (overrides.seedInventoryReports ?? file.seedInventoryReports ?? []).map(
      (r) => lockReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverPurchaseInventory: true,
    neverModifySupplierStock: true,
    neverPlaceSupplierOrders: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ311OrLater: true,
    neverModifySupplierInventoryDirectly: true,
    preserveInventoryTraceability: true,
    preserveSupplierReferences: true,
    preserveInventoryHistory: true,
    generateAlertsForCriticalEvents: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockReport(report: InventoryReport): InventoryReport {
  return {
    ...report,
    inventoryAlerts: report.inventoryAlerts.map((a) => ({ ...a })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    metadataVersion: report.metadataVersion || INW_METADATA_VERSION,
    neverPurchaseInventory: true,
    neverModifySupplierStock: true,
    neverPlaceSupplierOrders: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ311OrLater: true,
    neverModifySupplierInventoryDirectly: true,
    preserveInventoryTraceability: true,
    preserveSupplierReferences: true,
    preserveInventoryHistory: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
