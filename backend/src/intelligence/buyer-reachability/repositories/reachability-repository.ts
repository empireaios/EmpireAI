import type {
  ReachabilityProfile,
  ReachabilityProfileCreateInput,
  ReachabilityProfileUpdateInput,
} from "../models/reachability-profile.js";

export type ReachabilityListQuery = {
  workspaceId: string;
  buyerPersonaId?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persistence contract for buyer reachability profiles. */
export interface ReachabilityRepository {
  create(workspaceId: string, input: ReachabilityProfileCreateInput): Promise<ReachabilityProfile>;
  getById(workspaceId: string, id: string): Promise<ReachabilityProfile | null>;
  getByPersonaId(workspaceId: string, buyerPersonaId: string): Promise<ReachabilityProfile | null>;
  update(
    workspaceId: string,
    id: string,
    input: ReachabilityProfileUpdateInput,
  ): Promise<ReachabilityProfile>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: ReachabilityListQuery): Promise<ReachabilityProfile[]>;
}
