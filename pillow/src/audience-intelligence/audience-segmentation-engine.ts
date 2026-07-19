/** R5-08 — Audience Segmentation Engine (build + overlap). */

import { appendAudLog } from "./aud-logging.js";
import { AUD_METADATA_VERSION } from "./paths.js";
import type {
  AudienceOverlap,
  AudienceRecord,
  AudienceSource,
  BuildAudienceInput,
} from "./types.js";

export class AudienceSegmentationEngine {
  private audiences = new Map<string, AudienceRecord>();

  build(input: BuildAudienceInput): AudienceRecord {
    const audienceRecordId = `aud-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const source: AudienceSource = input.audienceSource ?? "composite";
    const size = Math.max(1, input.estimatedSize ?? 1000);
    const record: AudienceRecord = {
      audienceRecordId,
      timestamp: new Date().toISOString(),
      audienceName: input.audienceName.trim(),
      audienceSource: source,
      demographicSummary: "Pending demographic analysis",
      behaviourSummary: "Pending behaviour analysis",
      interestSummary: "Pending interest analysis",
      audienceSize: size,
      audienceQualityScore: 0,
      engagementScore: 0,
      intentScore: 0,
      validationStatus: "pending",
      metadataVersion: AUD_METADATA_VERSION,
      overlapAudienceIds: [],
      piiRedacted: true,
    };
    this.audiences.set(audienceRecordId, record);
    appendAudLog({
      event: "audience_creation",
      level: "info",
      details: `Audience built: ${audienceRecordId}`,
    });
    return { ...record };
  }

  get(id: string): AudienceRecord | null {
    const record = this.audiences.get(id);
    return record ? { ...record } : null;
  }

  persist(record: AudienceRecord): AudienceRecord {
    this.audiences.set(record.audienceRecordId, record);
    return { ...record };
  }

  list(): AudienceRecord[] {
    return [...this.audiences.values()].map((r) => ({ ...r }));
  }

  detectOverlap(focusId?: string): AudienceOverlap[] {
    const all = this.list();
    const targets = focusId ? all.filter((a) => a.audienceRecordId === focusId) : all;
    const overlaps: AudienceOverlap[] = [];

    for (const a of targets) {
      for (const b of all) {
        if (a.audienceRecordId >= b.audienceRecordId) continue;
        const nameOverlap =
          a.audienceName.split(/\s+/).filter((t) => b.audienceName.toLowerCase().includes(t.toLowerCase()))
            .length > 0;
        const sourceBoost = a.audienceSource === b.audienceSource ? 15 : 0;
        const sizeRatio =
          Math.min(a.audienceSize, b.audienceSize) / Math.max(a.audienceSize, b.audienceSize);
        const overlapPercent = Math.min(
          95,
          Math.round((nameOverlap ? 35 : 10) + sizeRatio * 40 + sourceBoost),
        );
        if (overlapPercent < 20) continue;

        const overlap: AudienceOverlap = {
          overlapId: `aud-ovl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          audienceRecordIdA: a.audienceRecordId,
          audienceRecordIdB: b.audienceRecordId,
          overlapPercent,
          timestamp: new Date().toISOString(),
        };
        overlaps.push(overlap);

        a.overlapAudienceIds = [...new Set([...a.overlapAudienceIds, b.audienceRecordId])];
        b.overlapAudienceIds = [...new Set([...b.overlapAudienceIds, a.audienceRecordId])];
        this.persist(a);
        this.persist(b);
      }
    }

    appendAudLog({
      event: "audience_analysis",
      level: "info",
      details: `Detected ${overlaps.length} audience overlap(s)`,
    });
    return overlaps;
  }

  count(): number {
    return this.audiences.size;
  }

  resetForTesting(): void {
    this.audiences.clear();
  }
}
