import type { EmailMarketingRecord } from "../models/email-marketing-record.js";
import type { EmailMarketingRepository } from "../repositories/email-marketing-repository.js";
import {
  generateEmailMarketingBlueprint,
  type EmailMarketingInput,
} from "../scoring/email-marketing-intelligence-scoring.js";

/** Generates email marketing intelligence from brand and store inputs. */
export class EmailMarketingIntelligenceEngine {
  constructor(private readonly repository: EmailMarketingRepository) {}

  generateBlueprint(input: EmailMarketingInput) {
    return generateEmailMarketingBlueprint(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: EmailMarketingInput,
  ): Promise<EmailMarketingRecord> {
    const breakdown = generateEmailMarketingBlueprint(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultEmailMarketingIntelligenceEngine = {
  generateBlueprint: generateEmailMarketingBlueprint,
};

export type { EmailMarketingInput };
