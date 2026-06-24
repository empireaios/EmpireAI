import type { InvestigationPriority } from "../models/investigation-priority.js";
import type { PriorityLevel } from "../models/investigation-priority.js";
import type { InvestigationTarget, InvestigationTargetInput } from "../models/investigation-target.js";
import type { InvestigationPriorityScoreBreakdown } from "../scoring/priority-scoring.js";
export type InvestigationRepositoryQuery = {
  workspaceId: string;
  productId?: string;
  priorityLevel?: PriorityLevel;
  minPriorityScore?: number;
  limit?: number;
  offset?: number;
};

/** Persists investigation targets and priority rankings. */
export interface InvestigationRepository {
  upsertTarget(workspaceId: string, input: InvestigationTargetInput): Promise<InvestigationTarget>;
  getTargetByProduct(workspaceId: string, productId: string): Promise<InvestigationTarget | null>;
  getTargetById(workspaceId: string, targetId: string): Promise<InvestigationTarget | null>;

  savePriority(
    workspaceId: string,
    targetId: string,
    input: InvestigationPriorityScoreBreakdown,
  ): Promise<InvestigationPriority>;
  getPriorityByProduct(workspaceId: string, productId: string): Promise<InvestigationPriority | null>;
  getPriorityById(workspaceId: string, priorityId: string): Promise<InvestigationPriority | null>;
  listPriorities(query: InvestigationRepositoryQuery): Promise<InvestigationPriority[]>;
}
