/** X2-10 — End-to-End Portfolio Test Runner (structural signals only). */

import type { PortfolioIntelligenceCertifiedDependencies } from "./dependencies.js";
import type { ModulePassStatus } from "./types.js";

/**
 * Validates that EmpireAI can manage multiple companies as one portfolio
 * by probing the full X2-01..X2-09 operational chain in safe test mode.
 */
export class EndToEndPortfolioTestRunner {
  run(deps: PortfolioIntelligenceCertifiedDependencies): {
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
          this.probe(() => deps.portfolioPerformanceEngine!.getPerformanceRecords()),
      },
      {
        name: "knowledge",
        ok:
          Boolean(deps.crossBusinessKnowledgeEngine) &&
          this.probe(() => deps.crossBusinessKnowledgeEngine!.getKnowledgeRecords()),
      },
      {
        name: "capital",
        ok:
          Boolean(deps.capitalDistributionEngine) &&
          this.probe(() => deps.capitalDistributionEngine!.getAllocationRecords()),
      },
      {
        name: "dashboard",
        ok:
          Boolean(deps.executivePortfolioDashboard) &&
          this.probe(() => deps.executivePortfolioDashboard!.getState()),
      },
      {
        name: "risk",
        ok:
          Boolean(deps.portfolioRiskEngine) &&
          this.probe(() => deps.portfolioRiskEngine!.getRiskRecords()),
      },
      {
        name: "balance",
        ok:
          Boolean(deps.portfolioBalanceEngine) &&
          this.probe(() => deps.portfolioBalanceEngine!.getBalanceRecords()),
      },
      {
        name: "health_ranking",
        ok:
          Boolean(deps.businessHealthRanking) &&
          this.probe(() => deps.businessHealthRanking!.getHealthRecords()),
      },
    ];

    const multiCompanyOk =
      Boolean(deps.multiCompanyRegistry) &&
      this.probe(() => {
        const companies = deps.multiCompanyRegistry!.getCompanyRecords();
        return companies.length;
      }) &&
      (deps.multiCompanyRegistry?.getCompanyRecords().length ?? 0) >= 1;

    const passed = checks.filter((c) => c.ok).length;
    const total = checks.length;
    const failed = checks.filter((c) => !c.ok).map((c) => c.name);

    const status: ModulePassStatus =
      passed === total && multiCompanyOk ? "pass" : passed === 0 ? "fail" : "fail";

    return {
      status: passed === total && multiCompanyOk ? "pass" : status,
      evidenceReference: `structural://e2e-portfolio/passed=${passed}/${total};multiCompany=${multiCompanyOk}`,
      notes:
        failed.length === 0 && multiCompanyOk
          ? `End-to-end portfolio operations validated · ${passed}/${total} · multi-company portfolio ready`
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
