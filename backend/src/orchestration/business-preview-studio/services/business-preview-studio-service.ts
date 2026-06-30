import { getGovernanceEngine } from "../../../foundation/empire-governance/services/governance-engine.js";
import { captureSoulRuntimeEvent } from "../../../foundation/soul-runtime/services/soul-runtime-engine.js";
import {
  getBusinessOpportunityRepository,
  listBusinessOpportunities,
} from "../../business-opportunity-workspace/index.js";
import type { BusinessPreviewDashboard, BusinessPreviewRecord } from "../models/business-preview.js";
import {
  getBusinessPreviewRepository,
  resetBusinessPreviewRepository,
} from "../repositories/sqlite-business-preview-repository.js";
import { generateBusinessPreview } from "./business-preview-generator.js";

export { getBusinessPreviewRepository, resetBusinessPreviewRepository };

const APPROVED_OPPORTUNITY_STATUSES = new Set(["APPROVED", "READY_FOR_BUILD"]);

export class BusinessPreviewNotFoundError extends Error {
  constructor(previewId: string) {
    super(`Business preview not found: ${previewId}`);
    this.name = "BusinessPreviewNotFoundError";
  }
}

export class BusinessPreviewBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessPreviewBlockedError";
  }
}

function capturePreviewSoulRuntime(
  workspaceId: string,
  title: string,
  summary: string,
  actor: string,
  payload: Record<string, unknown>,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "businessMilestones",
      title,
      summary,
      source: "system",
      actor,
      payload,
    });
  } catch {
    // best-effort
  }
}

function requireApprovedOpportunity(businessOpportunityId: string) {
  const opportunity = getBusinessOpportunityRepository().getOpportunity(businessOpportunityId);
  if (!opportunity) {
    throw new BusinessPreviewBlockedError(`Business opportunity not found: ${businessOpportunityId}`);
  }
  if (!APPROVED_OPPORTUNITY_STATUSES.has(opportunity.status)) {
    throw new BusinessPreviewBlockedError(
      `Preview requires approved business opportunity — current status: ${opportunity.status}`,
    );
  }
  return opportunity;
}

/** Generates visual business preview from approved opportunity — no publishing. */
export function generateBusinessPreviewForOpportunity(
  businessOpportunityId: string,
  actor?: string,
): BusinessPreviewRecord {
  const opportunity = requireApprovedOpportunity(businessOpportunityId);
  const existing = getBusinessPreviewRepository().getLatestByOpportunity(businessOpportunityId);
  const preview = generateBusinessPreview(opportunity, {
    generationVersion: existing ? existing.generationVersion + 1 : 1,
    status: "GENERATED",
  });
  const saved = getBusinessPreviewRepository().savePreview(preview);

  capturePreviewSoulRuntime(
    opportunity.workspaceId,
    "Business preview generated",
    `${opportunity.brand.businessName} — ${saved.assetsGenerated} preview assets`,
    actor ?? "business-preview-studio",
    { previewId: saved.previewId, businessOpportunityId },
  );

  return saved;
}

export function listBusinessPreviews(
  workspaceId: string,
  companyId: string,
): BusinessPreviewRecord[] {
  return getBusinessPreviewRepository().listPreviews(workspaceId, companyId);
}

export function getBusinessPreview(previewId: string): BusinessPreviewRecord | null {
  return getBusinessPreviewRepository().getPreview(previewId);
}

export function regenerateBusinessPreview(
  previewId: string,
  actor?: string,
): BusinessPreviewRecord {
  const existing = getBusinessPreviewRepository().getPreview(previewId);
  if (!existing) throw new BusinessPreviewNotFoundError(previewId);

  const opportunity = requireApprovedOpportunity(existing.businessOpportunityId);
  const preview = generateBusinessPreview(opportunity, {
    generationVersion: existing.generationVersion + 1,
    status: "REGENERATED",
  });
  const saved = getBusinessPreviewRepository().savePreview({
    ...preview,
    previewId: existing.previewId,
    createdAt: existing.createdAt,
  });

  capturePreviewSoulRuntime(
    opportunity.workspaceId,
    "Business preview regenerated",
    `${opportunity.brand.businessName} v${saved.generationVersion}`,
    actor ?? "business-preview-studio",
    { previewId: saved.previewId },
  );

  return saved;
}

export function approveBusinessPreviewForBuild(
  previewId: string,
  actor?: string,
): BusinessPreviewRecord {
  const existing = getBusinessPreviewRepository().getPreview(previewId);
  if (!existing) throw new BusinessPreviewNotFoundError(previewId);

  if (existing.status === "APPROVED_FOR_BUILD") {
    return existing;
  }

  const governance = getGovernanceEngine();
  const verdict = governance.evaluateDecision({
    workspaceId: existing.workspaceId,
    domain: "grandKings",
    module: "business-preview-studio",
    action: "approve_preview_for_build",
    actor: actor ?? "founder",
    correlationId: previewId,
    payload: { previewId, businessOpportunityId: existing.businessOpportunityId },
  });

  if (!verdict.allowed) {
    throw new BusinessPreviewBlockedError(
      verdict.reason ?? "Governance blocked preview build approval",
    );
  }

  const updated = getBusinessPreviewRepository().savePreview({
    ...existing,
    status: "APPROVED_FOR_BUILD",
    approvedForBuildAt: new Date().toISOString(),
    approvedForBuildBy: actor ?? "founder",
    updatedAt: new Date().toISOString(),
  });

  capturePreviewSoulRuntime(
    existing.workspaceId,
    "Grand King approved business preview for build",
    `${existing.businessName} — preview approved, no execution triggered`,
    actor ?? "founder",
    { previewId, businessOpportunityId: existing.businessOpportunityId },
  );

  return updated;
}

export function buildBusinessPreviewDashboard(
  workspaceId: string,
  companyId: string,
): BusinessPreviewDashboard {
  const previews = listBusinessPreviews(workspaceId, companyId);
  const latest = previews[0] ?? null;

  const approvedOpportunities = listBusinessOpportunities(workspaceId, companyId).filter((entry) =>
    APPROVED_OPPORTUNITY_STATUSES.has(entry.status),
  );

  const candidate = latest ?? (
    approvedOpportunities[0]
      ? getBusinessPreviewRepository().getLatestByOpportunity(approvedOpportunities[0].businessOpportunityId)
      : null
  );

  const businessPreviewReady = Boolean(candidate && candidate.status !== "DRAFT");
  const assetsGenerated = candidate?.assetsGenerated ?? 0;
  const previewQuality = candidate?.quality.overallScore ?? 0;
  const recommendedImprovements = candidate?.quality.recommendedImprovements ?? [
    approvedOpportunities.length > 0
      ? "Generate business preview from approved opportunity."
      : "Approve a business opportunity to enable preview generation.",
  ];

  const canApprove =
    Boolean(candidate) &&
    candidate!.status !== "APPROVED_FOR_BUILD" &&
    candidate!.quality.overallScore >= 50;

  return {
    businessPreviewReady,
    assetsGenerated,
    previewQuality,
    recommendedImprovements,
    approveForBuild: {
      available: canApprove,
      previewId: canApprove ? candidate!.previewId : undefined,
      businessOpportunityId: candidate?.businessOpportunityId,
      businessName: candidate?.businessName,
    },
    latestPreviewId: candidate?.previewId,
    computedAt: new Date().toISOString(),
  };
}
