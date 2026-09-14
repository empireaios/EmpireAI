import { eligibilityFromProduct } from "./eligibility.js";
import { moneyRound } from "./ledger.js";
import type {
  CostCentre,
  PortfolioCandidate,
  PortfolioState,
  SyntheticAmazonUsCatalog,
  SyntheticExperimentRecord,
  SyntheticOrder,
  SyntheticProduct,
  SyntheticStockSnapshot,
  SyntheticSupplier,
  SyntheticWarehouse,
  TrueProfitLedgerEntry,
  UnitEconomics,
} from "./types.js";
import { SYNTHETIC_MARKETPLACE } from "./types.js";
import { unitEconomicsFromProduct } from "./unit-economics.js";

function buildSuppliers(): SyntheticSupplier[] {
  return [
    {
      supplierId: "sup-synth-cj-us-corridor",
      name: "Synth CJ Mirror (US corridor)",
      originCountry: "CN",
      synthetic: true,
      apiCapabilities: [
        {
          capabilityId: "cap-stock",
          name: "stock_query",
          supportsStockQuery: true,
          supportsPriceQuery: true,
          supportsOrderCreate: true,
          supportsTracking: true,
          synthetic: true,
        },
        {
          capabilityId: "cap-price",
          name: "price_query",
          supportsStockQuery: false,
          supportsPriceQuery: true,
          supportsOrderCreate: false,
          supportsTracking: false,
          synthetic: true,
        },
      ],
    },
    {
      supplierId: "sup-synth-generic-sg",
      name: "Synth Generic SG Ops Vendor",
      originCountry: "SG",
      synthetic: true,
      apiCapabilities: [
        {
          capabilityId: "cap-ops-only",
          name: "ops_catalog",
          supportsStockQuery: true,
          supportsPriceQuery: true,
          supportsOrderCreate: false,
          supportsTracking: false,
          synthetic: true,
        },
      ],
    },
  ];
}

function buildWarehouses(): SyntheticWarehouse[] {
  return [
    {
      warehouseId: "wh-synth-cn-east",
      supplierId: "sup-synth-cj-us-corridor",
      region: "CN-EAST",
      country: "CN",
      processingDays: 2,
      synthetic: true,
    },
    {
      warehouseId: "wh-synth-us-west-buffer",
      supplierId: "sup-synth-cj-us-corridor",
      region: "US-WEST",
      country: "US",
      processingDays: 1,
      synthetic: true,
    },
  ];
}

function buildProducts(): SyntheticProduct[] {
  return [
    {
      productId: "prod-synth-desk-fan",
      title: "Synthetic High-Speed Desk Fan",
      asin: "B0SYNTHFAN1",
      supplierId: "sup-synth-cj-us-corridor",
      warehouseId: "wh-synth-cn-east",
      category: "Home & Kitchen",
      listPriceUsd: 24.21,
      amazonReferralFeeUsd: 3.63,
      fbaOrSellerFeeUsd: 0.0,
      shippingEstimateUsd: 8.3,
      deliveryDaysMin: 5,
      deliveryDaysMax: 10,
      expectedRefundRate: 0.05,
      adsSpendPerUnitUsd: 1.2,
      amazonEligibility: {
        policyClear: true,
        ipClear: true,
        approvalRequired: false,
        restrictedCategory: false,
      },
      variants: [
        {
          variantId: "var-fan-black",
          sku: "SYN-FAN-BLK",
          attributes: { color: "black" },
          unitProductCostUsd: 4.21,
          stockUnits: 500,
        },
        {
          variantId: "var-fan-white",
          sku: "SYN-FAN-WHT",
          attributes: { color: "white" },
          unitProductCostUsd: 4.35,
          stockUnits: 120,
        },
      ],
      synthetic: true,
    },
    {
      productId: "prod-synth-brand-gated",
      title: "Synthetic Brand-Gated Power Bank",
      asin: "B0SYNTHBRAND",
      supplierId: "sup-synth-cj-us-corridor",
      warehouseId: "wh-synth-cn-east",
      category: "Electronics",
      listPriceUsd: 39.99,
      amazonReferralFeeUsd: 5.99,
      fbaOrSellerFeeUsd: 2.5,
      shippingEstimateUsd: 6.5,
      deliveryDaysMin: 7,
      deliveryDaysMax: 14,
      expectedRefundRate: 0.08,
      adsSpendPerUnitUsd: 2.0,
      amazonEligibility: {
        policyClear: true,
        ipClear: false,
        approvalRequired: true,
        restrictedCategory: false,
      },
      variants: [
        {
          variantId: "var-pb-10k",
          sku: "SYN-PB-10K",
          attributes: { capacity: "10000mAh" },
          unitProductCostUsd: 12.0,
          stockUnits: 0,
        },
      ],
      synthetic: true,
    },
    {
      productId: "prod-synth-cable-organizer",
      title: "Synthetic Cable Organizer Kit",
      asin: "B0SYNTHCABLE",
      supplierId: "sup-synth-cj-us-corridor",
      warehouseId: "wh-synth-us-west-buffer",
      category: "Office Products",
      listPriceUsd: 15.99,
      amazonReferralFeeUsd: 2.4,
      fbaOrSellerFeeUsd: 0.5,
      shippingEstimateUsd: 3.2,
      deliveryDaysMin: 2,
      deliveryDaysMax: 5,
      expectedRefundRate: 0.03,
      adsSpendPerUnitUsd: 0.8,
      amazonEligibility: {
        policyClear: true,
        ipClear: true,
        approvalRequired: false,
        restrictedCategory: false,
      },
      variants: [
        {
          variantId: "var-cable-std",
          sku: "SYN-CABLE-STD",
          attributes: { pack: "standard" },
          unitProductCostUsd: 2.1,
          stockUnits: 800,
        },
      ],
      synthetic: true,
    },
  ];
}

function buildStock(products: SyntheticProduct[]): SyntheticStockSnapshot[] {
  const rows: SyntheticStockSnapshot[] = [];
  for (const product of products) {
    for (const variant of product.variants) {
      const reserved = variant.stockUnits > 0 ? Math.min(5, variant.stockUnits) : 0;
      rows.push({
        productId: product.productId,
        variantId: variant.variantId,
        warehouseId: product.warehouseId,
        onHand: variant.stockUnits,
        reserved,
        available: Math.max(0, variant.stockUnits - reserved),
        synthetic: true,
      });
    }
  }
  return rows;
}

function buildOrders(): SyntheticOrder[] {
  return [
    {
      orderId: "ord-synth-1001",
      productId: "prod-synth-desk-fan",
      variantId: "var-fan-black",
      quantity: 1,
      revenueUsd: 24.21,
      status: "delivered",
      fulfilmentOutcome: "ok",
      cancelled: false,
      refundUsd: 0,
      returnCostUsd: 0,
      synthetic: true,
    },
    {
      orderId: "ord-synth-1002",
      productId: "prod-synth-desk-fan",
      variantId: "var-fan-black",
      quantity: 1,
      revenueUsd: 24.21,
      status: "refunded",
      fulfilmentOutcome: "returned",
      cancelled: false,
      refundUsd: 24.21,
      returnCostUsd: 3.5,
      synthetic: true,
    },
    {
      orderId: "ord-synth-1003",
      productId: "prod-synth-cable-organizer",
      variantId: "var-cable-std",
      quantity: 2,
      revenueUsd: 31.98,
      status: "fulfilled",
      fulfilmentOutcome: "ok",
      cancelled: false,
      refundUsd: 0,
      returnCostUsd: 0,
      synthetic: true,
    },
    {
      orderId: "ord-synth-1004",
      productId: "prod-synth-cable-organizer",
      variantId: "var-cable-std",
      quantity: 1,
      revenueUsd: 15.99,
      status: "cancelled",
      fulfilmentOutcome: "cancelled",
      cancelled: true,
      refundUsd: 15.99,
      returnCostUsd: 0,
      synthetic: true,
    },
  ];
}

function buildCostCentres(): CostCentre[] {
  return [
    {
      id: "cc-ai-api",
      kind: "ai_api",
      label: "LLM inference (synthetic playground)",
      amount: 42.5,
      currency: "SGD",
      sourceLabel: "synthetic",
      period: "2026-09",
    },
    {
      id: "cc-infra",
      kind: "infra",
      label: "Compute / hosting allocation",
      amount: 18.0,
      currency: "SGD",
      sourceLabel: "synthetic",
      period: "2026-09",
    },
    {
      id: "cc-storage",
      kind: "storage",
      label: "Object storage",
      amount: 4.25,
      currency: "SGD",
      sourceLabel: "verified",
      period: "2026-09",
      notes: "Invoice-backed fixture amount; still playground-only spend",
    },
    {
      id: "cc-saas",
      kind: "saas",
      label: "Observability SaaS",
      amount: 12.0,
      currency: "SGD",
      sourceLabel: "synthetic",
      period: "2026-09",
    },
    {
      id: "cc-marketplace",
      kind: "marketplace",
      label: "Amazon US subscription (synthetic)",
      amount: 39.99,
      currency: "USD",
      sourceLabel: "synthetic",
      period: "2026-09",
    },
    {
      id: "cc-other",
      kind: "other",
      label: "Misc ops buffer",
      amount: 5.0,
      currency: "SGD",
      sourceLabel: "synthetic",
      period: "2026-09",
    },
  ];
}

function orderToLedgerEntry(order: SyntheticOrder, products: SyntheticProduct[]): TrueProfitLedgerEntry {
  const product = products.find((p) => p.productId === order.productId);
  if (!product) {
    throw new Error(`Missing product for order ${order.orderId}`);
  }
  const variant = product.variants.find((v) => v.variantId === order.variantId);
  if (!variant) {
    throw new Error(`Missing variant for order ${order.orderId}`);
  }
  const qty = order.cancelled ? 0 : order.quantity;
  const productCost = moneyRound(variant.unitProductCostUsd * qty);
  const shipping = moneyRound(product.shippingEstimateUsd * qty);
  const fees = moneyRound((product.amazonReferralFeeUsd + product.fbaOrSellerFeeUsd) * qty);
  const ads = moneyRound(product.adsSpendPerUnitUsd * qty);
  const revenue = order.cancelled ? 0 : moneyRound(order.revenueUsd);
  return {
    entryId: `led-${order.orderId}`,
    synthetic: true,
    currency: "USD",
    productId: order.productId,
    orderId: order.orderId,
    revenue,
    productCost,
    shipping,
    fees,
    ads,
    refunds: moneyRound(order.refundUsd),
    returns: moneyRound(order.returnCostUsd),
    opex: 0,
  };
}

function buildPortfolio(
  products: SyntheticProduct[],
  unitEconomics: UnitEconomics[],
  eligibility: ReturnType<typeof eligibilityFromProduct>[],
): PortfolioState {
  const candidates: PortfolioCandidate[] = products.map((product) => {
    const elig = eligibility.find((e) => e.productId === product.productId);
    const ue = unitEconomics.find((u) => u.productId === product.productId);
    const realised = ue?.realisedContribution ?? 0;
    let state: PortfolioCandidate["state"] = "hold";
    if (!elig?.eligible) state = "kill";
    else if (realised >= 6) state = "scale";
    else if (realised >= 3) state = "test";
    else if (realised >= 0) state = "watch";
    else state = "kill";
    return {
      productId: product.productId,
      state,
      eligible: elig?.eligible ?? false,
      realisedContributionUsd: realised,
    };
  });

  const count = (s: PortfolioCandidate["state"]) => candidates.filter((c) => c.state === s).length;
  return {
    portfolioId: "port-synth-amazon-us-v1",
    marketplace: SYNTHETIC_MARKETPLACE,
    synthetic: true,
    currency: "USD",
    candidates,
    totals: {
      candidateCount: candidates.length,
      killCount: count("kill"),
      watchCount: count("watch"),
      testCount: count("test"),
      scaleCount: count("scale"),
      holdCount: count("hold"),
    },
  };
}

function buildExperiments(): SyntheticExperimentRecord[] {
  return [
    {
      experimentId: "exp-synth-fan-price-band",
      hypothesis: "Desk fan remains contribution-positive at $24.21 with 5% refund rate",
      corridor: "sup-synth-cj-us-corridor → amazon-us",
      marketplace: SYNTHETIC_MARKETPLACE,
      synthetic: true,
      status: "running",
      startedAt: "2026-09-01T00:00:00.000Z",
      productIds: ["prod-synth-desk-fan"],
      predictedContributionUsd: 6.87,
      notes: "V1 fixture experiment — no live listing",
    },
    {
      experimentId: "exp-synth-cable-ads-trim",
      hypothesis: "Reducing ads to $0.50 lifts cable organiser after-ads contribution",
      corridor: "sup-synth-cj-us-corridor → amazon-us",
      marketplace: SYNTHETIC_MARKETPLACE,
      synthetic: true,
      status: "planned",
      startedAt: "2026-09-10T00:00:00.000Z",
      productIds: ["prod-synth-cable-organizer"],
      predictedContributionUsd: 7.0,
    },
  ];
}

/** Seed deterministic Amazon US synthetic catalog fixtures (V1). */
export function seedSyntheticAmazonUsCatalog(): SyntheticAmazonUsCatalog {
  const suppliers = buildSuppliers();
  const warehouses = buildWarehouses();
  const products = buildProducts();
  const stock = buildStock(products);
  const orders = buildOrders();
  const costCentres = buildCostCentres();
  const unitEconomics = products.map((p) => unitEconomicsFromProduct(p));
  const eligibility = products.map((p) => {
    const available = stock
      .filter((s) => s.productId === p.productId)
      .some((s) => s.available > 0);
    const ue = unitEconomics.find((u) => u.productId === p.productId);
    return eligibilityFromProduct(p, {
      stockAvailable: available,
      economicsViable: (ue?.contributionAfterAds ?? 0) > 0,
      deliveryAcceptable: p.deliveryDaysMax <= 12,
    });
  });
  const ledgerEntries = orders.map((o) => orderToLedgerEntry(o, products));
  // Marketplace USD opex only on USD ledger — SGD operating costs stay on CostCentre rows.
  const marketplaceSub = costCentres.find((c) => c.id === "cc-marketplace");
  if (marketplaceSub) {
    ledgerEntries.push({
      entryId: "led-opex-marketplace-sub",
      synthetic: true,
      currency: "USD",
      revenue: 0,
      productCost: 0,
      shipping: 0,
      fees: 0,
      ads: 0,
      refunds: 0,
      returns: 0,
      opex: marketplaceSub.amount,
      costCentreIds: [marketplaceSub.id],
      notes: "Amazon US marketplace subscription allocated as USD opex",
    });
  }

  const portfolio = buildPortfolio(products, unitEconomics, eligibility);
  const experiments = buildExperiments();

  return {
    version: "v1",
    marketplace: SYNTHETIC_MARKETPLACE,
    currency: "USD",
    synthetic: true,
    suppliers,
    warehouses,
    products,
    stock,
    orders,
    costCentres,
    unitEconomics,
    eligibility,
    ledgerEntries,
    experiments,
    portfolio,
  };
}
