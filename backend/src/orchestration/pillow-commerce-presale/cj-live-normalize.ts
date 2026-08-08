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

export function listCjVariants(product: CjProduct): CjProductVariant[] {
  const fromVariants = Array.isArray(product.variants) ? product.variants : [];
  const fromList = Array.isArray(product.variantList) ? product.variantList : [];
  return [...fromVariants, ...fromList].filter((v) => v && (v.vid || v.sku));
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
  return (
    coerceUsdNumber(product.sellPrice) ??
    coerceUsdNumber(product.productPrice) ??
    coerceUsdNumber(product.nowPrice) ??
    coerceUsdNumber(product.discountPrice) ??
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
          sku: variant.sku || (variant as { variantSku?: string }).variantSku || variant.vid,
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
        sku: v.sku || (v as { variantSku?: string }).variantSku || v.vid,
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
