/** X4-03 — Regional Adaptation Engine. */

import type { LocalizationEngineConfiguration } from "./configuration.js";
import {
  buildLocalizationRecord,
  computeStructuralLocalizationSignals,
} from "./structural-signals.js";
import type { LocalizationInput, LocalizationRecord } from "./types.js";

export class RegionalAdaptationEngine {
  adapt(
    input: LocalizationInput,
    config: LocalizationEngineConfiguration,
  ): LocalizationRecord {
    const signals = computeStructuralLocalizationSignals(input, config);
    return buildLocalizationRecord({
      ...signals,
      adaptationSummary: `Regional adaptation for ${signals.targetCountry}/${signals.targetRegion} (${signals.localizationCategory}) — readiness=${signals.readinessScore}; canonical source preserved`,
    });
  }

  detectGaps(records: LocalizationRecord[]): LocalizationRecord[] {
    return records
      .filter((r) => r.gapScore >= 35 || r.readinessScore < 60)
      .map((r) => ({
        ...r,
        adaptationSummary: `Gap detected: ${r.localizationCategory} in ${r.targetCountry} — gap=${r.gapScore}, readiness=${r.readinessScore}`,
      }));
  }
}
