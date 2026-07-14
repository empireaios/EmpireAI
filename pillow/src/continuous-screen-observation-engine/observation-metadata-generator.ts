/** T5-01 — Machine-readable observation metadata generation. */

import { randomUUID } from "node:crypto";
import { OBSERVATION_METADATA_VERSION } from "./paths.js";
import type {
  DetectedChangeSet,
  ObservationRecord,
  ObservationStatus,
  UiSurfaceState,
} from "./types.js";

export class ObservationMetadataGenerator {
  buildRecord(input: {
    sessionId: string;
    currentScreenId: string | null;
    currentRouteOrViewId: string | null;
    sourceUiStateId: string | null;
    sourceComponentSetId: string | null;
    sourceLayoutId: string | null;
    sourceNavigationGraphId: string | null;
    changes: DetectedChangeSet;
    uiSurfaceStates: UiSurfaceState[];
    confidenceScore: number;
    observationStatus: ObservationStatus;
  }): ObservationRecord {
    return {
      observationId: randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: input.sessionId,
      currentScreenId: input.currentScreenId,
      currentRouteOrViewId: input.currentRouteOrViewId,
      sourceUiStateId: input.sourceUiStateId,
      sourceComponentSetId: input.sourceComponentSetId,
      sourceLayoutId: input.sourceLayoutId,
      sourceNavigationGraphId: input.sourceNavigationGraphId,
      detectedScreenChanges: input.changes.screenChanges,
      detectedComponentChanges: input.changes.componentChanges,
      detectedLayoutChanges: input.changes.layoutChanges,
      detectedStateChanges: [
        ...input.changes.stateChanges,
        ...input.changes.routeChanges.map((c) => `route:${c}`),
      ],
      observationStatus: input.observationStatus,
      confidenceScore: input.confidenceScore,
      metadataVersion: OBSERVATION_METADATA_VERSION,
      uiSurfaceStates: input.uiSurfaceStates,
      observeOnly: true,
    };
  }
}
