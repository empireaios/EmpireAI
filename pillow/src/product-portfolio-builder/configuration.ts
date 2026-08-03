/** X1-08 — Externalized Product Portfolio Builder configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ProductPortfolioBuilderConfiguration = {
  enabled: boolean;
  productEvaluationRulesEnabled: boolean;
  productRankingRulesEnabled: boolean;
  portfolioOptimizationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverAutoPublish: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxPortfoliosPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_PRODUCT_PORTFOLIO_BUILDER_CONFIGURATION: ProductPortfolioBuilderConfiguration =
  {
    enabled: true,
    productEvaluationRulesEnabled: true,
    productRankingRulesEnabled: true,
    portfolioOptimizationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverAutoPublish: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    maxPortfoliosPerCycle: 12,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
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

export function loadProductPortfolioBuilderConfigFile(
  repositoryRoot: string,
): Partial<ProductPortfolioBuilderConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "product-portfolio-builder.config.json"),
    join(repositoryRoot, "config", "product-portfolio-builder.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ProductPortfolioBuilderConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildProductPortfolioBuilderConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ProductPortfolioBuilderConfiguration> = {},
): ProductPortfolioBuilderConfiguration {
  const fileConfig = repositoryRoot
    ? loadProductPortfolioBuilderConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ProductPortfolioBuilderConfiguration> = {
    enabled: envBool(
      "PRODUCT_PORTFOLIO_BUILDER_ENABLED",
      DEFAULT_PRODUCT_PORTFOLIO_BUILDER_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "PRODUCT_PORTFOLIO_BUILDER_TIMEOUT_MS",
      DEFAULT_PRODUCT_PORTFOLIO_BUILDER_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "PRODUCT_PORTFOLIO_BUILDER_MAX_RETRIES",
      DEFAULT_PRODUCT_PORTFOLIO_BUILDER_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "PRODUCT_PORTFOLIO_BUILDER_LOG_LEVEL",
      DEFAULT_PRODUCT_PORTFOLIO_BUILDER_CONFIGURATION.loggingLevel,
    ) as ProductPortfolioBuilderConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PRODUCT_PORTFOLIO_BUILDER_AUTO_RECOVER",
      DEFAULT_PRODUCT_PORTFOLIO_BUILDER_CONFIGURATION.autoRecover,
    ),
    maxPortfoliosPerCycle: envInt(
      "PRODUCT_PORTFOLIO_BUILDER_MAX_PORTFOLIOS",
      DEFAULT_PRODUCT_PORTFOLIO_BUILDER_CONFIGURATION.maxPortfoliosPerCycle,
    ),
  };

  return {
    ...DEFAULT_PRODUCT_PORTFOLIO_BUILDER_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverAutoPublish: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
