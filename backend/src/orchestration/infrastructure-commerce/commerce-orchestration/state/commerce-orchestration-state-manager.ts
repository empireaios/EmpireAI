/**
 * G2-08 — Cross-component orchestration state management.
 */

import type {
  CommerceOrchestrationLifecyclePhase,
  CommerceOrchestrationStateSnapshot,
  CommerceOrchestrationStatus,
  CommerceParticipatingComponent,
} from "../contracts/commerce-orchestration-types.js";

const lifecycleState = new Map<string, CommerceOrchestrationLifecyclePhase>();
const executionState = new Map<string, CommerceOrchestrationStatus>();
const stateSnapshots = new Map<string, CommerceOrchestrationStateSnapshot>();

function nowIso(): string {
  return new Date().toISOString();
}

export function initOrchestrationState(input: {
  orchestrationId: string;
  profileId: string;
  correlationId: string;
  participatingComponents: CommerceParticipatingComponent[];
}): CommerceOrchestrationStateSnapshot {
  lifecycleState.set(input.orchestrationId, "discover");
  executionState.set(input.orchestrationId, "draft");

  const snapshot: CommerceOrchestrationStateSnapshot = {
    orchestrationId: input.orchestrationId,
    profileId: input.profileId,
    executionState: "draft",
    lifecyclePhase: "discover",
    participatingComponents: input.participatingComponents,
    correlationId: input.correlationId,
    capturedAt: nowIso(),
  };
  stateSnapshots.set(input.orchestrationId, snapshot);
  return snapshot;
}

export function updateOrchestrationState(input: {
  orchestrationId: string;
  lifecyclePhase?: CommerceOrchestrationLifecyclePhase;
  executionState?: CommerceOrchestrationStatus;
}): CommerceOrchestrationStateSnapshot | undefined {
  const existing = stateSnapshots.get(input.orchestrationId);
  if (!existing) return undefined;

  if (input.lifecyclePhase) {
    lifecycleState.set(input.orchestrationId, input.lifecyclePhase);
  }
  if (input.executionState) {
    executionState.set(input.orchestrationId, input.executionState);
  }

  const updated: CommerceOrchestrationStateSnapshot = {
    ...existing,
    lifecyclePhase: lifecycleState.get(input.orchestrationId) ?? existing.lifecyclePhase,
    executionState: executionState.get(input.orchestrationId) ?? existing.executionState,
    capturedAt: nowIso(),
  };
  stateSnapshots.set(input.orchestrationId, updated);
  return updated;
}

export function getOrchestrationStateSnapshot(
  orchestrationId: string,
): CommerceOrchestrationStateSnapshot | undefined {
  return stateSnapshots.get(orchestrationId);
}

export function getOrchestrationLifecyclePhase(
  orchestrationId: string,
): CommerceOrchestrationLifecyclePhase {
  return lifecycleState.get(orchestrationId) ?? "discover";
}

export function resetCommerceOrchestrationStateForTests(): void {
  lifecycleState.clear();
  executionState.clear();
  stateSnapshots.clear();
}
