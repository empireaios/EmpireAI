import { createExecutionDoctrineCompliance } from "../../ecommerce-os-orchestrator/models/execution-doctrine.js";

export const REALITY_INTEGRATION_MODULE_ID = "reality-integration" as const;

export type RealityIntegrationCapability =
  | "reality-integration.read"
  | "reality-integration.connect"
  | "reality-integration.manage"
  | "reality-integration.dashboard";

export const REALITY_INTEGRATION_CAPABILITIES: RealityIntegrationCapability[] = [
  "reality-integration.read",
  "reality-integration.connect",
  "reality-integration.manage",
  "reality-integration.dashboard",
];

export function createRealityIntegrationModuleContract() {
  return {
    moduleId: REALITY_INTEGRATION_MODULE_ID,
    capabilities: REALITY_INTEGRATION_CAPABILITIES,
    missionIds: [
      "C001", "C002", "C003", "C004", "C005", "C006", "C007", "C008", "C009",
      "C010", "C011", "C012", "C013", "C014", "C015", "C016", "C017", "C018",
      "C019", "C020",
      "REAL-001", "REAL-002", "REAL-003", "REAL-004", "REAL-005",
      "REAL-002A", "REAL-002B", "EAR-001",
    ] as const,
    integratesWith: [
      "connectors",
      "empire-governance",
      "account-infrastructure-engine",
      "marketplace-connection-engine",
      "marketplace-infrastructure-engine",
      "ecommerce-os-orchestrator",
      "soul-runtime",
    ],
    protection: {
      noPublishing: true,
      noOrdering: true,
      noLiveCharging: true,
      noCampaignLaunch: true,
      noContentPublishing: true,
      noDataModification: true,
      connectionOnly: false,
      noPlaintextCredentials: true,
      noOAuthImplementation: false,
      noLiveApiCalls: false,
      noSimulatedOAuth: true,
      productionOriented: true,
    },
    executionDoctrine: createExecutionDoctrineCompliance("C001"),
    framework: {
      lifecycle: ["register", "connect", "validate", "heartbeat", "refresh", "monitor", "disconnect"],
      governanceFlow: ["Governance", "Approval", "Execution Runtime"],
    },
  };
}
