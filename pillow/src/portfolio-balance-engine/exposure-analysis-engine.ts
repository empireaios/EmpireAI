/** X2-08 — Geographic / exposure analysis engine. */

import { appendPbeLog } from "./pbe-logging.js";

export class ExposureAnalysisEngine {
  /**
   * Structural geographic exposure proxy from category/company footprint.
   * No real PII or location credentials — structural signals only.
   */
  measureGeographicExposure(input: {
    companyCount: number;
    categoryCount: number;
    activeModules: number;
  }): number {
    if (input.companyCount === 0) return 0;
    const concentration =
      input.categoryCount <= 1
        ? 80
        : Math.max(15, 90 - input.categoryCount * 12 - Math.min(20, input.activeModules * 2));
    const score = Math.round(concentration);

    appendPbeLog({
      event: "exposure_analysis",
      level: "info",
      details: `Geographic exposure score=${score}`,
    });
    return score;
  }
}
