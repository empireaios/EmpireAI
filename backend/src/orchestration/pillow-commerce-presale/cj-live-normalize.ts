import type { CjProduct, CjProductVariant } from "../../suppliers/cj-dropshipping/cj-types.js";

export function coerceUsdNumber(value: unknown): number | null {
  // CJ product summaries may contain ranges. Stripping punctuation could turn
  // "3.20-5.00" into a plausible but fabricated price; accept exact USD cents.
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = String(value).trim();
  if (!/^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/.test(raw)) return null;
  const amount = Number(raw);
  return Number.isSafeInteger(Math.round(amount * 100)) && amount > 0 ? amount : null;
}

export function asCjVariantArray(value: unknown): CjProductVariant[] {
  if (!Array.isArray(value)) return [];
  const out: CjProductVariant[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const vid = typeof row.vid === "string" ? row.vid.trim() : "";
    const sku = String(row.sku ?? row.variantSku ?? vid).trim();
    if (!vid) continue; // SKU and PID must never masquerade as CJ's variant ID.
    const variantSellPrice = coerceUsdNumber(row.variantSellPrice) ?? undefined;
    out.push({
      vid,
      sku: sku || vid,
      variantSellPrice,
      suggestSellPrice:
        coerceUsdNumber(row.suggestSellPrice) ??
        coerceUsdNumber(row.variantSugSellPrice) ??
        undefined,
      inventory: typeof row.inventory === "number" ? row.inventory : undefined,
    });
  }
  return out;
}

export function listCjVariants(product: CjProduct): CjProductVariant[] {
  const raw = product as CjProduct & { variantList?: unknown };
  const fromVariants = asCjVariantArray(raw.variants);
  const fromList = asCjVariantArray(raw.variantList);
  return [...fromVariants, ...fromList].filter((v) => Boolean(v.vid || v.sku));
}

/** Merge a raw CJ variant/query payload into a product for cost/identity extraction. */
export function mergeCjVariantQueryIntoProduct(product: CjProduct, variantPayload: unknown): CjProduct {
  let variants: CjProductVariant[] = [];
  if (Array.isArray(variantPayload)) {
    variants = asCjVariantArray(variantPayload);
  } else if (variantPayload && typeof variantPayload === "object") {
    const row = variantPayload as Record<string, unknown>;
    variants = asCjVariantArray(
      row.variants ?? row.variantList ?? row.list ?? row.data ?? variantPayload,
    );
  }
  if (variants.length === 0) return product;
  return {
    ...product,
    variants: [...listCjVariants(product), ...variants],
  };
}

export function extractCjVariantCostUsd(variant: CjProductVariant): number | null {
  return coerceUsdNumber(variant.variantSellPrice);
}

export function extractCjProductCostUsd(product: CjProduct): number | null {
  const raw = product as CjProduct & Record<string, unknown>;
  return (
    coerceUsdNumber(raw.sellPrice) ??
    coerceUsdNumber(raw.productPrice) ??
    coerceUsdNumber(raw.nowPrice) ??
    coerceUsdNumber(raw.discountPrice) ??
    null
  );
}

export function pickLiveCjVariant(product: CjProduct, requiredVid?: string): {
  variant: CjProductVariant | null;
  costUsd: number | null;
} {
  const variants = listCjVariants(product).filter(v => !requiredVid || v.vid === requiredVid);
  for (const variant of variants) {
    const cost = extractCjVariantCostUsd(variant);
    const sameVidCosts = variants.filter(v => v.vid === variant.vid).map(extractCjVariantCostUsd).filter(v => v !== null);
    if (cost !== null && variant.vid && sameVidCosts.every(other => other === cost)) {
      return {
        variant: {
          ...variant,
          sku: variant.sku || variant.vid,
          variantSellPrice: cost,
          suggestSellPrice:
            coerceUsdNumber(variant.suggestSellPrice) ??
            coerceUsdNumber(variant.variantSugSellPrice) ??
            undefined,
        },
        costUsd: cost,
      };
    }
  }

  return { variant: null, costUsd: null };
}

export function summarizeCjPriceFields(product: CjProduct): Record<string, unknown> {
  const variants = listCjVariants(product).slice(0, 3).map((v) => ({
    vid: v.vid,
    sku: v.sku,
    sellPrice: v.sellPrice ?? null,
    variantSellPrice: v.variantSellPrice ?? null,
    price: v.price ?? null,
  }));
  const raw = product as CjProduct & Record<string, unknown>;
  return {
    sellPrice: raw.sellPrice ?? null,
    productPrice: raw.productPrice ?? null,
    nowPrice: raw.nowPrice ?? null,
    discountPrice: raw.discountPrice ?? null,
    variantCount: listCjVariants(product).length,
    variants,
  };
}
