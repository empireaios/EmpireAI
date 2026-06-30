import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { DomainAlternative } from "../models/domain-alternative.js";
import type { DomainRecommendationCreateInput } from "../models/domain-recommendation.js";
import type { AvailabilityStatus } from "../models/availability-status.js";
import type { DomainSignal, DomainSignalType } from "../models/domain-signal.js";

export const DOMAIN_SIGNAL_WEIGHTS: Record<DomainSignalType, number> = {
  brand_name_alignment: 0.22,
  slug_quality: 0.18,
  tld_preference: 0.14,
  availability_estimate: 0.14,
  alternative_coverage: 0.12,
  niche_relevance: 0.12,
  domain_composite: 0.08,
};

export type DomainIntelligenceBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type DomainIntelligenceInput = {
  brand: DomainIntelligenceBrandInput;
  storeId?: string;
  preferredTlds?: string[];
};

export type DomainIntelligenceBreakdown = DomainRecommendationCreateInput;

const COMMON_SHORT_WORDS = new Set([
  "shop",
  "store",
  "buy",
  "best",
  "home",
  "tech",
  "app",
  "web",
  "pro",
  "hub",
  "lab",
  "box",
  "go",
  "get",
  "my",
  "the",
  "co",
]);

const DEFAULT_TLDS = ["com", "co", "store", "shop"] as const;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/^-|-$/g, "");
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function buildSignal(
  signalType: DomainSignalType,
  score: number,
  detail: string,
): DomainSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: DOMAIN_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function extractBaseSlug(brand: DomainIntelligenceBrandInput): string {
  const brandSlug = slugify(brand.brandName);
  if (brandSlug.length >= 4) {
    return brandSlug.slice(0, 32);
  }

  const nicheSlug = slugify(brand.niche);
  return `${brandSlug}${nicheSlug}`.slice(0, 32) || "storefront";
}

function buildDomainCandidates(
  brand: DomainIntelligenceBrandInput,
  preferredTlds?: string[],
): string[] {
  const slug = extractBaseSlug(brand);
  const tokens = tokenize(brand.brandName);
  const nicheToken = tokenize(brand.niche)[0] ?? "store";
  const tlds = preferredTlds?.length ? preferredTlds : [...DEFAULT_TLDS];

  const stems = [
    slug,
    `${slug}shop`,
    `${slug}store`,
    `get${slug}`,
    `shop${slug}`,
    `${tokens.slice(0, 2).join("") || slug}${nicheToken}`.slice(0, 24),
  ];

  const uniqueDomains = new Set<string>();
  for (const stem of stems) {
    for (const tld of tlds) {
      uniqueDomains.add(`${stem}.${tld}`);
    }
  }

  return [...uniqueDomains];
}

function estimateAvailability(domain: string): AvailabilityStatus {
  const [label, tld] = domain.split(".");
  if (!label || !tld) return "UNVERIFIED";

  if (label.length <= 4 && COMMON_SHORT_WORDS.has(label)) {
    return "LIKELY_TAKEN";
  }
  if (tld === "com" && label.length <= 5) {
    return "LIKELY_TAKEN";
  }
  if (label.includes("-") || label.length >= 18) {
    return "LIKELY_AVAILABLE";
  }
  if (label.length >= 12 && !COMMON_SHORT_WORDS.has(label)) {
    return "LIKELY_AVAILABLE";
  }

  return "UNVERIFIED";
}

function scoreBrandFit(domain: string, brand: DomainIntelligenceBrandInput): number {
  const label = domain.split(".")[0] ?? "";
  const slug = extractBaseSlug(brand);
  const tokens = tokenize(brand.brandName);

  if (label === slug) {
    if (slug.length <= 4 || COMMON_SHORT_WORDS.has(slug)) return 58;
    if (slug.length <= 6) return 78;
    return 95;
  }
  if (label.startsWith(slug) || label.endsWith(slug)) return 88;
  if (tokens.every((token) => label.includes(token))) return 82;

  const matchedTokens = tokens.filter((token) => label.includes(token)).length;
  const tokenCoverage = tokens.length === 0 ? 0 : matchedTokens / tokens.length;
  return clampScore(55 + tokenCoverage * 30);
}

function scoreSlugQuality(slug: string): number {
  if (slug.length >= 8 && slug.length <= 20) return 88;
  if (slug.length >= 5 && slug.length <= 24) return 76;
  if (slug.length < 5) return 48;
  return 64;
}

function scoreTldPreference(domain: string, preferredTlds?: string[]): number {
  const tld = domain.split(".").pop() ?? "";
  if (preferredTlds?.includes(tld)) return 90;
  if (tld === "com") return 86;
  if (tld === "co" || tld === "store" || tld === "shop") return 78;
  return 62;
}

function scoreNicheRelevance(domain: string, brand: DomainIntelligenceBrandInput): number {
  const label = domain.split(".")[0] ?? "";
  const nicheTokens = tokenize(brand.niche);
  const matched = nicheTokens.filter((token) => label.includes(token)).length;
  if (matched === 0) return 58;
  return clampScore(62 + matched * 12);
}

function rankCandidates(
  brand: DomainIntelligenceBrandInput,
  preferredTlds?: string[],
): DomainAlternative[] {
  const candidates = buildDomainCandidates(brand, preferredTlds);

  return candidates
    .map((domain) => {
      const brandFitScore = scoreBrandFit(domain, brand);
      const availabilityStatus = estimateAvailability(domain);
      const availabilityTiebreaker =
        availabilityStatus === "LIKELY_AVAILABLE"
          ? 2
          : availabilityStatus === "UNVERIFIED"
            ? 1
            : 0;

      return {
        domain,
        brandFitScore,
        availabilityStatus,
        rankScore: brandFitScore * 10 + availabilityTiebreaker + scoreTldPreference(domain, preferredTlds) * 0.05,
      };
    })
    .sort(
      (left, right) =>
        right.rankScore - left.rankScore || left.domain.localeCompare(right.domain),
    )
    .map(({ domain, brandFitScore, availabilityStatus }) => ({
      domain,
      brandFitScore,
      availabilityStatus,
    }));
}

function computeConfidence(
  brand: DomainIntelligenceBrandInput,
  primary: DomainAlternative,
  alternatives: DomainAlternative[],
  signals: DomainSignal[],
): number {
  const availabilityScore =
    primary.availabilityStatus === "LIKELY_AVAILABLE"
      ? 88
      : primary.availabilityStatus === "UNVERIFIED"
        ? 72
        : 52;

  return clampScore(
    brand.confidence * 0.25 +
      primary.brandFitScore * 0.3 +
      availabilityScore * 0.2 +
      (alternatives.length >= 3 ? 82 : 60) * 0.15 +
      average(signals.map((signal) => signal.score)) * 0.1,
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSignals(
  brand: DomainIntelligenceBrandInput,
  primary: DomainAlternative,
  alternatives: DomainAlternative[],
  preferredTlds: string[] | undefined,
  confidence: number,
): DomainSignal[] {
  const slug = extractBaseSlug(brand);

  return [
    buildSignal(
      "brand_name_alignment",
      primary.brandFitScore,
      `Primary domain ${primary.domain} aligns with ${brand.brandName}`,
    ),
    buildSignal("slug_quality", scoreSlugQuality(slug), `Brand slug ${slug}`),
    buildSignal(
      "tld_preference",
      scoreTldPreference(primary.domain, preferredTlds),
      `TLD preference for ${primary.domain}`,
    ),
    buildSignal(
      "availability_estimate",
      primary.availabilityStatus === "LIKELY_AVAILABLE"
        ? 86
        : primary.availabilityStatus === "UNVERIFIED"
          ? 68
          : 42,
      `Availability estimate ${primary.availabilityStatus} (heuristic only)`,
    ),
    buildSignal(
      "alternative_coverage",
      alternatives.length >= 4 ? 88 : 70,
      `${alternatives.length} alternative domains generated`,
    ),
    buildSignal(
      "niche_relevance",
      scoreNicheRelevance(primary.domain, brand),
      `Niche relevance for ${brand.niche}`,
    ),
    buildSignal("domain_composite", confidence, `Domain recommendation confidence ${confidence}`),
  ];
}

/** Heuristic availability estimate — no live registrar lookup. */
export function estimateDomainAvailability(domain: string): AvailabilityStatus {
  return estimateAvailability(domain);
}

/** Generates domain recommendations from brand intelligence inputs. */
export function scoreDomainIntelligence(
  input: DomainIntelligenceInput,
): DomainIntelligenceBreakdown {
  const { brand, storeId, preferredTlds } = input;
  const ranked = rankCandidates(brand, preferredTlds);
  const primary = ranked[0]!;
  const alternativeDomains = ranked.slice(1, 7);
  const signals = buildSignals(brand, primary, alternativeDomains, preferredTlds, 0);
  const confidence = computeConfidence(brand, primary, alternativeDomains, signals);
  const finalSignals = buildSignals(
    brand,
    primary,
    alternativeDomains,
    preferredTlds,
    confidence,
  );

  return {
    brandId: brand.brandId,
    storeId: storeId ?? null,
    primaryDomain: primary.domain,
    alternativeDomains,
    brandFitScore: primary.brandFitScore,
    availabilityStatus: primary.availabilityStatus,
    confidence,
    signals: finalSignals,
  };
}

export const domainIntelligenceScoring = {
  scoreDomainIntelligence,
  estimateDomainAvailability,
  weights: DOMAIN_SIGNAL_WEIGHTS,
};
