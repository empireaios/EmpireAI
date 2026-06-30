import { createExecutionDoctrineCompliance } from "../../ecommerce-os-orchestrator/models/execution-doctrine.js";

export const EXECUTION_LAYER_MODULE_ID = "execution-layer" as const;

export type ExecutionLayerCapability =
  | "execution-layer.read"
  | "execution-layer.generate"
  | "execution-layer.validate"
  | "execution-layer.dashboard";

export const EXECUTION_LAYER_CAPABILITIES: ExecutionLayerCapability[] = [
  "execution-layer.read",
  "execution-layer.generate",
  "execution-layer.validate",
  "execution-layer.dashboard",
];

export function createExecutionLayerModuleContract() {
  return {
    moduleId: EXECUTION_LAYER_MODULE_ID,
    capabilities: EXECUTION_LAYER_CAPABILITIES,
    missionIds: [
      "LIVE-011",
      "LIVE-012",
      "LIVE-013",
      "LIVE-014",
      "LIVE-015",
      "LIVE-016",
      "LIVE-017",
      "LIVE-018",
      "LIVE-019",
      "LIVE-020",
    ] as const,
    integratesWith: [
      "product-discovery-opportunity-engine",
      "business-opportunity-workspace",
      "business-preview-studio",
      "market-domination-strategy-engine",
      "business-build-engine",
      "business-simulation-engine",
      "ecommerce-os-orchestrator",
    ],
    protection: {
      noPublishing: true,
      noMarketplaceListings: true,
      noAds: true,
      noFulfillmentExecution: true,
      noFinancialTransactions: true,
      recommendationOnly: true,
      packageBased: true,
    },
    executionDoctrine: createExecutionDoctrineCompliance("LIVE-011"),
  };
}
