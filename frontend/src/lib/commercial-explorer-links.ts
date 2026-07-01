import type { ExplorationDimension } from "@/api/commercial-explorer";
import { paths } from "@/routes/paths";

const DIMENSION_LABELS: Record<ExplorationDimension, string> = {
  country: "Country",
  marketplace: "Marketplace",
  supplier: "Supplier",
  category: "Category",
  product: "Product",
};

/** Owner screen for each REAL-066 entity dimension — one-click deep link (UX-023). */
export function entityOwnerPath(dimension: ExplorationDimension, itemId: string): string {
  switch (dimension) {
    case "country":
    case "marketplace":
      return paths.dashboard.marketplaces;
    case "supplier":
      return paths.dashboard.suppliers;
    case "category":
      return paths.dashboard.expansion;
    case "product": {
      const productId = itemId.replace(/^product-/, "");
      if (productId && productId !== itemId) {
        return `${paths.dashboard.launch}?product=${encodeURIComponent(productId)}`;
      }
      return paths.dashboard.launch;
    }
    default:
      return paths.dashboard.explorer;
  }
}

export function dimensionLabel(dimension: ExplorationDimension): string {
  return DIMENSION_LABELS[dimension] ?? dimension;
}

export function ownerScreenLabel(dimension: ExplorationDimension): string {
  switch (dimension) {
    case "country":
    case "marketplace":
      return "Marketplace Intelligence";
    case "supplier":
      return "Supplier Intelligence";
    case "category":
      return "Expansion";
    case "product":
      return "Launch Mission";
    default:
      return "Commercial Explorer";
  }
}
