/** X2-21 — Portfolio Certified dependency surface (X2-01..X2-20). */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { MultiCompanyRegistry } from "../multi-company-registry/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { CrossBusinessKnowledgeEngine } from "../cross-business-knowledge-engine/engine.js";
import type { CapitalDistributionEngine } from "../capital-distribution-engine/engine.js";
import type { ExecutivePortfolioDashboard } from "../executive-portfolio-dashboard/engine.js";
import type { PortfolioRiskEngine } from "../portfolio-risk-engine/engine.js";
import type { PortfolioBalanceEngine } from "../portfolio-balance-engine/engine.js";
import type { BusinessHealthRanking } from "../business-health-ranking/engine.js";
import type { PortfolioIntelligenceCertified } from "../portfolio-intelligence-certified/engine.js";
import type { CrossCompanyResourceEngine } from "../cross-company-resource-engine/engine.js";
import type { SharedCustomerIntelligence } from "../shared-customer-intelligence/engine.js";
import type { SharedSupplierIntelligence } from "../shared-supplier-intelligence/engine.js";
import type { PortfolioForecastEngine } from "../portfolio-forecast-engine/engine.js";
import type { AcquisitionEvaluationEngine } from "../acquisition-evaluation-engine/engine.js";
import type { PortfolioOptimizationEngine } from "../portfolio-optimization-engine/engine.js";
import type { CompanyLifecycleManager } from "../company-lifecycle-manager/engine.js";
import type { PortfolioExpansionPlanner } from "../portfolio-expansion-planner/engine.js";
import type { EnterpriseValueEngine } from "../enterprise-value-engine/engine.js";
import type { AutonomousPortfolioBoard } from "../autonomous-portfolio-board/engine.js";

export type PortfolioCertifiedDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  multiCompanyRegistry: MultiCompanyRegistry | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  crossBusinessKnowledgeEngine: CrossBusinessKnowledgeEngine | null;
  capitalDistributionEngine: CapitalDistributionEngine | null;
  executivePortfolioDashboard: ExecutivePortfolioDashboard | null;
  portfolioRiskEngine: PortfolioRiskEngine | null;
  portfolioBalanceEngine: PortfolioBalanceEngine | null;
  businessHealthRanking: BusinessHealthRanking | null;
  portfolioIntelligenceCertified: PortfolioIntelligenceCertified | null;
  crossCompanyResourceEngine: CrossCompanyResourceEngine | null;
  sharedCustomerIntelligence: SharedCustomerIntelligence | null;
  sharedSupplierIntelligence: SharedSupplierIntelligence | null;
  portfolioForecastEngine: PortfolioForecastEngine | null;
  acquisitionEvaluationEngine: AcquisitionEvaluationEngine | null;
  portfolioOptimizationEngine: PortfolioOptimizationEngine | null;
  companyLifecycleManager: CompanyLifecycleManager | null;
  portfolioExpansionPlanner: PortfolioExpansionPlanner | null;
  enterpriseValueEngine: EnterpriseValueEngine | null;
  autonomousPortfolioBoard: AutonomousPortfolioBoard | null;
};
