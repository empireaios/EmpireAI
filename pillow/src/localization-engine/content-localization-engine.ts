/** X4-03 — Content Localization Engine (services, storefronts, marketing, CX). */

import type { LocalizationEngineConfiguration } from "./configuration.js";
import {
  buildLocalizationRecord,
  computeStructuralLocalizationSignals,
} from "./structural-signals.js";
import type {
  LocalizationCategory,
  LocalizationInput,
  LocalizationRecord,
} from "./types.js";

export class ContentLocalizationEngine {
  localize(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
    category: LocalizationCategory,
  ): LocalizationRecord {
    const signals = computeStructuralLocalizationSignals(
      { ...input, localizationCategory: category },
      config,
    );
    return buildLocalizationRecord(signals);
  }
}
