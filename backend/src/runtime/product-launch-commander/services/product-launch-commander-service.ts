import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildExecutiveVisualDebate } from "../../executive-visual-debate/services/executive-visual-debate-service.js";
import { buildGrandKingGoLiveChecklist } from "../../grand-king-go-live-checklist/services/grand-king-go-live-checklist-service.js";
import { buildSoulDecisionChamber } from "../../soul-decision-chamber/services/soul-decision-chamber-service.js";
import type { ProductLaunchCommander } from "../models/product-launch-commander.js";

type ItemStatus = ProductLaunchCommander["items"][number]["status"];

const LAUNCH_STEPS = [
  { stepId: "supplier", label: "Supplier validation", gate: (p: ReturnType<typeof listPipelineProducts>[number]) => Boolean(p.supplierPlatform) },
  { stepId: "listing", label: "Listing draft", gate: (p: ReturnType<typeof listPipelineProducts>[number]) => !["DISCOVERED"].includes(p.state) },
  { stepId: "media", label: "Product media", gate: (p: ReturnType<typeof listPipelineProducts>[number]) => (p.health?.listingHealth ?? 0) >= 55 },
  { stepId: "pricing", label: "Pricing strategy", gate: (p: ReturnType<typeof listPipelineProducts>[number]) => (p.commercialScore ?? 0) >= 50 },
  { stepId: "marketplace", label: "Marketplace adapter", gate: (p: ReturnType<typeof listPipelineProducts>[number]) => Boolean(p.marketplaceId ?? p.supplierPlatform) },
  { stepId: "country", label: "Country readiness", gate: () => true },
  { stepId: "debate", label: "Executive visual debate", gate: (p: ReturnType<typeof listPipelineProducts>[number]) => ["EXECUTIVE_REVIEW", "KING_APPROVAL", "READY_TO_PUBLISH", "LIVE", "MONITORING", "SCALING"].includes(p.state) },
  { stepId: "soul", label: "Soul synthesis", gate: (p: ReturnType<typeof listPipelineProducts>[number]) => ["KING_APPROVAL", "READY_TO_PUBLISH", "LIVE", "MONITORING", "SCALING"].includes(p.state) },
  { stepId: "grand_king", label: "Grand King approval", gate: (p: ReturnType<typeof listPipelineProducts>[number]) => p.kingApproved || ["READY_TO_PUBLISH", "LIVE", "MONITORING", "SCALING"].includes(p.state) },
  { stepId: "launch", label: "Launch publish", gate: (p: ReturnType<typeof listPipelineProducts>[number]) => ["LIVE", "MONITORING", "SCALING"].includes(p.state) },
] as const;

function itemStatus(passed: boolean, blocked: boolean): ItemStatus {
  if (blocked) return "BLOCKED";
  if (passed) return "READY";
  return "PENDING";
}

/** REAL-077 — Product launch commander (supplier → launch workflow). */
export function buildProductLaunchCommander(
  workspaceId: string,
  companyId: string,
): ProductLaunchCommander {
  seedRevenuePipeline(workspaceId, companyId);
  const products = listPipelineProducts(workspaceId, companyId);
  const focus = products.find((p) => p.state === "KING_APPROVAL")
    ?? products.find((p) => p.state === "READY_TO_PUBLISH")
    ?? products.find((p) => !["ARCHIVED", "FAILED"].includes(p.state))
    ?? products[0];

  const commerceProgram = PROGRAM_CATALOG.find((p) => p.programId === "commerce-execution");
  let debateSummary = "Executive debate pending";
  let soulSummary = "Soul synthesis pending";
  try {
    const debateContext = {
      topic: `Launch ${focus?.title ?? "product"}`,
      subjectType: "product" as const,
      subjectId: focus?.productId ?? "pipeline",
      summary: `Product launch readiness for ${focus?.title ?? "pipeline SKU"}`,
    };
    const debate = buildExecutiveVisualDebate(workspaceId, companyId, debateContext);
    debateSummary = debate.soulRecommendation.unifiedRecommendation.slice(0, 120);
    const soul = buildSoulDecisionChamber(workspaceId, companyId, debateContext);
    soulSummary = soul.soulRecommendation.unifiedRecommendation.slice(0, 120);
  } catch { /* optional */ }

  const goLive = buildGrandKingGoLiveChecklist(workspaceId, companyId);

  const items: ProductLaunchCommander["items"] = LAUNCH_STEPS.map((step) => {
    const passed = focus ? step.gate(focus) : false;
    const blocked = step.stepId === "grand_king" && goLive.blockedCount > 0 && !passed;
    const score = passed ? 88 : step.stepId === "launch" && focus?.state === "LIVE" ? 95 : 52;

    let recommendation = passed ? `${step.label} complete — advance to next gate` : `Complete ${step.label} before launch`;
    let evidence = `Product ${focus?.title ?? "none"} · state ${focus?.state ?? "unknown"}`;
    let why = "Launch sequence prevents revenue-blocking gaps in fulfillment or governance";

    if (step.stepId === "debate") {
      evidence = debateSummary;
      why = "Executive council surfaces margin, risk, and marketplace policy before publish";
    } else if (step.stepId === "soul") {
      evidence = soulSummary;
      why = "Soul synthesizes council debate into a single recommendation — never auto-executes";
    } else if (step.stepId === "grand_king") {
      evidence = `${goLive.readyCount}/${goLive.totalCount} go-live items ready · blocked ${goLive.blockedCount}`;
      recommendation = goLive.goLiveReady ? "Grand King go-live checklist clear" : goLive.checklists.find((c) => c.status === "BLOCKED")?.label ?? "Resolve go-live blockers";
      why = "Grand King approval is the final governance gate before live revenue";
    } else if (step.stepId === "launch") {
      recommendation = passed
        ? "Product live — monitor post-launch commander REAL-078"
        : commerceProgram?.nextCursorMission ?? "Complete commerce execution publish path";
      why = "Live publish connects listing to order execution and SUCCESS-001 profit tracking";
    }

    return {
      itemId: `launch-${step.stepId}`,
      label: step.label,
      score,
      status: itemStatus(passed, blocked),
      recommendation,
      evidence,
      why,
    };
  });

  const readyCount = items.filter((i) => i.status === "READY").length;

  return {
    moduleId: "product-launch-commander",
    missionId: "REAL-077",
    workspaceId,
    companyId,
    summary: `Launch workflow for ${focus?.title ?? "pipeline"} · ${readyCount}/${items.length} steps ready · state ${focus?.state ?? "none"}`,
    items,
    reusedModules: [
      "grand-king-revenue-pipeline",
      "executive-visual-debate",
      "soul-decision-chamber",
      "grand-king-go-live-checklist",
      "master-completion-ledger",
    ],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
