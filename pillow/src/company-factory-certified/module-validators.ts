/** X1-15 — Per-module Company Factory validators (structural probes). */

import type { CompanyFactoryCertifiedDependencies } from "./dependencies.js";
import type { CertifiedModuleId, ModuleCertificationResult, ModulePassStatus } from "./types.js";

const MODULE_MISSIONS: Record<CertifiedModuleId, string> = {
  "company-factory-framework": "X1-01",
  "business-opportunity-discovery": "X1-02",
  "market-validation-engine": "X1-03",
  "business-model-generator": "X1-04",
  "brand-creation-engine": "X1-05",
  "domain-digital-asset-planner": "X1-06",
  "store-generation-engine": "X1-07",
  "product-portfolio-builder": "X1-08",
  "pricing-strategy-engine": "X1-09",
  "launch-readiness-validator": "X1-10",
  "business-launch-orchestrator": "X1-11",
  "growth-initialization-engine": "X1-12",
  "launch-monitoring-engine": "X1-13",
  "first-revenue-optimizer": "X1-14",
};

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

export class CompanyFrameworkValidator {
  validate(deps: CompanyFactoryCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.companyFactoryFramework;
    if (!engine) {
      return result(
        "company-factory-framework",
        "unavailable",
        "structural://missing/company-factory-framework",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const modules = ok ? engine.getRegisteredModules().length : 0;
    return result(
      "company-factory-framework",
      ok ? "pass" : "fail",
      ok ? `structural://cff/modules=${modules}` : "structural://cff/failed",
      ok ? `Framework ready · registeredModules=${modules}` : "getState failed",
    );
  }
}

export class BusinessOpportunityValidator {
  validate(deps: CompanyFactoryCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.businessOpportunityDiscovery;
    if (!engine) {
      return result(
        "business-opportunity-discovery",
        "unavailable",
        "structural://missing/business-opportunity-discovery",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const count = ok ? engine.getOpportunityRecords().length : 0;
    return result(
      "business-opportunity-discovery",
      ok ? "pass" : "fail",
      ok ? `structural://bod/records=${count}` : "structural://bod/failed",
      ok ? `Opportunity discovery ready · records=${count}` : "getState failed",
    );
  }
}

export class MarketValidationValidator {
  validate(deps: CompanyFactoryCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.marketValidationEngine;
    if (!engine) {
      return result(
        "market-validation-engine",
        "unavailable",
        "structural://missing/market-validation-engine",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const count = ok ? engine.getValidationRecords().length : 0;
    return result(
      "market-validation-engine",
      ok ? "pass" : "fail",
      ok ? `structural://mve/records=${count}` : "structural://mve/failed",
      ok ? `Market validation ready · records=${count}` : "getState failed",
    );
  }
}

export class BusinessModelValidator {
  validate(deps: CompanyFactoryCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.businessModelGenerator;
    if (!engine) {
      return result(
        "business-model-generator",
        "unavailable",
        "structural://missing/business-model-generator",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const count = ok ? engine.getBusinessModelRecords().length : 0;
    return result(
      "business-model-generator",
      ok ? "pass" : "fail",
      ok ? `structural://bmg/records=${count}` : "structural://bmg/failed",
      ok ? `Business model ready · records=${count}` : "getState failed",
    );
  }
}

export class BrandValidator {
  validate(deps: CompanyFactoryCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.brandCreationEngine;
    if (!engine) {
      return result(
        "brand-creation-engine",
        "unavailable",
        "structural://missing/brand-creation-engine",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const count = ok ? engine.getBrandRecords().length : 0;
    return result(
      "brand-creation-engine",
      ok ? "pass" : "fail",
      ok ? `structural://bce/records=${count}` : "structural://bce/failed",
      ok ? `Brand creation ready · records=${count}` : "getState failed",
    );
  }
}

export class StoreValidator {
  validate(deps: CompanyFactoryCertifiedDependencies): ModuleCertificationResult {
    const dap = deps.domainDigitalAssetPlanner;
    const sge = deps.storeGenerationEngine;
    if (!sge) {
      return result(
        "store-generation-engine",
        "unavailable",
        "structural://missing/store-generation-engine",
        "Module not connected",
      );
    }
    const storeOk = probeState(() => sge.getState());
    const planOk = dap ? probeState(() => dap.getState()) : false;
    const storeCount = storeOk ? sge.getStorefrontRecords().length : 0;
    const planCount = planOk && dap ? dap.getPlanRecords().length : 0;
    const status: ModulePassStatus = storeOk ? "pass" : "fail";
    return result(
      "store-generation-engine",
      status,
      `structural://sge/records=${storeCount}|dap=${planCount}`,
      storeOk
        ? `Store generation ready · storefronts=${storeCount} · plans=${planCount}`
        : "getState failed",
    );
  }
}

export class ProductPortfolioValidator {
  validate(deps: CompanyFactoryCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.productPortfolioBuilder;
    if (!engine) {
      return result(
        "product-portfolio-builder",
        "unavailable",
        "structural://missing/product-portfolio-builder",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const count = ok ? engine.getPortfolioRecords().length : 0;
    return result(
      "product-portfolio-builder",
      ok ? "pass" : "fail",
      ok ? `structural://ppb/records=${count}` : "structural://ppb/failed",
      ok ? `Product portfolio ready · records=${count}` : "getState failed",
    );
  }
}

export class LaunchValidator {
  validate(deps: CompanyFactoryCertifiedDependencies): ModuleCertificationResult {
    const lrv = deps.launchReadinessValidator;
    const blo = deps.businessLaunchOrchestrator;
    if (!lrv || !blo) {
      return result(
        "business-launch-orchestrator",
        "unavailable",
        "structural://missing/launch-stack",
        "Launch readiness or orchestrator not connected",
      );
    }
    const lrvOk = probeState(() => lrv.getState());
    const bloOk = probeState(() => blo.getState());
    const readiness = lrvOk ? lrv.getReadinessRecords().length : 0;
    const launches = bloOk ? blo.getLaunchRecords().length : 0;
    const status: ModulePassStatus = lrvOk && bloOk ? "pass" : "fail";
    return result(
      "business-launch-orchestrator",
      status,
      `structural://launch/readiness=${readiness}|launches=${launches}`,
      status === "pass"
        ? `Launch stack ready · readiness=${readiness} · launches=${launches}`
        : "Launch stack probe failed",
    );
  }
}

export function validateDomainPlanner(
  deps: CompanyFactoryCertifiedDependencies,
): ModuleCertificationResult {
  const engine = deps.domainDigitalAssetPlanner;
  if (!engine) {
    return result(
      "domain-digital-asset-planner",
      "unavailable",
      "structural://missing/domain-digital-asset-planner",
      "Module not connected",
    );
  }
  const ok = probeState(() => engine.getState());
  const count = ok ? engine.getPlanRecords().length : 0;
  return result(
    "domain-digital-asset-planner",
    ok ? "pass" : "fail",
    ok ? `structural://dap/records=${count}` : "structural://dap/failed",
    ok ? `Domain planner ready · records=${count}` : "getState failed",
  );
}

export function validatePricing(
  deps: CompanyFactoryCertifiedDependencies,
): ModuleCertificationResult {
  const engine = deps.pricingStrategyEngine;
  if (!engine) {
    return result(
      "pricing-strategy-engine",
      "unavailable",
      "structural://missing/pricing-strategy-engine",
      "Module not connected",
    );
  }
  const ok = probeState(() => engine.getState());
  const count = ok ? engine.getPricingRecords().length : 0;
  return result(
    "pricing-strategy-engine",
    ok ? "pass" : "fail",
    ok ? `structural://pse/records=${count}` : "structural://pse/failed",
    ok ? `Pricing ready · records=${count}` : "getState failed",
  );
}

export function validateLaunchReadiness(
  deps: CompanyFactoryCertifiedDependencies,
): ModuleCertificationResult {
  const engine = deps.launchReadinessValidator;
  if (!engine) {
    return result(
      "launch-readiness-validator",
      "unavailable",
      "structural://missing/launch-readiness-validator",
      "Module not connected",
    );
  }
  const ok = probeState(() => engine.getState());
  const count = ok ? engine.getReadinessRecords().length : 0;
  return result(
    "launch-readiness-validator",
    ok ? "pass" : "fail",
    ok ? `structural://lrv/records=${count}` : "structural://lrv/failed",
    ok ? `Launch readiness ready · records=${count}` : "getState failed",
  );
}

export function validateGrowth(
  deps: CompanyFactoryCertifiedDependencies,
): ModuleCertificationResult {
  const engine = deps.growthInitializationEngine;
  if (!engine) {
    return result(
      "growth-initialization-engine",
      "unavailable",
      "structural://missing/growth-initialization-engine",
      "Module not connected",
    );
  }
  const ok = probeState(() => engine.getState());
  const count = ok ? engine.getGrowthRecords().length : 0;
  return result(
    "growth-initialization-engine",
    ok ? "pass" : "fail",
    ok ? `structural://gie/records=${count}` : "structural://gie/failed",
    ok ? `Growth initialization ready · records=${count}` : "getState failed",
  );
}

export function validateMonitoring(
  deps: CompanyFactoryCertifiedDependencies,
): ModuleCertificationResult {
  const engine = deps.launchMonitoringEngine;
  if (!engine) {
    return result(
      "launch-monitoring-engine",
      "unavailable",
      "structural://missing/launch-monitoring-engine",
      "Module not connected",
    );
  }
  const ok = probeState(() => engine.getState());
  const count = ok ? engine.getMonitoringRecords().length : 0;
  return result(
    "launch-monitoring-engine",
    ok ? "pass" : "fail",
    ok ? `structural://lme/records=${count}` : "structural://lme/failed",
    ok ? `Launch monitoring ready · records=${count}` : "getState failed",
  );
}

export function validateFirstRevenue(
  deps: CompanyFactoryCertifiedDependencies,
): ModuleCertificationResult {
  const engine = deps.firstRevenueOptimizer;
  if (!engine) {
    return result(
      "first-revenue-optimizer",
      "unavailable",
      "structural://missing/first-revenue-optimizer",
      "Module not connected",
    );
  }
  const ok = probeState(() => engine.getState());
  const count = ok ? engine.getRevenueRecords().length : 0;
  return result(
    "first-revenue-optimizer",
    ok ? "pass" : "fail",
    ok ? `structural://fro/records=${count}` : "structural://fro/failed",
    ok ? `First revenue optimizer ready · records=${count}` : "getState failed",
  );
}
