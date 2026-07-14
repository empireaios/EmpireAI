/** T1-04 — Layout model validation. */

import { appendLayoutLog } from "./layout-logging.js";
import type { LayoutModel } from "./types.js";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export class LayoutValidator {
  validate(model: LayoutModel): ValidationResult {
    const errors: string[] = [];

    if (!model.metadata.layoutId) errors.push("Missing layoutId");
    if (!model.metadata.sourceStateId) errors.push("Missing sourceStateId");
    if (model.regions.length < 1) errors.push("No structural regions detected");

    for (const region of model.regions) {
      if (!region.regionId) errors.push("Region missing regionId");
      if (region.bounds.width < 0 || region.bounds.height < 0) {
        errors.push(`Region ${region.regionId} has invalid bounds`);
      }
    }

    for (const [componentId, regionId] of Object.entries(model.componentToRegion)) {
      if (!model.regions.some((r) => r.regionId === regionId)) {
        errors.push(`Component ${componentId} assigned to unknown region ${regionId}`);
      }
    }

    const valid = errors.length === 0;
    appendLayoutLog({
      event: "layout_validation",
      level: valid ? "info" : "warn",
      details: valid
        ? `Layout ${model.metadata.layoutId} validated · ${model.regions.length} regions`
        : errors.join("; "),
    });

    return { valid, errors };
  }
}
