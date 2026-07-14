/** T2-03 — Preference metadata generation. */

import { PREFERENCE_METADATA_VERSION } from "./paths.js";
import type { ExecutiveStyleModel, PreferenceRecord } from "./types.js";

export class PreferenceMetadataGenerator {
  buildExecutiveStyleId(): string {
    return `esl-style-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildPreferenceId(category: string, value: string): string {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24);
    return `pref-${category}-${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  enrichPreference(record: PreferenceRecord): PreferenceRecord {
    return {
      ...record,
      metadataVersion: PREFERENCE_METADATA_VERSION,
      version: record.version || "1.0.0",
    };
  }

  bumpVersion(current: string): string {
    const parts = current.split(".").map((p) => Number.parseInt(p, 10));
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return "1.0.0";
    parts[2] = (parts[2] ?? 0) + 1;
    return parts.join(".");
  }

  validateModel(model: ExecutiveStyleModel): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!model.executiveStyleId) errors.push("Missing executiveStyleId");
    if (!model.preferenceModelVersion) errors.push("Missing preferenceModelVersion");
    if (!model.metadataVersion) errors.push("Missing metadataVersion");
    return { valid: errors.length === 0, errors };
  }
}
