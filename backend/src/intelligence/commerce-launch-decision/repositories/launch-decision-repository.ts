import type {
  CommerceLaunchDecision,
  CommerceLaunchDecisionCreateInput,
  CommerceLaunchDecisionUpdateInput,
  LaunchDecision,
} from "../models/commerce-launch-decision.js";

export type LaunchDecisionListQuery = {
  workspaceId: string;
  productId?: string;
  supplierId?: string;
  buyerPersonaId?: string;
  opportunityId?: string;
  decision?: LaunchDecision;
  minLaunchScore?: number;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persistence contract for commerce launch decisions. */
export interface LaunchDecisionRepository {
  create(
    workspaceId: string,
    input: CommerceLaunchDecisionCreateInput,
  ): Promise<CommerceLaunchDecision>;
  getById(workspaceId: string, decisionId: string): Promise<CommerceLaunchDecision | null>;
  getByContext(
    workspaceId: string,
    productId: string,
    supplierId: string,
    opportunityId: string,
  ): Promise<CommerceLaunchDecision | null>;
  update(
    workspaceId: string,
    decisionId: string,
    input: CommerceLaunchDecisionUpdateInput,
  ): Promise<CommerceLaunchDecision>;
  delete(workspaceId: string, decisionId: string): Promise<boolean>;
  list(query: LaunchDecisionListQuery): Promise<CommerceLaunchDecision[]>;
}
