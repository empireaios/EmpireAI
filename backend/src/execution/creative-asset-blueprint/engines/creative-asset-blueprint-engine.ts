import type { CreativeAssetRecord } from "../models/creative-asset-record.js";
import type { CreativeAssetBlueprintRepository } from "../repositories/creative-asset-blueprint-repository.js";
import {
  generateCreativeAssetBlueprint,
  type CreativeAssetBlueprintInput,
} from "../scoring/creative-asset-blueprint-scoring.js";

/** Generates creative asset blueprints for ad production tools. */
export class CreativeAssetBlueprintEngine {
  constructor(private readonly repository: CreativeAssetBlueprintRepository) {}

  generateBlueprint(input: CreativeAssetBlueprintInput) {
    return generateCreativeAssetBlueprint(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: CreativeAssetBlueprintInput,
  ): Promise<CreativeAssetRecord> {
    const breakdown = generateCreativeAssetBlueprint(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultCreativeAssetBlueprintEngine = {
  generateBlueprint: generateCreativeAssetBlueprint,
};

export type { CreativeAssetBlueprintInput };
