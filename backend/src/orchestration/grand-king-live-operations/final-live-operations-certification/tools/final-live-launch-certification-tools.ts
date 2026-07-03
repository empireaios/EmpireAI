/**
 * G7-10 — Final live launch Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import { buildCockpitVersion1LaunchView } from "../contracts/final-live-launch-cockpit-contracts.js";
import {
  getFinalLiveOperationsCertificationOverview,
  getGrandKingLaunchReadinessSummary,
  getLastFinalLiveOperationsCertificationRun,
  getLaunchBlockers,
  getLaunchConditions,
  getLaunchRiskRegister,
  getLiveLaunchStatus,
  getLiveOperationHealth,
  getLiveOperationsCompletionSummary,
  getVersion1LaunchSummary,
  runLiveLaunchCertification,
} from "../services/final-live-operations-certification-service.js";

export const finalLiveLaunchCertificationTools: RegisteredTool[] = [
  {
    name: "live_launch_status",
    description: "G7-10 — Version 1 launch status and Cockpit view",
    module: "grand-king-live-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws_empire_1");
      const overview = getFinalLiveOperationsCertificationOverview({ workspaceId });
      const run = getLastFinalLiveOperationsCertificationRun();
      const status = getLiveLaunchStatus({ workspaceId });
      return {
        status,
        overview,
        cockpitView: buildCockpitVersion1LaunchView({
          overview,
          run,
          executiveSummary: getVersion1LaunchSummary({ workspaceId }),
        }),
      };
    },
  },
  {
    name: "run_live_launch_certification",
    description: "G7-10 — Run Grand King live launch certification",
    module: "grand-king-live-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" }, ownerId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) =>
      runLiveLaunchCertification({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "grand_king_launch_readiness",
    description: "G7-10 — Grand King launch readiness summary",
    module: "grand-king-live-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ readiness: getGrandKingLaunchReadinessSummary() }),
  },
  {
    name: "live_operation_health",
    description: "G7-10 — Live operation health summary",
    module: "grand-king-live-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => getLiveOperationHealth({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
  },
  {
    name: "launch_blockers",
    description: "G7-10 — Version 1 launch blockers",
    module: "grand-king-live-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ blockers: getLaunchBlockers() }),
  },
  {
    name: "launch_conditions",
    description: "G7-10 — Version 1 launch conditions",
    module: "grand-king-live-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ conditions: getLaunchConditions() }),
  },
  {
    name: "launch_risk_register",
    description: "G7-10 — Operational risk register for launch",
    module: "grand-king-live-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ risks: getLaunchRiskRegister() }),
  },
  {
    name: "version1_launch_summary",
    description: "G7-10 — Version 1 launch executive summary",
    module: "grand-king-live-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => ({
      summary: getVersion1LaunchSummary({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
      completionSummary: getLiveOperationsCompletionSummary({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
    }),
  },
];
