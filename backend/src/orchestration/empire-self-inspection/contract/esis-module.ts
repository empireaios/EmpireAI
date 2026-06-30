export const EMPIRE_SELF_INSPECTION_MODULE_ID = "empire-self-inspection" as const;

export const ESIS_CAPABILITIES = [
  "self_inspection",
  "review_package_generation",
  "architecture_health",
  "production_readiness_scan",
] as const;

export type EsisCapability = (typeof ESIS_CAPABILITIES)[number];

export type EsisModuleContract = {
  moduleId: typeof EMPIRE_SELF_INSPECTION_MODULE_ID;
  capabilities: EsisCapability[];
  missionId: "S001";
};

export function createEsisModuleContract(): EsisModuleContract {
  return {
    moduleId: EMPIRE_SELF_INSPECTION_MODULE_ID,
    capabilities: [...ESIS_CAPABILITIES],
    missionId: "S001",
  };
}
