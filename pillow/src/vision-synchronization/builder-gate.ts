import type { BuilderSyncGateResult, VisionSyncPipelineResult, VisionSyncRequest } from "./types.js";

export function evaluateBuilderSyncGate(
  pipeline: VisionSyncPipelineResult,
  request: VisionSyncRequest = {},
): BuilderSyncGateResult {
  if (request.grandKingOverride) {
    return {
      allowed: true,
      reason: "Grand King override — Builder may proceed despite synchronization findings",
      overrideApplied: true,
      pipeline,
    };
  }

  const failedSteps = pipeline.steps.filter((s) => s.status === "failed");
  if (failedSteps.length > 0) {
    return {
      allowed: false,
      reason: `Builder refused — synchronization failed at: ${failedSteps.map((s) => s.label).join(", ")}`,
      overrideApplied: false,
      pipeline,
    };
  }

  const critical = pipeline.driftFindings.filter((f) => f.severity === "critical");
  if (critical.length > 0) {
    return {
      allowed: false,
      reason: `Builder refused — critical drift: ${critical.map((f) => f.signal).join("; ")}`,
      overrideApplied: false,
      pipeline,
    };
  }

  const high = pipeline.driftFindings.filter((f) => f.severity === "high");
  if (high.length > 0) {
    return {
      allowed: false,
      reason: `Builder refused — high drift detected: ${high.map((f) => f.signal).join("; ")}`,
      overrideApplied: false,
      pipeline,
    };
  }

  if (!pipeline.success) {
    return {
      allowed: false,
      reason: "Builder refused — Vision Synchronization did not complete successfully",
      overrideApplied: false,
      pipeline,
    };
  }

  return {
    allowed: true,
    reason: "Vision Synchronization complete — Builder may implement",
    overrideApplied: false,
    pipeline,
  };
}
