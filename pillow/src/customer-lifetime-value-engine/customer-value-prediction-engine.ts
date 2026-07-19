/** R4-15 — Customer Value Prediction Engine. */

import type { CustomerLifetimeValueEngineConfiguration } from "./configuration.js";

export class CustomerValuePredictionEngine {
  predict(input: {
    lifetimeValue: number;
    averageOrderValue: number;
    purchaseFrequency: number;
    retentionScore: number;
    config: CustomerLifetimeValueEngineConfiguration;
  }): { predictedLifetimeValue: number } {
    if (!input.config.predictionRulesEnabled) {
      return { predictedLifetimeValue: input.lifetimeValue };
    }

    const rule =
      input.config.predictionRules.find((r) => r.enabled) ??
      input.config.predictionRules[0];
    const horizon = rule?.horizonMonths ?? input.config.predictionHorizonMonths;
    const multiplier = rule?.multiplier ?? 1;

    const monthlyValue =
      input.purchaseFrequency > 0
        ? (input.averageOrderValue * input.purchaseFrequency) / 12
        : input.averageOrderValue;
    const retentionFactor = input.retentionScore / 100;
    const predicted =
      input.lifetimeValue + monthlyValue * horizon * retentionFactor * multiplier;

    return {
      predictedLifetimeValue: Math.max(0, Math.round(predicted * 100) / 100),
    };
  }
}
