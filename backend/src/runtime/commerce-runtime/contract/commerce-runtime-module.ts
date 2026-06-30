export const COMMERCE_RUNTIME_MODULE_ID = "commerce-runtime" as const;

export type CommerceRuntimeCapability =
  | "commerce-runtime.read"
  | "commerce-runtime.plan"
  | "commerce-runtime.dispatch"
  | "commerce-runtime.inspect";

export const COMMERCE_RUNTIME_CAPABILITIES: CommerceRuntimeCapability[] = [
  "commerce-runtime.read",
  "commerce-runtime.plan",
  "commerce-runtime.dispatch",
  "commerce-runtime.inspect",
];

/** CRT-001 — planning and routing only; no live adapter execution. */
export const COMMERCE_RUNTIME_EXECUTION_BLOCKED = true as const;

export type CommerceRuntimeModuleContract = {
  moduleId: typeof COMMERCE_RUNTIME_MODULE_ID;
  capabilities: CommerceRuntimeCapability[];
  missionId: "CRT-001";
  integratesWith: [
    "brain",
    "soul-runtime",
    "reality-integration",
    "execution-layer",
    "operation-first-dollar",
    "commerce-readiness-engine",
    "empire-self-inspection",
    "ecommerce-os-orchestrator",
  ];
  protection: {
    noLiveExecution: true;
    noOAuth: true;
    noIrreversibleActions: true;
    planningOnly: true;
  };
};

export function createCommerceRuntimeModuleContract(): CommerceRuntimeModuleContract {
  return {
    moduleId: COMMERCE_RUNTIME_MODULE_ID,
    capabilities: COMMERCE_RUNTIME_CAPABILITIES,
    missionId: "CRT-001",
    integratesWith: [
      "brain",
      "soul-runtime",
      "reality-integration",
      "execution-layer",
      "operation-first-dollar",
      "commerce-readiness-engine",
      "empire-self-inspection",
      "ecommerce-os-orchestrator",
    ],
    protection: {
      noLiveExecution: true,
      noOAuth: true,
      noIrreversibleActions: true,
      planningOnly: true,
    },
  };
}
