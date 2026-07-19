/** R4-16 — Customer Classification Engine. */

import type { CustomerSegmentationEngineConfiguration } from "./configuration.js";
import type { SegmentationClassification, CustomerSegmentSignals } from "./types.js";

export class CustomerClassificationEngine {
  applyClassificationRules(
    classification: SegmentationClassification,
    signals: CustomerSegmentSignals,
    config: CustomerSegmentationEngineConfiguration,
  ): SegmentationClassification {
    if (!config.classificationRulesEnabled) return classification;

    let customerValueTier = classification.customerValueTier;
    for (const rule of config.classificationRules) {
      if (!rule.enabled) continue;
      if (signals.lifetimeValue >= rule.threshold) {
        customerValueTier = rule.tierLabel as SegmentationClassification["customerValueTier"];
      }
    }

    return { ...classification, customerValueTier };
  }
}
