import type { InvestigationPlan, InvestigationPlanCreateInput } from "../models/investigation-plan.js";

export type InvestigationPlanRepositoryQuery = {
  workspaceId: string;
  targetId?: string;
  productId?: string;
  limit?: number;
  offset?: number;
};

/** Persists autonomous investigation plans. */
export interface InvestigationRepository {
  savePlan(workspaceId: string, input: InvestigationPlanCreateInput): Promise<InvestigationPlan>;
  getPlanById(workspaceId: string, investigationPlanId: string): Promise<InvestigationPlan | null>;
  getPlanByTarget(workspaceId: string, targetId: string): Promise<InvestigationPlan | null>;
  listPlans(query: InvestigationPlanRepositoryQuery): Promise<InvestigationPlan[]>;
  deletePlan(workspaceId: string, investigationPlanId: string): Promise<boolean>;
}
