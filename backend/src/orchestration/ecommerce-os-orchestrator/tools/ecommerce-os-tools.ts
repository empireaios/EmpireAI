import type { RegisteredTool } from "../../../brain/types.js";
import {
  listMarketplaceConnections,
  getMarketplaceConnection,
  startMarketplaceConnection,
  getMarketplaceConnectionGuide,
} from "../../marketplace-infrastructure-engine/index.js";
import type { MarketplaceId } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import {
  approveLaunchProducts,
  getGrandKingsLaunchDashboard,
  getLaunchReadiness,
  getLaunchWorkflow,
  listLaunchWorkflows,
  prepareGrandKingsLaunch,
  runGrandKingsResearchPhase,
  startGrandKingsLaunchWorkflow,
} from "../services/ecommerce-os-orchestrator-service.js";

export const ecommerceOsTools: RegisteredTool[] = [
  {
    name: "ecommerce_os.get_dashboard",
    description: "Get unified Grand King's Account launch dashboard status",
    module: "ecommerce-os-orchestrator",
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
      getGrandKingsLaunchDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "ecommerce_os.start_workflow",
    description: "Start Grand King launch workflow — choose brand and category",
    module: "ecommerce-os-orchestrator",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        brandChoice: { type: "string" },
        category: { type: "string" },
        actor: { type: "string" },
      },
      required: ["companyId", "brandChoice", "category"],
    },
    handler: async (args) =>
      startGrandKingsLaunchWorkflow({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        brandChoice: String(args.brandChoice),
        category: String(args.category),
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "ecommerce_os.research",
    description: "EA researches product opportunities and ranks recommendations",
    module: "ecommerce-os-orchestrator",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workflowId: { type: "string" } },
      required: ["workflowId"],
    },
    handler: async (args) => runGrandKingsResearchPhase(String(args.workflowId)),
  },
  {
    name: "ecommerce_os.approve_products",
    description: "Grand King approves ranked product recommendations",
    module: "ecommerce-os-orchestrator",
    authorityLevel: "L3",
    parameters: {
      type: "object",
      properties: {
        workflowId: { type: "string" },
        productIds: { type: "array", items: { type: "string" } },
        actor: { type: "string" },
      },
      required: ["workflowId", "productIds"],
    },
    handler: async (args) =>
      approveLaunchProducts({
        workflowId: String(args.workflowId),
        productIds: args.productIds as string[],
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "ecommerce_os.prepare_launch",
    description: "EA prepares brand assets, listings, creative, SEO, and supplier connection",
    module: "ecommerce-os-orchestrator",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workflowId: { type: "string" } },
      required: ["workflowId"],
    },
    handler: async (args) => prepareGrandKingsLaunch(String(args.workflowId)),
  },
  {
    name: "ecommerce_os.get_readiness",
    description: "Get READY TO LAUNCH status and blockers",
    module: "ecommerce-os-orchestrator",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workflowId: { type: "string" } },
      required: ["workflowId"],
    },
    handler: async (args) => getLaunchReadiness(String(args.workflowId)),
  },
  {
    name: "ecommerce_os.get_workflow",
    description: "Get launch workflow by ID",
    module: "ecommerce-os-orchestrator",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workflowId: { type: "string" } },
      required: ["workflowId"],
    },
    handler: async (args) => getLaunchWorkflow(String(args.workflowId)),
  },
  {
    name: "ecommerce_os.list_workflows",
    description: "List launch workflows for workspace",
    module: "ecommerce-os-orchestrator",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
    },
    handler: async (args) => ({
      workflows: listLaunchWorkflows(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : undefined,
      ),
    }),
  },
  {
    name: "marketplace_infrastructure.list",
    description: "List marketplace connection status for all supported marketplaces",
    module: "marketplace-infrastructure-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => ({
      connections: listMarketplaceConnections(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
      ),
    }),
  },
  {
    name: "marketplace_infrastructure.get",
    description: "Get marketplace connection status and human setup guide",
    module: "marketplace-infrastructure-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        marketplaceId: { type: "string" },
      },
      required: ["marketplaceId"],
    },
    handler: async (args) => ({
      connection: getMarketplaceConnection(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.marketplaceId as MarketplaceId,
      ),
      guide: getMarketplaceConnectionGuide(args.marketplaceId as MarketplaceId),
    }),
  },
  {
    name: "marketplace_infrastructure.start_connect",
    description: "Start marketplace OAuth connection flow — EA never stores passwords",
    module: "marketplace-infrastructure-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        marketplaceId: { type: "string" },
        actor: { type: "string" },
      },
      required: ["marketplaceId"],
    },
    handler: async (args) =>
      startMarketplaceConnection(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.marketplaceId as MarketplaceId,
        args.actor ? String(args.actor) : "system",
      ),
  },
];
