/**
 * Buyer Reachability module contract — determines where buyer personas spend attention.
 */

import type { BuyerPersonaProfile } from "../../buyer-intelligence/persona-intelligence/contracts/buyer-persona-profile.js";
import {
  ReachabilityMapper,
  defaultReachabilityMapper,
} from "../mappers/reachability-mapper.js";
import type { ReachabilityProfile } from "../models/reachability-profile.js";
import type { ReachabilityRepository } from "../repositories/reachability-repository.js";
import { createInMemoryReachabilityRepository } from "../repositories/in-memory-reachability-repository.js";

export const REACHABILITY_MODULE_ID = "buyer-reachability" as const;
export type ReachabilityModuleId = typeof REACHABILITY_MODULE_ID;

export const REACHABILITY_MODULE_VERSION = "0.1.0" as const;

export type ReachabilityCapability =
  | "buyer-reachability.profile.map"
  | "buyer-reachability.profile.score"
  | "buyer-reachability.profile.persist"
  | "buyer-reachability.profile.list"
  | "buyer-reachability.channels.rank";

export const REACHABILITY_CAPABILITIES: readonly ReachabilityCapability[] = [
  "buyer-reachability.profile.map",
  "buyer-reachability.profile.score",
  "buyer-reachability.profile.persist",
  "buyer-reachability.profile.list",
  "buyer-reachability.channels.rank",
] as const;

export type ReachabilityModuleContract = {
  moduleId: ReachabilityModuleId;
  version: string;
  capabilities: readonly ReachabilityCapability[];
};

export const REACHABILITY_MODULE_CONTRACT: ReachabilityModuleContract = {
  moduleId: REACHABILITY_MODULE_ID,
  version: REACHABILITY_MODULE_VERSION,
  capabilities: REACHABILITY_CAPABILITIES,
};

/** Orchestrates buyer reachability mapping, scoring, and persistence. */
export class ReachabilityModule {
  readonly contract = REACHABILITY_MODULE_CONTRACT;

  constructor(
    private readonly repository: ReachabilityRepository,
    private readonly mapper: ReachabilityMapper = defaultReachabilityMapper,
  ) {}

  scoreProfile(persona: BuyerPersonaProfile) {
    return this.mapper.score(persona);
  }

  mapProfile(persona: BuyerPersonaProfile) {
    return this.mapper.mapPersonaToProfileInput(persona);
  }

  rankChannels(persona: BuyerPersonaProfile) {
    return this.mapper.score(persona).channels;
  }

  async persistProfile(
    workspaceId: string,
    persona: BuyerPersonaProfile,
  ): Promise<ReachabilityProfile> {
    const input = this.mapper.mapPersonaToProfileInput(persona);
    const existing = await this.repository.getByPersonaId(workspaceId, persona.personaId);

    if (existing) {
      return this.repository.update(workspaceId, existing.id, input);
    }

    return this.repository.create(workspaceId, input);
  }

  async listProfiles(
    workspaceId: string,
    filters: { buyerPersonaId?: string; minConfidence?: number } = {},
  ): Promise<ReachabilityProfile[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a reachability module with optional custom dependencies. */
export function createReachabilityModule(
  repository: ReachabilityRepository = createInMemoryReachabilityRepository(),
  mapper: ReachabilityMapper = defaultReachabilityMapper,
): ReachabilityModule {
  return new ReachabilityModule(repository, mapper);
}

export const reachabilityModule = createReachabilityModule();
