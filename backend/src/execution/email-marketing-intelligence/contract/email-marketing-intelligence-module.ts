/**
 * Email Marketing Intelligence module — email flow blueprints without auto-send.
 */

import {
  EmailMarketingIntelligenceEngine,
  defaultEmailMarketingIntelligenceEngine,
  type EmailMarketingInput,
} from "../engines/email-marketing-intelligence-engine.js";
import type { EmailMarketingRecord } from "../models/email-marketing-record.js";
import {
  generateEmailMarketingBlueprint,
  emailMarketingIntelligenceScoring,
  type EmailMarketingBrandInput,
  type EmailMarketingOfferInput,
} from "../scoring/email-marketing-intelligence-scoring.js";
import type {
  EmailMarketingRepository,
  EmailMarketingRepositoryQuery,
} from "../repositories/email-marketing-repository.js";
import { createInMemoryEmailMarketingRepository } from "../repositories/in-memory-email-marketing-repository.js";

export const EMAIL_MARKETING_INTELLIGENCE_MODULE_ID = "email-marketing-intelligence" as const;
export type EmailMarketingIntelligenceModuleId = typeof EMAIL_MARKETING_INTELLIGENCE_MODULE_ID;

export const EMAIL_MARKETING_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type EmailMarketingIntelligenceCapability =
  | "email-marketing-intelligence.generate"
  | "email-marketing-intelligence.score"
  | "email-marketing-intelligence.persist"
  | "email-marketing-intelligence.list";

export const EMAIL_MARKETING_INTELLIGENCE_CAPABILITIES: readonly EmailMarketingIntelligenceCapability[] =
  [
    "email-marketing-intelligence.generate",
    "email-marketing-intelligence.score",
    "email-marketing-intelligence.persist",
    "email-marketing-intelligence.list",
  ] as const;

export type EmailMarketingIntelligenceModuleContract = {
  moduleId: EmailMarketingIntelligenceModuleId;
  version: string;
  capabilities: readonly EmailMarketingIntelligenceCapability[];
};

export const EMAIL_MARKETING_INTELLIGENCE_MODULE_CONTRACT: EmailMarketingIntelligenceModuleContract =
  {
    moduleId: EMAIL_MARKETING_INTELLIGENCE_MODULE_ID,
    version: EMAIL_MARKETING_INTELLIGENCE_MODULE_VERSION,
    capabilities: EMAIL_MARKETING_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates email marketing blueprint generation and persistence. */
export class EmailMarketingIntelligenceModule {
  readonly contract = EMAIL_MARKETING_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: EmailMarketingIntelligenceEngine;

  constructor(
    private readonly repository: EmailMarketingRepository,
    engine?: EmailMarketingIntelligenceEngine,
  ) {
    this.engine = engine ?? new EmailMarketingIntelligenceEngine(repository);
  }

  generateEmailMarketingBlueprint = generateEmailMarketingBlueprint;
  scoring = emailMarketingIntelligenceScoring;

  generateBlueprint(input: EmailMarketingInput) {
    return this.engine.generateBlueprint(input);
  }

  async persistBlueprint(
    workspaceId: string,
    input: EmailMarketingInput,
  ): Promise<EmailMarketingRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getBlueprintRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<EmailMarketingRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getBlueprintByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<EmailMarketingRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listBlueprintRecords(
    workspaceId: string,
    filters: Omit<EmailMarketingRepositoryQuery, "workspaceId"> = {},
  ): Promise<EmailMarketingRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for an email marketing intelligence module. */
export function createEmailMarketingIntelligenceModule(
  repository: EmailMarketingRepository = createInMemoryEmailMarketingRepository(),
  engine?: EmailMarketingIntelligenceEngine,
): EmailMarketingIntelligenceModule {
  return new EmailMarketingIntelligenceModule(
    repository,
    engine ?? new EmailMarketingIntelligenceEngine(repository),
  );
}

export const emailMarketingIntelligenceModule = createEmailMarketingIntelligenceModule();

export type {
  EmailMarketingInput,
  EmailMarketingBrandInput,
  EmailMarketingOfferInput,
};

export { defaultEmailMarketingIntelligenceEngine };
