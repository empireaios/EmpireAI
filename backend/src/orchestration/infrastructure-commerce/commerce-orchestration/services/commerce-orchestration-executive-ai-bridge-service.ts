/**
 * G2-08 — Executive AI operational state bridge (no executive reasoning).
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  EXECUTIVE_AI_STATE_CONSUMERS,
  type CommerceExecutiveAiStateEnvelope,
  type ExecutiveAiStateConsumer,
} from "../contracts/commerce-orchestration-types.js";
import { getOrchestrationStateSnapshot } from "../state/commerce-orchestration-state-manager.js";

export function listExecutiveAiStateConsumers(): readonly ExecutiveAiStateConsumer[] {
  return EXECUTIVE_AI_STATE_CONSUMERS;
}

export function exposeOperationalStateToExecutiveAi(input: {
  context: RegistryLoaderContext;
  consumerId: ExecutiveAiStateConsumer | string;
  profileId: string;
  orchestrationId: string;
}): CommerceExecutiveAiStateEnvelope | undefined {
  if (!EXECUTIVE_AI_STATE_CONSUMERS.includes(input.consumerId as ExecutiveAiStateConsumer)) {
    return undefined;
  }

  const state = getOrchestrationStateSnapshot(input.orchestrationId);
  if (!state) return undefined;

  return {
    consumerId: input.consumerId,
    profileId: input.profileId,
    orchestrationId: input.orchestrationId,
    executionState: state.executionState,
    operationalStateOnly: true,
    reasoningEmbedded: false,
    discoverySource: "CommerceOrchestrationCatalog:executive-state-bridge",
  };
}

export function exposeOperationalStateToAllExecutiveAiConsumers(input: {
  context: RegistryLoaderContext;
  profileId: string;
  orchestrationId: string;
}): CommerceExecutiveAiStateEnvelope[] {
  return EXECUTIVE_AI_STATE_CONSUMERS.flatMap((consumerId) => {
    const envelope = exposeOperationalStateToExecutiveAi({
      ...input,
      consumerId,
    });
    return envelope ? [envelope] : [];
  });
}
