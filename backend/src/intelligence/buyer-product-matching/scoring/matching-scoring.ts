import type { BuyerPersonaProfile } from "../../buyer-intelligence/persona-intelligence/contracts/buyer-persona-profile.js";
import type { ProductEntity } from "../../product-knowledge-graph/models/product-entity.js";
import { resolveMatchTier, type MatchTier } from "../models/buyer-product-match.js";
import type { MatchingSignal, MatchingSignalType } from "../models/matching-signal.js";

export const MATCHING_SIGNAL_WEIGHTS: Record<MatchingSignalType, number> = {
  category_alignment: 0.25,
  interest_alignment: 0.25,
  age_alignment: 0.15,
  keyword_alignment: 0.2,
  persona_strength: 0.15,
};

export type MatchingScoreBreakdown = {
  score: number;
  confidence: number;
  matchTier: MatchTier;
  reasons: string[];
  matchingSignals: MatchingSignal[];
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function tokenize(value: string): string[] {
  return normalizeToken(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

function uniqueTokens(values: string[]): string[] {
  return [...new Set(values.flatMap((value) => tokenize(value)))];
}

function overlapRatio(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) return 0;
  const rightSet = new Set(right);
  const overlap = left.filter((token) => rightSet.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : overlap / union;
}

function phraseMatch(left: string, right: string): boolean {
  const normalizedLeft = normalizeToken(left);
  const normalizedRight = normalizeToken(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

function isExplicitlyTargeted(persona: BuyerPersonaProfile, product: ProductEntity): boolean {
  return product.targetBuyerPersonaIds.includes(persona.personaId);
}

function buildSignal(
  signalType: MatchingSignalType,
  score: number,
  detail: string,
): MatchingSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: MATCHING_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function scoreCategoryAlignment(
  persona: BuyerPersonaProfile,
  product: ProductEntity,
): MatchingSignal {
  const personaCategoryTokens = uniqueTokens([
    persona.name,
    ...persona.interests,
    ...persona.searchPatterns,
  ]);
  const productCategoryTokens = uniqueTokens([
    product.displayName,
    product.canonicalSlug,
    product.categoryId ?? "",
    ...product.tags,
  ]);
  const ratio = overlapRatio(personaCategoryTokens, productCategoryTokens);
  const targeted = isExplicitlyTargeted(persona, product);
  const score = targeted ? Math.max(95, ratio * 100) : ratio * 100;

  return buildSignal(
    "category_alignment",
    score,
    targeted
      ? "Product explicitly targets this persona category"
      : `Category token overlap ${Math.round(ratio * 100)}%`,
  );
}

function scoreInterestAlignment(
  persona: BuyerPersonaProfile,
  product: ProductEntity,
): MatchingSignal {
  const interestTokens = uniqueTokens(persona.interests);
  const productTokens = uniqueTokens([
    product.displayName,
    product.canonicalSlug,
    ...product.tags,
    ...product.targetBuyerPersonaIds,
  ]);
  const ratio = overlapRatio(interestTokens, productTokens);
  return buildSignal(
    "interest_alignment",
    ratio * 100,
    `Interest overlap ${Math.round(ratio * 100)}%`,
  );
}

function scoreAgeAlignment(persona: BuyerPersonaProfile, product: ProductEntity): MatchingSignal {
  if (product.targetBuyerPersonaIds.includes(persona.personaId)) {
    return buildSignal("age_alignment", 100, "Product lists persona as target buyer");
  }

  const ageTokens = uniqueTokens([persona.ageRange, persona.personaId]);
  const productTokens = uniqueTokens([
    ...product.tags,
    ...product.targetBuyerPersonaIds,
    product.canonicalSlug,
  ]);
  const ratio = overlapRatio(ageTokens, productTokens);
  return buildSignal(
    "age_alignment",
    ratio * 100,
    ratio > 0 ? `Age demographic overlap ${Math.round(ratio * 100)}%` : "No age demographic overlap",
  );
}

function scoreKeywordAlignment(
  persona: BuyerPersonaProfile,
  product: ProductEntity,
): MatchingSignal {
  const keywordTokens = uniqueTokens([
    ...persona.searchPatterns,
    ...persona.purchaseTriggers,
    ...persona.interests,
  ]);
  const productTokens = uniqueTokens([
    product.displayName,
    product.canonicalSlug,
    ...product.tags,
  ]);
  const ratio = overlapRatio(keywordTokens, productTokens);
  let score = ratio * 100;

  const slugPhrase = product.canonicalSlug.replace(/-/g, " ");
  for (const pattern of persona.searchPatterns) {
    if (phraseMatch(pattern, slugPhrase) || phraseMatch(pattern, product.displayName)) {
      score = Math.max(score, 95);
      break;
    }
  }

  return buildSignal(
    "keyword_alignment",
    score,
    score >= 95
      ? "Search pattern matches product identity"
      : `Keyword overlap ${Math.round(ratio * 100)}%`,
  );
}

function scorePersonaStrength(persona: BuyerPersonaProfile, product: ProductEntity): MatchingSignal {
  const targetedBoost = product.targetBuyerPersonaIds.includes(persona.personaId) ? 15 : 0;
  const score = Math.min(100, persona.confidence + targetedBoost);
  return buildSignal(
    "persona_strength",
    score,
    targetedBoost > 0
      ? `Persona confidence ${persona.confidence} with explicit product targeting boost`
      : `Persona confidence ${persona.confidence}`,
  );
}

function buildReasons(signals: MatchingSignal[]): string[] {
  const reasons = signals
    .filter((signal) => signal.score >= 50)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((signal) => `${signal.signalType.replace(/_/g, " ")}: ${signal.detail}`);

  if (reasons.length === 0) {
    return ["Insufficient alignment across buyer and product signals"];
  }

  return reasons;
}

function computeConfidence(
  score: number,
  persona: BuyerPersonaProfile,
  product: ProductEntity,
  signals: MatchingSignal[],
): number {
  const signalAverage =
    signals.reduce((total, signal) => total + signal.score, 0) / Math.max(signals.length, 1);
  const agreementSpread =
    signals.reduce((total, signal) => total + Math.abs(signal.score - signalAverage), 0) /
    Math.max(signals.length, 1);
  const agreementFactor = 1 - agreementSpread / 100;
  const blended = score * 0.55 + persona.confidence * 0.2 + product.confidence * 0.15 + agreementFactor * 100 * 0.1;
  return clampScore(blended);
}

/** Computes buyer-product match score from persona and product intelligence inputs. */
export function scoreBuyerProductMatch(
  persona: BuyerPersonaProfile,
  product: ProductEntity,
): MatchingScoreBreakdown {
  const matchingSignals = [
    scoreCategoryAlignment(persona, product),
    scoreInterestAlignment(persona, product),
    scoreAgeAlignment(persona, product),
    scoreKeywordAlignment(persona, product),
    scorePersonaStrength(persona, product),
  ];

  const weightedScore = matchingSignals.reduce(
    (total, signal) => total + signal.score * signal.weight,
    0,
  );
  const targeted = isExplicitlyTargeted(persona, product);
  const score = clampScore(weightedScore + (targeted ? 5 : 0));
  const confidence = computeConfidence(score, persona, product, matchingSignals);
  const matchTier = resolveMatchTier(score);
  const reasons = buildReasons(matchingSignals);

  return {
    score,
    confidence,
    matchTier,
    reasons,
    matchingSignals,
  };
}

export const matchingScoring = {
  scoreBuyerProductMatch,
  weights: MATCHING_SIGNAL_WEIGHTS,
};
