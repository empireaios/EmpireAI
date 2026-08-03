/** X3-10 — Bottleneck Detection Engine (category monitors). */

import type { BottleneckIntelligenceConfiguration } from "./configuration.js";
import type {
  BottleneckCategory,
  BottleneckIntelligenceInput,
  BottleneckRecord,
} from "./types.js";
import {
  buildBottleneckRecord,
  computeBottleneckSignals,
} from "./structural-signals.js";

const CATEGORY_SOURCE_KEY: Record<
  Exclude<BottleneckCategory, "throughput">,
  keyof BottleneckIntelligenceConfiguration | null
> = {
  operational: "operationalMonitoringEnabled",
  infrastructure: "infrastructureMonitoringEnabled",
  supplier: "supplierMonitoringEnabled",
  marketing: "marketingMonitoringEnabled",
  financial: "financialMonitoringEnabled",
  workforce: "workforceMonitoringEnabled",
};

export class BottleneckDetectionEngine {
  assess(
    category: Exclude<BottleneckCategory, "throughput">,
    input: BottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
    sourceAvailable = true,
  ): BottleneckRecord {
    const flag = CATEGORY_SOURCE_KEY[category];
    if (flag && !config[flag]) {
      throw new Error(`${category} bottleneck monitoring disabled`);
    }
    const signals = computeBottleneckSignals(category, input, config, sourceAvailable);
    return buildBottleneckRecord({
      ...signals,
      config,
    });
  }
}
