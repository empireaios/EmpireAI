import type { EtaEstimate } from "@empireai/pillow";

/** Collect live ETA snapshot (P6-05). */
export function collectEtaEngineSnapshot(input?: {
  missionTitle?: string | null;
  completionPercent?: number;
  estimatedRemainingTimeMs?: number;
  confidencePercent?: number;
  predictedCompletionAt?: string | null;
}): Pick<
  EtaEstimate,
  | "missionTitle"
  | "completionPercent"
  | "estimatedRemainingTimeMs"
  | "confidencePercent"
  | "predictedCompletionAt"
  | "lastEtaUpdate"
> {
  const at = new Date().toISOString();
  return {
    missionTitle: input?.missionTitle ?? null,
    completionPercent: input?.completionPercent ?? 0,
    estimatedRemainingTimeMs: input?.estimatedRemainingTimeMs ?? 0,
    confidencePercent: input?.confidencePercent ?? 0,
    predictedCompletionAt: input?.predictedCompletionAt ?? at,
    lastEtaUpdate: at,
  };
}
