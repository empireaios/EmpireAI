/** X4-04 — Shared structural language scoring helpers (no live translation APIs). */

import { LI_METADATA_VERSION } from "./paths.js";
import type { LanguageIntelligenceConfiguration } from "./configuration.js";
import type {
  LanguageAnalysisInput,
  LanguageIntelligenceRecord,
  SupportedLanguageStatus,
  TranslationCategory,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: LanguageAnalysisInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function normalizeLanguage(input?: LanguageAnalysisInput): string {
  const raw = input?.language?.trim() || detectFromSample(input?.sampleText) || "en";
  return raw.toLowerCase().slice(0, 12);
}

export function defaultCategory(input?: LanguageAnalysisInput): TranslationCategory {
  return input?.translationCategory ?? "customer_facing";
}

function detectFromSample(sample?: string): string | null {
  if (!sample?.trim()) return null;
  const text = sample.toLowerCase();
  if (/[あ-んア-ン]/.test(sample)) return "ja";
  if (/[가-힣]/.test(sample)) return "ko";
  if (/[\u4e00-\u9fff]/.test(sample)) return "zh";
  if (/[а-яё]/.test(text)) return "ru";
  if (/[àâçéèêëîïôùûü]/.test(text) || /\b(bonjour|merci)\b/.test(text)) return "fr";
  if (/[äöüß]/.test(text) || /\b(danke|guten)\b/.test(text)) return "de";
  if (/\b(hola|gracias|señor)\b/.test(text)) return "es";
  if (/\b(obrigado|você)\b/.test(text)) return "pt";
  if (/[ا-ي]/.test(sample)) return "ar";
  if (/[अ-ह]/.test(sample)) return "hi";
  return "en";
}

export function resolveSupportedStatus(
  language: string,
  config: LanguageIntelligenceConfiguration,
): SupportedLanguageStatus {
  const supported = new Set(config.supportedLanguages.map((l) => l.toLowerCase()));
  if (supported.has(language)) return "supported";
  if (language.length === 2) return "partial";
  return "unsupported";
}

export function computeStructuralLanguageSignals(
  input: LanguageAnalysisInput,
  config: LanguageIntelligenceConfiguration,
): {
  companyReference: string;
  language: string;
  translationCategory: TranslationCategory;
  translationQualityScore: number;
  supportedLanguageStatus: SupportedLanguageStatus;
  detectedPreferenceConfidence: number;
  terminologyConsistencyScore: number;
  recommendationSummary: string;
} {
  const companyReference = defaultCompany(input);
  const language = normalizeLanguage(input);
  const translationCategory = defaultCategory(input);
  const supportedLanguageStatus = resolveSupportedStatus(language, config);
  const seed = `${companyReference}::${language}::${translationCategory}`;

  const translationQualityScore = Math.round(
    input.qualityHint ??
      (supportedLanguageStatus === "unsupported"
        ? hashScore(`${seed}:q`, 10, 45)
        : hashScore(`${seed}:q`, 55, 96)),
  );
  const detectedPreferenceConfidence = Math.round(
    input.preferenceHint ?? hashScore(`${seed}:pref`, 50, 98),
  );
  const terminologyConsistencyScore = Math.round(
    input.terminologyHint ?? hashScore(`${seed}:term`, 50, 95),
  );

  const recommendationSummary =
    supportedLanguageStatus === "unsupported"
      ? `Language ${language} unsupported for ${translationCategory} — add resource pack; quality=${translationQualityScore}`
      : `Maintain ${language} for ${translationCategory} — quality=${translationQualityScore}, terminology=${terminologyConsistencyScore}; canonical source preserved`;

  return {
    companyReference,
    language,
    translationCategory,
    translationQualityScore: Math.max(0, Math.min(100, translationQualityScore)),
    supportedLanguageStatus,
    detectedPreferenceConfidence: Math.max(0, Math.min(100, detectedPreferenceConfidence)),
    terminologyConsistencyScore: Math.max(0, Math.min(100, terminologyConsistencyScore)),
    recommendationSummary,
  };
}

export function buildLanguageIntelligenceRecord(
  signals: ReturnType<typeof computeStructuralLanguageSignals>,
  validationStatus: LanguageIntelligenceRecord["validationStatus"] = "passed",
): LanguageIntelligenceRecord {
  return {
    languageIntelligenceId: `li-${Date.now()}-${signals.language}-${signals.translationCategory}`,
    timestamp: new Date().toISOString(),
    companyReference: signals.companyReference,
    language: signals.language,
    translationCategory: signals.translationCategory,
    translationQualityScore: signals.translationQualityScore,
    supportedLanguageStatus: signals.supportedLanguageStatus,
    recommendationSummary: signals.recommendationSummary,
    validationStatus,
    metadataVersion: LI_METADATA_VERSION,
    detectedPreferenceConfidence: signals.detectedPreferenceConfidence,
    terminologyConsistencyScore: signals.terminologyConsistencyScore,
    canonicalSourcePreserved: true,
    structuralSignalOnly: true,
    neverOverwriteCanonicalSourceContentAutomatically: true,
  };
}
