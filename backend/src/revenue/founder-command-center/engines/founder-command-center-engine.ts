import type { FounderCommandCenterRecord } from "../models/founder-command-center-record.js";
import type { FounderCommandCenterRepository } from "../repositories/founder-command-center-repository.js";
import {
  generateFounderCommandCenter,
  type FounderCommandCenterInput,
} from "../scoring/founder-command-center-scoring.js";

/** Synthesizes and persists founder command center dashboard snapshots. */
export class FounderCommandCenterEngine {
  constructor(private readonly repository: FounderCommandCenterRepository) {}

  synthesizeDashboard(input: FounderCommandCenterInput) {
    return generateFounderCommandCenter(input);
  }

  async synthesizeAndSave(
    workspaceId: string,
    input: FounderCommandCenterInput,
  ): Promise<FounderCommandCenterRecord> {
    const breakdown = generateFounderCommandCenter(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultFounderCommandCenterEngine = {
  synthesizeDashboard: generateFounderCommandCenter,
};

export type { FounderCommandCenterInput };
