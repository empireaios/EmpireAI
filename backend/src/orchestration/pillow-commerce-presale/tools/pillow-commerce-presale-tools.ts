import type { RegisteredTool } from "../../../brain/types.js";
import { GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { getPresaleApprovalGate } from "../approval-bridge.js";
import { getPillowCommercePresaleRepository } from "../repository/sqlite-pillow-commerce-presale-repository.js";
import {
  applyOwnerDecisionToOpportunity,
  runPillowCommercePresaleCycle,
} from "../services/presale-cycle-service.js";

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
];
