/** X2-17 — Lifecycle State Engine. */

import { CLM_METADATA_VERSION } from "./paths.js";
import type { LifecycleRecord, LifecycleStage, LifecycleStatus } from "./types.js";

export class LifecycleStateEngine {
  createOrUpdate(input: {
    existing: LifecycleRecord | null;
    companyReference: string;
    currentLifecycleStage: LifecycleStage;
    previousLifecycleStage: LifecycleStage | null;
    maturityScore: number;
    transitionRecommendation: string;
    lifecycleStatus: LifecycleStatus;
    requiresApproval: boolean;
  }): LifecycleRecord {
    return {
      lifecycleRecordId: input.existing?.lifecycleRecordId ?? `clm-lc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      companyReference: input.companyReference.trim(),
      currentLifecycleStage: input.currentLifecycleStage,
      previousLifecycleStage: input.previousLifecycleStage,
      maturityScore: Math.max(0, Math.min(100, Math.round(input.maturityScore))),
      transitionRecommendation: input.transitionRecommendation,
      lifecycleStatus: input.lifecycleStatus,
      validationStatus: "passed",
      metadataVersion: CLM_METADATA_VERSION,
      requiresApproval: input.requiresApproval,
      autoTransitionBlocked: true,
      structuralSignalOnly: true,
      sensitiveEnterpriseData: false,
    };
  }
}
