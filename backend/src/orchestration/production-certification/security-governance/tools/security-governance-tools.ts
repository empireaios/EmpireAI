/**
 * G6-02 — Security & governance Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import { buildCockpitSecurityGovernanceView } from "../contracts/security-governance-cockpit-contracts.js";
import {
  getLastSecurityGovernanceScan,
  getSecurityGovernanceOverview,
  runGovernanceScan,
  runSecurityGovernanceScan,
  runSecurityScan,
} from "../services/security-governance-certification-service.js";

export const securityGovernanceTools: RegisteredTool[] = [
  {
    name: "security_overview",
    description: "G6-02 — Security & governance certification overview",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getSecurityGovernanceOverview({ workspaceId });
      const scan = getLastSecurityGovernanceScan();
      return { overview, cockpitView: buildCockpitSecurityGovernanceView({ overview, scan }) };
    },
  },
  {
    name: "security_scan",
    description: "G6-02 — Run security certification scan",
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
      runSecurityScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "governance_scan",
    description: "G6-02 — Run governance certification scan",
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
      runGovernanceScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "workspace_security",
    description: "G6-02 — Workspace isolation security validation",
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
      const scan = runSecurityScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { workspaceViolations: scan.workspaceViolations, status: scan.status };
    },
  },
  {
    name: "plugin_security",
    description: "G6-02 — Plugin trust and security validation",
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
      const scan = runSecurityScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { pluginViolations: scan.pluginViolations, status: scan.status };
    },
  },
  {
    name: "security_risk_register",
    description: "G6-02 — Security risk register from latest scan",
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
      const scan = runSecurityGovernanceScan({
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
    name: "security_status",
    description: "G6-02 — Latest security & governance certification status",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getSecurityGovernanceOverview({ workspaceId });
      const scan = getLastSecurityGovernanceScan();
      return {
        overview,
        lastScan: scan
          ? { scanId: scan.scanId, status: scan.status, score: scan.score, scannedAt: scan.scannedAt, scanType: scan.scanType }
          : undefined,
        cockpitView: buildCockpitSecurityGovernanceView({ overview, scan }),
      };
    },
  },
];
