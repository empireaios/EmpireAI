/** X2-21 — Per-module Portfolio programme validators (structural probes). */

import { MODULE_MISSIONS } from "./paths.js";
import type { PortfolioCertifiedDependencies } from "./dependencies.js";
import type { CertifiedModuleId, ModuleCertificationResult, ModulePassStatus } from "./types.js";

function probeState(getter: () => unknown): boolean {
  try {
    getter();
    return true;
  } catch {
    return false;
  }
}

function result(
  moduleId: CertifiedModuleId,
  status: ModulePassStatus,
  evidenceReference: string,
  notes: string,
): ModuleCertificationResult {
  return {
    moduleId,
    missionId: MODULE_MISSIONS[moduleId],
    status,
    evidenceReference,
    notes,
  };
}

function validateEngine(
  moduleId: CertifiedModuleId,
  engine: { getState: () => unknown } | null | undefined,
  evidenceLabel: string,
  countGetter?: () => number,
): ModuleCertificationResult {
  if (!engine) {
    return result(
      moduleId,
      "unavailable",
      `structural://missing/${moduleId}`,
      "Module not connected",
    );
  }
  const ok = probeState(() => engine.getState());
  if (!ok) {
    return result(moduleId, "fail", `structural://${evidenceLabel}/failed`, "getState failed");
  }
  const count = countGetter ? countGetter() : undefined;
  return result(
    moduleId,
    "pass",
    count === undefined
      ? `structural://${evidenceLabel}/ready`
      : `structural://${evidenceLabel}/records=${count}`,
    count === undefined
      ? `${moduleId} ready`
      : `${moduleId} ready · records=${count}`,
  );
}

export function runAllModuleValidations(
  deps: PortfolioCertifiedDependencies,
): ModuleCertificationResult[] {
  return [
    validateEngine(
      "enterprise-portfolio-framework",
      deps.enterprisePortfolioFramework,
      "epf",
      () => deps.enterprisePortfolioFramework!.getRegisteredModules().length,
    ),
    validateEngine(
      "multi-company-registry",
      deps.multiCompanyRegistry,
      "mcr",
      () => deps.multiCompanyRegistry!.getCompanyRecords().length,
    ),
    validateEngine(
      "portfolio-performance-engine",
      deps.portfolioPerformanceEngine,
      "ppe",
      () => deps.portfolioPerformanceEngine!.getPerformanceRecords().length,
    ),
    validateEngine(
      "cross-business-knowledge-engine",
      deps.crossBusinessKnowledgeEngine,
      "cbk",
      () => deps.crossBusinessKnowledgeEngine!.getKnowledgeRecords().length,
    ),
    validateEngine(
      "capital-distribution-engine",
      deps.capitalDistributionEngine,
      "cde",
      () => deps.capitalDistributionEngine!.getAllocationRecords().length,
    ),
    validateEngine(
      "executive-portfolio-dashboard",
      deps.executivePortfolioDashboard,
      "epd",
    ),
    validateEngine(
      "portfolio-risk-engine",
      deps.portfolioRiskEngine,
      "pre",
      () => deps.portfolioRiskEngine!.getRiskRecords().length,
    ),
    validateEngine(
      "portfolio-balance-engine",
      deps.portfolioBalanceEngine,
      "pbe",
      () => deps.portfolioBalanceEngine!.getBalanceRecords().length,
    ),
    validateEngine(
      "business-health-ranking",
      deps.businessHealthRanking,
      "bhr",
      () => deps.businessHealthRanking!.getHealthRecords().length,
    ),
    validateEngine(
      "portfolio-intelligence-certified",
      deps.portfolioIntelligenceCertified,
      "pic",
      () => deps.portfolioIntelligenceCertified!.getCertificationReports().length,
    ),
    validateEngine(
      "cross-company-resource-engine",
      deps.crossCompanyResourceEngine,
      "ccre",
      () => deps.crossCompanyResourceEngine!.getResourceRecords().length,
    ),
    validateEngine(
      "shared-customer-intelligence",
      deps.sharedCustomerIntelligence,
      "sci",
      () => deps.sharedCustomerIntelligence!.getIntelligenceRecords().length,
    ),
    validateEngine(
      "shared-supplier-intelligence",
      deps.sharedSupplierIntelligence,
      "ssi",
      () => deps.sharedSupplierIntelligence!.getIntelligenceRecords().length,
    ),
    validateEngine(
      "portfolio-forecast-engine",
      deps.portfolioForecastEngine,
      "pfe",
      () => deps.portfolioForecastEngine!.getForecastRecords().length,
    ),
    validateEngine(
      "acquisition-evaluation-engine",
      deps.acquisitionEvaluationEngine,
      "aee",
      () => deps.acquisitionEvaluationEngine!.getAcquisitionRecords().length,
    ),
    validateEngine(
      "portfolio-optimization-engine",
      deps.portfolioOptimizationEngine,
      "poe",
      () => deps.portfolioOptimizationEngine!.getOptimizationRecords().length,
    ),
    validateEngine(
      "company-lifecycle-manager",
      deps.companyLifecycleManager,
      "clm",
      () => deps.companyLifecycleManager!.getLifecycleRecords().length,
    ),
    validateEngine(
      "portfolio-expansion-planner",
      deps.portfolioExpansionPlanner,
      "pep",
      () => deps.portfolioExpansionPlanner!.getExpansionRecords().length,
    ),
    validateEngine(
      "enterprise-value-engine",
      deps.enterpriseValueEngine,
      "eve",
      () => deps.enterpriseValueEngine!.getValuationRecords().length,
    ),
    validateEngine(
      "autonomous-portfolio-board",
      deps.autonomousPortfolioBoard,
      "apb",
      () => deps.autonomousPortfolioBoard!.getBoardRecords().length,
    ),
  ];
}
