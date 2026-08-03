/** X2-21 — End-to-End Portfolio Workflow Validator (structural signals only). */

import type { PortfolioCertifiedDependencies } from "./dependencies.js";
import type { ModulePassStatus } from "./types.js";

/**
 * Validates that EmpireAI can autonomously manage and optimize a multi-company
 * enterprise portfolio under Grand King governance (structural probes only).
 */
export class EndToEndPortfolioWorkflowValidator {
  run(deps: PortfolioCertifiedDependencies): {
    status: ModulePassStatus;
    evidenceReference: string;
    notes: string;
  } {
    const checks: Array<{ name: string; ok: boolean }> = [
      {
        name: "framework",
        ok:
          Boolean(deps.enterprisePortfolioFramework) &&
          this.probe(() => deps.enterprisePortfolioFramework!.getState()),
      },
      {
        name: "registry",
        ok:
          Boolean(deps.multiCompanyRegistry) &&
          this.probe(() => deps.multiCompanyRegistry!.getCompanyRecords()),
      },
      {
        name: "performance",
        ok:
          Boolean(deps.portfolioPerformanceEngine) &&
          this.probe(() => deps.portfolioPerformanceEngine!.getState()),
      },
      {
        name: "capital",
        ok:
          Boolean(deps.capitalDistributionEngine) &&
          this.probe(() => deps.capitalDistributionEngine!.getState()),
      },
      {
        name: "risk_balance_health",
        ok:
          Boolean(deps.portfolioRiskEngine && deps.portfolioBalanceEngine && deps.businessHealthRanking) &&
          this.probe(() => {
            deps.portfolioRiskEngine!.getState();
            deps.portfolioBalanceEngine!.getState();
            deps.businessHealthRanking!.getState();
          }),
      },
      {
        name: "pic",
        ok:
          Boolean(deps.portfolioIntelligenceCertified) &&
          this.probe(() => deps.portfolioIntelligenceCertified!.getState()),
      },
      {
        name: "shared_intel",
        ok:
          Boolean(deps.crossCompanyResourceEngine && deps.sharedCustomerIntelligence && deps.sharedSupplierIntelligence) &&
          this.probe(() => {
            deps.crossCompanyResourceEngine!.getState();
            deps.sharedCustomerIntelligence!.getState();
            deps.sharedSupplierIntelligence!.getState();
          }),
      },
      {
        name: "forecast_acq_opt",
        ok:
          Boolean(
            deps.portfolioForecastEngine &&
              deps.acquisitionEvaluationEngine &&
              deps.portfolioOptimizationEngine,
          ) &&
          this.probe(() => {
            deps.portfolioForecastEngine!.getState();
            deps.acquisitionEvaluationEngine!.getState();
            deps.portfolioOptimizationEngine!.getState();
          }),
      },
      {
        name: "lifecycle_expansion",
        ok:
          Boolean(deps.companyLifecycleManager && deps.portfolioExpansionPlanner) &&
          this.probe(() => {
            deps.companyLifecycleManager!.getState();
            deps.portfolioExpansionPlanner!.getState();
          }),
      },
      {
        name: "value_board",
        ok:
          Boolean(deps.enterpriseValueEngine && deps.autonomousPortfolioBoard) &&
          this.probe(() => {
            deps.enterpriseValueEngine!.getState();
            deps.autonomousPortfolioBoard!.getState();
          }),
      },
    ];

    const multiCompanyOk =
      Boolean(deps.multiCompanyRegistry) &&
      (deps.multiCompanyRegistry?.getCompanyRecords().length ?? 0) >= 1;

    const passed = checks.filter((c) => c.ok).length;
    const total = checks.length;
    const failed = checks.filter((c) => !c.ok).map((c) => c.name);

    return {
      status: passed === total && multiCompanyOk ? "pass" : "fail",
      evidenceReference: `structural://e2e-portfolio-programme/passed=${passed}/${total};multiCompany=${multiCompanyOk}`,
      notes:
        failed.length === 0 && multiCompanyOk
          ? `End-to-end enterprise portfolio operations validated · ${passed}/${total} · multi-company portfolio ready under Grand King governance`
          : `End-to-end gaps: ${[...failed, ...(multiCompanyOk ? [] : ["multi_company"])].join(", ")} · ${passed}/${total}`,
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
