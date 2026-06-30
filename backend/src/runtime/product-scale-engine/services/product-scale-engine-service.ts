import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildGlobalCategoryExpansionEngine } from "../../global-category-expansion-engine/services/global-category-expansion-engine-service.js";
import type { ProductScaleEngine } from "../models/product-scale-engine.js";

type ItemStatus = ProductScaleEngine["items"][number]["status"];
type ScaleAction = "expand_countries" | "expand_marketplaces" | "expand_suppliers" | "expand_advertising" | "increase_budget" | "maintain" | "pause" | "archive";

const ACTION_LABELS: Record<ScaleAction, string> = {
  expand_countries: "Expand countries",
  expand_marketplaces: "Expand marketplaces",
  expand_suppliers: "Expand suppliers",
  expand_advertising: "Expand advertising",
  increase_budget: "Increase budget",
  maintain: "Maintain",
  pause: "Pause",
  archive: "Archive",
};

function itemStatus(score: number): ItemStatus {
  if (score >= 75) return "READY";
  if (score >= 50) return "PENDING";
  return "BLOCKED";
}

function recommendAction(
  product: ReturnType<typeof listPipelineProducts>[number],
  categoryRec?: string,
): { action: ScaleAction; score: number; recommendation: string; evidence: string; why: string } {
  const health = product.health?.overallScore ?? product.commercialScore ?? 50;
  const state = product.state;

  if (["ARCHIVED", "FAILED"].includes(state)) {
    return {
      action: "archive",
      score: 30,
      recommendation: "Keep archived — redirect budget to scaling winners",
      evidence: `State ${state} · commercial ${product.commercialScore ?? 0}`,
      why: "Failed SKUs consume executive attention without ROI",
    };
  }
  if (state === "PAUSED" || health < 45) {
    return {
      action: "pause",
      score: 42,
      recommendation: "Pause ads and fix listing/supplier before reinvestment",
      evidence: `Health ${health} · state ${state}`,
      why: "Pausing prevents margin bleed while root cause is fixed",
    };
  }
  if (state === "SCALING" && health >= 75) {
    return {
      action: "increase_budget",
      score: 90,
      recommendation: "Increase ad budget 15–20% weekly while ACOS < margin",
      evidence: `Scaling state · health ${health}`,
      why: "Proven winners deserve capital acceleration toward SUCCESS-001",
    };
  }
  if (state === "LIVE" && health >= 70) {
    return {
      action: "expand_countries",
      score: 82,
      recommendation: categoryRec ?? "Expand to UK/DE after US proof — REAL-074 country engine",
      evidence: `Live · health ${health} · category ${product.category ?? "general"}`,
      why: "Geographic expansion multiplies revenue without new product development",
    };
  }
  if (state === "LIVE" && health >= 60) {
    return {
      action: "expand_marketplaces",
      score: 76,
      recommendation: "List on secondary marketplace adapter — REAL-072 framework",
      evidence: `Live · health ${health} · marketplace ${product.marketplaceId ?? "primary only"}`,
      why: "Channel diversification reduces single-marketplace policy risk",
    };
  }
  if (health >= 65 && product.supplierPlatform) {
    return {
      action: "expand_suppliers",
      score: 72,
      recommendation: "Add backup supplier from global supplier market REAL-071",
      evidence: `Supplier ${product.supplierPlatform} · health ${health}`,
      why: "Supplier redundancy prevents stock-outs during scale",
    };
  }
  if (state === "MONITORING" || state === "LIVE") {
    return {
      action: "expand_advertising",
      score: 68,
      recommendation: "Test Meta/Google prospecting at 10% of gross margin cap",
      evidence: `State ${state} · commercial ${product.commercialScore ?? health}`,
      why: "Controlled ad expansion validates demand before heavy spend",
    };
  }
  return {
    action: "maintain",
    score: 58,
    recommendation: "Maintain current investment — complete launch gates REAL-077",
    evidence: `State ${state} · health ${health}`,
    why: "Premature scale before governance gates increases refund and policy risk",
  };
}

/** REAL-079 — Product scale engine (pipeline + category expansion). */
export function buildProductScaleEngine(
  workspaceId: string,
  companyId: string,
): ProductScaleEngine {
  seedRevenuePipeline(workspaceId, companyId);
  const products = listPipelineProducts(workspaceId, companyId);
  const scaleCandidates = products.filter((p) => !["ARCHIVED", "FAILED", "REJECTED"].includes(p.state));

  let categoryEngine: ReturnType<typeof buildGlobalCategoryExpansionEngine> | null = null;
  try {
    categoryEngine = buildGlobalCategoryExpansionEngine(workspaceId, companyId);
  } catch { /* optional */ }

  const adsProgram = PROGRAM_CATALOG.find((p) => p.programId === "live-commerce-intelligence");

  const items: ProductScaleEngine["items"] = scaleCandidates.map((product) => {
    const rec = recommendAction(product, categoryEngine?.executiveRecommendation);
    const score = rec.score;

    let recommendation = rec.recommendation;
    if (rec.action === "expand_advertising" && adsProgram?.nextCursorMission) {
      recommendation += ` · ${adsProgram.nextCursorMission}`;
    }

    return {
      itemId: `scale-${product.productId}-${rec.action}`,
      label: `${product.title} — ${ACTION_LABELS[rec.action]}`,
      score,
      status: itemStatus(score),
      recommendation,
      evidence: rec.evidence,
      why: rec.why,
    };
  });

  const readyCount = items.filter((i) => i.status === "READY").length;

  return {
    moduleId: "product-scale-engine",
    missionId: "REAL-079",
    workspaceId,
    companyId,
    summary: `${scaleCandidates.length} products evaluated · ${readyCount} scale-ready · category engine ${categoryEngine ? "attached" : "baseline"}`,
    items,
    reusedModules: ["grand-king-revenue-pipeline", "global-category-expansion-engine", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
