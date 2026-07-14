/** T4-08 — Preference version management. */

import type { CollaborationPreferenceRecord } from "./types.js";
import type { PreferenceLearningConfiguration } from "./configuration.js";
import { PreferenceMetadataGenerator } from "./preference-metadata-generator.js";
import { appendPreferenceLog } from "./preference-logging.js";

export class PreferenceVersionManager {
  private readonly metadata = new PreferenceMetadataGenerator();
  private versionNumber = 1;
  private learned: CollaborationPreferenceRecord[] = [];

  getCurrentVersion(): string {
    return this.metadata.buildPreferenceVersion(this.versionNumber);
  }

  merge(input: {
    newPreferences: CollaborationPreferenceRecord[];
    config: PreferenceLearningConfiguration;
  }): {
    preferences: CollaborationPreferenceRecord[];
    updated: number;
    version: string;
  } {
    if (!input.config.versioningRulesEnabled) {
      this.learned.push(...input.newPreferences);
      return {
        preferences: [...this.learned],
        updated: input.newPreferences.length,
        version: this.getCurrentVersion(),
      };
    }

    let updated = 0;
    for (const pref of input.newPreferences) {
      const existingIdx = this.learned.findIndex(
        (p) =>
          p.preferenceCategory === pref.preferenceCategory &&
          p.currentStatus !== "deprecated",
      );
      if (existingIdx >= 0) {
        const existing = this.learned[existingIdx]!;
        if (pref.confidenceScore >= existing.confidenceScore) {
          this.learned[existingIdx] = {
            ...pref,
            preferenceVersion: this.getCurrentVersion(),
            currentStatus: "updated",
          };
          updated += 1;
          appendPreferenceLog({
            event: "preference_updates",
            level: "info",
            details: `Updated ${pref.preferenceCategory} preference`,
          });
        } else {
          this.learned[existingIdx] = {
            ...existing,
            currentStatus: "conflicted",
          };
        }
      } else {
        this.learned.push({
          ...pref,
          preferenceVersion: this.getCurrentVersion(),
          currentStatus: "learned",
        });
        updated += 1;
      }
    }

    if (updated > 0) {
      this.versionNumber += 1;
    }

    if (input.config.preferenceRetentionRulesEnabled) {
      this.learned = this.learned.slice(-input.config.maxHistoryPreferences);
    }

    return {
      preferences: [...this.learned],
      updated,
      version: this.getCurrentVersion(),
    };
  }

  getLearnedPreferences(): CollaborationPreferenceRecord[] {
    return [...this.learned];
  }

  resetForTesting(): void {
    this.versionNumber = 1;
    this.learned = [];
  }
}
