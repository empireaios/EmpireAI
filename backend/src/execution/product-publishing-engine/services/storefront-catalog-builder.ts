import type { LiveStoreAnalytics } from "../../../revenue/minimum-live-revenue-loop/models/live-store-config.js";
import { buildAnalyticsScripts } from "../../../revenue/minimum-live-revenue-loop/services/analytics-injection.js";
import type { PublishedStoreProduct } from "../models/catalog-publish-record.js";

export type StorefrontCatalogInput = {
  storeSlug: string;
  storeBaseUrl: string;
  checkoutPath: string;
  analytics: LiveStoreAnalytics;
  products: PublishedStoreProduct[];
};

function formatPrice(priceCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(priceCents / 100);
}

function availabilityLabel(availability: PublishedStoreProduct["availability"]): string {
  switch (availability) {
    case "IN_STOCK":
      return "In Stock";
    case "LOW_STOCK":
      return "Low Stock";
    case "OUT_OF_STOCK":
      return "Out of Stock";
    default:
      return "Unavailable";
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Builds machine-readable catalog JSON for deployed storefronts. */
export function buildCatalogJson(products: PublishedStoreProduct[]): string {
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    products: products.map((product) => ({
      handle: product.storeProductHandle,
      title: product.title,
      description: product.description,
      priceCents: product.priceCents,
      compareAtPriceCents: product.compareAtPriceCents,
      currency: product.currency,
      inventoryQuantity: product.inventoryQuantity,
      availability: product.availability,
      supplierSku: product.supplierSku,
      pageRoute: product.pageRoute,
      publishedProductId: product.publishedProductId,
    })),
  };

  return JSON.stringify(payload, null, 2);
}

/** Regenerates multi-product storefront HTML for a deployed catalog. */
export function buildCatalogStorefrontHtml(input: StorefrontCatalogInput): string {
  const primary = input.products[0];
  const title = primary ? primary.title : "Grand King's Store";
  const analyticsScripts = buildAnalyticsScripts(input.analytics);

  const productCards = input.products
    .map((product) => {
      const price = formatPrice(product.priceCents, product.currency);
      const compare =
        product.compareAtPriceCents !== null
          ? `<span class="compare">${formatPrice(product.compareAtPriceCents, product.currency)}</span>`
          : "";
      const disabled =
        product.availability === "OUT_OF_STOCK" || product.availability === "UNAVAILABLE";

      return `<article class="product-card" data-handle="${escapeHtml(product.storeProductHandle)}">
  <h2>${escapeHtml(product.title)}</h2>
  <div class="price-row">${price}${compare}</div>
  <p>${escapeHtml(product.description)}</p>
  <div class="meta">${availabilityLabel(product.availability)} · SKU ${escapeHtml(product.supplierSku)}</div>
  ${
    disabled
      ? `<span class="cta disabled">Currently Unavailable</span>`
      : `<a class="cta" href="${escapeHtml(input.checkoutPath)}?product=${encodeURIComponent(product.storeProductHandle)}" data-price-cents="${product.priceCents}">Buy Now</a>`
  }
</article>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — Grand King's Store</title>
  ${analyticsScripts}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f0f12; color: #f5f5f7; min-height: 100vh; }
    .wrap { max-width: 960px; margin: 0 auto; padding: 48px 24px; }
    .badge { display: inline-block; background: #2d2d35; color: #a78bfa; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 999px; margin-bottom: 16px; }
    h1 { font-size: 2rem; margin-bottom: 24px; }
    .grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .product-card { background: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 20px; }
    .product-card h2 { font-size: 1.25rem; margin-bottom: 8px; }
    .price-row { font-size: 1.4rem; font-weight: 700; color: #34d399; margin-bottom: 10px; }
    .compare { margin-left: 8px; color: #71717a; font-size: 0.95rem; text-decoration: line-through; }
    .product-card p { color: #a1a1aa; line-height: 1.5; margin-bottom: 12px; min-height: 48px; }
    .meta { font-size: 12px; color: #71717a; margin-bottom: 14px; }
    .cta { display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; text-decoration: none; font-weight: 600; padding: 10px 18px; border-radius: 10px; font-size: 0.95rem; }
    .cta.disabled { background: #3f3f46; color: #a1a1aa; }
    footer { margin-top: 48px; font-size: 12px; color: #52525b; }
  </style>
</head>
<body>
  <div class="wrap">
    <span class="badge">Grand King's Account — Published Catalog</span>
    <h1>Shop the Collection</h1>
    <div class="grid">
      ${productCards}
    </div>
    <footer>Powered by EmpireAI · ${escapeHtml(input.storeBaseUrl)}/store/${escapeHtml(input.storeSlug)}</footer>
  </div>
  <script>
    document.querySelectorAll('.cta[data-price-cents]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var cents = Number(btn.getAttribute('data-price-cents') || 0);
        var value = (cents / 100).toFixed(2);
        if (typeof gtag === 'function') gtag('event', 'begin_checkout', { currency: '${primary?.currency ?? "USD"}', value: value });
        if (typeof fbq === 'function') fbq('track', 'InitiateCheckout', { currency: '${primary?.currency ?? "USD"}', value: value });
        if (typeof ttq === 'object' && ttq.track) ttq.track('InitiateCheckout', { currency: '${primary?.currency ?? "USD"}', value: value });
      });
    });
  </script>
</body>
</html>`;
}
