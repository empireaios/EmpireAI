/**

 * Domain Intelligence module — generates domain recommendations from brand inputs.

 */



import {

  DomainIntelligenceEngine,

  defaultDomainIntelligenceEngine,

  type DomainIntelligenceInput,

} from "../engines/domain-intelligence-engine.js";

import type { DomainRecommendation } from "../models/domain-recommendation.js";

import {

  domainIntelligenceScoring,

  scoreDomainIntelligence,

  type DomainIntelligenceBrandInput,

} from "../scoring/domain-intelligence-scoring.js";

import type {

  DomainIntelligenceRepository,

  DomainIntelligenceRepositoryQuery,

} from "../repositories/domain-intelligence-repository.js";

import { createInMemoryDomainIntelligenceRepository } from "../repositories/in-memory-domain-intelligence-repository.js";



export const DOMAIN_INTELLIGENCE_MODULE_ID = "domain-intelligence" as const;

export type DomainIntelligenceModuleId = typeof DOMAIN_INTELLIGENCE_MODULE_ID;



export const DOMAIN_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;



export type DomainIntelligenceCapability =

  | "domain-intelligence.generate"

  | "domain-intelligence.score"

  | "domain-intelligence.persist"

  | "domain-intelligence.list";



export const DOMAIN_INTELLIGENCE_CAPABILITIES: readonly DomainIntelligenceCapability[] = [

  "domain-intelligence.generate",

  "domain-intelligence.score",

  "domain-intelligence.persist",

  "domain-intelligence.list",

] as const;



export type DomainIntelligenceModuleContract = {

  moduleId: DomainIntelligenceModuleId;

  version: string;

  capabilities: readonly DomainIntelligenceCapability[];

};



export const DOMAIN_INTELLIGENCE_MODULE_CONTRACT: DomainIntelligenceModuleContract = {

  moduleId: DOMAIN_INTELLIGENCE_MODULE_ID,

  version: DOMAIN_INTELLIGENCE_MODULE_VERSION,

  capabilities: DOMAIN_INTELLIGENCE_CAPABILITIES,

};



/** Orchestrates domain recommendation generation and persistence. */

export class DomainIntelligenceModule {

  readonly contract = DOMAIN_INTELLIGENCE_MODULE_CONTRACT;

  private readonly engine: DomainIntelligenceEngine;



  constructor(

    private readonly repository: DomainIntelligenceRepository,

    engine?: DomainIntelligenceEngine,

  ) {

    this.engine = engine ?? new DomainIntelligenceEngine(repository);

  }



  scoreDomainIntelligence = scoreDomainIntelligence;

  scoring = domainIntelligenceScoring;



  generateDomainRecommendation(input: DomainIntelligenceInput) {

    return this.engine.generateDomainRecommendation(input);

  }



  async persistDomainRecommendation(

    workspaceId: string,

    input: DomainIntelligenceInput,

  ): Promise<DomainRecommendation> {

    return this.engine.generateAndSave(workspaceId, input);

  }



  async getDomainRecommendation(

    workspaceId: string,

    recommendationId: string,

  ): Promise<DomainRecommendation | null> {

    return this.repository.getById(workspaceId, recommendationId);

  }



  async getDomainRecommendationByBrand(

    workspaceId: string,

    brandId: string,

  ): Promise<DomainRecommendation | null> {

    return this.repository.getByBrand(workspaceId, brandId);

  }



  async listDomainRecommendations(

    workspaceId: string,

    filters: Omit<DomainIntelligenceRepositoryQuery, "workspaceId"> = {},

  ): Promise<DomainRecommendation[]> {

    return this.repository.list({ workspaceId, ...filters });

  }

}



/** Factory for a domain intelligence module with optional custom dependencies. */

export function createDomainIntelligenceModule(

  repository: DomainIntelligenceRepository = createInMemoryDomainIntelligenceRepository(),

  engine?: DomainIntelligenceEngine,

): DomainIntelligenceModule {

  return new DomainIntelligenceModule(

    repository,

    engine ?? new DomainIntelligenceEngine(repository),

  );

}



export const domainIntelligenceModule = createDomainIntelligenceModule();



export type { DomainIntelligenceInput, DomainIntelligenceBrandInput };



export { defaultDomainIntelligenceEngine };


