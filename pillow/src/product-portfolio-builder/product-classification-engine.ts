/** X1-08 — Product Classification Engine (structural signals only). */

export class ProductClassificationEngine {
  categorize(industry: string, productReferences: string): string {
    const count = productReferences.split("|").filter(Boolean).length || 1;
    const token = industry.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "general";
    return [
      `${token}/core (${Math.max(1, Math.ceil(count * 0.4))})`,
      `${token}/adjacent (${Math.max(1, Math.ceil(count * 0.3))})`,
      `${token}/experimental (${Math.max(1, Math.floor(count * 0.3))})`,
    ].join(" | ");
  }

  rank(productReferences: string, profitability: number, demand: number): string {
    const products = productReferences
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);
    if (products.length === 0) return "no-products";
    const weight = Math.round((profitability + demand) / 2);
    return products
      .map((p, i) => `${i + 1}:${p}(score=${Math.max(1, weight - i * 3)})`)
      .join(" > ");
  }
}
