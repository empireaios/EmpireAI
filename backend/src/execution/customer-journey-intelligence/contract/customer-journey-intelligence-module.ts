/**
 * Customer Journey Intelligence module — scored journey blueprints without deployment.
 */

import {
  CustomerJourneyIntelligenceEngine,
  defaultCustomerJourneyIntelligenceEngine,
  type CustomerJourneyInput,
} from "../engines/customer-journey-intelligence-engine.js";
import type { CustomerJourneyRecord } from "../models/customer-journey-record.js";
import {
  generateCustomerJourney,
  customerJourneyIntelligenceScoring,
  type CustomerJourneyBrandInput,
  type CustomerJourneyOfferInput,
} from "../scoring/customer-journey-intelligence-scoring.js";
import type {
  CustomerJourneyRepository,
  CustomerJourneyRepositoryQuery,
} from "../repositories/customer-journey-repository.js";
import { createInMemoryCustomerJourneyRepository } from "../repositories/in-memory-customer-journey-repository.js";

export const CUSTOMER_JOURNEY_INTELLIGENCE_MODULE_ID = "customer-journey-intelligence" as const;
export type CustomerJourneyIntelligenceModuleId = typeof CUSTOMER_JOURNEY_INTELLIGENCE_MODULE_ID;

export const CUSTOMER_JOURNEY_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type CustomerJourneyIntelligenceCapability =
  | "customer-journey-intelligence.generate"
  | "customer-journey-intelligence.score"
  | "customer-journey-intelligence.persist"
  | "customer-journey-intelligence.list";

export const CUSTOMER_JOURNEY_INTELLIGENCE_CAPABILITIES: readonly CustomerJourneyIntelligenceCapability[] =
  [
    "customer-journey-intelligence.generate",
    "customer-journey-intelligence.score",
    "customer-journey-intelligence.persist",
    "customer-journey-intelligence.list",
  ] as const;

export type CustomerJourneyIntelligenceModuleContract = {
  moduleId: CustomerJourneyIntelligenceModuleId;
  version: string;
  capabilities: readonly CustomerJourneyIntelligenceCapability[];
};

export const CUSTOMER_JOURNEY_INTELLIGENCE_MODULE_CONTRACT: CustomerJourneyIntelligenceModuleContract =
  {
    moduleId: CUSTOMER_JOURNEY_INTELLIGENCE_MODULE_ID,
    version: CUSTOMER_JOURNEY_INTELLIGENCE_MODULE_VERSION,
    capabilities: CUSTOMER_JOURNEY_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates customer journey generation and persistence. */
export class CustomerJourneyIntelligenceModule {
  readonly contract = CUSTOMER_JOURNEY_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: CustomerJourneyIntelligenceEngine;

  constructor(
    private readonly repository: CustomerJourneyRepository,
    engine?: CustomerJourneyIntelligenceEngine,
  ) {
    this.engine = engine ?? new CustomerJourneyIntelligenceEngine(repository);
  }

  generateCustomerJourney = generateCustomerJourney;
  scoring = customerJourneyIntelligenceScoring;

  generateJourney(input: CustomerJourneyInput) {
    return this.engine.generateJourney(input);
  }

  async persistJourney(
    workspaceId: string,
    input: CustomerJourneyInput,
  ): Promise<CustomerJourneyRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getJourneyRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<CustomerJourneyRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getJourneyByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<CustomerJourneyRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listJourneyRecords(
    workspaceId: string,
    filters: Omit<CustomerJourneyRepositoryQuery, "workspaceId"> = {},
  ): Promise<CustomerJourneyRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a customer journey intelligence module. */
export function createCustomerJourneyIntelligenceModule(
  repository: CustomerJourneyRepository = createInMemoryCustomerJourneyRepository(),
  engine?: CustomerJourneyIntelligenceEngine,
): CustomerJourneyIntelligenceModule {
  return new CustomerJourneyIntelligenceModule(
    repository,
    engine ?? new CustomerJourneyIntelligenceEngine(repository),
  );
}

export const customerJourneyIntelligenceModule = createCustomerJourneyIntelligenceModule();

export type {
  CustomerJourneyInput,
  CustomerJourneyBrandInput,
  CustomerJourneyOfferInput,
};

export { defaultCustomerJourneyIntelligenceEngine };
