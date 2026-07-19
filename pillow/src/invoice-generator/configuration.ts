/** R3-09 — Externalized Invoice Generator configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type InvoiceGeneratorConfiguration = {
  enabled: boolean;
  invoiceNumberingRulesEnabled: boolean;
  invoiceNumberPrefix: string;
  invoiceLifecycleRulesEnabled: boolean;
  defaultInitialStatus: "draft" | "issued";
  taxCalculationRulesEnabled: boolean;
  defaultTaxRate: number;
  validationRulesEnabled: boolean;
  inconsistencyDetectionEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  defaultCurrency: string;
  maskSensitiveValues: true;
};

export const DEFAULT_INVOICE_GENERATOR_CONFIGURATION: InvoiceGeneratorConfiguration = {
  enabled: true,
  invoiceNumberingRulesEnabled: true,
  invoiceNumberPrefix: "INV",
  invoiceLifecycleRulesEnabled: true,
  defaultInitialStatus: "issued",
  taxCalculationRulesEnabled: true,
  defaultTaxRate: 0.1,
  validationRulesEnabled: true,
  inconsistencyDetectionEnabled: true,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
  defaultCurrency: "USD",
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

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadInvoiceGeneratorConfigFile(
  repositoryRoot: string,
): Partial<InvoiceGeneratorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "invoice-generator.config.json"),
    join(repositoryRoot, "config", "invoice-generator.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<InvoiceGeneratorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildInvoiceGeneratorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<InvoiceGeneratorConfiguration> = {},
): InvoiceGeneratorConfiguration {
  const fileConfig = repositoryRoot ? loadInvoiceGeneratorConfigFile(repositoryRoot) : null;
  const envConfig: Partial<InvoiceGeneratorConfiguration> = {
    enabled: envBool(
      "INVOICE_GENERATOR_ENABLED",
      DEFAULT_INVOICE_GENERATOR_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "INVOICE_GENERATOR_TIMEOUT_MS",
      DEFAULT_INVOICE_GENERATOR_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "INVOICE_GENERATOR_MAX_RETRIES",
      DEFAULT_INVOICE_GENERATOR_CONFIGURATION.maxRetryAttempts,
    ),
    defaultTaxRate: envFloat(
      "INVOICE_GENERATOR_TAX_RATE",
      DEFAULT_INVOICE_GENERATOR_CONFIGURATION.defaultTaxRate,
    ),
    loggingLevel: envString(
      "INVOICE_GENERATOR_LOG_LEVEL",
      DEFAULT_INVOICE_GENERATOR_CONFIGURATION.loggingLevel,
    ) as InvoiceGeneratorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "INVOICE_GENERATOR_AUTO_RECOVER",
      DEFAULT_INVOICE_GENERATOR_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_INVOICE_GENERATOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
