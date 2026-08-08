import type { CjProduct, CjProductVariant } from "../../suppliers/cj-dropshipping/cj-types.js";

export function coerceUsdNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "").trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export function asCjVariantArray(value: unknown): CjProductVariant[] {
  if (!Array.isArray(value)) return [];
  const out: CjProductVariant[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const vid = String(row.vid ?? row.variantId ?? "").trim();
    const sku = String(row.sku ?? row.variantSku ?? vid).trim();
    if (!vid && !sku) continue;
    const sellPrice =
      coerceUsdNumber(row.sellPrice) ??
      coerceUsdNumber(row.variantSellPrice) ??
      coerceUsdNumber(row.price) ??
      undefined;
    out.push({
      vid: vid || sku,
      sku: sku || vid,
      sellPrice,
      variantSellPrice: coerceUsdNumber(row.variantSellPrice) ?? undefined,
      price: coerceUsdNumber(row.price) ?? undefined,
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
  return (
    coerceUsdNumber(variant.sellPrice) ??
    coerceUsdNumber(variant.variantSellPrice) ??
    coerceUsdNumber(variant.price) ??
    null
  );
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

export function pickLiveCjVariant(product: CjProduct): {
  variant: CjProductVariant | null;
  costUsd: number | null;
} {
  const variants = listCjVariants(product);
  for (const variant of variants) {
    const cost = extractCjVariantCostUsd(variant);
    if (cost !== null && variant.vid) {
      return {
        variant: {
          ...variant,
          sku: variant.sku || variant.vid,
          sellPrice: cost,
          suggestSellPrice:
            coerceUsdNumber(variant.suggestSellPrice) ??
            coerceUsdNumber(variant.variantSugSellPrice) ??
            undefined,
        },
        costUsd: cost,
      };
    }
  }

  const productCost = extractCjProductCostUsd(product);
  if (productCost !== null && variants[0]?.vid) {
    const v = variants[0];
    return {
      variant: {
        ...v,
        sku: v.sku || v.vid,
        sellPrice: productCost,
      },
      costUsd: productCost,
    };
  }

  if (productCost !== null) {
    return {
      variant: {
        vid: product.pid,
        sku: product.productSku || product.pid,
        sellPrice: productCost,
        suggestSellPrice: coerceUsdNumber(product.suggestSellPrice) ?? undefined,
      },
      costUsd: productCost,
    };
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
