import type { EngineCoordinationRecord } from "../models/engine-coordination-record.js";
import type { EngineCoordinationIntelligenceRepository } from "../repositories/engine-coordination-intelligence-repository.js";
import {
  generateEngineCoordination,
  type EngineCoordinationInput,
} from "../scoring/engine-coordination-intelligence-scoring.js";

/** Generates engine coordination intelligence from workspace inputs. */
export class EngineCoordinationIntelligenceEngine {
  constructor(private readonly repository: EngineCoordinationIntelligenceRepository) {}

  generateCoordination(input: EngineCoordinationInput) {
    return generateEngineCoordination(input);
  }

  async generateAndSave(input: EngineCoordinationInput): Promise<EngineCoordinationRecord> {
    const breakdown = generateEngineCoordination(input);
    return this.repository.save(breakdown);
  }
}

export const defaultEngineCoordinationIntelligenceEngine = {
  generateCoordination: generateEngineCoordination,
};

export type { EngineCoordinationInput };
