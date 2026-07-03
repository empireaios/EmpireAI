/**
 * G6-06 — Performance certification Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import { buildCockpitPerformanceView } from "../contracts/performance-cockpit-contracts.js";
import {
  getLastPerformanceScan,
  getPerformanceOverview,
  runPerformanceScan,
} from "../services/performance-certification-service.js";

export const performanceCertificationTools: RegisteredTool[] = [
  {
    name: "performance_overview",
    description: "G6-06 — Performance, scalability & resilience overview",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getPerformanceOverview({ workspaceId });
      const scan = getLastPerformanceScan();
      return { overview, cockpitView: buildCockpitPerformanceView({ overview, scan }) };
    },
  },
  {
    name: "performance_scan",
    description: "G6-06 — Run full performance certification scan",
    module: "production-certification",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) =>
      runPerformanceScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "performance_score",
    description: "G6-06 — Executive performance score",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runPerformanceScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return {
        performanceScore: scan.performanceScore,
        status: scan.status,
        scalabilityStatus: scan.scalabilityStatus,
        resilienceStatus: scan.resilienceStatus,
      };
    },
  },
  {
    name: "performance_bottlenecks",
    description: "G6-06 — Performance bottlenecks",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runPerformanceScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { bottlenecks: scan.bottlenecks, warnings: scan.warnings, status: scan.status };
    },
  },
  {
    name: "performance_trends",
    description: "G6-06 — Performance trends from registry benchmarks",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runPerformanceScan({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      });
      return { trends: scan.trends, benchmarks: scan.benchmarks };
    },
  },
  {
    name: "performance_recommendations",
    description: "G6-06 — Performance executive recommendations",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) => {
      const scan = runPerformanceScan({
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
    name: "performance_status",
    description: "G6-06 — Latest performance certification status",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getPerformanceOverview({ workspaceId });
      const scan = getLastPerformanceScan();
      return {
        overview,
        lastScan: scan
          ? { scanId: scan.scanId, status: scan.status, performanceScore: scan.performanceScore, scannedAt: scan.scannedAt }
          : undefined,
        cockpitView: buildCockpitPerformanceView({ overview, scan }),
      };
    },
  },
];
