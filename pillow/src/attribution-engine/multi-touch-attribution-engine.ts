/** R5-09 — Multi-Touch Attribution Engine. */

import type { AttributionModel, TouchpointRecord } from "./types.js";

export class MultiTouchAttributionEngine {
  computeWeights(model: AttributionModel, touchpoints: TouchpointRecord[]): number[] {
    const n = touchpoints.length;
    if (n === 0) return [];
    if (n === 1) return [1];

    switch (model) {
      case "first_touch":
        return touchpoints.map((_, i) => (i === 0 ? 1 : 0));
      case "last_touch":
        return touchpoints.map((_, i) => (i === n - 1 ? 1 : 0));
      case "linear":
        return touchpoints.map(() => 1 / n);
      case "time_decay": {
        const weights = touchpoints.map((_, i) => Math.pow(2, i));
        const sum = weights.reduce((a, b) => a + b, 0);
        return weights.map((w) => w / sum);
      }
      case "position_based": {
        if (n === 2) return [0.5, 0.5];
        const middle = 0.2 / (n - 2);
        return touchpoints.map((_, i) => {
          if (i === 0 || i === n - 1) return 0.4;
          return middle;
        });
      }
      default:
        return touchpoints.map(() => 1 / n);
    }
  }

  isSupportedModel(model: string): model is AttributionModel {
    return (
      model === "first_touch" ||
      model === "last_touch" ||
      model === "linear" ||
      model === "time_decay" ||
      model === "position_based"
    );
  }
}
