import { buildGlobalCommerceRegistry } from "../../global-commerce/index.js";
import { TAX_COMPLIANCE_NOTES } from "../../global-commerce-intelligence/data/country-intelligence-seed-data.js";
import { getCountryIntelligenceProfile } from "../../global-commerce-intelligence/services/country-intelligence-service.js";
import { listExpansionIntelligenceScores } from "../../global-commerce-intelligence/services/expansion-intelligence-score-service.js";
import type { CountryDifferenceEngine } from "../models/country-difference-engine.js";

type ItemStatus = CountryDifferenceEngine["items"][number]["status"];

const DIMENSION_KEYS = [
  "language",
  "currency",
  "tax",
  "culture",
  "buying_behaviour",
  "shipping_expectations",
  "psychology",
  "competition",
] as const;

const DIMENSION_LABELS: Record<(typeof DIMENSION_KEYS)[number], string> = {
  language: "Language",
  currency: "Currency",
  tax: "Tax",
  culture: "Culture",
  buying_behaviour: "Buying behaviour",
  shipping_expectations: "Shipping expectations",
  psychology: "Psychology",
  competition: "Competition",
};

function itemStatus(score: number): ItemStatus {
  if (score >= 75) return "READY";
  if (score >= 50) return "PENDING";
  return "BLOCKED";
}

function dimensionScore(
  key: (typeof DIMENSION_KEYS)[number],
  dims: NonNullable<ReturnType<typeof getCountryIntelligenceProfile>>["dimensions"],
): { score: number; evidence: string; recommendation: string; why: string } {
  switch (key) {
    case "language":
      return {
        score: 100 - dims.languageComplexity,
        evidence: `Language complexity ${dims.languageComplexity}/100`,
        recommendation: dims.languageComplexity >= 60 ? "Localize listing copy and support" : "English-primary listing acceptable",
        why: "Language friction directly reduces conversion and increases return risk",
      };
    case "currency":
      return {
        score: dims.digitalPaymentMaturity,
        evidence: `Digital payment maturity ${dims.digitalPaymentMaturity}/100`,
        recommendation: "Price in local currency with transparent FX if cross-border",
        why: "Local currency checkout increases trust and reduces cart abandonment",
      };
    case "tax":
      return {
        score: 100 - dims.taxComplexity,
        evidence: `Tax complexity ${dims.taxComplexity}/100`,
        recommendation: dims.taxComplexity >= 65 ? "Engage tax compliance before scaling ads" : "Standard VAT/sales tax registration path",
        why: "Tax misconfiguration erodes net margin and creates regulatory blockers",
      };
    case "culture":
      return {
        score: Math.round((dims.businessFriendliness + dims.crossBorderFriendliness) / 2),
        evidence: `Business friendliness ${dims.businessFriendliness} · cross-border ${dims.crossBorderFriendliness}`,
        recommendation: "Adapt imagery and claims to local cultural norms",
        why: "Cultural mismatch triggers low CTR and policy complaints",
      };
    case "buying_behaviour":
      return {
        score: Math.round((dims.ecommercePenetration + dims.consumerPurchasingPower) / 2),
        evidence: `E-commerce penetration ${dims.ecommercePenetration} · purchasing power ${dims.consumerPurchasingPower}`,
        recommendation: dims.ecommercePenetration >= 75 ? "Prioritize marketplace-native merchandising" : "Education-heavy listing copy",
        why: "Buying behaviour sets price point and bundle strategy",
      };
    case "shipping_expectations":
      return {
        score: dims.logisticsMaturity,
        evidence: `Logistics maturity ${dims.logisticsMaturity}/100`,
        recommendation: dims.logisticsMaturity >= 80 ? "Match Prime-equivalent SLAs where possible" : "Set explicit delivery windows — never reject on time alone",
        why: "Shipping expectations drive refund rate more than acquisition in mature markets",
      };
    case "psychology":
      return {
        score: Math.round((dims.consumerPurchasingPower + (100 - dims.regulatoryDifficulty)) / 2),
        evidence: `Purchasing power ${dims.consumerPurchasingPower} · regulatory load ${dims.regulatoryDifficulty}`,
        recommendation: "Simulate trust, value, and urgency before launch — REAL-028",
        why: "Psychology simulation prevents costly listing iterations post-publish",
      };
    case "competition":
      return {
        score: 100 - dims.competitionIntensity,
        evidence: `Competition intensity ${dims.competitionIntensity}/100`,
        recommendation: dims.competitionIntensity >= 80 ? "Differentiate on bundle or speed — avoid price war" : "First-mover listing advantage available",
        why: "Competition intensity determines margin floor and ad CPC viability",
      };
  }
}

/** REAL-074 — Country difference engine (global-commerce + expansion intelligence). */
export function buildCountryDifferenceEngine(
  workspaceId: string,
  companyId: string,
): CountryDifferenceEngine {
  let scores = listExpansionIntelligenceScores(workspaceId, companyId);
  if (scores.length === 0) {
    const registry = buildGlobalCommerceRegistry();
    scores = registry.countries.slice(0, 6).map((c) => ({
      countryCode: c.countryCode,
      displayName: c.displayName,
      expansionScore: 55,
      grade: "C" as const,
      dimensions: [],
      summary: `${c.displayName} baseline readiness`,
      computedAt: new Date().toISOString(),
    }));
  }

  const items: CountryDifferenceEngine["items"] = [];

  for (const countryScore of scores.slice(0, 8)) {
    const profile = getCountryIntelligenceProfile(countryScore.countryCode);
    const registryCountry = buildGlobalCommerceRegistry().countries.find(
      (c) => c.countryCode === countryScore.countryCode,
    );
    if (!profile) continue;

    const taxNotes = TAX_COMPLIANCE_NOTES[countryScore.countryCode]?.join("; ")
      ?? `Tax complexity ${profile.dimensions.taxComplexity}/100`;

    for (const key of DIMENSION_KEYS) {
      const dim = dimensionScore(key, profile.dimensions);
      let evidence = dim.evidence;
      if (key === "language" && registryCountry) {
        evidence += ` · languages ${registryCountry.languages.join(", ")}`;
      }
      if (key === "currency" && registryCountry) {
        evidence += ` · currency ${registryCountry.currency}`;
      }
      if (key === "tax") {
        evidence += ` · ${taxNotes}`;
      }
      if (key === "competition") {
        evidence += ` · GCI expansion ${countryScore.expansionScore}`;
      }

      items.push({
        itemId: `${countryScore.countryCode}-${key}`,
        label: `${profile.displayName} — ${DIMENSION_LABELS[key]}`,
        score: dim.score,
        status: itemStatus(dim.score),
        recommendation: dim.recommendation,
        evidence,
        why: dim.why,
      });
    }
  }

  const readyCount = items.filter((i) => i.status === "READY").length;

  return {
    moduleId: "country-difference-engine",
    missionId: "REAL-074",
    workspaceId,
    companyId,
    summary: `${items.length} country difference facets · ${readyCount} ready · sourced from GCI + global-commerce registry`,
    items,
    reusedModules: ["global-commerce", "global-commerce-intelligence"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
