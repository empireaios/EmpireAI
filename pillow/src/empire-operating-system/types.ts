/** PILLOW-EOS-001 — Empire Operating System types (Phase 9). */

export type CompanyStatus = "draft" | "launching" | "operating" | "scaling" | "paused";

export interface CompanyProduct {
  id: string;
  name: string;
  priceUsd: number;
  costUsd: number;
  marginPercent: number;
  demandScore: number;
}

export interface CompanyOperations {
  supplierId: string;
  supplierName: string;
  shippingDaysAvg: number;
  customerServiceChannel: string;
  fulfillmentModel: "dropship" | "hybrid" | "inventory";
}

export interface EmpireCompany {
  id: string;
  name: string;
  brand: string;
  status: CompanyStatus;
  businessModel: string;
  productCatalog: CompanyProduct[];
  pricingStrategy: string;
  storeUrl: string | null;
  operations: CompanyOperations;
  launchPlanId: string | null;
  createdAt: string;
  marketIds: string[];
}

export interface CompanyCreationPackage {
  company: EmpireCompany;
  businessModel: string;
  brand: string;
  productCatalog: CompanyProduct[];
  pricing: string;
  storeConcept: string;
  operationsPlan: string[];
  launchPlan: string[];
  launchReadiness: "ready" | "conditional" | "not_ready";
}

export interface CompanyOperationSnapshot {
  companyId: string;
  companyName: string;
  status: CompanyStatus;
  productCount: number;
  activeCampaigns: string[];
  monthlyRevenueEstimateUsd: number;
  monthlyCostEstimateUsd: number;
  customerSatisfactionScore: number;
  operationalEfficiencyScore: number;
  growthTrend: "rising" | "stable" | "declining";
  managementNotes: string[];
}

export interface BusinessManagementEvaluation {
  companyId: string;
  profitabilityScore: number;
  cashFlowScore: number;
  advertisingScore: number;
  conversionScore: number;
  customerSatisfactionScore: number;
  operationalEfficiencyScore: number;
  overallHealthScore: number;
  autoRecommendations: string[];
}

export interface OptimizationSignal {
  area: "sales" | "costs" | "marketing" | "pricing" | "inventory" | "operations" | "engineering" | "customer";
  currentMetric: string;
  targetImprovement: string;
  priority: number;
}

export interface ContinuousOptimizationReport {
  companyId: string;
  signals: OptimizationSignal[];
  aggregateImprovementPotential: number;
}

export interface ResourceAllocation {
  domain: "engineering" | "marketing" | "commerce" | "capital" | "technology";
  allocationPercent: number;
  rationale: string;
}

export interface EmpireScalingPlan {
  activeCompanies: number;
  portfolioHealthScore: number;
  resourceAllocations: ResourceAllocation[];
  scalingPriorities: string[];
  conflictResolutions: string[];
}

export type GovernanceDomain =
  | "architecture"
  | "business"
  | "financial"
  | "engineering"
  | "compliance"
  | "audit";

export interface GovernanceCheck {
  domain: GovernanceDomain;
  status: "pass" | "warn" | "fail";
  score: number;
  findings: string[];
}

export interface ExecutiveGovernanceReport {
  checks: GovernanceCheck[];
  overallComplianceScore: number;
  auditRequired: boolean;
  protectionActions: string[];
}

export interface EmpireReadinessCertification {
  overallReadinessScore: number;
  businessCreationReady: boolean;
  businessOperationReady: boolean;
  scalingReady: boolean;
  governanceReady: boolean;
  certificationLevel: "production" | "conditional" | "not_ready";
  summary: string;
}

export interface EmpireOperatingSystemReport {
  version: "PILLOW-EOS-001";
  generatedAt: string;
  portfolio: EmpireCompany[];
  creationPackages: CompanyCreationPackage[];
  operationSnapshots: CompanyOperationSnapshot[];
  managementEvaluations: BusinessManagementEvaluation[];
  optimizationReports: ContinuousOptimizationReport[];
  scalingPlan: EmpireScalingPlan;
  governance: ExecutiveGovernanceReport;
  readiness: EmpireReadinessCertification;
  recommendedActions: string[];
  executiveBrief: string;
}

export interface EmpireOperatingSystemState {
  osVersion: "PILLOW-EOS-001";
  status: "ready";
  initializedAt: string;
  totalOperations: number;
  companiesManaged: number;
  governanceDomains: GovernanceDomain[];
}

export interface EmpireOperatingSystemDeps {
  bootstrap: import("../bootstrap/types.js").EmpireBootstrapContext;
  intelligence: import("../intelligence/types.js").RepositoryIntelligenceContext;
  empireCommander: import("../empire-commander/engine.js").EmpireCommanderEngine;
  commerceIntelligence: import("../commerce-intelligence/engine.js").CommerceIntelligenceEngine;
  infrastructureCommander: import("../infrastructure-commander/engine.js").InfrastructureCommanderEngine;
  dueDiligence?: import("../due-diligence/engine.js").ContinuousDueDiligenceEngine;
  improvement?: import("../improvement/engine.js").AutonomousImprovementEngine;
  orchestrator?: import("../orchestrator/engine.js").EmpireAIOrchestrator;
  objective?: import("../objective/engine.js").ObjectiveEngine;
  auditReviewer?: import("../audit-reviewer/engine.js").ExecutiveAuditReviewerEngine;
}
