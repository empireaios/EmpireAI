/**
 * G6-01 — Platform integrity Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import { buildCockpitPlatformIntegrityView } from "../contracts/platform-integrity-cockpit-contracts.js";
import {
  getLastPlatformIntegrityScan,
  getPlatformIntegrityOverview,
  runPlatformIntegrityScan,
} from "../services/platform-integrity-certification-service.js";

export const platformIntegrityTools: RegisteredTool[] = [
  {
    name: "platform_integrity_overview",
    description: "G6-01 — Platform integrity certification overview",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getPlatformIntegrityOverview({ workspaceId });
      const scan = getLastPlatformIntegrityScan();
      return { overview, cockpitView: buildCockpitPlatformIntegrityView({ overview, scan }) };
    },
  },
  {
    name: "platform_integrity_scan",
    description: "G6-01 — Run full platform integrity certification scan",
    module: "production-certification",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
      },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) =>
      runPlatformIntegrityScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "ownership_matrix",
    description: "G6-01 — Platform ownership matrix from registry-driven rules",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
      },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runPlatformIntegrityScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { ownershipMatrix: scan.ownershipMatrix, duplicateOwnershipFindings: scan.duplicateOwnershipFindings };
    },
  },
  {
    name: "dependency_matrix",
    description: "G6-01 — Platform dependency matrix from registry-driven rules",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
      },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runPlatformIntegrityScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return {
        dependencyMatrix: scan.dependencyMatrix,
        circularDependencyFindings: scan.circularDependencyFindings,
      };
    },
  },
  {
    name: "architecture_drift_report",
    description: "G6-01 — Architectural drift findings report",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
      },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runPlatformIntegrityScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { driftFindings: scan.driftFindings, status: scan.status };
    },
  },
  {
    name: "platform_integrity_status",
    description: "G6-01 — Latest platform integrity certification status",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getPlatformIntegrityOverview({ workspaceId });
      const scan = getLastPlatformIntegrityScan();
      return {
        overview,
        lastScan: scan
          ? { scanId: scan.scanId, status: scan.status, score: scan.score, scannedAt: scan.scannedAt }
          : undefined,
        cockpitView: buildCockpitPlatformIntegrityView({ overview, scan }),
      };
    },
  },
];
