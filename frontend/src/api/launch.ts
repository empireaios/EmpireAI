import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { apiRequest } from "@/api/client";

export async function fetchLaunchReadiness(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ evaluation: Record<string, unknown> }>("/commerce-readiness/evaluate", {
    params: { companyId, accountType: "grand_king" },
  });
}

export async function fetchLaunchDecision(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ decision: Record<string, unknown> }>("/commerce-readiness/launch-decision", {
    params: { companyId, accountType: "grand_king" },
  });
}

export async function fetchLaunchCommandCenter(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<Record<string, unknown>>("/operation-first-dollar/launch-command-center", {
    params: { companyId },
  });
}

export async function fetchWorkflows(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ workflows: Record<string, unknown>[]; total: number }>(
    "/ecommerce-os/workflows",
    { params: { companyId } },
  );
}

export async function prepareLaunchWorkflow(workflowId: string) {
  return apiRequest<{ workflow: Record<string, unknown>; readiness: Record<string, unknown> }>(
    `/ecommerce-os/workflows/${workflowId}/prepare`,
    { method: "POST" },
  );
}

export async function startLaunchWorkflow(input: {
  companyId?: string;
  brandChoice: string;
  category: string;
}) {
  return apiRequest<{ workflow: Record<string, unknown> }>("/ecommerce-os/workflows/start", {
    method: "POST",
    body: {
      companyId: input.companyId ?? GRAND_KING_COMPANY_ID,
      brandChoice: input.brandChoice,
      category: input.category,
    },
  });
}

/** GKR launch pipeline — register a tracked product candidate (REAL-077 / grand-king-revenue-pipeline). */
export async function registerPipelineProduct(input: {
  companyId?: string;
  title: string;
  category?: string;
  supplierPlatform?: string;
}) {
  return apiRequest<{ product: Record<string, unknown> }>("/grand-king-revenue-pipeline/products", {
    method: "POST",
    body: {
      companyId: input.companyId ?? GRAND_KING_COMPANY_ID,
      title: input.title,
      category: input.category,
      supplierPlatform: input.supplierPlatform,
    },
  });
}

export async function fetchPipelineProducts(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ products: Record<string, unknown>[] }>("/grand-king-revenue-pipeline/products", {
    params: { companyId },
  });
}
