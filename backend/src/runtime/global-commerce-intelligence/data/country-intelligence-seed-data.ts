import type { CountryIntelligenceDimensions } from "../models/country-intelligence.js";

/** B-011 seed intelligence — extensible map keyed by ISO country code. */
export const COUNTRY_INTELLIGENCE_SEED: Record<string, CountryIntelligenceDimensions> = {
  SG: { marketMaturity: 88, marketGrowth: 72, ecommercePenetration: 85, digitalPaymentMaturity: 92, logisticsMaturity: 90, consumerPurchasingPower: 82, languageComplexity: 35, taxComplexity: 40, businessFriendliness: 95, marketplaceDensity: 78, competitionIntensity: 75, supplierAccessibility: 70, crossBorderFriendliness: 88, regulatoryDifficulty: 30 },
  MY: { marketMaturity: 75, marketGrowth: 78, ecommercePenetration: 72, digitalPaymentMaturity: 78, logisticsMaturity: 72, consumerPurchasingPower: 65, languageComplexity: 45, taxComplexity: 50, businessFriendliness: 80, marketplaceDensity: 70, competitionIntensity: 68, supplierAccessibility: 75, crossBorderFriendliness: 75, regulatoryDifficulty: 45 },
  ID: { marketMaturity: 68, marketGrowth: 85, ecommercePenetration: 65, digitalPaymentMaturity: 62, logisticsMaturity: 55, consumerPurchasingPower: 50, languageComplexity: 55, taxComplexity: 60, businessFriendliness: 65, marketplaceDensity: 82, competitionIntensity: 70, supplierAccessibility: 80, crossBorderFriendliness: 60, regulatoryDifficulty: 65 },
  TH: { marketMaturity: 72, marketGrowth: 76, ecommercePenetration: 68, digitalPaymentMaturity: 70, logisticsMaturity: 68, consumerPurchasingPower: 58, languageComplexity: 50, taxComplexity: 55, businessFriendliness: 72, marketplaceDensity: 72, competitionIntensity: 72, supplierAccessibility: 78, crossBorderFriendliness: 68, regulatoryDifficulty: 50 },
  PH: { marketMaturity: 65, marketGrowth: 80, ecommercePenetration: 62, digitalPaymentMaturity: 58, logisticsMaturity: 52, consumerPurchasingPower: 45, languageComplexity: 40, taxComplexity: 55, businessFriendliness: 68, marketplaceDensity: 68, competitionIntensity: 65, supplierAccessibility: 72, crossBorderFriendliness: 62, regulatoryDifficulty: 58 },
  VN: { marketMaturity: 70, marketGrowth: 88, ecommercePenetration: 70, digitalPaymentMaturity: 65, logisticsMaturity: 58, consumerPurchasingPower: 48, languageComplexity: 60, taxComplexity: 58, businessFriendliness: 70, marketplaceDensity: 75, competitionIntensity: 68, supplierAccessibility: 85, crossBorderFriendliness: 55, regulatoryDifficulty: 62 },
  US: { marketMaturity: 95, marketGrowth: 55, ecommercePenetration: 92, digitalPaymentMaturity: 95, logisticsMaturity: 90, consumerPurchasingPower: 90, languageComplexity: 20, taxComplexity: 75, businessFriendliness: 85, marketplaceDensity: 90, competitionIntensity: 92, supplierAccessibility: 88, crossBorderFriendliness: 70, regulatoryDifficulty: 55 },
  GB: { marketMaturity: 90, marketGrowth: 58, ecommercePenetration: 88, digitalPaymentMaturity: 90, logisticsMaturity: 85, consumerPurchasingPower: 82, languageComplexity: 15, taxComplexity: 60, businessFriendliness: 88, marketplaceDensity: 82, competitionIntensity: 85, supplierAccessibility: 80, crossBorderFriendliness: 78, regulatoryDifficulty: 45 },
  DE: { marketMaturity: 88, marketGrowth: 52, ecommercePenetration: 82, digitalPaymentMaturity: 85, logisticsMaturity: 88, consumerPurchasingPower: 85, languageComplexity: 55, taxComplexity: 70, businessFriendliness: 82, marketplaceDensity: 78, competitionIntensity: 80, supplierAccessibility: 82, crossBorderFriendliness: 72, regulatoryDifficulty: 60 },
  FR: { marketMaturity: 86, marketGrowth: 54, ecommercePenetration: 80, digitalPaymentMaturity: 82, logisticsMaturity: 82, consumerPurchasingPower: 80, languageComplexity: 50, taxComplexity: 72, businessFriendliness: 78, marketplaceDensity: 75, competitionIntensity: 78, supplierAccessibility: 78, crossBorderFriendliness: 70, regulatoryDifficulty: 58 },
  JP: { marketMaturity: 92, marketGrowth: 48, ecommercePenetration: 78, digitalPaymentMaturity: 88, logisticsMaturity: 92, consumerPurchasingPower: 88, languageComplexity: 80, taxComplexity: 65, businessFriendliness: 75, marketplaceDensity: 85, competitionIntensity: 88, supplierAccessibility: 65, crossBorderFriendliness: 55, regulatoryDifficulty: 70 },
  KR: { marketMaturity: 90, marketGrowth: 60, ecommercePenetration: 85, digitalPaymentMaturity: 92, logisticsMaturity: 88, consumerPurchasingPower: 85, languageComplexity: 75, taxComplexity: 60, businessFriendliness: 80, marketplaceDensity: 80, competitionIntensity: 82, supplierAccessibility: 70, crossBorderFriendliness: 58, regulatoryDifficulty: 55 },
  CN: { marketMaturity: 94, marketGrowth: 65, ecommercePenetration: 90, digitalPaymentMaturity: 95, logisticsMaturity: 85, consumerPurchasingPower: 70, languageComplexity: 85, taxComplexity: 80, businessFriendliness: 60, marketplaceDensity: 95, competitionIntensity: 95, supplierAccessibility: 95, crossBorderFriendliness: 40, regulatoryDifficulty: 85 },
  IN: { marketMaturity: 72, marketGrowth: 82, ecommercePenetration: 58, digitalPaymentMaturity: 72, logisticsMaturity: 55, consumerPurchasingPower: 42, languageComplexity: 70, taxComplexity: 68, businessFriendliness: 62, marketplaceDensity: 75, competitionIntensity: 78, supplierAccessibility: 88, crossBorderFriendliness: 50, regulatoryDifficulty: 72 },
  AU: { marketMaturity: 85, marketGrowth: 55, ecommercePenetration: 82, digitalPaymentMaturity: 88, logisticsMaturity: 78, consumerPurchasingPower: 88, languageComplexity: 18, taxComplexity: 55, businessFriendliness: 90, marketplaceDensity: 72, competitionIntensity: 72, supplierAccessibility: 72, crossBorderFriendliness: 75, regulatoryDifficulty: 42 },
  BR: { marketMaturity: 78, marketGrowth: 70, ecommercePenetration: 68, digitalPaymentMaturity: 72, logisticsMaturity: 62, consumerPurchasingPower: 55, languageComplexity: 45, taxComplexity: 78, businessFriendliness: 65, marketplaceDensity: 78, competitionIntensity: 75, supplierAccessibility: 82, crossBorderFriendliness: 52, regulatoryDifficulty: 75 },
  MX: { marketMaturity: 76, marketGrowth: 72, ecommercePenetration: 65, digitalPaymentMaturity: 68, logisticsMaturity: 65, consumerPurchasingPower: 52, languageComplexity: 40, taxComplexity: 65, businessFriendliness: 70, marketplaceDensity: 72, competitionIntensity: 70, supplierAccessibility: 80, crossBorderFriendliness: 65, regulatoryDifficulty: 60 },
  ZA: { marketMaturity: 68, marketGrowth: 62, ecommercePenetration: 55, digitalPaymentMaturity: 62, logisticsMaturity: 58, consumerPurchasingPower: 48, languageComplexity: 35, taxComplexity: 58, businessFriendliness: 72, marketplaceDensity: 58, competitionIntensity: 62, supplierAccessibility: 65, crossBorderFriendliness: 60, regulatoryDifficulty: 55 },
  NG: { marketMaturity: 55, marketGrowth: 85, ecommercePenetration: 42, digitalPaymentMaturity: 48, logisticsMaturity: 40, consumerPurchasingPower: 35, languageComplexity: 30, taxComplexity: 62, businessFriendliness: 58, marketplaceDensity: 52, competitionIntensity: 55, supplierAccessibility: 70, crossBorderFriendliness: 45, regulatoryDifficulty: 68 },
};

/** Default dimensions for countries not in seed — supports unlimited registry expansion. */
export const DEFAULT_COUNTRY_INTELLIGENCE: CountryIntelligenceDimensions = {
  marketMaturity: 50,
  marketGrowth: 55,
  ecommercePenetration: 45,
  digitalPaymentMaturity: 45,
  logisticsMaturity: 45,
  consumerPurchasingPower: 45,
  languageComplexity: 50,
  taxComplexity: 55,
  businessFriendliness: 50,
  marketplaceDensity: 40,
  competitionIntensity: 50,
  supplierAccessibility: 50,
  crossBorderFriendliness: 45,
  regulatoryDifficulty: 55,
};

export const TAX_COMPLIANCE_NOTES: Record<string, string[]> = {
  SG: ["GST registration for taxable turnover", "ACRA business registration"],
  US: ["Sales tax nexus by state", "EIN required"],
  GB: ["VAT registration threshold", "Companies House registration"],
  DE: ["USt-IdNr VAT ID", "Impressum requirements"],
  EU: ["OSS/IOSS cross-border VAT", "GDPR compliance"],
};

export const ECOSYSTEM_DOMAIN_IDS = [
  "marketplace",
  "payment",
  "supplier",
  "logistics",
  "advertising",
  "analytics",
  "customer_service",
  "tax",
  "compliance",
] as const;
