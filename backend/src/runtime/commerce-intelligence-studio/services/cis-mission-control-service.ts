import type { CisMissionControlDashboard } from "../models/cis-dashboard.js";
import { listCommercialReviews } from "./commercial-review-service.js";
import { listWinningListings } from "./winning-listing-service.js";
import { listExperiments } from "./experiment-service.js";
import { getCisRepository } from "../repositories/sqlite-cis-repository.js";
import { STRATEGY_LABELS } from "../models/commercial-strategy.js";
import { CLASSIFICATION_LABELS } from "../models/commercial-experiment.js";

/** CIS-005 — Commerce Intelligence Studio Mission Control. */
export function buildCisMissionControlDashboard(
  workspaceId: string,
  companyId: string,
): CisMissionControlDashboard {
  const products = getCisRepository().listSupplierProducts(workspaceId, companyId);
  const reviews = listCommercialReviews(workspaceId, companyId);
  const listings = listWinningListings(workspaceId, companyId);
  const experiments = listExperiments(workspaceId, companyId);

  const reviewedIds = new Set(reviews.map((r) => r.supplierProductId));
  const productsAwaitingReview = products.filter((p) => !reviewedIds.has(p.supplierProductId)).length;

  const underExperiment = experiments.filter((e) => e.classification === "EXPERIMENT");
  const onWatchlist = experiments.filter((e) => e.classification === "WATCHLIST");
  const forRemoval = experiments.filter((e) => e.classification === "REMOVE");

  const topOpportunities = reviews
    .map((r) => {
      const exp = experiments.find((e) => e.supplierProductId === r.supplierProductId);
      const strat = getCisRepository().getLatestStrategy(workspaceId, companyId, r.supplierProductId);
      const product = products.find((p) => p.supplierProductId === r.supplierProductId);
      return {
        supplierProductId: r.supplierProductId,
        title: product?.title ?? r.supplierProductId,
        aggregateScore: r.aggregateScore,
        strategy: strat ? STRATEGY_LABELS[strat.recommendedStrategy] : "Pending",
        classification: exp ? CLASSIFICATION_LABELS[exp.classification] : "Unclassified",
      };
    })
    .sort((a, b) => b.aggregateScore - a.aggregateScore)
    .slice(0, 5);

  const commercialConfidence = reviews.length
    ? Math.round(reviews.reduce((s, r) => s + r.aggregateConfidence, 0) / reviews.length)
    : 0;

  return {
    moduleId: "commerce-intelligence-studio",
    missionId: "CIS-001-CIS-005",
    productsAwaitingReview,
    winningListings: listings.map((l) => ({
      listingId: l.listingId,
      supplierProductId: l.supplierProductId,
      title: l.title,
      listingStrengthScore: l.listingStrengthScore,
    })),
    productsUnderExperiment: underExperiment.map((e) => ({
      supplierProductId: e.supplierProductId,
      classification: e.classification,
      explanation: e.explanation,
    })),
    productsOnWatchlist: onWatchlist.map((e) => ({
      supplierProductId: e.supplierProductId,
      expectedBusinessValue: e.expectedBusinessValue,
      explanation: e.explanation,
    })),
    productsRecommendedForRemoval: forRemoval.map((e) => ({
      supplierProductId: e.supplierProductId,
      explanation: e.explanation,
    })),
    topCommercialOpportunities: topOpportunities,
    commercialConfidence,
    computedAt: new Date().toISOString(),
  };
}

export function buildEsisCisPayload(workspaceId: string, companyId: string) {
  const dash = buildCisMissionControlDashboard(workspaceId, companyId);
  return {
    module: "commerce-intelligence-studio",
    commercialConfidence: dash.commercialConfidence,
    winningListings: dash.winningListings.length,
    highConfidenceProducts: dash.topCommercialOpportunities.filter((o) => o.classification === "High Confidence").length,
  };
}
