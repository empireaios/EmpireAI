import type { FailureClassification, FailureRecord, RecrtInput } from "./types.js";
import type { RecoveryStore } from "./recovery-store.js";

/**
 * Deterministic failure classification from structural signals.
 * Same signals → same classification.
 */
export class FailureClassifier {
  classify(store: RecoveryStore, failure: FailureRecord, input: RecrtInput = {}): FailureRecord {
    const classification =
      input.failureClassification ??
      this.classifyFromSignals(failure.classificationSignals, input.classificationSignals ?? []);

    const updated = store.updateFailure(failure.failureId, {
      failureClassification: classification,
      classificationSignals: [
        ...new Set([
          ...failure.classificationSignals,
          ...(input.classificationSignals ?? []),
          `classified:${classification}`,
        ]),
      ],
      supportingEvidence: [
        ...failure.supportingEvidence,
        `classification:${classification}`,
      ],
      highRisk: input.highRisk === true || classification === "unrecoverable" || failure.highRisk,
    });

    return updated ?? failure;
  }

  classifyFromSignals(
    existing: string[],
    incoming: string[],
  ): FailureClassification {
    const signals = [...existing, ...incoming].map((s) => s.toLowerCase());

    if (signals.some((s) => s.includes("unrecoverable") || s.includes("fatal"))) {
      return "unrecoverable";
    }
    if (signals.some((s) => s.includes("corrupt") || s.includes("state_corruption"))) {
      return "state_corruption";
    }
    if (signals.some((s) => s.includes("timeout") || s.includes("timed_out"))) {
      return "timeout";
    }
    if (signals.some((s) => s.includes("dependency") || s.includes("upstream"))) {
      return "dependency";
    }
    if (signals.some((s) => s.includes("resource") || s.includes("oom") || s.includes("capacity"))) {
      return "resource";
    }
    if (signals.some((s) => s.includes("custom"))) {
      return "custom_extension";
    }
    if (signals.some((s) => s.includes("transient") || s.includes("retry") || s.includes("flaky"))) {
      return "transient";
    }
    // Deterministic default for unknown structural signals.
    return "transient";
  }
}
