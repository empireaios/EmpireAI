import { z } from "zod";

/** GKR-002 — Canonical revenue pipeline states. */
export const RevenuePipelineStateSchema = z.enum([
  "DISCOVERED",
  "UNDER_REVIEW",
  "EXECUTIVE_REVIEW",
  "KING_APPROVAL",
  "READY_TO_PUBLISH",
  "LIVE",
  "MONITORING",
  "SCALING",
  "PAUSED",
  "ARCHIVED",
  "FAILED",
]);
export type RevenuePipelineState = z.infer<typeof RevenuePipelineStateSchema>;

/** GKR-001 — Lifecycle stages mapped to pipeline flow. */
export const REVENUE_PIPELINE_LIFECYCLE = [
  { stage: 1, id: "product-candidate", label: "Product Candidate", state: "DISCOVERED" as const },
  { stage: 2, id: "commercial-review", label: "Commercial Review", state: "UNDER_REVIEW" as const, module: "commerce-intelligence-studio" },
  { stage: 3, id: "executive-council", label: "Executive Council", state: "EXECUTIVE_REVIEW" as const, module: "executive-council" },
  { stage: 4, id: "king-approval", label: "King Approval", state: "KING_APPROVAL" as const, module: "soul-file" },
  { stage: 5, id: "marketplace-ready", label: "Marketplace Ready", state: "READY_TO_PUBLISH" as const, module: "commerce-runtime" },
  { stage: 6, id: "published", label: "Published", state: "LIVE" as const, module: "amazon-global-seller" },
  { stage: 7, id: "monitoring", label: "Monitoring", state: "MONITORING" as const },
  { stage: 8, id: "scaling", label: "Scaling", state: "SCALING" as const },
  { stage: 9, id: "archived", label: "Archived", state: "ARCHIVED" as const },
] as const;

export const VALID_STATE_TRANSITIONS: Record<RevenuePipelineState, RevenuePipelineState[]> = {
  DISCOVERED: ["UNDER_REVIEW", "FAILED", "ARCHIVED"],
  UNDER_REVIEW: ["EXECUTIVE_REVIEW", "DISCOVERED", "FAILED", "ARCHIVED"],
  EXECUTIVE_REVIEW: ["KING_APPROVAL", "UNDER_REVIEW", "FAILED", "ARCHIVED"],
  KING_APPROVAL: ["READY_TO_PUBLISH", "EXECUTIVE_REVIEW", "FAILED", "ARCHIVED"],
  READY_TO_PUBLISH: ["LIVE", "KING_APPROVAL", "FAILED", "PAUSED"],
  LIVE: ["MONITORING", "SCALING", "PAUSED", "FAILED", "ARCHIVED"],
  MONITORING: ["SCALING", "PAUSED", "FAILED", "ARCHIVED"],
  SCALING: ["MONITORING", "LIVE", "PAUSED", "ARCHIVED"],
  PAUSED: ["UNDER_REVIEW", "READY_TO_PUBLISH", "LIVE", "ARCHIVED", "FAILED"],
  ARCHIVED: [],
  FAILED: ["DISCOVERED", "ARCHIVED"],
};

export function canTransition(from: RevenuePipelineState, to: RevenuePipelineState): boolean {
  return VALID_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}
