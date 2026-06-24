/**
 * Supplier Intelligence module contract — evaluates whether products can be reliably sourced.
 */

import type { SupplierCapability } from "../models/supplier-capability.js";
import type { SupplierProfile, SupplierProfileCreateInput } from "../models/supplier-profile.js";
import type { SupplierRiskLevel } from "../models/supplier-risk-profile.js";
import type { SupplierRepository } from "../repositories/supplier-repository.js";
import { createInMemorySupplierRepository } from "../repositories/in-memory-supplier-repository.js";
import {
  evaluateRequiredCapabilities,
  scoreSupplierProfile,
  type SupplierScoreBreakdown,
} from "../scoring/supplier-scoring.js";

export const SUPPLIER_INTELLIGENCE_MODULE_ID = "supplier-intelligence" as const;
export type SupplierIntelligenceModuleId = typeof SUPPLIER_INTELLIGENCE_MODULE_ID;

export const SUPPLIER_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type SupplierIntelligenceCapability =
  | "supplier-intelligence.profile.create"
  | "supplier-intelligence.profile.score"
  | "supplier-intelligence.profile.risk"
  | "supplier-intelligence.profile.capability"
  | "supplier-intelligence.profile.list";

export const SUPPLIER_INTELLIGENCE_CAPABILITIES: readonly SupplierIntelligenceCapability[] = [
  "supplier-intelligence.profile.create",
  "supplier-intelligence.profile.score",
  "supplier-intelligence.profile.risk",
  "supplier-intelligence.profile.capability",
  "supplier-intelligence.profile.list",
] as const;

export type SupplierIntelligenceModuleContract = {
  moduleId: SupplierIntelligenceModuleId;
  version: string;
  capabilities: readonly SupplierIntelligenceCapability[];
};

export const SUPPLIER_INTELLIGENCE_MODULE_CONTRACT: SupplierIntelligenceModuleContract = {
  moduleId: SUPPLIER_INTELLIGENCE_MODULE_ID,
  version: SUPPLIER_INTELLIGENCE_MODULE_VERSION,
  capabilities: SUPPLIER_INTELLIGENCE_CAPABILITIES,
};

/** Orchestrates supplier profile creation, scoring, and persistence. */
export class SupplierIntelligenceModule {
  readonly contract = SUPPLIER_INTELLIGENCE_MODULE_CONTRACT;

  constructor(private readonly repository: SupplierRepository) {}

  scoreSupplier(input: SupplierProfileCreateInput): SupplierScoreBreakdown {
    return scoreSupplierProfile(input);
  }

  evaluateCapabilities(
    capability: SupplierCapability,
    requirements: Partial<SupplierCapability>,
  ) {
    return evaluateRequiredCapabilities(capability, requirements);
  }

  async createSupplier(
    workspaceId: string,
    input: SupplierProfileCreateInput,
  ): Promise<SupplierProfile> {
    const existing = await this.repository.getBySupplierId(workspaceId, input.supplierId);
    if (existing) {
      return this.repository.update(workspaceId, existing.id, input);
    }
    return this.repository.create(workspaceId, input);
  }

  async getSupplier(workspaceId: string, supplierId: string): Promise<SupplierProfile | null> {
    return this.repository.getBySupplierId(workspaceId, supplierId);
  }

  async listSuppliers(
    workspaceId: string,
    filters: {
      country?: string;
      category?: string;
      minTrustScore?: number;
      riskLevel?: SupplierRiskLevel;
    } = {},
  ): Promise<SupplierProfile[]> {
    return this.repository.list({ workspaceId, ...filters });
  }

  canReliablySource(profile: SupplierProfile): boolean {
    const scored = scoreSupplierProfile({
      supplierId: profile.supplierId,
      supplierName: profile.supplierName,
      country: profile.country,
      categories: profile.categories,
      fulfillmentScore: profile.fulfillmentScore,
      reliabilityScore: profile.reliabilityScore,
      communicationScore: profile.communicationScore,
      qualityScore: profile.qualityScore,
      capability: profile.capability,
    });
    return scored.sourceable;
  }
}

/** Factory for a supplier intelligence module with optional custom repository. */
export function createSupplierIntelligenceModule(
  repository: SupplierRepository = createInMemorySupplierRepository(),
): SupplierIntelligenceModule {
  return new SupplierIntelligenceModule(repository);
}

export const supplierIntelligenceModule = createSupplierIntelligenceModule();
