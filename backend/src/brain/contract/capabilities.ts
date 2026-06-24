import type { IntelligenceModuleId } from "./module-ids.js";

/** Capability identifiers exposed by intelligence modules through the Brain Contract. */
export type ProductScoutCapability =
  | "product-scout.evaluate"
  | "product-scout.scan_portfolio"
  | "product-scout.recommend"
  | "product-scout.persist";

export type ProductIntelligenceCapability =
  | "product-intelligence.evaluate"
  | "product-intelligence.persist";

export type SupplierIntelligenceCapability =
  | "supplier-intelligence.list"
  | "supplier-intelligence.discover"
  | "supplier-intelligence.evaluate"
  | "supplier-intelligence.score"
  | "supplier-intelligence.compare";

export type MarketingStrategistCapability =
  | "marketing-strategist.generate_campaign"
  | "marketing-strategist.analyze_channels"
  | "marketing-strategist.content_plan";

export type CfoCapability =
  | "cfo.summarize_pl"
  | "cfo.analyze_margin"
  | "cfo.treasury_snapshot"
  | "cfo.royalty_calculate";

export type CustomerSupportCapability =
  | "customer-support.triage"
  | "customer-support.retention_signal"
  | "customer-support.escalate";

export type SeoCapability =
  | "seo.audit"
  | "seo.keyword_analysis"
  | "seo.content_recommend";

export type PricingCapability =
  | "pricing.analyze"
  | "pricing.recommend"
  | "pricing.margin_guard";

export type InventoryCapability =
  | "inventory.snapshot"
  | "inventory.reorder_signal"
  | "inventory.fulfillment_risk";

export type GuardianCapability =
  | "guardian.assess"
  | "guardian.health_check"
  | "guardian.architecture_validate";

export type IntelligenceCapability =
  | ProductScoutCapability
  | ProductIntelligenceCapability
  | SupplierIntelligenceCapability
  | MarketingStrategistCapability
  | CfoCapability
  | CustomerSupportCapability
  | SeoCapability
  | PricingCapability
  | InventoryCapability
  | GuardianCapability;

/** Maps each module ID to its declared capability union. */
export type ModuleCapabilityMap = {
  "product-scout": ProductScoutCapability;
  "product-intelligence": ProductIntelligenceCapability;
  "supplier-intelligence": SupplierIntelligenceCapability;
  "marketing-strategist": MarketingStrategistCapability;
  cfo: CfoCapability;
  "customer-support": CustomerSupportCapability;
  seo: SeoCapability;
  pricing: PricingCapability;
  inventory: InventoryCapability;
  guardian: GuardianCapability;
};

/** Planned capabilities per module (contract catalog; implementations may register later). */
export const MODULE_CAPABILITIES: {
  readonly [K in IntelligenceModuleId]: readonly ModuleCapabilityMap[K][];
} = {
  "product-scout": [
    "product-scout.evaluate",
    "product-scout.scan_portfolio",
    "product-scout.recommend",
    "product-scout.persist",
  ],
  "product-intelligence": [
    "product-intelligence.evaluate",
    "product-intelligence.persist",
  ],
  "supplier-intelligence": [
    "supplier-intelligence.list",
    "supplier-intelligence.discover",
    "supplier-intelligence.evaluate",
    "supplier-intelligence.score",
    "supplier-intelligence.compare",
  ],
  "marketing-strategist": [
    "marketing-strategist.generate_campaign",
    "marketing-strategist.analyze_channels",
    "marketing-strategist.content_plan",
  ],
  cfo: [
    "cfo.summarize_pl",
    "cfo.analyze_margin",
    "cfo.treasury_snapshot",
    "cfo.royalty_calculate",
  ],
  "customer-support": [
    "customer-support.triage",
    "customer-support.retention_signal",
    "customer-support.escalate",
  ],
  seo: ["seo.audit", "seo.keyword_analysis", "seo.content_recommend"],
  pricing: ["pricing.analyze", "pricing.recommend", "pricing.margin_guard"],
  inventory: [
    "inventory.snapshot",
    "inventory.reorder_signal",
    "inventory.fulfillment_risk",
  ],
  guardian: [
    "guardian.assess",
    "guardian.health_check",
    "guardian.architecture_validate",
  ],
};
