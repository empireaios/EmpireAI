import type { ContentLibraryRecord } from "../models/content-library-record.js";
import type { ContentLibraryRepository } from "../repositories/content-library-repository.js";
import {
  generateContentLibrary,
  type ContentLibraryInput,
} from "../scoring/content-library-intelligence-scoring.js";

/** Generates content library intelligence from brand and store inputs. */
export class ContentLibraryIntelligenceEngine {
  constructor(private readonly repository: ContentLibraryRepository) {}

  generateLibrary(input: ContentLibraryInput) {
    return generateContentLibrary(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: ContentLibraryInput,
  ): Promise<ContentLibraryRecord> {
    const breakdown = generateContentLibrary(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultContentLibraryIntelligenceEngine = {
  generateLibrary: generateContentLibrary,
};

export type { ContentLibraryInput };
