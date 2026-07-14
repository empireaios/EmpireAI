/** T4-08 — Synthesizes collaboration preferences from category analyzers. */

import type { CollaborationPreferenceRecord, PreferenceCategory } from "./types.js";
import type { PreferenceLearningConfiguration } from "./configuration.js";

export class CollaborationPreferenceEngine {
  synthesize(input: {
    preferences: CollaborationPreferenceRecord[];
    config: PreferenceLearningConfiguration;
    requestedCategories?: PreferenceCategory[];
  }): CollaborationPreferenceRecord[] {
    let result = input.preferences.filter((p) =>
      input.config.supportedCategories.includes(p.preferenceCategory),
    );

    if (input.requestedCategories?.length) {
      const cats = new Set(input.requestedCategories);
      result = result.filter((p) => cats.has(p.preferenceCategory));
    }

    if (input.config.explicitEvidenceRulesEnabled) {
      result = result.filter(
        (p) =>
          p.explicitEvidenceReferences.length > 0 ||
          p.explicitEvidenceReferences.some((e) => e.strength === "explicit"),
      );
    }

    return result;
  }
}
