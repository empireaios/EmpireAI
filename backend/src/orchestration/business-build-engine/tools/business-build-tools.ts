import type { RegisteredTool } from "../../../brain/types.js";
import {
  buildBusinessBuildDashboard,
  buildBusinessBuildSummary,
  getBusinessBuildPackage,
  getBusinessBuildStatus,
  startBusinessBuild,
  validateBusinessBuild,
} from "../services/business-build-engine-service.js";

export const businessBuildEngineTools: RegisteredTool[] = [
  {
    name: "business_build.start",
    description: "Start business build from approved preview + strategy — construction only, no publishing",
    module: "business-build-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        businessOpportunityId: { type: "string" },
        actor: { type: "string" },
      },
      required: ["businessOpportunityId"],
    },
    handler: async (args) =>
      startBusinessBuild(
        String(args.businessOpportunityId),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "business_build.status",
    description: "Get business build status and progress",
    module: "business-build-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { buildId: { type: "string" } },
      required: ["buildId"],
    },
    handler: async (args) => getBusinessBuildStatus(String(args.buildId)),
  },
  {
    name: "business_build.package",
    description: "Get complete business build package with all assets — no publication",
    module: "business-build-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { buildId: { type: "string" } },
      required: ["buildId"],
    },
    handler: async (args) => getBusinessBuildPackage(String(args.buildId)),
  },
  {
    name: "business_build.validate",
    description: "Validate build package completeness and publication readiness — no execution",
    module: "business-build-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { buildId: { type: "string" } },
      required: ["buildId"],
    },
    handler: async (args) => validateBusinessBuild(String(args.buildId)),
  },
  {
    name: "business_build.summary",
    description: "Workspace summary of business builds and publication readiness",
    module: "business-build-engine",
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
      buildBusinessBuildSummary(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
];

export { buildBusinessBuildDashboard };
