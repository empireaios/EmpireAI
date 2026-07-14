/** T2-02 — Externalized Design System Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SUPPORTED_PATTERNS } from "./paths.js";
import type { SupportedPattern } from "./types.js";

export type DesignSystemIntelligenceConfiguration = {
  enabled: boolean;
  designTokenSource: string;
  componentDiscoveryRules: string[];
  variantDetectionRules: string[];
  typographyRules: string[];
  colorRules: string[];
  spacingRules: string[];
  layoutRules: string[];
  validationRulesEnabled: boolean;
  versioningEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  analysisTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  supportedPatterns: SupportedPattern[];
  minComponentConfidence: number;
  trackEvolution: boolean;
};

export const DEFAULT_DESIGN_SYSTEM_INTELLIGENCE_CONFIGURATION: DesignSystemIntelligenceConfiguration =
  {
    enabled: true,
    designTokenSource: "empireai-web/app/globals.css",
    componentDiscoveryRules: ["type", "label", "bounds", "hierarchy"],
    variantDetectionRules: ["size", "state", "color"],
    typographyRules: ["font-family", "font-size", "font-weight", "line-height"],
    colorRules: ["background", "foreground", "accent", "semantic"],
    spacingRules: ["margin", "padding", "gap", "region-distance"],
    layoutRules: ["region-type", "alignment", "responsive-breakpoint"],
    validationRulesEnabled: true,
    versioningEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    analysisTimeoutMs: 60000,
    loggingLevel: "info",
    autoRecover: true,
    supportedPatterns: [...SUPPORTED_PATTERNS],
    minComponentConfidence: 0.3,
    trackEvolution: true,
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

export function loadDesignSystemIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<DesignSystemIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "design-system-intelligence.config.json"),
    join(repositoryRoot, "config", "design-system-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<DesignSystemIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildDesignSystemIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<DesignSystemIntelligenceConfiguration> = {},
): DesignSystemIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadDesignSystemIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<DesignSystemIntelligenceConfiguration> = {
    enabled: envBool(
      "DESIGN_SYSTEM_INTELLIGENCE_ENABLED",
      DEFAULT_DESIGN_SYSTEM_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    designTokenSource: envString(
      "DESIGN_SYSTEM_INTELLIGENCE_TOKEN_SOURCE",
      DEFAULT_DESIGN_SYSTEM_INTELLIGENCE_CONFIGURATION.designTokenSource,
    ),
    maxRetryAttempts: envInt(
      "DESIGN_SYSTEM_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_DESIGN_SYSTEM_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    analysisTimeoutMs: envInt(
      "DESIGN_SYSTEM_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_DESIGN_SYSTEM_INTELLIGENCE_CONFIGURATION.analysisTimeoutMs,
    ),
    loggingLevel: envString(
      "DESIGN_SYSTEM_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_DESIGN_SYSTEM_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as DesignSystemIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "DESIGN_SYSTEM_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_DESIGN_SYSTEM_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
    minComponentConfidence: envFloat(
      "DESIGN_SYSTEM_INTELLIGENCE_MIN_CONFIDENCE",
      DEFAULT_DESIGN_SYSTEM_INTELLIGENCE_CONFIGURATION.minComponentConfidence,
    ),
  };

  return {
    ...DEFAULT_DESIGN_SYSTEM_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
