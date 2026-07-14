/** T1-02 — UI state model validation. */

import { appendMappingLog } from "./mapping-logging.js";
import type { UiStateModel } from "./types.js";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export class ValidationEngine {
  validate(model: UiStateModel): ValidationResult {
    const errors: string[] = [];

    if (!model.metadata.stateId) errors.push("Missing stateId");
    if (!model.metadata.sessionId) errors.push("Missing sessionId");
    if (!model.metadata.sourceFrameId) errors.push("Missing sourceFrameId");
    if (!model.metadata.version) errors.push("Missing version");
    if (model.metadata.viewport.width < 1 || model.metadata.viewport.height < 1) {
      errors.push("Invalid viewport dimensions");
    }
    if (model.screen.regions.length < 1) errors.push("No UI regions mapped");
    if (!model.serialized || model.serialized.length < 10) errors.push("Invalid serialization");

    for (const region of model.screen.regions) {
      if (!region.regionId) errors.push(`Region missing regionId`);
      if (region.bounds.width < 0 || region.bounds.height < 0) {
        errors.push(`Region ${region.regionId} has invalid bounds`);
      }
    }

    const childIds = new Set(model.screen.regions.map((r) => r.regionId));
    for (const region of model.screen.regions) {
      if (region.parentRegionId && !childIds.has(region.parentRegionId) && region.parentRegionId !== model.screen.screenId) {
        const rootExists = model.screen.hierarchy.some((h) => h.regionId === region.parentRegionId);
        if (!rootExists) errors.push(`Region ${region.regionId} has unknown parent ${region.parentRegionId}`);
      }
    }

    const valid = errors.length === 0;
    appendMappingLog({
      event: "state_validation",
      level: valid ? "info" : "warn",
      details: valid ? `State ${model.metadata.stateId} validated` : errors.join("; "),
    });

    return { valid, errors };
  }
}
