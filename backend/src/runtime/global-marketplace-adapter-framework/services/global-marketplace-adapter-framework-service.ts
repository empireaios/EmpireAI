import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import {
  MARKETPLACE_ADAPTERS,
  type MarketplaceAdapter,
} from "../../marketplace-publishing/models/marketplace-adapter.js";
import type { GlobalMarketplaceAdapterFramework } from "../models/global-marketplace-adapter-framework.js";

type ItemStatus = GlobalMarketplaceAdapterFramework["items"][number]["status"];
type FrameworkAdapter = Omit<MarketplaceAdapter, "marketplaceId"> & { marketplaceId: string };

const EXTENDED_MARKETPLACE_ADAPTERS: FrameworkAdapter[] = [
  {
    marketplaceId: "tiktok-shop",
    displayName: "TikTok Shop",
    adapterStatus: "ARCHITECTURE_READY",
    supportsDraft: true,
    supportsPublish: false,
    requiresKingApproval: true,
    formatterId: "tiktok-shop-open",
    validatorId: "tiktok-listing",
  },
  {
    marketplaceId: "walmart",
    displayName: "Walmart Marketplace",
    adapterStatus: "ARCHITECTURE_READY",
    supportsDraft: true,
    supportsPublish: false,
    requiresKingApproval: true,
    formatterId: "walmart-marketplace",
    validatorId: "walmart-listing",
  },
  {
    marketplaceId: "mercadolibre",
    displayName: "Mercado Libre",
    adapterStatus: "ARCHITECTURE_READY",
    supportsDraft: true,
    supportsPublish: false,
    requiresKingApproval: true,
    formatterId: "mercadolibre-api",
    validatorId: "mercadolibre-listing",
  },
  {
    marketplaceId: "rakuten",
    displayName: "Rakuten",
    adapterStatus: "ARCHITECTURE_READY",
    supportsDraft: true,
    supportsPublish: false,
    requiresKingApproval: true,
    formatterId: "rakuten-ichiba",
    validatorId: "rakuten-listing",
  },
];

function itemStatus(score: number, blocked: boolean): ItemStatus {
  if (blocked) return "BLOCKED";
  if (score >= 75) return "READY";
  return "PENDING";
}

function adapterScore(adapter: FrameworkAdapter): number {
  let score = 70;
  if (adapter.supportsDraft) score += 8;
  if (adapter.adapterStatus === "CONNECTED") score += 12;
  else if (adapter.adapterStatus === "ARCHITECTURE_READY") score += 5;
  if (adapter.formatterId && adapter.validatorId) score += 5;
  return Math.min(100, score);
}

/** REAL-072 — Provider-agnostic marketplace adapter framework. */
export function buildGlobalMarketplaceAdapterFramework(
  workspaceId: string,
  companyId: string,
): GlobalMarketplaceAdapterFramework {
  void workspaceId;
  void companyId;

  const operationalAccess = PROGRAM_CATALOG.find((p) => p.programId === "operational-access");
  const allAdapters = [...MARKETPLACE_ADAPTERS, ...EXTENDED_MARKETPLACE_ADAPTERS];

  const items: GlobalMarketplaceAdapterFramework["items"] = allAdapters.map((adapter) => {
    const score = adapterScore(adapter);
    const blocked = adapter.adapterStatus === "LIVE_BLOCKED";
    const abstractionReady = Boolean(adapter.formatterId && adapter.validatorId);

    return {
      itemId: `adapter-${adapter.marketplaceId}`,
      label: adapter.displayName,
      score,
      status: itemStatus(score, blocked),
      recommendation: adapter.supportsPublish
        ? `Publish via ${adapter.displayName} — King approval ${adapter.requiresKingApproval ? "required" : "optional"}`
        : abstractionReady
          ? `Draft-only adapter ready — connect credentials then ${operationalAccess?.nextCursorMission ?? "REAL-002B"}`
          : "Complete formatter + validator wiring before channel activation",
      evidence: `status ${adapter.adapterStatus} · formatter ${adapter.formatterId} · validator ${adapter.validatorId} · draft ${adapter.supportsDraft} · publish ${adapter.supportsPublish}`,
      why: abstractionReady
        ? "Provider-agnostic formatter/validator pair isolates marketplace quirks from Empire pipeline logic"
        : "Missing adapter abstraction increases duplicate listing logic and publish risk",
    };
  });

  const readyCount = items.filter((i) => i.status === "READY").length;

  return {
    moduleId: "global-marketplace-adapter-framework",
    missionId: "REAL-072",
    workspaceId,
    companyId,
    summary: `${allAdapters.length} marketplace adapters (${MARKETPLACE_ADAPTERS.length} core + ${EXTENDED_MARKETPLACE_ADAPTERS.length} extended) · ${readyCount} architecture-ready`,
    items,
    reusedModules: ["marketplace-publishing", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
