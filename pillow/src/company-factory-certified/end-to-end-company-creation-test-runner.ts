/** X1-15 — End-to-End Company Creation Test Runner (structural signals only). */

import type { CompanyFactoryCertifiedDependencies } from "./dependencies.js";
import type { ModulePassStatus } from "./types.js";

export class EndToEndCompanyCreationTestRunner {
  run(deps: CompanyFactoryCertifiedDependencies): {
    status: ModulePassStatus;
    evidenceReference: string;
    notes: string;
  } {
    const checks: Array<{ name: string; ok: boolean }> = [
      {
        name: "framework",
        ok: Boolean(deps.companyFactoryFramework) && this.probe(() => deps.companyFactoryFramework!.getState()),
      },
      {
        name: "opportunity",
        ok:
          Boolean(deps.businessOpportunityDiscovery) &&
          this.probe(() => deps.businessOpportunityDiscovery!.getOpportunityRecords()),
      },
      {
        name: "market",
        ok:
          Boolean(deps.marketValidationEngine) &&
          this.probe(() => deps.marketValidationEngine!.getValidationRecords()),
      },
      {
        name: "model",
        ok:
          Boolean(deps.businessModelGenerator) &&
          this.probe(() => deps.businessModelGenerator!.getBusinessModelRecords()),
      },
      {
        name: "brand",
        ok:
          Boolean(deps.brandCreationEngine) &&
          this.probe(() => deps.brandCreationEngine!.getBrandRecords()),
      },
      {
        name: "domain",
        ok:
          Boolean(deps.domainDigitalAssetPlanner) &&
          this.probe(() => deps.domainDigitalAssetPlanner!.getPlanRecords()),
      },
      {
        name: "store",
        ok:
          Boolean(deps.storeGenerationEngine) &&
          this.probe(() => deps.storeGenerationEngine!.getStorefrontRecords()),
      },
      {
        name: "portfolio",
        ok:
          Boolean(deps.productPortfolioBuilder) &&
          this.probe(() => deps.productPortfolioBuilder!.getPortfolioRecords()),
      },
      {
        name: "pricing",
        ok:
          Boolean(deps.pricingStrategyEngine) &&
          this.probe(() => deps.pricingStrategyEngine!.getPricingRecords()),
      },
      {
        name: "readiness",
        ok:
          Boolean(deps.launchReadinessValidator) &&
          this.probe(() => deps.launchReadinessValidator!.getReadinessRecords()),
      },
      {
        name: "launch",
        ok:
          Boolean(deps.businessLaunchOrchestrator) &&
          this.probe(() => deps.businessLaunchOrchestrator!.getLaunchRecords()),
      },
      {
        name: "growth",
        ok:
          Boolean(deps.growthInitializationEngine) &&
          this.probe(() => deps.growthInitializationEngine!.getGrowthRecords()),
      },
      {
        name: "monitoring",
        ok:
          Boolean(deps.launchMonitoringEngine) &&
          this.probe(() => deps.launchMonitoringEngine!.getMonitoringRecords()),
      },
      {
        name: "revenue",
        ok:
          Boolean(deps.firstRevenueOptimizer) &&
          this.probe(() => deps.firstRevenueOptimizer!.getRevenueRecords()),
      },
    ];

    const passed = checks.filter((c) => c.ok).length;
    const total = checks.length;
    const failed = checks.filter((c) => !c.ok).map((c) => c.name);
    const status: ModulePassStatus =
      passed === total ? "pass" : passed === 0 ? "fail" : "fail";

    return {
      status: passed >= total ? "pass" : status,
      evidenceReference: `structural://e2e/passed=${passed}/${total}`,
      notes:
        failed.length === 0
          ? `End-to-end company creation path validated · ${passed}/${total}`
          : `End-to-end gaps: ${failed.join(", ")} · ${passed}/${total}`,
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
