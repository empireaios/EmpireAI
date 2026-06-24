import type { BuyerPersonaProfile } from "../../buyer-intelligence/persona-intelligence/contracts/buyer-persona-profile.js";
import type { ReachabilityProfileCreateInput } from "../models/reachability-profile.js";
import {
  scoreBuyerReachability,
  type ReachabilityScoreBreakdown,
} from "../scoring/reachability-scoring.js";

/** Maps M023 buyer personas to reachability profile payloads. */
export class ReachabilityMapper {
  mapPersonaToProfileInput(persona: BuyerPersonaProfile): ReachabilityProfileCreateInput {
    const breakdown = this.score(persona);
    return {
      buyerPersonaId: persona.personaId,
      dimensions: breakdown.dimensions,
      channels: breakdown.channels,
      topChannels: breakdown.topChannels,
      confidence: breakdown.confidence,
      signals: breakdown.signals,
    };
  }

  score(persona: BuyerPersonaProfile): ReachabilityScoreBreakdown {
    return scoreBuyerReachability(persona);
  }
}

export const defaultReachabilityMapper = new ReachabilityMapper();
