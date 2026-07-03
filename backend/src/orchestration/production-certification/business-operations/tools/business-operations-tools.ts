/**
 * G6-05 — Business operations Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import { buildCockpitBusinessOperationsView } from "../contracts/business-operations-cockpit-contracts.js";
import {
  getBusinessOperationsOverview,
  getLastBusinessOperationsScan,
  runBusinessOperationsScan,
} from "../services/business-operations-certification-service.js";
import { resolveBusinessOperationsRules } from "../registry/business-operations-registry-resolver.js";
import { resolveBusinessSignals } from "../registry/business-signal-resolver.js";

export const businessOperationsTools: RegisteredTool[] = [
  {
    name: "business_operations_overview",
    description: "G6-05 — Business operations certification overview",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getBusinessOperationsOverview({ workspaceId });
      const scan = getLastBusinessOperationsScan();
      return { overview, cockpitView: buildCockpitBusinessOperationsView({ overview, scan }) };
    },
  },
  {
    name: "business_operations_scan",
    description: "G6-05 — Run full business operations certification scan",
    module: "production-certification",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) =>
      runBusinessOperationsScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "business_operations_score",
    description: "G6-05 — Executive business operations score",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runBusinessOperationsScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { executiveScore: scan.executiveScore, status: scan.status, commerceHealth: scan.commerceHealth };
    },
  },
  {
    name: "business_operations_dependencies",
    description: "G6-05 — Business dependency signals from registry",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const rules = resolveBusinessOperationsRules({ workspaceId });
      const signals = [...new Set(rules.flatMap((rule) => rule.businessSignals))];
      return { dependencies: resolveBusinessSignals(signals, { workspaceId }) };
    },
  },
  {
    name: "business_operations_risks",
    description: "G6-05 — Business risk register",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runBusinessOperationsScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { riskRegister: scan.riskRegister, failures: scan.failures, warnings: scan.warnings };
    },
  },
  {
    name: "business_operations_recommendations",
    description: "G6-05 — Executive business recommendations",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runBusinessOperationsScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { executiveRecommendations: scan.executiveRecommendations, status: scan.status };
    },
  },
  {
    name: "business_operations_status",
    description: "G6-05 — Latest business operations certification status",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getBusinessOperationsOverview({ workspaceId });
      const scan = getLastBusinessOperationsScan();
      return {
        overview,
        lastScan: scan
          ? { scanId: scan.scanId, status: scan.status, executiveScore: scan.executiveScore, scannedAt: scan.scannedAt }
          : undefined,
        cockpitView: buildCockpitBusinessOperationsView({ overview, scan }),
      };
    },
  },
];
