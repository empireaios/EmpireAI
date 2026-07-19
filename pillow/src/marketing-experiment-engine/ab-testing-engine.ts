/** R5-17 — A/B Testing Engine. */

import { MEE_METADATA_VERSION } from "./paths.js";
import type {
  ExperimentPerformanceMetrics,
  ExperimentRecord,
  ExperimentStatus,
  ExperimentType,
} from "./types.js";

export class AbTestingEngine {
  private readonly experiments = new Map<string, ExperimentRecord>();

  create(input: {
    experimentName: string;
    experimentType: ExperimentType;
    campaignReference: string | null;
    variantReferences: string[];
    audienceReference: string | null;
    performanceMetrics: ExperimentPerformanceMetrics;
    experimentStatus: ExperimentStatus;
    recommendationSummary: string;
  }): ExperimentRecord {
    const record: ExperimentRecord = {
      experimentId: `mee-exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      experimentName: input.experimentName,
      experimentType: input.experimentType,
      campaignReference: input.campaignReference,
      variantReferences: [...input.variantReferences],
      audienceReference: input.audienceReference,
      performanceMetrics: { ...input.performanceMetrics },
      winningVariant: null,
      statisticallySignificant: false,
      experimentStatus: input.experimentStatus,
      recommendationSummary: input.recommendationSummary,
      deployedToProduction: false,
      validationStatus: "passed",
      metadataVersion: MEE_METADATA_VERSION,
    };
    this.experiments.set(record.experimentId, record);
    return { ...record, variantReferences: [...record.variantReferences], performanceMetrics: { ...record.performanceMetrics } };
  }

  get(id: string): ExperimentRecord | null {
    const record = this.experiments.get(id);
    return record
      ? {
          ...record,
          variantReferences: [...record.variantReferences],
          performanceMetrics: { ...record.performanceMetrics },
        }
      : null;
  }

  persist(record: ExperimentRecord): void {
    this.experiments.set(record.experimentId, {
      ...record,
      variantReferences: [...record.variantReferences],
      performanceMetrics: { ...record.performanceMetrics },
      timestamp: new Date().toISOString(),
    });
  }

  list(): ExperimentRecord[] {
    return [...this.experiments.values()].map((r) => ({
      ...r,
      variantReferences: [...r.variantReferences],
      performanceMetrics: { ...r.performanceMetrics },
    }));
  }

  resetForTesting(): void {
    this.experiments.clear();
  }
}
