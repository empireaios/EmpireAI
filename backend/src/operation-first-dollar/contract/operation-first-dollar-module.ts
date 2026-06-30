import { createExecutionDoctrineCompliance } from "../../orchestration/ecommerce-os-orchestrator/models/execution-doctrine.js";

export const OPERATION_FIRST_DOLLAR_MODULE_ID = "operation-first-dollar" as const;

export const REVENUE_OBJECTIVE_USD = 100_000;

export type OperationFirstDollarCapability =
  | "operation-first-dollar.read"
  | "operation-first-dollar.record"
  | "operation-first-dollar.dashboard";

export const OPERATION_FIRST_DOLLAR_CAPABILITIES: OperationFirstDollarCapability[] = [
  "operation-first-dollar.read",
  "operation-first-dollar.record",
  "operation-first-dollar.dashboard",
];

export function createOperationFirstDollarModuleContract() {
  return {
    moduleId: OPERATION_FIRST_DOLLAR_MODULE_ID,
    missionId: "O001" as const,
    capabilities: OPERATION_FIRST_DOLLAR_CAPABILITIES,
    revenueObjectiveUsd: REVENUE_OBJECTIVE_USD,
    evaluationQuestion: "Will this increase the probability of Grand King's first USD 100,000 in revenue?",
    integratesWith: [
      "ecommerce-os-orchestrator",
      "execution-layer",
      "reality-integration",
      "eye-series",
      "business-opportunity-workspace",
      "business-simulation-engine",
      "grand-kings-revenue-engine",
      "soul-runtime",
    ],
    protection: {
      noMockRevenue: true,
      noFakeOrders: true,
      noSimulatedProfitAsReal: true,
      metricSources: ["REAL", "SIMULATED"] as const,
      realMilestonesRequireExternalReference: true,
    },
    executionDoctrine: createExecutionDoctrineCompliance("O001"),
  };
}
