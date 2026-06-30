import type { MobileMessagingRecord } from "../models/mobile-messaging-record.js";
import type { MobileMessagingRepository } from "../repositories/mobile-messaging-repository.js";
import {
  generateMobileMessagingBlueprint,
  type MobileMessagingInput,
} from "../scoring/mobile-messaging-intelligence-scoring.js";

/** Generates mobile messaging intelligence from brand and store inputs. */
export class MobileMessagingIntelligenceEngine {
  constructor(private readonly repository: MobileMessagingRepository) {}

  generateBlueprint(input: MobileMessagingInput) {
    return generateMobileMessagingBlueprint(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: MobileMessagingInput,
  ): Promise<MobileMessagingRecord> {
    const breakdown = generateMobileMessagingBlueprint(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultMobileMessagingIntelligenceEngine = {
  generateBlueprint: generateMobileMessagingBlueprint,
};

export type { MobileMessagingInput };
