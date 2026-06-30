import type { RegisteredTool } from "../../../brain/types.js";
import { buildMasterCompletionLedger } from "../services/master-completion-ledger-service.js";
import { buildBusinessCompletionLedger } from "../services/business-completion-ledger-service.js";
import { buildRevenueMissionLedger } from "../services/revenue-mission-ledger-service.js";
import { buildOperationalAccessReport } from "../services/operational-access-report-service.js";

export const masterCompletionLedgerTools: RegisteredTool[] = [
  {
    name: "master_completion_ledger.dashboard",
    description: "Master Completion Ledger — all programs, completion %, blockers, USD 100K mission (MCL-001)",
    module: "master-completion-ledger",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args) =>
      buildMasterCompletionLedger(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
      ),
  },
  {
    name: "master_completion_ledger.revenue_mission",
    description: "Revenue Mission Ledger — SUCCESS-001 USD 100K net profit tracking",
    module: "master-completion-ledger",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args) =>
      buildRevenueMissionLedger(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
      ),
  },
  {
    name: "master_completion_ledger.business",
    description: "Business Completion Ledger — launch readiness and pipeline products",
    module: "master-completion-ledger",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args) =>
      buildBusinessCompletionLedger(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
      ),
  },
  {
    name: "master_completion_ledger.operational_access_report",
    description: "Operational Access Report — EAR-001 summary for MCL-001",
    module: "master-completion-ledger",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) =>
      buildOperationalAccessReport(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
  },
];
