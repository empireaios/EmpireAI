/** T4-04 — Externalized Multi-Proposal Generator configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PROPOSAL_CATEGORIES } from "./paths.js";
import type { ProposalCategory } from "./types.js";

export type MultiProposalGeneratorConfiguration = {
  enabled: boolean;
  minimumProposalCount: number;
  maximumProposalCount: number;
  proposalCategoryRulesEnabled: boolean;
  proposalDiversityRulesEnabled: boolean;
  uxFindingLinkageRulesEnabled: boolean;
  builderCapabilityLinkageRulesEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  generationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  supportedProposalCategories: ProposalCategory[];
  outputValidationEnabled: boolean;
  maxHistorySessions: number;
};

export const DEFAULT_MULTI_PROPOSAL_GENERATOR_CONFIGURATION: MultiProposalGeneratorConfiguration =
  {
    enabled: true,
    minimumProposalCount: 3,
    maximumProposalCount: 8,
    proposalCategoryRulesEnabled: true,
    proposalDiversityRulesEnabled: true,
    uxFindingLinkageRulesEnabled: true,
    builderCapabilityLinkageRulesEnabled: true,
    confidenceThreshold: 0.5,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    generationTimeoutMs: 120000,
    loggingLevel: "info",
    autoRecover: true,
    supportedProposalCategories: [...PROPOSAL_CATEGORIES],
    outputValidationEnabled: true,
    maxHistorySessions: 50,
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

export function loadMultiProposalGeneratorConfigFile(
  repositoryRoot: string,
): Partial<MultiProposalGeneratorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "multi-proposal-generator.config.json"),
    join(repositoryRoot, "config", "multi-proposal-generator.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<MultiProposalGeneratorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildMultiProposalGeneratorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MultiProposalGeneratorConfiguration> = {},
): MultiProposalGeneratorConfiguration {
  const fileConfig = repositoryRoot
    ? loadMultiProposalGeneratorConfigFile(repositoryRoot)
    : null;

  const envConfig: Partial<MultiProposalGeneratorConfiguration> = {
    enabled: envBool(
      "MULTI_PROPOSAL_GENERATOR_ENABLED",
      DEFAULT_MULTI_PROPOSAL_GENERATOR_CONFIGURATION.enabled,
    ),
    minimumProposalCount: envInt(
      "MULTI_PROPOSAL_GENERATOR_MIN_COUNT",
      DEFAULT_MULTI_PROPOSAL_GENERATOR_CONFIGURATION.minimumProposalCount,
    ),
    maximumProposalCount: envInt(
      "MULTI_PROPOSAL_GENERATOR_MAX_COUNT",
      DEFAULT_MULTI_PROPOSAL_GENERATOR_CONFIGURATION.maximumProposalCount,
    ),
    confidenceThreshold: envFloat(
      "MULTI_PROPOSAL_GENERATOR_CONFIDENCE_THRESHOLD",
      DEFAULT_MULTI_PROPOSAL_GENERATOR_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "MULTI_PROPOSAL_GENERATOR_MAX_RETRIES",
      DEFAULT_MULTI_PROPOSAL_GENERATOR_CONFIGURATION.maxRetryAttempts,
    ),
    generationTimeoutMs: envInt(
      "MULTI_PROPOSAL_GENERATOR_TIMEOUT_MS",
      DEFAULT_MULTI_PROPOSAL_GENERATOR_CONFIGURATION.generationTimeoutMs,
    ),
    loggingLevel: envString(
      "MULTI_PROPOSAL_GENERATOR_LOG_LEVEL",
      DEFAULT_MULTI_PROPOSAL_GENERATOR_CONFIGURATION.loggingLevel,
    ) as MultiProposalGeneratorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "MULTI_PROPOSAL_GENERATOR_AUTO_RECOVER",
      DEFAULT_MULTI_PROPOSAL_GENERATOR_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_MULTI_PROPOSAL_GENERATOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
