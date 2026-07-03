/**
 * G6-04 — Operational readiness Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import { buildCockpitOperationalReadinessView } from "../contracts/operational-readiness-cockpit-contracts.js";
import {
  getLastOperationalReadinessScan,
  getOperationalReadinessOverview,
  runOperationalScan,
} from "../services/operational-readiness-certification-service.js";
import { resolveOperationalReadinessRules } from "../registry/operational-readiness-registry-resolver.js";
import { resolveOperationalSignals } from "../registry/operational-signal-resolver.js";

export const operationalReadinessTools: RegisteredTool[] = [
  {
    name: "operational_readiness",
    description: "G6-04 — Operational readiness certification overview",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getOperationalReadinessOverview({ workspaceId });
      const scan = getLastOperationalReadinessScan();
      return { overview, cockpitView: buildCockpitOperationalReadinessView({ overview, scan }) };
    },
  },
  {
    name: "operational_scan",
    description: "G6-04 — Run full operational readiness certification scan",
    module: "production-certification",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) =>
      runOperationalScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "operational_blockers",
    description: "G6-04 — Operational readiness blockers",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runOperationalScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { blockers: scan.blockers, warnings: scan.warnings, status: scan.status };
    },
  },
  {
    name: "operational_score",
    description: "G6-04 — Operational readiness score",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runOperationalScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { score: scan.score, status: scan.status };
    },
  },
  {
    name: "operational_dependencies",
    description: "G6-04 — Operational dependency signals from registry",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const rules = resolveOperationalReadinessRules({ workspaceId });
      const signals = [...new Set(rules.flatMap((rule) => rule.readinessSignals))];
      return { dependencies: resolveOperationalSignals(signals, { workspaceId }) };
    },
  },
  {
    name: "operational_recommendations",
    description: "G6-04 — Operational risk register and executive recommendations",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runOperationalScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return {
        riskRegister: scan.riskRegister,
        executiveRecommendations: scan.executiveRecommendations,
      };
    },
  },
  {
    name: "operational_status",
    description: "G6-04 — Latest operational readiness certification status",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getOperationalReadinessOverview({ workspaceId });
      const scan = getLastOperationalReadinessScan();
      return {
        overview,
        lastScan: scan
          ? { scanId: scan.scanId, status: scan.status, score: scan.score, scannedAt: scan.scannedAt }
          : undefined,
        cockpitView: buildCockpitOperationalReadinessView({ overview, scan }),
      };
    },
  },
];
