import type { GovernanceRepository } from "../repositories/governance-repository.js";
import { getGovernanceRepository } from "../repositories/sqlite-governance-repository.js";

export const EMPIRE_GOVERNANCE_MODULE_ID = "empire-governance" as const;

export type GovernanceCapability =
  | "empire-governance.evaluate"
  | "empire-governance.policies"
  | "empire-governance.decisions"
  | "empire-governance.capabilities";

export const EMPIRE_GOVERNANCE_CAPABILITIES: GovernanceCapability[] = [
  "empire-governance.evaluate",
  "empire-governance.policies",
  "empire-governance.decisions",
  "empire-governance.capabilities",
];

export type EmpireGovernanceModuleContract = {
  moduleId: typeof EMPIRE_GOVERNANCE_MODULE_ID;
  capabilities: GovernanceCapability[];
  repository: GovernanceRepository;
};

export function createEmpireGovernanceModuleContract(): EmpireGovernanceModuleContract {
  return {
    moduleId: EMPIRE_GOVERNANCE_MODULE_ID,
    capabilities: EMPIRE_GOVERNANCE_CAPABILITIES,
    repository: getGovernanceRepository(),
  };
}
