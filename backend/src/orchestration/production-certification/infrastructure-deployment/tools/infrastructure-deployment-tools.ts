/**
 * G6-03 — Infrastructure & deployment Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import { buildCockpitInfrastructureDeploymentView } from "../contracts/infrastructure-deployment-cockpit-contracts.js";
import {
  getInfrastructureDeploymentOverview,
  getLastInfrastructureDeploymentScan,
  runDeploymentHealthCheck,
  runInfrastructureDeploymentScan,
} from "../services/infrastructure-deployment-certification-service.js";
import { resolveInfrastructureDeploymentRules } from "../registry/infrastructure-deployment-registry-resolver.js";
import { resolveDeploymentSignals } from "../registry/deployment-signal-resolver.js";

export const infrastructureDeploymentTools: RegisteredTool[] = [
  {
    name: "deployment_overview",
    description: "G6-03 — Infrastructure & deployment certification overview",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getInfrastructureDeploymentOverview({ workspaceId });
      const scan = getLastInfrastructureDeploymentScan();
      return { overview, cockpitView: buildCockpitInfrastructureDeploymentView({ overview, scan }) };
    },
  },
  {
    name: "deployment_scan",
    description: "G6-03 — Run full infrastructure & deployment certification scan",
    module: "production-certification",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) =>
      runInfrastructureDeploymentScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "deployment_health",
    description: "G6-03 — Deployment health check",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) =>
      runDeploymentHealthCheck({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "deployment_readiness",
    description: "G6-03 — Deployment readiness summary",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runInfrastructureDeploymentScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { readinessSummary: scan.readinessSummary, status: scan.status };
    },
  },
  {
    name: "deployment_dependencies",
    description: "G6-03 — Deployment dependency signals from registry",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const rules = resolveInfrastructureDeploymentRules({ workspaceId });
      const signals = [...new Set(rules.flatMap((rule) => rule.readinessSignals))];
      return {
        dependencies: resolveDeploymentSignals(signals, { workspaceId }),
      };
    },
  },
  {
    name: "deployment_risk_register",
    description: "G6-03 — Deployment risk register",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runInfrastructureDeploymentScan({
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
    name: "deployment_status",
    description: "G6-03 — Latest deployment certification status",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getInfrastructureDeploymentOverview({ workspaceId });
      const scan = getLastInfrastructureDeploymentScan();
      return {
        overview,
        lastScan: scan
          ? { scanId: scan.scanId, status: scan.status, score: scan.score, scannedAt: scan.scannedAt }
          : undefined,
        cockpitView: buildCockpitInfrastructureDeploymentView({ overview, scan }),
      };
    },
  },
];
