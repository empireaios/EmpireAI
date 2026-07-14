/** T1-06 — Interaction event normalization. */

import type { InteractionTrackingConfiguration } from "./configuration.js";
import { maskValue } from "./sensitive-field-rules.js";
import type { InteractionEvent, InteractionType, RawInteractionInput } from "./types.js";
import { INTERACTION_EVENT_VERSION } from "./paths.js";

export function buildEventId(sessionId: string, sequence: number): string {
  return `int-evt-${sessionId}-${sequence}`;
}

export function normalizeRawInteraction(input: {
  raw: RawInteractionInput;
  sessionId: string;
  sequence: number;
  currentScreenId: string | null;
  currentRouteId: string | null;
  sourceComponentId: string | null;
  sourceLayoutRegionId: string | null;
  sourceNavigationNodeId: string | null;
  destinationNavigationNodeId: string | null;
  triggeredNavigationEdgeId: string | null;
  confidence: number;
  config: InteractionTrackingConfiguration;
}): InteractionEvent {
  const prevMasked = maskValue(input.raw.previousValue, input.raw.inputFieldId, input.config);
  const newMasked = maskValue(input.raw.newValue, input.raw.inputFieldId, input.config);

  return {
    eventId: buildEventId(input.sessionId, input.sequence),
    sessionId: input.sessionId,
    timestamp: input.raw.timestamp ?? new Date().toISOString(),
    interactionType: input.raw.interactionType,
    sourceComponentId: input.raw.componentId ?? input.sourceComponentId,
    sourceLayoutRegionId: input.raw.layoutRegionId ?? input.sourceLayoutRegionId,
    sourceNavigationNodeId: input.raw.navigationNodeId ?? input.sourceNavigationNodeId,
    destinationNavigationNodeId:
      input.raw.destinationNavigationNodeId ?? input.destinationNavigationNodeId,
    triggeredNavigationEdgeId: input.raw.navigationEdgeId ?? input.triggeredNavigationEdgeId,
    pointerPosition:
      input.raw.pointerX !== undefined && input.raw.pointerY !== undefined
        ? { x: input.raw.pointerX, y: input.raw.pointerY }
        : null,
    keyboardKey: input.raw.keyboardKey ?? null,
    inputFieldId: input.raw.inputFieldId ?? null,
    inputChange:
      input.raw.inputFieldId && input.config.captureInputChanges
        ? {
            fieldId: input.raw.inputFieldId,
            masked: prevMasked.masked || newMasked.masked,
            valueLength: input.raw.newValue?.length ?? null,
          }
        : null,
    scroll:
      input.raw.scrollDirection && input.raw.scrollDistance !== undefined
        ? { direction: input.raw.scrollDirection, distance: input.raw.scrollDistance }
        : null,
    previousValue: prevMasked.value,
    newValue: newMasked.value,
    currentScreenId: input.currentScreenId,
    currentRouteId: input.currentRouteId,
    confidence: input.confidence,
    metadataVersion: INTERACTION_EVENT_VERSION,
  };
}

export function inferInteractionTypeFromComponent(
  componentType: string,
  rules: InteractionTrackingConfiguration["componentMappingRules"],
): { interactionType: InteractionType; confidence: number } | null {
  const rule = rules.find((r) => r.componentType === componentType);
  if (!rule) return null;
  return {
    interactionType: rule.interactionType as InteractionType,
    confidence: rule.baseConfidence,
  };
}
