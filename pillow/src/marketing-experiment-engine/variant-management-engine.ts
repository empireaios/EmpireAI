/** R5-17 — Variant Management Engine. */

import type { ExperimentRecord, ExperimentType } from "./types.js";

export class VariantManagementEngine {
  defaultVariants(type: ExperimentType): string[] {
    if (type === "multivariate") {
      return ["control", "variant_a", "variant_b", "variant_c"];
    }
    return ["control", "variant_a"];
  }

  ensureVariants(record: ExperimentRecord, variants?: string[]): ExperimentRecord {
    const next =
      variants && variants.length >= 2
        ? variants
        : record.variantReferences.length >= 2
          ? record.variantReferences
          : this.defaultVariants(record.experimentType);
    return {
      ...record,
      variantReferences: [...next],
      experimentStatus: record.experimentStatus === "draft" ? "running" : record.experimentStatus,
      timestamp: new Date().toISOString(),
    };
  }

  assignAudience(
    record: ExperimentRecord,
    audienceReference: string | null,
    splitPercent: number,
  ): ExperimentRecord {
    return {
      ...record,
      audienceReference,
      recommendationSummary: `Audience split ${splitPercent}% assigned for ${record.experimentName}`,
      experimentStatus: "running",
      timestamp: new Date().toISOString(),
    };
  }
}
