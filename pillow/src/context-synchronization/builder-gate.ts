import type { ContextBuilderGateResult, ContextSyncPipelineResult, ContextSyncRequest } from "./types.js";

export function evaluateContextBuilderGate(
  pipeline: ContextSyncPipelineResult,
  request: ContextSyncRequest = {},
): ContextBuilderGateResult {
  if (request.grandKingOverride) {
    return {
      allowed: true,
      reason: "Grand King override — Builder may proceed despite context findings",
      overrideApplied: true,
      pipeline,
    };
  }

  if (!pipeline.visionPipeline.success) {
    return {
      allowed: false,
      reason: "Builder refused — Vision Synchronization prerequisite failed",
      overrideApplied: false,
      pipeline,
    };
  }

  const failed = pipeline.steps.filter((s) => s.status === "failed");
  if (failed.length > 0) {
    return {
      allowed: false,
      reason: `Builder refused — context load failed: ${failed.map((s) => s.label).join(", ")}`,
      overrideApplied: false,
      pipeline,
    };
  }

  const critical = pipeline.alignmentFindings.filter((f) => f.severity === "critical");
  if (critical.length > 0) {
    return {
      allowed: false,
      reason: `Builder refused — critical context misalignment: ${critical.map((f) => f.signal).join("; ")}`,
      overrideApplied: false,
      pipeline,
    };
  }

  const high = pipeline.alignmentFindings.filter((f) => f.severity === "high");
  if (high.length > 0) {
    return {
      allowed: false,
      reason: `Builder refused — high context misalignment: ${high.map((f) => f.signal).join("; ")}`,
      overrideApplied: false,
      pipeline,
    };
  }

  if (pipeline.contextCompletenessPercent < 75) {
    return {
      allowed: false,
      reason: `Builder refused — context completeness ${pipeline.contextCompletenessPercent}% (minimum 75%)`,
      overrideApplied: false,
      pipeline,
    };
  }

  if (!pipeline.success) {
    return {
      allowed: false,
      reason: "Builder refused — Context Synchronization did not complete successfully",
      overrideApplied: false,
      pipeline,
    };
  }

  return {
    allowed: true,
    reason: "Context Synchronization complete — Builder may implement",
    overrideApplied: false,
    pipeline,
  };
}
