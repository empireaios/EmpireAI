import { randomUUID } from "node:crypto";

import type { UniversalEventEnvelope, UniversalEventType } from "../models/universal-event.js";
import { UniversalEventEnvelopeSchema } from "../models/universal-event.js";
import { getCommerceRuntimeRepository } from "../repositories/sqlite-commerce-runtime-repository.js";

type EventSubscriber = (event: UniversalEventEnvelope) => void;

const subscribers = new Map<UniversalEventType | "*", Set<EventSubscriber>>();

export function subscribeRuntimeEvents(
  eventType: UniversalEventType | "*",
  handler: EventSubscriber,
): () => void {
  const set = subscribers.get(eventType) ?? new Set();
  set.add(handler);
  subscribers.set(eventType, set);
  return () => set.delete(handler);
}

function fanOut(event: UniversalEventEnvelope): void {
  const specific = subscribers.get(event.eventType);
  const wildcard = subscribers.get("*");
  for (const handler of specific ?? []) handler(event);
  for (const handler of wildcard ?? []) handler(event);
}

export function publishRuntimeEvent(input: {
  eventType: UniversalEventType;
  workspaceId: string;
  companyId: string;
  adapterId: string;
  entityRefs?: Array<{ type: string; id: string }>;
  payload?: Record<string, unknown>;
  verification?: "REAL" | "SIMULATED";
  correlationId?: string;
  providerEventId?: string;
}): UniversalEventEnvelope {
  const now = new Date().toISOString();
  const event = UniversalEventEnvelopeSchema.parse({
    eventId: randomUUID(),
    eventType: input.eventType,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    source: { adapterId: input.adapterId, providerEventId: input.providerEventId },
    entityRefs: input.entityRefs ?? [],
    payload: input.payload ?? {},
    occurredAt: now,
    recordedAt: now,
    verification: input.verification ?? "SIMULATED",
    correlationId: input.correlationId,
    lifecycle: "RECEIVED",
  });

  getCommerceRuntimeRepository().saveEvent(event);
  fanOut(event);

  const verified = { ...event, lifecycle: "VERIFIED" as const };
  getCommerceRuntimeRepository().updateEventLifecycle(verified.eventId, "VERIFIED");

  const processed = { ...verified, lifecycle: "PROCESSED" as const };
  getCommerceRuntimeRepository().updateEventLifecycle(processed.eventId, "PROCESSED");
  fanOut(processed);

  return processed;
}

export function listRuntimeEvents(workspaceId: string, companyId: string, limit = 50): UniversalEventEnvelope[] {
  return getCommerceRuntimeRepository().listEvents(workspaceId, companyId, limit);
}

export function getRuntimeEventStats(workspaceId: string, companyId: string): {
  received: number;
  processed: number;
  deadLetter: number;
} {
  return getCommerceRuntimeRepository().eventStats(workspaceId, companyId);
}
