import type { RegisteredTool } from "../../../brain/types.js";
import {
  buildRealityActivationDashboard,
  evaluateRealityActivation,
  setEmergencyStop,
} from "../services/reality-activation-service.js";

export const realityActivationTools: RegisteredTool[] = [
  {
    name: "reality_activation.evaluate",
    description: "R002 — Evaluate reality activation decision",
    module: "reality-activation-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      evaluateRealityActivation({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
      }),
  },
  {
    name: "reality_activation.dashboard",
    description: "R002 — Reality activation dashboard",
    module: "reality-activation-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildRealityActivationDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "reality_activation.emergency_stop",
    description: "R002 — Activate or clear emergency stop",
    module: "reality-activation-engine",
    authorityLevel: "L3",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        active: { type: "boolean" },
      },
      required: ["companyId", "active"],
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      const companyId = String(args.companyId);
      setEmergencyStop(workspaceId, companyId, args.active === true);
      return { active: args.active === true };
    },
  },
];
