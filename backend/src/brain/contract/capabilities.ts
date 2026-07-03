import type { IntelligenceModuleId } from "./module-ids.js";

/** Capability identifiers exposed by intelligence modules through the Brain Contract. */
export type ProductScoutCapability =
  | "product-scout.evaluate"
  | "product-scout.scan_portfolio"
  | "product-scout.recommend"
  | "product-scout.persist";

export type ProductIntelligenceCapability =
  | "product-intelligence.evaluate"
  | "product-intelligence.persist"
  | "product-intelligence.architecture"
  | "product-intelligence.rank";

export type MarketIntelligenceCapability =
  | "market-intelligence.architecture"
  | "market-intelligence.analyse"
  | "market-intelligence.rank"
  | "market-intelligence.compare";

export type FinancialIntelligenceCapability =
  | "financial-intelligence.architecture"
  | "financial-intelligence.analyse"
  | "financial-intelligence.rank"
  | "financial-intelligence.forecast";

export type QuantitativeIntelligenceCapability =
  | "quantitative-intelligence.architecture"
  | "quantitative-intelligence.compute"
  | "quantitative-intelligence.simulate"
  | "quantitative-intelligence.analyse";

export type AdvertisingIntelligenceCapability =
  | "advertising-intelligence.architecture"
  | "advertising-intelligence.analyse"
  | "advertising-intelligence.rank"
  | "advertising-intelligence.compare";

export type CustomerIntelligenceCapability =
  | "customer-intelligence.architecture"
  | "customer-intelligence.analyse"
  | "customer-intelligence.rank"
  | "customer-intelligence.compare";

export type RiskIntelligenceCapability =
  | "risk-intelligence.architecture"
  | "risk-intelligence.analyse"
  | "risk-intelligence.rank"
  | "risk-intelligence.compare";

export type DecisionIntelligenceCapability =
  | "decision-intelligence.architecture"
  | "decision-intelligence.orchestrate"
  | "decision-intelligence.synthesize"
  | "decision-intelligence.feeds";

export type ExecutiveIntelligenceOrchestratorCapability =
  | "executive-intelligence-orchestrator.architecture"
  | "executive-intelligence-orchestrator.coordinate"
  | "executive-intelligence-orchestrator.aggregate"
  | "executive-intelligence-orchestrator.deliver";

export type SupplierIntelligenceCapability =
  | "supplier-intelligence.list"
  | "supplier-intelligence.discover"
  | "supplier-intelligence.evaluate"
  | "supplier-intelligence.score"
  | "supplier-intelligence.compare"
  | "supplier-intelligence.architecture"
  | "supplier-intelligence.rank";

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
  | MarketIntelligenceCapability
  | FinancialIntelligenceCapability
  | QuantitativeIntelligenceCapability
  | AdvertisingIntelligenceCapability
  | CustomerIntelligenceCapability
  | RiskIntelligenceCapability
  | DecisionIntelligenceCapability
  | ExecutiveIntelligenceOrchestratorCapability
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
  "market-intelligence": MarketIntelligenceCapability;
  "financial-intelligence": FinancialIntelligenceCapability;
  "quantitative-intelligence": QuantitativeIntelligenceCapability;
  "advertising-intelligence": AdvertisingIntelligenceCapability;
  "customer-intelligence": CustomerIntelligenceCapability;
  "risk-intelligence": RiskIntelligenceCapability;
  "decision-intelligence": DecisionIntelligenceCapability;
  "executive-intelligence-orchestrator": ExecutiveIntelligenceOrchestratorCapability;
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
    "product-intelligence.architecture",
    "product-intelligence.rank",
  ],
  "market-intelligence": [
    "market-intelligence.architecture",
    "market-intelligence.analyse",
    "market-intelligence.rank",
    "market-intelligence.compare",
  ],
  "financial-intelligence": [
    "financial-intelligence.architecture",
    "financial-intelligence.analyse",
    "financial-intelligence.rank",
    "financial-intelligence.forecast",
  ],
  "quantitative-intelligence": [
    "quantitative-intelligence.architecture",
    "quantitative-intelligence.compute",
    "quantitative-intelligence.simulate",
    "quantitative-intelligence.analyse",
  ],
  "advertising-intelligence": [
    "advertising-intelligence.architecture",
    "advertising-intelligence.analyse",
    "advertising-intelligence.rank",
    "advertising-intelligence.compare",
  ],
  "customer-intelligence": [
    "customer-intelligence.architecture",
    "customer-intelligence.analyse",
    "customer-intelligence.rank",
    "customer-intelligence.compare",
  ],
  "risk-intelligence": [
    "risk-intelligence.architecture",
    "risk-intelligence.analyse",
    "risk-intelligence.rank",
    "risk-intelligence.compare",
  ],
  "decision-intelligence": [
    "decision-intelligence.architecture",
    "decision-intelligence.orchestrate",
    "decision-intelligence.synthesize",
    "decision-intelligence.feeds",
  ],
  "executive-intelligence-orchestrator": [
    "executive-intelligence-orchestrator.architecture",
    "executive-intelligence-orchestrator.coordinate",
    "executive-intelligence-orchestrator.aggregate",
    "executive-intelligence-orchestrator.deliver",
  ],
  "supplier-intelligence": [
    "supplier-intelligence.list",
    "supplier-intelligence.discover",
    "supplier-intelligence.evaluate",
    "supplier-intelligence.score",
    "supplier-intelligence.compare",
    "supplier-intelligence.architecture",
    "supplier-intelligence.rank",
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
