/**
 * Mobile Messaging Intelligence module — SMS/push blueprints without auto-send.
 */

import {
  MobileMessagingIntelligenceEngine,
  defaultMobileMessagingIntelligenceEngine,
  type MobileMessagingInput,
} from "../engines/mobile-messaging-intelligence-engine.js";
import type { MobileMessagingRecord } from "../models/mobile-messaging-record.js";
import {
  generateMobileMessagingBlueprint,
  mobileMessagingIntelligenceScoring,
  type MobileMessagingBrandInput,
  type MobileMessagingOfferInput,
} from "../scoring/mobile-messaging-intelligence-scoring.js";
import type {
  MobileMessagingRepository,
  MobileMessagingRepositoryQuery,
} from "../repositories/mobile-messaging-repository.js";
import { createInMemoryMobileMessagingRepository } from "../repositories/in-memory-mobile-messaging-repository.js";

export const MOBILE_MESSAGING_INTELLIGENCE_MODULE_ID = "mobile-messaging-intelligence" as const;
export type MobileMessagingIntelligenceModuleId = typeof MOBILE_MESSAGING_INTELLIGENCE_MODULE_ID;

export const MOBILE_MESSAGING_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type MobileMessagingIntelligenceCapability =
  | "mobile-messaging-intelligence.generate"
  | "mobile-messaging-intelligence.score"
  | "mobile-messaging-intelligence.persist"
  | "mobile-messaging-intelligence.list";

export const MOBILE_MESSAGING_INTELLIGENCE_CAPABILITIES: readonly MobileMessagingIntelligenceCapability[] =
  [
    "mobile-messaging-intelligence.generate",
    "mobile-messaging-intelligence.score",
    "mobile-messaging-intelligence.persist",
    "mobile-messaging-intelligence.list",
  ] as const;

export type MobileMessagingIntelligenceModuleContract = {
  moduleId: MobileMessagingIntelligenceModuleId;
  version: string;
  capabilities: readonly MobileMessagingIntelligenceCapability[];
};

export const MOBILE_MESSAGING_INTELLIGENCE_MODULE_CONTRACT: MobileMessagingIntelligenceModuleContract =
  {
    moduleId: MOBILE_MESSAGING_INTELLIGENCE_MODULE_ID,
    version: MOBILE_MESSAGING_INTELLIGENCE_MODULE_VERSION,
    capabilities: MOBILE_MESSAGING_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates mobile messaging blueprint generation and persistence. */
export class MobileMessagingIntelligenceModule {
  readonly contract = MOBILE_MESSAGING_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: MobileMessagingIntelligenceEngine;

  constructor(
    private readonly repository: MobileMessagingRepository,
    engine?: MobileMessagingIntelligenceEngine,
  ) {
    this.engine = engine ?? new MobileMessagingIntelligenceEngine(repository);
  }

  generateMobileMessagingBlueprint = generateMobileMessagingBlueprint;
  scoring = mobileMessagingIntelligenceScoring;

  generateBlueprint(input: MobileMessagingInput) {
    return this.engine.generateBlueprint(input);
  }

  async persistBlueprint(
    workspaceId: string,
    input: MobileMessagingInput,
  ): Promise<MobileMessagingRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getBlueprintRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<MobileMessagingRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getBlueprintByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<MobileMessagingRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listBlueprintRecords(
    workspaceId: string,
    filters: Omit<MobileMessagingRepositoryQuery, "workspaceId"> = {},
  ): Promise<MobileMessagingRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a mobile messaging intelligence module. */
export function createMobileMessagingIntelligenceModule(
  repository: MobileMessagingRepository = createInMemoryMobileMessagingRepository(),
  engine?: MobileMessagingIntelligenceEngine,
): MobileMessagingIntelligenceModule {
  return new MobileMessagingIntelligenceModule(
    repository,
    engine ?? new MobileMessagingIntelligenceEngine(repository),
  );
}

export const mobileMessagingIntelligenceModule = createMobileMessagingIntelligenceModule();

export type {
  MobileMessagingInput,
  MobileMessagingBrandInput,
  MobileMessagingOfferInput,
};

export { defaultMobileMessagingIntelligenceEngine };
