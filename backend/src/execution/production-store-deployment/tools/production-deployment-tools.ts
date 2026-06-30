import type { RegisteredTool } from "../../../brain/types.js";
import { loadProductionDeploymentEnv } from "../config/production-deployment-env.js";
import {
  applyDeploymentApproval,
  executeProductionDeployment,
  getDeploymentLogs,
  prepareProductionDeployment,
  ProductionDeploymentBlockedError,
  rollbackProductionDeployment,
} from "../services/production-deploy-service.js";
import { getProductionDeploymentRepository } from "../repositories/sqlite-production-deployment-repository.js";

export const productionDeploymentTools: RegisteredTool[] = [
  {
    name: "production_deploy.prepare",
    description: "Prepare Vercel production deployment — PENDING_APPROVAL until Grand King approves",
    module: "production-deploy",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        storeId: { type: "string" },
        brandId: { type: "string" },
        projectName: { type: "string" },
        sourcePath: { type: "string" },
        customDomain: { type: "string" },
        environmentVariables: { type: "object" },
      },
      required: ["workspaceId", "companyId", "storeId", "brandId", "projectName"],
    },
    handler: async (args) => {
      return prepareProductionDeployment({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        storeId: String(args.storeId),
        brandId: String(args.brandId),
        projectName: String(args.projectName),
        sourcePath: args.sourcePath ? String(args.sourcePath) : undefined,
        customDomain: args.customDomain ? String(args.customDomain) : null,
        environmentVariables:
          args.environmentVariables && typeof args.environmentVariables === "object"
            ? (args.environmentVariables as Record<string, string>)
            : undefined,
      });
    },
  },
  {
    name: "production_deploy.apply_approval",
    description: "Apply Grand King approval gate before production Vercel deployment",
    module: "production-deploy",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        deploymentId: { type: "string" },
        approvalToken: { type: "string" },
        approvedBy: { type: "string" },
        approvedAt: { type: "string" },
      },
      required: ["deploymentId", "approvalToken", "approvedBy", "approvedAt"],
    },
    handler: async (args) => {
      return applyDeploymentApproval({
        deploymentId: String(args.deploymentId),
        approvalToken: String(args.approvalToken),
        approvedBy: String(args.approvedBy),
        approvedAt: String(args.approvedAt),
      });
    },
  },
  {
    name: "production_deploy.execute_vercel",
    description: "Execute approved Vercel production deployment — env vars, SSL, custom domain",
    module: "production-deploy",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        deploymentId: { type: "string" },
      },
      required: ["deploymentId"],
    },
    handler: async (args) => {
      try {
        return await executeProductionDeployment(String(args.deploymentId));
      } catch (error) {
        if (error instanceof ProductionDeploymentBlockedError) {
          return {
            blocked: true,
            protectTheEmpire: true,
            message: error.message,
            productionDeploymentEnabled: loadProductionDeploymentEnv().PRODUCTION_DEPLOYMENT_ENABLED,
          };
        }
        throw error;
      }
    },
  },
  {
    name: "production_deploy.rollback",
    description: "Rollback to previous Vercel production deployment",
    module: "production-deploy",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        deploymentId: { type: "string" },
      },
      required: ["deploymentId"],
    },
    handler: async (args) => {
      return rollbackProductionDeployment(String(args.deploymentId));
    },
  },
  {
    name: "production_deploy.get_logs",
    description: "Get deployment logs for a production deployment",
    module: "production-deploy",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        deploymentId: { type: "string" },
      },
      required: ["deploymentId"],
    },
    handler: async (args) => {
      return { logs: getDeploymentLogs(String(args.deploymentId)) };
    },
  },
  {
    name: "production_deploy.list",
    description: "List production deployments for workspace",
    module: "production-deploy",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        storeId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args, context) => {
      const workspaceId = String(args.workspaceId ?? context.workspaceId);
      return {
        deployments: getProductionDeploymentRepository().listDeployments(
          workspaceId,
          args.storeId ? String(args.storeId) : undefined,
        ),
      };
    },
  },
];
