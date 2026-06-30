/**
 * Creative Asset Blueprint module — generates ad creatives for Canva, Veo, and image generation.
 */

import {
  CreativeAssetBlueprintEngine,
  defaultCreativeAssetBlueprintEngine,
  type CreativeAssetBlueprintInput,
} from "../engines/creative-asset-blueprint-engine.js";
import type { CreativeAssetRecord } from "../models/creative-asset-record.js";
import {
  creativeAssetBlueprintScoring,
  generateCreativeAssetBlueprint,
  type CreativeAssetBrandInput,
  type CreativeAssetOfferInput,
} from "../scoring/creative-asset-blueprint-scoring.js";
import type {
  CreativeAssetBlueprintRepository,
  CreativeAssetBlueprintRepositoryQuery,
} from "../repositories/creative-asset-blueprint-repository.js";
import { createInMemoryCreativeAssetBlueprintRepository } from "../repositories/in-memory-creative-asset-blueprint-repository.js";

export const CREATIVE_ASSET_BLUEPRINT_MODULE_ID = "creative-asset-blueprint" as const;
export type CreativeAssetBlueprintModuleId = typeof CREATIVE_ASSET_BLUEPRINT_MODULE_ID;

export const CREATIVE_ASSET_BLUEPRINT_MODULE_VERSION = "0.1.0" as const;

export type CreativeAssetBlueprintCapability =
  | "creative-asset-blueprint.generate"
  | "creative-asset-blueprint.score"
  | "creative-asset-blueprint.persist"
  | "creative-asset-blueprint.list";

export const CREATIVE_ASSET_BLUEPRINT_CAPABILITIES: readonly CreativeAssetBlueprintCapability[] = [
  "creative-asset-blueprint.generate",
  "creative-asset-blueprint.score",
  "creative-asset-blueprint.persist",
  "creative-asset-blueprint.list",
] as const;

export type CreativeAssetBlueprintModuleContract = {
  moduleId: CreativeAssetBlueprintModuleId;
  version: string;
  capabilities: readonly CreativeAssetBlueprintCapability[];
};

export const CREATIVE_ASSET_BLUEPRINT_MODULE_CONTRACT: CreativeAssetBlueprintModuleContract = {
  moduleId: CREATIVE_ASSET_BLUEPRINT_MODULE_ID,
  version: CREATIVE_ASSET_BLUEPRINT_MODULE_VERSION,
  capabilities: CREATIVE_ASSET_BLUEPRINT_CAPABILITIES,
};

/** Orchestrates creative asset blueprint generation and persistence. */
export class CreativeAssetBlueprintModule {
  readonly contract = CREATIVE_ASSET_BLUEPRINT_MODULE_CONTRACT;
  private readonly engine: CreativeAssetBlueprintEngine;

  constructor(
    private readonly repository: CreativeAssetBlueprintRepository,
    engine?: CreativeAssetBlueprintEngine,
  ) {
    this.engine = engine ?? new CreativeAssetBlueprintEngine(repository);
  }

  generateCreativeAssetBlueprint = generateCreativeAssetBlueprint;
  scoring = creativeAssetBlueprintScoring;

  generateBlueprint(input: CreativeAssetBlueprintInput) {
    return this.engine.generateBlueprint(input);
  }

  async persistBlueprint(
    workspaceId: string,
    input: CreativeAssetBlueprintInput,
  ): Promise<CreativeAssetRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getBlueprintRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<CreativeAssetRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getBlueprintByCampaign(
    workspaceId: string,
    campaignId: string,
  ): Promise<CreativeAssetRecord | null> {
    return this.repository.getByCampaign(workspaceId, campaignId);
  }

  async listBlueprintRecords(
    workspaceId: string,
    filters: Omit<CreativeAssetBlueprintRepositoryQuery, "workspaceId"> = {},
  ): Promise<CreativeAssetRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a creative asset blueprint module with optional custom dependencies. */
export function createCreativeAssetBlueprintModule(
  repository: CreativeAssetBlueprintRepository = createInMemoryCreativeAssetBlueprintRepository(),
  engine?: CreativeAssetBlueprintEngine,
): CreativeAssetBlueprintModule {
  return new CreativeAssetBlueprintModule(
    repository,
    engine ?? new CreativeAssetBlueprintEngine(repository),
  );
}

export const creativeAssetBlueprintModule = createCreativeAssetBlueprintModule();

export type {
  CreativeAssetBlueprintInput,
  CreativeAssetBrandInput,
  CreativeAssetOfferInput,
};

export { defaultCreativeAssetBlueprintEngine };
