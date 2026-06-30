import type { RegisteredTool } from "../../brain/types.js";
import { runExecutiveSurveillance, listActiveSignals } from "../services/signal-engine-service.js";
import { listRegisteredWatchers, initializeWatcherRegistry } from "../services/watcher-registry-service.js";
import { getExecutiveSurveillanceRuntime } from "../services/executive-surveillance-runtime.js";
import { buildSurveillanceDashboard } from "../services/surveillance-dashboard-service.js";
import { buildExecutiveSurveillanceHeadquarters } from "../services/surveillance-headquarters-service.js";

export const executiveSurveillanceTools: RegisteredTool[] = [
  {
    name: "executive_surveillance.watchers",
    description: "List registered watchers (ESS-002)",
    module: "executive-surveillance",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      listRegisteredWatchers(args.workspaceId ? String(args.workspaceId) : "ws_empire_1", String(args.companyId)),
  },
  {
    name: "executive_surveillance.observe",
    description: "Run cross-module surveillance and emit signals (ESS-003/ESS-008)",
    module: "executive-surveillance",
    authorityLevel: "L2",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) => {
      const ws = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      const companyId = String(args.companyId);
      initializeWatcherRegistry(ws, companyId);
      return runExecutiveSurveillance(ws, companyId);
    },
  },
  {
    name: "executive_surveillance.signals",
    description: "List active surveillance signals",
    module: "executive-surveillance",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      listActiveSignals(args.workspaceId ? String(args.workspaceId) : "ws_empire_1", String(args.companyId)),
  },
  {
    name: "executive_surveillance.dashboard",
    description: "Surveillance dashboard (ESS-006)",
    module: "executive-surveillance",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      buildSurveillanceDashboard(args.workspaceId ? String(args.workspaceId) : "ws_empire_1", String(args.companyId)),
  },
  {
    name: "executive_surveillance.headquarters",
    description: "Executive Surveillance Headquarters (ESS-010)",
    module: "executive-surveillance",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      buildExecutiveSurveillanceHeadquarters(args.workspaceId ? String(args.workspaceId) : "ws_empire_1", String(args.companyId)),
  },
  {
    name: "executive_surveillance.runtime",
    description: "Executive Surveillance runtime status (ESS-001)",
    module: "executive-surveillance",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      getExecutiveSurveillanceRuntime(args.workspaceId ? String(args.workspaceId) : "ws_empire_1", String(args.companyId)),
  },
];
