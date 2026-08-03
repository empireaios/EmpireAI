/** X3-10 — Shared structural bottleneck intelligence helpers. */

import { BNI_METADATA_VERSION } from "./paths.js";
import type { BottleneckIntelligenceConfiguration } from "./configuration.js";
import type {
  BottleneckCategory,
  BottleneckIntelligenceInput,
  BottleneckRecord,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function defaultCompany(input?: BottleneckIntelligenceInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultComponent(
  category: BottleneckCategory,
  input?: BottleneckIntelligenceInput,
): string {
  return input?.affectedComponent?.trim() || `${category}-component-default`;
}

export function buildBottleneckRecord(input: {
  companyReference: string;
  bottleneckCategory: BottleneckCategory;
  affectedComponent: string;
  severityScore: number;
  businessImpactScore: number;
  resolutionPriority: number;
  recommendationSummary: string;
  config: BottleneckIntelligenceConfiguration;
}): BottleneckRecord {
  const severityScore = clampScore(input.severityScore);
  const businessImpactScore = clampScore(input.businessImpactScore);
  let resolutionPriority = clampScore(input.resolutionPriority);

  // Never inflate priority beyond structural evidence — unsupported conclusions forbidden.
  if (input.config.neverGenerateUnsupportedBottleneckConclusions) {
    if (
      severityScore < input.config.severityThreshold &&
      businessImpactScore < input.config.impactThreshold
    ) {
      resolutionPriority = Math.min(resolutionPriority, input.config.severityThreshold - 1);
    }
  }

  return {
    bottleneckId: `bni-bn-${Date.now()}-${input.bottleneckCategory}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    bottleneckCategory: input.bottleneckCategory,
    affectedComponent: input.affectedComponent,
    severityScore,
    businessImpactScore,
    resolutionPriority,
    recommendationSummary: input.recommendationSummary,
    validationStatus: "passed",
    metadataVersion: BNI_METADATA_VERSION,
    neverGenerateUnsupportedBottleneckConclusions: true,
    structuralSignalOnly: true,
    sensitiveOperationalData: false,
  };
}

export function computeBottleneckSignals(
  category: BottleneckCategory,
  input: BottleneckIntelligenceInput,
  config: BottleneckIntelligenceConfiguration,
  sourceAvailable = true,
): {
  companyReference: string;
  bottleneckCategory: BottleneckCategory;
  affectedComponent: string;
  severityScore: number;
  businessImpactScore: number;
  resolutionPriority: number;
  recommendationSummary: string;
} {
  const company = defaultCompany(input);
  const component = defaultComponent(category, input);
  const seed = `${company}::${component}::${category}`;

  const severityScore = clampScore(
    input.severityHint ?? hashScore(`${seed}:severity`, 20, 95),
  );
  const businessImpactScore = clampScore(
    input.impactHint ?? hashScore(`${seed}:impact`, 20, 95),
  );
  const throughputScore = clampScore(
    input.throughputHint ?? hashScore(`${seed}:throughput`, 20, 95),
  );
  const constraintScore = clampScore(
    input.constraintHint ?? hashScore(`${seed}:constraint`, 20, 95),
  );

  let resolutionPriority = clampScore(
    severityScore * 0.45 + businessImpactScore * 0.4 + (100 - throughputScore) * 0.15,
  );

  let recommendationSummary =
    "Bottleneck signals within validated structural bounds — no unsupported conclusions";

  if (!sourceAvailable) {
    recommendationSummary = `Partial ${category} detection — upstream source unavailable; structural signals only`;
    resolutionPriority = Math.min(resolutionPriority, config.severityThreshold);
  } else if (category === "throughput" && throughputScore < config.throughputConstraintThreshold) {
    recommendationSummary = `Throughput constraint at ${throughputScore} (threshold ${config.throughputConstraintThreshold}) — hold expansion until flow clears`;
  } else if (severityScore >= config.highSeverityThreshold) {
    recommendationSummary = `High-severity ${category} bottleneck on ${component} · severity ${severityScore} · impact ${businessImpactScore}`;
  } else if (severityScore >= config.severityThreshold) {
    recommendationSummary = `Watch ${category} bottleneck on ${component} · severity ${severityScore} · impact ${businessImpactScore}`;
  } else if (businessImpactScore >= config.impactThreshold) {
    recommendationSummary = `Impact-elevated ${category} signal on ${component} · impact ${businessImpactScore} — monitor only`;
  } else if (constraintScore < config.severityThreshold) {
    recommendationSummary = `Constraint pressure ${constraintScore} on ${component} — structural watch`;
  } else {
    recommendationSummary = `Validated ${category} signals support cautious bottleneck monitoring`;
  }

  if (config.neverGenerateUnsupportedBottleneckConclusions) {
    if (
      severityScore < config.severityThreshold &&
      businessImpactScore < config.impactThreshold
    ) {
      resolutionPriority = Math.min(resolutionPriority, config.severityThreshold - 1);
    }
  }

  return {
    companyReference: company,
    bottleneckCategory: category,
    affectedComponent: component,
    severityScore,
    businessImpactScore,
    resolutionPriority,
    recommendationSummary,
  };
}
