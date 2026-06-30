import type { SupplierDashboard } from "../models/supplier-dashboard.js";
import { buildCjAccessReadiness } from "../../operational-access/models/platform-readiness.js";
import { getEmpireAccessRecord } from "../../operational-access/services/empire-access-registry-service.js";
import { buildCjAdapterSkeleton } from "../adapters/cj-dropshipping-adapter.js";
import { buildSupplierAdapterRegistry } from "./supplier-adapter-registry-service.js";
import { findSupplierOpportunities, listSupplierProducts } from "./supplier-opportunity-service.js";
import { detectSupplierRisks } from "./supplier-risk-service.js";
import { syncOpportunitiesToCis } from "./cis-pipeline-service.js";
import { syncApprovedOpportunitiesToGkr } from "./gkr-pipeline-service.js";
import { SUPPLIER_PROVIDER_CATALOG } from "../models/supplier-abstraction.js";

/** SUP-011 — Supplier Intelligence Dashboard for Executive HQ / Mission Home. */
export function buildSupplierDashboard(workspaceId: string, companyId: string): SupplierDashboard {
  const adapters = buildSupplierAdapterRegistry(workspaceId);
  const products = listSupplierProducts(workspaceId);
  const opportunities = findSupplierOpportunities(workspaceId);

  syncOpportunitiesToCis(workspaceId, companyId, opportunities, products);
  syncApprovedOpportunitiesToGkr(workspaceId, companyId, opportunities, products);

  const allRisks = products.flatMap((p) => detectSupplierRisks(p));
  const shippingRiskCount = allRisks.filter((r) => r.riskType === "slow_shipping").length;

  const countryMap = new Map<string, number>();
  for (const p of products) {
    for (const c of p.shippingCountries) {
      countryMap.set(c, (countryMap.get(c) ?? 0) + 1);
    }
  }

  const cjRecord = getEmpireAccessRecord(workspaceId, "cj-dropshipping");
  const cjReadiness = buildCjAccessReadiness(cjRecord.accessState, Boolean(cjRecord.credentialsRef));
  buildCjAdapterSkeleton(Boolean(cjRecord.credentialsRef));

  const architectureReady = adapters.filter((a) =>
    ["ARCHITECTURE_READY", "CONNECTED", "VERIFIED", "ACTIVE"].includes(a.status),
  ).length;
  const architecturePercent = Math.round((architectureReady / SUPPLIER_PROVIDER_CATALOG.length) * 100);

  const productsUnderReview = opportunities.filter((o) =>
    ["UNDER_REVIEW", "CIS_QUEUED"].includes(o.pipelineStatus),
  ).length;

  const highestPriorityAction = !cjRecord.credentialsRef
    ? { action: "Connect CJ API key via Reality Integration vault", reason: "First supplier — revenue-blocking until verified" }
    : productsUnderReview === 0
      ? { action: "Ingest supplier catalog via CJ adapter when live credentials verified", reason: "Architecture ready — awaiting live catalog sync" }
      : null;

  return {
    moduleId: "supplier-intelligence",
    missionId: "SUP-011",
    workspaceId,
    companyId,
    architectureComplete: architecturePercent >= 90,
    architecturePercent,
    productsFound: products.length,
    productsUnderReview,
    supplierRisks: allRisks.slice(0, 12),
    bestOpportunities: opportunities.slice(0, 5),
    cjReadiness,
    shippingRiskCount,
    countryCoverageSummary: [...countryMap.entries()].map(([country, supplierCount]) => ({ country, supplierCount })),
    adapterSummary: {
      total: adapters.length,
      architectureReady,
      connected: adapters.filter((a) => a.status === "CONNECTED" || a.status === "ACTIVE").length,
    },
    highestPriorityAction,
    computedAt: new Date().toISOString(),
  };
}
