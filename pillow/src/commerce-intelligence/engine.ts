import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import { PRODUCT_CATALOG } from "./product-catalog.js";
import { SUPPLIER_CATALOG } from "./supplier-catalog.js";
import { COMPETITOR_CATALOG } from "./competitor-catalog.js";
import { MARKET_CATALOG } from "./market-catalog.js";
import { discoverProducts, getQualityThreshold } from "./product-scorer.js";
import { rankSuppliers } from "./supplier-scorer.js";
import { analyzeCompetitors } from "./competitor-analyzer.js";
import { analyzeMarkets } from "./market-analyzer.js";
import { rankWinningProducts } from "./winning-product-engine.js";
import { buildLaunchPlan } from "./launch-planner.js";
import { buildCommerceIntelligenceReport } from "./executive-reporter.js";
import type { CommerceIntelligenceReport, CommerceIntelligenceState } from "./types.js";

export const COMMERCE_INTELLIGENCE_CONTRACT_PATH =
  "docs/governance/COMMERCIAL_INTEGRATION_TO_INTELLIGENCE_TRANSITION.md";

/**
 * Commerce Intelligence Executive (PILLOW-CI-001 / Phase 7).
 * Product · Supplier · Competitor · Market intelligence with launch planning.
 */
export class CommerceIntelligenceEngine {
  private initializedAt: string | null = null;
  private totalAnalyses = 0;
  private lastReport: CommerceIntelligenceReport | null = null;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    private readonly intelligence: RepositoryIntelligenceContext,
  ) {}

  async initialize(): Promise<CommerceIntelligenceState> {
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): CommerceIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("Commerce Intelligence not initialized. Call initialize() first.");
    }
    return {
      intelligenceVersion: "PILLOW-CI-001",
      status: "ready",
      initializedAt: this.initializedAt,
      totalAnalyses: this.totalAnalyses,
      qualityThreshold: getQualityThreshold(),
      catalogProducts: PRODUCT_CATALOG.length,
      catalogSuppliers: SUPPLIER_CATALOG.length,
      catalogMarkets: MARKET_CATALOG.length,
    };
  }

  /** Full commerce intelligence analysis pipeline. */
  analyzeCommerce(query?: string): CommerceIntelligenceReport {
    const evaluations = discoverProducts(PRODUCT_CATALOG);
    const supplierRankings = rankSuppliers(SUPPLIER_CATALOG);
    const marketOpportunities = analyzeMarkets(MARKET_CATALOG);
    const competitorThreats = analyzeCompetitors(COMPETITOR_CATALOG);

    let winners = rankWinningProducts({
      evaluations,
      supplierRankings,
      marketAnalyses: marketOpportunities,
    });

    if (query?.trim()) {
      const q = query.toLowerCase();
      winners = winners.filter(
        (w) =>
          w.product.name.toLowerCase().includes(q) ||
          w.product.category.toLowerCase().includes(q) ||
          q.includes("product") ||
          q.includes("launch") ||
          q.includes("supplier") ||
          q.includes("market"),
      );
      if (winners.length === 0) {
        winners = rankWinningProducts({
          evaluations,
          supplierRankings,
          marketAnalyses: marketOpportunities,
        });
      }
    }

    const launchPlans = winners.slice(0, 3).map(buildLaunchPlan);

    const report = buildCommerceIntelligenceReport({
      winners,
      supplierRankings,
      marketOpportunities,
      competitorThreats,
      launchPlans,
      qualityThreshold: getQualityThreshold(),
    });

    this.totalAnalyses += 1;
    this.lastReport = report;
    return report;
  }

  getLastReport(): CommerceIntelligenceReport | null {
    return this.lastReport;
  }

  /** Intelligence sources available to Pillow commerce layer. */
  getIntelligenceSources(): string[] {
    return [
      "Pillow product catalog (PILLOW-CI-001)",
      "CJ Dropshipping supplier tiers (backend PILLOW-020)",
      "Product Intelligence Engine (G3-01)",
      "Supplier Intelligence Engine (G3-03)",
      "Market Intelligence Engine (G3-02)",
      "Commerce Intelligence Core pipeline",
      `Repository intelligence (${this.intelligence.entities.length} entities)`,
      "Commerce Readiness Engine (CRIR)",
    ];
  }
}

export function createCommerceIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
): CommerceIntelligenceEngine {
  return new CommerceIntelligenceEngine(bootstrap, intelligence);
}
