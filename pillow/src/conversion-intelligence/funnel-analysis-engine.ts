/** R5-14 — Funnel Analysis Engine. */

import type { ConversionIntelligenceConfiguration } from "./configuration.js";
import type { ConversionRecord } from "./types.js";

export class FunnelAnalysisEngine {
  refresh(
    record: ConversionRecord,
    config: ConversionIntelligenceConfiguration,
  ): ConversionRecord {
    const bottleneckDetected = record.dropOffRate >= config.bottleneckDropOffThresholdPercent;
    const abandonmentDetected = record.dropOffRate >= config.abandonmentThresholdPercent;

    return {
      ...record,
      bottleneckDetected,
      abandonmentDetected,
      timestamp: new Date().toISOString(),
    };
  }

  detectBottlenecks(records: ConversionRecord[]): ConversionRecord[] {
    return records.filter((r) => r.bottleneckDetected);
  }

  detectAbandonment(records: ConversionRecord[]): ConversionRecord[] {
    return records.filter((r) => r.abandonmentDetected);
  }

  averageDropOff(records: ConversionRecord[]): number {
    if (records.length === 0) return 0;
    return (
      Math.round(
        (records.reduce((sum, r) => sum + r.dropOffRate, 0) / records.length) * 100,
      ) / 100
    );
  }
}
