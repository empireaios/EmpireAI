/** X2-21 — Cross-Module Integration Validator. */

import type { PortfolioCertifiedDependencies } from "./dependencies.js";
import type { ModulePassStatus } from "./types.js";

export class CrossModuleIntegrationValidator {
  validate(deps: PortfolioCertifiedDependencies): {
    status: ModulePassStatus;
    evidenceReference: string;
    notes: string;
  } {
    const checks: Array<{ name: string; ok: boolean }> = [
      {
        name: "epf_to_mcr",
        ok: Boolean(deps.enterprisePortfolioFramework && deps.multiCompanyRegistry),
      },
      {
        name: "mcr_to_ppe",
        ok: Boolean(deps.multiCompanyRegistry && deps.portfolioPerformanceEngine),
      },
      {
        name: "pic_chain",
        ok: Boolean(
          deps.portfolioIntelligenceCertified &&
            deps.businessHealthRanking &&
            deps.executivePortfolioDashboard,
        ),
      },
      {
        name: "resource_intel",
        ok: Boolean(
          deps.crossCompanyResourceEngine &&
            deps.sharedCustomerIntelligence &&
            deps.sharedSupplierIntelligence,
        ),
      },
      {
        name: "growth_chain",
        ok: Boolean(
          deps.portfolioForecastEngine &&
            deps.acquisitionEvaluationEngine &&
            deps.portfolioOptimizationEngine,
        ),
      },
      {
        name: "lifecycle_expansion",
        ok: Boolean(deps.companyLifecycleManager && deps.portfolioExpansionPlanner),
      },
      {
        name: "value_board",
        ok: Boolean(deps.enterpriseValueEngine && deps.autonomousPortfolioBoard),
      },
    ];

    const probed = checks.map((c) => ({
      ...c,
      ok:
        c.ok &&
        this.probe(() => {
          deps.enterprisePortfolioFramework?.getState();
          deps.autonomousPortfolioBoard?.getState();
        }),
    }));

    const passed = probed.filter((c) => c.ok).length;
    const total = probed.length;
    const failed = probed.filter((c) => !c.ok).map((c) => c.name);

    return {
      status: passed === total ? "pass" : "fail",
      evidenceReference: `structural://cross-module/passed=${passed}/${total}`,
      notes:
        failed.length === 0
          ? `Cross-module integration validated · ${passed}/${total}`
          : `Cross-module gaps: ${failed.join(", ")} · ${passed}/${total}`,
    };
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }
}
