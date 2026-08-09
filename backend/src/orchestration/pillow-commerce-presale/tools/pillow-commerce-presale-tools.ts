import type { RegisteredTool } from "../../../brain/types.js";
import { GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { getPresaleApprovalGate } from "../approval-bridge.js";
import { buildCommerceOperatingLoopReadiness } from "../commerce-operating-loop.js";
import { getPillowCommercePresaleRepository } from "../repository/sqlite-pillow-commerce-presale-repository.js";
import {
  applyOwnerDecisionToOpportunity,
  runPillowCommercePresaleCycle,
} from "../services/presale-cycle-service.js";
import { explainPillowCommerce } from "../commerce-plain-language.js";
import { reevaluateCommerceOpportunity } from "../services/reevaluate-opportunity-service.js";

export const pillowCommercePresaleTools: RegisteredTool[] = [
  {
    name: "pillow_commerce.run_presale_cycle",
    description:
      "Autonomous first-dollar pre-sale cycle: discover CJ opportunities, reject unsuitable, check Amazon restrictions, live stock/cost/freight/fees, profit gate, map Amazon↔CJ, surface Grand King approval. Never publishes or spends.",
    module: "pillow-commerce-presale",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        maxCandidates: { type: "number" },
      },
      required: [],
    },
    handler: async (args) =>
      runPillowCommercePresaleCycle({
        workspaceId: args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID,
        companyId: args.companyId ? String(args.companyId) : GRAND_KING_COMPANY_ID,
        initiatedBy: "pillow-tool",
        maxCandidates: typeof args.maxCandidates === "number" ? args.maxCandidates : 8,
        approvalGate: getPresaleApprovalGate(),
      }),
  },
  {
    name: "pillow_commerce.latest_opportunity",
    description:
      "Return the latest Pillow pre-sale commerce opportunity / cycle for Grand King review",
    module: "pillow-commerce-presale",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: [],
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID;
      const repo = getPillowCommercePresaleRepository();
      return {
        latestCycle: repo.getLatestCycle(workspaceId),
        latestOpportunity: repo.getLatestOpportunity(workspaceId),
        pendingApproval: repo.getPendingApprovalOpportunity(workspaceId),
      };
    },
  },
  {
    name: "pillow_commerce.record_owner_decision",
    description:
      "Record Grand King approve/reject for a pre-sale opportunity. Does NOT publish or place supplier orders.",
    module: "pillow-commerce-presale",
    authorityLevel: "L3",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        opportunityId: { type: "string" },
        outcome: { type: "string", enum: ["Approved", "Rejected", "Cancelled"] },
      },
      required: ["opportunityId", "outcome"],
    },
    handler: async (args) => {
      const updated = applyOwnerDecisionToOpportunity({
        workspaceId: args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID,
        opportunityId: String(args.opportunityId),
        outcome: String(args.outcome) as "Approved" | "Rejected" | "Cancelled",
      });
      return {
        ok: Boolean(updated),
        opportunity: updated,
        publicationAttempted: false,
        supplierSpendAttempted: false,
      };
    },
  },
  {
    name: "pillow_commerce.reevaluate_opportunity",
    description:
      "Pillow re-evaluates a commerce opportunity under the complete Commercial Decision Dossier (FD-CDD-001). Surfaces APPROVE dossier or REJECTS and continues autonomous discovery path. Never publishes or spends.",
    module: "pillow-commerce-presale",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        asin: { type: "string" },
        cjPid: { type: "string" },
        amazonSellerSku: { type: "string" },
      },
      required: [],
    },
    handler: async (args) =>
      reevaluateCommerceOpportunity({
        workspaceId: args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID,
        companyId: args.companyId ? String(args.companyId) : GRAND_KING_COMPANY_ID,
        asin: args.asin ? String(args.asin) : undefined,
        cjPid: args.cjPid ? String(args.cjPid) : undefined,
        amazonSellerSku: args.amazonSellerSku ? String(args.amazonSellerSku) : undefined,
        approvalGate: getPresaleApprovalGate(),
      }),
  },
  {
    name: "pillow_commerce.operating_loop_readiness",
    description:
      "Return first-dollar complete commerce operating-loop readiness (Amazon→CJ bridge, BUYABLE, shipment confirm, actual P&L). Marks order-dependent stages READY — AWAITING FIRST REAL ORDER.",
    module: "pillow-commerce-presale",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {}, required: [] },
    handler: async () => buildCommerceOperatingLoopReadiness(),
  },
  {
    name: "pillow_commerce.explain",
    description:
      "Plain-language Grand King Commerce Q&A from canonical live truth (price, delivery, Featured Offer, actual vs expected profit, fulfilment route). UNKNOWN stays UNKNOWN.",
    module: "pillow-commerce-presale",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: [],
    },
    handler: async (args) =>
      explainPillowCommerce(
        args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID,
      ),
  },
];
