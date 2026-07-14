/** T4-03 — Pointer capture from Grand King input. */

import type { ScreenAnnotationConfiguration } from "./configuration.js";
import type { AnnotationInput, PointerCoordinates } from "./types.js";
import { appendAnnotationLog } from "./annotation-logging.js";

export type PointerCaptureResult = {
  pointer: PointerCoordinates | null;
  valid: boolean;
  confidence: number;
};

export class PointerCaptureEngine {
  capture(input: AnnotationInput, config: ScreenAnnotationConfiguration): PointerCaptureResult {
    appendAnnotationLog({
      event: "pointer_capture",
      level: "info",
      details: `type=${input.annotationType}`,
    });

    if (!config.pointerCaptureRulesEnabled) {
      return { pointer: null, valid: false, confidence: 0.3 };
    }

    const pointer = input.pointerCoordinates ?? null;
    if (!pointer) {
      if (
        input.annotationType === "point" ||
        input.annotationType === "highlight"
      ) {
        return { pointer: null, valid: false, confidence: 0.2 };
      }
      return { pointer: null, valid: true, confidence: 0.6 };
    }

    if (
      !Number.isFinite(pointer.x) ||
      !Number.isFinite(pointer.y) ||
      pointer.x < 0 ||
      pointer.y < 0
    ) {
      return { pointer: null, valid: false, confidence: 0.1 };
    }

    return {
      pointer: { x: Math.round(pointer.x), y: Math.round(pointer.y) },
      valid: true,
      confidence: 0.9,
    };
  }
}
