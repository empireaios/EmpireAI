/**
 * G6-07 — Executive operations certification Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import { buildCockpitExecutiveOperationsView } from "../contracts/executive-operations-cockpit-contracts.js";
import {
  getExecutiveOperationsOverview,
  getLastExecutiveOperationsScan,
  runExecutiveOperationsScan,
} from "../services/executive-operations-certification-service.js";

export const executiveOperationsTools: RegisteredTool[] = [
  {
    name: "executive_operations_overview",
    description: "G6-07 — Executive operations certification overview",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getExecutiveOperationsOverview({ workspaceId });
      const scan = getLastExecutiveOperationsScan();
      return { overview, cockpitView: buildCockpitExecutiveOperationsView({ overview, scan }) };
    },
  },
  {
    name: "executive_operations_scan",
    description: "G6-07 — Run full executive operations certification scan",
    module: "production-certification",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) =>
      runExecutiveOperationsScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "executive_operations_score",
    description: "G6-07 — Executive operations score",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runExecutiveOperationsScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return {
        executiveScore: scan.executiveScore,
        status: scan.status,
        cockpitHealth: scan.cockpitHealth,
        actionSafety: scan.actionSafety,
      };
    },
  },
  {
    name: "executive_operations_blockers",
    description: "G6-07 — Executive operations blockers",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runExecutiveOperationsScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { blockers: scan.blockers, warnings: scan.warnings, status: scan.status };
    },
  },
  {
    name: "executive_operations_risks",
    description: "G6-07 — Executive operations risk register",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runExecutiveOperationsScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { riskRegister: scan.riskRegister, visibility: scan.visibility };
    },
  },
  {
    name: "executive_operations_recommendations",
    description: "G6-07 — Executive operations recommendations",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runExecutiveOperationsScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return {
        executiveRecommendations: scan.executiveRecommendations,
        riskRegister: scan.riskRegister,
      };
    },
  },
  {
    name: "executive_operations_status",
    description: "G6-07 — Latest executive operations certification status",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getExecutiveOperationsOverview({ workspaceId });
      const scan = getLastExecutiveOperationsScan();
      return {
        overview,
        lastScan: scan
          ? { scanId: scan.scanId, status: scan.status, executiveScore: scan.executiveScore, scannedAt: scan.scannedAt }
          : undefined,
        cockpitView: buildCockpitExecutiveOperationsView({ overview, scan }),
      };
    },
  },
];
