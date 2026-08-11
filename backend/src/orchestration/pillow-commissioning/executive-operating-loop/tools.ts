import type { RegisteredTool } from "../../../brain/types.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { evaluateExecutiveBirthReadiness } from "./birth-readiness.js";
import { runPillowCapabilityTests } from "./capability-harness.js";
import { runExecutiveOperatingCycle } from "./cycle-runner.js";
import { buildLiveCommercialSituation } from "./live-situation.js";
import { getLatestExecutiveCycle, listExecutiveCycles, listOutcomes } from "./store.js";

export const pillowExecutiveOperatingLoopTools: RegisteredTool[] = [
  {
    name: "pillow_executive.run_operating_cycle",
    description:
      "Run one Pillow continuous executive operating cycle (observe→diagnose→critique→alternatives→investigate→compare→decide→act/escalate→monitor→learn→continue). Tier-0/1 by default; no publish/spend.",
    module: "pillow-executive-operating-loop",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: [],
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID;
      const situation = buildLiveCommercialSituation(workspaceId);
      return runExecutiveOperatingCycle({
        workspaceId,
        situation,
        mode: "live",
        persist: true,
        recordFlight: true,
      });
    },
  },
  {
    name: "pillow_executive.latest_cycle",
    description: "Return latest Pillow executive operating cycle and open outcomes",
    module: "pillow-executive-operating-loop",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: [],
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID;
      return {
        latest: getLatestExecutiveCycle(workspaceId),
        recent: listExecutiveCycles(workspaceId, 5),
        outcomes: listOutcomes(workspaceId, 20),
      };
    },
  },
  {
    name: "pillow_executive.run_capability_tests",
    description:
      "Run safe sandbox Pillow Capability Tests A–H. Does not publish, spend, or authorise Birth.",
    module: "pillow-executive-operating-loop",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: [],
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId
        ? String(args.workspaceId)
        : `${GRAND_KING_WORKSPACE_ID}:capability-sandbox`;
      return runPillowCapabilityTests(workspaceId);
    },
  },
  {
    name: "pillow_executive.birth_readiness",
    description:
      "Return executive birth-readiness truth table. Does not authorise Birth or set birth timestamp.",
    module: "pillow-executive-operating-loop",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: [],
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : GRAND_KING_WORKSPACE_ID;
      return evaluateExecutiveBirthReadiness(workspaceId);
    },
  },
];
