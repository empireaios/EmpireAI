import { DEFAULT_CURRENCY } from "./paths.js";
import { basisPointsToPercent, moneyRatioBasisPoints } from "./money.js";
import type { CostCategory, FinancialLineItem } from "./types.js";

export function normalizeCurrency(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim().toUpperCase();
  return trimmed || fallback || DEFAULT_CURRENCY;
}

/** Filter financial line items to a single business/project/product scope and currency — pure, no fabrication. */
export function filterLineItemsForScope(
  items: readonly FinancialLineItem[],
  filter: { businessId?: string | null; projectId?: string | null; productId?: string | null; currency?: string | null },
): FinancialLineItem[] {
  return items.filter((item) => {
    if (filter.businessId && item.businessId !== filter.businessId) return false;
    if (filter.projectId && item.projectId !== filter.projectId) return false;
    if (filter.productId && item.productId !== filter.productId) return false;
    if (filter.currency && item.currency !== filter.currency) return false;
    return true;
  });
}

/** Sum integer minor units for a single category within an already currency-filtered set of line items. */
export function sumCategoryMinor(items: readonly FinancialLineItem[], category: CostCategory, currency: string): number {
  return items
    .filter((item) => item.category === category && item.currency === currency)
    .reduce((sum, item) => sum + item.amountMinor, 0);
}

/**
 * Margin percentage derived exclusively from integer basis points
 * (`(|profit|*10000)/|base|`, floored, then divided by 100 for display) —
 * never from a floating-point multiplication of two money amounts. Sign
 * follows the profit numerator. Returns null when the base is zero rather
 * than fabricating a ratio.
 */
export function computeMarginPercent(profitMinor: number, baseMinor: number): number | null {
  if (baseMinor === 0) return null;
  const basisPoints = moneyRatioBasisPoints(Math.abs(profitMinor), Math.abs(baseMinor));
  if (basisPoints === null) return null;
  const percent = basisPointsToPercent(basisPoints);
  return profitMinor < 0 ? -percent : percent;
}

export type TaxProvisionResult = {
  taxMinor: number;
  rateBpsUsed: number | null;
  estimated: boolean;
  issues: string[];
};

/**
 * Resolve the tax provision for a scope. Explicit, realised `tax` category
 * line items always take precedence. Only when none are present, and only
 * when the caller explicitly supplied a positive `taxRateBps`, is a tax
 * amount derived from that rate applied to a positive operating profit
 * (`floor(operatingProfit * taxRateBps / 10000)`) — this rate is always the
 * one the caller supplied, never a silently-invented default. When neither
 * explicit tax evidence nor a rate is available, tax is recorded as zero
 * and flagged as an outstanding issue rather than fabricated.
 */
export function computeTaxProvision(params: {
  operatingProfitMinor: number;
  explicitTaxMinor: number;
  hasExplicitTaxLineItems: boolean;
  taxRateBps: number | null | undefined;
}): TaxProvisionResult {
  const { operatingProfitMinor, explicitTaxMinor, hasExplicitTaxLineItems, taxRateBps } = params;

  if (hasExplicitTaxLineItems) {
    return { taxMinor: explicitTaxMinor, rateBpsUsed: null, estimated: false, issues: [] };
  }

  if (typeof taxRateBps === "number" && Number.isFinite(taxRateBps) && taxRateBps > 0) {
    if (operatingProfitMinor > 0) {
      const taxMinor = Math.trunc((operatingProfitMinor * taxRateBps) / 10000);
      return { taxMinor, rateBpsUsed: taxRateBps, estimated: true, issues: [] };
    }
    return {
      taxMinor: 0,
      rateBpsUsed: null,
      estimated: false,
      issues: [
        "taxRateBps was provided but operating profit is not positive — no tax provision was derived from it; recorded as zero.",
      ],
    };
  }

  return {
    taxMinor: 0,
    rateBpsUsed: null,
    estimated: false,
    issues: [
      "No realised tax line items and no explicit taxRateBps were provided — tax provision recorded as zero pending real tax data.",
    ],
  };
}

export function computeConfidenceScore(params: {
  hasLineItems: boolean;
  outstandingIssueCount: number;
  allRealised: boolean;
  taxResolvedFromEvidence: boolean;
}): number {
  const checks: boolean[] = [
    params.hasLineItems,
    params.outstandingIssueCount === 0,
    params.allRealised,
    params.taxResolvedFromEvidence,
  ];
  const weight = 100 / checks.length;
  let score = 0;
  for (const ok of checks) if (ok) score += weight;
  return Math.min(100, Math.round(score));
}

/** Deterministic reporting-period label — never invented from a calendar assumption; falls back to an explicit "unspecified" marker. */
export function resolveReportingPeriodLabel(input: string | null | undefined): string {
  const trimmed = input?.trim();
  return trimmed || "unspecified";
}

/** Distinct, real scope identifiers (business/project/product) present in a set of verified line items — never invented. */
export function distinctScopeIds(
  items: readonly FinancialLineItem[],
  dimension: "businessId" | "projectId" | "productId",
): string[] {
  const set = new Set<string>();
  for (const item of items) {
    const value = item[dimension];
    if (value) set.add(value);
  }
  return [...set].sort();
}
