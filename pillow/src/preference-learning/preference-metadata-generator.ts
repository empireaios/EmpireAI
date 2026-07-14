/** T4-08 — Preference metadata and ID generation. */

import type { CollaborationPreferenceRecord } from "./types.js";
import { PREFERENCE_METADATA_VERSION } from "./paths.js";

export class PreferenceMetadataGenerator {
  buildPreferenceId(): string {
    return `pl-pref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildSessionId(): string {
    return `pl-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRunReportId(): string {
    return `pl-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `pl-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildEvidenceId(): string {
    return `pl-evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildPreferenceVersion(versionNumber: number): string {
    return `pl-v${versionNumber}.0.0`;
  }

  enrichPreference(record: CollaborationPreferenceRecord): CollaborationPreferenceRecord {
    return { ...record, metadataVersion: PREFERENCE_METADATA_VERSION };
  }
}
