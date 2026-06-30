import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { buildSupplierAdapterRegistry } from "../../../supplier-intelligence/services/supplier-adapter-registry-service.js";
import type { ProductRetirementEngine } from "../models/product-retirement-engine.js";

type ItemStatus = ProductRetirementEngine["items"][number]["status"];
type RetirementAction = "archive" | "replace" | "refresh" | "reposition" | "supplier_switch";

const ACTION_LABELS: Record<RetirementAction, string> = {
  archive: "Archive",
  replace: "Replace SKU",
  refresh: "Refresh listing",
  reposition: "Reposition pricing",
  supplier_switch: "Switch supplier",
};

const LOW_COMMERCIAL_THRESHOLD = 45;

function itemStatus(score: number): ItemStatus {
  if (score >= 75) return "READY";
  if (score >= 50) return "PENDING";
  return "BLOCKED";
}

function retirementRecommendation(
  product: ReturnType<typeof listPipelineProducts>[number],
): { action: RetirementAction; score: number; recommendation: string; evidence: string; why: string } {
  const commercial = product.commercialScore ?? product.health?.overallScore ?? 50;
  const state = product.state;

  if (state === "ARCHIVED") {
    return {
      action: "archive",
      score: 85,
      recommendation: "Keep archived — do not reinvest catalog or ad budget",
      evidence: `Archived · commercial ${commercial}`,
      why: "Archived SKUs already exited the revenue pipeline — reinvestment destroys focus",
    };
  }
  if (state === "FAILED") {
    return {
      action: "replace",
      score: 78,
      recommendation: "Replace with adjacent category winner from REAL-029 expansion engine",
      evidence: `Failed · commercial ${commercial} · category ${product.category ?? "unknown"}`,
      why: "Failed products rarely recover — replacement preserves marketplace account health",
    };
  }
  if (commercial < LOW_COMMERCIAL_THRESHOLD && ["LIVE", "MONITORING", "PAUSED"].includes(state)) {
    return {
      action: "reposition",
      score: 55,
      recommendation: "Reposition price or bundle before archive — REAL-075 price intelligence",
      evidence: `Low commercial ${commercial} · state ${state}`,
      why: "One pricing or positioning fix may salvage margin before write-off",
    };
  }
  if (commercial < LOW_COMMERCIAL_THRESHOLD && (product.health?.supplierHealth ?? 50) < 50) {
    return {
      action: "supplier_switch",
      score: 62,
      recommendation: "Switch supplier via global supplier market REAL-071 before retirement",
      evidence: `Commercial ${commercial} · supplier health ${product.health?.supplierHealth ?? "unknown"}`,
      why: "Supplier quality issues mimic product failure — switching preserves listing equity",
    };
  }
  if (commercial < LOW_COMMERCIAL_THRESHOLD) {
    return {
      action: "refresh",
      score: 58,
      recommendation: "Refresh media and listing copy — REAL-073 marketplace rules",
      evidence: `Commercial ${commercial} · listing health ${product.health?.listingHealth ?? "unknown"}`,
      why: "Stale listings underperform without full SKU replacement cost",
    };
  }
  return {
    action: "archive",
    score: 48,
    recommendation: "Monitor one more cycle — below threshold triggers archive next review",
    evidence: `Commercial ${commercial} · state ${state}`,
    why: "Borderline SKUs need explicit decision to free working capital",
  };
}

/** REAL-080 — Product retirement engine (FAILED/ARCHIVED + low commercialScore). */
export function buildProductRetirementEngine(
  workspaceId: string,
  companyId: string,
): ProductRetirementEngine {
  seedRevenuePipeline(workspaceId, companyId);
  const products = listPipelineProducts(workspaceId, companyId);
  const supplierRegistry = buildSupplierAdapterRegistry(workspaceId);

  const candidates = products.filter((p) =>
    ["FAILED", "ARCHIVED"].includes(p.state)
    || (p.commercialScore ?? p.health?.overallScore ?? 100) < LOW_COMMERCIAL_THRESHOLD,
  );

  const items: ProductRetirementEngine["items"] = candidates.map((product) => {
    const rec = retirementRecommendation(product);
    const supplier = supplierRegistry.find((s) => s.providerId === product.supplierPlatform);
    const score = rec.score;

    return {
      itemId: `retire-${product.productId}-${rec.action}`,
      label: `${product.title} — ${ACTION_LABELS[rec.action]}`,
      score,
      status: itemStatus(score),
      recommendation: rec.recommendation,
      evidence: `${rec.evidence} · supplier ${supplier?.displayName ?? product.supplierPlatform ?? "none"} (${supplier?.status ?? "n/a"})`,
      why: rec.why,
    };
  });

  const readyCount = items.filter((i) => i.status === "READY").length;

  return {
    moduleId: "product-retirement-engine",
    missionId: "REAL-080",
    workspaceId,
    companyId,
    summary: `${candidates.length} retirement candidates · ${readyCount} clear actions · threshold commercial < ${LOW_COMMERCIAL_THRESHOLD}`,
    items: items.length > 0 ? items : [{
      itemId: "retire-portfolio-clear",
      label: "Portfolio — no retirement candidates",
      score: 90,
      status: "READY" as const,
      recommendation: "No FAILED/ARCHIVED or low-commercial SKUs — maintain scale engine REAL-079",
      evidence: `${products.length} products above commercial threshold`,
      why: "Clean portfolio maximizes capital efficiency toward SUCCESS-001",
    }],
    reusedModules: ["grand-king-revenue-pipeline", "supplier-intelligence"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
