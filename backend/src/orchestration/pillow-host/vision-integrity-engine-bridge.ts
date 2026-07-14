import type { VisionIntegritySnapshot } from "@empireai/pillow";

/** Collect live VIE snapshot (P6-02). */
export function collectVisionIntegritySnapshot(input?: {
  classification?: VisionIntegritySnapshot["classification"];
  approvalStatus?: VisionIntegritySnapshot["approvalStatus"];
  visionAlignmentScore?: number;
  driftCount?: number;
  violationCount?: number;
  missionId?: string | null;
  missionTitle?: string | null;
}): VisionIntegritySnapshot {
  return {
    capturedAt: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV ?? "development",
    classification: input?.classification ?? "unknown",
    approvalStatus: input?.approvalStatus ?? "conditional",
    visionAlignmentScore: input?.visionAlignmentScore ?? 75,
    driftCount: input?.driftCount ?? 0,
    violationCount: input?.violationCount ?? 0,
    missionId: input?.missionId ?? null,
    missionTitle: input?.missionTitle ?? null,
  };
}
