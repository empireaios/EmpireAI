import { apiRequest } from "@/api/client";
import { brainDispatch } from "@/api/dispatch";

export interface BillingRevenueSummary {
  workspaceId: string;
  totalRevenueCents: number;
  totalPayments: number;
  succeededPayments: number;
  currency: string;
  ledgerSaleCount: number;
}

export interface BillingSettingsView {
  account?: { name?: string; email?: string };
  workspace?: { name?: string; plan?: string; companies?: number };
}

export async function fetchBillingRevenue(companyId?: string) {
  return apiRequest<BillingRevenueSummary>("/live-payments/revenue", {
    params: companyId ? { companyId } : undefined,
  });
}

export async function fetchBillingPayments(companyId?: string) {
  return apiRequest<{ payments: Record<string, unknown>[] }>("/live-payments/payments", {
    params: companyId ? { companyId } : undefined,
  });
}

/** Subscription plan + workspace context — settings module (billing module companion). */
export async function fetchBillingSettings(companyId: string) {
  return brainDispatch<BillingSettingsView>("settings", "load", companyId);
}
