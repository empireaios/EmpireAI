import type { RegisteredTool } from "../../brain/types.js";
import { activity, companies } from "../../domain/services/module-views.js";

export const domainTools: RegisteredTool[] = [
  {
    name: "company.create",
    description: "Create a new company in building status with default build pipeline",
    module: "store",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        name: { type: "string" },
        category: { type: "string" },
      },
      required: ["workspaceId", "name", "category"],
    },
    handler: async (args, context) => {
      const company = companies.create({
        workspaceId: String(args.workspaceId ?? context.workspaceId),
        name: String(args.name),
        category: String(args.category),
        status: "building",
      });

      activity.record({
        workspaceId: company.workspaceId,
        agentName: "Casey",
        action: `Started manufacturing pipeline for ${company.name}`,
        module: "store",
        outcome: "Build pipeline initialized",
      });

      return {
        companyId: company.id,
        name: company.name,
        category: company.category,
        status: company.status,
        buildStages: companies.getBuildStages(company.id),
      };
    },
  },
];
