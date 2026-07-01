import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { apiRequest } from "@/api/client";

export async function fetchOrderPipelines(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ pipelines: Record<string, unknown>[] }>("/customer-orders/pipelines", {
    params: { companyId },
  });
}

export async function fetchOrderPipeline(pipelineId: string) {
  return apiRequest<{ pipeline: Record<string, unknown> }>(
    `/customer-orders/pipelines/${pipelineId}`,
  );
}
