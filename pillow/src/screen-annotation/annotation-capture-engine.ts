/** T4-03 — Annotation capture from Grand King input. */

import type { ScreenAnnotationConfiguration } from "./configuration.js";
import type { AnnotationInput, ScreenRegionBounds } from "./types.js";
import { appendAnnotationLog } from "./annotation-logging.js";
import type { PointerCaptureResult } from "./pointer-capture-engine.js";

export type AnnotationCaptureResult = {
  bounds: ScreenRegionBounds | null;
  annotationText: string | null;
  userInstructionSummary: string;
  valid: boolean;
  confidence: number;
};

export class AnnotationCaptureEngine {
  capture(input: {
    annotation: AnnotationInput;
    pointer: PointerCaptureResult;
    config: ScreenAnnotationConfiguration;
  }): AnnotationCaptureResult {
    appendAnnotationLog({
      event: "annotation_capture",
      level: "info",
      details: `Capturing ${input.annotation.annotationType}`,
    });

    if (!input.config.annotationCaptureRulesEnabled) {
      return {
        bounds: null,
        annotationText: null,
        userInstructionSummary: "Annotation capture disabled",
        valid: false,
        confidence: 0.3,
      };
    }

    let bounds = input.annotation.screenRegionBounds ?? null;
    const text = (input.annotation.annotationText ?? "").trim().slice(0, 2000) || null;

    if (!bounds && input.pointer.pointer) {
      const size =
        input.annotation.annotationType === "highlight" ? 48 : 24;
      bounds = {
        x: Math.max(0, input.pointer.pointer.x - size / 2),
        y: Math.max(0, input.pointer.pointer.y - size / 2),
        width: size,
        height: size,
      };
    }

    if (bounds) {
      bounds = {
        x: Math.max(0, bounds.x),
        y: Math.max(0, bounds.y),
        width: Math.max(1, bounds.width),
        height: Math.max(1, bounds.height),
      };
    }

    const summary = this.buildSummary(input.annotation.annotationType, text);
    const needsBounds =
      input.annotation.annotationType === "rectangle" ||
      input.annotation.annotationType === "region_selection" ||
      input.annotation.annotationType === "layout_region_selection";
    const needsPointer =
      input.annotation.annotationType === "point" ||
      input.annotation.annotationType === "highlight";

    let valid = true;
    let confidence = 0.85;
    if (needsBounds && !bounds) {
      valid = false;
      confidence = 0.25;
    }
    if (needsPointer && !input.pointer.valid) {
      valid = false;
      confidence = 0.2;
    }

    return { bounds, annotationText: text, userInstructionSummary: summary, valid, confidence };
  }

  private buildSummary(type: AnnotationInput["annotationType"], text: string | null): string {
    const base: Record<AnnotationInput["annotationType"], string> = {
      point: "Point annotation on visible UI area",
      highlight: "Highlight annotation on visible UI area",
      rectangle: "Rectangle selection on screen",
      region_selection: "Region selection on screen",
      component_selection: "Component selection annotation",
      layout_region_selection: "Layout region selection annotation",
      navigation_area_selection: "Navigation area selection annotation",
      text_note: "Text note annotation",
      ux_complaint_note: "UX complaint note on screen area",
      design_preference_note: "Design preference note on screen area",
      edit_instruction: "Edit instruction for screen area",
      review_request: "Review request for screen area",
      validation_request: "Validation request for screen area",
      preview_request: "Preview request for screen area",
    };
    if (text) return `${base[type]}: ${text.slice(0, 120)}`;
    return base[type];
  }
}
