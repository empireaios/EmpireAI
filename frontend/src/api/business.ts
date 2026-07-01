import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { apiRequest } from "@/api/client";
import { brainDispatch } from "@/api/dispatch";

export async function fetchBusinessOpportunities(
  companyId = GRAND_KING_COMPANY_ID,
  filters?: Record<string, string | number | boolean | undefined>,
) {
  return apiRequest<{ opportunities: Record<string, unknown>[]; total: number }>(
    "/business-workspace/opportunities",
    { params: { companyId, sync: true, ...filters } },
  );
}

export async function approveBusinessOpportunity(businessOpportunityId: string) {
  return apiRequest<{ opportunity: Record<string, unknown> }>(
    `/business-workspace/opportunities/${businessOpportunityId}/approve`,
    { method: "POST" },
  );
}

export async function rejectBusinessOpportunity(businessOpportunityId: string, reason?: string) {
  return apiRequest<{ opportunity: Record<string, unknown> }>(
    `/business-workspace/opportunities/${businessOpportunityId}/reject`,
    { method: "POST", body: { reason } },
  );
}

export async function compareBusinessOpportunities(opportunityA: string, opportunityB: string) {
  return apiRequest<{ comparison: Record<string, unknown> }>("/business-workspace/compare", {
    params: { opportunityA, opportunityB },
  });
}

export async function listBusinessPreviews(companyId = GRAND_KING_COMPANY_ID) {
  const response = await brainDispatch<Record<string, unknown>[]>(
    "business-preview-studio",
    "list",
    companyId,
    { companyId },
  );
  return response;
}

export async function getBusinessPreview(previewId: string, companyId = GRAND_KING_COMPANY_ID) {
  return brainDispatch<Record<string, unknown>>(
    "business-preview-studio",
    "get",
    companyId,
    { previewId },
  );
}

export async function generateBusinessPreview(businessOpportunityId: string, companyId = GRAND_KING_COMPANY_ID) {
  return brainDispatch<Record<string, unknown>>(
    "business-preview-studio",
    "generate",
    companyId,
    { businessOpportunityId },
  );
}
