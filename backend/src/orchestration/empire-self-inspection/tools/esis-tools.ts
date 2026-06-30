import type { RegisteredTool } from "../../../brain/types.js";
import { buildEsisDashboard } from "../services/esis-dashboard-service.js";
import { generateReviewPackageOnly, runEsisInspection } from "../services/esis-engine.js";

export const esisTools: RegisteredTool[] = [
  {
    name: "empire_inspection.dashboard",
    description: "ESIS — Mission Control system health dashboard",
    module: "empire-self-inspection",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildEsisDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "empire_inspection.run",
    description: "ESIS — Run full self-inspection scan",
    module: "empire-self-inspection",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        runValidation: { type: "boolean" },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      runEsisInspection({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        runValidation: args.runValidation === true,
        writePackage: false,
      }),
  },
  {
    name: "empire_inspection.generate_review",
    description: "ESIS — Generate EMPIRE_REVIEW_PACKAGE.md review package",
    module: "empire-self-inspection",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        runValidation: { type: "boolean" },
        skipSlowTests: { type: "boolean" },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      generateReviewPackageOnly({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        runValidation: args.runValidation === true,
        skipSlowTests: args.skipSlowTests !== false,
      }),
  },
];
