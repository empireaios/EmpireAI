/** R4-16 — Segmentation Analytics Engine. */

import type { SegmentationRecord, CustomerSegment } from "./types.js";

export class SegmentationAnalyticsEngine {
  summarize(records: SegmentationRecord[], segments: CustomerSegment[]) {
    const segmentCounts = new Map<string, number>();
    for (const record of records) {
      for (const seg of record.assignedSegments) {
        segmentCounts.set(seg, (segmentCounts.get(seg) ?? 0) + 1);
      }
    }

    return {
      totalRecords: records.length,
      activeSegments: segments.filter((s) => s.active).length,
      segmentDistribution: Object.fromEntries(segmentCounts),
      averageConfidence:
        records.length > 0
          ? Math.round(
              records.reduce((sum, r) => sum + r.segmentConfidence, 0) / records.length,
            )
          : 0,
    };
  }
}
