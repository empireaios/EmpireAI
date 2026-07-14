/** T1-08 — Component history store. */

import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import { sanitizeLabel } from "./sensitive-content-sanitizer.js";
import type { VisualMemoryConfiguration } from "./configuration.js";

export class ComponentHistoryStore {
  extractSafe(result: ComponentRecognitionResult, config: VisualMemoryConfiguration) {
    let maskedCount = 0;
    const components = result.components.map((c) => {
      const label = sanitizeLabel(c.label, c.componentId, config);
      if (label.masked) maskedCount += 1;
      return {
        componentId: c.componentId,
        componentType: c.componentType,
        label: label.label,
        visibility: c.visibility,
        active: c.active,
        detectionConfidence: c.detectionConfidence,
      };
    });
    return {
      recognitionId: result.metadata.recognitionId,
      componentCount: components.length,
      components,
      changeSummary: result.changeSummary,
      maskedCount,
    };
  }
}
