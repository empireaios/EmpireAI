import type { PipelineProduct } from "../models/revenue-pipeline-core.js";
import type { MarketplaceAttachmentPoint, SupplierAttachmentPoint } from "../models/revenue-dashboard.js";
import { SUPPLIER_PLATFORMS } from "../models/revenue-dashboard.js";
import { buildCisMissionControlDashboard } from "../../runtime/commerce-intelligence-studio/services/cis-mission-control-service.js";
import { buildExecutiveHeadquartersDashboard } from "../../executive-council/services/executive-headquarters-service.js";
import { buildSurveillanceDashboard } from "../../executive-surveillance/services/surveillance-dashboard-service.js";
import { buildCommerceRuntimeDashboard } from "../../runtime/commerce-runtime/services/commerce-runtime-dashboard-service.js";
import { buildAmazonMissionControlDashboard } from "../../runtime/amazon-global-seller/services/amazon-mission-control-service.js";
import { buildGlobalCommerceInfrastructureDashboard } from "../../runtime/global-commerce-infrastructure/services/global-commerce-infrastructure-dashboard-service.js";
import { buildRealityReadinessDashboard } from "../../orchestration/reality-integration/services/reality-readiness-dashboard-service.js";
import { buildAccessDashboard } from "../../operational-access/services/access-dashboard-service.js";
import { appendTimelineEvent } from "./revenue-timeline-service.js";

/** GKR-006/007/008 — Reuse existing modules; no duplicated intelligence. */
export function enrichProductFromIntegrations(product: PipelineProduct): PipelineProduct {
  const { workspaceId, companyId } = product;

  try {
    const cis = buildCisMissionControlDashboard(workspaceId, companyId);
    product.commercialScore = cis.commercialConfidence;
    appendTimelineEvent(product, {
      eventType: "COMMERCIAL_SCORE",
      title: "CIS commercial confidence referenced",
      summary: `Commercial confidence ${cis.commercialConfidence}% from Commerce Intelligence Studio (not duplicated)`,
      sourceModule: "commerce-intelligence-studio",
    });
  } catch { /* optional */ }

  if (product.state === "EXECUTIVE_REVIEW" || product.state === "KING_APPROVAL") {
    try {
      const ec = buildExecutiveHeadquartersDashboard(workspaceId, companyId);
      appendTimelineEvent(product, {
        eventType: "EXECUTIVE_OPINION",
        title: "Executive Council referenced",
        summary: ec.ceoBriefing.slice(0, 120),
        sourceModule: "executive-council",
      });
    } catch { /* optional */ }
  }

  try {
    buildSurveillanceDashboard(workspaceId, companyId);
    appendTimelineEvent(product, {
      eventType: "SURVEILLANCE_REF",
      title: "Executive Surveillance referenced",
      summary: "Surveillance signals available for pipeline product (not duplicated)",
      sourceModule: "executive-surveillance",
    });
  } catch { /* optional */ }

  return product;
}

export function getMarketplaceAttachmentPoints(): MarketplaceAttachmentPoint[] {
  return [
    { marketplaceId: "amazon", displayName: "Amazon Global Seller", status: "ATTACHED", moduleRef: "amazon-global-seller" },
    { marketplaceId: "shopify", displayName: "Commerce Runtime / Shopify", status: "ATTACHED", moduleRef: "commerce-runtime" },
    { marketplaceId: "global", displayName: "Global Commerce Infrastructure", status: "ATTACHED", moduleRef: "global-commerce-infrastructure" },
    { marketplaceId: "reality", displayName: "Reality Integration", status: "ATTACHED", moduleRef: "reality-integration" },
  ];
}

export function getSupplierAttachmentPoints(): SupplierAttachmentPoint[] {
  const attached = new Set(["cj-dropshipping"]);
  return SUPPLIER_PLATFORMS.map((platformId) => ({
    platformId,
    displayName: platformId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    status: attached.has(platformId) ? "ATTACHED" as const : "PLANNED" as const,
    moduleRef: attached.has(platformId) ? "reality-integration" : undefined,
  }));
}

export function getIntegrationSnapshot(workspaceId: string, companyId: string) {
  const snapshot: Record<string, unknown> = {};
  try { snapshot.cis = { commercialConfidence: buildCisMissionControlDashboard(workspaceId, companyId).commercialConfidence }; } catch { snapshot.cis = null; }
  try { snapshot.amazon = { readiness: buildAmazonMissionControlDashboard(workspaceId, companyId).commercialReadinessPercent }; } catch { snapshot.amazon = null; }
  try { snapshot.commerceRuntime = { plugins: buildCommerceRuntimeDashboard(workspaceId, companyId).runtimePlugins?.length ?? 0 }; } catch { snapshot.commerceRuntime = null; }
  try { snapshot.gci = { score: buildGlobalCommerceInfrastructureDashboard(workspaceId, companyId).infrastructureScore }; } catch { snapshot.gci = null; }
  try { snapshot.reality = { readiness: buildRealityReadinessDashboard(workspaceId, companyId).realCommerceReadinessPercent }; } catch { snapshot.reality = null; }
  try { snapshot.operationalAccess = buildAccessDashboard(workspaceId, companyId); } catch { snapshot.operationalAccess = null; }
  return {
    marketplaces: getMarketplaceAttachmentPoints(),
    suppliers: getSupplierAttachmentPoints(),
    snapshot,
  };
}
