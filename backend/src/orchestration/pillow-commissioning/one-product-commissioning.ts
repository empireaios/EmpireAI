/**
 * One real product factory commissioning.
 * Pillow originates the candidate from production opportunity space.
 * Cursor must NOT choose/preselect the product.
 */

import { getDatabase } from "../../brain/database.js";
import { getPillowCommercePresaleRepository } from "../pillow-commerce-presale/repository/sqlite-pillow-commerce-presale-repository.js";
import type { QualifiedOpportunity } from "../pillow-commerce-presale/models.js";
import { listFlightEvents, recordFlightEvent } from "./flight-recorder.js";
import { assertPaidAutonomousAllowed } from "./cost-guard.js";

export type CommissioningLifecycleStage =
  | "DISCOVERED"
  | "SUPPLIER_VERIFIED"
  | "STOCK_VERIFIED"
  | "COST_VERIFIED"
  | "SHIPPING_VERIFIED"
  | "AMAZON_MATCHED"
  | "RESTRICTIONS_CHECKED"
  | "BRAND_IP_CHECKED"
  | "COMPETITION_ANALYSED"
  | "DELIVERY_ANALYSED"
  | "FEES_CALCULATED"
  | "ECONOMICS_CALCULATED"
  | "RISK_REVIEWED"
  | "PILLOW_RECOMMENDATION"
  | "AWAITING_GRAND_KING_DECISION"
  | "LISTING_PREPARED"
  | "PUBLISHED"
  | "BUYABLE_VERIFIED"
  | "MONITORING_ACTIVE";

export type OneProductCommissioningRecord = {
  commissioningId: string;
  workspaceId: string;
  selectionAuthority: "pillow";
  cursorSelected: false;
  opportunityId: string;
  productName: string;
  supplier: "CJdropshipping";
  marketplace: "Amazon US";
  asin: string;
  cjPid: string;
  amazonSellerSku: string;
  supplierCost: string | null;
  freight: string | null;
  deliveryPromise: string | null;
  offerPrice: string;
  competingOffers: string | null;
  expectedProfit: string;
  expectedMargin: string;
  brandRoute: string | null;
  pillowRecommendation: string;
  riskReasons: string[];
  stage: CommissioningLifecycleStage;
  publicationAttempted: false;
  supplierSpendAttempted: false;
  buyable: false | "UNKNOWN";
  grandKingDecision: "Pending" | "Approved" | "Rejected" | "none";
  approvalId: string | null;
  visualAmazonOutput: {
    title: string;
    imageAvailable: boolean;
    route: string;
    lastChecked: string;
    nextPillowAction: string;
  };
  attributableCostUsd: number | null;
  stagesCompleted: CommissioningLifecycleStage[];
  createdAt: string;
  updatedAt: string;
  notes: string[];
};

export function ensureCommissioningTables(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS pillow_one_product_commissioning (
      workspace_id TEXT PRIMARY KEY,
      commissioning_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function readCommissioningRow(workspaceId: string): OneProductCommissioningRecord | null {
  ensureCommissioningTables();
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT record_json FROM pillow_one_product_commissioning WHERE workspace_id = @workspaceId`,
    )
    .get({ workspaceId }) as { record_json: string } | undefined;
  return row ? (JSON.parse(row.record_json) as OneProductCommissioningRecord) : null;
}

function persistCommissioningRecord(record: OneProductCommissioningRecord): void {
  ensureCommissioningTables();
  const db = getDatabase();
  db.prepare(
    `INSERT INTO pillow_one_product_commissioning (workspace_id, commissioning_id, record_json, updated_at)
     VALUES (@workspaceId, @commissioningId, @json, @updatedAt)
     ON CONFLICT(workspace_id) DO UPDATE SET
       commissioning_id = excluded.commissioning_id,
       record_json = excluded.record_json,
       updated_at = excluded.updated_at`,
  ).run({
    workspaceId: record.workspaceId,
    commissioningId: record.commissioningId,
    json: JSON.stringify(record),
    updatedAt: record.updatedAt,
  });
}

/**
 * Durability repair: if the commissioning row was wiped (e.g. Railway SQLite redeploy)
 * but flight evidence still points at Pillow's prior opportunityId, restore that exact
 * selection — do not re-rank (that would be a new selection).
 */
function recoverCommissioningFromFlight(
  workspaceId: string,
): OneProductCommissioningRecord | null {
  const events = listFlightEvents(workspaceId, { limit: 80 });
  for (const ev of events) {
    if (ev.authority !== "pillow") continue;
    if (ev.subsystem !== "one-product-commissioning") continue;
    const opportunityId = ev.entityRefs?.opportunityId;
    if (!opportunityId) continue;
    const repo = getPillowCommercePresaleRepository();
    const opp = repo.getOpportunityById(workspaceId, opportunityId);
    if (!opp) continue;
    const record = buildRecordFromOpportunity(workspaceId, opp, {
      commissioningId: ev.entityRefs.commissioningId,
      createdAt: ev.recordedAt,
      recovered: true,
    });
    persistCommissioningRecord(record);
    recordFlightEvent({
      workspaceId,
      eventType: "COMMISSIONING",
      businessArea: "commerce",
      subsystem: "one-product-commissioning",
      objective: "Recover commissioning after persistence wipe",
      decision: "RECOVERED_FROM_FLIGHT",
      authority: "pillow",
      result: `Restored Pillow selection ${record.productName}`,
      entityRefs: {
        asin: record.asin,
        opportunityId: record.opportunityId,
        commissioningId: record.commissioningId,
      },
      evidenceConsidered: ["flight-recorder", "production-opportunity"],
      nextAction: "Await Grand King decision — do not publish/spend",
    });
    return record;
  }
  return null;
}

export function getOneProductCommissioningRecord(
  workspaceId: string,
): OneProductCommissioningRecord | null {
  const existing = readCommissioningRow(workspaceId);
  if (existing) return existing;
  return recoverCommissioningFromFlight(workspaceId);
}

function rankPillowOpportunity(a: QualifiedOpportunity, b: QualifiedOpportunity): number {
  const profitA = parseFloat(String(a.recommendation.expectedProfit).replace(/[^0-9.-]/g, "")) || 0;
  const profitB = parseFloat(String(b.recommendation.expectedProfit).replace(/[^0-9.-]/g, "")) || 0;
  return profitB - profitA;
}

function stagesFromOpportunity(opp: QualifiedOpportunity): CommissioningLifecycleStage[] {
  const stages: CommissioningLifecycleStage[] = [
    "DISCOVERED",
    "SUPPLIER_VERIFIED",
    "STOCK_VERIFIED",
    "COST_VERIFIED",
    "SHIPPING_VERIFIED",
    "AMAZON_MATCHED",
    "RESTRICTIONS_CHECKED",
    "BRAND_IP_CHECKED",
    "COMPETITION_ANALYSED",
    "DELIVERY_ANALYSED",
    "FEES_CALCULATED",
    "ECONOMICS_CALCULATED",
    "RISK_REVIEWED",
    "PILLOW_RECOMMENDATION",
  ];
  if (opp.approvalStatus === "Pending" || opp.disposition.includes("APPROVAL")) {
    stages.push("AWAITING_GRAND_KING_DECISION");
  }
  return stages;
}

function buildRecordFromOpportunity(
  workspaceId: string,
  selected: QualifiedOpportunity,
  opts?: { commissioningId?: string; createdAt?: string; recovered?: boolean },
): OneProductCommissioningRecord {
  const stages = stagesFromOpportunity(selected);
  const now = new Date().toISOString();
  const d = selected.dossier;
  return {
    commissioningId: opts?.commissioningId || `opc_${selected.opportunityId.slice(0, 8)}`,
    workspaceId,
    selectionAuthority: "pillow",
    cursorSelected: false,
    opportunityId: selected.opportunityId,
    productName: selected.recommendation.productName,
    supplier: "CJdropshipping",
    marketplace: "Amazon US",
    asin: selected.mapping.asin,
    cjPid: selected.mapping.cjPid,
    amazonSellerSku: selected.mapping.amazonSellerSku,
    supplierCost:
      selected.mapping.supplierCostUsd.amountUsd != null
        ? `$${selected.mapping.supplierCostUsd.amountUsd}`
        : null,
    freight:
      selected.mapping.shippingUsd.amountUsd != null
        ? `$${selected.mapping.shippingUsd.amountUsd}`
        : null,
    deliveryPromise: d?.demandFulfilmentRisk.delivery.customerExpectation ?? null,
    offerPrice: selected.recommendation.proposedSellingPrice,
    competingOffers:
      d?.marketplaceCompetition.competingOfferCount != null
        ? String(d.marketplaceCompetition.competingOfferCount)
        : null,
    expectedProfit: selected.recommendation.expectedProfit,
    expectedMargin: selected.recommendation.expectedMargin,
    brandRoute: d?.eligibilityAndBrand.brandRoute ?? null,
    pillowRecommendation:
      d?.exposureAndAction.pillowRecommendation ?? selected.recommendation.pillowRecommendation,
    riskReasons: selected.risks ?? [],
    stage: stages[stages.length - 1] ?? "PILLOW_RECOMMENDATION",
    publicationAttempted: false,
    supplierSpendAttempted: false,
    buyable: "UNKNOWN",
    grandKingDecision:
      selected.approvalStatus === "Pending"
        ? "Pending"
        : selected.approvalStatus === "Approved"
          ? "Approved"
          : selected.approvalStatus === "Rejected"
            ? "Rejected"
            : "none",
    approvalId: selected.approvalId,
    visualAmazonOutput: {
      title: selected.recommendation.productName,
      imageAvailable: false,
      route: `/cockpit/commerce/store`,
      lastChecked: now,
      nextPillowAction:
        selected.approvalStatus === "Pending"
          ? "Await Grand King approval — do not publish/spend"
          : "Continue monitoring and dossier freshness",
    },
    attributableCostUsd: null,
    stagesCompleted: stages,
    createdAt: opts?.createdAt ?? now,
    updatedAt: now,
    notes: [
      "Factory commissioning product — not the Commerce strategy.",
      "ACCEPTED ≠ BUYABLE; EXPECTED PROFIT ≠ REALISED PROFIT.",
      "Selection authority = Pillow from production opportunity space.",
      "Cursor did not select this product.",
      "Publication/spend remain gated.",
      ...(opts?.recovered
        ? ["Recovered from flight-recorder evidence after commissioning-row wipe — not a new Cursor selection."]
        : []),
    ],
  };
}

/**
 * Pillow selects the commissioning product from persisted production opportunities
 * created by autonomous/presale cycles — never from Cursor hardcoding.
 */
export function runPillowOneProductCommissioning(workspaceId: string): {
  ok: boolean;
  record: OneProductCommissioningRecord | null;
  error?: string;
} {
  const paid = assertPaidAutonomousAllowed(workspaceId, 0.01);
  if (!paid.allowed) {
    return {
      ok: false,
      record: getOneProductCommissioningRecord(workspaceId),
      error: `Cost Guard blocked commissioning: ${paid.reason}`,
    };
  }

  const existing = getOneProductCommissioningRecord(workspaceId);
  if (existing) {
    return { ok: true, record: existing };
  }

  const repo = getPillowCommercePresaleRepository();
  const recent = repo.listRecentOpportunities(workspaceId, 24);
  const pending = repo.getPendingApprovalOpportunity(workspaceId);
  const latest = repo.getLatestOpportunity(workspaceId);
  const byId = new Map<string, QualifiedOpportunity>();
  for (const c of [...recent, pending, latest].filter(Boolean) as QualifiedOpportunity[]) {
    byId.set(c.opportunityId, c);
  }
  // Prefer approval-ready / awaiting-approval SMART corridor candidates.
  const candidates = [...byId.values()].filter((c) =>
    ["APPROVAL_READY", "AWAITING_APPROVAL", "APPROVED_PENDING_PUBLISH", "QUALIFIED"].includes(
      c.disposition,
    ),
  );
  if (candidates.length === 0) {
    recordFlightEvent({
      workspaceId,
      eventType: "COMMISSIONING",
      businessArea: "commerce",
      subsystem: "one-product-commissioning",
      objective: "Pillow one-product commissioning",
      decision: "NO_CANDIDATE",
      authority: "pillow",
      result: "No production SMART viable opportunity available for commissioning",
      nextAction: "Continue autonomous discovery cycles",
      evidenceConsidered: [],
    });
    return {
      ok: false,
      record: null,
      error:
        "No Pillow-originated production opportunity available yet — continue SMART discovery; Cursor must not preselect",
    };
  }

  candidates.sort(rankPillowOpportunity);
  const selected = candidates[0]!;
  const stages = stagesFromOpportunity(selected);
  const record = buildRecordFromOpportunity(workspaceId, selected);
  persistCommissioningRecord(record);

  for (const stage of stages) {
    recordFlightEvent({
      workspaceId,
      eventType: stage === "PILLOW_RECOMMENDATION" ? "RECOMMEND" : "COMMISSIONING",
      businessArea: "commerce",
      subsystem: "one-product-commissioning",
      objective: `Commissioning stage ${stage}`,
      analysisSummary: `${record.productName} · ${stage}`,
      decision: stage,
      authority: "pillow",
      recommendation: record.pillowRecommendation,
      approvalDependency: record.approvalId,
      result: stage,
      entityRefs: {
        asin: record.asin,
        opportunityId: record.opportunityId,
        commissioningId: record.commissioningId,
      },
      evidenceConsidered: ["production-opportunity", "pillow-rank-by-expected-profit"],
      nextAction: record.visualAmazonOutput.nextPillowAction,
    });
  }

  return { ok: true, record };
}
