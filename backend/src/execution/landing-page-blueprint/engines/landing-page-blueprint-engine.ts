import type { LandingPageBlueprint } from "../models/landing-page-blueprint.js";
import type { BlueprintRepository } from "../repositories/blueprint-repository.js";
import {
  scoreLandingPageBlueprint,
  type LandingPageBlueprintInput,
} from "../scoring/landing-page-blueprint-scoring.js";

/** Converts product offers into landing page blueprints. */
export class LandingPageBlueprintEngine {
  constructor(private readonly repository: BlueprintRepository) {}

  generateBlueprint(input: LandingPageBlueprintInput) {
    return scoreLandingPageBlueprint(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: LandingPageBlueprintInput,
  ): Promise<LandingPageBlueprint> {
    const breakdown = scoreLandingPageBlueprint(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultLandingPageBlueprintEngine = {
  generateBlueprint: scoreLandingPageBlueprint,
};

export type { LandingPageBlueprintInput };
