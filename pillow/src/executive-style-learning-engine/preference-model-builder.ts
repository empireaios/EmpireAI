/** T2-03 — Executive preference model builder. */

import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import { PreferenceMetadataGenerator } from "./preference-metadata-generator.js";
import { PREFERENCE_METADATA_VERSION } from "./paths.js";
import type { ExecutiveStyleModel, PreferenceCategory, PreferenceRecord } from "./types.js";

const CATEGORY_FIELD_MAP: Record<
  PreferenceCategory,
  keyof Pick<
    ExecutiveStyleModel,
    | "preferredLayoutStyles"
    | "preferredComponentStyles"
    | "preferredTypography"
    | "preferredColorPreferences"
    | "preferredSpacingPreferences"
    | "preferredSizingPreferences"
    | "preferredNavigationStyles"
    | "preferredDashboardOrganization"
    | "preferredInteractionStyles"
    | "preferredConsistencyRules"
  >
> = {
  layout: "preferredLayoutStyles",
  component: "preferredComponentStyles",
  typography: "preferredTypography",
  color: "preferredColorPreferences",
  spacing: "preferredSpacingPreferences",
  sizing: "preferredSizingPreferences",
  navigation: "preferredNavigationStyles",
  dashboard: "preferredDashboardOrganization",
  form: "preferredComponentStyles",
  table: "preferredComponentStyles",
  chart: "preferredComponentStyles",
  card: "preferredComponentStyles",
  modal: "preferredComponentStyles",
  interaction: "preferredInteractionStyles",
  visual_density: "preferredLayoutStyles",
  consistency: "preferredConsistencyRules",
};

export class PreferenceModelBuilder {
  private readonly metadata = new PreferenceMetadataGenerator();

  build(input: {
    preferences: PreferenceRecord[];
    designSystem: DesignSystemModel | null;
    modelVersion: string;
  }): ExecutiveStyleModel {
    const active = input.preferences.filter((p) => p.currentStatus === "active");
    const model: ExecutiveStyleModel = {
      executiveStyleId: this.metadata.buildExecutiveStyleId(),
      preferenceModelVersion: input.modelVersion,
      learningTimestamp: new Date().toISOString(),
      preferredLayoutStyles: [],
      preferredComponentStyles: [],
      preferredTypography: [],
      preferredColorPreferences: [],
      preferredSpacingPreferences: [],
      preferredSizingPreferences: [],
      preferredNavigationStyles: [],
      preferredDashboardOrganization: [],
      preferredInteractionStyles: [],
      preferredVisualDensity: "balanced",
      preferredConsistencyRules: [],
      confidenceScore: 0,
      metadataVersion: PREFERENCE_METADATA_VERSION,
    };

    for (const pref of active) {
      const field = CATEGORY_FIELD_MAP[pref.preferenceCategory];
      if (field && !model[field].includes(pref.preferenceValue)) {
        model[field].push(pref.preferenceValue);
      }
    }

    if (input.designSystem) {
      for (const t of input.designSystem.typographyStandards.slice(0, 2)) {
        if (!model.preferredTypography.includes(t.name)) {
          model.preferredTypography.push(t.name);
        }
      }
      for (const c of input.designSystem.colorPalette.slice(0, 3)) {
        if (!model.preferredColorPreferences.includes(c.name)) {
          model.preferredColorPreferences.push(c.name);
        }
      }
      for (const s of input.designSystem.spacingScale.slice(0, 3)) {
        if (!model.preferredSpacingPreferences.includes(s.name)) {
          model.preferredSpacingPreferences.push(s.name);
        }
      }
    }

    if (active.length === 0 && input.designSystem) {
      model.preferredVisualDensity = "balanced";
      model.preferredLayoutStyles.push("structured-regions");
      model.preferredComponentStyles.push(...input.designSystem.componentFamilies.map((f) => f.familyName));
    }

    const densityPref = active.find((p) => p.preferenceCategory === "visual_density");
    if (densityPref) model.preferredVisualDensity = densityPref.preferenceValue;

    model.confidenceScore =
      active.length > 0
        ? Math.round(
            (active.reduce((sum, p) => sum + p.learningConfidence, 0) / active.length) * 100,
          )
        : input.designSystem
          ? 50
          : 0;

    return model;
  }
}
