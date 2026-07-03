/**
 * G6-10 — Final production readiness Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import { buildCockpitFinalProductionReadinessView } from "../contracts/final-readiness-cockpit-contracts.js";
import {
  getCertificationCompletionSummary,
  getFinalProductionReadinessOverview,
  getGrandKingReadinessSummary,
  getLastFinalProductionReadinessRun,
  getProductionBlockers,
  getProductionConditions,
  getProductionEligibilitySummary,
  getProductionRiskRegister,
  runFinalProductionReadinessCertification,
} from "../services/final-production-readiness-service.js";

export const finalProductionReadinessTools: RegisteredTool[] = [
  {
    name: "final_production_readiness",
    description: "G6-10 — Final production readiness overview and Cockpit view",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getFinalProductionReadinessOverview({ workspaceId });
      const run = getLastFinalProductionReadinessRun();
      return { overview, cockpitView: buildCockpitFinalProductionReadinessView({ overview, run }) };
    },
  },
  {
    name: "run_final_certification",
    description: "G6-10 — Run final G6 production readiness certification",
    module: "production-certification",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, actorId: { type: "string" } },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args) =>
      runFinalProductionReadinessCertification({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        pillowGovernance: true,
      }),
  },
  {
    name: "production_eligibility",
    description: "G6-10 — Production eligibility status",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) =>
      getProductionEligibilitySummary({ workspaceId: String(args.workspaceId ?? "ws-foundation") }),
  },
  {
    name: "production_blockers",
    description: "G6-10 — Production certification blockers",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ blockers: getProductionBlockers() }),
  },
  {
    name: "production_conditions",
    description: "G6-10 — Production certification conditions",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ conditions: getProductionConditions() }),
  },
  {
    name: "production_risk_register",
    description: "G6-10 — G6 production risk register",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ risks: getProductionRiskRegister() }),
  },
  {
    name: "grand_king_readiness",
    description: "G6-10 — Grand King readiness for G7 live operations",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => getGrandKingReadinessSummary(),
  },
  {
    name: "certification_completion_summary",
    description: "G6-10 — G6 programme completion summary",
    module: "production-certification",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => ({
      summary: getCertificationCompletionSummary({ workspaceId: String(args.workspaceId ?? "ws-foundation") }),
    }),
  },
];
