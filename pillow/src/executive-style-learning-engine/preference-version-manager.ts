/** T2-03 — Preference version management. */

import { PreferenceMetadataGenerator } from "./preference-metadata-generator.js";
import type { ExecutiveStyleModel } from "./types.js";

export class PreferenceVersionManager {
  private readonly metadata = new PreferenceMetadataGenerator();
  private currentVersion = "1.0.0";

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  bumpIfChanged(changed: boolean, enabled: boolean): string {
    if (!enabled || !changed) return this.currentVersion;
    this.currentVersion = this.metadata.bumpVersion(this.currentVersion);
    return this.currentVersion;
  }

  applyToModel(model: ExecutiveStyleModel, version: string): ExecutiveStyleModel {
    return { ...model, preferenceModelVersion: version };
  }

  reset(): void {
    this.currentVersion = "1.0.0";
  }
}
