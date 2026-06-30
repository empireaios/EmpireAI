import type { DependencyRequirement } from "../models/infrastructure-dependency.js";
import type { InfrastructureLayerId } from "../models/infrastructure-model.js";

export type DependencySeed = {
  providerId: string;
  countryCode: string;
  component: string;
  layerId: InfrastructureLayerId;
  requirement: DependencyRequirement;
  rationale: string;
  humanActionRequired: boolean;
  automatable: boolean;
};

/** D-002 seed dependencies — extensible per provider/country. */
export const PROVIDER_DEPENDENCY_SEED: DependencySeed[] = [
  // Shopee Singapore (mission example)
  { providerId: "shopee-sg", countryCode: "SG", component: "Singapore Business Registration", layerId: "business_registration", requirement: "NOT_REQUIRED", rationale: "Individual sellers may register without local entity", humanActionRequired: false, automatable: true },
  { providerId: "shopee-sg", countryCode: "SG", component: "Stripe", layerId: "payment", requirement: "NOT_REQUIRED", rationale: "Shopee uses platform-native payout rails", humanActionRequired: false, automatable: true },
  { providerId: "shopee-sg", countryCode: "SG", component: "Local Payment Gateway", layerId: "payment", requirement: "REQUIRED", rationale: "PayNow/bank payout required for seller disbursement", humanActionRequired: true, automatable: false },
  { providerId: "shopee-sg", countryCode: "SG", component: "Last-Mile Logistics", layerId: "logistics", requirement: "RECOMMENDED", rationale: "Shopee logistics integration improves delivery SLA", humanActionRequired: false, automatable: true },
  { providerId: "shopee-sg", countryCode: "SG", component: "Marketplace Advertising", layerId: "advertising", requirement: "OPTIONAL", rationale: "Shopee Ads optional for organic-first launch", humanActionRequired: false, automatable: true },
  { providerId: "shopee-sg", countryCode: "SG", component: "GST Registration", layerId: "tax", requirement: "CONDITIONAL", rationale: "Required when taxable turnover exceeds SGD threshold", humanActionRequired: true, automatable: false },
  { providerId: "shopee-sg", countryCode: "SG", component: "PDPA Compliance", layerId: "compliance", requirement: "REQUIRED", rationale: "Singapore consumer data protection applies", humanActionRequired: true, automatable: false },
  // Amazon US
  { providerId: "amazon-us", countryCode: "US", component: "US Business Entity", layerId: "business_registration", requirement: "CONDITIONAL", rationale: "Professional seller may require EIN/business verification", humanActionRequired: true, automatable: false },
  { providerId: "amazon-us", countryCode: "US", component: "Stripe", layerId: "payment", requirement: "NOT_REQUIRED", rationale: "Amazon disburses via marketplace payout", humanActionRequired: false, automatable: true },
  { providerId: "amazon-us", countryCode: "US", component: "Sales Tax Nexus", layerId: "tax", requirement: "CONDITIONAL", rationale: "State nexus rules apply per fulfillment model", humanActionRequired: true, automatable: false },
  { providerId: "amazon-us", countryCode: "US", component: "FBA Logistics", layerId: "logistics", requirement: "RECOMMENDED", rationale: "FBA recommended for Prime eligibility", humanActionRequired: false, automatable: true },
  { providerId: "amazon-us", countryCode: "US", component: "Amazon Ads", layerId: "advertising", requirement: "OPTIONAL", rationale: "Sponsored products optional at launch", humanActionRequired: false, automatable: true },
  // Shopify US
  { providerId: "shopify-us", countryCode: "US", component: "Stripe", layerId: "payment", requirement: "REQUIRED", rationale: "Shopify Payments/Stripe required for checkout", humanActionRequired: true, automatable: true },
  { providerId: "shopify-us", countryCode: "US", component: "Dropship Supplier", layerId: "supplier", requirement: "RECOMMENDED", rationale: "Supplier connection needed for catalog fulfillment", humanActionRequired: false, automatable: true },
  { providerId: "shopify-us", countryCode: "US", component: "Shipping Carrier", layerId: "logistics", requirement: "REQUIRED", rationale: "Carrier integration required for order fulfillment", humanActionRequired: true, automatable: true },
  { providerId: "shopify-us", countryCode: "US", component: "Custom Domain", layerId: "domain", requirement: "RECOMMENDED", rationale: "Branded domain improves conversion", humanActionRequired: true, automatable: true },
  // Lazada MY
  { providerId: "lazada-my", countryCode: "MY", component: "Local Bank Account", layerId: "payment", requirement: "REQUIRED", rationale: "MYR payout requires local bank", humanActionRequired: true, automatable: false },
  { providerId: "lazada-my", countryCode: "MY", component: "Lazada Logistics", layerId: "logistics", requirement: "RECOMMENDED", rationale: "Lazada fulfillment network recommended", humanActionRequired: false, automatable: true },
  { providerId: "lazada-my", countryCode: "MY", component: "SST Registration", layerId: "tax", requirement: "CONDITIONAL", rationale: "Applies above revenue threshold", humanActionRequired: true, automatable: false },
];

/** Default dependency template for providers without explicit seed. */
export function defaultProviderDependencies(providerId: string, countryCode: string, displayName: string): DependencySeed[] {
  return [
    { providerId, countryCode, component: `${displayName} Seller Account`, layerId: "marketplace", requirement: "REQUIRED", rationale: "Marketplace seller account required", humanActionRequired: true, automatable: false },
    { providerId, countryCode, component: "Local Payment Rail", layerId: "payment", requirement: "RECOMMENDED", rationale: "Local payout method recommended", humanActionRequired: true, automatable: false },
    { providerId, countryCode, component: "Fulfillment Partner", layerId: "logistics", requirement: "RECOMMENDED", rationale: "Logistics partner improves delivery", humanActionRequired: false, automatable: true },
    { providerId, countryCode, component: "Tax Registration", layerId: "tax", requirement: "CONDITIONAL", rationale: "Tax registration may be required at revenue threshold", humanActionRequired: true, automatable: false },
    { providerId, countryCode, component: "Consumer Compliance", layerId: "compliance", requirement: "REQUIRED", rationale: "Local consumer protection applies", humanActionRequired: true, automatable: false },
  ];
}

export const COUNTRY_LAYER_BASELINES: Record<string, Partial<Record<InfrastructureLayerId, string[]>>> = {
  SG: { language: ["en", "zh", "ms"], currency: ["SGD"], compliance: ["PDPA", "GST"] },
  US: { language: ["en"], currency: ["USD"], compliance: ["FTC", "State Sales Tax"] },
  GB: { language: ["en"], currency: ["GBP"], compliance: ["GDPR", "VAT"] },
  MY: { language: ["ms", "en"], currency: ["MYR"], compliance: ["PDPA MY", "SST"] },
};
