/**
 * Supplier Opportunity Matching module — connects M027 opportunities to M028 suppliers.
 */

import type { ProductOpportunity } from "../../product-opportunity/models/product-opportunity.js";
import type { SupplierProfile } from "../../supplier-intelligence/models/supplier-profile.js";
import {
  SupplierOpportunityMatcher,
  defaultSupplierOpportunityMatcher,
} from "../matchers/supplier-opportunity-matcher.js";
import type {
  SupplierOpportunityMatch,
  SupplierMatchTier,
} from "../models/supplier-opportunity-match.js";
import type { MatchingRepository } from "../repositories/matching-repository.js";
import { createInMemoryMatchingRepository } from "../repositories/in-memory-matching-repository.js";

export const SUPPLIER_OPPORTUNITY_MODULE_ID = "supplier-opportunity-matching" as const;
export type SupplierOpportunityModuleId = typeof SUPPLIER_OPPORTUNITY_MODULE_ID;

export const SUPPLIER_OPPORTUNITY_MODULE_VERSION = "0.1.0" as const;

export type SupplierOpportunityCapability =
  | "supplier-opportunity.match.score"
  | "supplier-opportunity.match.rank"
  | "supplier-opportunity.match.persist"
  | "supplier-opportunity.match.list";

export const SUPPLIER_OPPORTUNITY_CAPABILITIES: readonly SupplierOpportunityCapability[] = [
  "supplier-opportunity.match.score",
  "supplier-opportunity.match.rank",
  "supplier-opportunity.match.persist",
  "supplier-opportunity.match.list",
] as const;

export type SupplierOpportunityModuleContract = {
  moduleId: SupplierOpportunityModuleId;
  version: string;
  capabilities: readonly SupplierOpportunityCapability[];
};

export const SUPPLIER_OPPORTUNITY_MODULE_CONTRACT: SupplierOpportunityModuleContract = {
  moduleId: SUPPLIER_OPPORTUNITY_MODULE_ID,
  version: SUPPLIER_OPPORTUNITY_MODULE_VERSION,
  capabilities: SUPPLIER_OPPORTUNITY_CAPABILITIES,
};

/** Orchestrates supplier-opportunity matching and persistence. */
export class SupplierOpportunityModule {
  readonly contract = SUPPLIER_OPPORTUNITY_MODULE_CONTRACT;

  constructor(
    private readonly repository: MatchingRepository,
    private readonly matcher: SupplierOpportunityMatcher = defaultSupplierOpportunityMatcher,
  ) {}

  scoreMatch(
    opportunity: ProductOpportunity,
    supplier: SupplierProfile,
    productCategories: string[] = [],
  ) {
    return this.matcher.score({ opportunity, supplier, productCategories });
  }

  rankSuppliers(
    opportunity: ProductOpportunity,
    suppliers: SupplierProfile[],
    productCategories: string[] = [],
  ) {
    return this.matcher.rankSuppliersForOpportunity(opportunity, suppliers, productCategories);
  }

  async matchAndPersist(
    workspaceId: string,
    opportunity: ProductOpportunity,
    supplier: SupplierProfile,
    productCategories: string[] = [],
  ): Promise<SupplierOpportunityMatch> {
    const matchInput = this.matcher.match({ opportunity, supplier, productCategories });
    const existing = await this.repository.getByTriple(
      workspaceId,
      matchInput.supplierId,
      matchInput.productId,
      matchInput.opportunityId,
    );

    if (existing) {
      return this.repository.update(workspaceId, existing.id, matchInput);
    }

    return this.repository.create(workspaceId, matchInput);
  }

  async listMatches(
    workspaceId: string,
    filters: {
      supplierId?: string;
      productId?: string;
      opportunityId?: string;
      matchTier?: SupplierMatchTier;
      minScore?: number;
    } = {},
  ): Promise<SupplierOpportunityMatch[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a supplier opportunity module with optional custom dependencies. */
export function createSupplierOpportunityModule(
  repository: MatchingRepository = createInMemoryMatchingRepository(),
  matcher: SupplierOpportunityMatcher = defaultSupplierOpportunityMatcher,
): SupplierOpportunityModule {
  return new SupplierOpportunityModule(repository, matcher);
}

export const supplierOpportunityModule = createSupplierOpportunityModule();
