/** X2-21 — Executive Governance Validator. */

import type { PortfolioCertifiedDependencies } from "./dependencies.js";
import type { ModulePassStatus } from "./types.js";

export class ExecutiveGovernanceValidator {
  validate(deps: PortfolioCertifiedDependencies): {
    status: ModulePassStatus;
    evidenceReference: string;
    notes: string;
  } {
    const checks: Array<{ name: string; ok: boolean }> = [
      {
        name: "executive_dashboard",
        ok:
          Boolean(deps.executivePortfolioDashboard) &&
          this.probe(() => deps.executivePortfolioDashboard!.getState()),
      },
      {
        name: "enterprise_value",
        ok:
          Boolean(deps.enterpriseValueEngine) &&
          this.probe(() => deps.enterpriseValueEngine!.getState()),
      },
      {
        name: "autonomous_board",
        ok:
          Boolean(deps.autonomousPortfolioBoard) &&
          this.probe(() => deps.autonomousPortfolioBoard!.getState()),
      },
      {
        name: "capital_governance",
        ok:
          Boolean(deps.capitalDistributionEngine) &&
          this.probe(() => deps.capitalDistributionEngine!.getState()),
      },
      {
        name: "risk_governance",
        ok:
          Boolean(deps.portfolioRiskEngine) &&
          this.probe(() => deps.portfolioRiskEngine!.getState()),
      },
    ];

    const boardSafetyOk =
      Boolean(deps.autonomousPortfolioBoard) &&
      this.probe(() => {
        const config = deps.autonomousPortfolioBoard!.getState().configuration;
        return (
          config.neverExecuteStrategicDecisionsAutomaticallyBeyondConfiguredApprovalPolicies ===
          true
        );
      });

    const passed = checks.filter((c) => c.ok).length;
    const total = checks.length;
    const failed = checks.filter((c) => !c.ok).map((c) => c.name);

    return {
      status: passed === total && boardSafetyOk ? "pass" : "fail",
      evidenceReference: `structural://executive-governance/passed=${passed}/${total};boardSafety=${boardSafetyOk}`,
      notes:
        failed.length === 0 && boardSafetyOk
          ? `Executive governance validated · ${passed}/${total} · auto-execution blocked`
          : `Governance gaps: ${[...failed, ...(boardSafetyOk ? [] : ["board_safety"])].join(", ")} · ${passed}/${total}`,
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
