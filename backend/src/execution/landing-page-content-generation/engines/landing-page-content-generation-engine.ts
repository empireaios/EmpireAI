import type { LandingPageContent } from "../models/landing-page-content.js";
import type { ContentRepository } from "../repositories/content-repository.js";
import {
  scoreLandingPageContent,
  type LandingPageContentInput,
} from "../scoring/landing-page-content-scoring.js";

/** Converts landing page blueprints into complete page content. */
export class LandingPageContentGenerationEngine {
  constructor(private readonly repository: ContentRepository) {}

  generateContent(input: LandingPageContentInput) {
    return scoreLandingPageContent(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: LandingPageContentInput,
  ): Promise<LandingPageContent> {
    const breakdown = scoreLandingPageContent(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultLandingPageContentGenerationEngine = {
  generateContent: scoreLandingPageContent,
};

export type { LandingPageContentInput };
