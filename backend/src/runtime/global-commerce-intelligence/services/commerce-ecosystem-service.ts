import type { CommerceEcosystemProfile, EcosystemDomainCoverage } from "../models/commerce-ecosystem.js";
import {
  ECOSYSTEM_DOMAIN_IDS,
  TAX_COMPLIANCE_NOTES,
} from "../data/country-intelligence-seed-data.js";
import {
  buildGlobalCommerceRegistry,
  getCountry,
  getMarketplacesByCountry,
  getProvidersByCountry,
} from "../../global-commerce/services/global-commerce-registry-service.js";
import { getCountryIntelligenceProfile } from "./country-intelligence-service.js";

function domainCoverage(countryCode: string, domain: string, providerIds: string[]): EcosystemDomainCoverage {
  const count = providerIds.length;
  const coverageScore = Math.min(100, count * (domain === "marketplace" ? 12 : 20));
  const intelligence = getCountryIntelligenceProfile(countryCode);
  const readinessBase = intelligence?.compositeScore ?? 45;
  const readinessScore = Math.round(Math.min(100, coverageScore * 0.6 + readinessBase * 0.4));
  return { domain, providerCount: count, providerIds, coverageScore, readinessScore };
}

function deriveMaturity(health: number): CommerceEcosystemProfile["ecosystemMaturity"] {
  if (health >= 80) return "ADVANCED";
  if (health >= 65) return "MATURE";
  if (health >= 45) return "DEVELOPING";
  return "EMERGING";
}

/** B-012 — Commerce Ecosystem Engine (whole-ecosystem view per country). */
export function buildCommerceEcosystemProfile(countryCode: string): CommerceEcosystemProfile | null {
  const country = getCountry(countryCode);
  if (!country) return null;

  const providers = getProvidersByCountry(countryCode);
  const marketplaces = getMarketplacesByCountry(countryCode);

  const byDomain = (domain: string) =>
    providers.filter((p) => p.domain === domain).map((p) => p.providerId);

  const domains: EcosystemDomainCoverage[] = [
    domainCoverage(countryCode, "marketplace", marketplaces.map((p) => p.providerId)),
    domainCoverage(countryCode, "payment", byDomain("payment")),
    domainCoverage(countryCode, "supplier", byDomain("supplier")),
    domainCoverage(countryCode, "logistics", byDomain("logistics")),
    domainCoverage(countryCode, "advertising", byDomain("advertising")),
    domainCoverage(countryCode, "analytics", byDomain("analytics")),
    domainCoverage(countryCode, "customer_service", byDomain("customer_service")),
    domainCoverage(countryCode, "tax", [`tax-${countryCode.toLowerCase()}`]),
    domainCoverage(countryCode, "compliance", [`compliance-${countryCode.toLowerCase()}`]),
  ];

  const gaps: string[] = [];
  for (const d of domains) {
    if (d.providerCount === 0 && !["tax", "compliance"].includes(d.domain)) {
      gaps.push(`No ${d.domain} providers registered`);
    }
    if (d.coverageScore < 40) gaps.push(`Low ${d.domain} coverage`);
  }

  const ecosystemHealthScore = Math.round(
    domains.reduce((s, d) => s + d.coverageScore * 0.5 + d.readinessScore * 0.5, 0) / domains.length,
  );

  const taxProviders = domains.find((d) => d.domain === "tax")?.providerIds ?? [];
  const complianceNotes = TAX_COMPLIANCE_NOTES[countryCode] ?? TAX_COMPLIANCE_NOTES.EU ?? ["Local tax registration required", "Consumer protection compliance"];

  return {
    countryCode: country.countryCode,
    displayName: country.displayName,
    currency: country.currency,
    languages: [...country.languages],
    domains,
    taxProviders,
    complianceNotes: [...complianceNotes],
    ecosystemHealthScore,
    ecosystemMaturity: deriveMaturity(ecosystemHealthScore),
    gaps,
    computedAt: new Date().toISOString(),
  };
}

export function listCommerceEcosystemProfiles(): CommerceEcosystemProfile[] {
  const registry = buildGlobalCommerceRegistry();
  return registry.countries
    .map((c) => buildCommerceEcosystemProfile(c.countryCode))
    .filter((p): p is CommerceEcosystemProfile => p !== null);
}

export function listEcosystemDomainIds(): readonly string[] {
  return ECOSYSTEM_DOMAIN_IDS;
}
