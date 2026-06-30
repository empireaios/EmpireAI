import fs from "node:fs";
import path from "node:path";
import { BACKEND_SRC } from "../../../orchestration/empire-self-inspection/services/repo-scanner.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { SUPPLIER_PROVIDER_IDS } from "../../../supplier-intelligence/models/supplier-abstraction.js";
import { MARKETPLACE_ADAPTERS } from "../../marketplace-publishing/models/marketplace-adapter.js";
import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import { buildSuccess001CommandCenter } from "../../success-001-command-center/services/success-001-command-center-service.js";
import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import type { CommercialReview } from "../models/commercial-review.js";

type ReviewItem = CommercialReview["items"][number];

function moduleExists(relativePath: string): boolean {
  return fs.existsSync(path.join(BACKEND_SRC, ...relativePath.split("/")));
}

/** REAL-096 — Commercial review: supplier, marketplace, revenue, profit paths. */
export function buildCommercialReview(
  workspaceId: string,
  companyId: string,
): CommercialReview {
  seedRevenuePipeline(workspaceId, companyId);
  const economics = buildEmpireEconomics(workspaceId, companyId);
  const successCenter = buildSuccess001CommandCenter(workspaceId, companyId);
  const pipeline = listPipelineProducts(workspaceId, companyId);
  const items: ReviewItem[] = [];

  const supplierModuleOk = moduleExists("supplier-intelligence");
  const supplierAdapters = SUPPLIER_PROVIDER_IDS.length;
  const cjAdapterOk = moduleExists("supplier-intelligence/adapters/cj-dropshipping-adapter.ts");
  items.push({
    itemId: "supplier-abstraction",
    label: "Supplier intelligence abstraction (SUP-001)",
    score: supplierModuleOk && cjAdapterOk ? 85 : 50,
    status: supplierModuleOk ? "READY" : "BLOCKED",
    recommendation: supplierModuleOk
      ? "Complete SUP-LIVE-001 — CJ live catalog sync + fulfillment attach"
      : "Restore supplier-intelligence module before commerce execution",
    evidence: `${supplierAdapters} provider IDs · CJ adapter=${cjAdapterOk} · ${successCenter.supplierBlockers.length} blockers`,
    why: "Supplier abstraction must support multi-provider without CJ as sole authority",
  });

  const marketplaceModuleOk = moduleExists("runtime/marketplace-publishing");
  const adapterCount = MARKETPLACE_ADAPTERS.length;
  items.push({
    itemId: "marketplace-abstraction",
    label: "Marketplace publishing abstraction (REAL-003)",
    score: marketplaceModuleOk && adapterCount >= 3 ? 82 : 55,
    status: marketplaceModuleOk ? "PENDING" : "BLOCKED",
    recommendation: "Wire marketplace-publishing queue to Grand King approval — no execution bypass",
    evidence: `${adapterCount} MARKETPLACE_ADAPTERS · ${successCenter.marketplaceBlockers.length} marketplace blockers`,
    why: "Marketplace abstraction enables multi-channel publish without duplicating listing logic",
  });

  const gkrOk = moduleExists("grand-king-revenue-pipeline");
  const kingApprovalCount = pipeline.filter((p) => p.state === "KING_APPROVAL").length;
  const liveCount = pipeline.filter((p) => p.state === "LIVE").length;
  items.push({
    itemId: "revenue-path-gkr",
    label: "Grand King revenue pipeline path",
    score: gkrOk ? (liveCount > 0 ? 88 : 62) : 40,
    status: gkrOk ? (liveCount > 0 ? "READY" : "PENDING") : "BLOCKED",
    recommendation: kingApprovalCount > 0
      ? `Clear ${kingApprovalCount} KING_APPROVAL products — EC-011`
      : "Advance pipeline products through executive debate to LIVE",
    evidence: `${pipeline.length} pipeline products · ${liveCount} LIVE · ${kingApprovalCount} awaiting King`,
    why: "Revenue path requires Grand King approval before marketplace publish execution",
  });

  const economicsOk = moduleExists("runtime/empire-economics");
  items.push({
    itemId: "revenue-path-economics",
    label: "Empire economics revenue tracking (REAL-019)",
    score: economicsOk ? (economics.netProfitUsd > 0 ? 80 : 55) : 45,
    status: economics.netProfitUsd > 0 ? "READY" : "PENDING",
    recommendation: "ECON-LIVE-001 — Attach live Stripe + supplier COGS to economics dashboard",
    evidence: `netProfit=$${economics.netProfitUsd} · mrr=$${economics.monthlyRecurringRevenueUsd} · module=${economicsOk}`,
    why: "Live P&L data is required before scaling ads or expanding marketplaces",
  });

  const profitPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k);
  items.push({
    itemId: "profit-path-success-001",
    label: "SUCCESS-001 profit path (USD 100K net)",
    score: successCenter.progressPercent,
    status: successCenter.progressPercent >= 10 ? "PENDING" : "BLOCKED",
    recommendation: successCenter.programsBlocking[0]?.nextMission ?? "PROOF-001 — First verified net profit",
    evidence: `${successCenter.progressPercent}% progress · $${successCenter.currentNetProfitUsd} net · ${profitPrograms.length} blocking programs`,
    why: "Version 1 commercial success is measured by verified net profit toward SUCCESS-001",
  });

  for (const program of ["supplier-intelligence", "commerce-execution", "proof-of-money"] as const) {
    const entry = PROGRAM_CATALOG.find((p) => p.programId === program);
    if (!entry) continue;
    items.push({
      itemId: `catalog-${program}`,
      label: `PROGRAM_CATALOG — ${entry.name}`,
      score: entry.baseCompletionPercent,
      status: entry.blocksUsd100k ? "BLOCKED" : entry.baseCompletionPercent >= 80 ? "READY" : "PENDING",
      recommendation: entry.nextCursorMission,
      evidence: `${entry.baseCompletionPercent}% · blocksUsd100k=${entry.blocksUsd100k}`,
      why: entry.realWorldDependencies.join("; ") || "Commercial program gate for go-live",
    });
  }

  const avgScore = Math.round(items.reduce((s, i) => s + i.score, 0) / items.length);
  const blockedCount = items.filter((i) => i.status === "BLOCKED").length;

  return {
    moduleId: "commercial-review",
    missionId: "REAL-096",
    workspaceId,
    companyId,
    summary: `REAL-096 — supplier(${supplierAdapters}) · marketplace(${adapterCount}) · pipeline(${pipeline.length}) · netProfit=$${economics.netProfitUsd} · ${blockedCount} blocked`,
    items,
    reusedModules: [
      "supplier-intelligence",
      "marketplace-publishing",
      "grand-king-revenue-pipeline",
      "empire-economics",
      "success-001-command-center",
      "master-completion-ledger",
    ],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
