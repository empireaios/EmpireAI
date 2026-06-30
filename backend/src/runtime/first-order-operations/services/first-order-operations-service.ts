import { listPipelines } from "../../../revenue/customer-order-pipeline/services/customer-order-pipeline-service.js";
import type { FirstOrderMilestoneId, FirstOrderOperations } from "../models/first-order-operations.js";
import { FIRST_ORDER_MILESTONES } from "../models/first-order-operations.js";

const MILESTONE_LABELS: Record<FirstOrderMilestoneId, string> = {
  first_customer: "First Customer",
  first_payment: "First Payment",
  first_fulfillment: "First Fulfillment",
  first_tracking: "First Tracking",
  first_refund: "First Refund",
  first_review: "First Review",
  first_repeat_customer: "First Repeat Customer",
};

function detectMilestoneStatus(
  milestoneId: FirstOrderMilestoneId,
  pipelines: ReturnType<typeof listPipelines>,
): { status: "PENDING" | "COMPLETE"; completedAt: string | null; evidence: string | null } {
  if (pipelines.length === 0) {
    return { status: "PENDING", completedAt: null, evidence: null };
  }

  const delivered = pipelines.filter((p) => p.status === "DELIVERED");
  const paid = pipelines.filter((p) =>
    ["PAYMENT_VERIFIED", "ORDER_CREATED", "INVENTORY_RESERVED", "AWAITING_FULFILLMENT_APPROVAL",
      "FULFILLMENT_REQUESTED", "IN_TRANSIT", "DELIVERED"].includes(p.status),
  );
  const fulfilled = pipelines.filter((p) =>
    ["FULFILLMENT_REQUESTED", "IN_TRANSIT", "DELIVERED"].includes(p.status),
  );
  const tracked = pipelines.filter((p) => p.trackingNumber);
  const refunded = pipelines.filter((p) => p.status === "CANCELLED" || p.metadata.refund === "true");
  const reviewed = pipelines.filter((p) => p.metadata.review === "true");
  const emails = new Set(pipelines.map((p) => p.customerEmail));
  const repeat = pipelines.filter((p) => {
    const sameEmail = pipelines.filter((x) => x.customerEmail === p.customerEmail);
    return sameEmail.length > 1 && p.status === "DELIVERED";
  });

  const checks: Record<FirstOrderMilestoneId, boolean> = {
    first_customer: pipelines.length > 0,
    first_payment: paid.length > 0,
    first_fulfillment: fulfilled.length > 0,
    first_tracking: tracked.length > 0,
    first_refund: refunded.length > 0,
    first_review: reviewed.length > 0,
    first_repeat_customer: repeat.length > 0 || emails.size < pipelines.filter((p) => p.status === "DELIVERED").length,
  };

  const complete = checks[milestoneId];
  const evidencePipeline = pipelines.find((p) => p.status !== "FAILED") ?? pipelines[0];
  return {
    status: complete ? "COMPLETE" : "PENDING",
    completedAt: complete && evidencePipeline ? evidencePipeline.updatedAt : null,
    evidence: complete && evidencePipeline ? `Pipeline ${evidencePipeline.pipelineId}` : null,
  };
}

/** REAL-039 — First order operations milestone tracker. */
export function buildFirstOrderOperations(
  workspaceId: string,
  companyId: string,
): FirstOrderOperations {
  let pipelines: ReturnType<typeof listPipelines> = [];
  try {
    pipelines = listPipelines(workspaceId, companyId);
  } catch { /* optional */ }

  const milestones = FIRST_ORDER_MILESTONES.map((milestoneId) => {
    const detected = detectMilestoneStatus(milestoneId, pipelines);
    return {
      milestoneId,
      label: MILESTONE_LABELS[milestoneId],
      status: detected.status,
      completedAt: detected.completedAt,
      evidence: detected.evidence,
    };
  });

  const completedCount = milestones.filter((m) => m.status === "COMPLETE").length;

  return {
    moduleId: "first-order-operations",
    missionId: "REAL-039",
    workspaceId,
    companyId,
    milestones,
    completedCount,
    totalCount: milestones.length,
    allComplete: completedCount === milestones.length,
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
