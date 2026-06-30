import type { CustomerJourneyRecord } from "../models/customer-journey-record.js";
import type { CustomerJourneyRepository } from "../repositories/customer-journey-repository.js";
import {
  generateCustomerJourney,
  type CustomerJourneyInput,
} from "../scoring/customer-journey-intelligence-scoring.js";

/** Generates customer journey intelligence from brand and store inputs. */
export class CustomerJourneyIntelligenceEngine {
  constructor(private readonly repository: CustomerJourneyRepository) {}

  generateJourney(input: CustomerJourneyInput) {
    return generateCustomerJourney(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: CustomerJourneyInput,
  ): Promise<CustomerJourneyRecord> {
    const breakdown = generateCustomerJourney(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultCustomerJourneyIntelligenceEngine = {
  generateJourney: generateCustomerJourney,
};

export type { CustomerJourneyInput };
