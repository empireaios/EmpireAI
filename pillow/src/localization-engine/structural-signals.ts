/** X4-03 — Shared structural localization scoring helpers. */

import { LOC_METADATA_VERSION } from "./paths.js";
import type { LocalizationEngineConfiguration } from "./configuration.js";
import type {
  LocalizationCategory,
  LocalizationInput,
  LocalizationRecord,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: LocalizationInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultCountry(input?: LocalizationInput): string {
  return (input?.targetCountry?.trim() || "SG").toUpperCase();
}

export function defaultRegion(input?: LocalizationInput): string {
  return input?.targetRegion?.trim() || "APAC";
}

export function defaultCategory(input?: LocalizationInput): LocalizationCategory {
  return input?.localizationCategory ?? "product";
}

export function computeStructuralLocalizationSignals(
  input: LocalizationInput,
  _config: LocalizationEngineConfiguration,
): {
  companyReference: string;
  targetCountry: string;
  targetRegion: string;
  localizationCategory: LocalizationCategory;
  readinessScore: number;
  gapScore: number;
  adaptationSummary: string;
} {
  const companyReference = defaultCompany(input);
  const targetCountry = defaultCountry(input);
  const targetRegion = defaultRegion(input);
  const localizationCategory = defaultCategory(input);
  const asset = input.assetReference?.trim() || `${localizationCategory}-asset`;
  const seed = `${companyReference}::${targetCountry}::${localizationCategory}::${asset}`;

  const readinessScore = Math.round(
    input.readinessHint ?? hashScore(`${seed}:ready`, 40, 95),
  );
  const gapScore = Math.round(
    input.gapHint ?? Math.max(0, 100 - readinessScore + hashScore(`${seed}:gap`, 0, 15)),
  );

  const adaptationSummary = `Adapt ${asset} (${localizationCategory}) for ${targetCountry}/${targetRegion} — readiness=${readinessScore}, gap=${gapScore}; canonical source preserved`;

  return {
    companyReference,
    targetCountry,
    targetRegion,
    localizationCategory,
    readinessScore: Math.max(0, Math.min(100, readinessScore)),
    gapScore: Math.max(0, Math.min(100, gapScore)),
    adaptationSummary,
  };
}

export function buildLocalizationRecord(
  signals: ReturnType<typeof computeStructuralLocalizationSignals>,
  validationStatus: LocalizationRecord["validationStatus"] = "passed",
): LocalizationRecord {
  return {
    localizationId: `loc-${Date.now()}-${signals.targetCountry}-${signals.localizationCategory}`,
    timestamp: new Date().toISOString(),
    companyReference: signals.companyReference,
    targetCountry: signals.targetCountry,
    targetRegion: signals.targetRegion,
    localizationCategory: signals.localizationCategory,
    adaptationSummary: signals.adaptationSummary,
    readinessScore: signals.readinessScore,
    validationStatus,
    metadataVersion: LOC_METADATA_VERSION,
    gapScore: signals.gapScore,
    canonicalSourcePreserved: true,
    structuralSignalOnly: true,
    neverOverwriteCanonicalSourceContent: true,
  };
}
