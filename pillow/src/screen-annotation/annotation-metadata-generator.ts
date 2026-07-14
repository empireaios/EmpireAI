/** T4-03 — Annotation metadata and ID generation. */

import type { PointAndEditIntent, ScreenAnnotationRecord } from "./types.js";
import { ANNOTATION_METADATA_VERSION } from "./paths.js";

export class AnnotationMetadataGenerator {
  buildAnnotationId(): string {
    return `sa-ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildIntentId(): string {
    return `sa-intent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildSessionId(): string {
    return `sa-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRunReportId(): string {
    return `sa-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `sa-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichAnnotation(record: ScreenAnnotationRecord): ScreenAnnotationRecord {
    return { ...record, metadataVersion: ANNOTATION_METADATA_VERSION };
  }

  enrichIntent(intent: PointAndEditIntent): PointAndEditIntent {
    return { ...intent, metadataVersion: ANNOTATION_METADATA_VERSION };
  }
}
