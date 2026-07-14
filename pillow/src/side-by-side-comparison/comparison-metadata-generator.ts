/** T4-05 — Comparison metadata and ID generation. */

import type { SideBySideComparisonRecord } from "./types.js";
import { COMPARISON_METADATA_VERSION } from "./paths.js";

export class ComparisonMetadataGenerator {
  buildComparisonId(): string {
    return `sbc-cmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildSessionId(): string {
    return `sbc-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRunReportId(): string {
    return `sbc-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `sbc-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildMarkerId(): string {
    return `sbc-marker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildOptionId(index: number): string {
    return `sbc-opt-${index}-${Math.random().toString(36).slice(2, 6)}`;
  }

  enrichComparison(record: SideBySideComparisonRecord): SideBySideComparisonRecord {
    return { ...record, metadataVersion: COMPARISON_METADATA_VERSION };
  }
}
