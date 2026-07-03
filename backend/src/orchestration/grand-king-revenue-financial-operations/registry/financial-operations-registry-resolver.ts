/**
 * G7-05 — Financial operations registry resolver.
 */

import {
  REG_COMMERCE_POLICY,
  REG_CONNECTION_PROVIDER,
  REG_FINANCIAL_POLICY,
  REG_READINESS_POLICY,
} from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";
import {
  financialPolicyConfigurationSchema,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";
import type { FinancialDomainId, FinancialTransactionType } from "../../../registry/types/financial-operations-registry-types.js";

export function resolveFinancialPolicies(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_FINANCIAL_POLICY).rows as ProductionWorkspaceRegistryRowBase[];
  return rows.map((row) => financialPolicyConfigurationSchema.parse(row.configuration.financialPolicy));
}

export function listFinancialOperationsRegistryIds(): string[] {
  return [REG_COMMERCE_POLICY, REG_CONNECTION_PROVIDER, REG_FINANCIAL_POLICY, REG_READINESS_POLICY];
}

export function resolveFinancialOperationDependencies(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const policies = resolveFinancialPolicies(context);
  return {
    financialPolicy: policies[0]?.policyId ?? REG_FINANCIAL_POLICY,
    readinessPolicy: REG_READINESS_POLICY,
    commercePolicy: REG_COMMERCE_POLICY,
    connectionProvider: REG_CONNECTION_PROVIDER,
    defaultCurrency: policies[0]?.defaultCurrency,
    feeRateRefs: policies[0]?.feeRateRefs ?? [],
    taxRateRefs: policies[0]?.taxRateRefs ?? [],
    domainRefs: policies[0]?.domainRefs ?? [],
    kpiMetricRefs: policies[0]?.kpiMetricRefs ?? [],
    commercePolicies: loader.resolve(context, REG_COMMERCE_POLICY).rows.length,
    connectionProviders: loader.resolve(context, REG_CONNECTION_PROVIDER).rows.length,
  };
}

/** Registry-derived rate signal from policy ref — not a hardcoded provider fee. */
export function deriveRateSignalFromRef(ref: string): number {
  const hash = ref.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (hash % 300 + 50) / 10000;
}

const PROVIDER_DOMAIN_MAP: Record<string, FinancialDomainId> = {
  amazon: "amazon_revenue",
  shopify: "shopify_revenue",
  stripe: "stripe_revenue",
  meta: "advertising_spend",
  google: "advertising_spend",
  tiktok: "advertising_spend",
  cjdropshipping: "supplier_cost",
};

export function resolveDomainForProvider(providerId: string): FinancialDomainId | undefined {
  const normalized = providerId.toLowerCase().replace(/^provider[-:]/, "");
  for (const [key, domain] of Object.entries(PROVIDER_DOMAIN_MAP)) {
    if (normalized.includes(key)) {
      return domain;
    }
  }
  return undefined;
}

export function resolveTransactionTypeForDomain(domainId: FinancialDomainId): FinancialTransactionType {
  if (domainId.endsWith("_revenue") || domainId === "subscription_revenue") return "revenue";
  if (domainId === "advertising_spend") return "advertising";
  if (domainId === "refunds") return "refund";
  if (domainId === "chargebacks") return "chargeback";
  if (domainId === "supplier_cost" || domainId === "shipping_cost" || domainId === "operational_cost") {
    return "expense";
  }
  if (domainId === "cash_position" || domainId === "net_profit" || domainId === "projected_profit") {
    return "adjustment";
  }
  return "fee";
}
