/** T1-03 — Component type classification. */

import type { UiStateModel } from "../ui-state-mapper/types.js";
import type { ComponentRecognitionConfiguration } from "./configuration.js";
import { classifyRegion } from "./component-type-rules.js";
import {
  buildStableComponentId,
  buildComponentLabel,
} from "./component-identity-manager.js";
import type { UiComponent } from "./types.js";

export class ComponentClassifier {
  classifyFromUiState(
    uiState: UiStateModel,
    config: ComponentRecognitionConfiguration,
  ): UiComponent[] {
    const viewport = uiState.screen.viewport;
    const components: UiComponent[] = [];
    const timestamp = new Date().toISOString();

    for (const region of uiState.screen.regions) {
      if (region.regionId === uiState.screen.screenId) continue;

      const { componentType, confidence } = classifyRegion(
        region,
        viewport,
        config.componentTypeRules,
      );

      if (confidence < config.confidenceThreshold) continue;

      const componentId = buildStableComponentId(
        region.regionId,
        region.contentSignature,
        componentType,
      );

      const parentRegionId = region.parentRegionId;
      const parentComponent = parentRegionId
        ? components.find((c) => c.sourceRegionId === parentRegionId)
        : null;

      components.push({
        componentId,
        componentType,
        label: buildComponentLabel(componentType, region.regionId),
        parentComponentId: parentComponent?.componentId ?? null,
        childComponentIds: [],
        bounds: { ...region.bounds },
        position: { x: region.bounds.x, y: region.bounds.y },
        size: { width: region.bounds.width, height: region.bounds.height },
        visibility: region.visibility === "hidden" ? "hidden" : "visible",
        enabled: region.visibility !== "hidden",
        selected: false,
        active: false,
        sourceStateId: uiState.metadata.stateId,
        sourceRegionId: region.regionId,
        detectionConfidence: confidence,
        timestamp,
        metadataVersion: uiState.metadata.version,
      });
    }

    for (const component of components) {
      component.childComponentIds = components
        .filter((c) => c.parentComponentId === component.componentId)
        .map((c) => c.componentId);
    }

    return components;
  }
}
