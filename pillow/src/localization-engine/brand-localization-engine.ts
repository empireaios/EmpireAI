/** X4-03 — Brand Localization Engine. */

import type { LocalizationEngineConfiguration } from "./configuration.js";
import {
  buildLocalizationRecord,
  computeStructuralLocalizationSignals,
} from "./structural-signals.js";
import type { LocalizationInput, LocalizationRecord } from "./types.js";

export class BrandLocalizationEngine {
  localize(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocalizationRecord {
    const signals = computeStructuralLocalizationSignals(
      { ...input, localizationCategory: "branding" },
      config,
    );
    return buildLocalizationRecord(signals);
  }
}
