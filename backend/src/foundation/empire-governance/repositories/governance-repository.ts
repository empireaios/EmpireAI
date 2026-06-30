import type {
  GovernanceDecisionRecord,
  GovernancePolicyRule,
} from "../models/governance-policy.js";

export interface GovernanceRepository {
  savePolicy(rule: GovernancePolicyRule): GovernancePolicyRule;
  getPolicyById(policyId: string): GovernancePolicyRule | null;
  listPolicies(workspaceId: string, domain?: string): GovernancePolicyRule[];
  deletePolicy(policyId: string): boolean;

  appendDecision(record: GovernanceDecisionRecord): GovernanceDecisionRecord;
  listDecisions(workspaceId: string, limit?: number): GovernanceDecisionRecord[];
}
