/**
 * Landing Page Blueprint module — converts product offers into page blueprints.
 */

import {
  LandingPageBlueprintEngine,
  defaultLandingPageBlueprintEngine,
  type LandingPageBlueprintInput,
} from "../engines/landing-page-blueprint-engine.js";
import type { LandingPageBlueprint } from "../models/landing-page-blueprint.js";
import {
  landingPageBlueprintScoring,
  scoreLandingPageBlueprint,
  type BlueprintBrandInput,
  type BlueprintProductOfferInput,
} from "../scoring/landing-page-blueprint-scoring.js";
import type {
  BlueprintRepository,
  BlueprintRepositoryQuery,
} from "../repositories/blueprint-repository.js";
import { createInMemoryBlueprintRepository } from "../repositories/in-memory-blueprint-repository.js";

export const LANDING_PAGE_BLUEPRINT_MODULE_ID = "landing-page-blueprint" as const;
export type LandingPageBlueprintModuleId = typeof LANDING_PAGE_BLUEPRINT_MODULE_ID;

export const LANDING_PAGE_BLUEPRINT_MODULE_VERSION = "0.1.0" as const;

export type LandingPageBlueprintCapability =
  | "landing-page-blueprint.generate"
  | "landing-page-blueprint.score"
  | "landing-page-blueprint.persist"
  | "landing-page-blueprint.list";

export const LANDING_PAGE_BLUEPRINT_CAPABILITIES: readonly LandingPageBlueprintCapability[] = [
  "landing-page-blueprint.generate",
  "landing-page-blueprint.score",
  "landing-page-blueprint.persist",
  "landing-page-blueprint.list",
] as const;

export type LandingPageBlueprintModuleContract = {
  moduleId: LandingPageBlueprintModuleId;
  version: string;
  capabilities: readonly LandingPageBlueprintCapability[];
};

export const LANDING_PAGE_BLUEPRINT_MODULE_CONTRACT: LandingPageBlueprintModuleContract = {
  moduleId: LANDING_PAGE_BLUEPRINT_MODULE_ID,
  version: LANDING_PAGE_BLUEPRINT_MODULE_VERSION,
  capabilities: LANDING_PAGE_BLUEPRINT_CAPABILITIES,
};

/** Orchestrates landing page blueprint generation and persistence. */
export class LandingPageBlueprintModule {
  readonly contract = LANDING_PAGE_BLUEPRINT_MODULE_CONTRACT;
  private readonly engine: LandingPageBlueprintEngine;

  constructor(
    private readonly repository: BlueprintRepository,
    engine?: LandingPageBlueprintEngine,
  ) {
    this.engine = engine ?? new LandingPageBlueprintEngine(repository);
  }

  scoreLandingPageBlueprint = scoreLandingPageBlueprint;
  scoring = landingPageBlueprintScoring;

  generateLandingPageBlueprint(input: LandingPageBlueprintInput) {
    return this.engine.generateBlueprint(input);
  }

  async persistLandingPageBlueprint(
    workspaceId: string,
    input: LandingPageBlueprintInput,
  ): Promise<LandingPageBlueprint> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getLandingPageBlueprint(
    workspaceId: string,
    pageId: string,
  ): Promise<LandingPageBlueprint | null> {
    return this.repository.getById(workspaceId, pageId);
  }

  async getBlueprintByOffer(
    workspaceId: string,
    offerId: string,
  ): Promise<LandingPageBlueprint | null> {
    return this.repository.getByOffer(workspaceId, offerId);
  }

  async listLandingPageBlueprints(
    workspaceId: string,
    filters: Omit<BlueprintRepositoryQuery, "workspaceId"> = {},
  ): Promise<LandingPageBlueprint[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a landing page blueprint module with optional custom dependencies. */
export function createLandingPageBlueprintModule(
  repository: BlueprintRepository = createInMemoryBlueprintRepository(),
  engine?: LandingPageBlueprintEngine,
): LandingPageBlueprintModule {
  return new LandingPageBlueprintModule(
    repository,
    engine ?? new LandingPageBlueprintEngine(repository),
  );
}

export const landingPageBlueprintModule = createLandingPageBlueprintModule();

export type {
  LandingPageBlueprintInput,
  BlueprintProductOfferInput,
  BlueprintBrandInput,
};

export { defaultLandingPageBlueprintEngine };
