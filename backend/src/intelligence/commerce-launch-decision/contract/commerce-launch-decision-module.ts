/**
 * Commerce Launch Decision module — decides whether to launch a product opportunity now.
 */

import type { BuyerProductMatch } from "../../buyer-product-matching/models/buyer-product-match.js";
import type { ReachabilityProfile } from "../../buyer-reachability/models/reachability-profile.js";
import type { ProductOpportunity } from "../../product-opportunity/models/product-opportunity.js";
import type { SupplierOpportunityMatch } from "../../supplier-opportunity-matching/models/supplier-opportunity-match.js";
import {
  CommerceLaunchDecisionEngine,
  defaultCommerceLaunchDecisionEngine,
} from "../engines/commerce-launch-decision-engine.js";
import type { CommerceLaunchDecision, LaunchDecision } from "../models/commerce-launch-decision.js";
import type { LaunchDecisionRepository } from "../repositories/launch-decision-repository.js";
import { createInMemoryLaunchDecisionRepository } from "../repositories/in-memory-launch-decision-repository.js";

export const COMMERCE_LAUNCH_DECISION_MODULE_ID = "commerce-launch-decision" as const;
export type CommerceLaunchDecisionModuleId = typeof COMMERCE_LAUNCH_DECISION_MODULE_ID;

export const COMMERCE_LAUNCH_DECISION_MODULE_VERSION = "0.1.0" as const;

export type CommerceLaunchDecisionCapability =
  | "commerce-launch-decision.evaluate"
  | "commerce-launch-decision.persist"
  | "commerce-launch-decision.list";

export const COMMERCE_LAUNCH_DECISION_CAPABILITIES: readonly CommerceLaunchDecisionCapability[] = [
  "commerce-launch-decision.evaluate",
  "commerce-launch-decision.persist",
  "commerce-launch-decision.list",
] as const;

export type CommerceLaunchDecisionModuleContract = {
  moduleId: CommerceLaunchDecisionModuleId;
  version: string;
  capabilities: readonly CommerceLaunchDecisionCapability[];
};

export const COMMERCE_LAUNCH_DECISION_MODULE_CONTRACT: CommerceLaunchDecisionModuleContract = {
  moduleId: COMMERCE_LAUNCH_DECISION_MODULE_ID,
  version: COMMERCE_LAUNCH_DECISION_MODULE_VERSION,
  capabilities: COMMERCE_LAUNCH_DECISION_CAPABILITIES,
};

/** Orchestrates commerce launch decision evaluation and persistence. */
export class CommerceLaunchDecisionModule {
  readonly contract = COMMERCE_LAUNCH_DECISION_MODULE_CONTRACT;

  constructor(
    private readonly repository: LaunchDecisionRepository,
    private readonly engine: CommerceLaunchDecisionEngine = defaultCommerceLaunchDecisionEngine,
  ) {}

  evaluate(
    opportunity: ProductOpportunity,
    supplierMatch: SupplierOpportunityMatch,
    buyerMatch: BuyerProductMatch,
    reachability: ReachabilityProfile,
  ) {
    return this.engine.evaluate({ opportunity, supplierMatch, buyerMatch, reachability });
  }

  async decideAndPersist(
    workspaceId: string,
    opportunity: ProductOpportunity,
    supplierMatch: SupplierOpportunityMatch,
    buyerMatch: BuyerProductMatch,
    reachability: ReachabilityProfile,
  ): Promise<CommerceLaunchDecision> {
    const input = this.engine.decide(opportunity, supplierMatch, buyerMatch, reachability);
    const existing = await this.repository.getByContext(
      workspaceId,
      input.productId,
      input.supplierId,
      input.opportunityId,
    );

    if (existing) {
      return this.repository.update(workspaceId, existing.decisionId, input);
    }

    return this.repository.create(workspaceId, input);
  }

  async listDecisions(
    workspaceId: string,
    filters: {
      productId?: string;
      supplierId?: string;
      decision?: LaunchDecision;
      minLaunchScore?: number;
    } = {},
  ): Promise<CommerceLaunchDecision[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a commerce launch decision module with optional custom dependencies. */
export function createCommerceLaunchDecisionModule(
  repository: LaunchDecisionRepository = createInMemoryLaunchDecisionRepository(),
  engine: CommerceLaunchDecisionEngine = defaultCommerceLaunchDecisionEngine,
): CommerceLaunchDecisionModule {
  return new CommerceLaunchDecisionModule(repository, engine);
}

export const commerceLaunchDecisionModule = createCommerceLaunchDecisionModule();
