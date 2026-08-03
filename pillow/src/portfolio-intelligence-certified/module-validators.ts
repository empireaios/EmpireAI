/** X2-10 — Per-module Portfolio Intelligence validators (structural probes). */

import type { PortfolioIntelligenceCertifiedDependencies } from "./dependencies.js";
import type { CertifiedModuleId, ModuleCertificationResult, ModulePassStatus } from "./types.js";

const MODULE_MISSIONS: Record<CertifiedModuleId, string> = {
  "enterprise-portfolio-framework": "X2-01",
  "multi-company-registry": "X2-02",
  "portfolio-performance-engine": "X2-03",
  "cross-business-knowledge-engine": "X2-04",
  "capital-distribution-engine": "X2-05",
  "executive-portfolio-dashboard": "X2-06",
  "portfolio-risk-engine": "X2-07",
  "portfolio-balance-engine": "X2-08",
  "business-health-ranking": "X2-09",
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

/** Enterprise Portfolio Validator */
export class EnterprisePortfolioValidator {
  validate(deps: PortfolioIntelligenceCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.enterprisePortfolioFramework;
    if (!engine) {
      return result(
        "enterprise-portfolio-framework",
        "unavailable",
        "structural://missing/enterprise-portfolio-framework",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const modules = ok ? engine.getRegisteredModules().length : 0;
    return result(
      "enterprise-portfolio-framework",
      ok ? "pass" : "fail",
      ok ? `structural://epf/modules=${modules}` : "structural://epf/failed",
      ok ? `EPF ready · registeredModules=${modules}` : "getState failed",
    );
  }
}

/** Company Registry Validator */
export class CompanyRegistryValidator {
  validate(deps: PortfolioIntelligenceCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.multiCompanyRegistry;
    if (!engine) {
      return result(
        "multi-company-registry",
        "unavailable",
        "structural://missing/multi-company-registry",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const count = ok ? engine.getCompanyRecords().length : 0;
    return result(
      "multi-company-registry",
      ok ? "pass" : "fail",
      ok ? `structural://mcr/companies=${count}` : "structural://mcr/failed",
      ok ? `Registry ready · companies=${count}` : "getState failed",
    );
  }
}

/** Portfolio Analytics Validator */
export class PortfolioAnalyticsValidator {
  validate(deps: PortfolioIntelligenceCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.portfolioPerformanceEngine;
    if (!engine) {
      return result(
        "portfolio-performance-engine",
        "unavailable",
        "structural://missing/portfolio-performance-engine",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const count = ok ? engine.getPerformanceRecords().length : 0;
    return result(
      "portfolio-performance-engine",
      ok ? "pass" : "fail",
      ok ? `structural://ppe/records=${count}` : "structural://ppe/failed",
      ok ? `Performance analytics ready · records=${count}` : "getState failed",
    );
  }
}

/** Knowledge Sharing Validator */
export class KnowledgeSharingValidator {
  validate(deps: PortfolioIntelligenceCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.crossBusinessKnowledgeEngine;
    if (!engine) {
      return result(
        "cross-business-knowledge-engine",
        "unavailable",
        "structural://missing/cross-business-knowledge-engine",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const count = ok ? engine.getKnowledgeRecords().length : 0;
    return result(
      "cross-business-knowledge-engine",
      ok ? "pass" : "fail",
      ok ? `structural://cbk/records=${count}` : "structural://cbk/failed",
      ok ? `Knowledge sharing ready · records=${count}` : "getState failed",
    );
  }
}

/** Capital Distribution Validator */
export class CapitalDistributionValidator {
  validate(deps: PortfolioIntelligenceCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.capitalDistributionEngine;
    if (!engine) {
      return result(
        "capital-distribution-engine",
        "unavailable",
        "structural://missing/capital-distribution-engine",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const count = ok ? engine.getAllocationRecords().length : 0;
    return result(
      "capital-distribution-engine",
      ok ? "pass" : "fail",
      ok ? `structural://cde/allocations=${count}` : "structural://cde/failed",
      ok ? `Capital distribution ready · allocations=${count}` : "getState failed",
    );
  }
}

/** Executive Dashboard Validator */
export class ExecutiveDashboardValidator {
  validate(deps: PortfolioIntelligenceCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.executivePortfolioDashboard;
    if (!engine) {
      return result(
        "executive-portfolio-dashboard",
        "unavailable",
        "structural://missing/executive-portfolio-dashboard",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const snapshot = ok ? engine.getLatestSnapshot() : null;
    return result(
      "executive-portfolio-dashboard",
      ok ? "pass" : "fail",
      ok
        ? `structural://epd/snapshot=${snapshot ? "present" : "none"}`
        : "structural://epd/failed",
      ok ? `Executive dashboard ready · snapshot=${snapshot ? "yes" : "no"}` : "getState failed",
    );
  }
}

/** Portfolio Risk Validator */
export class PortfolioRiskValidator {
  validate(deps: PortfolioIntelligenceCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.portfolioRiskEngine;
    if (!engine) {
      return result(
        "portfolio-risk-engine",
        "unavailable",
        "structural://missing/portfolio-risk-engine",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const count = ok ? engine.getRiskRecords().length : 0;
    return result(
      "portfolio-risk-engine",
      ok ? "pass" : "fail",
      ok ? `structural://pre/risks=${count}` : "structural://pre/failed",
      ok ? `Portfolio risk ready · records=${count}` : "getState failed",
    );
  }
}

/** Portfolio Balance Validator */
export class PortfolioBalanceValidator {
  validate(deps: PortfolioIntelligenceCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.portfolioBalanceEngine;
    if (!engine) {
      return result(
        "portfolio-balance-engine",
        "unavailable",
        "structural://missing/portfolio-balance-engine",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const count = ok ? engine.getBalanceRecords().length : 0;
    return result(
      "portfolio-balance-engine",
      ok ? "pass" : "fail",
      ok ? `structural://pbe/balances=${count}` : "structural://pbe/failed",
      ok ? `Portfolio balance ready · records=${count}` : "getState failed",
    );
  }
}

/** Business Health Validator */
export class BusinessHealthValidator {
  validate(deps: PortfolioIntelligenceCertifiedDependencies): ModuleCertificationResult {
    const engine = deps.businessHealthRanking;
    if (!engine) {
      return result(
        "business-health-ranking",
        "unavailable",
        "structural://missing/business-health-ranking",
        "Module not connected",
      );
    }
    const ok = probeState(() => engine.getState());
    const count = ok ? engine.getHealthRecords().length : 0;
    return result(
      "business-health-ranking",
      ok ? "pass" : "fail",
      ok ? `structural://bhr/health=${count}` : "structural://bhr/failed",
      ok ? `Business health ranking ready · records=${count}` : "getState failed",
    );
  }
}

export function runAllModuleValidations(
  deps: PortfolioIntelligenceCertifiedDependencies,
): ModuleCertificationResult[] {
  return [
    new EnterprisePortfolioValidator().validate(deps),
    new CompanyRegistryValidator().validate(deps),
    new PortfolioAnalyticsValidator().validate(deps),
    new KnowledgeSharingValidator().validate(deps),
    new CapitalDistributionValidator().validate(deps),
    new ExecutiveDashboardValidator().validate(deps),
    new PortfolioRiskValidator().validate(deps),
    new PortfolioBalanceValidator().validate(deps),
    new BusinessHealthValidator().validate(deps),
  ];
}
