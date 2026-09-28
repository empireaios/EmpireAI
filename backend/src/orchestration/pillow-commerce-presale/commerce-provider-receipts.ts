/** Local provenance for the four responses behind a Pillow approval decision.
 * Hashes and selected fields are persisted with the mapping; provider signatures
 * and settled transaction evidence are separate, later requirements.
 */
import { createHash } from "node:crypto";
import type { CjFreightOption, CjProduct } from "../../suppliers/cj-dropshipping/cj-types.js";
import { cjManagedStockByVid } from "./cj-variant-stock.js";
import { pickLiveCjVariant } from "./cj-live-normalize.js";

export type ProviderEvidenceReceipt = {
  source: "cj.variant" | "cj.stock.queryByVid" | "cj.logistic.freightCalculate" | "amazon.feesEstimate";
  capturedAt: string;
  request: Record<string, string | number>;
  selected: Record<string, string | number>;
  responseSha256: string;
};

export type CommerceProviderReceipts = {
  schemaVersion: 1;
  supplierCost: ProviderEvidenceReceipt;
  supplierStock: ProviderEvidenceReceipt;
  usFreight: ProviderEvidenceReceipt;
  amazonFees: ProviderEvidenceReceipt;
  decisionSha256: string;
};

function digest(value: unknown): string {
  if (value === null || value === undefined) throw new Error("Provider response absent for commerce receipt");
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function fresh(at: string, now: number): void {
  const age = now - Date.parse(at);
  if (!Number.isFinite(age) || age < -60_000 || age > 10 * 60_000) {
    throw new Error("Commerce provider response outside receipt freshness window");
  }
}

export function buildCommerceProviderReceipts(input: {
  marketplaceId: string; sellerId: string; asin: string; cjPid: string; cjVid: string;
  sellingPriceUsd: number; costUsd: number; stockUnits: number;
  shippingUsd: number; freightOption: CjFreightOption | null; feeUsd: number;
  cost: { payload: CjProduct; capturedAt: string };
  stock: { payload: unknown; capturedAt: string };
  freight: { payload: CjFreightOption[]; capturedAt: string };
  fee: { payload: unknown; capturedAt: string };
  now?: number;
}): CommerceProviderReceipts {
  const now = input.now ?? Date.now();
  for (const source of [input.cost, input.stock, input.freight, input.fee]) fresh(source.capturedAt, now);
  if (input.cost.payload.pid !== input.cjPid ||
      pickLiveCjVariant(input.cost.payload, input.cjVid).costUsd !== input.costUsd ||
      cjManagedStockByVid(input.stock.payload, input.cjVid, "CN") !== input.stockUnits ||
      input.stockUnits <= 0 || !input.freightOption?.logisticName?.trim() ||
      !input.freight.payload.some(option => option.logisticName === input.freightOption?.logisticName &&
        option.logisticPrice === input.shippingUsd) ||
      input.freightOption.logisticPrice !== input.shippingUsd) {
    throw new Error("CJ response identity or selected value differs from commerce decision");
  }
  const fee = input.fee.payload as { payload?: { FeesEstimateResult?: {
    FeesEstimateIdentifier?: { MarketplaceId?: string; SellerId?: string; IdValue?: string;
      PriceToEstimateFees?: { ListingPrice?: { Amount?: number; CurrencyCode?: string } } };
    FeesEstimate?: { TotalFeesEstimate?: { Amount?: number; CurrencyCode?: string } };
  } } } | null;
  const result = fee?.payload?.FeesEstimateResult;
  const identifier = result?.FeesEstimateIdentifier;
  if (identifier?.MarketplaceId !== input.marketplaceId || identifier?.SellerId !== input.sellerId ||
      identifier?.IdValue !== input.asin ||
      identifier?.PriceToEstimateFees?.ListingPrice?.CurrencyCode !== "USD" ||
      identifier.PriceToEstimateFees.ListingPrice.Amount !== input.sellingPriceUsd ||
      result?.FeesEstimate?.TotalFeesEstimate?.CurrencyCode !== "USD" ||
      result.FeesEstimate.TotalFeesEstimate.Amount !== input.feeUsd) {
    throw new Error("Amazon fee response differs from commerce decision");
  }
  const supplierCost: ProviderEvidenceReceipt = {
    source: "cj.variant", capturedAt: input.cost.capturedAt,
    request: { pid: input.cjPid, vid: input.cjVid }, selected: { amountUsd: input.costUsd },
    responseSha256: digest(input.cost.payload),
  };
  const supplierStock: ProviderEvidenceReceipt = {
    source: "cj.stock.queryByVid", capturedAt: input.stock.capturedAt,
    request: { vid: input.cjVid, warehouseCountry: "CN" }, selected: { units: input.stockUnits },
    responseSha256: digest(input.stock.payload),
  };
  const usFreight: ProviderEvidenceReceipt = {
    source: "cj.logistic.freightCalculate", capturedAt: input.freight.capturedAt,
    request: { vid: input.cjVid, quantity: 1, origin: "CN", destination: "US" },
    selected: { logisticName: input.freightOption.logisticName!, amountUsd: input.shippingUsd },
    responseSha256: digest(input.freight.payload),
  };
  const amazonFees: ProviderEvidenceReceipt = {
    source: "amazon.feesEstimate", capturedAt: input.fee.capturedAt,
    request: { marketplaceId: input.marketplaceId, sellerId: input.sellerId,
      asin: input.asin, listingPriceUsd: input.sellingPriceUsd },
    selected: { amountUsd: input.feeUsd }, responseSha256: digest(input.fee.payload),
  };
  return { schemaVersion: 1, supplierCost, supplierStock, usFreight, amazonFees,
    decisionSha256: digest({ supplierCost, supplierStock, usFreight, amazonFees }) };
}
