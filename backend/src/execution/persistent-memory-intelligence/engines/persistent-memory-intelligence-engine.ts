import type { PersistentMemoryRecord } from "../models/persistent-memory-record.js";
import type { PersistentMemoryIntelligenceRepository } from "../repositories/persistent-memory-intelligence-repository.js";
import {
  generatePersistentMemory,
  type PersistentMemoryInput,
} from "../scoring/persistent-memory-intelligence-scoring.js";

/** Generates persistent memory intelligence from brand and context inputs. */
export class PersistentMemoryIntelligenceEngine {
  constructor(private readonly repository: PersistentMemoryIntelligenceRepository) {}

  generateMemory(input: PersistentMemoryInput) {
    return generatePersistentMemory(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: PersistentMemoryInput,
  ): Promise<PersistentMemoryRecord> {
    const breakdown = generatePersistentMemory(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultPersistentMemoryIntelligenceEngine = {
  generateMemory: generatePersistentMemory,
};

export type { PersistentMemoryInput };
