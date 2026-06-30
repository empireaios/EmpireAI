import type { CountryIntelligenceDimensions, CountryIntelligenceProfile } from "../models/country-intelligence.js";
import { COUNTRY_INTELLIGENCE_SEED, DEFAULT_COUNTRY_INTELLIGENCE } from "../data/country-intelligence-seed-data.js";
import { buildGlobalCommerceRegistry, getCountry } from "../../global-commerce/index.js";

function computeCompositeScore(dimensions: CountryIntelligenceDimensions): number {
  const positive =
    dimensions.marketMaturity * 0.08 +
    dimensions.marketGrowth * 0.1 +
    dimensions.ecommercePenetration * 0.1 +
    dimensions.digitalPaymentMaturity * 0.08 +
    dimensions.logisticsMaturity * 0.07 +
    dimensions.consumerPurchasingPower * 0.08 +
    dimensions.businessFriendliness * 0.07 +
    dimensions.marketplaceDensity * 0.07 +
    dimensions.supplierAccessibility * 0.08 +
    dimensions.crossBorderFriendliness * 0.1;
  const negative =
    dimensions.languageComplexity * 0.05 +
    dimensions.taxComplexity * 0.04 +
    dimensions.competitionIntensity * 0.04 +
    dimensions.regulatoryDifficulty * 0.04;
  return Math.round(Math.max(0, Math.min(100, positive - negative * 0.3)));
}

function buildEvidenceSummary(countryCode: string, dimensions: CountryIntelligenceDimensions, source: CountryIntelligenceProfile["dataSource"]): string {
  const highlights: string[] = [];
  if (dimensions.marketGrowth >= 80) highlights.push("high growth");
  if (dimensions.ecommercePenetration >= 80) highlights.push("strong e-commerce penetration");
  if (dimensions.digitalPaymentMaturity >= 85) highlights.push("mature digital payments");
  if (dimensions.crossBorderFriendliness >= 80) highlights.push("cross-border friendly");
  if (dimensions.regulatoryDifficulty >= 70) highlights.push("regulatory complexity");
  if (dimensions.competitionIntensity >= 85) highlights.push("intense competition");
  const base = highlights.length ? highlights.join(", ") : "balanced market profile";
  return source === "REGISTRY_FALLBACK"
    ? `${countryCode}: baseline intelligence (${base}) — add seed data for precision`
    : `${countryCode}: ${base}`;
}

/** B-011 — Country Intelligence Engine. Supports unlimited countries via registry + seed overlay. */
export function getCountryIntelligenceProfile(countryCode: string): CountryIntelligenceProfile | null {
  const country = getCountry(countryCode);
  if (!country) return null;

  const seed = COUNTRY_INTELLIGENCE_SEED[countryCode];
  const dimensions = seed ?? DEFAULT_COUNTRY_INTELLIGENCE;
  const dataSource = seed ? "SEED" as const : "REGISTRY_FALLBACK" as const;

  return {
    countryCode: country.countryCode,
    displayName: country.displayName,
    regionId: country.regionId,
    dimensions,
    compositeScore: computeCompositeScore(dimensions),
    evidenceSummary: buildEvidenceSummary(country.countryCode, dimensions, dataSource),
    dataSource,
    computedAt: new Date().toISOString(),
  };
}

export function listCountryIntelligenceProfiles(): CountryIntelligenceProfile[] {
  const registry = buildGlobalCommerceRegistry();
  return registry.countries
    .map((c) => getCountryIntelligenceProfile(c.countryCode))
    .filter((p): p is CountryIntelligenceProfile => p !== null);
}

export function registerCountryIntelligenceSeed(
  countryCode: string,
  dimensions: CountryIntelligenceDimensions,
): void {
  COUNTRY_INTELLIGENCE_SEED[countryCode] = dimensions;
}

export function getSeedCountryCount(): number {
  return Object.keys(COUNTRY_INTELLIGENCE_SEED).length;
}
