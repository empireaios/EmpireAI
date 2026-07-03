/**
 * G2-05 — Payment registry resolver (REG-PAYMENT, REG-COMMERCE-POLICY, REG-COUNTRY-COMMERCE).
 */

import type {
  CommerceCountryCommerceRow,
  CommercePaymentRow,
  CommercePolicyRow,
} from "../../../../registry/types/commerce-registry-types.js";
import {
  REG_COMMERCE_POLICY,
  REG_COUNTRY_COMMERCE,
  REG_PAYMENT,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import { resolveCommerceRegistry } from "../../registry/commerce-registry-resolver.js";

export type PaymentRegistrySnapshot = {
  payments: CommercePaymentRow[];
  policies: CommercePolicyRow[];
  countryCommerce: CommerceCountryCommerceRow[];
  resolvedAt: string;
  registrySource: "RegistryLoader:REG-PAYMENT|REG-COMMERCE-POLICY|REG-COUNTRY-COMMERCE";
};

export function resolvePaymentRegistrySnapshot(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): PaymentRegistrySnapshot {
  const payments = resolveCommerceRegistry<CommercePaymentRow>(context, REG_PAYMENT, query).rows;
  const policies = resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY).rows;
  const countryCommerce = resolveCommerceRegistry<CommerceCountryCommerceRow>(
    context,
    REG_COUNTRY_COMMERCE,
  ).rows;

  return {
    payments,
    policies,
    countryCommerce,
    resolvedAt: new Date().toISOString(),
    registrySource: "RegistryLoader:REG-PAYMENT|REG-COMMERCE-POLICY|REG-COUNTRY-COMMERCE",
  };
}

export function resolvePaymentRowById(
  context: RegistryLoaderContext,
  providerId: string,
): CommercePaymentRow | undefined {
  const result = resolveCommerceRegistry<CommercePaymentRow>(context, REG_PAYMENT, {
    registryRowId: providerId,
  });
  return result.rows[0];
}

export function resolvePolicyForPayment(
  context: RegistryLoaderContext,
  payment: CommercePaymentRow,
): CommercePolicyRow | undefined {
  if (!payment.policyRef) {
    return undefined;
  }
  const policies = resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY, {
    registryRowId: payment.policyRef,
  }).rows;
  return policies[0];
}

export function resolveCurrenciesForPayment(
  context: RegistryLoaderContext,
  payment: CommercePaymentRow,
): string[] {
  const countries = resolveCommerceRegistry<CommerceCountryCommerceRow>(
    context,
    REG_COUNTRY_COMMERCE,
  ).rows;
  const matched = countries.filter(
    (row) =>
      payment.supportedCountries.includes(row.countryCode) ||
      payment.supportedCountries.includes("*") ||
      row.supportedCountries.includes("*"),
  );
  const currencies = new Set<string>();
  for (const row of matched) {
    for (const code of row.currencyCodes) {
      currencies.add(code);
    }
  }
  return [...currencies];
}
