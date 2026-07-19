/** R3-17 — Externalized Accounting Export Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EXPORT_FORMATS, EXPORT_SCOPES } from "./paths.js";

export type ExportFormatRule = {
  format: (typeof EXPORT_FORMATS)[number];
  label: string;
  enabled: boolean;
};

export type ExportScopeRule = {
  scope: (typeof EXPORT_SCOPES)[number];
  label: string;
  enabled: boolean;
};

export type AccountingExportEngineConfiguration = {
  enabled: boolean;
  exportFormatRulesEnabled: boolean;
  exportSchedulingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  exportFrequencyMs: number;
  defaultExportFormat: (typeof EXPORT_FORMATS)[number];
  defaultExportScope: (typeof EXPORT_SCOPES)[number];
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  formatRules: ExportFormatRule[];
  scopeRules: ExportScopeRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_ACCOUNTING_EXPORT_ENGINE_CONFIGURATION: AccountingExportEngineConfiguration =
  {
    enabled: true,
    exportFormatRulesEnabled: true,
    exportSchedulingRulesEnabled: true,
    validationRulesEnabled: true,
    exportFrequencyMs: 60000,
    defaultExportFormat: "csv",
    defaultExportScope: "all",
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    formatRules: [
      { format: "csv", label: "CSV", enabled: true },
      { format: "json", label: "JSON", enabled: true },
      { format: "quickbooks", label: "QuickBooks IIF", enabled: true },
      { format: "xero", label: "Xero CSV", enabled: true },
      { format: "generic", label: "Generic Accounting", enabled: true },
    ],
    scopeRules: [
      { scope: "all", label: "All financial records", enabled: true },
      { scope: "revenue", label: "Revenue only", enabled: true },
      { scope: "expense", label: "Expense only", enabled: true },
      { scope: "invoice", label: "Invoices only", enabled: true },
      { scope: "refund", label: "Refunds only", enabled: true },
      { scope: "tax", label: "Tax records only", enabled: true },
      { scope: "reconciliation", label: "Reconciliation only", enabled: true },
      { scope: "profit", label: "Profit records only", enabled: true },
    ],
    maskSensitiveValues: true,
  };

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadAccountingExportEngineConfigFile(
  repositoryRoot: string,
): Partial<AccountingExportEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "accounting-export-engine.config.json"),
    join(repositoryRoot, "config", "accounting-export-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<AccountingExportEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAccountingExportEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AccountingExportEngineConfiguration> = {},
): AccountingExportEngineConfiguration {
  const fileConfig = repositoryRoot ? loadAccountingExportEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<AccountingExportEngineConfiguration> = {
    enabled: envBool(
      "ACCOUNTING_EXPORT_ENGINE_ENABLED",
      DEFAULT_ACCOUNTING_EXPORT_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "ACCOUNTING_EXPORT_ENGINE_TIMEOUT_MS",
      DEFAULT_ACCOUNTING_EXPORT_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "ACCOUNTING_EXPORT_ENGINE_MAX_RETRIES",
      DEFAULT_ACCOUNTING_EXPORT_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    exportFrequencyMs: envInt(
      "ACCOUNTING_EXPORT_ENGINE_FREQUENCY_MS",
      DEFAULT_ACCOUNTING_EXPORT_ENGINE_CONFIGURATION.exportFrequencyMs,
    ),
    loggingLevel: envString(
      "ACCOUNTING_EXPORT_ENGINE_LOG_LEVEL",
      DEFAULT_ACCOUNTING_EXPORT_ENGINE_CONFIGURATION.loggingLevel,
    ) as AccountingExportEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "ACCOUNTING_EXPORT_ENGINE_AUTO_RECOVER",
      DEFAULT_ACCOUNTING_EXPORT_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_ACCOUNTING_EXPORT_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
