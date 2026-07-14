import {
  assembleEnterpriseGovernanceFramework,
  buildFallbackEnterpriseGovernanceFramework,
} from "@empireai/pillow";

/** Fallback Enterprise Governance Framework when Pillow session is unavailable. */
export function collectEnterpriseGovernanceFrameworkSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E5-01",
    live: false,
    enterpriseGovernanceFramework: buildFallbackEnterpriseGovernanceFramework(),
  };
}

export { assembleEnterpriseGovernanceFramework, buildFallbackEnterpriseGovernanceFramework };
