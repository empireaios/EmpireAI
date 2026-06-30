import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { SUPPLIER_PROVIDER_CATALOG } from "../../../supplier-intelligence/models/supplier-abstraction.js";
import { buildSupplierAdapterRegistry } from "../../../supplier-intelligence/services/supplier-adapter-registry-service.js";
import type { GlobalSupplierMarket } from "../models/global-supplier-market.js";

type ItemStatus = GlobalSupplierMarket["items"][number]["status"];

function itemStatus(score: number, blocked: boolean): ItemStatus {
  if (blocked) return "BLOCKED";
  if (score >= 75) return "READY";
  return "PENDING";
}

function categoryCapabilityScore(category: string): number {
  if (category === "dropship") return 82;
  if (category === "wholesale") return 78;
  if (category === "aggregator") return 74;
  return 70;
}

/** REAL-071 — Global supplier market (SUPPLIER_PROVIDER_CATALOG + adapter registry). */
export function buildGlobalSupplierMarket(
  workspaceId: string,
  companyId: string,
): GlobalSupplierMarket {
  const registry = buildSupplierAdapterRegistry(workspaceId);
  const supplierProgram = PROGRAM_CATALOG.find((p) => p.programId === "supplier-intelligence");

  const items: GlobalSupplierMarket["items"] = SUPPLIER_PROVIDER_CATALOG.map((provider) => {
    const adapter = registry.find((a) => a.providerId === provider.providerId);
    const countryCoverage = provider.supportedCountries.length;
    const capability = categoryCapabilityScore(provider.category);
    const warehouse = provider.category === "wholesale" ? 85 : provider.category === "dropship" ? 72 : 65;
    const inventory = adapter?.capabilities.includes("inventory") ? 80 : 55;
    const shipping = adapter?.capabilities.includes("shipping_estimate") ? 78 : 50;
    const margin = provider.category === "wholesale" ? 68 : provider.category === "dropship" ? 55 : 60;
    const risk = provider.revenueBlocking ? 45 : provider.architectureOnly ? 62 : 70;
    const reliability = adapter?.health === "HEALTHY" ? 88 : adapter?.health === "WARNING" ? 62 : 48;
    const executiveScore = Math.round(
      (capability + Math.min(countryCoverage * 8, 80) + warehouse + inventory + shipping + margin + risk + reliability) / 8,
    );
    const connected = adapter?.status === "CONNECTED" || adapter?.status === "VERIFIED" || adapter?.status === "ACTIVE";
    const blocked = provider.revenueBlocking && !connected;

    const evidence = [
      `capability ${capability}`,
      `countries ${countryCoverage || "global"}`,
      `warehouse ${warehouse}`,
      `inventory ${inventory}`,
      `shipping ${shipping}`,
      `margin ${margin}`,
      `risk ${risk}`,
      `reliability ${reliability}`,
      `executive ${executiveScore}`,
    ].join(" · ");

    return {
      itemId: `supplier-${provider.providerId}`,
      label: provider.displayName,
      score: executiveScore,
      status: itemStatus(executiveScore, blocked),
      recommendation: connected
        ? `Primary sourcing path — ${provider.category} with ${adapter?.status ?? "ready"} adapter`
        : provider.revenueBlocking
          ? supplierProgram?.nextCursorMission ?? "Attach live supplier credentials — SUP-LIVE-001"
          : `Evaluate ${provider.displayName} as secondary supplier — architecture ready`,
      evidence,
      why: blocked
        ? "Revenue-blocking supplier without live credentials delays fulfillment and SUCCESS-001 profit path"
        : executiveScore >= 75
          ? "Balanced capability, coverage, and reliability supports scalable catalog sourcing"
          : "Moderate scores — validate margin and shipping before scaling SKU volume",
    };
  });

  const readyCount = items.filter((i) => i.status === "READY").length;
  const avgScore = items.length
    ? Math.round(items.reduce((s, i) => s + i.score, 0) / items.length)
    : 0;

  return {
    moduleId: "global-supplier-market",
    missionId: "REAL-071",
    workspaceId,
    companyId,
    summary: `${items.length} supplier platforms evaluated · ${readyCount} executive-ready · avg score ${avgScore}`,
    items,
    reusedModules: ["supplier-intelligence", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
