/** R4-16 — Dynamic Segment Manager. */

import type { CustomerSegmentationEngineConfiguration } from "./configuration.js";
import type { SegmentationRecord, SegmentChange } from "./types.js";
import type { SegmentationMetadataGenerator } from "./segmentation-metadata-generator.js";
import type { SegmentationRegistry } from "./segmentation-registry.js";

export class DynamicSegmentManager {
  detectChanges(input: {
    customerId: string;
    previous: SegmentationRecord | null;
    current: SegmentationRecord;
    config: CustomerSegmentationEngineConfiguration;
    registry: SegmentationRegistry;
    metadataGenerator: SegmentationMetadataGenerator;
  }): SegmentChange | null {
    if (!input.config.dynamicUpdateRulesEnabled) return null;

    const enabled = input.config.dynamicUpdateRules.some((r) => r.enabled && r.recheckOnChange);
    if (!enabled) return null;

    const previousSegments = input.previous?.assignedSegments ?? [];
    const newSegments = input.current.assignedSegments;
    const prevKey = [...previousSegments].sort().join("|");
    const nextKey = [...newSegments].sort().join("|");
    if (prevKey === nextKey) return null;

    const change = input.metadataGenerator.buildSegmentChange({
      customerId: input.customerId,
      segmentationRecordId: input.current.segmentationRecordId,
      previousSegments,
      newSegments,
    });
    input.registry.storeChange(change);
    return change;
  }
}
