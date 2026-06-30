import type { BusinessPolicy, PolicyLifecycleRecord } from "../models/business-policy.js";

export interface PolicyRepository {
  savePolicy(policy: BusinessPolicy): BusinessPolicy;
  getPolicyById(policyId: string): BusinessPolicy | null;
  getPolicyByCategory(workspaceId: string, category: string): BusinessPolicy | null;
  listPolicies(workspaceId: string, status?: string): BusinessPolicy[];

  appendLifecycle(record: PolicyLifecycleRecord): PolicyLifecycleRecord;
  listLifecycle(policyId: string, limit?: number): PolicyLifecycleRecord[];
  listWorkspaceLifecycle(workspaceId: string, limit?: number): PolicyLifecycleRecord[];
}
