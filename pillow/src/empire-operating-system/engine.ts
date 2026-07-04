import { EMPIRE_PORTFOLIO } from "./company-catalog.js";
import { createCompanyFromIntent, listCreationCandidates } from "./company-creator.js";
import { operateCompanies } from "./company-operator.js";
import { evaluateBusinessManagement } from "./business-manager.js";
import { optimizeContinuously } from "./continuous-optimizer.js";
import { planEmpireScaling } from "./empire-scaler.js";
import { assessGovernance } from "./governance-guardian.js";
import {
  buildEmpireOperatingSystemReport,
  certifyEmpireReadiness,
} from "./executive-reporter.js";
import type {
  EmpireOperatingSystemDeps,
  EmpireOperatingSystemReport,
  EmpireOperatingSystemState,
} from "./types.js";

export const EMPIRE_OPERATING_SYSTEM_CONTRACT_PATH =
  "docs/governance/PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md";

/**
 * Empire Operating System (PILLOW-EOS-001 / Phase 9).
 * Create, launch, operate, optimise, and scale EmpireAI businesses autonomously.
 */
export class EmpireOperatingSystemEngine {
  private initializedAt: string | null = null;
  private totalOperations = 0;
  private lastReport: EmpireOperatingSystemReport | null = null;

  constructor(private readonly deps: EmpireOperatingSystemDeps) {}

  async initialize(): Promise<EmpireOperatingSystemState> {
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): EmpireOperatingSystemState {
    if (!this.initializedAt) {
      throw new Error("Empire Operating System not initialized. Call initialize() first.");
    }
    return {
      osVersion: "PILLOW-EOS-001",
      status: "ready",
      initializedAt: this.initializedAt,
      totalOperations: this.totalOperations,
      companiesManaged: EMPIRE_PORTFOLIO.length,
      governanceDomains: [
        "architecture",
        "business",
        "financial",
        "engineering",
        "compliance",
        "audit",
      ],
    };
  }

  /** Full Empire OS cycle — create, operate, optimise, scale, govern. */
  async operateEmpire(intent?: string): Promise<EmpireOperatingSystemReport> {
    const portfolio = [...EMPIRE_PORTFOLIO];
    const creationPackages: ReturnType<typeof createCompanyFromIntent>[] = [];

    if (intent?.trim()) {
      const created = createCompanyFromIntent(intent);
      if (created) creationPackages.push(created);
    }

    const operationSnapshots = operateCompanies(portfolio);
    const managementEvaluations = evaluateBusinessManagement(operationSnapshots);
    const optimizationReports = optimizeContinuously(portfolio);
    const scalingPlan = planEmpireScaling(portfolio, managementEvaluations);
    const governance = assessGovernance(this.deps);
    const readiness = certifyEmpireReadiness({
      governance,
      scalingPlan,
      managementEvaluations,
      creationReady: listCreationCandidates() >= 2,
    });

    const report = buildEmpireOperatingSystemReport({
      portfolio,
      creationPackages: creationPackages.filter(Boolean) as NonNullable<
        ReturnType<typeof createCompanyFromIntent>
      >[],
      operationSnapshots,
      managementEvaluations,
      optimizationReports,
      scalingPlan,
      governance,
      readiness,
    });

    this.totalOperations += 1;
    this.lastReport = report;
    return report;
  }

  getLastReport(): EmpireOperatingSystemReport | null {
    return this.lastReport;
  }

  getManagedCapabilities(): string[] {
    return [
      "Company Creation (business model, brand, catalogue, pricing, store, operations, launch)",
      "Company Operation (products, suppliers, marketing, customer service, analytics, growth)",
      "Autonomous Business Management (profitability, cash flow, advertising, conversion)",
      "Continuous Optimisation (sales, costs, marketing, pricing, inventory, engineering)",
      "Empire Scaling (multi-business resource allocation)",
      "Executive Governance (architecture, business, financial, engineering, compliance, audit)",
      "Empire Commander cross-domain coordination (Phase 8)",
      "Commerce Intelligence product pipeline (Phase 7)",
    ];
  }
}

export function createEmpireOperatingSystemEngine(
  deps: EmpireOperatingSystemDeps,
): EmpireOperatingSystemEngine {
  return new EmpireOperatingSystemEngine(deps);
}
