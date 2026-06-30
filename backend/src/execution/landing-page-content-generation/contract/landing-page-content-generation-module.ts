/**
 * Landing Page Content Generation module — converts blueprints into complete page content.
 */

import {
  LandingPageContentGenerationEngine,
  defaultLandingPageContentGenerationEngine,
  type LandingPageContentInput,
} from "../engines/landing-page-content-generation-engine.js";
import type { LandingPageContent } from "../models/landing-page-content.js";
import {
  landingPageContentScoring,
  scoreLandingPageContent,
  type ContentBlueprintInput,
  type ContentBrandInput,
  type ContentOfferInput,
} from "../scoring/landing-page-content-scoring.js";
import type {
  ContentRepository,
  ContentRepositoryQuery,
} from "../repositories/content-repository.js";
import { createInMemoryContentRepository } from "../repositories/in-memory-content-repository.js";

export const LANDING_PAGE_CONTENT_GENERATION_MODULE_ID =
  "landing-page-content-generation" as const;
export type LandingPageContentGenerationModuleId =
  typeof LANDING_PAGE_CONTENT_GENERATION_MODULE_ID;

export const LANDING_PAGE_CONTENT_GENERATION_MODULE_VERSION = "0.1.0" as const;

export type LandingPageContentGenerationCapability =
  | "landing-page-content-generation.generate"
  | "landing-page-content-generation.score"
  | "landing-page-content-generation.persist"
  | "landing-page-content-generation.list";

export const LANDING_PAGE_CONTENT_GENERATION_CAPABILITIES: readonly LandingPageContentGenerationCapability[] =
  [
    "landing-page-content-generation.generate",
    "landing-page-content-generation.score",
    "landing-page-content-generation.persist",
    "landing-page-content-generation.list",
  ] as const;

export type LandingPageContentGenerationModuleContract = {
  moduleId: LandingPageContentGenerationModuleId;
  version: string;
  capabilities: readonly LandingPageContentGenerationCapability[];
};

export const LANDING_PAGE_CONTENT_GENERATION_MODULE_CONTRACT: LandingPageContentGenerationModuleContract =
  {
    moduleId: LANDING_PAGE_CONTENT_GENERATION_MODULE_ID,
    version: LANDING_PAGE_CONTENT_GENERATION_MODULE_VERSION,
    capabilities: LANDING_PAGE_CONTENT_GENERATION_CAPABILITIES,
  };

/** Orchestrates landing page content generation and persistence. */
export class LandingPageContentGenerationModule {
  readonly contract = LANDING_PAGE_CONTENT_GENERATION_MODULE_CONTRACT;
  private readonly engine: LandingPageContentGenerationEngine;

  constructor(
    private readonly repository: ContentRepository,
    engine?: LandingPageContentGenerationEngine,
  ) {
    this.engine = engine ?? new LandingPageContentGenerationEngine(repository);
  }

  scoreLandingPageContent = scoreLandingPageContent;
  scoring = landingPageContentScoring;

  generateLandingPageContent(input: LandingPageContentInput) {
    return this.engine.generateContent(input);
  }

  async persistLandingPageContent(
    workspaceId: string,
    input: LandingPageContentInput,
  ): Promise<LandingPageContent> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getLandingPageContent(
    workspaceId: string,
    contentId: string,
  ): Promise<LandingPageContent | null> {
    return this.repository.getById(workspaceId, contentId);
  }

  async getContentByPage(
    workspaceId: string,
    pageId: string,
  ): Promise<LandingPageContent | null> {
    return this.repository.getByPage(workspaceId, pageId);
  }

  async listLandingPageContent(
    workspaceId: string,
    filters: Omit<ContentRepositoryQuery, "workspaceId"> = {},
  ): Promise<LandingPageContent[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a landing page content generation module with optional custom dependencies. */
export function createLandingPageContentGenerationModule(
  repository: ContentRepository = createInMemoryContentRepository(),
  engine?: LandingPageContentGenerationEngine,
): LandingPageContentGenerationModule {
  return new LandingPageContentGenerationModule(
    repository,
    engine ?? new LandingPageContentGenerationEngine(repository),
  );
}

export const landingPageContentGenerationModule = createLandingPageContentGenerationModule();

export type {
  LandingPageContentInput,
  ContentBlueprintInput,
  ContentOfferInput,
  ContentBrandInput,
};

export { defaultLandingPageContentGenerationEngine };
