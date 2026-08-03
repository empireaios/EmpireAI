/** X1-08 — Product Discovery Engine (structural signals only). */

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
}

export class ProductDiscoveryEngine {
  discover(industry: string, count = 5): string {
    const base = slugify(industry);
    const products = Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      return `structural://product/${base}-${n}`;
    });
    return products.join(" | ");
  }
}
