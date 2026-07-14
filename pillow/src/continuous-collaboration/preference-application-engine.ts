/** T4-09 — Applies learned collaboration preferences (advisory only). */

import type { AppliedCollaborationPreference } from "./types.js";
import type { ContinuousCollaborationEngineBundle } from "./types.js";
import type { ContinuousCollaborationConfiguration } from "./configuration.js";
import { appendCollaborationLog } from "./collaboration-logging.js";

export class PreferenceApplicationEngine {
  apply(input: {
    engines: ContinuousCollaborationEngineBundle;
    config: ContinuousCollaborationConfiguration;
  }): AppliedCollaborationPreference[] {
    if (!input.config.preferenceApplicationRulesEnabled) return [];

    const applied: AppliedCollaborationPreference[] = [];

    try {
      const preferences =
        input.engines.preferenceLearning?.getLearnedPreferences?.() ?? [];
      for (const pref of preferences.slice(0, 10)) {
        if (pref.currentStatus === "deprecated" || pref.currentStatus === "failed") continue;
        applied.push({
          preferenceId: pref.preferenceId,
          preferenceCategory: pref.preferenceCategory,
          appliedSummary: pref.learnedBehaviorSummary,
          confidenceScore: pref.confidenceScore,
          explicitOverrideAllowed: true,
        });
      }
    } catch {
      appendCollaborationLog({
        event: "partial_collaboration_input",
        level: "warn",
        details: "Preference history unavailable",
      });
    }

    if (applied.length > 0) {
      appendCollaborationLog({
        event: "preference_application",
        level: "info",
        details: `Applied ${applied.length} collaboration preference(s) (advisory)`,
      });
    }
    return applied;
  }
}
