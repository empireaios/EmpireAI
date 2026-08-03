/** X4-03 — Product Localization Engine. */

import type { LocalizationEngineConfiguration } from "./configuration.js";
import {
  buildLocalizationRecord,
  computeStructuralLocalizationSignals,
} from "./structural-signals.js";
import type { LocalizationInput, LocalizationRecord } from "./types.js";

export class ProductLocalizationEngine {
  localize(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocalizationRecord {
    const signals = computeStructuralLocalizationSignals(
      { ...input, localizationCategory: "product" },
      config,
    );
    return buildLocalizationRecord(signals);
  }
}
