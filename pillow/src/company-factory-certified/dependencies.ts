/** X1-15 — Company Factory Certified dependency surface. */

import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import type { BusinessOpportunityDiscovery } from "../business-opportunity-discovery/engine.js";
import type { MarketValidationEngine } from "../market-validation-engine/engine.js";
import type { BusinessModelGenerator } from "../business-model-generator/engine.js";
import type { BrandCreationEngine } from "../brand-creation-engine/engine.js";
import type { DomainDigitalAssetPlanner } from "../domain-digital-asset-planner/engine.js";
import type { StoreGenerationEngine } from "../store-generation-engine/engine.js";
import type { ProductPortfolioBuilder } from "../product-portfolio-builder/engine.js";
import type { PricingStrategyEngine } from "../pricing-strategy-engine/engine.js";
import type { LaunchReadinessValidator } from "../launch-readiness-validator/engine.js";
import type { BusinessLaunchOrchestrator } from "../business-launch-orchestrator/engine.js";
import type { GrowthInitializationEngine } from "../growth-initialization-engine/engine.js";
import type { LaunchMonitoringEngine } from "../launch-monitoring-engine/engine.js";
import type { FirstRevenueOptimizer } from "../first-revenue-optimizer/engine.js";

export type CompanyFactoryCertifiedDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
  businessOpportunityDiscovery: BusinessOpportunityDiscovery | null;
  marketValidationEngine: MarketValidationEngine | null;
  businessModelGenerator: BusinessModelGenerator | null;
  brandCreationEngine: BrandCreationEngine | null;
  domainDigitalAssetPlanner: DomainDigitalAssetPlanner | null;
  storeGenerationEngine: StoreGenerationEngine | null;
  productPortfolioBuilder: ProductPortfolioBuilder | null;
  pricingStrategyEngine: PricingStrategyEngine | null;
  launchReadinessValidator: LaunchReadinessValidator | null;
  businessLaunchOrchestrator: BusinessLaunchOrchestrator | null;
  growthInitializationEngine: GrowthInitializationEngine | null;
  launchMonitoringEngine: LaunchMonitoringEngine | null;
  firstRevenueOptimizer: FirstRevenueOptimizer | null;
};
