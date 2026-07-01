import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { apiRequest } from "@/api/client";

export async function fetchDiscoveryDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/product-discovery/dashboard", {
    params: { companyId },
  });
}

export async function fetchDiscoverySessions(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ sessions: Record<string, unknown>[]; total: number }>(
    "/product-discovery/sessions",
    { params: { companyId } },
  );
}

export async function startDiscoverySession(input: {
  companyId?: string;
  brand: string;
  category: string;
  targetMarket?: string;
}) {
  return apiRequest<{ session: Record<string, unknown> }>("/product-discovery/sessions/start", {
    method: "POST",
    body: {
      companyId: input.companyId ?? GRAND_KING_COMPANY_ID,
      brand: input.brand,
      category: input.category,
      targetMarket: input.targetMarket ?? "US",
      existingSupplierNetwork: ["cj-dropshipping"],
    },
  });
}

export async function runDiscovery(sessionId: string) {
  return apiRequest<{ session: Record<string, unknown> }>(
    `/product-discovery/sessions/${sessionId}/discover`,
    { method: "POST" },
  );
}

export async function approveDiscoveryProducts(sessionId: string, productIds: string[]) {
  return apiRequest<{ session: Record<string, unknown> }>(
    `/product-discovery/sessions/${sessionId}/approve`,
    { method: "POST", body: { productIds } },
  );
}
