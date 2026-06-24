import type { BuyerPersonaCreateInput } from "../../models/buyer-persona.js";
import { normalizeBuyerPersonaSlug } from "../../models/buyer-persona.js";
import type { BuyerIntentContract } from "../contracts/buyer-intent-contract.js";
import type {
  BuyerPersonaProfile,
  BuyerPersonaSpendingPower,
  BuyerPersonaUrgencyLevel,
} from "../contracts/buyer-persona-profile.js";
import type { BuyerSignal } from "../contracts/buyer-signal.js";

const CATEGORY_AGE_RANGES: Record<string, string> = {
  electronics: "18-34",
  "kitchen & dining": "25-44",
  kitchen: "25-44",
  beauty: "18-44",
  fitness: "18-40",
  home: "30-55",
  default: "25-54",
};

const CATEGORY_INTERESTS: Record<string, string[]> = {
  electronics: ["gadgets", "productivity", "tech reviews"],
  "kitchen & dining": ["cooking", "meal prep", "home organization"],
  kitchen: ["cooking", "meal prep", "home organization"],
  beauty: ["self care", "skincare", "wellness"],
  fitness: ["health", "workouts", "outdoor activity"],
  home: ["decor", "organization", "comfort"],
  default: ["online shopping", "product research"],
};

function normalizeCategoryKey(category?: string): string {
  return (category ?? "general").trim().toLowerCase();
}

function resolveAgeRange(category?: string): string {
  const key = normalizeCategoryKey(category);
  return CATEGORY_AGE_RANGES[key] ?? CATEGORY_AGE_RANGES.default ?? "25-54";
}

function resolveInterests(category?: string, keywords: string[] = []): string[] {
  const key = normalizeCategoryKey(category);
  const base =
    CATEGORY_INTERESTS[key] ??
    CATEGORY_INTERESTS.default ??
    ["online shopping", "product research"];
  const keywordInterests = keywords.slice(0, 3).map((word) => word.replace(/-/g, " "));
  return [...new Set([...base, ...keywordInterests])].slice(0, 6);
}

function resolveSpendingPower(signal: BuyerSignal): BuyerPersonaSpendingPower {
  const price = signal.estimatedSellingPriceCents;
  if (price !== undefined) {
    if (price < 3000) return "budget";
    if (price < 8000) return "moderate";
    if (price < 20000) return "premium";
    return "luxury";
  }

  const demand = signal.demandIndex ?? 50;
  if (demand >= 80) return "premium";
  if (demand >= 55) return "moderate";
  return "budget";
}

function resolveUrgencyLevel(signal: BuyerSignal): BuyerPersonaUrgencyLevel {
  const demand = signal.demandIndex ?? 50;
  const trend = signal.trendDirection ?? "stable";

  if (trend === "rising" && demand >= 85) return "critical";
  if (trend === "rising" && demand >= 65) return "high";
  if (trend === "falling" || demand < 35) return "low";
  if (demand >= 70) return "high";
  return "medium";
}

function resolvePurchaseTriggers(signal: BuyerSignal): string[] {
  const triggers = new Set<string>();

  if (signal.trendDirection === "rising") triggers.add("trending demand");
  if (signal.trendDirection === "stable") triggers.add("steady interest");
  if (signal.trendDirection === "falling") triggers.add("price-sensitive window");
  if ((signal.demandIndex ?? 0) >= 75) triggers.add("high purchase intent");
  if (signal.urgencyHints.includes("low_competition_window")) triggers.add("limited competition");

  for (const hint of signal.urgencyHints) {
    triggers.add(hint.replace(/_/g, " "));
  }

  return [...triggers].slice(0, 5);
}

function resolveSearchPatterns(signal: BuyerSignal): string[] {
  const patterns = new Set<string>();

  if (signal.productTitle) {
    patterns.add(signal.productTitle.toLowerCase());
  }
  if (signal.category) {
    patterns.add(`best ${signal.category.toLowerCase()}`);
    patterns.add(`${signal.category.toLowerCase()} reviews`);
  }
  for (const keyword of signal.keywords.slice(0, 4)) {
    patterns.add(keyword);
  }

  return [...patterns].slice(0, 6);
}

function buildPersonaName(spendingPower: BuyerPersonaSpendingPower, category?: string): string {
  const label = spendingPower.charAt(0).toUpperCase() + spendingPower.slice(1);
  const categoryLabel = (category ?? "General").trim();
  return `${label} ${categoryLabel} Shopper`;
}

function buildPersonaId(
  spendingPower: BuyerPersonaSpendingPower,
  ageRange: string,
  category?: string,
): string {
  const categorySlug = normalizeBuyerPersonaSlug(category ?? "general");
  const ageSlug = ageRange.replace(/\s+/g, "");
  return `persona:${spendingPower}:${categorySlug}:${ageSlug}`;
}

function resolveIntentStage(signal: BuyerSignal): BuyerIntentContract["stage"] {
  const demand = signal.demandIndex ?? 50;
  if (demand >= 80) return "purchase";
  if (demand >= 55) return "consideration";
  return "awareness";
}

function urgencyLevelToIntentUrgency(level: BuyerPersonaUrgencyLevel): BuyerIntentContract["urgency"] {
  return level;
}

function buildIntentId(personaId: string, signalId: string): string {
  return `intent:${personaId}:${signalId}`;
}

/** Deterministic mapper from Eye buyer signals to persona and intent contracts (no AI). */
export class BuyerPersonaMapper {
  mapSignalToPersona(signal: BuyerSignal): BuyerPersonaProfile {
    const ageRange = resolveAgeRange(signal.category);
    const spendingPower = resolveSpendingPower(signal);
    const urgencyLevel = resolveUrgencyLevel(signal);
    const interests = resolveInterests(signal.category, signal.keywords);
    const purchaseTriggers = resolvePurchaseTriggers(signal);
    const preferredPlatforms =
      signal.platformHints.length > 0 ? [...signal.platformHints] : ["web"];
    const searchPatterns = resolveSearchPatterns(signal);
    const personaId = buildPersonaId(spendingPower, ageRange, signal.category);
    const name = buildPersonaName(spendingPower, signal.category);

    const confidenceBoost = purchaseTriggers.length >= 2 ? 4 : 0;
    const confidence = Math.min(100, Math.max(0, signal.confidence + confidenceBoost));

    return {
      personaId,
      name,
      ageRange,
      interests,
      spendingPower,
      purchaseTriggers,
      urgencyLevel,
      preferredPlatforms,
      searchPatterns,
      confidence,
    };
  }

  mapSignalToIntent(signal: BuyerSignal, persona: BuyerPersonaProfile): BuyerIntentContract {
    return {
      intentId: buildIntentId(persona.personaId, signal.signalId),
      personaId: persona.personaId,
      stage: resolveIntentStage(signal),
      urgency: urgencyLevelToIntentUrgency(persona.urgencyLevel),
      confidence: persona.confidence,
      sourceSignalId: signal.signalId,
      searchPatterns: [...persona.searchPatterns],
      purchaseTriggers: [...persona.purchaseTriggers],
    };
  }

  toWorkspacePersona(
    profile: BuyerPersonaProfile,
    workspaceId: string,
    observationIds: string[],
  ): BuyerPersonaCreateInput {
    return {
      name: profile.name,
      slug: normalizeBuyerPersonaSlug(profile.name),
      description: `Mapped persona for ${profile.personaId}`,
      demographics: {
        ageRange: profile.ageRange,
        incomeLevel:
          profile.spendingPower === "budget"
            ? "low"
            : profile.spendingPower === "moderate"
              ? "middle"
              : profile.spendingPower === "premium"
                ? "upper_middle"
                : "high",
      },
      psychographics: {
        values: ["value", "convenience"],
        interests: [...profile.interests],
        lifestyle: profile.preferredPlatforms.map((platform) => `${platform}-shopper`),
        buyingMotivations: [...profile.purchaseTriggers],
      },
      painPoints: profile.urgencyLevel === "low" ? ["low urgency purchase cycle"] : ["competitive alternatives"],
      goals: profile.searchPatterns.slice(0, 2).map((pattern) => `Find ${pattern}`),
      sourceObservationIds: [...observationIds],
      confidence: profile.confidence,
      tags: [profile.spendingPower, profile.urgencyLevel, ...profile.preferredPlatforms.slice(0, 2)],
    };
  }
}

export const defaultBuyerPersonaMapper = new BuyerPersonaMapper();
