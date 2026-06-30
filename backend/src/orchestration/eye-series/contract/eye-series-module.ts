import { createExecutionDoctrineCompliance } from "../../ecommerce-os-orchestrator/models/execution-doctrine.js";
import { EYE_IDS } from "../models/eye-series.js";

export const EYE_SERIES_MODULE_ID = "eye-series" as const;

export type EyeSeriesCapability =
  | "eye-series.read"
  | "eye-series.observe"
  | "eye-series.investigate"
  | "eye-series.dashboard";

export const EYE_SERIES_CAPABILITIES: EyeSeriesCapability[] = [
  "eye-series.read",
  "eye-series.observe",
  "eye-series.investigate",
  "eye-series.dashboard",
];

export function createEyeSeriesModuleContract() {
  return {
    moduleId: EYE_SERIES_MODULE_ID,
    missionIds: ["E001", "E002", "E003", "E004", "E005", "E006", "E007", "E008", "E009", "E010"] as const,
    eyes: EYE_IDS,
    capabilities: EYE_SERIES_CAPABILITIES,
    integratesWith: [
      "eye",
      "product-knowledge-graph",
      "business-opportunity-workspace",
      "business-simulation-engine",
      "reality-integration",
      "ecommerce-os-orchestrator",
      "soul-runtime",
    ],
    protection: {
      noPublishing: true,
      noExecution: true,
      noCharging: true,
      noAdvertising: true,
      noFulfillment: true,
      noMarketplaceModification: true,
      noSupplierModification: true,
      observationOnly: true,
    },
    executionDoctrine: createExecutionDoctrineCompliance("E001"),
    knowledgeGraph: {
      deduplication: true,
      linkableObservations: true,
      sharedGraph: true,
    },
  };
}
